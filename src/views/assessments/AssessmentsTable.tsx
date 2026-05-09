'use client'

import { useState, useMemo, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import type { TextFieldProps } from '@mui/material/TextField'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { PlayerType } from '@/types/app/playersTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import AddAssessmentDrawer from './AddAssessmentDrawer'
import EditAssessmentDrawer from './EditAssessmentDrawer'
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

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: { value: string | number; onChange: (value: string | number) => void; debounce?: number } & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const columnHelper = createColumnHelper<AssessmentType>()

type Props = {
  assessments: AssessmentType[]
  players: PlayerType[]
  sports: DictionaryEntry[]
  templates: AssessmentTemplateType[]
}

const AssessmentsTable = ({ assessments, players, sports, templates }: Props) => {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssessmentType | null>(null)
  const [data, setData] = useState(assessments)
  const [globalFilter, setGlobalFilter] = useState('')

  const playerMap = useMemo(() => Object.fromEntries(players.map(p => [p.id, p.name])), [players])
  const templateMap = useMemo(() => Object.fromEntries(templates.map(t => [t.id, t.name])), [templates])

  const handleDelete = async (id: number) => {
    await fetch(`/api/assessments/${id}`, { method: 'DELETE' })
    setData(prev => prev.filter(a => a.id !== id))
  }

  const handleUpdate = (updated: AssessmentType) => {
    setData(prev => prev.map(a => (a.id === updated.id ? updated : a)))
  }

  const columns = useMemo<ColumnDef<AssessmentType, any>[]>(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => (
          <Typography
            color='primary'
            className='font-medium cursor-pointer hover:underline'
            onClick={() => router.push(`/assessments/${row.original.id}`)}
          >
            #{row.original.id}
          </Typography>
        )
      }),
      columnHelper.accessor('playerId', {
        header: 'Player',
        cell: ({ row }) => (
          <Typography color='text.primary'>{playerMap[row.original.playerId] ?? `#${row.original.playerId}`}</Typography>
        )
      }),
      columnHelper.accessor('sport', {
        header: 'Sport',
        cell: ({ row }) => <Chip label={row.original.sport} size='small' color='primary' variant='outlined' />
      }),
      columnHelper.accessor('templateId', {
        header: 'Template',
        cell: ({ row }) => (
          <Typography color='text.secondary'>{templateMap[row.original.templateId] ?? `#${row.original.templateId}`}</Typography>
        )
      }),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <IconButton size='small' onClick={() => router.push(`/assessments/${row.original.id}`)}>
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
    [playerMap, templateMap]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardContent className='flex justify-between flex-wrap max-sm:flex-col sm:items-center gap-4'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search'
            className='max-sm:is-full'
          />
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-add-line' />}
            onClick={() => setAddOpen(true)}
          >
            Add Assessment
          </Button>
        </CardContent>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
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
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No assessments found</td>
                </tr>
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
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>
      <AddAssessmentDrawer
        open={addOpen}
        players={players}
        sports={sports}
        templates={templates}
        handleClose={() => setAddOpen(false)}
        onCreated={a => setData(prev => [...prev, a])}
      />
      <EditAssessmentDrawer
        open={Boolean(editTarget)}
        assessment={editTarget}
        players={players}
        sports={sports}
        templates={templates}
        handleClose={() => setEditTarget(null)}
        onUpdated={handleUpdate}
      />
    </>
  )
}

export default AssessmentsTable
