import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const deleteAccount = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser

	const selfUserRef = admin.firestore().collection("users").doc(selfUserId)

	selfUserRef.update({ status: "deleted" })

	// Delete from contacts
	const contactsQueryRes = await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.get()

	contactsQueryRes.forEach((docSnapshot) => {
		const contact = docSnapshot.data()
		admin
			.firestore()
			.collection("users")
			.doc(contact.id)
			.collection("contacts")
			.doc(selfUserId)
			.update({ isDeleted: true })
	})

	// Delete from people I liked
	const peopleILikedQueryRes = await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("peopleILiked")
		.get()

	peopleILikedQueryRes.forEach((docSnapshot) => {
		const peopleILiked = docSnapshot.data()
		admin
			.firestore()
			.collection("users")
			.doc(peopleILiked.id)
			.collection("peopleLikedMe")
			.doc(selfUserId)
			.delete()
	})

	// Delete from people liked me
	const peopleLikedMeQueryRes = await admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("peopleLikedMe")
		.get()

	peopleLikedMeQueryRes.forEach((docSnapshot) => {
		const peopleLikedMe = docSnapshot.data()
		admin
			.firestore()
			.collection("users")
			.doc(peopleLikedMe.id)
			.collection("peopleILiked")
			.doc(selfUserId)
			.delete()
	})

	admin.auth().updateUser(selfUserId, {
		disabled: true,
	})

	return { success: true }
})
