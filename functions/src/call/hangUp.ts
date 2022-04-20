import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
// import { CALL_STATES } from "./state"
// import { sleep } from "../utils"

export const hangUp = functions.https.onCall(async (data, context) => {
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

	const selfCallRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("call")
		.doc("call")

	selfCallRef.set({})

	const contactCallRef = admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("call")
		.doc("call")

	// Let client handle contact hang up cases
	// with RTC tools which is more reliable than cloud function

	// contactCallRef.update({
	// 	state: CALL_STATES.OTHER_HANG_UP,
	// })
	// await sleep(3000)
	contactCallRef.set({})
	return { success: true }
})
