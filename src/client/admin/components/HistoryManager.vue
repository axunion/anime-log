<script setup lang="ts">
import { History as HistoryIcon, Plus, X } from "@lucide/vue";
import type { Title } from "@shared/types";
import { ref } from "vue";
import draggable from "vuedraggable";
import { useConfirm } from "../../composables/useConfirm";
import { useFilter } from "../../composables/useFilter";
import { useHistory } from "../../composables/useHistory";
import { useTitles } from "../../composables/useTitles";
import HistoryItem from "./HistoryItem.vue";

const { confirm } = useConfirm();
const { titles } = useTitles();
const { history, addHistory, updateHistory, deleteHistory, persistOrder } =
  useHistory();

async function onUpdate(
  id: number,
  payload: { display_name: string | null; year: number },
) {
  try {
    await updateHistory(id, payload);
  } catch {
    // Error displayed via App.vue banner.
  }
}

const selectTitleId = ref("");
const titleQuery = ref("");
const showSuggest = ref(false);
const displayName = ref("");
const year = ref("");

const { filtered: titleSuggestions } = useFilter(
  titles,
  (t) => `${t.title} ${t.year}`,
  titleQuery,
);

const { query: filterQuery, filtered: filteredHistory } = useFilter(
  history,
  (h) => h.title,
);

function onTitleQueryInput() {
  selectTitleId.value = "";
  showSuggest.value = true;
}

function selectTitle(t: Title) {
  selectTitleId.value = String(t.id);
  titleQuery.value = `${t.title} (${t.year})`;
  showSuggest.value = false;
}

async function onAdd() {
  if (!selectTitleId.value) return;
  const yr = Number(year.value);
  if (!yr) return;
  try {
    await addHistory({
      title_id: Number(selectTitleId.value),
      display_name: displayName.value || undefined,
      year: yr,
    });
  } catch {
    return;
  }
  selectTitleId.value = "";
  titleQuery.value = "";
  displayName.value = "";
  year.value = "";
}

async function onDragEnd(event: { oldIndex?: number; newIndex?: number }) {
  if (event.oldIndex !== event.newIndex) {
    try {
      await persistOrder();
    } catch {
      // Error is displayed via the App.vue banner; history was restored by persistOrder.
    }
  }
}

function onFilterByTitle(title: string) {
  filterQuery.value = title;
}

async function onDelete(id: number) {
  const entry = history.value.find((h) => h.id === id);
  const name = entry?.display_name ?? entry?.title ?? "";
  if (!(await confirm({ message: `「${name}」を削除しますか？` }))) return;
  try {
    await deleteHistory(id);
  } catch {
    // Error displayed via App.vue banner.
  }
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
					@input="onTitleQueryInput"
					@focus="showSuggest = true"
					@blur="showSuggest = false"
					@keydown.escape="showSuggest = false"
					placeholder="タイトルを検索"
				/>
				<ul
					class="title-suggest"
					v-if="showSuggest && titleQuery && titleSuggestions.length"
				>
					<li
						v-for="t in titleSuggestions"
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

		<div class="admin-form history-filter">
			<div class="filter-wrap">
				<input
					class="admin-form-input"
					type="text"
					v-model="filterQuery"
					placeholder="フィルター"
				/>
				<button v-if="filterQuery" type="button" class="filter-clear" @click="filterQuery = ''" aria-label="フィルターをクリア">
					<X :size="12" :stroke-width="2.5" />
				</button>
			</div>
		</div>

		<draggable
			v-if="!filterQuery"
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
					@update="onUpdate(entry.id, $event)"
					@delete="onDelete(entry.id)"
					@filter-by-title="onFilterByTitle"
				/>
			</template>
		</draggable>
		<ul v-else class="admin-list">
			<HistoryItem
				v-for="entry in filteredHistory"
				:key="entry.id"
				:entry="entry"
				:draggable="false"
				@update="onUpdate(entry.id, $event)"
				@delete="onDelete(entry.id)"
				@filter-by-title="onFilterByTitle"
			/>
		</ul>
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

.history-filter {
	border-top: 1px solid var(--glass-border);
	margin-bottom: 0.5em;
	margin-top: 0.75em;
	padding-top: 1em;
}

@media screen and (max-width: 640px) {
	.title-search,
	.admin-form-input:not(.admin-form-input--narrow) {
		flex-basis: 100%;
	}
}
</style>
