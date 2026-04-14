<script setup lang="ts">
import { ref, watch } from "vue";
import type { VoiceResult } from "../../lib/types";
import ExternalLinks from "./ExternalLinks.vue";
import VoiceItem from "./VoiceItem.vue";

const props = defineProps<{
	results: VoiceResult[];
	actorName: string | null;
}>();

const emit = defineEmits<{
	close: [];
}>();

// Keep the last non-empty results so the list stays visible during exit animation.
// clearVoice() clears results and actorName simultaneously; without this, the list
// would disappear before the slide-down animation completes.
const displayResults = ref<VoiceResult[]>([...props.results]);
watch(
	() => props.results,
	(val) => {
		if (val.length > 0) displayResults.value = [...val];
	},
);
</script>

<template>
	<div class="panel-content" :class="{ visible: actorName !== null }">
		<ExternalLinks
			:text="actorName ?? ''"
			@close="emit('close')"
		/>
		<dl class="voice-list">
			<VoiceItem
				v-for="(item, i) in displayResults"
				:key="i"
				:title-name="item.title"
				:character-name="item.character_name"
			/>
		</dl>
	</div>
</template>

<style scoped>
@import "../styles/viewer-shared.css";

.voice-list {
	margin: 0 8%;
}

/* Modal card in 1-column and 2-column layouts.
   Uses position:absolute so all four edges are directly controlled:
   top/left/right pin the card with 1rem gaps; max-height caps height so
   the card never reaches the viewport bottom, leaving an equal 1rem gap.
   The parent frame is position:fixed, so absolute coordinates are relative
   to the frame, not the document. */
@media screen and (max-width: 960px) {
	.panel-content {
		backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
		box-shadow: 0 8px 32px var(--shadow-overlay);
		box-sizing: border-box;
		display: block;
		height: auto;
		left: 1rem;
		max-height: calc(100dvh - 2rem);
		overflow: auto;
		padding-bottom: 1em;
		pointer-events: none;
		position: absolute;
		right: 1rem;
		scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
		scrollbar-width: thin;
		top: 1rem;
		/* exit: ease-in straight down */
		transform: translateY(100vh);
		transition: transform 0.45s cubic-bezier(0.3, 0.8, 0.7, 1);
	}

	.panel-content.visible {
		pointer-events: auto;
		transform: translateY(0);
		/* entry: gentle spring bounce */
		transition: transform 0.55s cubic-bezier(0.34, 1.25, 0.64, 1);
	}
}

@media screen and (max-width: 960px) and (prefers-reduced-motion: reduce) {
	.panel-content,
	.panel-content.visible {
		transition: none;
	}
}
</style>
