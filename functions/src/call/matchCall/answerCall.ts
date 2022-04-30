import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { CALL_STATES } from "../state"
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
	const { uid: selfUserId } = authUser
	const { contactId } = data

	const callerRef = admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("call")
		.doc("call")
	const calleeRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("call")
		.doc("call")

	const channelName = `${contactId}-${selfUserId}`
	const callerToken = getToken(channelName, 0)
	const calleeToken = getToken(channelName, 1)

	callerRef.update({
		state: CALL_STATES.CONNECTED,
		callMetadata: {
			channelName,
			selfId: 0,
			token: callerToken,
		},
	})

	calleeRef.update({
		state: CALL_STATES.CONNECTED,
		callMetadata: {
			channelName,
			selfId: 1,
			token: calleeToken,
		},
	})

	updateCallCount(contactId)

	return {
		success: true,
		data: {
			callMetadata: {
				channelName,
				selfId: 1,
				token: calleeToken,
			},
		},
	}
})
