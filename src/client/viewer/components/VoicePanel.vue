<script setup lang="ts">
import type { VoiceResult } from "../../lib/types";
import ExternalLinks from "./ExternalLinks.vue";
import VoiceItem from "./VoiceItem.vue";

defineProps<{
	results: VoiceResult[];
	actorName: string | null;
}>();

const emit = defineEmits<{
	close: [];
}>();
</script>

<template>
	<div class="block" :class="{ active: actorName !== null }">
		<ExternalLinks
			:text="actorName ?? ''"
			@close="emit('close')"
		/>
		<dl class="voice-list">
			<VoiceItem
				v-for="(item, i) in results"
				:key="i"
				:title-name="item.title"
				:character-name="item.character_name"
			/>
		</dl>
	</div>
</template>

<style scoped>
.block {
	display: none;
	height: 100%;
	overflow: auto;
	scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
	scrollbar-width: thin;
}

/* glass in tablet + mobile overlay modes */
@media screen and (max-width: 960px) {
	.block.active {
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.block.active {
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}
}

.block::-webkit-scrollbar {
	background-color: var(--scrollbar-track);
	width: 5px;
}

.block::-webkit-scrollbar-thumb {
	background-color: var(--scrollbar-thumb);
}

.voice-list {
	margin: 0 8%;
}
</style>
