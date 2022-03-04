import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { sendPushNotifications } from "../notification/expo"
import { ExpoPushMessage } from "expo-server-sdk"

type MessageData = {
	text: string
	_id: string
	createdAt: string
	senderId: string
	senderName: string
	receiverId: string
}

export const sendMessage = functions.https.onCall(
	(data: MessageData, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return
		}
		const { uid: selfUserId } = authUser
		const { _id, receiverId } = data

		// TODO: sanity user input
		const finalData = {
			...data,
			senderId: selfUserId,
			createdAt: new Date(),
		}

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

		const notificationData: ExpoPushMessage = {
			to: "ExponentPushToken[PJ3lLiNmbxyGhFIcZmywSU]",
			data: finalData,
			title: data.senderName,
			// subtitle: "sub title",
			// TODO: handle image message
			// TBD: need to slice?
			body: data.text,
			sound: "default",
		}
		sendPushNotifications([notificationData])

		return { success: true }
	}
)
