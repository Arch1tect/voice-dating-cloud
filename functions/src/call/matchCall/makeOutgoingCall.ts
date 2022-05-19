import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { getToken } from "../agora"

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

// async function doesTargetAllowCall(targetUserId: string) {
// 	// Shouldn't really need this gard if frontend
// 	// is working properly
// 	const targetUserAllowCallRef = admin
// 		.firestore()
// 		.collection("users")
// 		.doc(targetUserId)
// 		.collection("call")
// 		.doc("allowIncomingCall")

// 	const allowCallFlag = (await targetUserAllowCallRef.get()).data()

// 	if (allowCallFlag?.enabledTime) {
// 		// TODO: check time
// 		return true
// 	}
// 	return false
// }

// function hasOngoingCall(targetUserCallData: any) {
// 	if (targetUserCallData?.ongoingCall) {
// 		// TBD: there should be heartbeat mechanism
// 		// and we can check heartbeat to decide if the 'ongoingCall'
// 		// is still active or not.

// 		return true
// 	}
// 	return false
// }

const MAX_WAIT_TIME = 15 * 1000
const TIMEOUT_ERROR_CODE = 408

type CleanUps = {
	timeoutId?: ReturnType<typeof setTimeout>
	unsubFromCall?: () => void
	unsubFromEvent?: () => void
}

function checkWaitTimeout(
	callId: string,
	calleeId: string,
	reject: (reason?: any) => void,
	cleanUp: () => void
) {
	return setTimeout(() => {
		console.log("wait time up")

		admin
			.firestore()
			.collection("users")
			.doc(calleeId)
			.collection("call")
			.doc("event")
			.set({
				callId,
				name: "incomingCallCanceled",
				createdAt: new Date(),
				data: {
					reason: "timeout",
				},
			})
		cleanUp()

		reject(TIMEOUT_ERROR_CODE)
	}, MAX_WAIT_TIME)
}

function checkCallDeclinedOrCanceled(
	callId: string,
	callerId: string,
	reject: (reason?: any) => void,
	cleanUp: () => void
) {
	return admin
		.firestore()
		.collection("users")
		.doc(callerId)
		.collection("call")
		.doc("event")
		.onSnapshot((snapshot) => {
			if (snapshot.exists) {
				const event = snapshot.data()

				if (event?.callId === callId) {
					if (event?.name === "outgoingCallDeclined") {
						cleanUp()
						reject(456)
					}
					if (event?.name === "outgoingCallCanceled") {
						cleanUp()
						reject(410)
					}
				}
			}
		})
}

function checkCallAnswered(
	callId: string,
	callerId: string,
	calleeId: string,
	resolve: (value: unknown) => void,
	cleanUp: () => void
) {
	return admin
		.firestore()
		.collection("users")
		.doc(callerId)
		.collection("calls")
		.doc(callId)
		.onSnapshot((snapshot) => {
			if (snapshot.exists) {
				console.log("other has answered the call")

				cleanUp()

				const channelName = `${callerId}-${calleeId}`
				const token = getToken(channelName, 0)
				const channelInfo = {
					channelName,
					token,
					selfId: 0,
				}

				resolve(channelInfo)
			}
		})
}

async function waitForAnswer(
	callId: string,
	callerId: string,
	calleeId: string
) {
	return new Promise((resolve, reject) => {
		const cleanUps: CleanUps = {}
		const cleanUp = () => {
			cleanUps.timeoutId && clearTimeout(cleanUps.timeoutId)
			cleanUps.unsubFromCall && cleanUps.unsubFromCall()
			cleanUps.unsubFromEvent && cleanUps.unsubFromEvent()
		}

		cleanUps.timeoutId = checkWaitTimeout(callId, calleeId, reject, cleanUp)

		cleanUps.unsubFromCall = checkCallAnswered(
			callId,
			callerId,
			calleeId,
			resolve,
			cleanUp
		)

		cleanUps.unsubFromEvent = checkCallDeclinedOrCanceled(
			callId,
			callerId,
			reject,
			cleanUp
		)
	})
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
		const { uid: callerId } = authUser

		const caller = (
			await admin.firestore().collection("users").doc(callerId).get()
		).data()

		const { contactId: calleeId, callId } = data

		// const targetUser = (
		// 	await admin.firestore().collection("users").doc(targetUserId).get()
		// ).data()

		// if (!(await doesTargetAllowCall(targetUserId))) {
		// 	return {
		// 		success: false,
		// 		errorCode: 400,
		// 	}
		// }

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

		admin
			.firestore()
			.collection("users")
			.doc(calleeId)
			.collection("call")
			.doc("event")
			.set({
				callId,
				name: "incomingCall",
				createdAt: new Date(),

				data: {
					caller,
				},
			})

		let res = {}
		try {
			const channelInfo = await waitForAnswer(callId, callerId, calleeId)
			res = {
				success: true,
				data: { channelInfo },
			}
		} catch (error) {
			console.error(error)
			res = {
				success: false,
				errorCode: error,
			}
		}

		return res
	}
)
