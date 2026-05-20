'use client'

import { useEffect } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { RepType } from '@/types/app/assessmentTypes'

type Props = {
  open: boolean
  rep: RepType | null
  handleClose: () => void
  onUpdated: (r: RepType) => void
}

type FormData = { startTime: string }

const EditRepDrawer = ({ open, rep, handleClose, onUpdated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { startTime: '' } })

  useEffect(() => {
    if (rep) reset({ startTime: rep.startTime ? rep.startTime.slice(0, 16) : '' })
  }, [rep, reset])

  const onSubmit = async (data: FormData) => {
    if (!rep) return
    const res = await fetch('/api/reps', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rep.id, sessionId: rep.sessionId, startTime: data.startTime })
    })
    if (res.ok) { onUpdated(await res.json()); handleClose() }
  }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleClose} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Edit Rep</Typography>
        <IconButton size='small' onClick={handleClose}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller name='startTime' control={control} rules={{ required: 'Start time is required' }} render={({ field }) => (
              <TextField {...field} fullWidth label='Start Time' type='datetime-local' InputLabelProps={{ shrink: true }} error={Boolean(errors.startTime)} helperText={errors.startTime?.message} />
            )} />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
              <Button variant='outlined' color='error' onClick={handleClose}>Discard</Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default EditRepDrawer
