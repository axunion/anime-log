import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistory } from "./useHistory.ts";

const mockPut = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("../lib/api.ts", () => ({
	get: vi.fn().mockResolvedValue([]),
	post: vi.fn().mockResolvedValue({}),
	put: mockPut,
	del: vi.fn().mockResolvedValue({}),
}));

describe("useHistory.reorder", () => {
	beforeEach(() => {
		const { history } = useHistory();
		history.value = [
			{ id: 10, title_id: 1, title: "A", display_name: null, year: 2020, sort_order: 0 },
			{ id: 20, title_id: 2, title: "B", display_name: null, year: 2021, sort_order: 1 },
			{ id: 30, title_id: 3, title: "C", display_name: null, year: 2022, sort_order: 2 },
		];
		mockPut.mockClear();
	});

	it("moving first item up is a no-op", async () => {
		const { reorder } = useHistory();
		await reorder(0, "up");
		expect(mockPut).not.toHaveBeenCalled();
	});

	it("moving last item down is a no-op", async () => {
		const { history, reorder } = useHistory();
		await reorder(history.value.length - 1, "down");
		expect(mockPut).not.toHaveBeenCalled();
	});

	it("moving an item up swaps it with the previous one", async () => {
		const { history, reorder } = useHistory();
		await reorder(1, "up");
		expect(history.value.map((h) => h.id)).toEqual([20, 10, 30]);
		expect(mockPut).toHaveBeenCalledWith("/history/reorder", { ids: [20, 10, 30] });
	});

	it("moving an item down swaps it with the next one", async () => {
		const { history, reorder } = useHistory();
		await reorder(1, "down");
		expect(history.value.map((h) => h.id)).toEqual([10, 30, 20]);
		expect(mockPut).toHaveBeenCalledWith("/history/reorder", { ids: [10, 30, 20] });
	});

	it("does not throw on single-element list", async () => {
		const { history, reorder } = useHistory();
		history.value = [
			{ id: 10, title_id: 1, title: "A", display_name: null, year: 2020, sort_order: 0 },
		];
		await expect(reorder(0, "up")).resolves.toBeUndefined();
		await expect(reorder(0, "down")).resolves.toBeUndefined();
		expect(mockPut).not.toHaveBeenCalled();
	});
});
