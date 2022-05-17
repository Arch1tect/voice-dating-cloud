import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const declineIncomingCall = functions.https.onCall(
	async (data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		// const { uid: selfUserId } = authUser
		const { contactId: callerId, callId } = data

		await admin
			.firestore()
			.collection("users")
			.doc(callerId)
			.collection("call")
			.doc("event")
			.set({
				callId,
				name: "outgoingCallDeclined",
				createdAt: new Date(),
			})

		return { success: true }
	}
)
