import * as admin from "firebase-admin"
import { like } from "./user/like"
import { editInfo } from "./user/editInfo"
import { checkIn } from "./user/checkIn"
import { updateFilters } from "./user/updateFilters"
import { getSuggestedUsers } from "./suggested"
import { getHotUsers } from "./hot"
import { sendMessage } from "./message/send"
import { getMessages } from "./message/getMessages"
import { uploadPhoto } from "./user/uploadPhoto"
import { saveLastReadMessageTime } from "./message/saveLastReadMessageTime"
import { impersonate } from "./admin/impersonate"

import { callMe } from "./call/callMe"
import { makeOutgoingCall } from "./call/makeOutgoingCall"
import { answerCall } from "./call/answerCall"
import { hangUp } from "./call/hangUp"
import { declineIncomingCall } from "./call/declineIncomingCall"
import { cancelOutgoingCall } from "./call/cancelOutgoingCall"

admin.initializeApp()

exports.like = like
exports.editInfo = editInfo
exports.checkIn = checkIn
exports.updateFilters = updateFilters
exports.getSuggestedUsers = getSuggestedUsers
exports.getHotUsers = getHotUsers
exports.sendMessage = sendMessage
exports.getMessages = getMessages
exports.uploadPhoto = uploadPhoto
exports.saveLastReadMessageTime = saveLastReadMessageTime
exports.impersonate = impersonate

exports.callMe = callMe
exports.makeOutgoingCall = makeOutgoingCall
exports.cancelOutgoingCall = cancelOutgoingCall
exports.answerCall = answerCall
exports.declineIncomingCall = declineIncomingCall
exports.hangUp = hangUp
