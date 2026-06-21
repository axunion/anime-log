import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockConfirm = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockFetchTitles = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFetchHistory = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("../lib/api.ts", () => ({
  get: mockGet,
  post: mockPost,
}));

vi.mock("./useConfirm.ts", () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock("./useTitles.ts", () => ({
  useTitles: () => ({ fetchTitles: mockFetchTitles }),
}));

vi.mock("./useHistory.ts", () => ({
  useHistory: () => ({ fetchHistory: mockFetchHistory }),
}));

import { useDataPortability } from "./useDataPortability.ts";

// Returns a class that can be used with `new FileReader()`. Each instance fires
// onload/onerror after readAsText is called, deferred to the next microtask so
// the assignment `reader.onload = ...` always happens first.
function makeFileReaderClass(opts: { content?: string; error?: boolean }) {
  return class MockFileReader {
    result = opts.content ?? null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsText() {
      Promise.resolve().then(() => {
        if (opts.error) this.onerror?.();
        else this.onload?.();
      });
    }
  };
}

// Minimal File-like object; readAsText is mocked so the real File is not needed.
function makeFile(name: string) {
  return { name } as File;
}

describe("useDataPortability", () => {
  beforeEach(() => {
    const state = useDataPortability();
    state.importModalOpen.value = false;
    state.dataFile.value = null;
    state.historyFile.value = null;
    state.importError.value = "";
    state.exportError.value = "";
    state.importing.value = false;
    state.exporting.value = false;

    mockGet.mockReset();
    mockPost.mockReset();
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(true);
    mockFetchTitles.mockReset();
    mockFetchHistory.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("onImport", () => {
    it("sets importError and returns early when files are not selected", async () => {
      const { onImport, importError } = useDataPortability();
      await onImport();

      expect(importError.value).toBe("両方のファイルを選択してください");
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns early without posting when confirm returns false", async () => {
      mockConfirm.mockResolvedValue(false);
      vi.stubGlobal("FileReader", makeFileReaderClass({ content: "[]" }));

      const { onImport, dataFile, historyFile } = useDataPortability();
      dataFile.value = makeFile("data.json");
      historyFile.value = makeFile("history.json");

      await onImport();

      expect(mockPost).not.toHaveBeenCalled();
    });

    it("sets partial-import error when history import fails after data import succeeds", async () => {
      vi.stubGlobal("FileReader", makeFileReaderClass({ content: "[]" }));
      mockPost
        .mockResolvedValueOnce({ imported: 0 }) // data import succeeds
        .mockRejectedValueOnce(new Error("server error")); // history import fails

      const { onImport, dataFile, historyFile, importError } =
        useDataPortability();
      dataFile.value = makeFile("data.json");
      historyFile.value = makeFile("history.json");

      await onImport();

      // The error message must flag that titles are already replaced and prompt
      // the user to re-import both files to restore consistency.
      expect(importError.value).toContain(
        "タイトルはインポート済みですが履歴のインポートに失敗しました",
      );
      expect(importError.value).toContain(
        "再度両ファイルをインポートしてください",
      );
    });

    it("closes modal and refreshes titles and history on full success", async () => {
      vi.stubGlobal("FileReader", makeFileReaderClass({ content: "[]" }));
      mockPost.mockResolvedValue({ imported: 0 });

      const { onImport, dataFile, historyFile, importModalOpen, importing } =
        useDataPortability();
      dataFile.value = makeFile("data.json");
      historyFile.value = makeFile("history.json");
      importModalOpen.value = true;

      await onImport();

      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(importModalOpen.value).toBe(false);
      expect(mockFetchTitles).toHaveBeenCalledTimes(1);
      expect(mockFetchHistory).toHaveBeenCalledTimes(1);
      // finally block clears the loading flag regardless of outcome.
      expect(importing.value).toBe(false);
    });

    it("sets importError when file contains invalid JSON", async () => {
      vi.stubGlobal(
        "FileReader",
        makeFileReaderClass({ content: "not-valid-json" }),
      );

      const { onImport, dataFile, historyFile, importError } =
        useDataPortability();
      dataFile.value = makeFile("data.json");
      historyFile.value = makeFile("history.json");

      await onImport();

      expect(importError.value).toContain("は有効な JSON ではありません");
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("sets importError when FileReader raises an IO error", async () => {
      vi.stubGlobal("FileReader", makeFileReaderClass({ error: true }));

      const { onImport, dataFile, historyFile, importError } =
        useDataPortability();
      dataFile.value = makeFile("data.json");
      historyFile.value = makeFile("history.json");

      await onImport();

      expect(importError.value).toContain("の読み込みに失敗しました");
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe("exportData", () => {
    it("sets exportError and clears exporting flag when fetch fails", async () => {
      mockGet.mockRejectedValue(new Error("network error"));

      const { exportData, exportError, exporting } = useDataPortability();
      await exportData();

      expect(exportError.value).toBe("network error");
      // finally block clears the loading flag regardless of outcome.
      expect(exporting.value).toBe(false);
    });
  });
});
