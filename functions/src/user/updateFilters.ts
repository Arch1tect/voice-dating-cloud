import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const updateFilters = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser

	const filtersRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("filters")

	// TODO: sanity user input
	filtersRef.set({ ...data, updatedAt: new Date() }, { merge: true })

	return { success: true }
})
