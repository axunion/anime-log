import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTitles } from "./useTitles.ts";

vi.mock("../lib/api.ts", () => ({
	get: vi.fn(),
	post: vi.fn(),
	put: vi.fn(),
	del: vi.fn(),
}));

describe("useTitles", () => {
	beforeEach(() => {
		const { titles } = useTitles();
		titles.value = [];
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
});
