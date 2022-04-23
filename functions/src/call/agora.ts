import { RtcTokenBuilder, RtcRole } from "agora-access-token"

const AGORA_APP_ID = "3689fa0281824e40b959a80f9b42a2be"
const AGORA_APP_CERT = "73656b3448974900bcf3b3fdae191693"

export const getToken = (channelName: string, uid: number) => {
	const currentTime = Math.floor(Date.now() / 1000)
	const token = RtcTokenBuilder.buildTokenWithUid(
		AGORA_APP_ID,
		AGORA_APP_CERT,
		channelName,
		uid,
		RtcRole.PUBLISHER,
		currentTime + 60 * 60 * 2
	)
	return token
}
