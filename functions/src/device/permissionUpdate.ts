import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const permissionUpdate = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const { deviceId, notificationPermissionStatus, pushNotificationToken } =
		data

	if (deviceId) {
		admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("devices")
			.doc(deviceId)
			.set(
				{
					deviceId,
					notificationPermissionStatus,
					pushNotificationToken,
					lastUpdateTime: new Date(),
				},
				{ merge: true }
			)
		return { success: true }
	}

	return { success: false, errorCode: 400 }
})
