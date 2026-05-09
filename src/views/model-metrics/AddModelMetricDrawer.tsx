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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { ModelMetricType, ModelType } from '@/types/app/modelTypes'
import type { MetricType } from '@/types/app/metricTypes'

type Props = {
  open: boolean
  models: ModelType[]
  metrics: MetricType[]
  handleClose: () => void
  onCreated: (mm: ModelMetricType) => void
}

type FormData = {
  modelId: number
  metricId: number
  value: string
}

const AddModelMetricDrawer = ({ open, models, metrics, handleClose, onCreated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { modelId: 0, metricId: 0, value: '' } })

  const onSubmit = async (data: FormData) => {
    const body: Record<string, unknown> = { modelId: data.modelId, metricId: data.metricId }

    if (data.value !== '') body.value = Number(data.value)

    const res = await fetch('/api/model-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      onCreated(await res.json())
      reset()
      handleClose()
    }
  }

  const handleReset = () => {
    reset()
    handleClose()
  }

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
        <Typography variant='h5'>Add Model Metric</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.modelId)}>
              <InputLabel>Model</InputLabel>
              <Controller
                name='modelId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Model is required' }}
                render={({ field }) => (
                  <Select {...field} label='Model'>
                    {models.map(m => (
                      <MenuItem key={m.id} value={m.id}>
                        #{m.id} — {m.sport} / {m.ageGroup}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.modelId && <FormHelperText>{errors.modelId.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={Boolean(errors.metricId)}>
              <InputLabel>Metric</InputLabel>
              <Controller
                name='metricId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Metric is required' }}
                render={({ field }) => (
                  <Select {...field} label='Metric'>
                    {metrics.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.metricId && <FormHelperText>{errors.metricId.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='value'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Value (optional)'
                  type='number'
                  inputProps={{ step: 'any' }}
                />
              )}
            />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Add'}
              </Button>
              <Button variant='outlined' color='error' onClick={handleReset}>
                Discard
              </Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddModelMetricDrawer
