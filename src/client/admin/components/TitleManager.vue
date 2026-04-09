<script setup lang="ts">
import { ref } from "vue";
import { useFilter } from "../../composables/useFilter";
import { useTitles } from "../../composables/useTitles";
import TitleSearchItem from "./TitleSearchItem.vue";

const emit = defineEmits<{
	selectTitle: [id: number, title: string];
}>();

const { titles, addTitle } = useTitles();
const { query, filtered } = useFilter(titles, (t) => t.title);

const selectedId = ref<number | null>(null);
const newTitle = ref("");
const newYear = ref("");

function onSelect(id: number, title: string) {
	selectedId.value = id;
	emit("selectTitle", id, title);
}

async function onAddTitle() {
	const title = newTitle.value.trim();
	const year = Number(newYear.value);
	if (!title || !year) return;
	await addTitle(title, year);
	newTitle.value = "";
	newYear.value = "";
}
</script>

<template>
	<section class="admin-section">
		<h2>タイトル管理</h2>

		<form class="admin-form" @submit.prevent="onAddTitle">
			<input v-model="newTitle" type="text" placeholder="タイトル名" />
			<input v-model="newYear" type="number" placeholder="年" style="width: 70px; flex: 0 0 70px;" />
			<button type="submit">追加</button>
		</form>

		<h3>タイトル検索</h3>
		<div class="admin-form">
			<input v-model="query" type="text" placeholder="検索" />
		</div>
		<ul class="admin-list">
			<TitleSearchItem
				v-for="t in filtered.slice(0, 30)"
				:key="t.id"
				:title-name="t.title"
				:year="t.year"
				:selected="t.id === selectedId"
				@select="onSelect(t.id, t.title)"
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

.admin-section h3 {
	font-size: 0.85em;
	font-weight: normal;
	margin: 1em 0 0.5em;
}

.admin-form {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5em;
	margin-bottom: 0.75em;
}

.admin-form input {
	background: var(--base-color);
	border: var(--assort-color) solid 1px;
	border-radius: 4px;
	flex: 1 1 auto;
	min-width: 0;
	padding: 0.25em 0.75em;
}

.admin-form input:focus {
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
