export type Call = {
	id: string
	createdAt: Date
	mode: string
	endedAt?: Date
	callerId?: string
	calleeId?: string
	selfHasUnlockedMessaging?: boolean
	otherHasUnlockedMessaging?: boolean
	selfHasShownProfile?: boolean
	otherHasShownProfile?: boolean
}
