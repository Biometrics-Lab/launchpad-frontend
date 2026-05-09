'use client'

import { useEffect } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType } from '@/types/app/assessmentTemplateTypes'
import type { PlayerType } from '@/types/app/playersTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

type Props = {
  open: boolean
  assessment: AssessmentType | null
  players: PlayerType[]
  sports: DictionaryEntry[]
  templates: AssessmentTemplateType[]
  handleClose: () => void
  onUpdated: (a: AssessmentType) => void
}

type FormData = {
  playerId: number
  sport: string
  templateId: number
}

const EditAssessmentDrawer = ({ open, assessment, players, sports, templates, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { playerId: 0, sport: '', templateId: 0 } })

  useEffect(() => {
    if (assessment) reset({ playerId: assessment.playerId, sport: assessment.sport, templateId: assessment.templateId })
  }, [assessment, reset])

  const onSubmit = async (data: FormData) => {
    if (!assessment) return
    const res = await fetch('/api/assessments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: assessment.id, ...data })
    })
    if (res.ok) {
      onUpdated(await res.json())
      handleClose()
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Edit Assessment</Typography>
        <IconButton size='small' onClick={handleClose}>
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
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
              <Button variant='outlined' color='error' onClick={handleClose}>Discard</Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default EditAssessmentDrawer
