'use client'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

type Props = {
  url: string | null
  onClose: () => void
}

const UrlPreviewDialog = ({ url, onClose }: Props) => (
  <Dialog open={Boolean(url)} onClose={onClose} maxWidth='lg' fullWidth>
    <DialogTitle className='flex items-center justify-between gap-2 pr-3'>
      <Typography variant='body2' color='text.secondary' className='truncate'>{url}</Typography>
      <IconButton size='small' onClick={onClose}><i className='ri-close-line text-xl' /></IconButton>
    </DialogTitle>
    <DialogContent className='p-0'>
      {url && (
        <iframe
          src={url}
          style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }}
          title='Resource preview'
        />
      )}
    </DialogContent>
  </Dialog>
)

export default UrlPreviewDialog
