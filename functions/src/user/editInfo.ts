import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const editInfo = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const selfUserRef = admin.firestore().collection("users").doc(selfUserId)

	// TODO: sanity user input
	// TODO: have a whitelist of fields that can be udpated
	// E.g. definitely don't want user change their birthday
	// or user id etc.

	selfUserRef.update({ ...data, updatedAt: new Date() })

	return { success: true }
})
