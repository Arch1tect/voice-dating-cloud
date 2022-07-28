import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { sendPushNotifications } from "../notification/expo"
import { ExpoPushMessage } from "expo-server-sdk"

async function updateLikeMetadata(userId: string) {
	const likeMetadataRef = admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("metadata")
		.doc("like")
	const likeMetadataDoc = await likeMetadataRef.get()

	let todaysLikeCount = 0
	if (likeMetadataDoc.exists) {
		const callData = likeMetadataDoc.data()
		// Check if data is from today
		const timestamp = callData?.updatedAt.seconds * 1000
		const dateThen = new Date(timestamp).getDate()
		const dateNow = new Date().getDate()
		if (dateNow === dateThen) {
			todaysLikeCount = callData?.count
		}
	}

	likeMetadataRef.set({
		updatedAt: new Date(),
		count: todaysLikeCount + 1,
	})
}

export const like = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
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
		updateLikeMetadata(selfUserId)
	} else {
		selfUserLikedDocRef.delete()
		targetUserLikedDocRef.delete()
	}

	targetUserRef.update({
		likeCount: admin.firestore.FieldValue.increment(like ? 1 : -1),
	})

	if (like) {
		const devicesQueryRes = await targetUserRef.collection("devices").get()

		devicesQueryRes.forEach((docSnapshot) => {
			const device = docSnapshot.data()

			if (
				device.pushNotificationToken &&
				device.notificationPermissionStatus === "granted" &&
				// setting if not set then default to true
				!(
					device.notificationSettings &&
					!device.notificationSettings.like
				)
			) {
				const notificationData: ExpoPushMessage = {
					to: device.pushNotificationToken,
					// data: {},
					title: "Someone just liked you!",
					// body: data.text,
					sound: "default",
				}
				sendPushNotifications([notificationData])
			}
		})
	}

	return { success: true }
})
