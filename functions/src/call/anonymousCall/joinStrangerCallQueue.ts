import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { CALL_STATES } from "../state"
import { getToken } from "../agora"

async function joinCallQueue(selfUser: any, selfFilter: any) {
	const callRef = admin
		.firestore()
		.collection("users")
		.doc(selfUser.id)
		.collection("call")
		.doc("call")

	const now = new Date()

	callRef.set({
		calledAt: now,
		mode: "anonymous",
		state: CALL_STATES.WAITING_FOR_STRANGER,
	})

	const callQueueRef = admin
		.firestore()
		.collection("anonymousCallQueue")
		.doc(selfUser.id)

	// TODO: client should include user's info and filter when queuing
	callQueueRef.set({
		user: selfUser,
		filters: selfFilter,
		calledAt: now,
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
	const contactQueryRes = await admin
		.firestore()
		.collection("anonymousCallQueue")
		.orderBy("calledAt", "desc")
		.get()
	const callQueue: any = []
	// console.log(messagesQueryRes.docs.length)
	contactQueryRes.forEach((docSnapshot) => {
		callQueue.push(docSnapshot.data())
	})

	for (let index = 0; index < callQueue.length; index++) {
		// const { user, filters } = callQueue[index]
		const { user } = callQueue[index]

		// TODO: check each user's filter and info against self user data
		targetUser = user
		// remove target from queue
		const targetQueueRef = admin
			.firestore()
			.collection("anonymousCallQueue")
			.doc(targetUser.id)
		targetQueueRef.delete()
		break
	}

	return targetUser
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

		const targetUser = await findTargetFromQueue(selfUser, selfFilter)

		if (targetUser) {
			const selfCallRef = admin
				.firestore()
				.collection("users")
				.doc(selfUserId)
				.collection("call")
				.doc("call")

			const targetCallRef = admin
				.firestore()
				.collection("users")
				.doc(targetUser.id)
				.collection("call")
				.doc("call")

			const now = new Date()

			const channelName = `${targetUser.id}-${selfUserId}`
			const targetCallToken = getToken(channelName, 0)
			const selfCallToken = getToken(channelName, 1)

			targetCallRef.set({
				contactId: selfUserId,
				// contact: selfUser, // user decide if they want to expose identity
				calledAt: now,
				mode: "anonymous",
				state: CALL_STATES.CONNECTED,
				callMetadata: {
					channelName,
					selfId: 0,
					token: targetCallToken,
				},
			})

			selfCallRef.set({
				contactId: targetUser.id,
				// contact: targetUser,  // user decide if they want to expose identity
				calledAt: now,
				mode: "anonymous",
				state: CALL_STATES.CONNECTED,
				callMetadata: {
					channelName,
					selfId: 1,
					token: selfCallToken,
				},
			})

			updateCallCount(selfUserId)
			updateCallCount(targetUser.id)
		} else {
			await joinCallQueue(selfUser, selfFilter)
		}

		return { success: true }
	}
)
