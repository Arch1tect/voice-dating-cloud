export const convertAgeToBirthday = (age: number) => {
	const today = new Date()
	today.setFullYear(today.getFullYear() - age)
	const res = today.getTime()

	return res
}

export const sleep = (milliseconds: number) => {
	return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
