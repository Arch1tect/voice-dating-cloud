export type Call = {
	id: string
	createdAt: Date
	mode: string
	endedAt?: Date
	callerId?: string
	calleeId?: string
	selfHasUnlockedMessaging?: boolean
	otherHasUnlockedMessaging?: boolean
}

// TODO: delete
export type CallData = {
	contactId?: string
	contact?: any
	state?: any
	callMetadata?: any
	hasContactUnlockedMessaging?: boolean
}
