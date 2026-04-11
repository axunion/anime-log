<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useHistory } from "../../composables/useHistory";
import { useTitles } from "../../composables/useTitles";
import HistoryItem from "./HistoryItem.vue";

const { titles } = useTitles();
const { history, fetchHistory, addHistory, deleteHistory, reorder } =
	useHistory();

const selectTitleId = ref("");
const displayName = ref("");
const year = ref("");

onMounted(fetchHistory);

async function onAdd() {
	if (!selectTitleId.value) return;
	await addHistory({
		title_id: Number(selectTitleId.value),
		display_name: displayName.value || undefined,
		year: Number(year.value),
	});
	selectTitleId.value = "";
	displayName.value = "";
	year.value = "";
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
		<h2>視聴履歴管理</h2>

		<form class="admin-form" @submit.prevent="onAdd">
			<select v-model="selectTitleId">
				<option value="">タイトルを選択</option>
				<option v-for="t in titles" :key="t.id" :value="String(t.id)">
					{{ t.title }} ({{ t.year }})
				</option>
			</select>
			<input v-model="displayName" type="text" placeholder="表示名（省略可）" />
			<input v-model="year" type="number" placeholder="年" style="width: 70px; flex: 0 0 70px;" />
			<button type="submit">追加</button>
		</form>

		<ul class="admin-list">
			<HistoryItem
				v-for="(entry, i) in history"
				:key="entry.id"
				:entry="entry"
				:is-first="i === 0"
				:is-last="i === history.length - 1"
				@move-up="reorder(i, 'up')"
				@move-down="reorder(i, 'down')"
				@delete="onDelete(entry.id)"
			/>
		</ul>
	</section>
</template>

<style scoped>
.admin-section {
	border: var(--assort-color) solid 1px;
	border-radius: 4px;
	padding: 1em;
}

.admin-section h2 {
	font-size: 0.9em;
	font-weight: normal;
	letter-spacing: 0.1em;
	margin: 0 0 1em;
}

.admin-form {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5em;
	margin-bottom: 0.75em;
}

.admin-form input,
.admin-form select {
	background: var(--base-color);
	border: var(--assort-color) solid 1px;
	border-radius: 4px;
	flex: 1 1 auto;
	min-width: 0;
	padding: 0.25em 0.75em;
}

.admin-form input:focus,
.admin-form select:focus {
	border-color: var(--gray-color);
	outline: none;
}

.admin-form button {
	background: var(--contrast-color);
	border-radius: 4px;
	color: var(--base-color);
	cursor: pointer;
	padding: 0.25em 1em;
	white-space: nowrap;
}

.admin-form button:hover {
	opacity: 0.8;
}

.admin-list {
	max-height: 240px;
	overflow-y: auto;
}
</style>
