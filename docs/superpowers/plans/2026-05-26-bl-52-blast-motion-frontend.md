# BL-52 Blast Motion Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove deleted Integration and RepMetricSource entities from the frontend, update DataSource/RepMetric/Rep types, and add Start/Stop session controls.

**Architecture:** Seven sequential tasks with TypeScript compilation as the verification mechanism after each. Tasks 1–5 are cleanup/type work; Tasks 6–7 add the new Start/Stop feature. No test framework exists in this project — `npx tsc --noEmit` serves as the pass/fail gate.

---

## File Map

| Action | File |
|---|---|
| Modify | `src/types/app/dataSourceTypes.ts` |
| Modify | `src/types/app/assessmentTypes.ts` |
| Modify | `src/views/data-sources/AddDataSourceDrawer.tsx` |
| Modify | `src/views/data-sources/EditDataSourceDrawer.tsx` |
| Modify | `src/views/data-sources/DataSourceEditForm.tsx` |
| Modify | `src/views/data-sources/DataSourcesTable.tsx` |
| Modify | `src/app/(dashboard)/data-sources/page.tsx` |
| Modify | `src/app/(dashboard)/data-sources/[id]/page.tsx` |
| Delete | `src/app/(dashboard)/integrations/page.tsx` |
| Delete | `src/app/api/integrations/route.ts` |
| Delete | `src/app/api/integrations/[id]/route.ts` |
| Delete | `src/app/api/rep-metric-sources/route.ts` |
| Delete | `src/app/api/rep-metric-sources/[id]/route.ts` |
| Delete | `src/views/integrations/IntegrationsTable.tsx` |
| Delete | `src/views/integrations/AddIntegrationDrawer.tsx` |
| Delete | `src/views/integrations/EditIntegrationDrawer.tsx` |
| Delete | `src/views/reps/RepMetricSourcesTable.tsx` |
| Delete | `src/views/reps/AddRepMetricSourceDrawer.tsx` |
| Delete | `src/views/reps/EditRepMetricSourceDrawer.tsx` |
| Delete | `src/types/app/integrationTypes.ts` |
| Modify | `src/components/layout/vertical/VerticalMenu.tsx` |
| Modify | `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/reps/[repId]/page.tsx` |
| Modify | `src/views/sessions/RepsTable.tsx` |
| Modify | `src/views/reps/RepMetricsTable.tsx` |
| Create | `src/app/api/sessions/[id]/start/route.ts` |
| Create | `src/app/api/sessions/[id]/stop/route.ts` |
| Create | `src/views/sessions/SessionStartStopButtons.tsx` |
| Modify | `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx` |

---

## Task 1: Update types

**Files:**
- Modify: `src/types/app/dataSourceTypes.ts`
- Modify: `src/types/app/assessmentTypes.ts`

- [ ] **Step 1: Replace `src/types/app/dataSourceTypes.ts`**

Remove `integrationId` from `DataSourceType`:

```ts
export type DataSourceType = { id: number; metricId: number; name?: string; type: string; content?: string }
```

- [ ] **Step 2: Replace `src/types/app/assessmentTypes.ts`**

Remove `RepMetricSourceType`, add `repNumber` to `RepType`, add `dataSourceId` to `RepMetricType`, fix `SessionType.status` union:

```ts
export type MeasurementType = {
  id: number
  name: string
}

export type AssessmentType = { id: number; playerId: number; sport: string; templateId: number; conditionId?: number; allowExternalUrls: boolean }
export type SessionType = { id: number; assessmentId: number; startTime: string; status?: 'ACTIVE' | 'STOPPED' | null }
export type RepType = { id: number; sessionId: number; startTime: string; repNumber?: number }
export type AssessmentMetricType = { id: number; assessmentId: number; conditionalMetricId: number; sourceId: number; description?: string; minValue?: number; maxValue?: number; avgValue?: number }
export type SessionMetricType = { id: number; sessionId: number; conditionalMetricId: number; minValue?: number; maxValue?: number; avgValue?: number }
export type RepMetricType = { id: number; repId: number; conditionalMetricId: number; value?: number; dataSourceId?: number | null }
export type UrlStatus = 'PENDING' | 'READY' | 'FAILED'
export type AssessmentResourceType = { id: number; assessmentId: number; type: string; url: string; externalUrl?: string; urlStatus?: UrlStatus }
export type SessionResourceType = { id: number; sessionId: number; type: string; url: string; externalUrl?: string; urlStatus?: UrlStatus }
export type RepResourceType = { id: number; repId: number; type: string; url: string; externalUrl?: string; urlStatus?: UrlStatus }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in files that still reference `integrationId`, `RepMetricSourceType`, or `integrations` prop — those will be fixed in Task 2.

---

## Task 2: Clean up DataSource components

Remove all `integrationId` and `integrations` references from DataSource views and pages.

**Files:**
- Modify: `src/views/data-sources/AddDataSourceDrawer.tsx`
- Modify: `src/views/data-sources/EditDataSourceDrawer.tsx`
- Modify: `src/views/data-sources/DataSourceEditForm.tsx`
- Modify: `src/views/data-sources/DataSourcesTable.tsx`
- Modify: `src/app/(dashboard)/data-sources/page.tsx`
- Modify: `src/app/(dashboard)/data-sources/[id]/page.tsx`

- [ ] **Step 1: Replace `src/views/data-sources/AddDataSourceDrawer.tsx`**

```tsx
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

import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { MetricType } from '@/types/app/metricTypes'

type Props = {
  open: boolean
  metrics: MetricType[]
  dataSourceTypes: DictionaryEntry[]
  handleClose: () => void
  onCreated: (ds: DataSourceType) => void
}

type FormData = {
  metricId: number
  name: string
  type: string
  content: string
}

const AddDataSourceDrawer = ({ open, metrics, dataSourceTypes, handleClose, onCreated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { metricId: 0, name: '', type: '', content: '' } })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 480 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Data Source</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
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
                    {metrics.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.metricId && <FormHelperText>{errors.metricId.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Name' />
              )}
            />
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
            <Controller
              name='content'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Content'
                  multiline
                  rows={12}
                  placeholder='Paste JSON config, script, or mapping here…'
                  inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
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

export default AddDataSourceDrawer
```

- [ ] **Step 2: Replace `src/views/data-sources/EditDataSourceDrawer.tsx`**

```tsx
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

import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { MetricType } from '@/types/app/metricTypes'

type Props = {
  open: boolean
  dataSource: DataSourceType | null
  metrics: MetricType[]
  dataSourceTypes: DictionaryEntry[]
  handleClose: () => void
  onUpdated: (ds: DataSourceType) => void
}

type FormData = {
  metricId: number
  name: string
  type: string
}

const EditDataSourceDrawer = ({ open, dataSource, metrics, dataSourceTypes, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { metricId: 0, name: '', type: '' } })

  useEffect(() => {
    if (dataSource) {
      reset({
        metricId: dataSource.metricId,
        name: dataSource.name ?? '',
        type: dataSource.type
      })
    }
  }, [dataSource, reset])

  const onSubmit = async (data: FormData) => {
    if (!dataSource) return

    const res = await fetch('/api/data-sources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dataSource.id, content: dataSource.content, ...data })
    })

    if (res.ok) {
      onUpdated(await res.json())
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 480 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Edit Data Source</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
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
                    {metrics.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.metricId && <FormHelperText>{errors.metricId.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Name' />
              )}
            />
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
            <TextField
              fullWidth
              label='Content'
              multiline
              rows={6}
              value={dataSource?.content ?? ''}
              InputProps={{ readOnly: true }}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
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

export default EditDataSourceDrawer
```

- [ ] **Step 3: Replace `src/views/data-sources/DataSourceEditForm.tsx`**

```tsx
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
import type { MetricType } from '@/types/app/metricTypes'

type FormData = {
  metricId: number
  name: string
  type: string
  content: string
}

type Props = {
  dataSource: DataSourceType
  metrics: MetricType[]
  dataSourceTypes: DictionaryEntry[]
}

const DataSourceEditForm = ({ dataSource, metrics, dataSourceTypes }: Props) => {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
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
```

- [ ] **Step 4: Update `src/views/data-sources/DataSourcesTable.tsx`**

Make these targeted changes:
1. Remove `import type { IntegrationType } from '@/types/app/integrationTypes'`
2. Remove `integrations: IntegrationType[]` from `Props` type
3. Remove `integrations` from component destructuring parameters
4. Remove the `integrationMap` `useMemo` block entirely
5. Remove the `columnHelper.accessor('integrationId', ...)` column from the `columns` array
6. Change the `columns` memo dependency array from `[integrationMap, metricMap]` to `[metricMap]`
7. Remove `integrations={integrations}` prop from both `<AddDataSourceDrawer>` and `<EditDataSourceDrawer>` JSX

- [ ] **Step 5: Replace `src/app/(dashboard)/data-sources/page.tsx`**

```tsx
import DataSourcesTable from '@views/data-sources/DataSourcesTable'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getDataSources(): Promise<DataSourceType[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSources`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getDataSourceTypes(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSourceTypeDictionaries`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

const DataSourcesPage = async () => {
  const [dataSources, metrics, dataSourceTypes] = await Promise.all([
    getDataSources(),
    getMetrics(),
    getDataSourceTypes()
  ])

  return <DataSourcesTable dataSources={dataSources} metrics={metrics} dataSourceTypes={dataSourceTypes} />
}

export default DataSourcesPage
```

- [ ] **Step 6: Replace `src/app/(dashboard)/data-sources/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Typography from '@mui/material/Typography'

import DataSourceEditForm from '@views/data-sources/DataSourceEditForm'
import type { DataSourceType } from '@/types/app/dataSourceTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'
import type { MetricType } from '@/types/app/metricTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getDataSource(id: string): Promise<DataSourceType | null> {
  try {
    const res = await fetch(`${API_BASE}/dataSources/${id}`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getMetrics(): Promise<MetricType[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getDataSourceTypes(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/dataSourceTypeDictionaries`, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : []
  } catch { return [] }
}

type Props = { params: Promise<{ id: string }> }

const EditDataSourcePage = async ({ params }: Props) => {
  const { id } = await params
  const [dataSource, metrics, dataSourceTypes] = await Promise.all([
    getDataSource(id),
    getMetrics(),
    getDataSourceTypes()
  ])

  if (!dataSource) notFound()

  return (
    <div className='flex flex-col gap-6'>
      <Link href='/data-sources' className='flex items-center gap-1 text-primary w-fit'>
        <i className='ri-arrow-left-s-line text-xl' />
        <Typography color='primary'>Data Sources</Typography>
      </Link>
      <DataSourceEditForm
        dataSource={dataSource}
        metrics={metrics}
        dataSourceTypes={dataSourceTypes}
      />
    </div>
  )
}

export default EditDataSourcePage
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in files that still reference `integrationId` or `RepMetricSourceType` (Integration/RepMetricSource files themselves). No errors in DataSource files.

---

## Task 3: Delete Integration files and nav item

**Files:**
- Delete: 10 Integration-related files
- Modify: `src/components/layout/vertical/VerticalMenu.tsx`

- [ ] **Step 1: Delete Integration files**

```bash
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/app/(dashboard)/integrations/page.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/integrations/route.ts
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/integrations/[id]/route.ts
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/views/integrations/IntegrationsTable.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/views/integrations/AddIntegrationDrawer.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/views/integrations/EditIntegrationDrawer.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/types/app/integrationTypes.ts
rmdir /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/integrations 2>/dev/null || true
rmdir /Users/romanvakulenko/biolab/launchpad-frontend/src/app/(dashboard)/integrations 2>/dev/null || true
rmdir /Users/romanvakulenko/biolab/launchpad-frontend/src/views/integrations 2>/dev/null || true
```

- [ ] **Step 2: Remove Integrations nav item from `src/components/layout/vertical/VerticalMenu.tsx`**

Remove this line (currently around line 87):
```tsx
<MenuItem href='/integrations'>Integrations</MenuItem>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in RepMetricSource-related files. No Integration errors.

---

## Task 4: Remove RepMetricSource from rep detail page and delete files

**Files:**
- Modify: `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/reps/[repId]/page.tsx`
- Delete: `src/views/reps/RepMetricSourcesTable.tsx`, `AddRepMetricSourceDrawer.tsx`, `EditRepMetricSourceDrawer.tsx`
- Delete: `src/app/api/rep-metric-sources/route.ts`, `src/app/api/rep-metric-sources/[id]/route.ts`

- [ ] **Step 1: Replace `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/reps/[repId]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'

import Link from 'next/link'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import RepMetricsTable from '@views/reps/RepMetricsTable'
import RepResourcesTable from '@views/reps/RepResourcesTable'
import type { RepType, RepMetricType, RepResourceType } from '@/types/app/assessmentTypes'
import type { ConditionalMetricType } from '@/types/app/conditionTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
    return res.ok ? res.json() : fallback
  } catch { return fallback }
}

type Props = { params: Promise<{ id: string; sessionId: string; repId: string }> }

const RepDetailPage = async ({ params }: Props) => {
  const { id, sessionId, repId } = await params

  const [
    rep,
    allRepMetrics,
    allRepResources,
    conditionalMetrics,
    resourceTypes
  ] = await Promise.all([
    fetchJson<RepType | null>(`${API_BASE}/reps/${repId}`, null),
    fetchJson<RepMetricType[]>(`${API_BASE}/repMetrics`, []),
    fetchJson<RepResourceType[]>(`${API_BASE}/repResources`, []),
    fetchJson<ConditionalMetricType[]>(`${API_BASE}/conditionalMetrics`, []),
    fetchJson<DictionaryEntry[]>(`${API_BASE}/resourceTypeDictionaries`, [])
  ])

  if (!rep) notFound()

  const numericRepId = Number(repId)
  const repMetrics = allRepMetrics.filter(rm => rm.repId === numericRepId)
  const repResources = allRepResources.filter(rr => rr.repId === numericRepId)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-2 flex-wrap'>
        <Link href='/assessments' className='flex items-center gap-1 text-primary'>
          <i className='ri-arrow-left-s-line text-xl' />
          <Typography color='primary'>Assessments</Typography>
        </Link>
        <Typography color='text.secondary'>/</Typography>
        <Link href={`/assessments/${id}`}>
          <Typography color='primary'>Assessment #{id}</Typography>
        </Link>
        <Typography color='text.secondary'>/</Typography>
        <Link href={`/assessments/${id}/sessions/${sessionId}`}>
          <Typography color='primary'>Session #{sessionId}</Typography>
        </Link>
      </div>
      <Card>
        <CardContent className='flex flex-col gap-2'>
          <Typography variant='h5'>Rep #{rep.id}</Typography>
          <Typography color='text.secondary'>Start Time: {rep.startTime}</Typography>
          <Typography color='text.secondary'>Session: #{rep.sessionId}</Typography>
        </CardContent>
      </Card>
      <RepMetricsTable
        repId={numericRepId}
        repMetrics={repMetrics}
        conditionalMetrics={conditionalMetrics}
      />
      <RepResourcesTable
        repId={numericRepId}
        repResources={repResources}
        resourceTypes={resourceTypes}
      />
    </div>
  )
}

export default RepDetailPage
```

- [ ] **Step 2: Delete RepMetricSource files**

```bash
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/views/reps/RepMetricSourcesTable.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/views/reps/AddRepMetricSourceDrawer.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/views/reps/EditRepMetricSourceDrawer.tsx
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/rep-metric-sources/route.ts
rm /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/rep-metric-sources/[id]/route.ts
rmdir /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/rep-metric-sources 2>/dev/null || true
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

---

## Task 5: Add repNumber and dataSourceId display columns

**Files:**
- Modify: `src/views/sessions/RepsTable.tsx`
- Modify: `src/views/reps/RepMetricsTable.tsx`

- [ ] **Step 1: Add `repNumber` column to `src/views/sessions/RepsTable.tsx`**

In the `columns` array, insert a new column after the `id` accessor and before the `startTime` accessor:

```tsx
columnHelper.accessor('repNumber', {
  header: 'Rep #',
  cell: ({ row }) => <Typography color='text.primary'>{row.original.repNumber ?? '—'}</Typography>
}),
```

The `repNumber` field is read-only — do not add it to `AddRepDrawer` or `EditRepDrawer`.

- [ ] **Step 2: Add `dataSourceId` column to `src/views/reps/RepMetricsTable.tsx`**

In the `columns` array, insert a new column after the `value` column and before `actions`:

```tsx
{
  id: 'dataSourceId',
  header: 'Data Source',
  cell: ({ row }) => <Typography color='text.secondary'>{row.original.dataSourceId != null ? String(row.original.dataSourceId) : '—'}</Typography>
},
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

---

## Task 6: Session Start/Stop API proxy routes

**Files:**
- Create: `src/app/api/sessions/[id]/start/route.ts`
- Create: `src/app/api/sessions/[id]/stop/route.ts`

- [ ] **Step 1: Create `src/app/api/sessions/[id]/start/route.ts`**

First ensure the directory exists:
```bash
mkdir -p /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/sessions/[id]/start
```

File content:
```ts
import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/sessions/${id}/start`, { method: 'POST', headers: { Authorization: AUTH } })
  return NextResponse.json(await res.json(), { status: res.status })
}
```

- [ ] **Step 2: Create `src/app/api/sessions/[id]/stop/route.ts`**

```bash
mkdir -p /Users/romanvakulenko/biolab/launchpad-frontend/src/app/api/sessions/[id]/stop
```

File content:
```ts
import { NextResponse } from 'next/server'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE}/sessions/${id}/stop`, { method: 'POST', headers: { Authorization: AUTH } })
  return NextResponse.json(await res.json(), { status: res.status })
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

---

## Task 7: SessionStartStopButtons component and session page wiring

**Files:**
- Create: `src/views/sessions/SessionStartStopButtons.tsx`
- Modify: `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`

- [ ] **Step 1: Create `src/views/sessions/SessionStartStopButtons.tsx`**

```tsx
'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'

type Props = {
  sessionId: number
  initialStatus: string | null | undefined
}

const SessionStartStopButtons = ({ sessionId, initialStatus }: Props) => {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setStatus(data.status)
      router.refresh()
    }
    setLoading(false)
  }

  const handleStop = async () => {
    setLoading(true)
    const res = await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setStatus(data.status)
      router.refresh()
    }
    setLoading(false)
  }

  if (status === 'STOPPED') return null

  return (
    <div className='flex gap-2'>
      {!status && (
        <Button variant='contained' color='success' size='small' disabled={loading} onClick={handleStart}>
          {loading ? 'Starting…' : 'Start Session'}
        </Button>
      )}
      {status === 'ACTIVE' && (
        <Button variant='contained' color='error' size='small' disabled={loading} onClick={handleStop}>
          {loading ? 'Stopping…' : 'Stop Session'}
        </Button>
      )}
    </div>
  )
}

export default SessionStartStopButtons
```

- [ ] **Step 2: Update `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`**

Add the import at the top with other view imports:
```tsx
import SessionStartStopButtons from '@views/sessions/SessionStartStopButtons'
```

Inside the session header `CardContent`, add `<SessionStartStopButtons>` after the existing status chip line. The updated card content block:

```tsx
<CardContent className='flex flex-col gap-2'>
  <div className='flex items-center gap-3'>
    <Typography variant='h5'>Session #{session.id}</Typography>
    {session.status && (
      <Chip
        label={session.status}
        color={session.status === 'ACTIVE' ? 'success' : 'default'}
        size='small'
        variant='tonal'
      />
    )}
  </div>
  <Typography color='text.secondary'>Start Time: {session.startTime}</Typography>
  <Typography color='text.secondary'>Assessment: #{session.assessmentId}</Typography>
  <SessionStartStopButtons sessionId={numericSessionId} initialStatus={session.status} />
</CardContent>
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/romanvakulenko/biolab/launchpad-frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server (`npm run dev`) and verify:
1. Navigate to `/data-sources` — no Integration column, no Integration field in Add/Edit drawer
2. Navigate to any rep detail page — no "Rep Metric Sources" section
3. Navigate to any session detail page:
   - Session with no status: shows **Start Session** button (green)
   - Session with `ACTIVE` status: shows **Stop Session** button (red)
   - Session with `STOPPED` status: no buttons
4. The Integrations nav item is gone from the sidebar
