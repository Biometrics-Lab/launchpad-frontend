import UsersTable from '@views/users/UsersTable'
import type { UserType } from '@/types/app/userTypes'
import type { DictionaryEntry } from '@/types/app/dictionaryTypes'

const API_BASE = 'http://localhost:8080/api/v1'
const AUTH = 'Basic ' + Buffer.from('biolab:biolab').toString('base64')
const HEADERS = { Authorization: AUTH }

async function getUsers(): Promise<UserType[]> {
  try {
    const res = await fetch(`${API_BASE}/users`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

async function getUserRoles(): Promise<DictionaryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/userRoleDictionaries`, { headers: HEADERS, cache: 'no-store' })

    return res.ok ? res.json() : []
  } catch { return [] }
}

const UsersPage = async () => {
  const [users, userRoles] = await Promise.all([getUsers(), getUserRoles()])

  return <UsersTable users={users} userRoles={userRoles} />
}

export default UsersPage
