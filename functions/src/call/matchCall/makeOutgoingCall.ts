import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { CALL_STATES } from "../state"

// function isBeingCalled(targetUserCallData: any) {
// 	if (targetUserCallData?.incomingCall) {
// 		const { calledAt } = targetUserCallData.incomingCall
// 		// maybe previous call data wasn't cleaned up properly
// 		// therefore we check the last call time
// 		// console.log("calledAt", calledAt)
// 		const now = new Date().getTime()
// 		// if older than 30 seconds then it's a previous call
// 		return now - calledAt.seconds * 1000 < 1000 * 30
// 	}
// 	return false
// }

async function doesTargetAllowCall(targetUserId: string) {
	// Shouldn't really need this gard if frontend
	// is working properly
	const targetUserAllowCallRef = admin
		.firestore()
		.collection("users")
		.doc(targetUserId)
		.collection("call")
		.doc("allowIncomingCall")

	const allowCallFlag = (await targetUserAllowCallRef.get()).data()

	if (allowCallFlag?.enabledTime) {
		// TODO: check time
		return true
	}
	return false
}

// function hasOngoingCall(targetUserCallData: any) {
// 	if (targetUserCallData?.ongoingCall) {
// 		// TBD: there should be heartbeat mechanism
// 		// and we can check heartbeat to decide if the 'ongoingCall'
// 		// is still active or not.

// 		return true
// 	}
// 	return false
// }

export const makeOutgoingCall = functions.https.onCall(
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

		const selfUser = (
			await admin.firestore().collection("users").doc(selfUserId).get()
		).data()

		const { targetUserId } = data

		const targetUser = (
			await admin.firestore().collection("users").doc(targetUserId).get()
		).data()

		if (!(await doesTargetAllowCall(targetUserId))) {
			return {
				success: false,
				errorCode: 400,
			}
		}

		// if (isBeingCalled(targetUserCallData)) {
		// 	return {
		// 		success: false,
		// 		errorCode: 429,
		// 	}
		// }
		// if (hasOngoingCall(targetUserCallData)) {
		// 	return {
		// 		success: false,
		// 		errorCode: 409,
		// 	}
		// }

		const callerRef = admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("call")
			.doc("call")

		const now = new Date()

		callerRef.set({
			contactId: targetUserId,
			contact: targetUser,
			calledAt: now,
			state: CALL_STATES.WAITING_FOR_OTHER_TO_PICKUP,
			mode: "match",
		})

		const calleeRef = admin
			.firestore()
			.collection("users")
			.doc(targetUserId)
			.collection("call")
			.doc("call")

		calleeRef.set({
			contactId: selfUserId,
			contact: selfUser,
			calledAt: now,
			state: CALL_STATES.WAITING_FOR_SELF_TO_PICKUP,
			mode: "match",
		})

		return { success: true }
	}
)
