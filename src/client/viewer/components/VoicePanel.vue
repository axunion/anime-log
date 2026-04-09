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
	<div class="block">
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
	scrollbar-color: var(--gray-color) #00000020;
	scrollbar-width: thin;
}

.block::-webkit-scrollbar {
	background-color: #00000020;
	width: 5px;
}

.block::-webkit-scrollbar-thumb {
	background-color: var(--gray-color);
}

.voice-list {
	margin: 0 8%;
}
</style>
