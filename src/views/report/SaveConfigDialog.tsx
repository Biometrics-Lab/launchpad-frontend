'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import type { ReportConfigEntry, ReportConfigJson } from '@/types/app/reportTypes'

type Props = {
  open: boolean
  config: ReportConfigJson
  onClose: () => void
  onSaved: (entry: ReportConfigEntry) => void
}

const SaveConfigDialog = ({ open, config, onClose, onSaved }: Props) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    setName('')
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/report-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), reportType: 'player-assessment', config })
      })

      const data = await res.json()

      if (res.status === 409) {
        setError('Name already taken')
        return
      }

      if (!res.ok) {
        setError('Failed to save config')
        return
      }

      onSaved(data as ReportConfigEntry)
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Save Config</DialogTitle>
      <DialogContent className='flex flex-col gap-4 !pt-4'>
        <TextField
          label='Name'
          value={name}
          onChange={e => setName(e.target.value)}
          error={!!error}
          helperText={error ?? ' '}
          fullWidth
          size='small'
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SaveConfigDialog
