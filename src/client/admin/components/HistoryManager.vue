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
		<h2 class="admin-section-title">視聴履歴管理</h2>

		<form class="admin-form" @submit.prevent="onAdd">
			<select class="admin-form-select" v-model="selectTitleId">
				<option value="">タイトルを選択</option>
				<option v-for="t in titles" :key="t.id" :value="String(t.id)">
					{{ t.title }} ({{ t.year }})
				</option>
			</select>
			<input class="admin-form-input" v-model="displayName" type="text" placeholder="表示名（省略可）" />
			<input class="admin-form-input admin-form-input--narrow" v-model="year" type="number" placeholder="年" />
			<button class="admin-form-button" type="submit">追加</button>
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
@import "../styles/admin-shared.css";
</style>
