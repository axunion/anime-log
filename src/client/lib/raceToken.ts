export function createRaceToken() {
	let token = 0;
	return {
		next: () => ++token,
		current: () => token,
		invalidate: () => {
			token++;
		},
	};
}
