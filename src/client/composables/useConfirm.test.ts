import { beforeEach, describe, expect, it } from "vitest";
import { useConfirm } from "./useConfirm";

// Reset module-level singleton state between tests
function resetState() {
	const { resolve } = useConfirm();
	resolve(false);
}

describe("useConfirm", () => {
	beforeEach(() => {
		resetState();
	});

	it("returns false when resolve(false) is called", async () => {
		const { confirm, resolve } = useConfirm();
		const promise = confirm({ message: "Are you sure?" });
		resolve(false);
		expect(await promise).toBe(false);
	});

	it("returns true when resolve(true) is called", async () => {
		const { confirm, resolve } = useConfirm();
		const promise = confirm({ message: "Delete?" });
		resolve(true);
		expect(await promise).toBe(true);
	});

	it("sets state while pending and clears it after resolve", async () => {
		const { confirm, state, resolve } = useConfirm();
		const promise = confirm({ message: "Test message" });
		expect(state.value).not.toBeNull();
		expect(state.value?.message).toBe("Test message");
		resolve(true);
		await promise;
		expect(state.value).toBeNull();
	});

	it("passes options through state", async () => {
		const { confirm, state, resolve } = useConfirm();
		confirm({
			message: "msg",
			title: "Title",
			confirmLabel: "OK",
			cancelLabel: "No",
			danger: false,
		});
		expect(state.value?.title).toBe("Title");
		expect(state.value?.confirmLabel).toBe("OK");
		expect(state.value?.cancelLabel).toBe("No");
		expect(state.value?.danger).toBe(false);
		resolve(false);
	});

	it("handles sequential calls correctly", async () => {
		const { confirm, resolve } = useConfirm();
		const p1 = confirm({ message: "first" });
		resolve(true);
		expect(await p1).toBe(true);

		const p2 = confirm({ message: "second" });
		resolve(false);
		expect(await p2).toBe(false);
	});
});
