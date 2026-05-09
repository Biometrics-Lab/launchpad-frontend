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

import type { TeamType, OrganisationType } from '@/types/app/playersTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

type Props = {
  open: boolean
  team: TeamType | null
  organisations: OrganisationType[]
  sports: DictionaryEntry[]
  handleClose: () => void
  onUpdated: (team: TeamType) => void
}

type FormData = {
  name: string
  organisationId: number
  sport: string
  description: string
}

const EditTeamDrawer = ({ open, team, organisations, sports, handleClose, onUpdated }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ defaultValues: { name: '', organisationId: 0, sport: '', description: '' } })

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        organisationId: team.organisationId,
        sport: team.sport,
        description: team.description ?? ''
      })
    }
  }, [team, reset])

  const onSubmit = async (data: FormData) => {
    if (!team) return

    const res = await fetch('/api/teams', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: team.id, ...data })
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
        <Typography variant='h5'>Edit Team</Typography>
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
            <FormControl fullWidth error={Boolean(errors.organisationId)}>
              <InputLabel>Organisation</InputLabel>
              <Controller
                name='organisationId'
                control={control}
                rules={{ validate: v => v !== 0 || 'Organisation is required' }}
                render={({ field }) => (
                  <Select {...field} label='Organisation'>
                    {organisations.map(o => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.organisationId && <FormHelperText>{errors.organisationId.message}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth error={Boolean(errors.sport)}>
              <InputLabel>Sport</InputLabel>
              <Controller
                name='sport'
                control={control}
                rules={{ required: 'Sport is required' }}
                render={({ field }) => (
                  <Select {...field} label='Sport'>
                    {sports.map(s => (
                      <MenuItem key={s.name} value={s.name}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.sport && <FormHelperText>{errors.sport.message}</FormHelperText>}
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

export default EditTeamDrawer
