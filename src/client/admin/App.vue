<script setup lang="ts">
import type { AdminTab } from "@shared/constants";
import { computed, onMounted, ref } from "vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { useHistory } from "../composables/useHistory";
import { useTitles } from "../composables/useTitles";
import AdminTabs from "./components/AdminTabs.vue";
import CastEditor from "./components/CastEditor.vue";
import HistoryManager from "./components/HistoryManager.vue";
import TitleManager from "./components/TitleManager.vue";

const { fetchTitles, error: titlesError, loading: titlesLoading } = useTitles();
const {
  fetchHistory,
  error: historyError,
  loading: historyLoading,
} = useHistory();

const activeTab = ref<AdminTab>("history");
const selectedTitleId = ref<number | null>(null);
const selectedTitleName = ref("");

const appError = computed(() => titlesError.value || historyError.value);
const appLoading = computed(() => titlesLoading.value || historyLoading.value);

async function reload() {
  await Promise.all([fetchTitles(), fetchHistory()]);
}

function onSelectTitle(id: number | null, name: string) {
  selectedTitleId.value = id;
  selectedTitleName.value = name;
}

onMounted(async () => {
  await Promise.all([fetchTitles(), fetchHistory()]);
});
</script>

<template>
	<div class="admin-root">
		<div v-if="appError" class="app-error-banner" role="alert">
			<span>{{ appError.message }}</span>
			<button type="button" class="app-error-retry" @click="reload">再読み込み</button>
		</div>
		<div v-else-if="appLoading" class="app-loading-banner" aria-live="polite">読み込み中...</div>
		<AdminTabs v-model="activeTab" />
		<main class="admin-main" :class="{ 'admin-main--single': activeTab === 'history' }">
			<div v-show="activeTab === 'data'" class="admin-data-panels">
				<TitleManager @select-title="onSelectTitle" />
				<CastEditor
					:selected-title-id="selectedTitleId"
					:selected-title-name="selectedTitleName"
				/>
			</div>
			<HistoryManager v-show="activeTab === 'history'" />
		</main>
		<ConfirmDialog />
	</div>
</template>

<style scoped>
.admin-root {
	display: flex;
	flex-direction: column;
	height: 100vh;
}

.app-error-banner {
	align-items: center;
	background: color-mix(in srgb, var(--danger-color, #e53e3e) 12%, transparent);
	border-bottom: 1px solid color-mix(in srgb, var(--danger-color, #e53e3e) 30%, transparent);
	color: var(--danger-color, #e53e3e);
	display: flex;
	font-size: 13px;
	gap: 1em;
	justify-content: space-between;
	padding: 0.5em 1.25em;
}

.app-error-retry {
	background: transparent;
	border: 1px solid currentcolor;
	border-radius: 6px;
	color: inherit;
	cursor: pointer;
	font-size: 12px;
	padding: 0.2em 0.75em;
	transition: background 0.15s;
}

.app-error-retry:hover {
	background: color-mix(in srgb, currentcolor 12%, transparent);
}

.app-loading-banner {
	color: var(--text-muted);
	font-size: 12px;
	padding: 0.4em 1.25em;
	text-align: center;
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

.admin-data-panels {
	display: contents;
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
