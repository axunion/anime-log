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

	async function reorder(fromIndex: number, direction: "up" | "down") {
		const list = history.value;
		const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
		if (toIndex < 0 || toIndex >= list.length) return;
		[list[fromIndex], list[toIndex]] = [list[toIndex], list[fromIndex]];
		await put("/history/reorder", { ids: list.map((h) => h.id) });
	}

	return {
		history,
		fetchHistory,
		addHistory,
		updateHistory,
		deleteHistory,
		reorder,
	};
}
