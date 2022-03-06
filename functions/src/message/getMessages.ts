import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

type Conversation = {
	contactUser: any
	messages: []
	lastMessage: any
}
type ConversationDict = {
	[key: string]: Conversation
}

async function getMessagesOfOneContact(
	contactId: string,
	selfUserId: string,
	conversationDict: { [key: string]: any }
) {
	const messagesQueryRes = await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.doc(contactId)
		.collection("messages")
		.orderBy("createdAt", "asc")
		.get()
	const messages: any = []
	// console.log(messagesQueryRes.docs.length)
	messagesQueryRes.forEach((docSnapshot) => {
		const message = docSnapshot.data()
		// console.log(message)
		message.createdAt = message.createdAt.seconds * 1000
		messages.push(message)
	})
	// TBD: when there isn't any message yet, mock the last message
	// mocked last message is only used in the contact screen, not in conversation screen
	// Another solution is to always create a real system message
	// when two users become contacts

	// TODO: below code would break because of exisitng bad data - there
	// isn't createdAt set on the contact record
	// so I'm checking message length > 0 for now
	// const lastMessage =
	// 	messages.length > 0
	// 		? messages[messages.length - 1]
	// 		: {
	// 				createdAt: contact.createdAt.seconds * 1000,
	// 				text: "",
	// 		  }
	// conversationDict[contact.id] = { messages, contactUser, lastMessage }
	// console.log("m length", messages.length)
	if (messages.length > 0) {
		const contactUser = (
			await admin.firestore().collection("users").doc(contactId).get()
		).data()

		const lastMessage = messages[messages.length - 1]

		conversationDict[contactId] = {
			messages,
			contactUser,
			lastMessage,
		}
	}
}

export const getMessages = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser

	const contactsQueryRes = await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.get()

	const contacts: any = []
	contactsQueryRes.forEach((docSnapshot) => {
		contacts.push(docSnapshot.data())
	})

	const conversationDict: ConversationDict = {}
	const promises: Promise<void>[] = []
	contacts.forEach((c: any) => {
		promises.push(
			getMessagesOfOneContact(c.id, selfUserId, conversationDict)
		)
	})
	await Promise.all(promises)

	return conversationDict
})
