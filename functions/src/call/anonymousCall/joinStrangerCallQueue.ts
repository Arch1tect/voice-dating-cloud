import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { v4 as uuidv4 } from "uuid"
import { getToken } from "../agora"
import { Call } from "../type"

const MAX_WAIT_TIME = 15 * 1000
const TIMEOUT_ERROR_CODE = 408

type CleanUps = {
	timeoutId?: ReturnType<typeof setTimeout>
	unsubFromCall?: () => void
	unsubFromEvent?: () => void
}

async function joinCallQueue(callId: string, selfUser: any, selfFilter: any) {
	const callQueueRef = admin
		.firestore()
		.collection("anonymousCallQueue")
		.doc(selfUser.id)

	// TBD: to be faster, client should include user's info and filter when queuing?
	await callQueueRef.set({
		callId,
		user: selfUser,
		filters: selfFilter,
		queuedAt: new Date(),
	})
}

async function updateCallCount(userId: string) {
	const callCountRef = admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("metadata")
		.doc("anonymousCall")
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
async function findTargetFromQueue(selfUserData: any, selfFilterData: any) {
	let targetUser = null
	let targetCallId = null
	const contactQueryRes = await admin
		.firestore()
		.collection("anonymousCallQueue")
		.orderBy("queuedAt", "desc")
		.get()
	const callQueue: any = []
	// console.log(messagesQueryRes.docs.length)
	contactQueryRes.forEach((docSnapshot) => {
		callQueue.push(docSnapshot.data())
	})

	for (let index = 0; index < callQueue.length; index++) {
		// const { user, filters } = callQueue[index]
		const { user, callId } = callQueue[index]

		// TODO: check each user's filter and info against self user data
		targetUser = user
		targetCallId = callId

		break
	}

	return { targetUser, targetCallId }
}
function checkCallCanceled(
	selfUserId: string,
	reject: (reason?: any) => void,
	cleanUp: () => void
) {
	return admin
		.firestore()
		.collection("anonymousCallQueue")
		.doc(selfUserId)
		.onSnapshot((snapshot) => {
			if (!snapshot.exists) {
				cleanUp()
				reject(411)
			}
		})
}

function checkCallConnected(
	callId: string,
	selfUserId: string,
	resolve: (value: unknown) => void,
	cleanUp: () => void
) {
	return admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("calls")
		.doc(callId)
		.onSnapshot((snapshot) => {
			if (snapshot.exists) {
				const { callerId, calleeId } = snapshot.data() as Call

				const channelName = `${callerId}-${calleeId}`
				const token = getToken(channelName, 0)
				const channelInfo = {
					channelName,
					token,
					selfId: 0,
				}
				cleanUp()

				resolve({ channelInfo, contactId: calleeId })
			}
		})
}

function checkWaitTimeout(
	selfUserId: string,
	reject: (reason?: any) => void,
	cleanUp: () => void
) {
	return setTimeout(() => {
		console.log("wait time up")
		cleanUp()

		const callQueueRef = admin
			.firestore()
			.collection("anonymousCallQueue")
			.doc(selfUserId)

		callQueueRef.delete()

		reject(TIMEOUT_ERROR_CODE)
	}, MAX_WAIT_TIME)
}

async function waitForConnection(callId: string, selfUserId: string) {
	return new Promise((resolve, reject) => {
		const cleanUps: CleanUps = {}
		const cleanUp = () => {
			cleanUps.timeoutId && clearTimeout(cleanUps.timeoutId)
			cleanUps.unsubFromCall && cleanUps.unsubFromCall()
			cleanUps.unsubFromEvent && cleanUps.unsubFromEvent()
		}

		cleanUps.timeoutId = checkWaitTimeout(selfUserId, reject, cleanUp)

		cleanUps.unsubFromCall = checkCallConnected(
			callId,
			selfUserId,
			resolve,
			cleanUp
		)

		cleanUps.unsubFromEvent = checkCallCanceled(selfUserId, reject, cleanUp)
	})
}

export const joinStrangerCallQueue = functions.https.onCall(
	async (data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		let res = {}
		const { uid: selfUserId } = authUser

		const selfUser = (
			await admin.firestore().collection("users").doc(selfUserId).get()
		).data()

		const selfFilter =
			(
				await admin
					.firestore()
					.collection("users")
					.doc(selfUserId)
					.collection("settings")
					.doc("filters")
					.get()
			).data() || {}

		const { targetUser, targetCallId } = await findTargetFromQueue(
			selfUser,
			selfFilter
		)

		if (targetUser && targetCallId) {
			const call: Call = {
				id: targetCallId,
				callerId: targetUser.id,
				calleeId: selfUserId,
				mode: "anonymous",
				createdAt: new Date(),
			}

			admin
				.firestore()
				.collection("users")
				.doc(selfUserId)
				.collection("calls")
				.doc(targetCallId)
				.set(call)

			await admin
				.firestore()
				.collection("users")
				.doc(targetUser.id)
				.collection("calls")
				.doc(targetCallId)
				.set(call)

			// Note: only remove target from queue after created the call
			// or waitForConnection will think user has canceled waiting
			const targetQueueRef = admin
				.firestore()
				.collection("anonymousCallQueue")
				.doc(targetUser.id)
			targetQueueRef.delete()

			const channelName = `${call.callerId}-${call.calleeId}`
			const token = getToken(channelName, 1)
			const channelInfo = {
				channelName,
				token,
				selfId: 1,
			}

			res = {
				success: true,
				data: {
					channelInfo,
					callId: targetCallId,
					contactId: targetUser.id,
				},
			}

			updateCallCount(selfUserId)
			updateCallCount(targetUser.id)
		} else {
			const callId = uuidv4()
			await joinCallQueue(callId, selfUser, selfFilter)

			try {
				const { channelInfo, contactId } = (await waitForConnection(
					callId,
					selfUserId
				)) as any
				res = {
					success: true,
					data: { channelInfo, callId, contactId },
				}
			} catch (error) {
				console.error(error)
				res = {
					success: false,
					errorCode: error,
				}
			}
		}

		return res
	}
)
