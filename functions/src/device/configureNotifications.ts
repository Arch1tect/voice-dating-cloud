import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const configureNotifications = functions.https.onCall(
	(data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		const { uid: selfUserId } = authUser

		const { deviceId, notificationSettings } = data

		if (deviceId) {
			admin
				.firestore()
				.collection("users")
				.doc(selfUserId)
				.collection("devices")
				.doc(deviceId)
				.set(
					{
						notificationSettings,
						deviceId,
						lastUpdateTime: new Date(),
					},
					{ merge: true }
				)
			return { success: true }
		}

		return { success: false, errorCode: 400 }
	}
)
