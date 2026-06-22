'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import UrlPreviewDialog from '@components/UrlPreviewDialog'
import type { AssessmentResourceType } from '@/types/app/assessmentTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

type Props = {
  open: boolean
  assessmentId: number
  resourceTypes: DictionaryEntry[]
  handleClose: () => void
  onCreated: (r: AssessmentResourceType) => void
}

type FormData = { type: string; url: string }

const AddAssessmentResourceDrawer = ({ open, assessmentId, resourceTypes, handleClose, onCreated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { type: '', url: '' } })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/assessment-resources', {
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
        <Typography variant='h5'>Add Resource</Typography>
        <IconButton size='small' onClick={handleReset}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.type)}>
              <InputLabel>Type</InputLabel>
              <Controller
                name='type'
                control={control}
                rules={{ required: 'Type is required' }}
                render={({ field }) => (
                  <Select {...field} label='Type'>
                    {resourceTypes.map(rt => <MenuItem key={rt.name} value={rt.name}>{rt.name}</MenuItem>)}
                  </Select>
                )}
              />
              {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='url'
              control={control}
              rules={{ required: 'URL is required' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label='URL' error={Boolean(errors.url)} helperText={errors.url?.message}
                  InputProps={{ endAdornment: field.value ? <InputAdornment position='end'><IconButton size='small' edge='end' onClick={() => setPreviewUrl(field.value)}><i className='ri-eye-line' /></IconButton></InputAdornment> : undefined }} />
              )}
            />
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit' disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Add'}</Button>
              <Button variant='outlined' color='error' onClick={handleReset}>Discard</Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
      <UrlPreviewDialog url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </Drawer>
  )
}

export default AddAssessmentResourceDrawer
