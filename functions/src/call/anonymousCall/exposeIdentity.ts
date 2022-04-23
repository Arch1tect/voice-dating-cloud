import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

type callData = {
	hasExposedIdentity?: boolean
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
		//  TODO: add to match
		console.log("match")
	}
	return { success: true }
})
