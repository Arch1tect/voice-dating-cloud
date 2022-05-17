import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

// import { CALL_STATES } from "../state"
import { getToken } from "../agora"

async function updateCallCount(userId: string) {
	const callCountRef = admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("metadata")
		.doc("matchCall")
	const callCountDoc = await callCountRef.get()

	let todaysCount = 0
	if (callCountDoc.exists) {
		const callData = callCountDoc.data()
		// Check if data is from today
		const timestamp = callData?.updatedAt.seconds * 1000
		const dateThen = new Date(timestamp).getDate()
		const dateNow = new Date().getDate()
		if (dateNow === dateThen) {
			todaysCount = callData?.count
		}
	}

	callCountRef.set({
		updatedAt: new Date(),
		count: todaysCount + 1,
	})
}

export const answerCall = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: calleeId } = authUser
	const { contactId: callerId, callId } = data

	const channelName = `${callerId}-${calleeId}`
	const calleeToken = getToken(channelName, 1)

	const callData = {
		id: callId,
		createdAt: new Date(),
		callerId,
		calleeId,
		mode: "match",
	}

	admin
		.firestore()
		.collection("users")
		.doc(callerId)
		.collection("calls")
		.doc(callId)
		.set(callData)

	admin
		.firestore()
		.collection("users")
		.doc(calleeId)
		.collection("calls")
		.doc(callId)
		.set(callData)

	updateCallCount(callerId)

	return {
		success: true,
		data: {
			channelInfo: {
				channelName,
				selfId: 1,
				token: calleeToken,
			},
		},
	}
})
