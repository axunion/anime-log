import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useFilter } from "./useFilter.ts";

describe("useFilter", () => {
	it("empty query returns all items", () => {
		const items = ref(["Alpha", "Beta", "Gamma"]);
		const { filtered } = useFilter(items, (s) => s);
		expect(filtered.value).toEqual(["Alpha", "Beta", "Gamma"]);
	});

	it("single word matches case-insensitively", () => {
		const items = ref(["alpha test", "Beta", "ALPHA again"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = "alpha";
		expect(filtered.value).toEqual(["alpha test", "ALPHA again"]);
	});

	it("multiple words match subsequence with .+ between them", () => {
		const items = ref(["Attack on Titan", "Attack No Kujo", "One Piece"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = "Attack Titan";
		expect(filtered.value).toEqual(["Attack on Titan"]);
	});

	it("returns empty array when no items match", () => {
		const items = ref(["Alpha", "Beta"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = "zzznomatch";
		expect(filtered.value).toEqual([]);
	});

	it("whitespace-only query returns all items", () => {
		const items = ref(["Alpha", "Beta"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = "   ";
		expect(filtered.value).toEqual(["Alpha", "Beta"]);
	});

	it("treats regex metacharacters as literal characters", () => {
		const items = ref(["a.c", "abc", "a[c", "(test)"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = ".";
		expect(filtered.value).toEqual(["a.c"]);

		query.value = "[";
		expect(filtered.value).toEqual(["a[c"]);

		query.value = "(";
		expect(filtered.value).toEqual(["(test)"]);
	});

	it("uses custom keyFn to extract the searchable field", () => {
		const items = ref([
			{ id: 1, name: "One Piece" },
			{ id: 2, name: "Naruto" },
		]);
		const { query, filtered } = useFilter(items, (item) => item.name);
		query.value = "piece";
		expect(filtered.value).toEqual([{ id: 1, name: "One Piece" }]);
	});
});
