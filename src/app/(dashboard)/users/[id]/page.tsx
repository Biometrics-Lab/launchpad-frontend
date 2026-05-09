import { notFound } from 'next/navigation'

import Link from 'next/link'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

import UserPlayersTable from '@views/users/UserPlayersTable'
import type { UserType, UserPlayerType } from '@/types/app/userTypes'
import type { PlayerType } from '@/types/app/playersTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getUser(id: string): Promise<UserType | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : null
  } catch { return null }
}

async function getUserPlayers(userId: string): Promise<UserPlayerType[]> {
  try {
    const res = await fetch(`${API_BASE}/userPlayers`, { headers: HEADERS, cache: 'no-store' })

    if (!res.ok) return []
    const all: UserPlayerType[] = await res.json()

    return all.filter(up => up.userId === Number(userId))
  } catch { return [] }
}

async function getPlayers(): Promise<PlayerType[]> {
  try {
    const res = await fetch(`${API_BASE}/players`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

type Props = { params: Promise<{ id: string }> }

const UserDetailPage = async ({ params }: Props) => {
  const { id } = await params
  const [user, userPlayers, players] = await Promise.all([
    getUser(id),
    getUserPlayers(id),
    getPlayers()
  ])

  if (!user) notFound()

  return (
    <div className='flex flex-col gap-6'>
      <Link href='/users' className='flex items-center gap-1 text-primary w-fit'>
        <i className='ri-arrow-left-s-line text-xl' />
        <Typography color='primary'>Users</Typography>
      </Link>
      <Card>
        <CardContent className='flex flex-col gap-3'>
          <div className='flex items-center gap-3 flex-wrap'>
            <Typography variant='h5'>{user.name}</Typography>
            <Chip label={user.role} color='primary' variant='outlined' size='small' />
          </div>
        </CardContent>
      </Card>
      <UserPlayersTable
        userId={user.id}
        userPlayers={userPlayers}
        players={players}
      />
    </div>
  )
}

export default UserDetailPage
