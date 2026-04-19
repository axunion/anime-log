<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useHistory } from "../composables/useHistory";
import { useTitles } from "../composables/useTitles";
import type { AdminTab } from "../lib/types";
import AdminTabs from "./components/AdminTabs.vue";
import CastEditor from "./components/CastEditor.vue";
import HistoryManager from "./components/HistoryManager.vue";
import TitleManager from "./components/TitleManager.vue";

const { fetchTitles } = useTitles();
const { fetchHistory } = useHistory();

const activeTab = ref<AdminTab>("history");
const selectedTitleId = ref<number | null>(null);
const selectedTitleName = ref("");

function onSelectTitle(id: number | null, name: string) {
	selectedTitleId.value = id;
	selectedTitleName.value = name;
}

onMounted(() => {
	fetchTitles();
	fetchHistory();
});
</script>

<template>
	<div class="admin-root">
		<AdminTabs v-model="activeTab" />
		<main class="admin-main" :class="{ 'admin-main--single': activeTab === 'history' }">
			<div v-show="activeTab === 'data'" style="display: contents">
				<TitleManager @select-title="onSelectTitle" />
				<CastEditor
					:selected-title-id="selectedTitleId"
					:selected-title-name="selectedTitleName"
				/>
			</div>
			<HistoryManager v-show="activeTab === 'history'" />
		</main>
	</div>
</template>

<style scoped>
.admin-root {
	display: flex;
	flex-direction: column;
	height: 100vh;
}

.admin-main {
	box-sizing: border-box;
	display: grid;
	flex: 1;
	gap: 1.5em;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	margin: 0 auto;
	max-width: 1200px;
	min-height: 0;
	padding: 1.5em;
	width: 100%;
}

.admin-main--single {
	grid-template-columns: 1fr;
}

@media screen and (max-width: 640px) {
	.admin-root {
		height: auto;
		min-height: 100vh;
	}

	.admin-main {
		grid-template-columns: 1fr;
		grid-template-rows: auto;
	}
}
</style>
