import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { User } from "./type"

// Technically this is actually onboarding rather than signup, signup is
// already handled by the firebase auth system.
export const signUp = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const { name, birthday, location, job, photos, gender, language } = data
	const languages = [language]
	const now = new Date()
	const userData: User = {
		id: selfUserId,
		name,
		gender,
		languages,
		birthday,
		job,
		photos,
		city: location.city,
		state: location.state,
		lat: location.lat,
		lng: location.lng,
		createdAt: now,
		lastLoginTime: now,
		status: "good",
	}

	await admin.firestore().collection("users").doc(selfUserId).set(userData)

	const filterGender = gender === "male" ? "female" : "male"

	const age = new Date().getFullYear() - new Date(birthday).getFullYear()
	const minAge = Math.max(18, age - 5)
	const maxAge = Math.min(50, age + 5)

	await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("settings")
		.doc("filters")
		.set({ gender: filterGender, languages, maxAge, minAge })

	return { success: true }
})
