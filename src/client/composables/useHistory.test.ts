import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistory } from "./useHistory.ts";

const mockPut = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("../lib/api.ts", () => ({
	get: vi.fn().mockResolvedValue([]),
	post: vi.fn().mockResolvedValue({}),
	put: mockPut,
	del: vi.fn().mockResolvedValue({}),
}));

describe("useHistory.persistOrder", () => {
	beforeEach(() => {
		const { history } = useHistory();
		history.value = [
			{
				id: 10,
				title_id: 1,
				title: "A",
				display_name: null,
				year: 2020,
				sort_order: 0,
			},
			{
				id: 20,
				title_id: 2,
				title: "B",
				display_name: null,
				year: 2021,
				sort_order: 1,
			},
			{
				id: 30,
				title_id: 3,
				title: "C",
				display_name: null,
				year: 2022,
				sort_order: 2,
			},
		];
		mockPut.mockClear();
	});

	it("sends current id order to the server", async () => {
		const { persistOrder } = useHistory();
		await persistOrder();
		expect(mockPut).toHaveBeenCalledWith("/history/reorder", {
			ids: [10, 20, 30],
		});
	});

	it("sends updated order after external array mutation", async () => {
		const { history, persistOrder } = useHistory();
		const [a, b, c] = history.value;
		history.value = [c, a, b];
		await persistOrder();
		expect(mockPut).toHaveBeenCalledWith("/history/reorder", {
			ids: [30, 10, 20],
		});
	});

	it("does not call put when history is empty", async () => {
		const { history, persistOrder } = useHistory();
		history.value = [];
		await persistOrder();
		expect(mockPut).not.toHaveBeenCalled();
	});
});
