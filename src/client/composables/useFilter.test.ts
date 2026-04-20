import { ref } from "vue";
import { describe, expect, it } from "vitest";
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

	it("dot metacharacter matches any character (documented behavior)", () => {
		const items = ref(["abc", "axc", "a1c"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = ".";
		expect(filtered.value).toHaveLength(3);
	});

	it("unmatched paren throws SyntaxError (documented behavior)", () => {
		// NOTE: user input is passed directly to new RegExp() without escaping.
		// Special chars like "(" cause a SyntaxError. This is a known limitation.
		const items = ref(["abc"]);
		const { query, filtered } = useFilter(items, (s) => s);
		query.value = "(";
		expect(() => filtered.value).toThrow(SyntaxError);
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
