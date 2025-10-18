"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { DONORS_QUERY_KEY } from "@/app/constants/queryKeys";
import { useCrud, type PaginatedResponse } from "@/app/hooks/useCRUD";
import { apiEndpoints } from "@/app/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Pencil, Trash2, Download } from "lucide-react";
import { GenericTable } from "@/app/components/shared/GenericTable";

type Donor = {
  _id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  age?: number;
  presentDivision?: string;
  presentDistrict?: string;
  lastDonationDate?: string | null;
};

export default function DonorsPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? null;

  // server-side search + pagination state
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  const { paginatedList, remove, onExportAll } = useCrud<Donor, Partial<Donor>>(
    {
      url: apiEndpoints.donors, // e.g. "/users"
      queryKey: [DONORS_QUERY_KEY, search, page, limit],
      pagination: { currentPage: page, pageSize: limit },
      queryParams: { searchKeyword: search }, // <- server search param
      listEnabled: false,
      paginatedListEnabled: Boolean(token), // only fetch when token present
    },
  );

  const isLoading = paginatedList?.isLoading || status === "loading";
  const error = paginatedList?.error as Error | null;
  const data = paginatedList?.data as PaginatedResponse<Donor> | undefined;

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    {
      key: "bloodGroup",
      label: "Blood",
      render: (d: Donor) => <Badge variant="secondary">{d?.bloodGroup}</Badge>,
    },
    { key: "presentDivision", label: "Division" },
    { key: "presentDistrict", label: "District" },
    { key: "presentUpazilla", label: "Present Upazilla" },
    {
      key: "lastDonationDate",
      label: "Last Donation",
      render: (d: Donor) =>
        d?.lastDonationDate
          ? new Date(d?.lastDonationDate)?.toLocaleDateString()
          : "—",
    },
  ] as const;

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">You’re signed out</p>
          <p className="text-sm text-muted-foreground">
            Please sign in to view donors.
          </p>
        </div>
      </div>
    );
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
            onClick={() => onExportAll({ searchKeyword: search }, "donors")}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading donors…
        </div>
      )}
      {error && (
        <div className="text-sm text-red-500">Error: {error.message}</div>
      )}

      {/* Table (server-side search + pagination) */}
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
              onClick={() => console.log("view", d?._id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => console.log("edit", d?._id)}
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
        // 🔍 search (server-driven)
        searchable
        onSearch={(q) => {
          setSearch(q);
          setPage(1); // reset page when searching
        }}
        // 📄 pagination (server-driven)
        pagination="server"
        total={data?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
        pageSizeOptions={[10, 20, 50]}
      />
    </div>
  );
}
