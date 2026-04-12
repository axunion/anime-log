<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useTitles } from "../composables/useTitles";
import AdminHeader from "./components/AdminHeader.vue";
import CastEditor from "./components/CastEditor.vue";
import HistoryManager from "./components/HistoryManager.vue";
import TitleManager from "./components/TitleManager.vue";

const { fetchTitles } = useTitles();

const selectedTitleId = ref<number | null>(null);
const selectedTitleName = ref("");

function onSelectTitle(id: number, name: string) {
	selectedTitleId.value = id;
	selectedTitleName.value = name;
}

onMounted(fetchTitles);
</script>

<template>
	<div class="admin-root">
		<AdminHeader />
		<main class="admin-main">
			<TitleManager @select-title="onSelectTitle" />
			<CastEditor
				:selected-title-id="selectedTitleId"
				:selected-title-name="selectedTitleName"
			/>
			<HistoryManager />
		</main>
	</div>
</template>

<style scoped>
.admin-root {
	max-width: 960px;
	margin: 0 auto;
	padding: 0 1em 4em;
}

.admin-main {
	display: grid;
	gap: 2em;
	grid-template-columns: 1fr 1fr;
	margin-top: 1.5em;
}

/* HistoryManager spans full width */
.admin-main > :last-child {
	grid-column: 1 / -1;
}

@media screen and (max-width: 640px) {
	.admin-main {
		grid-template-columns: 1fr;
	}

	.admin-main > :last-child {
		grid-column: auto;
	}
}
</style>
