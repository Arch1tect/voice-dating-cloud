import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export type Filters = {
	gender?: string
	minAge?: number
	maxAge?: number
	minHeight?: number
	maxHeight?: number
	ethnicities?: string[]
	religions?: string[]
	languages?: string[]
	education?: number
	hasKids?: string // yes or no
	familyPlans?: string
	relationshipGoals?: string
	distance?: number // distance from filter is always in Kilometers
}

export const updateFilters = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const filtersRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("filters")

	// TODO: sanity user input
	filtersRef.set({ ...data, updatedAt: new Date() }, { merge: true })

	return { success: true }
})
