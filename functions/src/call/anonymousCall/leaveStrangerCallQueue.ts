import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const leaveStrangerCallQueue = functions.https.onCall(
	async (data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		const { uid: selfUserId } = authUser

		const selfCallRef = admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("call")
			.doc("call")
		selfCallRef.set({})

		const callQueueRef = admin
			.firestore()
			.collection("anonymousCallQueue")
			.doc(selfUserId)

		callQueueRef.delete()

		return { success: true }
	}
)
