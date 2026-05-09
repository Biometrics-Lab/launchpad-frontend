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

import type { PlayerType, TeamType } from '@/types/app/playersTypes'

type Props = {
  open: boolean
  player: PlayerType | null
  teams: TeamType[]
  handleClose: () => void
  onUpdated: (player: PlayerType) => void
}

type FormData = {
  name: string
  graduationYear: number
  teamId: number
  dob: string
}

const EditPlayerDrawer = ({ open, player, teams, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { name: '', graduationYear: new Date().getFullYear(), teamId: 0, dob: '' } })

  useEffect(() => {
    if (player) {
      reset({
        name: player.name,
        graduationYear: player.graduationYear,
        teamId: player.teamId ?? 0,
        dob: player.dob ?? ''
      })
    }
  }, [player, reset])

  const onSubmit = async (data: FormData) => {
    if (!player) return

    const payload: Record<string, unknown> = {
      id: player.id,
      name: data.name,
      graduationYear: data.graduationYear
    }

    if (data.teamId !== 0) payload.teamId = data.teamId
    if (data.dob) payload.dob = data.dob

    const res = await fetch('/api/players', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
        <Typography variant='h5'>Edit Player</Typography>
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
            <Controller
              name='graduationYear'
              control={control}
              rules={{ required: 'Graduation year is required', min: { value: 1900, message: 'Must be ≥ 1900' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Graduation Year'
                  type='number'
                  onChange={e => field.onChange(Number(e.target.value))}
                  error={Boolean(errors.graduationYear)}
                  helperText={errors.graduationYear?.message}
                />
              )}
            />
            <FormControl fullWidth>
              <InputLabel>Team</InputLabel>
              <Controller
                name='teamId'
                control={control}
                render={({ field }) => (
                  <Select {...field} label='Team'>
                    <MenuItem value={0}>None</MenuItem>
                    {teams.map(t => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <Controller
              name='dob'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Date of Birth'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                />
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

export default EditPlayerDrawer
