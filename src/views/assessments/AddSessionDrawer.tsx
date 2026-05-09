'use client'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { SessionType } from '@/types/app/assessmentTypes'

type Props = {
  open: boolean
  assessmentId: number
  handleClose: () => void
  onCreated: (s: SessionType) => void
}

type FormData = { startTime: string }

const AddSessionDrawer = ({ open, assessmentId, handleClose, onCreated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { startTime: '' } })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId, startTime: data.startTime })
    })
    if (res.ok) { onCreated(await res.json()); reset(); handleClose() }
  }

  const handleReset = () => { reset(); handleClose() }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleReset} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Session</Typography>
        <IconButton size='small' onClick={handleReset}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='startTime'
              control={control}
              rules={{ required: 'Start time is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Start Time'
                  type='datetime-local'
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.startTime)}
                  helperText={errors.startTime?.message}
                />
              )}
            />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Add'}</Button>
              <Button variant='outlined' color='error' onClick={handleReset}>Discard</Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddSessionDrawer
