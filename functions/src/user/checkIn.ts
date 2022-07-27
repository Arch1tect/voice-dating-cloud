import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const checkIn = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const selfUserRef = admin.firestore().collection("users").doc(selfUserId)

	selfUserRef.update({ lastLoginTime: new Date() })

	// update device
	const {
		version,
		deviceId,
		notificationPermissionStatus,
		pushNotificationToken,
		deviceInfo,
	} = data

	console.log("app version", version)

	if (deviceId) {
		admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("devices")
			.doc(deviceId)
			.set(
				{
					deviceInfo,
					deviceId,
					notificationPermissionStatus,
					pushNotificationToken,
					lastLoginTime: new Date(),
				},
				{ merge: true }
			)
	}

	return { success: true }
})
