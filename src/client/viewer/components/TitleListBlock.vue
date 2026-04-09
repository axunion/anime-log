<script setup lang="ts">
import { nextTick, ref, toRef, watch } from "vue";
import { useFilter } from "../../composables/useFilter";
import type { HistoryEntry, Title } from "../../lib/types";
import TitleListItem from "./TitleListItem.vue";

const props = defineProps<{
	items: (Title | HistoryEntry)[];
	active: boolean;
	clearTrigger: number;
}>();

const emit = defineEmits<{
	select: [id: number];
	deselect: [];
}>();

const selectedId = ref<number | null>(null);

watch(
	() => props.clearTrigger,
	() => {
		selectedId.value = null;
	},
);

const blockRef = ref<HTMLElement | null>(null);

function getDisplayName(item: Title | HistoryEntry): string {
	return "display_name" in item ? (item.display_name ?? item.title) : item.title;
}

// Unique identifier for each row (used for selection highlight)
function getItemId(item: Title | HistoryEntry): number {
	return item.id;
}

// Title ID for API calls (cast loading)
function getTitleId(item: Title | HistoryEntry): number {
	return "title_id" in item ? item.title_id : item.id;
}

const { query, filtered } = useFilter(toRef(props, "items"), getDisplayName);

function onClickItem(itemId: number, titleId: number) {
	if (selectedId.value === itemId) {
		selectedId.value = null;
		emit("deselect");
	} else {
		selectedId.value = itemId;
		emit("select", titleId);
	}
}

watch(
	() => props.active,
	async (active) => {
		if (active && blockRef.value) {
			await nextTick();
			const filterEl = blockRef.value.querySelector(".filter") as HTMLElement | null;
			if (filterEl) blockRef.value.scrollTop = filterEl.clientHeight;
		}
	},
);
</script>

<template>
	<div ref="blockRef" class="block" :class="{ active }">
		<div class="filter">
			<input v-model="query" type="text" />
		</div>
		<ul class="title-list">
			<TitleListItem
				v-for="item in filtered"
				:key="getItemId(item)"
				:title-name="getDisplayName(item)"
				:year="item.year"
				:selected="getItemId(item) === selectedId"
				@select="onClickItem(getItemId(item), getTitleId(item))"
			/>
		</ul>
	</div>
</template>

<style scoped>
.block {
	display: none;
	height: calc(100% - 40px);
	overflow: auto;
	scrollbar-color: var(--gray-color) #00000020;
	scrollbar-width: thin;
}

.block::-webkit-scrollbar {
	background-color: #00000020;
	width: 5px;
}

.block::-webkit-scrollbar-thumb {
	background-color: var(--gray-color);
}

.block.active {
	display: block;
}

.filter {
	display: block;
	padding: 0.5em;
}

.filter > input {
	background: var(--base-color);
	border: var(--assort-color) solid 1px;
	border-radius: 4px;
	box-sizing: border-box;
	padding: 0.25em 0.75em;
	width: 100%;
}

.filter > input:focus {
	border-color: var(--gray-color);
}

.title-list {
	margin: 0.5em 0;
}
</style>
