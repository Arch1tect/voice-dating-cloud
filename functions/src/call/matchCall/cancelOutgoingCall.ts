import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { CALL_STATES } from "../state"
import { sleep } from "../../utils"

export const cancelOutgoingCall = functions.https.onCall(
	async (data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		const { uid: selfUserId } = authUser
		const { contactId } = data

		const callerRef = admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("call")
			.doc("call")

		callerRef.set({})

		const calleeRef = admin
			.firestore()
			.collection("users")
			.doc(contactId)
			.collection("call")
			.doc("call")

		calleeRef.update({
			state: CALL_STATES.OTHER_CANCELED_CALL,
		})
		// must wait 3 sec so client receive the OTHER_CANCELED_CALL event
		await sleep(3000)
		calleeRef.set({})
		return { success: true }
	}
)
