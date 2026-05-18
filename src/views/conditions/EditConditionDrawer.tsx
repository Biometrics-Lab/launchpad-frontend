'use client'

import { useEffect } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

import type { ConditionType } from '@/types/app/conditionTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

type Props = {
  open: boolean
  condition: ConditionType | null
  sports: DictionaryEntry[]
  handleClose: () => void
  onUpdated: (condition: ConditionType) => void
}

type FormData = { name: string; sport: string }

const EditConditionDrawer = ({ open, condition, sports, handleClose, onUpdated }: Props) => {
  const { control, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { name: '', sport: '' } })

  useEffect(() => {
    if (condition) reset({ name: condition.name, sport: condition.sport ?? '' })
  }, [condition, reset])

  const onSubmit = async (data: FormData) => {
    if (!condition) return
    const res = await fetch('/api/conditions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: condition.id, name: data.name, sport: data.sport || null })
    })
    if (res.ok) { onUpdated(await res.json()); handleClose() }
  }

  return (
    <Drawer open={open} anchor='right' variant='temporary' onClose={handleClose} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}>
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Edit Condition</Typography>
        <IconButton size='small' onClick={handleClose}><i className='ri-close-line text-2xl' /></IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Controller
              name='name'
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Name' error={Boolean(errors.name)} helperText={errors.name?.message} />
              )}
            />
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Controller
                name='sport'
                control={control}
                render={({ field }) => (
                  <Select {...field} label='Sport'>
                    <MenuItem value=''>None</MenuItem>
                    {sports.map(s => <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>)}
                  </Select>
                )}
              />
            </FormControl>
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

export default EditConditionDrawer
