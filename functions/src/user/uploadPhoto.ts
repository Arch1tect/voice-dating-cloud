import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import * as sharp from "sharp"
// import * as fs from "fs"

async function resizeAndUpload(
	filePath: string,
	size: number,
	originalImageBuffer: any
) {
	const imageBuffer = await sharp(originalImageBuffer).resize(size).toBuffer()
	const remoteFile = admin.storage().bucket().file(filePath)
	await remoteFile.save(imageBuffer, { public: true })
}

export const uploadPhoto = functions.https.onCall(async (data, context) => {
	const authUser = context.auth

	if (!authUser) {
		console.error("401")
		return
	}
	const { uid: selfUserId } = authUser

	const buffer = Buffer.from(data.split(",")[1], "base64")

	const fileSizes = [
		{ name: "small", value: 200 },
		{ name: "medium", value: 720 },
		{ name: "large", value: 1080 },
	]
	const timestamp = new Date().getTime()
	const res: { [key: string]: string } = {}
	for (let index = 0; index < fileSizes.length; index++) {
		const { value, name } = fileSizes[index]
		const filePath = `users/${selfUserId}/profile/${timestamp}-${value}.jpg`

		if (name === "small") {
			// client will try to display small image size once this function returns
			// therefore wait till finish uploading the small image
			await resizeAndUpload(filePath, value, buffer)
		} else {
			resizeAndUpload(filePath, value, buffer)
		}

		const publicUrl = `https://storage.googleapis.com/voice-dating-app.appspot.com/${filePath}`
		res[name] = publicUrl
	}

	return res
})
