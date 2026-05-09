import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

const AboutPage = () => {
  return (
    <div className='flex flex-col gap-6 max-w-2xl'>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center gap-3'>
            <i className='ri-rocket-2-line text-4xl text-primary' />
            <div>
              <Typography variant='h4'>LaunchPad</Typography>
              <Typography color='text.secondary' variant='body2'>Sports Lab Management Platform</Typography>
            </div>
          </div>
          <Divider />
          <Typography color='text.secondary'>
            LaunchPad is a comprehensive platform for managing sports lab assessments, athlete performance models,
            sessions, and rep-level metric data. Built to support coaches, analysts, and sports scientists in
            tracking and evaluating athletic development.
          </Typography>
          <Divider />
          <Typography variant='caption' color='text.disabled'>
            © {new Date().getFullYear()} BioLab. All rights reserved.
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default AboutPage
