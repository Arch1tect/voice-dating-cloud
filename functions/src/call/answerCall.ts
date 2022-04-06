import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const answerCall = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { targetUserId } = data

	const selfUserCallRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("call")
	const targetUserCallRef = admin
		.firestore()
		.collection("users")
		.doc(targetUserId)
		.collection("settings")
		.doc("call")

	selfUserCallRef.set({
		ongoingCall: {
			contactId: targetUserId,
			calledAt: new Date(),
		},
	})

	targetUserCallRef.set({
		ongoingCall: {
			contactId: selfUserId,
			calledAt: new Date(),
		},
	})

	return { success: true }
})
