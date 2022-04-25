import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

type callData = {
	hasExposedIdentity?: boolean
}

// TBD: important, there is race condition when we implement it this way.
// An alternative would be for client to check for the state that both self
// and other user have exposed identity then, call a match endpoint in backend.
async function matchUsers(selfUserId: string, contactUserId: string) {
	const createdAt = new Date()
	const selfUserLikedDocRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("peopleILiked")
		.doc(contactUserId)
	const selfUserLikedMeDocRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("peopleLikedMe")
		.doc(contactUserId)
	const contactUserLikedDocRef = admin
		.firestore()
		.collection("users")
		.doc(contactUserId)
		.collection("peopleILiked")
		.doc(selfUserId)
	const contactUserLikedMeDocRef = admin
		.firestore()
		.collection("users")
		.doc(contactUserId)
		.collection("peopleLikedMe")
		.doc(selfUserId)

	selfUserLikedDocRef.set({ id: contactUserId, createdAt })
	selfUserLikedMeDocRef.set({ id: contactUserId, createdAt })
	contactUserLikedDocRef.set({ id: selfUserId, createdAt })
	contactUserLikedMeDocRef.set({ id: selfUserId, createdAt })

	const selfRef = admin.firestore().collection("users").doc(selfUserId)
	selfRef.update({
		likeCount: admin.firestore.FieldValue.increment(1),
	})

	const contactRef = admin.firestore().collection("users").doc(contactUserId)
	contactRef.update({
		likeCount: admin.firestore.FieldValue.increment(1),
	})
}

export const exposeIdentity = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { contactId } = data
	const selfCallRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("call")
		.doc("call")
	selfCallRef.update({
		hasExposedIdentity: true, // user decide if they want to expose identity
	})

	const selfUser = (
		await admin.firestore().collection("users").doc(selfUserId).get()
	).data()
	const contactCallRef = admin
		.firestore()
		.collection("users")
		.doc(contactId)
		.collection("call")
		.doc("call")
	contactCallRef.update({ contact: selfUser })
	const contactCallData = (await contactCallRef.get()).data() as callData
	if (contactCallData?.hasExposedIdentity) {
		// both has exposed identity, match two users now
		matchUsers(selfUserId, contactId)
	}
	return { success: true }
})
