import type { TitleDetail, VoiceResult } from "@shared/types.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

    const resultsA: VoiceResult[] = [
      { id: 1, title: "A", character_name: "Hero", title_id: 1, year: 2001 },
    ];
    const resultsB: VoiceResult[] = [
      { id: 2, title: "B", character_name: "Rival", title_id: 2, year: 2002 },
    ];
    const { loadVoice, voiceResults, selectedActorName } = useCast();

    const p1 = loadVoice("Actor A");
    const p2 = loadVoice("Actor B");

    // selectedActorName is updated atomically with voiceResults after the fetch
    // resolves, not optimistically. Both fetches are pending so it stays null.
    expect(selectedActorName.value).toBeNull();

    second.resolve(resultsB);
    await p2;
    expect(voiceResults.value).toEqual(resultsB);
    expect(selectedActorName.value).toBe("Actor B");

    first.resolve(resultsA);
    await p1;
    // Stale response is discarded — name and results both stay at "B".
    expect(voiceResults.value).toEqual(resultsB);
    expect(selectedActorName.value).toBe("Actor B");
  });

  it("ignores voice responses that arrive after clearVoice", async () => {
    const pending = deferred<VoiceResult[]>();
    mockGet.mockImplementationOnce(() => pending.promise);

    const results: VoiceResult[] = [
      { id: 1, title: "A", character_name: "Hero", title_id: 1, year: 2001 },
    ];
    const { loadVoice, clearVoice, voiceResults, selectedActorName } =
      useCast();

    const request = loadVoice("Actor A");
    clearVoice();

    pending.resolve(results);
    await request;
    expect(voiceResults.value).toEqual([]);
    expect(selectedActorName.value).toBeNull();
  });

  it("clears selectedDetail when loadCast fails and the request is still current", async () => {
    mockGet.mockRejectedValueOnce(new Error("network error"));

    const { loadCast, selectedDetail } = useCast();
    // Pre-populate so we can verify it gets cleared on failure.
    selectedDetail.value = { id: 99, title: "Stale", year: 2000, cast: [] };

    await loadCast(1);
    expect(selectedDetail.value).toBeNull();
  });

  it("does not clear selectedDetail when a stale loadCast fails after a newer one succeeded", async () => {
    const fresh = deferred<TitleDetail>();
    mockGet
      // First call returns a pre-rejected promise (stale request).
      .mockImplementationOnce(() => Promise.reject(new Error("network error")))
      .mockImplementationOnce(() => fresh.promise);

    const freshDetail: TitleDetail = {
      id: 2,
      title: "Fresh",
      year: 2002,
      cast: [],
    };
    const { loadCast, selectedDetail } = useCast();

    // Start stale request (immediately rejected), then supersede with fresh one.
    const p1 = loadCast(1); // stale — token becomes outdated when p2 starts
    const p2 = loadCast(2); // fresh

    fresh.resolve(freshDetail);
    await p2;
    expect(selectedDetail.value).toEqual(freshDetail);

    // p1's catch block did not clear selectedDetail because its token was no
    // longer current. The error is caught internally and never re-thrown.
    await p1;
    expect(selectedDetail.value).toEqual(freshDetail);
  });

  it("does not update voiceResults or selectedActorName when loadVoice fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("server error"));

    const { loadVoice, voiceResults, selectedActorName } = useCast();
    await loadVoice("Actor");

    // Failure is discarded silently — panel stays blank rather than showing
    // a stale heading with mismatched results.
    expect(voiceResults.value).toEqual([]);
    expect(selectedActorName.value).toBeNull();
  });
});
