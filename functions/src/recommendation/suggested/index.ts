import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { filterUsers, getQueryConstraints } from "./filters"
import { User } from "../../user/type"

/*
Client must always send together the filters, this is because client may update
filters and call this function right away, and server may not pull the latest filters
from firestore.
*/

export const getSuggestedUsers = functions.https.onCall(
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
		const selfUser: User = (
			await admin.firestore().collection("users").doc(selfUserId).get()
		).data() as User

		// TODO: check if user is VIP for certain filters
		const { filters } = data
		const queryConstraints = await getQueryConstraints(filters)

		let query = admin
			.firestore()
			.collection("users")
			.where("state", "==", selfUser.state)
			.limit(100)
		queryConstraints.forEach((q) => {
			query = query.where(...q)
		})

		const queryResult = await query.get()
		const queriedUsers: User[] = []

		queryResult.forEach((docSnapshot) => {
			queriedUsers.push(docSnapshot.data() as User)
		})

		const filteredRes = filterUsers(selfUser, queriedUsers, filters)
		console.log(
			"queryResult",
			queriedUsers.length,
			"filteredResult",
			filteredRes.length
		)
		return {
			success: true,
			data: filteredRes,
		}
	}
)
