import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { v4 as uuidv4 } from "uuid"
import { MessageDataToSaveIntoFirestore } from "../../message/type"
import { CallData } from "../type"

async function becomeContacts(selfUserId: string, contactId: string) {
	const messageId = uuidv4()
	const messageData: MessageDataToSaveIntoFirestore = {
		_id: messageId,
		system: true,
		text: "Unlocked text messaging",
		createdAt: new Date(),
	}

	const selfMessageRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.doc(contactId)
		.collection("messages")
		.doc(messageId)
	const contactMessageRef = admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("contacts")
		.doc(selfUserId)
		.collection("messages")
		.doc(messageId)

	selfMessageRef.set(messageData)
	contactMessageRef.set(messageData)
}

export const unlockMessaging = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { contactId } = data

	const selfCallData = (
		await admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("call")
			.doc("call")
			.get()
	).data() as CallData

	if (selfCallData.hasContactUnlockedMessaging) {
		becomeContacts(selfUserId, contactId)
	}

	admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("call")
		.doc("call")
		.update({ hasContactUnlockedMessaging: true })

	return { success: true }
})
