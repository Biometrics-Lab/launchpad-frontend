export type OrganisationType = { id: number; name: string }

export type TeamType = {
  id: number
  name: string
  organisationId: number
  sport: string
  description?: string
}

export type PlayerType = {
  id: number
  name: string
  graduationYear: number
  teamId?: number
  dob?: string
}
