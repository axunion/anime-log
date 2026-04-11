<script setup lang="ts">
import { ref } from "vue";
import type {
	HistoryEntry,
	Tab,
	Title,
	TitleDetail,
	VoiceResult,
} from "../../lib/types";
import CastPanel from "./CastPanel.vue";
import TitleListBlock from "./TitleListBlock.vue";
import TitleNav from "./TitleNav.vue";
import VoicePanel from "./VoicePanel.vue";

const props = defineProps<{
	history: HistoryEntry[];
	titlesByYear: Title[];
	castDetail: TitleDetail | null;
	voiceResults: VoiceResult[];
	voiceActorName: string | null;
	clearTrigger: number;
}>();

const emit = defineEmits<{
	selectTitle: [id: number];
	deselectTitle: [];
	actorClick: [name: string];
	closeCast: [];
	closeVoice: [];
}>();

const activeTab = ref<Tab>("history");
const query = ref("");
</script>

<template>
	<div id="viewport">
		<div class="frame">
			<TitleNav v-model:active-tab="activeTab" v-model:query="query" />
			<TitleListBlock
				:items="history"
				:active="activeTab === 'history'"
				:query="query"
				:clear-trigger="clearTrigger"
				@select="emit('selectTitle', $event)"
				@deselect="emit('deselectTitle')"
			/>
			<TitleListBlock
				:items="titlesByYear"
				:active="activeTab === 'year'"
				:query="query"
				:clear-trigger="clearTrigger"
				@select="emit('selectTitle', $event)"
				@deselect="emit('deselectTitle')"
			/>
		</div>

		<div class="frame frame-cast" :class="{ 'selected-title': castDetail !== null }">
			<CastPanel
				:detail="castDetail"
				@close="emit('closeCast')"
				@actor-click="emit('actorClick', $event)"
			/>
		</div>

		<div class="frame frame-voice" :class="{ 'selected-name': voiceActorName !== null }">
			<VoicePanel
				:results="voiceResults"
				:actor-name="voiceActorName"
				@close="emit('closeVoice')"
			/>
		</div>
	</div>
</template>

<style scoped>
#viewport {
	bottom: 0;
	left: 0;
	overflow: hidden;
	position: fixed;
	right: 0;
	top: 0;
}

.frame {
	bottom: 0;
	position: absolute;
	top: 0;
	width: 33.33%;
}

.frame + .frame {
	border-left: var(--glass-border) solid 1px;
}

.frame:nth-child(2) {
	left: 33.33%;
}

.frame:nth-child(3) {
	left: 66.66%;
}

/* block visibility via parent frame class */
.selected-title > :deep(.block),
.selected-name > :deep(.block) {
	display: block;
}

/* show close button in responsive modes */
.frame-cast :deep(.close),
.frame-voice :deep(.close) {
	display: none;
}

/* min-width: 641px and max-width: 960px */
@media screen and (min-width: 641px) and (max-width: 960px) {
	.frame {
		width: 50%;
	}

	.frame:nth-child(2) {
		left: 50%;
	}

	.frame-voice {
		left: 50%;
		transform: translate3d(0, 100%, 0);
		transition: transform 0.4s 0.1s;
	}

	.frame-voice.selected-name {
		transform: translate3d(0, 0, 0);
		transition: transform 0.4s;
	}

	.frame-voice > :deep(.block) {
		box-shadow: #666 0 2px 8px;
		display: block;
		transform: scale(0.96);
		transition: transform 0.1s;
	}

	.frame-voice.selected-name > :deep(.block) {
		transform: scale(0.97, 0.98);
		transition: transform 0.1s 0.4s;
	}

	.frame-voice :deep(.close) {
		display: block;
	}
}

/* max-width: 640px */
@media screen and (max-width: 640px) {
	.frame {
		width: 100%;
	}

	.frame-cast,
	.frame-voice {
		transform: translate3d(100%, 0, 0);
		transition: transform 0.4s;
	}

	.frame-cast.selected-title,
	.frame-voice.selected-name {
		transform: translate3d(0, 0, 0);
	}

	.frame-cast > :deep(.block),
	.frame-voice > :deep(.block) {
		display: block;
	}

	.frame-cast :deep(.close),
	.frame-voice :deep(.close) {
		display: block;
	}
}
</style>
