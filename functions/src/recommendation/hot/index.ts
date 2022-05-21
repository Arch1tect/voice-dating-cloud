import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { User } from "../../user/type"
import { filterUsers, getQueryConstraints } from "./filters"
import { Filters } from "../../settings/updateFilters"
import { convertAgeToBirthday } from "../../utils"

function sortUsers(selfUser: User, filters: Filters, users: User[]) {
	const preferredBirthday =
		filters.minAge && filters.maxAge
			? convertAgeToBirthday((filters.minAge + filters.maxAge) / 2)
			: selfUser.birthday
	users
		.sort((u1, u2) => {
			const ageDiff1 = Math.abs(u1.birthday - preferredBirthday)
			const ageDiff2 = Math.abs(u2.birthday - preferredBirthday)
			return ageDiff1 - ageDiff2
		})
		.sort((u1, u2) => {
			return (u2.likeCount || 0) - (u1.likeCount || 0)
		})
}

export const getHotUsers = functions.https.onCall(async (data, context) => {
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

	queryConstraints.forEach((q) => {
		query = query.where(...q)
	})
	query = query.limit(100)
	query = query.orderBy("lastLoginTime", "desc")

	const queryResult = await query.get()
	const queriedUsers: User[] = []

	queryResult.forEach((docSnapshot) => {
		queriedUsers.push(docSnapshot.data() as User)
	})

	const filteredRes = filterUsers(queriedUsers, filters)

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
})
