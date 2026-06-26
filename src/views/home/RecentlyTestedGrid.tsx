import Typography from '@mui/material/Typography'
import type { RecentPlayerEntry } from '@/types/app/dashboardTypes'
import PlayerSessionCard from './PlayerSessionCard'

type Props = { entries: RecentPlayerEntry[] }

const RecentlyTestedGrid = ({ entries }: Props) => {
  if (entries.length === 0) {
    return (
      <Typography color='text.secondary' className='text-center py-8'>
        No completed sessions yet
      </Typography>
    )
  }

  return (
    <div>
      <Typography variant='h6' className='mb-4'>
        Recently Tested
      </Typography>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {entries.map(entry => (
          <PlayerSessionCard key={entry.player.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

export default RecentlyTestedGrid
