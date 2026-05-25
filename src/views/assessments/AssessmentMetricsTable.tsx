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

import type { AssessmentMetricType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import AddAssessmentMetricDrawer from './AddAssessmentMetricDrawer'
import EditAssessmentMetricDrawer from './EditAssessmentMetricDrawer'
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

const columnHelper = createColumnHelper<AssessmentMetricType>()

type Props = {
  assessmentId: number
  assessmentMetrics: AssessmentMetricType[]
  conditionalMetrics: ConditionalMetricType[]
  dataSources: DataSourceType[]
}

const AssessmentMetricsTable = ({ assessmentId, assessmentMetrics, conditionalMetrics, dataSources }: Props) => {
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssessmentMetricType | null>(null)
  const [data, setData] = useState(assessmentMetrics)

  const conditionalMetricMap = useMemo(() => Object.fromEntries(conditionalMetrics.map(cm => [cm.id, cm.name])), [conditionalMetrics])
  const dataSourceMap = useMemo(() => Object.fromEntries(dataSources.map(ds => [ds.id, ds.type])), [dataSources])

  const handleDelete = async (id: number) => {
    await fetch(`/api/assessment-metrics/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(am => am.id !== id))
  }

  const handleUpdate = (updated: AssessmentMetricType) => {
    setData(prev => prev.map(am => (am.id === updated.id ? updated : am)))
  }

  const columns = useMemo<ColumnDef<AssessmentMetricType, any>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => <Typography color='text.primary'>#{row.original.id}</Typography>
      }),
      columnHelper.accessor('conditionalMetricId', {
        header: 'Conditional Metric',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {conditionalMetricMap[row.original.conditionalMetricId] ?? `#${row.original.conditionalMetricId}`}
          </Typography>
        )
      }),
      columnHelper.accessor('sourceId', {
        header: 'Data Source',
        cell: ({ row }) => (
          <Typography color='text.secondary'>{dataSourceMap[row.original.sourceId] ?? `#${row.original.sourceId}`}</Typography>
        )
      }),
      {
        id: 'minValue',
        header: 'Min',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.minValue ?? '—'}</Typography>
      },
      {
        id: 'maxValue',
        header: 'Max',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.maxValue ?? '—'}</Typography>
      },
      {
        id: 'avgValue',
        header: 'Avg',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.avgValue ?? '—'}</Typography>
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <IconButton size='small' onClick={() => setEditTarget(row.original)}>
              <i className='ri-edit-line' />
            </IconButton>
            <IconButton size='small' color='error' onClick={() => handleDelete(row.original.id)}>
              <i className='ri-delete-bin-line' />
            </IconButton>
          </div>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditionalMetricMap, dataSourceMap]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Assessment Metrics'
          action={
            <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>
              Add Metric
            </Button>
          }
        />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({ 'flex items-center': header.column.getIsSorted(), 'cursor-pointer select-none': header.column.getCanSort() })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getRowModel().rows.length === 0 ? (
              <tbody>
                <tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No metrics assigned yet</td></tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.slice(0, table.getState().pagination.pageSize).map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25]}
          component='div'
          className='border-bs'
          count={data.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>
      <AddAssessmentMetricDrawer
        open={addOpen}
        assessmentId={assessmentId}
        conditionalMetrics={conditionalMetrics}
        dataSources={dataSources}
        handleClose={() => setAddOpen(false)}
        onCreated={am => setData(prev => [...prev, am])}
      />
      <EditAssessmentMetricDrawer
        open={Boolean(editTarget)}
        assessmentMetric={editTarget}
        conditionalMetrics={conditionalMetrics}
        dataSources={dataSources}
        handleClose={() => setEditTarget(null)}
        onUpdated={handleUpdate}
      />
    </>
  )
}

export default AssessmentMetricsTable
