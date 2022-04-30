import * as functions from "firebase-functions"

import { getRole } from "./getRole"
import {
	getAnonymousCallQuota,
	getLikeQuota,
	getMatchCallQuota,
} from "./getQuota"

export const getPermissions = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const role = await getRole(selfUserId)
	const matchCall = await getMatchCallQuota(selfUserId, role)
	const anonymousCall = await getAnonymousCallQuota(selfUserId, role)
	const like = await getLikeQuota(selfUserId, role)

	return {
		success: true,
		data: { role, matchCall, anonymousCall, like },
	}
})
