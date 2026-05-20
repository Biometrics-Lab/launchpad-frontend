'use client'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { PlayerType } from '@/types/app/playersTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { ConditionType } from '@/types/app/conditionTypes'

type Props = {
  open: boolean
  players: PlayerType[]
  sports: DictionaryEntry[]
  templates: AssessmentTemplateType[]
  conditions: ConditionType[]
  handleClose: () => void
  onCreated: (a: AssessmentType) => void
}

type FormData = {
  playerId: number
  sport: string
  templateId: number
  conditionId: number
  allowExternalUrls: boolean
}

const AddAssessmentDrawer = ({ open, players, sports, templates, conditions, handleClose, onCreated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { playerId: 0, sport: '', templateId: 0, conditionId: 0, allowExternalUrls: false } })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, conditionId: data.conditionId || null })
    })
    if (res.ok) {
      onCreated(await res.json())
      reset()
      handleClose()
    }
  }

  const handleReset = () => { reset(); handleClose() }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Assessment</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.playerId)}>
              <InputLabel>Player</InputLabel>
              <Controller
                name='playerId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Player is required' }}
                render={({ field }) => (
                  <Select {...field} label='Player'>
                    {players.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.playerId && <FormHelperText>{errors.playerId.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={Boolean(errors.sport)}>
              <InputLabel>Sport</InputLabel>
              <Controller
                name='sport'
                control={control}
                rules={{ required: 'Sport is required' }}
                render={({ field }) => (
                  <Select {...field} label='Sport'>
                    {sports.map(s => (
                      <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.sport && <FormHelperText>{errors.sport.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={Boolean(errors.templateId)}>
              <InputLabel>Template</InputLabel>
              <Controller
                name='templateId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Template is required' }}
                render={({ field }) => (
                  <Select {...field} label='Template'>
                    {templates.map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.templateId && <FormHelperText>{errors.templateId.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Controller
                name='conditionId'
                control={control}
                render={({ field }) => (
                  <Select {...field} label='Condition'>
                    <MenuItem value={0}>None</MenuItem>
                    {conditions.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <Controller
              name='allowExternalUrls'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label='Allow external URLs'
                />
              )}
            />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Add'}
              </Button>
              <Button variant='outlined' color='error' onClick={handleReset}>Discard</Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddAssessmentDrawer
