import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

import CustomAvatar from '@core/components/mui/Avatar'
import type { ThemeColor } from '@core/types'

import type { RepMetricBroadcastData } from '@/types/app/assessmentTypes'

const COLORS: ThemeColor[] = ['primary', 'success', 'warning', 'error', 'secondary']

type ExpectedMetric = { conditionalMetricId: number; name: string }

type Props = {
  expectedMetrics: ExpectedMetric[]
  currentRepMetrics: RepMetricBroadcastData[]
}

const MetricsPanel = ({ expectedMetrics, currentRepMetrics }: Props) => {
  const valueMap = new Map(currentRepMetrics.map(m => [m.conditionalMetricId, m.value]))

  return (
    <Card className='h-full'>
      <CardHeader title='Metrics' />
      <CardContent className='flex flex-col gap-4'>
        {expectedMetrics.length === 0 && (
          <Typography color='text.secondary' variant='body2'>
            Metrics will appear after the first rep
          </Typography>
        )}
        {expectedMetrics.map((metric, index) => {
          const rawValue = valueMap.get(metric.conditionalMetricId)
          const display = rawValue !== undefined && rawValue !== null ? String(parseFloat(rawValue.toFixed(3))) : '—'
          const color = COLORS[index % COLORS.length]
          const letter = metric.name.charAt(0).toUpperCase()

          return (
            <div key={metric.conditionalMetricId} className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color={color}>
                {letter}
              </CustomAvatar>
              <div>
                <Typography variant='h5' color={`${color}.main`}>
                  {display}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {metric.name}
                </Typography>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default MetricsPanel
