'use client'

import { useState, useMemo } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
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

import type { SessionType } from '@/types/app/assessmentTypes'
import AddSessionDrawer from './AddSessionDrawer'
import EditSessionDrawer from './EditSessionDrawer'
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

const columnHelper = createColumnHelper<SessionType>()

type Props = {
  assessmentId: number
  sessions: SessionType[]
}

const SessionsTable = ({ assessmentId, sessions }: Props) => {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SessionType | null>(null)
  const [data, setData] = useState(sessions)

  const handleDelete = async (id: number) => {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(s => s.id !== id))
  }

  const handleUpdate = (updated: SessionType) => {
    setData(prev => prev.map(s => (s.id === updated.id ? updated : s)))
  }

  const columns = useMemo<ColumnDef<SessionType, any>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => <Typography color='text.primary'>#{row.original.id}</Typography>
      }),
      columnHelper.accessor('startTime', {
        header: 'Start Time',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.startTime}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          if (!status) return null
          const color = status === 'ACTIVE' ? 'success' : 'default'
          return <Chip label={status} color={color} size='small' variant='tonal' />
        }
      }),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <IconButton size='small' onClick={() => router.push(`/assessments/${assessmentId}/sessions/${row.original.id}`)}>
              <i className='ri-eye-line' />
            </IconButton>
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
    [assessmentId]
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
          title='Sessions'
          action={
            <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>
              Add Session
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
                <tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No sessions yet</td></tr>
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
      <AddSessionDrawer
        open={addOpen}
        assessmentId={assessmentId}
        handleClose={() => setAddOpen(false)}
        onCreated={s => setData(prev => [...prev, s])}
      />
      <EditSessionDrawer
        open={Boolean(editTarget)}
        session={editTarget}
        handleClose={() => setEditTarget(null)}
        onUpdated={handleUpdate}
      />
    </>
  )
}

export default SessionsTable
