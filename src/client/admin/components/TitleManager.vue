<script setup lang="ts">
import { Library, Plus } from "lucide-vue-next";
import { ref } from "vue";
import { useFilter } from "../../composables/useFilter";
import { useTitles } from "../../composables/useTitles";
import TitleSearchItem from "./TitleSearchItem.vue";

const emit = defineEmits<{
	selectTitle: [id: number | null, title: string];
}>();

const { titles, addTitle, updateTitle, deleteTitle } = useTitles();
const { query, filtered } = useFilter(titles, (t) => t.title);

const selectedId = ref<number | null>(null);
const newTitle = ref("");
const newYear = ref("");

function onSelect(id: number, title: string) {
	if (selectedId.value === id) {
		selectedId.value = null;
		emit("selectTitle", null, "");
	} else {
		selectedId.value = id;
		emit("selectTitle", id, title);
	}
}

async function onAddTitle() {
	const title = newTitle.value.trim();
	const year = Number(newYear.value);
	if (!title || !year) return;
	await addTitle(title, year);
	newTitle.value = "";
	newYear.value = "";
}

async function onDeleteTitle(id: number) {
	await deleteTitle(id);
	if (selectedId.value === id) {
		selectedId.value = null;
		emit("selectTitle", null, "");
	}
}
</script>

<template>
	<section class="admin-section">
		<h2 class="admin-section-title">
			<Library :size="14" :stroke-width="2" />
			タイトル管理
			<span class="section-count">{{ titles.length }}件</span>
		</h2>

		<form class="admin-form" @submit.prevent="onAddTitle">
			<input class="admin-form-input" v-model="newTitle" type="text" placeholder="タイトル名" />
			<input class="admin-form-input admin-form-input--narrow" v-model="newYear" type="text" inputmode="numeric" maxlength="4" placeholder="年" />
			<button class="admin-form-button" type="submit">
				<Plus :size="13" :stroke-width="2.5" />
				追加
			</button>
		</form>

		<div class="admin-form title-filter">
			<input class="admin-form-input" v-model="query" type="text" placeholder="フィルター" />
		</div>
		<ul class="admin-list">
			<TitleSearchItem
				v-for="t in filtered"
				:key="t.id"
				:id="t.id"
				:title-name="t.title"
				:year="t.year"
				:selected="t.id === selectedId"
				@select="onSelect(t.id, t.title)"
				@update="(id, fields) => updateTitle(id, fields)"
				@delete="onDeleteTitle"
			/>
		</ul>
	</section>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.title-filter {
	border-top: 1px solid var(--glass-border);
	margin-bottom: 0.5em;
	margin-top: 0.75em;
	padding-top: 1em;
}
</style>
