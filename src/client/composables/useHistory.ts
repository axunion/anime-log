import type { HistoryEntry } from "@shared/types";
import { ref } from "vue";
import { del, get, patch, post, put } from "../lib/api";

const history = ref<HistoryEntry[]>([]);
const error = ref<Error | null>(null);
const loading = ref(false);

export function useHistory() {
  async function fetchHistory() {
    loading.value = true;
    error.value = null;
    try {
      history.value = await get<HistoryEntry[]>("/history");
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
    }
  }

  async function mutate(op: () => Promise<unknown>) {
    try {
      await op();
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      throw err;
    }
  }

  async function addHistory(payload: {
    title_id: number;
    display_name?: string;
    year: number;
  }) {
    await mutate(async () => {
      await post("/history", payload);
      await fetchHistory();
    });
  }

  async function updateHistory(
    id: number,
    payload: { display_name: string | null; year: number },
  ) {
    await mutate(async () => {
      await patch(`/history/${id}`, payload);
      await fetchHistory();
    });
  }

  async function deleteHistory(id: number) {
    await mutate(async () => {
      await del(`/history/${id}`);
      await fetchHistory();
    });
  }

  async function persistOrder() {
    const ids = history.value.map((h) => h.id);
    if (ids.length === 0) return;
    try {
      await put("/history/reorder", { ids });
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      // Restore the true server order so local state doesn't silently diverge.
      await fetchHistory();
      throw err;
    }
  }

  return {
    history,
    error,
    loading,
    fetchHistory,
    addHistory,
    updateHistory,
    deleteHistory,
    persistOrder,
  };
}
