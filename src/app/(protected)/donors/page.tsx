'use client'

import { useCrud } from '@/app/hooks/useCRUD';
import { useSession } from 'next-auth/react';
import React from 'react'

const page = () => {
  const { data: session } = useSession();
  const token = session?.accessToken ?? null;
  const {
  list,
  paginatedList,
  detail,
  create,
  update,
  remove,
  onExportAll,
} = useCrud<any, { title: string; body: string }>({
  url: 'users',
  queryKey: ['donors'],
  pagination: { currentPage: 1, pageSize: 10 },
  // queryParams: { search: 'hello', active: true },
  listEnabled: false,
  paginatedListEnabled: !!token,
});

console.info('Donors List:', paginatedList.data);
  return (
    <div>page</div>
  )
}

export default page