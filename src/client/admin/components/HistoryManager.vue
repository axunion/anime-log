<script setup lang="ts">
import { History as HistoryIcon, Plus } from "lucide-vue-next";
import { ref, watch } from "vue";
import draggable from "vuedraggable";
import { useFilter } from "../../composables/useFilter";
import { useHistory } from "../../composables/useHistory";
import { useTitles } from "../../composables/useTitles";
import type { Title } from "../../lib/types";
import HistoryItem from "./HistoryItem.vue";

const { titles } = useTitles();
const {
	history,
	fetchHistory,
	addHistory,
	updateHistory,
	deleteHistory,
	persistOrder,
} = useHistory();

const selectTitleId = ref("");
const titleQuery = ref("");
const showSuggest = ref(false);
const displayName = ref("");
const year = ref("");

const { filtered } = useFilter(
	titles,
	(t) => `${t.title} ${t.year}`,
	titleQuery,
);

watch(titleQuery, () => {
	selectTitleId.value = "";
});

function selectTitle(t: Title) {
	selectTitleId.value = String(t.id);
	titleQuery.value = `${t.title} (${t.year})`;
	showSuggest.value = false;
}

async function onAdd() {
	if (!selectTitleId.value) return;
	await addHistory({
		title_id: Number(selectTitleId.value),
		display_name: displayName.value || undefined,
		year: Number(year.value),
	});
	selectTitleId.value = "";
	titleQuery.value = "";
	displayName.value = "";
	year.value = "";
}

async function onDragEnd(event: { oldIndex?: number; newIndex?: number }) {
	if (event.oldIndex !== event.newIndex) await persistOrder();
}

async function onDelete(id: number) {
	const entry = history.value.find((h) => h.id === id);
	const name = entry?.display_name ?? entry?.title ?? "";
	if (!confirm(`「${name}」を削除しますか？`)) return;
	await deleteHistory(id);
}
</script>

<template>
	<section class="admin-section">
		<h2 class="admin-section-title">
			<HistoryIcon :size="14" :stroke-width="2" />
			視聴履歴管理
			<span class="section-count">{{ history.length }}件</span>
		</h2>

		<form class="admin-form" @submit.prevent="onAdd">
			<div class="title-search">
				<input
					class="admin-form-input"
					type="text"
					v-model="titleQuery"
					@focus="showSuggest = true"
					@blur="showSuggest = false"
					@keydown.escape="showSuggest = false"
					placeholder="タイトルを検索"
				/>
				<ul
					class="title-suggest"
					v-if="showSuggest && titleQuery && filtered.length"
				>
					<li
						v-for="t in filtered"
						:key="t.id"
						@mousedown.prevent="selectTitle(t)"
					>
						{{ t.title }} ({{ t.year }})
					</li>
				</ul>
			</div>
			<input class="admin-form-input" v-model="displayName" type="text" placeholder="表示名（省略可）" />
			<input class="admin-form-input admin-form-input--narrow" v-model="year" type="text" inputmode="numeric" maxlength="4" placeholder="年" />
			<button class="admin-form-button" type="submit">
				<Plus :size="13" :stroke-width="2.5" />
				追加
			</button>
		</form>

		<draggable
			v-model="history"
			tag="ul"
			class="admin-list"
			item-key="id"
			handle=".drag-handle"
			:animation="150"
			@end="onDragEnd"
		>
			<template #item="{ element: entry }">
				<HistoryItem
					:entry="entry"
					@update="updateHistory(entry.id, $event)"
					@delete="onDelete(entry.id)"
				/>
			</template>
		</draggable>
	</section>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.title-search {
	flex: 1 1 auto;
	min-width: 0;
	position: relative;
}

.title-search input {
	box-sizing: border-box;
	width: 100%;
}

.title-suggest {
	background: var(--glass-bg-strong);
	border: 1px solid var(--glass-border);
	border-radius: 8px;
	left: 0;
	list-style: none;
	margin: 2px 0 0;
	max-height: 240px;
	overflow-y: auto;
	padding: 4px 0;
	position: absolute;
	right: 0;
	top: 100%;
	z-index: 10;
}

.title-suggest li {
	cursor: pointer;
	font-size: 13px;
	padding: 0.35em 0.75em;
}

.title-suggest li:hover {
	background: var(--glass-bg);
}

@media screen and (max-width: 640px) {
	.title-search,
	.admin-form-input:not(.admin-form-input--narrow) {
		flex-basis: 100%;
	}
}
</style>
