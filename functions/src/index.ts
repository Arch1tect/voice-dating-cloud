import * as admin from "firebase-admin"
import { like } from "./user/like"
import { editInfo } from "./user/editInfo"
import { pause } from "./user/pause"
import { checkIn } from "./user/checkIn"
import { reportUser } from "./user/report"
import { uploadPhoto } from "./user/uploadPhoto"
import { signUp } from "./user/signup"

import { getSuggestedUsers } from "./recommendation/suggested"
import { getHotUsers } from "./recommendation/hot"

import { getMessages } from "./message/getMessages"
import { sendMessage } from "./message/send"
import { saveLastReadMessageTime } from "./message/saveLastReadMessageTime"

import { impersonate } from "./admin/impersonate"

import { callMe } from "./call/matchCall/callMe"
import { makeOutgoingCall } from "./call/matchCall/makeOutgoingCall"
import { answerCall } from "./call/matchCall/answerCall"
import { hangUp } from "./call/hangUp"
import { declineIncomingCall } from "./call/matchCall/declineIncomingCall"
import { cancelOutgoingCall } from "./call/matchCall/cancelOutgoingCall"

import { joinStrangerCallQueue } from "./call/anonymousCall/joinStrangerCallQueue"
import { leaveStrangerCallQueue } from "./call/anonymousCall/leaveStrangerCallQueue"
import { exposeIdentity } from "./call/anonymousCall/exposeIdentity"
import { unlockMessaging } from "./call/unlockMessaging"

import { getPermissions } from "./permission"

import { updateFilters } from "./settings/updateFilters"
import { updatePreferences } from "./settings/updatePreferences"
import { deleteAccount } from "./user/delete"
import { configureNotifications } from "./device/configureNotifications"
import { permissionUpdate } from "./device/permissionUpdate"

admin.initializeApp()

exports.signUp = signUp
exports.like = like
exports.editInfo = editInfo
exports.checkIn = checkIn
exports.pause = pause
exports.uploadPhoto = uploadPhoto
exports.reportUser = reportUser
exports.deleteAccount = deleteAccount

exports.configureNotifications = configureNotifications
exports.permissionUpdate = permissionUpdate

exports.getSuggestedUsers = getSuggestedUsers
exports.getHotUsers = getHotUsers

exports.sendMessage = sendMessage
exports.getMessages = getMessages
exports.saveLastReadMessageTime = saveLastReadMessageTime

exports.callMe = callMe
exports.makeOutgoingCall = makeOutgoingCall
exports.cancelOutgoingCall = cancelOutgoingCall
exports.answerCall = answerCall
exports.declineIncomingCall = declineIncomingCall

exports.joinStrangerCallQueue = joinStrangerCallQueue
exports.leaveStrangerCallQueue = leaveStrangerCallQueue
exports.exposeIdentity = exposeIdentity
exports.unlockMessaging = unlockMessaging
exports.hangUp = hangUp

exports.getPermissions = getPermissions

exports.updatePreferences = updatePreferences
exports.updateFilters = updateFilters

exports.impersonate = impersonate
