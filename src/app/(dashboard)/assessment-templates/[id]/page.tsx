import { notFound } from 'next/navigation'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import TemplateMetricsTable from '@views/assessment-templates/TemplateMetricsTable'
import type { AssessmentTemplateType, TemplateMetricType } from '@/types/app/assessmentTemplateTypes'
import type { MetricType } from '@/types/app/metricTypes'
import type { DataSourceType } from '@/types/app/dataSourceTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getTemplate(id: string): Promise<AssessmentTemplateType | null> {
  try {
    const res = await fetch(`${API_BASE}/assessmentTemplates/${id}`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : null
  } catch { return null }
}

async function getTemplateMetrics(templateId: string): Promise<TemplateMetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/templateMetrics`, { headers: HEADERS, cache: 'no-store' })

    if (!res.ok) return []
    const all: TemplateMetricType[] = await res.json()

    return all.filter(tm => tm.templateId === Number(templateId))
  } catch { return [] }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getDataSources(): Promise<DataSourceType[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSources`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

type Props = { params: Promise<{ id: string }> }

const AssessmentTemplateDetailPage = async ({ params }: Props) => {
  const { id } = await params
  const [template, templateMetrics, metrics, dataSources] = await Promise.all([
    getTemplate(id),
    getTemplateMetrics(id),
    getMetrics(),
    getDataSources()
  ])

  if (!template) notFound()

  return (
    <div className='flex flex-col gap-6'>
      <Link href='/assessment-templates' className='flex items-center gap-1 text-primary w-fit'>
        <i className='ri-arrow-left-s-line text-xl' />
        <Typography color='primary'>Assessment Templates</Typography>
      </Link>
      <Card>
        <CardContent className='flex flex-col gap-3'>
          <div className='flex items-center gap-3 flex-wrap'>
            <Typography variant='h5'>{template.name}</Typography>
            <Chip label={template.sport} color='primary' variant='outlined' size='small' />
          </div>
          {template.description && (
            <Typography color='text.secondary'>{template.description}</Typography>
          )}
        </CardContent>
      </Card>
      <TemplateMetricsTable
        templateId={template.id}
        templateMetrics={templateMetrics}
        metrics={metrics}
        dataSources={dataSources}
      />
    </div>
  )
}

export default AssessmentTemplateDetailPage
