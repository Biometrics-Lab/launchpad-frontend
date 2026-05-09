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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { ModelType } from '@/types/app/modelTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

type Props = {
  open: boolean
  model: ModelType | null
  sports: DictionaryEntry[]
  ageGroups: DictionaryEntry[]
  handleClose: () => void
  onUpdated: (model: ModelType) => void
}

type FormData = {
  sport: string
  ageGroup: string
  description: string
}

const EditModelDrawer = ({ open, model, sports, ageGroups, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { sport: '', ageGroup: '', description: '' } })

  useEffect(() => {
    if (model) reset({ sport: model.sport, ageGroup: model.ageGroup, description: model.description ?? '' })
  }, [model, reset])

  const onSubmit = async (data: FormData) => {
    if (!model) return

    const res = await fetch('/api/models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: model.id, ...data })
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
        <Typography variant='h5'>Edit Model</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
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
            <FormControl fullWidth error={Boolean(errors.ageGroup)}>
              <InputLabel>Age Group</InputLabel>
              <Controller
                name='ageGroup'
                control={control}
                rules={{ required: 'Age Group is required' }}
                render={({ field }) => (
                  <Select {...field} label='Age Group'>
                    {ageGroups.map(ag => (
                      <MenuItem key={ag.name} value={ag.name}>{ag.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.ageGroup && <FormHelperText>{errors.ageGroup.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Description' multiline rows={3} />
              )}
            />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
              <Button variant='outlined' color='error' onClick={handleClose}>
                Discard
              </Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default EditModelDrawer
