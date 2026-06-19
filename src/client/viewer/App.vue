<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useCastView } from "../composables/useCastView";
import { useHistory } from "../composables/useHistory";
import { useTitles } from "../composables/useTitles";
import ViewerLayout from "./components/ViewerLayout.vue";

const {
  sortedByYear,
  fetchTitles,
  error: titlesError,
  loading: titlesLoading,
} = useTitles();
const {
  history,
  fetchHistory,
  error: historyError,
  loading: historyLoading,
} = useHistory();
const {
  selectedDetail,
  voiceResults,
  selectedActorName,
  loadCast,
  loadVoice,
  clearCast,
  clearVoice,
} = useCastView();

const clearTrigger = ref(0);

const appError = computed(() => titlesError.value || historyError.value);
const appLoading = computed(() => titlesLoading.value || historyLoading.value);

async function reload() {
  await Promise.all([fetchTitles(), fetchHistory()]);
}

async function onSelectTitle(id: number) {
  clearVoice();
  await loadCast(id);
}

function onDeselectTitle() {
  clearCast();
}

async function onActorClick(name: string) {
  await loadVoice(name);
}

function onCloseCast() {
  clearTrigger.value++;
  clearCast();
}

function onCloseVoice() {
  clearVoice();
}

onMounted(async () => {
  await Promise.all([fetchTitles(), fetchHistory()]);
});
</script>

<template>
	<div v-if="appLoading && !appError" class="app-status">
		<span class="app-status-text">読み込み中...</span>
	</div>
	<div v-else-if="appError" class="app-status app-status--error">
		<p class="app-status-text">{{ appError.message }}</p>
		<button class="app-status-retry" type="button" @click="reload">再読み込み</button>
	</div>
	<ViewerLayout
		v-else
		:history="history"
		:titles-by-year="sortedByYear"
		:cast-detail="selectedDetail"
		:voice-results="voiceResults"
		:voice-actor-name="selectedActorName"
		:clear-trigger="clearTrigger"
		@select-title="onSelectTitle"
		@deselect-title="onDeselectTitle"
		@actor-click="onActorClick"
		@close-cast="onCloseCast"
		@close-voice="onCloseVoice"
	/>
</template>

<style scoped>
.app-status {
	align-items: center;
	bottom: 0;
	display: flex;
	flex-direction: column;
	gap: 1em;
	justify-content: center;
	left: 0;
	position: fixed;
	right: 0;
	top: 0;
}

.app-status-text {
	color: var(--text-muted);
	font-size: 14px;
}

.app-status--error .app-status-text {
	color: var(--danger-color, #e53e3e);
}

.app-status-retry {
	background: transparent;
	border: 1px solid var(--glass-border);
	border-radius: 8px;
	color: var(--text-muted);
	cursor: pointer;
	font-size: 13px;
	padding: 0.4em 1em;
	transition: background 0.15s, color 0.15s;
}

.app-status-retry:hover {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}
</style>
