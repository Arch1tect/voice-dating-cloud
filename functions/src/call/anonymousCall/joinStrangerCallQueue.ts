import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { CALL_STATES } from "../state"
import { getToken } from "../agora"

async function joinCallQueue(selfUserId: string) {
	const callRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("call")
		.doc("call")

	const now = new Date()

	callRef.set({
		calledAt: now,
		state: CALL_STATES.WAITING_FOR_STRANGER,
	})

	const callQueueRef = admin
		.firestore()
		.collection("anonymousCallQueue")
		.doc(selfUserId)

	// TODO: client should include user's info and filter when queuing

	callQueueRef.set({ id: selfUserId, calledAt: now })
}

async function findTargetFromQueue() {
	let targetUser = null
	const contactQueryRes = await admin
		.firestore()
		.collection("anonymousCallQueue")
		.orderBy("calledAt", "desc")
		.get()
	const users: any = []
	// console.log(messagesQueryRes.docs.length)
	contactQueryRes.forEach((docSnapshot) => {
		const user = docSnapshot.data()
		users.push(user)
	})

	for (let index = 0; index < users.length; index++) {
		const user = users[index]
		// TODO: check each user's filter and info

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

		const targetUser = await findTargetFromQueue()

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
				calledAt: now,
				state: CALL_STATES.CONNECTED,
				callMetadata: {
					channelName,
					selfId: 0,
					token: targetCallToken,
				},
			})

			selfCallRef.set({
				contactId: targetUser.id,
				calledAt: now,
				state: CALL_STATES.CONNECTED,
				callMetadata: {
					channelName,
					selfId: 1,
					token: selfCallToken,
				},
			})
		} else {
			await joinCallQueue(selfUserId)
		}

		return { success: true }
	}
)
