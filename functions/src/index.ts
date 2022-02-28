import * as admin from "firebase-admin"
import { like } from "./user/like"
import { editInfo } from "./user/editInfo"
import { checkIn } from "./user/checkIn"
import { callMe } from "./user/callMe"
import { updateFilters } from "./user/updateFilters"
import { getSuggestedUsers } from "./suggested"

admin.initializeApp()

exports.like = like
exports.editInfo = editInfo
exports.checkIn = checkIn
exports.callMe = callMe
exports.updateFilters = updateFilters
exports.getSuggested = getSuggestedUsers
