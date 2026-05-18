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

import type { RepMetricSourceType, RepMetricType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'

type Props = {
  open: boolean
  repMetricSource: RepMetricSourceType | null
  repMetrics: RepMetricType[]
  conditionalMetrics: ConditionalMetricType[]
  dataSources: DataSourceType[]
  handleClose: () => void
  onUpdated: (rms: RepMetricSourceType) => void
}

type FormData = { repMetricId: number; dataSourceId: number; description: string }

const EditRepMetricSourceDrawer = ({ open, repMetricSource, repMetrics, conditionalMetrics, dataSources, handleClose, onUpdated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { repMetricId: 0, dataSourceId: 0, description: '' } })

  const conditionalMetricMap = Object.fromEntries(conditionalMetrics.map(cm => [cm.id, cm.name]))

  useEffect(() => {
    if (repMetricSource) reset({ repMetricId: repMetricSource.repMetricId, dataSourceId: repMetricSource.dataSourceId, description: repMetricSource.description ?? '' })
  }, [repMetricSource, reset])

  const onSubmit = async (data: FormData) => {
    if (!repMetricSource) return
    const body: Record<string, unknown> = { id: repMetricSource.id, repMetricId: data.repMetricId, dataSourceId: data.dataSourceId }
    if (data.description !== '') body.description = data.description
    const res = await fetch('/api/rep-metric-sources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) { onUpdated(await res.json()); handleClose() }
  }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleClose} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Edit Rep Metric Source</Typography>
        <IconButton size='small' onClick={handleClose}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.repMetricId)}>
              <InputLabel>Rep Metric</InputLabel>
              <Controller name='repMetricId' control={control} rules={{ validate: v => v !== 0 || 'Rep Metric is required' }} render={({ field }) => (
                <Select {...field} label='Rep Metric'>
                  {repMetrics.map(rm => (
                    <MenuItem key={rm.id} value={rm.id}>{conditionalMetricMap[rm.conditionalMetricId] ?? `Metric #${rm.conditionalMetricId}`}</MenuItem>
                  ))}
                </Select>
              )} />
              {errors.repMetricId && <FormHelperText>{errors.repMetricId.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={Boolean(errors.dataSourceId)}>
              <InputLabel>Data Source</InputLabel>
              <Controller name='dataSourceId' control={control} rules={{ validate: v => v !== 0 || 'Data Source is required' }} render={({ field }) => (
                <Select {...field} label='Data Source'>
                  {dataSources.map(ds => <MenuItem key={ds.id} value={ds.id}>{ds.name}</MenuItem>)}
                </Select>
              )} />
              {errors.dataSourceId && <FormHelperText>{errors.dataSourceId.message}</FormHelperText>}
            </FormControl>
            <Controller name='description' control={control} render={({ field }) => (
              <TextField {...field} fullWidth label='Description (optional)' />
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

export default EditRepMetricSourceDrawer
