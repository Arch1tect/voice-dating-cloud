import * as admin from "firebase-admin"
import { WhereFilterOp } from "@google-cloud/firestore"
import { convertAgeToBirthday } from "../../utils"
import { User } from "../../user/type"
import { Filters } from "../../settings/updateFilters"

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
	const { gender, languages } = filters

	const constraints = []

	if (gender) {
		constraints.push(where("gender", "==", gender))
	}

	if (languages && languages.length > 0) {
		constraints.push(where("languages", "array-contains-any", languages))
	}

	return constraints
}

export const filterUsers = (
	// selfUser: User,
	users: User[],
	filters: Filters
) => {
	const {
		gender,
		minAge,
		maxAge,
		// minHeight,
		// maxHeight,
		// languages,
		// ethnicities,
		// religions,
		// education,
		// hasKids,
		// familyPlans,
		// relationshipGoals,
		// distance,
	} = filters

	return users.filter((u) => {
		if (gender && gender !== u.gender) {
			console.warn("gender was not filtered properly")
			return false
		}

		if (minAge && u.birthday > convertAgeToBirthday(minAge)) {
			// console.warn("minAge was not filtered properly")
			return false
		}

		if (maxAge && u.birthday < convertAgeToBirthday(maxAge)) {
			// console.warn("maxAge was not filtered properly")
			return false
		}

		// if (languages && languages.length > 0) {
		// 	const intersection = languages.filter((l) =>
		// 		u.languages.includes(l)
		// 	)
		// 	if (intersection.length === 0) {
		// 		console.warn("languages was not filtered properly")
		// 		return false
		// 	}
		// }

		// if (
		// 	ethnicities &&
		// 	ethnicities.length > 0 &&
		// 	u.ethnicity &&
		// 	!ethnicities.includes(u.ethnicity)
		// ) {
		// 	return false
		// }

		// if (
		// 	religions &&
		// 	religions.length > 0 &&
		// 	u.religion &&
		// 	!religions.includes(u.religion)
		// ) {
		// 	return false
		// }

		return true
	})
}
