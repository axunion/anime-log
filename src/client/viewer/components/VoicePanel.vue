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
   Slides up from below the viewport with a spring bounce on entry,
   and exits straight down. display:none is overridden so transform
   can animate; pointer-events guards interactivity instead.

   Spacing is managed entirely on this element:
   - margin: 1rem creates equal gaps on all four sides
   - max-height: calc(100dvh - 2rem) caps height to viewport minus top+bottom margins
   No padding on the parent frame — single source of truth. */
@media screen and (max-width: 960px) {
	.panel-content {
		backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
		box-shadow: 0 8px 32px var(--shadow-overlay);
		display: block;
		height: auto;
		margin: 1rem;
		max-height: calc(100dvh - 2rem);
		overflow: auto;
		padding-bottom: 1em;
		pointer-events: none;
		scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
		scrollbar-width: thin;
		width: calc(100% - 2rem);
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
