'use client'

import { useState, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import { rankItem } from '@tanstack/match-sorter-utils'

import type { RepResourceType } from '@/types/app/assessmentTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import AddRepResourceDrawer from './AddRepResourceDrawer'
import EditRepResourceDrawer from './EditRepResourceDrawer'
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<RepResourceType>()

type Props = {
  repId: number
  repResources: RepResourceType[]
  resourceTypes: DictionaryEntry[]
}

const RepResourcesTable = ({ repId, repResources, resourceTypes }: Props) => {
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RepResourceType | null>(null)
  const [data, setData] = useState(repResources)

  const handleDelete = async (id: number) => {
    await fetch(`/api/rep-resources/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(r => r.id !== id))
  }

  const handleUpdate = (updated: RepResourceType) => {
    setData(prev => prev.map(r => (r.id === updated.id ? updated : r)))
  }

  const columns = useMemo<ColumnDef<RepResourceType, any>[]>(
    () => [
      columnHelper.accessor('id', { header: 'ID', cell: ({ row }) => <Typography color='text.primary'>#{row.original.id}</Typography> }),
      columnHelper.accessor('type', { header: 'Type', cell: ({ row }) => <Typography color='text.primary'>{row.original.type}</Typography> }),
      columnHelper.accessor('url', { header: 'URL', cell: ({ row }) => <Typography color='text.secondary' className='max-w-xs truncate'>{row.original.url}</Typography> }),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <IconButton size='small' onClick={() => setEditTarget(row.original)}><i className='ri-edit-line' /></IconButton>
            <IconButton size='small' color='error' onClick={() => handleDelete(row.original.id)}><i className='ri-delete-bin-line' /></IconButton>
          </div>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data, columns, filterFns: { fuzzy: fuzzyFilter }, initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Rep Resources' action={<Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>Add Resource</Button>} />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>{hg.headers.map(h => (
                  <th key={h.id}>
                    {h.isPlaceholder ? null : (
                      <div className={classnames({ 'flex items-center': h.column.getIsSorted(), 'cursor-pointer select-none': h.column.getCanSort() })} onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[h.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                      </div>
                    )}
                  </th>
                ))}</tr>
              ))}
            </thead>
            {table.getRowModel().rows.length === 0 ? (
              <tbody><tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No resources yet</td></tr></tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.slice(0, table.getState().pagination.pageSize).map(row => (
                  <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination rowsPerPageOptions={[10, 25]} component='div' className='border-bs' count={data.length} rowsPerPage={table.getState().pagination.pageSize} page={table.getState().pagination.pageIndex} onPageChange={(_, page) => table.setPageIndex(page)} onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))} />
      </Card>
      <AddRepResourceDrawer open={addOpen} repId={repId} resourceTypes={resourceTypes} handleClose={() => setAddOpen(false)} onCreated={r => setData(prev => [...prev, r])} />
      <EditRepResourceDrawer open={Boolean(editTarget)} repResource={editTarget} resourceTypes={resourceTypes} handleClose={() => setEditTarget(null)} onUpdated={handleUpdate} />
    </>
  )
}

export default RepResourcesTable
