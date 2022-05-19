import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const hangUp = functions.https.onCall(async (data, context) => {
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

	admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("calls")
		.doc(callId)
		.update({ endedAt: new Date() })

	admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("calls")
		.doc(callId)
		.update({ endedAt: new Date() })

	return { success: true }
})
