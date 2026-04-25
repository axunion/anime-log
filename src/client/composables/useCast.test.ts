import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TitleDetail, VoiceResult } from "../lib/types.ts";

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockPut = vi.hoisted(() => vi.fn());
const mockDel = vi.hoisted(() => vi.fn());

vi.mock("../lib/api.ts", () => ({
	get: mockGet,
	post: mockPost,
	put: mockPut,
	del: mockDel,
}));

import { useCast } from "./useCast.ts";

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe("useCast", () => {
	beforeEach(() => {
		const { clearCast, clearVoice } = useCast();
		clearCast();
		clearVoice();
		mockGet.mockReset();
		mockPost.mockReset();
		mockPut.mockReset();
		mockDel.mockReset();
	});

	it("keeps the latest cast response when requests resolve out of order", async () => {
		const first = deferred<TitleDetail>();
		const second = deferred<TitleDetail>();
		mockGet
			.mockImplementationOnce(() => first.promise)
			.mockImplementationOnce(() => second.promise);

		const detailA: TitleDetail = { id: 1, title: "A", year: 2001, cast: [] };
		const detailB: TitleDetail = { id: 2, title: "B", year: 2002, cast: [] };
		const { loadCast, selectedDetail } = useCast();

		const p1 = loadCast(1);
		const p2 = loadCast(2);

		second.resolve(detailB);
		await p2;
		expect(selectedDetail.value).toEqual(detailB);

		first.resolve(detailA);
		await p1;
		expect(selectedDetail.value).toEqual(detailB);
	});

	it("ignores cast responses that arrive after clearCast", async () => {
		const pending = deferred<TitleDetail>();
		mockGet.mockImplementationOnce(() => pending.promise);

		const detail: TitleDetail = { id: 1, title: "A", year: 2001, cast: [] };
		const { loadCast, clearCast, selectedDetail } = useCast();

		const request = loadCast(1);
		clearCast();

		pending.resolve(detail);
		await request;
		expect(selectedDetail.value).toBeNull();
	});

	it("keeps the latest voice response when requests resolve out of order", async () => {
		const first = deferred<VoiceResult[]>();
		const second = deferred<VoiceResult[]>();
		mockGet
			.mockImplementationOnce(() => first.promise)
			.mockImplementationOnce(() => second.promise);

		const resultsA: VoiceResult[] = [{ title: "A", character_name: "Hero" }];
		const resultsB: VoiceResult[] = [{ title: "B", character_name: "Rival" }];
		const { loadVoice, voiceResults, selectedActorName } = useCast();

		const p1 = loadVoice("Actor A");
		const p2 = loadVoice("Actor B");

		expect(selectedActorName.value).toBe("Actor B");

		second.resolve(resultsB);
		await p2;
		expect(voiceResults.value).toEqual(resultsB);

		first.resolve(resultsA);
		await p1;
		expect(voiceResults.value).toEqual(resultsB);
		expect(selectedActorName.value).toBe("Actor B");
	});

	it("ignores voice responses that arrive after clearVoice", async () => {
		const pending = deferred<VoiceResult[]>();
		mockGet.mockImplementationOnce(() => pending.promise);

		const results: VoiceResult[] = [{ title: "A", character_name: "Hero" }];
		const { loadVoice, clearVoice, voiceResults, selectedActorName } =
			useCast();

		const request = loadVoice("Actor A");
		clearVoice();

		pending.resolve(results);
		await request;
		expect(voiceResults.value).toEqual([]);
		expect(selectedActorName.value).toBeNull();
	});
});
