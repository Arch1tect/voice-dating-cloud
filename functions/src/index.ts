
import * as admin from "firebase-admin"
import {like} from './user/like'

admin.initializeApp()


exports.like = like