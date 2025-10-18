/* eslint-disable */
'use client';

import { useMemo } from 'react';
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
  const token = session?.accessToken ?? null; // ✅ If no token, null
  const qc = useQueryClient();
  const memoParams = useMemo(() => queryParams, [JSON.stringify(queryParams)]);

  // ✅ Helper: attach token or skip
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

  // ---------- DELETE ----------
  const remove: UseMutationResult<void, unknown, string> = useMutation({
    mutationFn: async (id) => {
      await api.delete(`${url}/${id}`, { headers: authHeader });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [url, ...queryKey], exact: false }),
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
