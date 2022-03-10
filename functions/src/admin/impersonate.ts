import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const impersonate = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const metadataDoc = await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("meta")
		.get()

	if (!metadataDoc.exists) {
		return {
			success: false,
			errorCode: 403,
			errorMessage: "metadata not exist",
		}
	}

	const metadata = metadataDoc.data()

	// return conversationDict
})
