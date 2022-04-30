import * as admin from "firebase-admin"

export const getRole = async (userId: string) => {
	const roleDoc = await admin
		.firestore()
		.collection("users")
		.doc(userId)
		.collection("permissions")
		.doc("role")
		.get()

	if (!roleDoc.exists) {
		console.log("role not found")
		return null
	}

	const role = roleDoc.data()
	return role?.name
}
