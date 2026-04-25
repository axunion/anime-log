import { computed, type Ref, ref } from "vue";

function escapeRegExp(query: string): string {
	return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useFilter<T>(
	items: Ref<T[]>,
	keyFn: (item: T) => string,
	externalQuery?: Ref<string>,
) {
	const query = externalQuery ?? ref("");

	const filtered = computed(() => {
		const q = query.value.trim();
		if (!q) return items.value;
		const pattern = q.split(/\s+/).map(escapeRegExp).join(".+");
		const re = new RegExp(pattern, "i");
		return items.value.filter((item) => re.test(keyFn(item)));
	});

	return { query, filtered };
}
