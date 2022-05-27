export type UserPhoto = {
	small: string
	medium: string
	large: string
}

export type User = {
	id: string
	name: string
	gender: string
	languages: string[]
	birthday: number
	city: string
	state: string
	job: string
	lat: number
	lng: number
	photos: UserPhoto[]
	createdAt: Date
	lastLoginTime: Date
	status: string

	about?: any
	height?: number
	college?: string
	company?: string
	education?: number
	ethnicity?: string
	religion?: string
	familyPlans?: string
	hasKids?: string
	relationshipGoals?: string
	smokingFrequency?: string

	likeCount?: number
}
