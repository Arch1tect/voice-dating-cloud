import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { getQueryConstraints } from "./filters"

export const getSuggestedUsers = functions.https.onCall(
	async (data, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return
		}
		const { uid: selfUserId } = authUser

		// TODO: check if user is VIP for certain filters
		const queryConstraints = await getQueryConstraints(selfUserId)

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
