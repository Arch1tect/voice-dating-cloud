import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { getQueryConstraints } from "./filters"

/*
Client must always send together the filters, this is because client may update
filters and call this function right away, and server may not pull the latest filters
from firestore.
*/

export const getSuggestedUsers = functions.https.onCall(
	async (filters, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return
		}
		// const { uid: selfUserId } = authUser
		// Client must always send the filters when calling
		// const filters = data || (await getFilters(selfUserId))

		// TODO: check if user is VIP for certain filters
		const queryConstraints = await getQueryConstraints(filters)

		// TODO: get state from filter
		let query = admin
			.firestore()
			.collection("users")
			.where("state", "==", "CA")
			.limit(100)
		queryConstraints.forEach((q) => {
			query = query.where(...q)
		})

		const queryResult = await query.get()
		const res: any = []

		queryResult.forEach((docSnapshot) => {
			res.push(docSnapshot.data())
		})
		return res
	}
)
