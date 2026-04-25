import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockPut = vi.hoisted(() => vi.fn());
const mockDel = vi.hoisted(() => vi.fn());
const fetchHistoryMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api.ts", () => ({
	get: mockGet,
	post: mockPost,
	put: mockPut,
	del: mockDel,
}));

vi.mock("./useHistory.ts", () => ({
	useHistory: () => ({
		fetchHistory: fetchHistoryMock,
	}),
}));

import { useTitles } from "./useTitles.ts";

describe("useTitles", () => {
	beforeEach(() => {
		const { titles } = useTitles();
		titles.value = [];
		mockGet.mockReset();
		mockPost.mockReset();
		mockPut.mockReset();
		mockDel.mockReset();
		fetchHistoryMock.mockReset();
	});

	it("sortedByName returns titles in localeCompare order", () => {
		const { titles, sortedByName } = useTitles();
		titles.value = [
			{ id: 1, title: "ゾロ", year: 2020 },
			{ id: 2, title: "あ牧場", year: 2019 },
			{ id: 3, title: "Zoro", year: 2021 },
		];
		const names = sortedByName.value.map((t) => t.title);
		expect(names).toEqual(["Zoro", "あ牧場", "ゾロ"]);
	});

	it("sortedByYear returns titles newest-first", () => {
		const { titles, sortedByYear } = useTitles();
		titles.value = [
			{ id: 1, title: "A", year: 2015 },
			{ id: 2, title: "B", year: 2023 },
			{ id: 3, title: "C", year: 2019 },
		];
		const years = sortedByYear.value.map((t) => t.year);
		expect(years).toEqual([2023, 2019, 2015]);
	});

	it("sortedByName does not mutate original array", () => {
		const { titles, sortedByName } = useTitles();
		titles.value = [
			{ id: 1, title: "Z", year: 2020 },
			{ id: 2, title: "A", year: 2021 },
		];
		void sortedByName.value;
		expect(titles.value[0].title).toBe("Z");
	});

	it("deleteTitle refreshes both titles and history", async () => {
		mockDel.mockResolvedValue({});
		mockGet.mockResolvedValue([]);
		fetchHistoryMock.mockResolvedValue(undefined);

		const { deleteTitle } = useTitles();
		await deleteTitle(42);

		expect(mockDel).toHaveBeenCalledWith("/titles/42");
		expect(mockGet).toHaveBeenCalledWith("/titles");
		expect(fetchHistoryMock).toHaveBeenCalledTimes(1);
	});
});
