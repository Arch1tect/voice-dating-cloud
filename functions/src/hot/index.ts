import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
// import { convertAgeToBirthday } from "../utils"

export const getHotUsers = functions.https.onCall(async (filters, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	// const { uid: selfUserId } = authUser

	const { gender } = filters

	// TODO: get state from filter
	let query = admin
		.firestore()
		.collection("users")
		.where("state", "==", "CA")
		.limit(20)

	if (gender) {
		query = query.where("gender", "==", gender)
	}

	// TODO: filter by age by making multiple queries
	// if (minAge) {
	// 	query = query.where("birthday", "<=", convertAgeToBirthday(minAge))
	// }
	// if (maxAge) {
	// 	query = query.where("birthday", ">=", convertAgeToBirthday(minAge))
	// }

	// TBD: how to make this list change often?? maybe factor in login time etc.
	query = query.orderBy("likeCount", "desc")

	const queryResult = await query.get()
	const res: any = []

	queryResult.forEach((docSnapshot) => {
		res.push(docSnapshot.data())
	})

	console.log(res.length)
	return res
})
