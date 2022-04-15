import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { CALL_STATES } from "./state"
import { sleep } from "../utils"

export const declineIncomingCall = functions.https.onCall(
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

		const calleeRef = admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("call")
			.doc("call")
		calleeRef.set({})

		const callerRef = admin
			.firestore()
			.collection("users")
			.doc(contactId)
			.collection("call")
			.doc("call")
		callerRef.update({
			state: CALL_STATES.OTHER_CANCELED_CALL,
		})

		await sleep(3000)
		callerRef.set({})
		return { success: true }
	}
)
