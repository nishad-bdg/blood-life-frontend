'use client'

import React, { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GenericTable } from '@/app/components/shared/GenericTable'
import { useCrud, type PaginatedResponse } from '@/app/hooks/useCRUD'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'

// Import your shared enum (adjust the path if needed)
import { DonationRequestStatusEnum } from '@/app/enums/index.enum'
import { API_ENDPOINT } from '@/app/constants/apiEndpoints'

// ---- Local types for table rows ----
type UserLite = {
  _id: string
  name: string
  phone: string
  bloodGroup?: string
}

type DonationRequest = {
  _id: string
  requester: UserLite
  donor: UserLite
  bloodGroup: string
  preferredDonationDate?: string | null
  notes?: string | null
  status: DonationRequestStatusEnum
  actionBy?: UserLite | null
  createdAt?: string
  updatedAt?: string
}

// ---- Helpers ----
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

const statusVariant = (
  s: DonationRequestStatusEnum,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (s) {
    case DonationRequestStatusEnum.PENDING:
      return 'secondary'
    case DonationRequestStatusEnum.ACCEPTED:
      return 'default'
    case DonationRequestStatusEnum.DECLINED:
      return 'destructive'
    case DonationRequestStatusEnum.CANCELED:
    case DonationRequestStatusEnum.COMPLETED:
    default:
      return 'outline'
  }
}

export default function DonationsPage() {
  const { data: session, status: authStatus } = useSession()
  const token = (session as any)?.accessToken ?? null

  // filters + pagination
  const [status, setStatus] = useState<DonationRequestStatusEnum | ''>('') // internal '' = All
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // ---- LIST via useCrud (server pagination) ----
  const { paginatedList } = useCrud<DonationRequest>({
    url: `${API_ENDPOINT.donations}/all-donations`,
    queryKey: ['donations', 'admin', status, search],
    pagination: { currentPage: page, pageSize: limit },
    queryParams: {
      status: status || undefined,
      search: search?.trim() || undefined,
    },
    listEnabled: false,
    paginatedListEnabled: !!token && authStatus !== 'loading',
  })

  const isLoading = paginatedList?.isLoading
  const error = paginatedList?.error as Error | null
  const data = paginatedList?.data as PaginatedResponse<DonationRequest> | undefined

  // ---- STATUS UPDATE (custom route /:id/status) ----
  const qc = useQueryClient()
  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: DonationRequestStatusEnum }) => {
      const { data } = await api.patch(`/donations/${id}/status`, { status: next })
      return data
    },
    onSuccess: () => {
      // refresh any queries that list donations
      qc.invalidateQueries({ queryKey: ['/donations/admin/all'], exact: false })
      qc.invalidateQueries({ queryKey: ['donations', 'admin'], exact: false })
    },
  })

  // ---- Table columns ----
  const columns = useMemo(
    () => [
      {
        key: 'requester',
        label: 'Requester',
        render: (d: DonationRequest) => (
          <div className="flex flex-col">
            <span className="font-medium">{d?.requester?.name ?? '—'}</span>
            <span className="text-xs text-muted-foreground">
              {d?.requester?.phone ?? ''}
            </span>
          </div>
        ),
      },
      {
        key: 'donor',
        label: 'Donor',
        render: (d: DonationRequest) => (
          <div className="flex flex-col">
            <span className="font-medium">{d?.donor?.name ?? '—'}</span>
            <span className="text-xs text-muted-foreground">{d?.donor?.phone ?? ''}</span>
          </div>
        ),
      },
      {
        key: 'bloodGroup',
        label: 'Blood',
        render: (d: DonationRequest) => (
          <Badge variant="secondary">{d?.bloodGroup}</Badge>
        ),
      },
      {
        key: 'preferredDonationDate',
        label: 'Preferred Date',
        render: (d: DonationRequest) => fmtDate(d?.preferredDonationDate),
      },
      {
        key: 'notes',
        label: 'Notes',
        render: (d: DonationRequest) =>
          d?.notes ? (
            <span title={d?.notes} className="line-clamp-2 max-w-[280px]">
              {d?.notes}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (d: DonationRequest) => (
          <Badge className="uppercase" variant={statusVariant(d?.status)}>
            {d?.status}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (d: DonationRequest) => fmtDate(d?.createdAt),
      },
    ],
    [],
  )

  // ---- Row actions ----
  const actions = (d: DonationRequest) => {
    const isPending = d?.status === DonationRequestStatusEnum.PENDING
    const isAccepted = d?.status === DonationRequestStatusEnum.ACCEPTED
    const isTerminal =
      d?.status === DonationRequestStatusEnum.CANCELED ||
      d?.status === DonationRequestStatusEnum.COMPLETED

    return (
      <div className="flex justify-end gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={updateStatus.isPending || !isPending}
          onClick={() =>
            updateStatus.mutate({ id: d?._id, next: DonationRequestStatusEnum.ACCEPTED })
          }
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={cn('text-destructive')}
          disabled={updateStatus.isPending || !isPending}
          onClick={() =>
            updateStatus.mutate({ id: d?._id, next: DonationRequestStatusEnum.DECLINED })
          }
        >
          Decline
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={updateStatus.isPending || isTerminal}
          onClick={() =>
            updateStatus.mutate({ id: d?._id, next: DonationRequestStatusEnum.CANCELED })
          }
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={updateStatus.isPending || !isAccepted}
          onClick={() =>
            updateStatus.mutate({ id: d?._id, next: DonationRequestStatusEnum.COMPLETED })
          }
        >
          Mark Completed
        </Button>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">You’re signed out</p>
          <p className="text-sm text-muted-foreground">
            Please sign in to view donation requests.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Donations</CardTitle>
          <div className="flex items-center gap-2">
            {/* Search */}
            <Input
              placeholder="Search name / phone…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-64"
            />

            {/* Status filter (Radix requires non-empty item values) */}
            <Select
              value={status || 'ALL'}
              onValueChange={(v) => {
                setStatus(v === 'ALL' ? '' : (v as DonationRequestStatusEnum))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value={DonationRequestStatusEnum.PENDING}>Pending</SelectItem>
                <SelectItem value={DonationRequestStatusEnum.ACCEPTED}>
                  Accepted
                </SelectItem>
                <SelectItem value={DonationRequestStatusEnum.DECLINED}>
                  Declined
                </SelectItem>
                <SelectItem value={DonationRequestStatusEnum.CANCELED}>
                  Canceled
                </SelectItem>
                <SelectItem value={DonationRequestStatusEnum.COMPLETED}>
                  Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading donations…
            </div>
          ) : error ? (
            <div className="text-sm text-red-500">Error: {error?.message}</div>
          ) : (
            <GenericTable<DonationRequest>
              title="Donation Requests"
              description={
                data ? `Showing ${data?.items?.length} of ${data?.total}` : undefined
              }
              data={data?.items ?? []}
              columns={columns as any}
              actions={actions}
              searchable={false}
              pagination="server"
              total={data?.total ?? 0}
              page={page}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setLimit(n)
                setPage(1)
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
