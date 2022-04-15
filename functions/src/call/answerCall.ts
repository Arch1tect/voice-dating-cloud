import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { RtcTokenBuilder, RtcRole } from "agora-access-token"
import { CALL_STATES } from "./state"

const AGORA_APP_ID = "3689fa0281824e40b959a80f9b42a2be"
const AGORA_APP_CERT = "73656b3448974900bcf3b3fdae191693"
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

	const currentTime = Math.floor(Date.now() / 1000)
	const channelName = `${contactId}-${selfUserId}`
	const callerToken = RtcTokenBuilder.buildTokenWithUid(
		AGORA_APP_ID,
		AGORA_APP_CERT,
		channelName,
		0,
		RtcRole.PUBLISHER,
		currentTime + 60 * 60 * 2
	)
	const calleeToken = RtcTokenBuilder.buildTokenWithUid(
		AGORA_APP_ID,
		AGORA_APP_CERT,
		channelName,
		1,
		RtcRole.PUBLISHER,
		currentTime + 60 * 60 * 2
	)

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
