/* eslint-disable */
'use client';

import { API_ENDPOINT } from '@/app/constants/apiEndpoints';
import { useCrud } from '@/app/hooks/useCRUD';
import React, { useMemo, useState } from 'react';
``
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type BloodStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | string;

export interface BloodUser {
  _id: string;
  phone?: string;
  name?: string;
  bloodGroup?: string;
}

export interface BloodRequest {
  _id: string;
  isDeleted?: boolean;
  requester?: BloodUser;
  donor?: BloodUser;
  bloodGroup?: string;
  status?: BloodStatus;
  createdAt?: string;
  updatedAt?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function isBloodUser(x: unknown): x is BloodUser {
  return isRecord(x) && typeof x._id === 'string';
}

function isBloodRequest(x: unknown): x is BloodRequest {
  return (
    isRecord(x) &&
    typeof x._id === 'string' &&
    (x.requester === undefined || isBloodUser(x.requester)) &&
    (x.donor === undefined || isBloodUser(x.donor))
  );
}

type Envelope<T> = {
  status?: string;
  statusCode?: number;
  message?: string;
  data?: unknown; // could be T[] or { data: T[], total, page, limit, totalPages }
};

function normalizeResponse<T>(raw: unknown): PaginatedResponse<T> {
  const empty: PaginatedResponse<T> = {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  if (!isRecord(raw)) return empty;

  const maybeEnvelope = raw as Envelope<T[] | PaginatedResponse<T>>;
  const inner = 'data' in maybeEnvelope ? maybeEnvelope.data : raw;
  if (!inner) return empty;

  // Case A: { data: T[] }
  if (Array.isArray(inner)) {
    return {
      items: inner as T[],
      total: inner.length,
      page: 1,
      limit: (inner as T[]).length || 10,
      totalPages: 1,
    };
  }

  // Case B: { data: T[], total, page, limit, totalPages }
  if (isRecord(inner)) {
    const items = Array.isArray(inner.data) ? (inner.data as T[]) : [];
    const total = Number(inner.total ?? items.length ?? 0) || 0;
    const page = Number(inner.page ?? 1) || 1;
    const limit = Number(inner.limit ?? (items.length || 10)) || 10;
    const totalPages =
      Number(inner.totalPages ?? (limit ? Math.ceil(total / limit) : 1)) || 1;

    return { items, total, page, limit, totalPages };
  }

  return empty;
}

const dash = '—';
function safeText(v: unknown, fallback = dash): string {
  return typeof v === 'string' && v.trim() ? v : fallback;
}
function safeDate(iso?: string, fallback = dash): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? fallback : d.toLocaleString();
}

// ===============
// Table building
// ===============

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

function TableShell<T>({
  rows,
  columns,
  emptyMessage = 'No data found',
}: {
  rows?: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (!safeRows.length) {
    return (
      <div className="text-sm text-muted-foreground py-6">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={`text-left p-3 whitespace-nowrap ${c.className ?? ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((row, i) => (
            <tr
              key={(isRecord(row) && (row as any)._id) ?? i}
              className="border-t"
            >
              {columns.map((c) => (
                <td
                  key={String(c.key)}
                  className={`p-3 align-top whitespace-nowrap ${c.className ?? ''}`}
                >
                  {c.render
                    ? c.render(row)
                    : safeText((row as any)?.[c.key as any])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =========================
// Page / Container Component
// =========================

const API_URL = `${API_ENDPOINT.donations}/all-donations`

export default function BloodRequestsPage() {
  // local pagination state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { paginatedList, remove, onExportAll } = useCrud<BloodRequest>({
    url: API_URL,
    queryKey: ['blood-requests'],
    pagination: { currentPage: page, pageSize: limit },
    paginatedListEnabled: true,
    listEnabled: false,
    detailEnabled: false,
    refetchOnWindowFocus: true,
  });

  const normalized = useMemo(
    () => normalizeResponse<BloodRequest>(paginatedList?.data),
    [paginatedList?.data],
  );

  const rows = useMemo(
    () => (normalized?.items || []).filter(isBloodRequest),
    [normalized?.items],
  );

  const loading = paginatedList.isLoading || paginatedList.isFetching;
  const errorMsg =
    (paginatedList.error as Error)?.message ||
    (typeof ((paginatedList as any)?.data) === 'string' ? (paginatedList as any).data : '') ||
    '';

  const columns: Column<BloodRequest>[] = useMemo(
    () => [
      {
        key: '_id',
        label: 'ID',
        render: (r) => safeText(r?._id?.slice?.(-6) ?? ''),
      },
      {
        key: 'requester',
        label: 'Requester',
        render: (r) => (
          <div className="min-w-[200px]">
            <div className="font-medium">
              {safeText(r?.requester?.name)}
            </div>
            <div className="text-muted-foreground text-xs">
              {safeText(r?.requester?.phone)}
              {' • '}
              {safeText(r?.requester?.bloodGroup)}
            </div>
          </div>
        ),
      },
      {
        key: 'donor',
        label: 'Donor',
        render: (r) => (
          <div className="min-w-[200px]">
            <div className="font-medium">{safeText(r?.donor?.name)}</div>
            <div className="text-muted-foreground text-xs">
              {safeText(r?.donor?.phone)}
              {' • '}
              {safeText(r?.donor?.bloodGroup)}
            </div>
          </div>
        ),
      },
      {
        key: 'bloodGroup',
        label: 'Req. Group',
        render: (r) => safeText(r?.bloodGroup),
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span className="inline-flex px-2 py-0.5 rounded-md border text-xs">
            {safeText(r?.status)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (r) => safeDate(r?.createdAt),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-xs border rounded-md hover:bg-muted"
              onClick={() => {
                // put your "view" / "detail" action here
                // e.g., router.push(`/blood-requests/${r._id}`)
                console.info('view', r?._id);
              }}
            >
              View
            </button>
            <button
              className="px-2 py-1 text-xs border rounded-md hover:bg-destructive/10"
              onClick={async () => {
                const id = r?._id;
                if (!id) return;
                try {
                  await remove.mutateAsync(id);
                } catch (e) {
                  // silent on cancel; otherwise show something
                  const msg =
                    (e as Error)?.message &&
                    (e as Error).message !== '__DELETE_CANCELLED__'
                      ? (e as Error).message
                      : '';
                  if (msg) console.error('Delete failed:', msg);
                }
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [remove],
  );

  return (
    <div className="space-y-4">
      {/* Header / Actions */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Blood Requests</h2>

        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={limit}
            onChange={(e) => {
              const next = Number(e.target.value) || 10;
              setLimit(next);
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          <button
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
            onClick={() => onExportAll({}, 'blood-requests')}
            disabled={loading}
            title="Export current dataset to Excel"
          >
            Export
          </button>
        </div>
      </div>

      {/* Error / Loading */}
      {errorMsg ? (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-3 rounded">
          {errorMsg}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : null}

      {/* Table */}
      <TableShell<BloodRequest>
        rows={rows}
        columns={columns}
        emptyMessage="No blood requests"
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: {normalized.total} • Page {normalized.page} /{' '}
          {normalized.totalPages || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || normalized.page <= 1}
          >
            Prev
          </button>
          <button
            className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            onClick={() =>
              setPage((p) =>
                normalized.totalPages ? Math.min(normalized.totalPages, p + 1) : p + 1,
              )
            }
            disabled={
              loading ||
              (normalized.totalPages ? normalized.page >= normalized.totalPages : false)
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
