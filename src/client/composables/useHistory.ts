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

	async function addHistory(payload: {
		title_id: number;
		display_name?: string;
		year: number;
	}) {
		await post("/history", payload);
		await fetchHistory();
	}

	async function updateHistory(
		id: number,
		payload: { display_name: string | null; year: number },
	) {
		await patch(`/history/${id}`, payload);
		await fetchHistory();
	}

	async function deleteHistory(id: number) {
		await del(`/history/${id}`);
		await fetchHistory();
	}

	async function persistOrder() {
		const ids = history.value.map((h) => h.id);
		if (ids.length === 0) return;
		await put("/history/reorder", { ids });
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
