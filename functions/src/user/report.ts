import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { v4 as uuidv4 } from "uuid"

export const reportUser = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return {
			success: false,
			errorCode: 401,
		}
	}
	const { uid: selfUserId } = authUser
	const { userId, reason } = data

	// This id is the same in target user's report sub collection and in top level reports collection
	const reportId = uuidv4()

	const targetUserRef = admin.firestore().collection("users").doc(userId)

	targetUserRef
		.collection("reports")
		.doc(reportId)
		.set({ id: reportId, reporterId: selfUserId, reason })

	const reportQueryRes = await targetUserRef.collection("reports").get()

	let hasSameUserReportedTargetUserBefore = false
	reportQueryRes.forEach((docSnapshot) => {
		const prevReport = docSnapshot.data()
		if (prevReport.reporterId === selfUserId) {
			hasSameUserReportedTargetUserBefore = true
		}
	})

	if (!hasSameUserReportedTargetUserBefore) {
		targetUserRef.update({
			reportCount: admin.firestore.FieldValue.increment(1),
		})
	}
	admin
		.firestore()
		.collection("reports")
		.doc(reportId)
		.set({ id: reportId, userId, reporterId: selfUserId, reason })

	return { success: true }
})
