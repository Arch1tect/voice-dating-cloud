import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { filterUsers, getQueryConstraints } from "./filters"
import { User } from "../../user/type"
import { convertAgeToBirthday } from "../../utils"
import { Filters } from "../../settings/updateFilters"

/*
Client must always send together the filters, this is because client may update
filters and call this function right away, and server may not pull the latest filters
from firestore.
*/

function sortUsers(selfUser: User, filters: Filters, users: User[]) {
	const { minAge, maxAge } = filters
	let preferredBirthday = selfUser.birthday
	if (minAge || maxAge) {
		// in case user set only one of min and max ages, still want to use the range
		const min = minAge || 18
		const max = maxAge || 50
		preferredBirthday = convertAgeToBirthday((min + max) / 2)
	}

	users.sort((u1, u2) => {
		const ageDiff1 = Math.abs(u1.birthday - preferredBirthday)
		const ageDiff2 = Math.abs(u2.birthday - preferredBirthday)
		return ageDiff1 - ageDiff2
	})
	// .sort((u1, u2) => {
	// 	return (u2.likeCount || 0) - (u1.likeCount || 0)
	// }) // sorting by likeCount would be too similar to the hot list
}

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
			.where("status", "==", "good")
		// TODO: enable state filter when there are enough users
		// .where("state", "==", selfUser.state)

		queryConstraints.forEach((q) => {
			query = query.where(...q)
		})
		query = query.limit(1000)
		query = query.orderBy("lastLoginTime", "desc")

		const queryResult = await query.get()
		const queriedUsers: User[] = []

		queryResult.forEach((docSnapshot) => {
			queriedUsers.push(docSnapshot.data() as User)
		})

		const filteredRes = filterUsers(selfUser, queriedUsers, filters)

		sortUsers(selfUser, filters, filteredRes)

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
