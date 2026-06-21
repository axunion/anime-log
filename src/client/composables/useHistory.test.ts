import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistory } from "./useHistory.ts";

const mockGet = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockPost = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockPatch = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockPut = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockDel = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("../lib/api.ts", () => ({
  get: mockGet,
  post: mockPost,
  patch: mockPatch,
  put: mockPut,
  del: mockDel,
}));

const SEED_HISTORY = [
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

describe("useHistory.persistOrder", () => {
  beforeEach(() => {
    const { history, error } = useHistory();
    history.value = [...SEED_HISTORY];
    error.value = null;
    mockGet.mockClear();
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

  it("calls fetchHistory to restore server order and re-throws when put fails", async () => {
    const cause = new Error("reorder failed");
    mockPut.mockRejectedValueOnce(cause);

    const { persistOrder } = useHistory();
    await expect(persistOrder()).rejects.toThrow("reorder failed");
    expect(mockGet).toHaveBeenCalledWith("/history");
  });

  it("sets error when fetchHistory also fails after a put failure", async () => {
    mockPut.mockRejectedValueOnce(new Error("reorder failed"));
    mockGet.mockRejectedValueOnce(new Error("fetch failed"));

    const { persistOrder, error } = useHistory();
    await expect(persistOrder()).rejects.toThrow("reorder failed");
    expect(error.value?.message).toBe("fetch failed");
  });
});

describe("useHistory mutations", () => {
  beforeEach(() => {
    const { history, error } = useHistory();
    history.value = [];
    error.value = null;
    mockGet.mockClear();
    mockPost.mockClear();
    mockPatch.mockClear();
    mockDel.mockClear();
  });

  it("addHistory posts then re-fetches to keep state in sync", async () => {
    const { addHistory } = useHistory();
    await addHistory({ title_id: 1, year: 2020 });

    expect(mockPost).toHaveBeenCalledWith("/history", {
      title_id: 1,
      year: 2020,
    });
    expect(mockGet).toHaveBeenCalledWith("/history");
  });

  it("addHistory sets error and re-throws when the write fails", async () => {
    const cause = new Error("write failed");
    mockPost.mockRejectedValueOnce(cause);

    const { addHistory, error } = useHistory();
    await expect(addHistory({ title_id: 1, year: 2020 })).rejects.toThrow(
      "write failed",
    );
    expect(error.value?.message).toBe("write failed");
    // fetchHistory is not called when the write itself throws.
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("deleteHistory deletes then re-fetches", async () => {
    const { deleteHistory } = useHistory();
    await deleteHistory(10);

    expect(mockDel).toHaveBeenCalledWith("/history/10");
    expect(mockGet).toHaveBeenCalledWith("/history");
  });

  it("updateHistory patches then re-fetches", async () => {
    const { updateHistory } = useHistory();
    await updateHistory(10, { display_name: "劇場版", year: 2021 });

    expect(mockPatch).toHaveBeenCalledWith("/history/10", {
      display_name: "劇場版",
      year: 2021,
    });
    expect(mockGet).toHaveBeenCalledWith("/history");
  });
});
