import * as admin from "firebase-admin"
import { WhereFilterOp } from "@google-cloud/firestore"
import { convertAgeToBirthday, getDistance } from "../../utils"
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
	// let usedRangeFilter = false

	// if (minAge) {
	// 	usedRangeFilter = true
	// 	constraints.push(where("birthday", "<=", convertAgeToBirthday(minAge)))
	// }
	// if (maxAge) {
	// 	usedRangeFilter = true
	// 	constraints.push(where("birthday", ">=", convertAgeToBirthday(maxAge)))
	// }

	// firestore only allow range filter on one field
	// if (!usedRangeFilter) {
	// 	if (minHeight) {
	// 		constraints.push(where("height", ">=", minHeight))
	// 		usedRangeFilter = true
	// 	}
	// 	if (maxHeight) {
	// 		constraints.push(where("height", "<=", maxHeight))
	// 		usedRangeFilter = true
	// 	}
	// }

	if (languages && languages.length > 0) {
		constraints.push(where("languages", "array-contains-any", languages))
	}

	return constraints
}

export const filterUsers = (
	selfUser: User,
	users: User[],
	filters: Filters
) => {
	const {
		gender,
		minAge,
		maxAge,
		minHeight,
		maxHeight,
		languages,
		ethnicities,
		religions,
		education,
		hasKids,
		familyPlans,
		relationshipGoals,
		distance,
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

		if (languages && languages.length > 0) {
			const intersection = languages.filter((l) =>
				u.languages.includes(l)
			)
			if (intersection.length === 0) {
				console.warn("languages was not filtered properly")
				return false
			}
		}

		if (minHeight && u.height && u.height < minHeight) {
			return false
		}
		if (maxHeight && u.height && u.height > maxHeight) {
			return false
		}
		if (
			ethnicities &&
			ethnicities.length > 0 &&
			u.ethnicity &&
			!ethnicities.includes(u.ethnicity)
		) {
			return false
		}

		if (
			religions &&
			religions.length > 0 &&
			u.religion &&
			!religions.includes(u.religion)
		) {
			return false
		}

		if (education && u.education && u.education < education) {
			return false
		}

		if (hasKids && u.hasKids && hasKids !== u.hasKids) {
			return false
		}

		if (familyPlans && u.familyPlans && u.familyPlans !== familyPlans) {
			return false
		}

		if (
			relationshipGoals &&
			u.relationshipGoals &&
			relationshipGoals !== u.relationshipGoals
		) {
			return false
		}

		if (distance && u.lat && u.lng && selfUser.lat && selfUser.lng) {
			// distance from filter is always in Kilometers
			const dist = getDistance(
				u.lat,
				u.lng,
				selfUser.lat,
				selfUser.lng,
				"K"
			)
			if (dist > distance) {
				return false
			}
		}

		return true
	})
}
