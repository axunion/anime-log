import { computed, type Ref, ref } from "vue";

export function useFilter<T>(
	items: Ref<T[]>,
	keyFn: (item: T) => string,
	externalQuery?: Ref<string>,
) {
	const query = externalQuery ?? ref("");

	const filtered = computed(() => {
		const q = query.value.trim();
		if (!q) return items.value;
		const re = new RegExp(q.split(/\s+/).join(".+"), "i");
		return items.value.filter((item) => re.test(keyFn(item)));
	});

	return { query, filtered };
}
