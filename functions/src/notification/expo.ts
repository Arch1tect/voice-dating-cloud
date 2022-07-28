import { Expo, ExpoPushMessage } from "expo-server-sdk"

// https://github.com/expo/expo-server-sdk-node

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
// let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
let expo = new Expo()

export const sendPushNotifications = async (messages: ExpoPushMessage[]) => {
	try {
		const tickets: any[] = await expo.sendPushNotificationsAsync(messages)

		const receiptIds = []
		for (let index = 0; index < tickets.length; index++) {
			const ticket = tickets[index]
			// console.log(ticket)
			if (ticket.id) {
				receiptIds.push(ticket.id)
			}
		}

		// NOTE: If a ticket contains an error code in ticket.details.error, you
		// must handle it appropriately. The error codes are listed in the Expo
		// documentation:
		// https://docs.expo.io/push-notifications/sending-notifications/#individual-errors

		const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds)

		for (let receiptId in receipts) {
			let { status, details } = receipts[receiptId]
			console.log("receipt", receipts[receiptId])

			if (status === "ok") {
				continue
			} else if (status === "error") {
				console.error(
					`There was an error sending a notification: ${details}`
				)
				// TODO: can't seem to get error message when client disable push notification
				// when testing, therefore not updating notification permission status here

				// if (details && details.error) {
				// 	// The error codes are listed in the Expo documentation:
				// 	// https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
				// 	// You must handle the errors appropriately.
				// 	console.error(`The error code is ${details.error}`)
				// }
			}
		}
	} catch (error) {
		console.error(error)
	}
}

export const sendPushNotificationsOld = async (messages: ExpoPushMessage[]) => {
	let chunks = expo.chunkPushNotifications(messages)
	let tickets: any[] = []

	// Send the chunks to the Expo push notification service. There are
	// different strategies you could use. A simple one is to send one chunk at a
	// time, which nicely spreads the load out over time:
	for (let chunk of chunks) {
		try {
			let ticketChunk = await expo.sendPushNotificationsAsync(chunk)
			console.log("tickets", ticketChunk)
			tickets.push(...ticketChunk)
			// NOTE: If a ticket contains an error code in ticket.details.error, you
			// must handle it appropriately. The error codes are listed in the Expo
			// documentation:
			// https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
		} catch (error) {
			console.error(error)
		}
	}

	// return

	// Later, after the Expo push notification service has delivered the
	// notifications to Apple or Google (usually quickly, but allow the the service
	// up to 30 minutes when under load), a "receipt" for each notification is
	// created. The receipts will be available for at least a day; stale receipts
	// are deleted.
	//
	// The ID of each receipt is sent back in the response "ticket" for each
	// notification. In summary, sending a notification produces a ticket, which
	// contains a receipt ID you later use to get the receipt.
	//
	// The receipts may contain error codes to which you must respond. In
	// particular, Apple or Google may block apps that continue to send
	// notifications to devices that have blocked notifications or have uninstalled
	// your app. Expo does not control this policy and sends back the feedback from
	// Apple and Google so you can handle it appropriately.
	let receiptIds = []
	for (let ticket of tickets) {
		// NOTE: Not all tickets have IDs; for example, tickets for notifications
		// that could not be enqueued will have error information and no receipt ID.
		if (ticket.id) {
			receiptIds.push(ticket.id)
		}
	}

	let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)

	// Like sending notifications, there are different strategies you could use
	// to retrieve batches of receipts from the Expo service.
	for (let chunk of receiptIdChunks) {
		try {
			let receipts = await expo.getPushNotificationReceiptsAsync(chunk)
			console.log("receipts", receipts)

			// The receipts specify whether Apple or Google successfully received the
			// notification and information about an error, if one occurred.
			for (let receiptId in receipts) {
				let { status } = receipts[receiptId]
				console.log(receipts[receiptId])
				if (status === "ok") {
					continue
				} else if (status === "error") {
					// console.error(
					// 	`There was an error sending a notification: ${message}`
					// )
					// if (details && details.error) {
					// 	// The error codes are listed in the Expo documentation:
					// 	// https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
					// 	// You must handle the errors appropriately.
					// 	console.error(`The error code is ${details.error}`)
					// }
				}
			}
		} catch (error) {
			console.error(error)
		}
	}
}
