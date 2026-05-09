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

import type { RepMetricSourceType, RepMetricType } from '@/types/app/assessmentTypes'
import type { MetricType } from '@/types/app/metricTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import AddRepMetricSourceDrawer from './AddRepMetricSourceDrawer'
import EditRepMetricSourceDrawer from './EditRepMetricSourceDrawer'
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

const columnHelper = createColumnHelper<RepMetricSourceType>()

type Props = {
  repId: number
  repMetrics: RepMetricType[]
  repMetricSources: RepMetricSourceType[]
  metrics: MetricType[]
  dataSources: DataSourceType[]
}

const RepMetricSourcesTable = ({ repId, repMetrics, repMetricSources, metrics, dataSources }: Props) => {
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RepMetricSourceType | null>(null)
  const [data, setData] = useState(repMetricSources)

  const metricMap = useMemo(() => Object.fromEntries(metrics.map(m => [m.id, m.name])), [metrics])
  const dataSourceMap = useMemo(() => Object.fromEntries(dataSources.map(ds => [ds.id, ds.name])), [dataSources])
  const repMetricMetricMap = useMemo(
    () => Object.fromEntries(repMetrics.map(rm => [rm.id, metricMap[rm.metricId] ?? `Metric #${rm.metricId}`])),
    [repMetrics, metricMap]
  )

  const handleDelete = async (id: number) => {
    await fetch(`/api/rep-metric-sources/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(rms => rms.id !== id))
  }

  const handleUpdate = (updated: RepMetricSourceType) => {
    setData(prev => prev.map(rms => (rms.id === updated.id ? updated : rms)))
  }

  const columns = useMemo<ColumnDef<RepMetricSourceType, any>[]>(
    () => [
      columnHelper.accessor('id', { header: 'ID', cell: ({ row }) => <Typography color='text.primary'>#{row.original.id}</Typography> }),
      columnHelper.accessor('repMetricId', {
        header: 'Rep Metric',
        cell: ({ row }) => <Typography color='text.primary'>{repMetricMetricMap[row.original.repMetricId] ?? `#${row.original.repMetricId}`}</Typography>
      }),
      columnHelper.accessor('dataSourceId', {
        header: 'Data Source',
        cell: ({ row }) => <Typography color='text.secondary'>{dataSourceMap[row.original.dataSourceId] ?? `#${row.original.dataSourceId}`}</Typography>
      }),
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.description ?? '—'}</Typography>
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
    [repMetricMetricMap, dataSourceMap]
  )

  const table = useReactTable({
    data, columns, filterFns: { fuzzy: fuzzyFilter }, initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Rep Metric Sources' action={<Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>Add Source</Button>} />
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
              <tbody><tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No metric sources yet</td></tr></tbody>
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
      <AddRepMetricSourceDrawer open={addOpen} repMetrics={repMetrics} metrics={metrics} dataSources={dataSources} handleClose={() => setAddOpen(false)} onCreated={rms => setData(prev => [...prev, rms])} />
      <EditRepMetricSourceDrawer open={Boolean(editTarget)} repMetricSource={editTarget} repMetrics={repMetrics} metrics={metrics} dataSources={dataSources} handleClose={() => setEditTarget(null)} onUpdated={handleUpdate} />
    </>
  )
}

export default RepMetricSourcesTable
