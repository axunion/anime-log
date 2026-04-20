import { ref } from "vue";
import { del, get, post, put } from "../lib/api";
import type { HistoryEntry } from "../lib/types";

const history = ref<HistoryEntry[]>([]);

export function useHistory() {
	async function fetchHistory() {
		history.value = await get<HistoryEntry[]>("/history");
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
		await put(`/history/${id}`, payload);
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
		fetchHistory,
		addHistory,
		updateHistory,
		deleteHistory,
		persistOrder,
	};
}
