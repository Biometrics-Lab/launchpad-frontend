'use client'

import dynamic from 'next/dynamic'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { ApexOptions } from 'apexcharts'
import type { ReportData, ReportPanelConfig, ReportCell } from '@/types/app/reportTypes'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type Props = {
  panel: ReportPanelConfig
  data: ReportData
  valueType: 'avg' | 'min' | 'max'
}

function cellValue(cell: ReportCell | undefined, key: 'avg' | 'min' | 'max'): number | null {
  if (!cell) return null
  return cell[key] ?? null
}

// Colors by value type
const VALUE_TYPE_COLOR: Record<string, string> = {
  avg: 'var(--mui-palette-success-main)',
  min: 'var(--mui-palette-warning-main)',
  max: 'var(--mui-palette-info-main)',
}

// Palette for per-metric series (line / period bar)
const METRIC_COLORS = [
  'var(--mui-palette-primary-main)',
  'var(--mui-palette-error-main)',
  'var(--mui-palette-secondary-main)',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
]

function buildRangeSeries(data: ReportData) {
  return [{
    name: 'Range',
    data: data.rows.flatMap(row =>
      data.columns.map(col => {
        const cell = row.cells.find(c => c.columnId === col.id)
        if (!cell || cell.min == null || cell.max == null) return { x: row.name, y: [0, 0] }
        return { x: row.name, y: [cell.min, cell.max] }
      })
    )
  }]
}

function ChartPanel({ panel, data, valueType }: Props) {
  const hasRange = panel.series.includes('range')
  const isOverall = data.columns.length === 1
  const primaryKey = valueType
  const disabledText = 'var(--mui-palette-text-disabled)'

  let categories: string[]
  let series: any[]
  let colors: string[]

  if (hasRange) {
    categories = []
    series = buildRangeSeries(data)
    colors = [VALUE_TYPE_COLOR.avg]
  } else if (panel.type === 'bar' && isOverall) {
    // Bar OVERALL: X = metric names, one bar per metric in selected value type color
    categories = data.rows.map(r => r.name)
    series = [{
      name: primaryKey.toUpperCase(),
      data: data.rows.map(row => {
        const cell = row.cells.find(c => c.columnId === data.columns[0].id)
        return cellValue(cell, primaryKey)
      })
    }]
    colors = [VALUE_TYPE_COLOR[primaryKey]]
  } else if (panel.type === 'radar') {
    // Radar: X = metric names, data from first column only
    categories = data.rows.map(r => r.name)
    series = [{
      name: primaryKey.toUpperCase(),
      data: data.rows.map(row => {
        const cell = row.cells.find(c => c.columnId === data.columns[0].id)
        return cellValue(cell, primaryKey) ?? 0
      })
    }]
    colors = [VALUE_TYPE_COLOR[primaryKey]]
  } else {
    // Line (all granularities) + Bar PER_SESSION/PER_REP: X = periods, one series per metric
    categories = data.columns.map(c => c.label)
    series = data.rows.map(row => ({
      name: row.name,
      data: data.columns.map(col => {
        const cell = row.cells.find(c => c.columnId === col.id)
        return cellValue(cell, primaryKey)
      })
    }))
    colors = METRIC_COLORS
  }

  const options: ApexOptions = {
    chart: { toolbar: { show: false }, animations: { enabled: false } },
    colors,
    dataLabels: { enabled: false },
    legend: { show: series.length > 1 },
    grid: {
      strokeDashArray: 8,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: false } }
    },
    xaxis: {
      categories: hasRange ? [] : categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: disabledText, fontSize: '12px' }, rotate: -30 }
    },
    yaxis: {
      labels: {
        style: { colors: disabledText, fontSize: '12px' },
        formatter: (v: number) => v == null ? 'N/A' : String(Math.round((v ?? 0) * 10) / 10)
      }
    },
    tooltip: { theme: 'light' },
    ...(panel.type === 'bar' && !hasRange && {
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } }
    }),
    ...(panel.type === 'line' && {
      stroke: { curve: 'smooth', width: 2 }
    }),
    ...(panel.type === 'radar' && {
      plotOptions: { radar: { polygons: { strokeColors: 'var(--mui-palette-divider)' } } }
    }),
    ...(panel.options ?? {})
  }

  const apexType: 'bar' | 'line' | 'radar' | 'rangeArea' = hasRange ? 'rangeArea' : panel.type as 'bar' | 'line' | 'radar'

  return (
    <AppReactApexCharts
      type={apexType}
      width='100%'
      height={panel.type === 'radar' ? 500 : 300}
      series={series as any}
      options={options}
    />
  )
}

function TablePanel({ data, valueType }: Props) {
  const valueKey = valueType

  return (
    <div className='overflow-x-auto'>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--mui-palette-divider)', background: 'var(--mui-palette-action-hover)' }}>
              Metric
            </th>
            {data.columns.map(col => (
              <th key={col.id} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--mui-palette-divider)', background: 'var(--mui-palette-action-hover)' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map(row => (
            <tr key={row.conditionalMetricId}>
              <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--mui-palette-divider)' }}>
                {row.name}
              </td>
              {data.columns.map(col => {
                const cell = row.cells.find(c => c.columnId === col.id)
                const val = cell ? cellValue(cell, valueKey) : null

                return (
                  <td key={col.id} style={{ padding: '6px 12px', textAlign: 'center', borderBottom: '1px solid var(--mui-palette-divider)' }}>
                    {val == null ? (
                      <Typography variant='caption' color='text.disabled'>N/A</Typography>
                    ) : (
                      <span>{Math.round(val * 10) / 10}</span>
                    )}
                    {cell && cell.count > 1 && (
                      <Typography variant='caption' color='text.secondary' display='block'>
                        ×{cell.count} sessions
                      </Typography>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// TODO: remove once backend excludes Power from metrics by default
const HIDDEN_METRIC_NAMES = new Set(['Power'])

const ReportPanel = ({ panel, data, valueType }: Props) => {
  const filteredData: ReportData = {
    ...data,
    rows: data.rows.filter(r => !HIDDEN_METRIC_NAMES.has(r.name)),
  }

  return (
    <Card>
      <CardContent>
        {panel.type === 'table' ? (
          <TablePanel panel={panel} data={filteredData} valueType={valueType} />
        ) : (
          <ChartPanel panel={panel} data={filteredData} valueType={valueType} />
        )}
      </CardContent>
    </Card>
  )
}

export default ReportPanel
