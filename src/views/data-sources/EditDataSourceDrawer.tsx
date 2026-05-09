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

type Props = {
  open: boolean
  dataSource: DataSourceType | null
  dataSourceTypes: DictionaryEntry[]
  handleClose: () => void
  onUpdated: (ds: DataSourceType) => void
}

type FormData = {
  name: string
  type: string
  description: string
}

const EditDataSourceDrawer = ({ open, dataSource, dataSourceTypes, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { name: '', type: '', description: '' } })

  useEffect(() => {
    if (dataSource) reset({ name: dataSource.name, type: dataSource.type, description: dataSource.description ?? '' })
  }, [dataSource, reset])

  const onSubmit = async (data: FormData) => {
    if (!dataSource) return

    const res = await fetch('/api/data-sources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dataSource.id, ...data })
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
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
            <Controller
              name='name'
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Name'
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
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
                      <MenuItem key={t.name} value={t.name}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
            </FormControl>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Description' multiline rows={3} />
              )}
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
