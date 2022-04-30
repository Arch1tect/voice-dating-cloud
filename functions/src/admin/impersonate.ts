import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { getRole } from "../permission/getRole"

export const impersonate = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { targetUserId } = data
	const roleName = await getRole(selfUserId)

	if (roleName !== "admin") {
		console.error("Must be admin to impersonate")
		return {
			success: false,
			errorCode: 403,
		}
	}

	const impersonateToken = await admin.auth().createCustomToken(targetUserId)
	return {
		success: true,
		data: impersonateToken,
	}
})
