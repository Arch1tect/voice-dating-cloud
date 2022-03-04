import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { sendPushNotifications } from "../notification/expo"
import { ExpoPushMessage } from "expo-server-sdk"

export const like = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser
	const { like, targetUserId } = data

	const targetUserRef = admin
		.firestore()
		.collection("users")
		.doc(targetUserId)
	const selfUserLikedDocRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("peopleILiked")
		.doc(targetUserId)
	const targetUserLikedDocRef = admin
		.firestore()
		.collection("users")
		.doc(targetUserId)
		.collection("peopleLikedMe")
		.doc(selfUserId)

	if (like) {
		selfUserLikedDocRef.set({ id: targetUserId, createdAt: new Date() })
		targetUserLikedDocRef.set({ id: selfUserId, createdAt: new Date() })
	} else {
		selfUserLikedDocRef.delete()
		targetUserLikedDocRef.delete()
	}

	targetUserRef.update({
		likeCount: admin.firestore.FieldValue.increment(like ? 1 : -1),
	})

	// TODO: check today's like quota and update it
	if (like) {
		const notificationData: ExpoPushMessage = {
			to: "ExponentPushToken[PJ3lLiNmbxyGhFIcZmywSU]",
			// data: {},
			title: "Someone just liked you!",
			// body: data.text,
			sound: "default",
		}
		sendPushNotifications([notificationData])
	}

	return { success: true }
})
