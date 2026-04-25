import { computed, ref } from "vue";
import { del, get, post, put } from "../lib/api";
import type { Title } from "../lib/types";
import { useHistory } from "./useHistory";

const titles = ref<Title[]>([]);

export function useTitles() {
	const { fetchHistory } = useHistory();

	const sortedByName = computed(() =>
		[...titles.value].sort((a, b) => a.title.localeCompare(b.title)),
	);

	const sortedByYear = computed(() =>
		[...titles.value].sort((a, b) => b.year - a.year),
	);

	async function fetchTitles() {
		titles.value = await get<Title[]>("/titles");
	}

	async function addTitle(title: string, year: number) {
		await post("/titles", { title, year });
		await fetchTitles();
	}

	async function updateTitle(
		id: number,
		fields: { title?: string; year?: number },
	) {
		await put(`/titles/${id}`, fields);
		await fetchTitles();
	}

	async function deleteTitle(id: number) {
		await del(`/titles/${id}`);
		await Promise.all([fetchTitles(), fetchHistory()]);
	}

	return {
		titles,
		sortedByName,
		sortedByYear,
		fetchTitles,
		addTitle,
		updateTitle,
		deleteTitle,
	};
}
