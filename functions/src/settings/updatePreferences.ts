import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const updatePreferences = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const preferencesRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("preferences")

	// TODO: sanity user input
	preferencesRef.set({ ...data, updatedAt: new Date() }, { merge: true })

	return { success: true }
})
