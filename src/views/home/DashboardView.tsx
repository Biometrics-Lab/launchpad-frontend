import type { DashboardKpi, RecentPlayerEntry } from '@/types/app/dashboardTypes'
import DashboardKpiRow from './DashboardKpiRow'
import RecentlyTestedGrid from './RecentlyTestedGrid'

type Props = {
  kpi: DashboardKpi
  entries: RecentPlayerEntry[]
}

const DashboardView = ({ kpi, entries }: Props) => (
  <div className='flex flex-col gap-6'>
    <DashboardKpiRow kpi={kpi} />
    <RecentlyTestedGrid entries={entries} />
  </div>
)

export default DashboardView
