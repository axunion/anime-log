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
	<div class="panel-content" :class="{ visible: actorName !== null }">
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
@import "../styles/viewer-shared.css";

.voice-list {
	margin: 0 8%;
}
</style>
