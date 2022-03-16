import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const saveLastReadMessageTime = functions.https.onCall(
	async (clientInput, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		const { uid: selfUserId } = authUser
		const { contactId } = clientInput

		admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("contacts")
			.doc(contactId)
			.update({ lastReadMessageTime: new Date() })

		return { success: true }
	}
)
