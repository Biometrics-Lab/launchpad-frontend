import { notFound } from 'next/navigation'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import ModelMetricsTable from '@views/models/ModelMetricsTable'
import type { ModelType, ModelMetricType } from '@/types/app/modelTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getModel(id: string): Promise<ModelType | null> {
  try {
    const res = await fetch(`${API_BASE}/models/${id}`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : null
  } catch { return null }
}

async function getModelMetrics(modelId: string): Promise<ModelMetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/modelMetrics`, { headers: HEADERS, cache: 'no-store' })

    if (!res.ok) return []
    const all: ModelMetricType[] = await res.json()

    return all.filter(mm => mm.modelId === Number(modelId))
  } catch { return [] }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

type Props = { params: Promise<{ id: string }> }

const ModelDetailPage = async ({ params }: Props) => {
  const { id } = await params
  const [model, modelMetrics, metrics] = await Promise.all([
    getModel(id),
    getModelMetrics(id),
    getMetrics()
  ])

  if (!model) notFound()

  return (
    <div className='flex flex-col gap-6'>
      <Link href='/models' className='flex items-center gap-1 text-primary w-fit'>
        <i className='ri-arrow-left-s-line text-xl' />
        <Typography color='primary'>Models</Typography>
      </Link>
      <Card>
        <CardContent className='flex flex-col gap-3'>
          <div className='flex items-center gap-3 flex-wrap'>
            <Typography variant='h5'>Model #{model.id}</Typography>
            <Chip label={model.sport} color='primary' variant='outlined' size='small' />
            <Chip label={model.ageGroup} color='secondary' variant='outlined' size='small' />
          </div>
          {model.description && (
            <Typography color='text.secondary'>{model.description}</Typography>
          )}
        </CardContent>
      </Card>
      <ModelMetricsTable
        modelId={model.id}
        modelMetrics={modelMetrics}
        metrics={metrics}
      />
    </div>
  )
}

export default ModelDetailPage
