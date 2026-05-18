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

import type { RepMetricType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'
import AddRepMetricDrawer from './AddRepMetricDrawer'
import EditRepMetricDrawer from './EditRepMetricDrawer'
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

const columnHelper = createColumnHelper<RepMetricType>()

type Props = {
  repId: number
  repMetrics: RepMetricType[]
  conditionalMetrics: ConditionalMetricType[]
}

const RepMetricsTable = ({ repId, repMetrics, conditionalMetrics }: Props) => {
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RepMetricType | null>(null)
  const [data, setData] = useState(repMetrics)

  const conditionalMetricMap = useMemo(() => Object.fromEntries(conditionalMetrics.map(cm => [cm.id, cm.name])), [conditionalMetrics])

  const handleDelete = async (id: number) => {
    await fetch(`/api/rep-metrics/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(rm => rm.id !== id))
  }

  const handleUpdate = (updated: RepMetricType) => {
    setData(prev => prev.map(rm => (rm.id === updated.id ? updated : rm)))
  }

  const columns = useMemo<ColumnDef<RepMetricType, any>[]>(
    () => [
      columnHelper.accessor('id', { header: 'ID', cell: ({ row }) => <Typography color='text.primary'>#{row.original.id}</Typography> }),
      columnHelper.accessor('conditionalMetricId', {
        header: 'Conditional Metric',
        cell: ({ row }) => <Typography color='text.primary' className='font-medium'>{conditionalMetricMap[row.original.conditionalMetricId] ?? `#${row.original.conditionalMetricId}`}</Typography>
      }),
      {
        id: 'value',
        header: 'Value',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.value != null ? String(row.original.value) : '—'}</Typography>
      },
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
    [conditionalMetricMap]
  )

  const table = useReactTable({
    data, columns, filterFns: { fuzzy: fuzzyFilter }, initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Rep Metrics' action={<Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>Add Metric</Button>} />
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
              <tbody><tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No metrics yet</td></tr></tbody>
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
      <AddRepMetricDrawer open={addOpen} repId={repId} conditionalMetrics={conditionalMetrics} handleClose={() => setAddOpen(false)} onCreated={rm => setData(prev => [...prev, rm])} />
      <EditRepMetricDrawer open={Boolean(editTarget)} repMetric={editTarget} conditionalMetrics={conditionalMetrics} handleClose={() => setEditTarget(null)} onUpdated={handleUpdate} />
    </>
  )
}

export default RepMetricsTable
