import * as admin from "firebase-admin"
import { like } from "./user/like"
import { update } from "./user/update"
import { login } from "./user/login"

admin.initializeApp()

exports.like = like
exports.update = update
exports.login = login
