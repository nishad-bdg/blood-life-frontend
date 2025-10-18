'use client'

import * as React from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
}

type PaginationMode = 'client' | 'server' | false

interface GenericTableProps<T> {
  title?: string
  description?: string
  data: T[]                                // full data (client-mode) or current page (server-mode)
  columns: Column<T>[]
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string

  // 🔍 Search
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  localSearchKeys?: Array<keyof T | string>

  // 📄 Pagination
  pagination?: PaginationMode               // 'client' | 'server' | false
  total?: number                            // required for server mode
  page?: number                             // 1-based
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]

  // UI tweaks
  className?: string
}

/** tiny debounce hook */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

/** Build compact page list with ellipses … */
function buildPageItems(current: number, totalPages: number, delta = 1): (number | '...')[] {
  if (totalPages <= 1) return [1]
  const set = new Set<number>([1, totalPages])
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= totalPages) set.add(i)
  }
  if (totalPages >= 2) set.add(2)
  if (totalPages >= 3) set.add(totalPages - 1)
  const sorted = Array.from(set).sort((a, b) => a - b)
  const out: (number | '...')[] = []
  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (i > 0 && prev !== undefined && curr - prev > 1) out.push('...')
    out.push(curr)
  }
  return out
}

export function GenericTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  actions,
  emptyMessage = 'No data found',
  // search
  searchable = false,
  searchPlaceholder = 'Search…',
  onSearch,
  localSearchKeys,
  // pagination
  pagination = false,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: GenericTableProps<T>) {
  // ---------- Search ----------
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebouncedValue(query, 250)

  React.useEffect(() => {
    if (onSearch) onSearch(debouncedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const searchedData = React.useMemo(() => {
    if (!localSearchKeys?.length || !debouncedQuery.trim()) return data
    const q = debouncedQuery.trim().toLowerCase()
    return data.filter((row) =>
      localSearchKeys.some((k) => String(row[k as keyof T] ?? '').toLowerCase().includes(q)),
    )
  }, [data, localSearchKeys, debouncedQuery])

  // ---------- Pagination ----------
  // Client mode: we manage page/pageSize locally and slice searchedData
  const [clientPage, setClientPage] = React.useState(1)
  const [clientSize, setClientSize] = React.useState(pageSizeOptions[0])

  React.useEffect(() => {
    // reset to page 1 when performing a new search in client mode
    if (pagination === 'client') setClientPage(1)
  }, [debouncedQuery, pagination])

  const effectivePage = pagination === 'server' ? (page ?? 1) : clientPage
  const effectiveSize = pagination === 'server' ? (pageSize ?? pageSizeOptions[0]) : clientSize

  const clientTotal = searchedData.length
  const totalItems = pagination === 'server' ? (total ?? data.length) : clientTotal
  const totalPages = Math.max(1, Math.ceil(totalItems / (effectiveSize || 1)))

  const rows =
    pagination === 'client'
      ? searchedData.slice((effectivePage - 1) * effectiveSize, effectivePage * effectiveSize)
      : searchedData // server (already paged) or no pagination

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return
    if (pagination === 'server') onPageChange?.(p)
    else setClientPage(p)
  }

  const handlePrev = () => goToPage(effectivePage - 1)
  const handleNext = () => goToPage(effectivePage + 1)

  const handleSizeChange = (val: string) => {
    const n = Number(val)
    if (pagination === 'server') {
      onPageSizeChange?.(n)
      onPageChange?.(1)
    } else {
      setClientSize(n)
      setClientPage(1)
    }
  }

  const numberItems = pagination ? buildPageItems(effectivePage, totalPages, 1) : []

  return (
    <Card className={className}>
      {(title || description || searchable) && (
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>

            {searchable && (
              <div className="relative group">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  // 🔎 Make input very visible & modern
                  className={cn(
                    'w-80 h-11 pr-10 pl-3 cursor-text',
                    'rounded-xl border border-border/70 bg-background/70',
                    'shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60',
                    'placeholder:text-muted-foreground/80'
                  )}
                  aria-label="Search table"
                />
                {query && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">😕 {emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key.toString()}>{col.label}</TableHead>
                  ))}
                  {actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item, i) => (
                  <TableRow key={i} className="hover:bg-muted/40">
                    {columns.map((col) => (
                      <TableCell key={col.key.toString()}>
                        {col.render ? col.render(item) : (item[col.key] ?? '-')}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1 *:cursor-pointer">
                          {actions(item)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination && totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium">{effectivePage}</span> of{' '}
              <span className="font-medium">{totalPages}</span> •{' '}
              <span className="font-medium">{totalItems}</span> total
            </div>

            <div className="flex items-center gap-2">
              {/* Page size */}
              <Select
                value={String(effectiveSize)}
                onValueChange={handleSizeChange}
              >
                <SelectTrigger className="h-9 w-[110px] cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((n) => (
                    <SelectItem key={n} value={String(n)} className="cursor-pointer">
                      {n}/page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Prev */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={effectivePage <= 1}
                className="cursor-pointer"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>

              {/* Numbered pagination with ellipses */}
              <div className="flex items-center gap-1">
                {numberItems.map((it, idx) =>
                  it === '...' ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-2 text-muted-foreground select-none"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={it}
                      variant={it === effectivePage ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'min-w-9 cursor-pointer',
                        it === effectivePage && 'pointer-events-none'
                      )}
                      onClick={() => goToPage(it)}
                      aria-current={it === effectivePage ? 'page' : undefined}
                    >
                      {it}
                    </Button>
                  ),
                )}
              </div>

              {/* Next */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={effectivePage >= totalPages}
                className="cursor-pointer"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
