export type Image = {
	small: string
	large: string
}

export type MessageDataFromClient = {
	imageDataUrl?: string
	text?: string
	_id: string
	// createdAt: string // shouldn't get this from client side
	senderId: string
	senderName: string
	receiverId: string
}

export type MessageDataToSaveIntoFirestore = {
	system?: boolean
	image?: Image
	text?: string
	_id: string
	createdAt: Date
	senderId?: string
	receiverId?: string
}
