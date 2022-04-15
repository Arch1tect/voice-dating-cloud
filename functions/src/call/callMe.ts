import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const callMe = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { isEnabled } = data

	const callRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("call")
		.doc("allowIncomingCall")

	callRef.set(
		{
			enabledTime: isEnabled ? new Date() : false,
		},
		{ merge: true }
	)

	return { success: true }
})
