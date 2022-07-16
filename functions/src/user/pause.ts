import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const pause = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { pause } = data

	const selfUserRef = admin.firestore().collection("users").doc(selfUserId)
	const newStatus = pause ? "paused" : "good"
	selfUserRef.update({ status: newStatus })

	return { success: true }
})
