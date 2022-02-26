import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const editInfo = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser

	const selfUserRef = admin.firestore().collection("users").doc(selfUserId)

	// TODO: sanity user input

	selfUserRef.update({ ...data, updatedAt: new Date() })

	return { success: true }
})
