'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

import type { RepBroadcastDto } from '@/types/app/assessmentTypes'

type Props = {
  reps: RepBroadcastDto[]
  currentRepId: number | null
  onRepSelect: (repId: number) => void
}

const RepListPanel = ({ reps, currentRepId, onRepSelect }: Props) => {
  const reversed = [...reps].reverse()

  return (
    <Card className='h-full'>
      <CardHeader title={`Reps · ${reps.length}`} />
      {reps.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 pbs-4 pbe-6'>
          <CircularProgress size={24} />
          <Typography variant='body2' color='text.secondary'>
            Waiting for first rep…
          </Typography>
        </div>
      ) : (
        <List dense disablePadding>
          {reversed.map(rep => {
            const isCurrent = rep.id === currentRepId
            const firstMetric = rep.metrics[0]

            return (
              <ListItemButton
                key={rep.id}
                selected={isCurrent}
                onClick={() => onRepSelect(rep.id)}
                sx={isCurrent ? { borderLeft: '3px solid', borderColor: 'primary.main', alignItems: 'center' } : { alignItems: 'center' }}
              >
                <ListItemText
                  primary={
                    <Typography variant='body2' fontWeight={isCurrent ? 600 : 400}>
                      Rep {rep.repNumber ?? rep.id}
                    </Typography>
                  }
                  secondary={
                    firstMetric
                      ? `${firstMetric.name}: ${firstMetric.value ?? '—'}`
                      : undefined
                  }
                />
                {isCurrent && (
                  <Chip label='current' variant='tonal' color='primary' size='small' />
                )}
              </ListItemButton>
            )
          })}
        </List>
      )}
    </Card>
  )
}

export default RepListPanel
