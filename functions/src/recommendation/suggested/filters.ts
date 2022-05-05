import * as admin from "firebase-admin"
import { WhereFilterOp } from "@google-cloud/firestore"
import { convertAgeToBirthday } from "../../utils"
type Filters = {
	gender?: string
	minAge?: number
	maxAge?: number
	minHeight?: number
	maxHeight?: number

	languages?: []
}

export const getFilters = async (selfUserId: string) => {
	const selfUserFiltersDocRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("filters")

	const filtersSnapshot = await selfUserFiltersDocRef.get()
	const res = filtersSnapshot.data() || {}
	return res as Filters
}

function where(a: string, b: string, c: any): [string, WhereFilterOp, any] {
	return [a, b as WhereFilterOp, c]
}

export const getQueryConstraints = async (filters: Filters) => {
	const { gender, minAge, maxAge, minHeight, maxHeight, languages } = filters

	const constraints = []

	if (gender) {
		constraints.push(where("gender", "==", gender))
	}
	let usedRangeFilter = false

	if (minAge) {
		usedRangeFilter = true
		constraints.push(where("birthday", "<=", convertAgeToBirthday(minAge)))
	}
	if (maxAge) {
		usedRangeFilter = true
		constraints.push(where("birthday", ">=", convertAgeToBirthday(maxAge)))
	}

	// firestore only allow range filter on one field
	if (!usedRangeFilter) {
		if (minHeight) {
			constraints.push(where("height", ">=", minHeight))
			usedRangeFilter = true
		}
		if (maxHeight) {
			constraints.push(where("height", "<=", maxHeight))
			usedRangeFilter = true
		}
	}

	if (languages && languages.length > 0) {
		constraints.push(where("languages", "array-contains-any", languages))
	}

	return constraints
}
