import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { v4 as uuidv4 } from "uuid"
import { MessageDataToSaveIntoFirestore } from "../message/type"
import { Call } from "./type"

async function becomeContacts(selfUserId: string, contactId: string) {
	const createdAt = new Date()
	const messageId = uuidv4()
	const messageData: MessageDataToSaveIntoFirestore = {
		_id: messageId,
		system: true,
		text: "Unlocked text messaging",
		createdAt,
	}

	const contactRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.doc(contactId)

	const selfRef = admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("contacts")
		.doc(selfUserId)

	await contactRef.collection("messages").doc(messageId).set(messageData)
	await selfRef.collection("messages").doc(messageId).set(messageData)

	// Note: we set message first then contact because client is listening to the update of contacts
	// and pull messages right away, so we make sure message is already created before the contacts
	selfRef.set({ id: selfUserId, createdAt })
	contactRef.set({ id: contactId, createdAt })
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
	const { contactId, callId } = data

	const selfCallRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("calls")
		.doc(callId)

	const otherCallRef = admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("calls")
		.doc(callId)

	selfCallRef.update({ selfHasUnlockedMessaging: true })
	otherCallRef.update({ otherHasUnlockedMessaging: true })

	const selfCallData = (await selfCallRef.get()).data() as Call

	if (selfCallData.otherHasUnlockedMessaging) {
		becomeContacts(selfUserId, contactId)
	}

	admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("call")
		.doc("event")
		.set({
			callId,
			name: "otherUnlockedMessaging",
			createdAt: new Date(),
		})

	return { success: true }
})
