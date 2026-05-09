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
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { AssessmentMetricType } from '@/types/app/assessmentTypes'
import type { MetricType } from '@/types/app/metricTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'

type Props = {
  open: boolean
  assessmentId: number
  metrics: MetricType[]
  dataSources: DataSourceType[]
  handleClose: () => void
  onCreated: (am: AssessmentMetricType) => void
}

type FormData = { metricId: number; sourceId: number }

const AddAssessmentMetricDrawer = ({ open, assessmentId, metrics, dataSources, handleClose, onCreated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { metricId: 0, sourceId: 0 } })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/assessment-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId, ...data })
    })
    if (res.ok) { onCreated(await res.json()); reset(); handleClose() }
  }

  const handleReset = () => { reset(); handleClose() }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleReset} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Assessment Metric</Typography>
        <IconButton size='small' onClick={handleReset}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.metricId)}>
              <InputLabel>Metric</InputLabel>
              <Controller
                name='metricId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Metric is required' }}
                render={({ field }) => (
                  <Select {...field} label='Metric'>
                    {metrics.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
                )}
              />
              {errors.metricId && <FormHelperText>{errors.metricId.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={Boolean(errors.sourceId)}>
              <InputLabel>Data Source</InputLabel>
              <Controller
                name='sourceId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Data Source is required' }}
                render={({ field }) => (
                  <Select {...field} label='Data Source'>
                    {dataSources.map(ds => <MenuItem key={ds.id} value={ds.id}>{ds.name}</MenuItem>)}
                  </Select>
                )}
              />
              {errors.sourceId && <FormHelperText>{errors.sourceId.message}</FormHelperText>}
            </FormControl>
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

export default AddAssessmentMetricDrawer
