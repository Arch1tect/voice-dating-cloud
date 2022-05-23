import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { v4 as uuidv4 } from "uuid"
import { getToken } from "../agora"
import { Call } from "../type"
import { User } from "../../user/type"
import { Filters } from "../../settings/updateFilters"

const MAX_WAIT_TIME = 15 * 1000
const TIMEOUT_ERROR_CODE = 408

type CleanUps = {
	timeoutId?: ReturnType<typeof setTimeout>
	unsubFromCall?: () => void
	unsubFromEvent?: () => void
}

type QueuedCall = {
	callId: string
	user: User
	filters: Filters
	queuedAt: Date
}

async function joinCallQueue(callId: string, selfUser: any, selfFilter: any) {
	const callQueueRef = admin
		.firestore()
		.collection("anonymousCallQueue")
		.doc(selfUser.id)

	// TBD: to be faster, client should include user's info and filter when queuing?
	const queuedCall: QueuedCall = {
		callId,
		user: selfUser,
		filters: selfFilter,
		queuedAt: new Date(),
	}
	await callQueueRef.set(queuedCall)
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

function isMatch(
	targetUser: User,
	targetUserFilters: Filters,
	selfUser: User,
	selfUserFilters: Filters
) {
	if (selfUser.id === targetUser.id) {
		console.warn("cannot anonymous chat with self!")
		return false
	}

	if (
		selfUserFilters.gender &&
		selfUserFilters.gender !== targetUser.gender
	) {
		console.log("target gender out ")
		return false
	}

	if (
		targetUserFilters.gender &&
		targetUserFilters.gender !== selfUser.gender
	) {
		console.log("self gender out ")

		return false
	}

	if (selfUserFilters.languages?.length) {
		const intersection = selfUserFilters.languages.filter((l) =>
			targetUser.languages.includes(l)
		)
		if (intersection.length === 0) {
			console.log("target languages out ")

			return false
		}
	}
	if (targetUserFilters.languages?.length) {
		const intersection = targetUserFilters.languages.filter((l) =>
			selfUser.languages.includes(l)
		)
		if (intersection.length === 0) {
			console.log("self languages out ")

			return false
		}
	}

	return true
}

async function findTargetFromQueue(
	selfUserData: User,
	selfFilterData: Filters
) {
	let targetUser = null
	let targetCallId = null
	const contactQueryRes = await admin
		.firestore()
		.collection("anonymousCallQueue")
		.orderBy("queuedAt", "desc")
		.get()
	const callQueue: QueuedCall[] = []
	// console.log(messagesQueryRes.docs.length)
	contactQueryRes.forEach((docSnapshot) => {
		callQueue.push(docSnapshot.data() as QueuedCall)
	})

	// TODO: besides filtering, also sort by soft criteriors like distance, likeCount etc.
	for (let index = 0; index < callQueue.length; index++) {
		// const { user, filters } = callQueue[index]
		const { user, callId, filters } = callQueue[index]

		if (isMatch(user, filters, selfUserData, selfFilterData)) {
			targetUser = user
			targetCallId = callId

			break
		}
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
		).data() as User

		const selfFilter = (
			await admin
				.firestore()
				.collection("users")
				.doc(selfUserId)
				.collection("settings")
				.doc("filters")
				.get()
		).data() as Filters

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
