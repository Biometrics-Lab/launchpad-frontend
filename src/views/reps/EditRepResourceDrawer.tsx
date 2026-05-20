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
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { RepResourceType } from '@/types/app/assessmentTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

type Props = {
  open: boolean
  repResource: RepResourceType | null
  resourceTypes: DictionaryEntry[]
  handleClose: () => void
  onUpdated: (r: RepResourceType) => void
}

type FormData = { type: string; url: string; externalUrl: string }

const EditRepResourceDrawer = ({ open, repResource, resourceTypes, handleClose, onUpdated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { type: '', url: '', externalUrl: '' } })

  useEffect(() => {
    if (repResource) reset({ type: repResource.type, url: repResource.url, externalUrl: repResource.externalUrl ?? '' })
  }, [repResource, reset])

  const onSubmit = async (data: FormData) => {
    if (!repResource) return
    const res = await fetch('/api/rep-resources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: repResource.id, repId: repResource.repId, ...data, externalUrl: data.externalUrl || null })
    })
    if (res.ok) { onUpdated(await res.json()); handleClose() }
  }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleClose} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Edit Rep Resource</Typography>
        <IconButton size='small' onClick={handleClose}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <FormControl fullWidth error={Boolean(errors.type)}>
              <InputLabel>Type</InputLabel>
              <Controller name='type' control={control} rules={{ required: 'Type is required' }} render={({ field }) => (
                <Select {...field} label='Type'>{resourceTypes.map(rt => <MenuItem key={rt.name} value={rt.name}>{rt.name}</MenuItem>)}</Select>
              )} />
              {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
            </FormControl>
            <Controller name='url' control={control} rules={{ required: 'URL is required' }} render={({ field }) => (
              <TextField {...field} fullWidth label='URL' error={Boolean(errors.url)} helperText={errors.url?.message} />
            )} />
            <Controller name='externalUrl' control={control} render={({ field }) => (
              <TextField {...field} fullWidth label='External URL' />
            )} />
            {repResource?.urlStatus && (() => {
              const color = repResource.urlStatus === 'READY' ? 'success' : repResource.urlStatus === 'FAILED' ? 'error' : 'warning'
              return (
                <div className='flex items-center gap-2'>
                  <Typography variant='body2' color='text.secondary'>Status:</Typography>
                  <Chip label={repResource.urlStatus} color={color} size='small' variant='tonal' />
                </div>
              )
            })()}
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

export default EditRepResourceDrawer
