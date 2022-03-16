import * as admin from "firebase-admin"

export const getRole = async (userId: string) => {
	const metadataDoc = await admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("settings")
		.doc("meta")
		.get()

	if (!metadataDoc.exists) {
		console.error("metadata not found")
		return null
	}

	const metadata = metadataDoc.data()
	return metadata?.role
}
