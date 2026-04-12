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
		<h2 class="admin-section-title">タイトル管理</h2>

		<form class="admin-form" @submit.prevent="onAddTitle">
			<input class="admin-form-input" v-model="newTitle" type="text" placeholder="タイトル名" />
			<input class="admin-form-input admin-form-input--narrow" v-model="newYear" type="number" placeholder="年" />
			<button class="admin-form-button" type="submit">追加</button>
		</form>

		<h3 class="admin-section-subtitle">タイトル検索</h3>
		<div class="admin-form">
			<input class="admin-form-input" v-model="query" type="text" placeholder="検索" />
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
@import "../styles/admin-shared.css";
</style>
