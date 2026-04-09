import { computed, ref } from "vue";
import { get, post } from "../lib/api";
import type { Title } from "../lib/types";

const titles = ref<Title[]>([]);

export function useTitles() {
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

	return { titles, sortedByName, sortedByYear, fetchTitles, addTitle };
}
