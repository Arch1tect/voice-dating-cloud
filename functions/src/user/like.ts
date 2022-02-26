import * as functions from "firebase-functions"
import * as admin from "firebase-admin"


export const like = functions.https.onCall((data, context) => {
	const authUser = context.auth

  if (!authUser) {
		console.error('401')
    return
	}
  const {uid:userId} = authUser

	const userRef = admin.firestore().collection("users").doc(userId)
  console.log(userRef)

  console.log('like============')
})