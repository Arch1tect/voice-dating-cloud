import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const sendMessage = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser
	const { _id, receiverId } = data

	// TODO: sanity user input
	const finalData = { ...data, senderId: selfUserId, createdAt: new Date() }

	const senderMessageRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.doc(receiverId)
		.collection("messages")
		.doc(_id)
	const receiverMessageRef = admin
		.firestore()
		.collection("users")
		.doc(receiverId)
		.collection("contacts")
		.doc(selfUserId)
		.collection("messages")
		.doc(_id)
	senderMessageRef.set(finalData)
	receiverMessageRef.set(finalData)

	return { success: true }
})
