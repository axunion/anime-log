<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useCast } from "../composables/useCast";
import { useHistory } from "../composables/useHistory";
import { useTitles } from "../composables/useTitles";
import ViewerLayout from "./components/ViewerLayout.vue";

const { titles, sortedByName, sortedByYear, fetchTitles } = useTitles();
const { history, fetchHistory } = useHistory();
const {
	selectedDetail,
	voiceResults,
	selectedActorName,
	loadCast,
	loadVoice,
	clearCast,
	clearVoice,
} = useCast();

const clearTrigger = ref(0);

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
	<ViewerLayout
		:history="history"
		:titles-by-year="sortedByYear"
		:titles-by-name="sortedByName"
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
