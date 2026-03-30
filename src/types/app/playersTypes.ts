
export type PlayerType = {
  id: number
  name: string
  graduationYear: number
  team?: TeamType
  dob?: Date
}

export type TeamType = {
  id: number
  name: string
  Organisation?: OrganisationType
  sport: string
  description: string
}

export type OrganisationType = {
  id: number
  name: string
}