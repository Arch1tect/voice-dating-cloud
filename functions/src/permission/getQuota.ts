import * as admin from "firebase-admin"

const MATCH_CALL_QUOTA = 3
const ANONYMOUS_CALL_QUOTA = 5
const LIKE_QUOTA = 7

const VIP_MATCH_CALL_QUOTA = 7
const VIP_ANONYMOUS_CALL_QUOTA = 11
const VIP_LIKE_QUOTA = 15

function getTodaysCount(data: any) {
	const timestamp = data.updatedAt.seconds * 1000
	const dateThen = new Date(timestamp).getDate()
	const dateNow = new Date().getDate()
	if (dateNow === dateThen) {
		// TODO: not comparing month, year, probably no need
		return data.count
	}
	return 0
}

export const getLikeQuota = async (userId: string, role: string) => {
	const doc = await admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("metadata")
		.doc("like")
		.get()

	let count = 0
	if (doc.exists) {
		count = getTodaysCount(doc.data())
	}

	return {
		quota: role === "admin" || role === "vip" ? VIP_LIKE_QUOTA : LIKE_QUOTA,
		count,
	}
}

export const getMatchCallQuota = async (userId: string, role: string) => {
	const matchCallDoc = await admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("metadata")
		.doc("matchCall")
		.get()

	let count = 0
	if (matchCallDoc.exists) {
		count = getTodaysCount(matchCallDoc.data())
	}

	return {
		quota:
			role === "admin" || role === "vip"
				? VIP_MATCH_CALL_QUOTA
				: MATCH_CALL_QUOTA,
		count,
	}
}

export const getAnonymousCallQuota = async (userId: string, role: string) => {
	const doc = await admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("metadata")
		.doc("anonymousCall")
		.get()

	let count = 0
	if (doc.exists) {
		count = getTodaysCount(doc.data())
	}

	return {
		quota:
			role === "admin" || role === "vip"
				? VIP_ANONYMOUS_CALL_QUOTA
				: ANONYMOUS_CALL_QUOTA,
		count,
	}
}
