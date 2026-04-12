<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { useFilter } from "../../composables/useFilter";
import type { HistoryEntry, Title } from "../../lib/types";
import TitleListItem from "./TitleListItem.vue";

const props = defineProps<{
	items: (Title | HistoryEntry)[];
	active: boolean;
	query: string;
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

function getDisplayName(item: Title | HistoryEntry): string {
	return "display_name" in item
		? (item.display_name ?? item.title)
		: item.title;
}

// Unique identifier for each row (used for selection highlight)
function getItemId(item: Title | HistoryEntry): number {
	return item.id;
}

// Title ID for API calls (cast loading)
function getTitleId(item: Title | HistoryEntry): number {
	return "title_id" in item ? item.title_id : item.id;
}

const { filtered } = useFilter(
	toRef(props, "items"),
	getDisplayName,
	toRef(props, "query"),
);

function onClickItem(itemId: number, titleId: number) {
	if (selectedId.value === itemId) {
		selectedId.value = null;
		emit("deselect");
	} else {
		selectedId.value = itemId;
		emit("select", titleId);
	}
}
</script>

<template>
	<div class="block" :class="{ active }">
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
	height: calc(100% - 48px);
	overflow: auto;
	scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
	scrollbar-width: thin;
}

.block::-webkit-scrollbar {
	background-color: var(--scrollbar-track);
	width: 5px;
}

.block::-webkit-scrollbar-thumb {
	background-color: var(--scrollbar-thumb);
}

.block.active {
	display: block;
}

.title-list {
	margin: 0.5em 0;
}
</style>
