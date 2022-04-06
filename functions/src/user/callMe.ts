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
	const { isCallMeEnabled } = data

	const callRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("call")

	callRef.update({
		callMeEnabledTime: isCallMeEnabled ? new Date() : false,
	})

	return { success: true }
})
