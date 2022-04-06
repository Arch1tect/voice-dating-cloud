import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

function isBeingCalled(targetUserCallData: any) {
	if (targetUserCallData?.incomingCall) {
		const { calledAt } = targetUserCallData.incomingCall
		// maybe previous call data wasn't cleaned up properly
		// therefore we check the last call time
		// console.log("calledAt", calledAt)
		const now = new Date().getTime()
		// if older than 30 seconds then it's a previous call
		return now - calledAt.seconds * 1000 < 1000 * 30
	}
	return false
}

function allowCall(targetUserCallData: any) {
	if (targetUserCallData?.callMeEnabledTime) {
		// TODO: check time
		return true
	}
	return false
}

function hasOngoingCall(targetUserCallData: any) {
	if (targetUserCallData?.ongoingCall) {
		// TBD: there should be heartbeat mechanism
		// and we can check heartbeat to decide if the 'ongoingCall'
		// is still active or not.

		return true
	}
	return false
}

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
		const { targetUserId } = data

		const targetUserCallRef = admin
			.firestore()
			.collection("users")
			.doc(targetUserId)
			.collection("settings")
			.doc("call")

		const targetUserCallData = (await targetUserCallRef.get()).data()

		if (!allowCall(targetUserCallData)) {
			return {
				success: false,
				errorCode: 400,
			}
		}

		if (isBeingCalled(targetUserCallData)) {
			return {
				success: false,
				errorCode: 429,
			}
		}
		if (hasOngoingCall(targetUserCallData)) {
			return {
				success: false,
				errorCode: 409,
			}
		}

		targetUserCallRef.update({
			incomingCall: {
				callerId: selfUserId,
				calledAt: new Date(),
			},
		})

		return { success: true }
	}
)
