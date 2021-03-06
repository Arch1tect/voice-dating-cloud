import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import * as sharp from "sharp"

import { sendPushNotifications } from "../notification/expo"
import { ExpoPushMessage } from "expo-server-sdk"

import {
	Image,
	MessageDataToSaveIntoFirestore,
	MessageDataFromClient,
} from "./type"

type FileSize = {
	name: "small" | "large"
	value: number
}

async function resizeAndUpload(
	filePath: string,
	size: number,
	originalImageBuffer: any
) {
	const imageBuffer = await sharp(originalImageBuffer).resize(size).toBuffer()
	const remoteFile = admin.storage().bucket().file(filePath)
	await remoteFile.save(imageBuffer, { public: true })
}

async function uploadPhoto(
	imageDataUrl: string,
	selfUserId: string,
	messageId: string
): Promise<Image> {
	const buffer = Buffer.from(imageDataUrl.split(",")[1], "base64")

	const fileSizes: FileSize[] = [
		{ name: "small", value: 480 },
		{ name: "large", value: 1080 },
	]
	const timestamp = new Date().getTime()
	const image: Image = { small: "", large: "" }
	for (let index = 0; index < fileSizes.length; index++) {
		const { name, value } = fileSizes[index]
		const filePath = `users/${selfUserId}/message/${timestamp}-${value}-${messageId}.jpg`

		await resizeAndUpload(filePath, value, buffer)

		const publicUrl = `https://storage.googleapis.com/voice-dating-app.appspot.com/${filePath}`
		image[name] = publicUrl
	}
	return image
}

export const sendMessage = functions.https.onCall(
	async (clientInput: MessageDataFromClient, context) => {
		const authUser = context.auth

		if (!authUser) {
			console.error("401")
			return {
				success: false,
				errorCode: 401,
			}
		}
		const { uid: selfUserId } = authUser
		const {
			_id: messageId,
			receiverId,
			imageDataUrl,
			text,
			senderName,
		} = clientInput

		// Ensure we don't save imageDataUrl into firestore since that's huge!
		const finalData: MessageDataToSaveIntoFirestore = {
			_id: messageId,
			receiverId,
			senderId: selfUserId,
			createdAt: new Date(),
		}
		if (imageDataUrl) {
			const image = await uploadPhoto(imageDataUrl, selfUserId, messageId)
			finalData.image = image
		} else {
			finalData.text = text
		}

		// TODO: sanity user input

		const senderMessageRef = admin
			.firestore()
			.collection("users")
			.doc(selfUserId)
			.collection("contacts")
			.doc(receiverId)
			.collection("messages")
			.doc(messageId)
		const receiverMessageRef = admin
			.firestore()
			.collection("users")
			.doc(receiverId)
			.collection("contacts")
			.doc(selfUserId)
			.collection("messages")
			.doc(messageId)
		senderMessageRef.set(finalData)
		receiverMessageRef.set(finalData)

		const devicesQueryRes = await admin
			.firestore()
			.collection("users")
			.doc(receiverId)
			.collection("devices")
			.get()

		devicesQueryRes.forEach((docSnapshot) => {
			const device = docSnapshot.data()

			if (
				device.pushNotificationToken &&
				device.notificationPermissionStatus === "granted" &&
				// setting if not set then default to true
				!(
					device.notificationSettings &&
					!device.notificationSettings.message
				)
			) {
				const notificationData: ExpoPushMessage = {
					to: device.pushNotificationToken,
					data: finalData,
					title: senderName,
					// subtitle: "sub title",
					// TODO: handle image message
					// TBD: need to slice?
					body: imageDataUrl ? "[image]" : text,
					sound: "default",
				}
				sendPushNotifications([notificationData])
			}
		})

		return { success: true }
	}
)
