import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { DashboardKpi } from '@/types/app/dashboardTypes'

type KpiItem = {
  icon: string
  label: string
  value: number
  color?: string
}

type Props = { kpi: DashboardKpi }

const DashboardKpiRow = ({ kpi }: Props) => {
  const items: KpiItem[] = [
    { icon: 'ri-group-line', label: 'Players', value: kpi.playerCount },
    { icon: 'ri-shield-star-line', label: 'Teams', value: kpi.teamCount },
    { icon: 'ri-clipboard-line', label: 'Assessments', value: kpi.assessmentCount },
    { icon: 'ri-live-line', label: 'Active Now', value: kpi.activeSessionCount, color: 'success.main' },
  ]

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
      {items.map(item => (
        <Card key={item.label}>
          <CardContent className='flex items-center gap-4'>
            <div className='flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10'>
              <i className={`${item.icon} text-xl text-primary`} />
            </div>
            <div>
              <Typography variant='h5' color={item.color ?? 'text.primary'}>
                {item.value}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {item.label}
              </Typography>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default DashboardKpiRow
