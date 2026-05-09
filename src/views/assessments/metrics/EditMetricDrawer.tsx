'use client'

import { useEffect } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { MetricType } from '@/types/app/metricTypes'
import type { MeasurementType } from '@/types/app/assessmentTypes'

type Props = {
  open: boolean
  metric: MetricType | null
  measurements: MeasurementType[]
  handleClose: () => void
  onUpdated: (metric: MetricType) => void
}

type FormData = {
  name: string
  measurementId: number
  negate: boolean
}

const EditMetricDrawer = ({ open, metric, measurements, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { name: '', measurementId: 0, negate: false } })

  useEffect(() => {
    if (metric) reset({ name: metric.name, measurementId: metric.measurementId, negate: metric.negate })
  }, [metric, reset])

  const onSubmit = async (data: FormData) => {
    if (!metric) return

    const res = await fetch('/api/metrics', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: metric.id, ...data })
    })

    if (res.ok) {
      const updated: MetricType = await res.json()

      onUpdated(updated)
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
        <Typography variant='h5'>Edit Metric</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='name'
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Name'
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
            <FormControl fullWidth error={Boolean(errors.measurementId)}>
              <InputLabel>Measurement</InputLabel>
              <Controller
                name='measurementId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Measurement is required' }}
                render={({ field }) => (
                  <Select {...field} label='Measurement'>
                    {measurements.map(m => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.measurementId && <FormHelperText>{errors.measurementId.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='negate'
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} />} label='Negate' />
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

export default EditMetricDrawer
