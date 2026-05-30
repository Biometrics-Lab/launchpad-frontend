'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

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
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { AssessmentType } from '@/types/app/assessmentTypes'
import type { AssessmentMetricType } from '@/types/app/assessmentTypes'
import type { AssessmentTemplateType, TemplateMetricType } from '@/types/app/assessmentTemplateTypes'
import type { PlayerType } from '@/types/app/playersTypes'
import type { ConditionType } from '@/types/app/conditionTypes'

type Props = {
  open: boolean
  players: PlayerType[]
  templates: AssessmentTemplateType[]
  conditions: ConditionType[]
  handleClose: () => void
  onCreated: (a: AssessmentType) => void
}

type Step1Data = {
  playerId: number
  templateId: number
}

const AddAssessmentDrawer = ({ open, players, templates, conditions, handleClose, onCreated }: Props) => {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [previewMetrics, setPreviewMetrics] = useState<TemplateMetricType[]>([])
  const [removedMetrics, setRemovedMetrics] = useState<TemplateMetricType[]>([])
  const [addSelectValue, setAddSelectValue] = useState<number>(0)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  const {
    control,
    reset,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Step1Data>({ defaultValues: { playerId: 0, templateId: 0 } })

  const selectedTemplateId = watch('templateId')
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) ?? null
  const selectedCondition = selectedTemplate?.conditionId
    ? conditions.find(c => c.id === selectedTemplate.conditionId)
    : null

  const handleNext = handleSubmit(async data => {
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await fetch('/api/template-metrics')
      if (!res.ok) throw new Error('Failed to load template metrics')
      const all: TemplateMetricType[] = await res.json()
      setPreviewMetrics(all.filter(tm => tm.templateId === data.templateId))
      setRemovedMetrics([])
      setAddSelectValue(0)
      setStep1Data(data)
      setStep(2)
    } catch {
      setPreviewError('Could not load template preview. Please try again.')
    } finally {
      setPreviewLoading(false)
    }
  })

  const handleRemoveMetric = (tm: TemplateMetricType) => {
    setPreviewMetrics(prev => prev.filter(m => m.id !== tm.id))
    setRemovedMetrics(prev => [...prev, tm])
  }

  const handleAddMetric = () => {
    const tm = removedMetrics.find(m => m.id === addSelectValue)
    if (!tm) return
    setRemovedMetrics(prev => prev.filter(m => m.id !== addSelectValue))
    setPreviewMetrics(prev => [...prev, tm])
    setAddSelectValue(0)
  }

  const handleConfirm = async () => {
    if (!step1Data || !selectedTemplate) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: step1Data.playerId,
          templateId: step1Data.templateId,
          sport: selectedTemplate.sport,
          conditionId: selectedTemplate.conditionId ?? null
        })
      })
      if (!res.ok) {
        setSubmitError('Failed to create assessment. Please try again.')
        return
      }
      const newAssessment: AssessmentType = await res.json()

      // Delete removed metrics from the auto-copied set
      if (removedMetrics.length > 0) {
        const amRes = await fetch('/api/assessment-metrics')
        if (amRes.ok) {
          const allMetrics: AssessmentMetricType[] = await amRes.json()
          const toDelete = allMetrics.filter(
            am => am.assessmentId === newAssessment.id &&
              removedMetrics.some(rm => rm.conditionalMetricId === am.conditionalMetricId)
          )
          await Promise.all(toDelete.map(am => fetch(`/api/assessment-metrics/${am.id}`, { method: 'DELETE' })))
        }
      }

      onCreated(newAssessment)
      handleReset()
      router.push(`/assessments/${newAssessment.id}`)
    } catch {
      setSubmitError('Failed to create assessment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    reset()
    setStep(1)
    setPreviewMetrics([])
    setRemovedMetrics([])
    setAddSelectValue(0)
    setPreviewError(null)
    setSubmitError(null)
    setStep1Data(null)
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 500 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>
          New Assessment {step === 2 ? '— Metrics' : ''}
        </Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          {step === 1 && (
            <div className='flex flex-col gap-5'>
              <FormControl fullWidth error={Boolean(errors.playerId)}>
                <InputLabel>Player</InputLabel>
                <Controller
                  name='playerId'
                  control={control}
                  rules={{ validate: v => v !== 0 || 'Player is required' }}
                  render={({ field }) => (
                    <Select {...field} label='Player'>
                      {players.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.playerId && <FormHelperText>{errors.playerId.message}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth error={Boolean(errors.templateId)}>
                <InputLabel>Template</InputLabel>
                <Controller
                  name='templateId'
                  control={control}
                  rules={{ validate: v => v !== 0 || 'Template is required' }}
                  render={({ field }) => (
                    <Select {...field} label='Template'>
                      {templates.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.templateId && <FormHelperText>{errors.templateId.message}</FormHelperText>}
              </FormControl>
              {selectedTemplate && (
                <>
                  <TextField label='Sport' value={selectedTemplate.sport ?? ''} disabled fullWidth />
                  {selectedCondition && (
                    <TextField label='Condition' value={selectedCondition.name} disabled fullWidth />
                  )}
                </>
              )}
              {previewError && <Alert severity='error'>{previewError}</Alert>}
              <div className='flex items-center gap-4'>
                <Button
                  variant='contained'
                  onClick={handleNext}
                  disabled={previewLoading}
                  endIcon={previewLoading ? <CircularProgress size={16} /> : <i className='ri-arrow-right-s-line' />}
                >
                  {previewLoading ? 'Loading…' : 'Next'}
                </Button>
                <Button variant='outlined' color='error' onClick={handleReset}>Discard</Button>
              </div>
            </div>
          )}

          {step === 2 && step1Data && selectedTemplate && (
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-4'>
                <TextField label='Template' value={selectedTemplate.name} disabled fullWidth />
                <TextField label='Sport' value={selectedTemplate.sport ?? ''} disabled fullWidth />
                {selectedCondition && (
                  <TextField label='Condition' value={selectedCondition.name} disabled fullWidth />
                )}
              </div>

              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Typography variant='subtitle2'>
                    Metrics ({previewMetrics.length})
                  </Typography>
                </div>

                {previewMetrics.length === 0 && removedMetrics.length === 0 && (
                  <Alert severity='warning'>This template has no metrics.</Alert>
                )}

                {previewMetrics.length > 0 && (
                  <div className='flex flex-col'>
                    {previewMetrics.map((tm, i) => (
                      <div
                        key={tm.id}
                        className='flex items-center justify-between py-2 px-1'
                        style={{ borderBottom: i < previewMetrics.length - 1 ? '1px solid var(--mui-palette-divider)' : 'none' }}
                      >
                        <Typography variant='body2'>{tm.description || `Metric #${tm.conditionalMetricId}`}</Typography>
                        <IconButton size='small' color='error' onClick={() => handleRemoveMetric(tm)} title='Remove'>
                          <i className='ri-delete-bin-line text-sm' />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                )}

                {removedMetrics.length > 0 && (
                  <div className='flex items-center gap-2 mt-3'>
                    <FormControl size='small' fullWidth>
                      <InputLabel>Add back metric</InputLabel>
                      <Select
                        value={addSelectValue}
                        label='Add back metric'
                        onChange={e => setAddSelectValue(Number(e.target.value))}
                      >
                        <MenuItem value={0} disabled>Select a metric</MenuItem>
                        {removedMetrics.map(rm => (
                          <MenuItem key={rm.id} value={rm.id}>
                            {rm.description || `Metric #${rm.conditionalMetricId}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton onClick={handleAddMetric} disabled={addSelectValue === 0} color='primary' title='Add'>
                      <i className='ri-add-line' />
                    </IconButton>
                  </div>
                )}
              </div>

              {submitError && <Alert severity='error'>{submitError}</Alert>}
              <div className='flex items-center gap-4'>
                <Button
                  variant='contained'
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  endIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
                >
                  {isSubmitting ? 'Creating…' : 'Create Assessment'}
                </Button>
                <Button variant='outlined' onClick={() => setStep(1)}>Back</Button>
              </div>
            </div>
          )}
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddAssessmentDrawer
