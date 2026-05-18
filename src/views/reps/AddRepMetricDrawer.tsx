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

import type { RepMetricType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'

type Props = {
  open: boolean
  repId: number
  conditionalMetrics: ConditionalMetricType[]
  handleClose: () => void
  onCreated: (rm: RepMetricType) => void
}

type FormData = { conditionalMetricId: number; value: string }

const AddRepMetricDrawer = ({ open, repId, conditionalMetrics, handleClose, onCreated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { conditionalMetricId: 0, value: '' } })

  const onSubmit = async (data: FormData) => {
    const body: Record<string, unknown> = { repId, conditionalMetricId: data.conditionalMetricId }
    if (data.value !== '') body.value = Number(data.value)
    const res = await fetch('/api/rep-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) { onCreated(await res.json()); reset(); handleClose() }
  }

  const handleReset = () => { reset(); handleClose() }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleReset} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Rep Metric</Typography>
        <IconButton size='small' onClick={handleReset}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.conditionalMetricId)}>
              <InputLabel>Conditional Metric</InputLabel>
              <Controller name='conditionalMetricId' control={control} rules={{ validate: v => v !== 0 || 'Conditional Metric is required' }} render={({ field }) => (
                <Select {...field} label='Conditional Metric'>{conditionalMetrics.map(cm => <MenuItem key={cm.id} value={cm.id}>{cm.name}</MenuItem>)}</Select>
              )} />
              {errors.conditionalMetricId && <FormHelperText>{errors.conditionalMetricId.message}</FormHelperText>}
            </FormControl>
            <Controller name='value' control={control} render={({ field }) => (
              <TextField {...field} fullWidth label='Value (optional)' type='number' inputProps={{ step: 'any' }} />
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

export default AddRepMetricDrawer
