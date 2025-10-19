'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { DONORS_QUERY_KEY } from '@/app/constants/queryKeys'
import { useCrud, type PaginatedResponse } from '@/app/hooks/useCRUD'
import { apiEndpoints } from '@/app/utils/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, Pencil, Trash2, Download, Plus } from 'lucide-react'
import { GenericTable } from '@/app/components/shared/GenericTable'
import DonorModal, { DonorFormDTO } from './components/DonorModal'
import { RoleEnum } from '@/app/enums/index.enum'

type Donor = {
  _id: string
  name: string
  phone: string
  bloodGroup: string
  age?: number
  presentDivision?: string
  presentDistrict?: string
  presentUpazilla?: string
  lastDonationDate?: string | null
  roles?: RoleEnum[]
}

type CreateDonorPayload = Omit<DonorFormDTO, '_id'>

const roleVariant = (
  role: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (role) {
    case 'admin':
      return 'destructive'
    case 'co-admin':
      return 'default'
    case 'moderator':
      return 'secondary'
    case 'donar': // your USER role value
    default:
      return 'outline'
  }
}

export default function DonorsPage() {
  const { data: session, status } = useSession()
  const token = (session as any)?.accessToken ?? null

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState<Donor | undefined>(undefined)

  const { paginatedList, remove, onExportAll, create, update } = useCrud<
    Donor,
    CreateDonorPayload
  >({
    url: apiEndpoints.donors,
    queryKey: [DONORS_QUERY_KEY, search, page, limit],
    pagination: { currentPage: page, pageSize: limit },
    queryParams: { searchKeyword: search },
    listEnabled: false,
    paginatedListEnabled: Boolean(token),
  })

  const isLoading = paginatedList?.isLoading || status === 'loading'
  const error = paginatedList?.error as Error | null
  const data = paginatedList?.data as PaginatedResponse<Donor> | undefined

  const columns = useMemo(
    () =>
      [
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        {
          key: 'bloodGroup',
          label: 'Blood',
          render: (d: Donor) => <Badge variant="secondary">{d?.bloodGroup}</Badge>,
        },
        { key: 'presentDivision', label: 'Division' },
        { key: 'presentDistrict', label: 'District' },
        { key: 'presentUpazilla', label: 'Present Upazilla' },
        {
          key: 'roles',
          label: 'Roles',
          render: (d: Donor) =>
            d?.roles?.length ? (
              <div className="flex flex-wrap gap-1">
                {d.roles.map((r) => (
                  <Badge key={r} variant={roleVariant(r)} className="capitalize">
                    {r.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            ) : (
              '—'
            ),
        },
        {
          key: 'lastDonationDate',
          label: 'Last Donation',
          render: (d: Donor) =>
            d?.lastDonationDate
              ? new Date(d?.lastDonationDate)?.toLocaleDateString()
              : '—',
        },
      ] as const,
    [],
  )

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">You’re signed out</p>
          <p className="text-sm text-muted-foreground">Please sign in to view donors.</p>
        </div>
      </div>
    )
  }

  // Normalize the form modal payload to API payload (ISO date + roles default)
  const toCreatePayload = (p: Omit<DonorFormDTO, '_id'>): CreateDonorPayload => ({
    ...p,
    lastDonationDate: p.lastDonationDate
      ? new Date(p.lastDonationDate).toISOString()
      : null,
    roles: p.roles && p.roles.length > 0 ? p.roles : [RoleEnum.USER],
  })

  // Handlers
  const handleCreate = async (payload: Omit<DonorFormDTO, '_id'>) => {
    await create.mutateAsync(toCreatePayload(payload))
  }

  const handleUpdate = async (id: string, payload: Omit<DonorFormDTO, '_id'>) => {
    await update.mutateAsync({ id, payload: toCreatePayload(payload) })
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Donors</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportAll({ searchKeyword: search }, 'donors')}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditRow(undefined)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Donor
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading donors…
        </div>
      )}
      {error && <div className="text-sm text-red-500">Error: {error.message}</div>}

      <GenericTable<Donor>
        title="Donor Directory"
        description={data ? `Showing ${data.items.length} of ${data.total}` : undefined}
        data={data?.items ?? []}
        columns={columns as any}
        actions={(d) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => console.log('view', d?._id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditRow(d)
                setModalOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => remove.mutate(d?._id)}
              disabled={paginatedList?.isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        emptyMessage="No donors found"
        searchable
        onSearch={(q) => {
          setSearch(q)
          setPage(1)
        }}
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

      {/* Create/Edit Modal */}
      <DonorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editRow}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
