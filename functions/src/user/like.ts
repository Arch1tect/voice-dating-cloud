import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const like = functions.https.onCall((data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser
	const { like, targetUserId } = data

	const targetUserRef = admin
		.firestore()
		.collection("users")
		.doc(targetUserId)
	const selfUserContactDocRef = admin
		.firestore()
		.collection("users")
		.doc(selfUserId)
		.collection("contacts")
		.doc(targetUserId)
	const targetUserContactDocRef = admin
		.firestore()
		.collection("users")
		.doc(targetUserId)
		.collection("contacts")
		.doc(selfUserId)

	// IlikeYouTime and youLikeMeTime are also updated when dislike happen
	// which is ok, we can deduce whether the time is like or dislike time
	selfUserContactDocRef.set(
		{ id: targetUserId, IlikeYou: like, IlikeYouTime: new Date() },
		{ merge: true }
	)
	targetUserContactDocRef.set(
		{ id: selfUserId, youLikeMe: like, youLikeMeTime: new Date() },
		{ merge: true }
	)
	targetUserRef.update({
		likeCount: admin.firestore.FieldValue.increment(like ? 1 : -1),
	})

	// TODO: check today's like quota and update it

	return { success: true }
})
