'use client'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'

import { useForm, Controller } from 'react-hook-form'

import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { IntegrationType } from '@/types/app/integrationTypes'
import type { MetricType } from '@/types/app/metricTypes'

type FormData = {
  integrationId: number
  metricId: number
  name: string
  type: string
  content: string
}

type Props = {
  dataSource: DataSourceType
  integrations: IntegrationType[]
  metrics: MetricType[]
  dataSourceTypes: DictionaryEntry[]
}

const DataSourceEditForm = ({ dataSource, integrations, metrics, dataSourceTypes }: Props) => {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      integrationId: dataSource.integrationId,
      metricId: dataSource.metricId,
      name: dataSource.name ?? '',
      type: dataSource.type,
      content: dataSource.content ?? ''
    }
  })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/data-sources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dataSource.id, ...data })
    })

    if (res.ok) router.push('/data-sources')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader title={`Edit Data Source #${dataSource.id}`} />
        <CardContent className='flex flex-col gap-6'>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(errors.integrationId)}>
                <InputLabel>Integration</InputLabel>
                <Controller
                  name='integrationId'
                  control={control}
                  rules={{ validate: v => v !== 0 || 'Integration is required' }}
                  render={({ field }) => (
                    <Select {...field} label='Integration'>
                      {integrations.map(i => (
                        <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.integrationId && <FormHelperText>{errors.integrationId.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Name' />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(errors.type)}>
                <InputLabel>Type</InputLabel>
                <Controller
                  name='type'
                  control={control}
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <Select {...field} label='Type'>
                      {dataSourceTypes.map(t => (
                        <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='content'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Content'
                    multiline
                    rows={24}
                    placeholder='Paste JSON config, script, or mapping here…'
                    inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                  />
                )}
              />
            </Grid>
          </Grid>
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant='outlined' color='error' onClick={() => router.push('/data-sources')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

export default DataSourceEditForm
