'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DONORS_QUERY_KEY } from '@/app/constants/queryKeys'
import { useCrud, type PaginatedResponse } from '@/app/hooks/useCRUD'
import { apiEndpoints } from '@/app/utils/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, Pencil, Trash2, Download, Plus } from 'lucide-react'
import { GenericTable } from '@/app/components/shared/GenericTable'
import DonorModal, { DonorFormDTO } from './components/DonorModal'
import {
  RoleEnum,
  BloodGroupEnum,
  UserStatusEnum,
} from '@/app/enums/index.enum'

// Geo helpers
import { getDivisions, getDistricts, getUpazilas } from '@/app/data/bd-geo'

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
  status?: UserStatusEnum
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
    case 'donar':
    default:
      return 'outline'
  }
}

const statusVariant = (
  status?: UserStatusEnum,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case UserStatusEnum.ACTIVE: // "Active"
      return 'default'
    case UserStatusEnum.BLOCKED: // "Blocked"
      return 'secondary'
    case UserStatusEnum.DELETED: // "Deleted"
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function DonorsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const token = (session as any)?.accessToken ?? null

  // table state
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // ------- FILTER STATE (matches DonorFilterDto) -------
  const [bloodGroup, setBloodGroup] = useState<BloodGroupEnum | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatusEnum | ''>('')

  // Present
  const [presentDivision, setPresentDivision] = useState('')
  const [presentDistrict, setPresentDistrict] = useState('')
  const [presentUpazilla, setPresentUpazilla] = useState('')

  // Permanent
  const [permanentDivision, setPermanentDivision] = useState('')
  const [permanentDistrict, setPermanentDistrict] = useState('')
  const [permanentUpazilla, setPermanentUpazilla] = useState('')

  // Created-at range
  const [startDate, setStartDate] = useState<string>('') // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>('') // yyyy-mm-dd

  // Last donation date range
  const [lastDonationStart, setLastDonationStart] = useState<string>('') // yyyy-mm-dd
  const [lastDonationEnd, setLastDonationEnd] = useState<string>('') // yyyy-mm-dd

  // reset child selects when parent changes (Present)
  useEffect(() => {
    setPresentDistrict('')
    setPresentUpazilla('')
  }, [presentDivision])

  useEffect(() => {
    setPresentUpazilla('')
  }, [presentDistrict])

  // reset child selects when parent changes (Permanent)
  useEffect(() => {
    setPermanentDistrict('')
    setPermanentUpazilla('')
  }, [permanentDivision])

  useEffect(() => {
    setPermanentUpazilla('')
  }, [permanentDistrict])

  const divisionOptions = useMemo(
    () => getDivisions().map((d) => ({ label: d, value: d })),
    [],
  )

  const presentDistrictOptions = useMemo(
    () => getDistricts(presentDivision).map((d) => ({ label: d, value: d })),
    [presentDivision],
  )

  const presentUpazilaOptions = useMemo(
    () =>
      getUpazilas(presentDivision, presentDistrict).map((u) => ({
        label: u,
        value: u,
      })),
    [presentDivision, presentDistrict],
  )

  const permanentDistrictOptions = useMemo(
    () => getDistricts(permanentDivision).map((d) => ({ label: d, value: d })),
    [permanentDivision],
  )

  const permanentUpazilaOptions = useMemo(
    () =>
      getUpazilas(permanentDivision, permanentDistrict).map((u) => ({
        label: u,
        value: u,
      })),
    [permanentDivision, permanentDistrict],
  )

  const bloodOptions = useMemo(
    () =>
      (Object.values(BloodGroupEnum) as string[]).map((bg) => ({
        label: bg,
        value: bg,
      })),
    [],
  )

  const statusOptions = useMemo(
    () =>
      (Object.values(UserStatusEnum) as string[]).map((st) => ({
        label: st, // "Active", "Blocked", "Deleted"
        value: st,
      })),
    [],
  )

  const clearFilters = () => {
    setBloodGroup('')
    setStatusFilter('')
    setPresentDivision('')
    setPresentDistrict('')
    setPresentUpazilla('')
    setPermanentDivision('')
    setPermanentDistrict('')
    setPermanentUpazilla('')
    setStartDate('')
    setEndDate('')
    setLastDonationStart('')
    setLastDonationEnd('')
    setPage(1)
  }

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState<Donor | undefined>(undefined)

  const { paginatedList, remove, onExportAll, create, update } = useCrud<
    Donor,
    CreateDonorPayload
  >({
    url: apiEndpoints.donors,
    queryKey: [
      DONORS_QUERY_KEY,
      search,
      page,
      limit,
      bloodGroup,
      statusFilter,
      presentDivision,
      presentDistrict,
      presentUpazilla,
      permanentDivision,
      permanentDistrict,
      permanentUpazilla,
      startDate,
      endDate,
      lastDonationStart,
      lastDonationEnd,
    ],
    pagination: { currentPage: page, pageSize: limit },
    queryParams: {
      searchKeyword: search || undefined,
      bloodGroup: bloodGroup || undefined,
      status: statusFilter || undefined,
      presentDivision: presentDivision || undefined,
      presentDistrict: presentDistrict || undefined,
      presentUpazilla: presentUpazilla || undefined,
      permanentDivision: permanentDivision || undefined,
      permanentDistrict: permanentDistrict || undefined,
      permanentUpazilla: permanentUpazilla || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      lastDonationStart: lastDonationStart || undefined,
      lastDonationEnd: lastDonationEnd || undefined,
    },
    listEnabled: false,
    paginatedListEnabled: Boolean(token),
  })

  const isLoading = paginatedList?.isLoading || sessionStatus === 'loading'
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
          render: (d: Donor) => (
            <Badge variant="secondary">{d?.bloodGroup}</Badge>
          ),
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
          key: 'status',
          label: 'Status',
          render: (d: Donor) =>
            d?.status ? (
              <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
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
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">You’re signed out</p>
          <p className="text-sm text-muted-foreground">
            Please sign in to view donors.
          </p>
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

  const handleToggleStatus = async (donor: Donor) => {
    if (!donor?._id) return

    const current = donor.status
    let next: UserStatusEnum | undefined

    // Only toggle between Active and Blocked, leave Deleted as is
    if (current === UserStatusEnum.BLOCKED) {
      next = UserStatusEnum.ACTIVE
    } else if (current === UserStatusEnum.ACTIVE || !current) {
      next = UserStatusEnum.BLOCKED
    } else {
      // DELETED or unknown → do nothing
      return
    }

    await update.mutateAsync({
      id: donor._id,
      // partial payload just for status; cast to any to avoid affecting other flows
      payload: { status: next } as any,
    })
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
            onClick={() =>
              onExportAll(
                {
                  searchKeyword: search || undefined,
                  bloodGroup: bloodGroup || undefined,
                  status: statusFilter || undefined,
                  presentDivision: presentDivision || undefined,
                  presentDistrict: presentDistrict || undefined,
                  presentUpazilla: presentUpazilla || undefined,
                  permanentDivision: permanentDivision || undefined,
                  permanentDistrict: permanentDistrict || undefined,
                  permanentUpazilla: permanentUpazilla || undefined,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  lastDonationStart: lastDonationStart || undefined,
                  lastDonationEnd: lastDonationEnd || undefined,
                },
                'donors',
              )
            }
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

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-4">
        {/* Blood Group */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Blood Group</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={bloodGroup}
            onChange={(e) => {
              setBloodGroup(e.target.value as BloodGroupEnum | '')
              setPage(1)
            }}
          >
            <option value="">All</option>
            {bloodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatusEnum | '')
              setPage(1)
            }}
          >
            <option value="">All</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Present Division */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Present Division</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={presentDivision}
            onChange={(e) => {
              setPresentDivision(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All</option>
            {divisionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Present District */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Present District</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={presentDistrict}
            onChange={(e) => {
              setPresentDistrict(e.target.value)
              setPage(1)
            }}
            disabled={!presentDivision}
          >
            <option value="">
              {presentDivision ? 'All' : 'Select division first'}
            </option>
            {presentDistrictOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Present Upazilla */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Present Upazilla</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={presentUpazilla}
            onChange={(e) => {
              setPresentUpazilla(e.target.value)
              setPage(1)
            }}
            disabled={!presentDistrict}
          >
            <option value="">
              {presentDistrict ? 'All' : 'Select district first'}
            </option>
            {presentUpazilaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Permanent Division */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Permanent Division</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={permanentDivision}
            onChange={(e) => {
              setPermanentDivision(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All</option>
            {divisionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Permanent District */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Permanent District</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={permanentDistrict}
            onChange={(e) => {
              setPermanentDistrict(e.target.value)
              setPage(1)
            }}
            disabled={!permanentDivision}
          >
            <option value="">
              {permanentDivision ? 'All' : 'Select division first'}
            </option>
            {permanentDistrictOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Permanent Upazilla */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Permanent Upazilla</label>
          <select
            className="w-full rounded-md border bg-white px-3 py-2"
            value={permanentUpazilla}
            onChange={(e) => {
              setPermanentUpazilla(e.target.value)
              setPage(1)
            }}
            disabled={!permanentDistrict}
          >
            <option value="">
              {permanentDistrict ? 'All' : 'Select district first'}
            </option>
            {permanentUpazilaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Created From */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Created From</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {/* Created To */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Created To</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {/* Last Donation From */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Last Donation From</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2"
            value={lastDonationStart}
            onChange={(e) => {
              setLastDonationStart(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {/* Last Donation To */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Last Donation To</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2"
            value={lastDonationEnd}
            onChange={(e) => {
              setLastDonationEnd(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading donors…
        </div>
      )}
      {error && (
        <div className="text-sm text-red-500">Error: {error.message}</div>
      )}

      <GenericTable<Donor>
        title="Donor Directory"
        description={
          data ? `Showing ${data.items.length} of ${data.total}` : undefined
        }
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

            {/* Block / Unblock (skip for Deleted) */}
            {d.status !== UserStatusEnum.DELETED && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(d)}
                disabled={update.isLoading}
              >
                {d.status === UserStatusEnum.BLOCKED ? 'Unblock' : 'Block'}
              </Button>
            )}

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
