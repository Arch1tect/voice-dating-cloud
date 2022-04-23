import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { CALL_STATES } from "../state"
import { getToken } from "../agora"

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
