import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const cancelOutgoingCall = functions.https.onCall(
	async (data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		const { uid: callerId } = authUser
		const { contactId: calleeId, callId } = data

		await admin
			.firestore()
			.collection("users")
			.doc(callerId)
			.collection("call")
			.doc("event")
			.set({
				callId,
				name: "outgoingCallCanceled",
				createdAt: new Date(),
			})

		await admin
			.firestore()
			.collection("users")
			.doc(calleeId)
			.collection("call")
			.doc("event")
			.set({
				callId,
				name: "incomingCallCanceled",
				createdAt: new Date(),
			})

		return { success: true }
	}
)
