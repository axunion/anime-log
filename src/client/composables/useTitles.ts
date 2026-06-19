import type { Title } from "@shared/types";
import { computed, ref } from "vue";
import { del, get, patch, post } from "../lib/api";
import { useHistory } from "./useHistory";

const titles = ref<Title[]>([]);
const error = ref<Error | null>(null);
const loading = ref(false);

export function useTitles() {
  const { fetchHistory } = useHistory();

  const sortedByName = computed(() =>
    [...titles.value].sort((a, b) => a.title.localeCompare(b.title)),
  );

  const sortedByYear = computed(() =>
    [...titles.value].sort((a, b) => b.year - a.year),
  );

  async function fetchTitles() {
    loading.value = true;
    error.value = null;
    try {
      titles.value = await get<Title[]>("/titles");
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

  async function addTitle(title: string, year: number) {
    await mutate(async () => {
      await post("/titles", { title, year });
      await fetchTitles();
    });
  }

  async function updateTitle(
    id: number,
    fields: { title?: string; year?: number },
  ) {
    await mutate(async () => {
      await patch(`/titles/${id}`, fields);
      await fetchTitles();
    });
  }

  async function deleteTitle(id: number) {
    await mutate(async () => {
      await del(`/titles/${id}`);
      await Promise.all([fetchTitles(), fetchHistory()]);
    });
  }

  return {
    titles,
    error,
    loading,
    sortedByName,
    sortedByYear,
    fetchTitles,
    addTitle,
    updateTitle,
    deleteTitle,
  };
}
