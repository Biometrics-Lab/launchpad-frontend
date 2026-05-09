'use client'

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
  session1Id: number
  handleClose: () => void
  onCreated: (r: RepType) => void
}

type FormData = { startTime: string }

const AddRepDrawer = ({ open, session1Id, handleClose, onCreated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { startTime: '' } })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session1Id, startTime: data.startTime })
    })
    if (res.ok) { onCreated(await res.json()); reset(); handleClose() }
  }

  const handleReset = () => { reset(); handleClose() }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleReset} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Rep</Typography>
        <IconButton size='small' onClick={handleReset}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller name='startTime' control={control} rules={{ required: 'Start time is required' }} render={({ field }) => (
              <TextField {...field} fullWidth label='Start Time' type='datetime-local' InputLabelProps={{ shrink: true }} error={Boolean(errors.startTime)} helperText={errors.startTime?.message} />
            )} />
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

export default AddRepDrawer
