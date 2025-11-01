/* eslint-disable */
'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSession } from 'next-auth/react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import api from '@/lib/axios';

// ---- shadcn UI import (adjust path if yours is different) ----
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/* =========================================================================================
 * Internal, promise-based global Confirm Modal (shadcn AlertDialog) — no extra components
 * required in your app. The hook file mounts a hidden portal on first use.
 * =======================================================================================*/

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmRequest = {
  resolve: (v: boolean) => void;
  options: Required<ConfirmOptions> & { open: boolean };
};

const DEFAULT_OPTIONS: Required<ConfirmOptions> = {
  title: 'Delete item',
  description: 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
};

let __confirmRootMounted = false;
let __confirmEnqueue: ((req: ConfirmRequest) => void) | null = null;

/** Ensure we have a portal root with a ConfirmHost mounted exactly once */
function ensureConfirmHost() {
  if (typeof window === 'undefined' || __confirmRootMounted) return;
  const id = 'global-confirm-host';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
  const root = createRoot(el);
  root.render(<ConfirmHost />);
  __confirmRootMounted = true;
}

/** Imperative API used by the hook */
function confirmWithModal(options?: ConfirmOptions): Promise<boolean> {
  ensureConfirmHost();
  return new Promise<boolean>((resolve) => {
    const req: ConfirmRequest = {
      resolve,
      options: {
        ...DEFAULT_OPTIONS,
        ...(options ?? {}),
        open: true,
      },
    };
    // If host not ready yet, enqueue after a microtask
    const enqueue = () => __confirmEnqueue?.(req);
    if (!__confirmEnqueue) {
      // tiny retry loop until host registers
      let tries = 0;
      const t = setInterval(() => {
        if (__confirmEnqueue || tries++ > 50) {
          clearInterval(t);
          enqueue();
        }
      }, 10);
    } else {
      enqueue();
    }
  });
}

/** The actual UI host that lives in a portal and consumes requests */
function ConfirmHost() {
  const queueRef = useRef<ConfirmRequest[]>([]);
  const [current, setCurrent] = useState<ConfirmRequest | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    __confirmEnqueue = (req: ConfirmRequest) => {
      queueRef.current.push(req);
      if (!current) {
        setCurrent(queueRef.current.shift() || null);
      }
    };
    return () => {
      __confirmEnqueue = null;
    };
     
  }, []);

  useEffect(() => {
    if (current?.options.open) {
      setOpen(true);
    }
  }, [current]);

  const closeAndResolve = (value: boolean) => {
    setOpen(false);
    if (current) current.resolve(value);
    setTimeout(() => {
      setCurrent(queueRef.current.shift() || null);
    }, 0);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && closeAndResolve(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{current?.options.title}</AlertDialogTitle>
          <AlertDialogDescription>{current?.options.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => closeAndResolve(false)}>
            {current?.options.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              closeAndResolve(true);
            }}
          >
            {current?.options.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* =========================================================================================
 * Your original hook (public API unchanged). Only DELETE path now uses the modal above.
 * =======================================================================================*/

type QueryParams =
  | string
  | number
  | boolean
  | (string | number | boolean)[]
  | undefined;

type CrudOptions<TData, TPayload = unknown> = {
  url: string;
  queryKey: readonly unknown[];
  id?: string;
  pagination?: { currentPage: number; pageSize: number };
  queryParams?: Record<string, QueryParams>;
  listEnabled?: boolean;
  paginatedListEnabled?: boolean;
  detailEnabled?: boolean;
  refetchOnWindowFocus?: boolean;
};

type UpdatePayload<T> = { id: string; payload: T };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toSearchParams(
  pagination?: { currentPage: number; pageSize: number },
  queryParams?: Record<string, QueryParams>,
) {
  const sp = new URLSearchParams();
  if (pagination) {
    sp.append('page', String(pagination.currentPage));
    sp.append('limit', String(pagination.pageSize));
  }
  if (queryParams) {
    for (const [k, v] of Object.entries(queryParams)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) v.forEach((item) => sp.append(k, String(item)));
      else sp.append(k, String(v));
    }
  }
  return sp.toString();
}

function toFormData(obj: Record<string, unknown>, form?: FormData, ns?: string): FormData {
  const fd = form ?? new FormData();
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value == null) continue;

    const formKey = ns ? `${ns}[${key}]` : key;

    if (value instanceof Date) fd.append(formKey, value.toISOString());
    else if (value instanceof File || value instanceof Blob) fd.append(formKey, value);
    else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const k = `${formKey}[${i}]`;
        if (item instanceof File || item instanceof Blob) fd.append(k, item);
        else if (item instanceof Date) fd.append(k, item.toISOString());
        else if (typeof item === 'object' && item !== null) toFormData(item as any, fd, k);
        else fd.append(k, String(item));
      });
    } else if (typeof value === 'object') toFormData(value as any, fd, formKey);
    else fd.append(formKey, String(value));
  }
  return fd;
}

function unwrapAxiosError(err: unknown): Error {
  const ax = err as AxiosError<any>;
  const msg =
    ax?.response?.data?.message ??
    ax?.response?.data?.error ??
    ax?.message ??
    'Request failed';
  return new Error(Array.isArray(msg) ? msg[0] : msg);
}

export function useCrud<TData, TPayload = unknown>(opts: CrudOptions<TData, TPayload>) {
  const {
    url,
    queryKey,
    id,
    pagination,
    queryParams = {},
    listEnabled = true,
    paginatedListEnabled = false,
    detailEnabled = Boolean(id),
    refetchOnWindowFocus = true,
  } = opts;

  const { data: session } = useSession();
  const token = (session as any)?.accessToken ?? null; // unchanged
  const qc = useQueryClient();
  const memoParams = useMemo(() => queryParams, [JSON.stringify(queryParams)]);

  // Mount confirm host immediately on first hook use (safe in client)
  useEffect(() => {
    ensureConfirmHost();
  }, []);

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // ---------- LIST ----------
  const list: UseQueryResult<TData[]> = useQuery({
    queryKey: [url, ...queryKey, 'list', pagination?.currentPage, pagination?.pageSize, memoParams],
    enabled: listEnabled,
    refetchOnWindowFocus,
    queryFn: async () => {
      const qs = toSearchParams(pagination, memoParams);
      const { data } = await api.get<{ data: TData[] }>(
        qs ? `${url}?${qs}` : url,
        { headers: authHeader }
      );
      return data.data;
    },
  });

  // ---------- PAGINATED LIST ----------
  const paginatedList: UseQueryResult<PaginatedResponse<TData>> = useQuery({
    queryKey: [
      url,
      ...queryKey,
      'paginated',
      pagination?.currentPage,
      pagination?.pageSize,
      memoParams,
    ],
    enabled: paginatedListEnabled,
    refetchOnWindowFocus,
    queryFn: async () => {
      const qs = toSearchParams(pagination, memoParams);
      const { data } = await api.get<{ data: PaginatedResponse<TData> }>(
        qs ? `${url}?${qs}` : url,
        { headers: authHeader }
      );
      return data.data;
    },
  });

  // ---------- DETAIL ----------
  const detail: UseQueryResult<TData> = useQuery({
    queryKey: [url, ...queryKey, 'detail', id],
    enabled: detailEnabled,
    refetchOnWindowFocus,
    queryFn: async () => {
      if (!id) throw new Error('Missing ID for detail');
      const { data } = await api.get<{ data: TData }>(`${url}/${id}`, { headers: authHeader });
      return data.data;
    },
  });

  // ---------- CREATE ----------
  const create: UseMutationResult<TData, unknown, TPayload> = useMutation({
    mutationFn: async (payload) => {
      try {
        console.info('create mutation payload', payload);
        const { data } = await api.post<TData>(url, payload, { headers: authHeader });
        return data;
      } catch (e) {
        throw unwrapAxiosError(e);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [url, ...queryKey], exact: false }),
  });

  // ---------- CREATE (FormData) ----------
  const createWithFormData: UseMutationResult<TData, unknown, TPayload> = useMutation({
    mutationFn: async (payload) => {
      try {
        const fd = toFormData(payload as Record<string, unknown>);
        const { data } = await api.post<TData>(url, fd, {
          headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
        });
        return data;
      } catch (e) {
        throw unwrapAxiosError(e);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [url, ...queryKey], exact: false }),
  });

  // ---------- UPDATE ----------
  const update: UseMutationResult<TData, unknown, UpdatePayload<TPayload>> = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch<TData>(`${url}/${id}`, payload, { headers: authHeader });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [url, ...queryKey], exact: false }),
  });

  // ---------- UPDATE (FormData) ----------
  const updateWithFormData: UseMutationResult<TData, unknown, UpdatePayload<TPayload>> =
    useMutation({
      mutationFn: async ({ id, payload }) => {
        try {
          const fd = toFormData(payload as Record<string, unknown>);
          const { data } = await api.patch<TData>(`${url}/${id}`, fd, {
            headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
          });
          return data;
        } catch (e) {
          throw unwrapAxiosError(e);
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [url, ...queryKey], exact: false }),
    });

  // ---------- DELETE (uses the built-in shadcn modal from above) ----------
  const CANCELLED = '__DELETE_CANCELLED__';
  const remove: UseMutationResult<void, unknown, string> = useMutation({
    mutationFn: async (id) => {
      // Show prettier modal; fallback to safe cancel if something's off.
      let ok = false;
      try {
        ok = await confirmWithModal({
          title: 'Delete item',
          description:
            'Are you absolutely sure? This action cannot be undone and will permanently delete the record.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
        });
      } catch {
        ok = false;
      }
      if (!ok) throw new Error(CANCELLED);

      await api.delete(`${url}/${id}`, { headers: authHeader });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [url, ...queryKey], exact: false }),
    onError: (err) => {
      if ((err as Error)?.message === CANCELLED) return; // silent on cancel
    },
  });

  // ---------- EXPORT ----------
  async function onExportAll(params?: Record<string, unknown>, fileName = 'export') {
    const qs = toSearchParams(undefined, params as Record<string, QueryParams>);
    const { data } = await api.get<{ data: Record<string, any>[] }>(
      `${url}/export${qs ? `?${qs}` : ''}`,
      { headers: authHeader }
    );

    const rows = data?.data ?? [];
    if (!rows.length) {
      alert('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  return {
    list,
    paginatedList,
    detail,
    create,
    createWithFormData,
    update,
    updateWithFormData,
    remove,
    onExportAll,
  };
}
