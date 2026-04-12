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
	<div class="viewport">
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
.viewport {
	bottom: 0;
	left: 0;
	overflow: hidden;
	position: fixed;
	right: 0;
	top: 0;
}

.frame {
	bottom: 0;
	isolation: isolate;
	position: absolute;
	top: 0;
	width: 33.33%;
}

.frame + .frame {
	border-left: var(--glass-border) solid 1px;
}

.frame-cast {
	left: 33.33%;
}

.frame-voice {
	left: 66.66%;
}

/* min-width: 641px and max-width: 960px */
@media screen and (min-width: 641px) and (max-width: 960px) {
	.frame {
		width: 50%;
	}

	.frame-cast {
		left: 50%;
	}

	/* voice panel slides up from bottom as a full-width overlay */
	.frame-voice {
		border-left: none;
		left: 0;
		width: 100%;
		transform: translate3d(0, 100%, 0);
		transition: transform 0.4s 0.1s;
		will-change: transform;
	}

	.frame-voice.selected-name {
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		box-shadow: var(--shadow-overlay) 0 4px 24px;
		transform: translate3d(0, 0, 0);
		transition: transform 0.4s;
	}

}

/* max-width: 640px */
@media screen and (max-width: 640px) {
	.frame {
		width: 100%;
	}

	/* cast and voice panels slide in from the right as full-screen overlays */
	.frame-cast,
	.frame-voice {
		border-left: none;
		left: 0;
		transform: translate3d(100%, 0, 0);
		transition: transform 0.4s;
		will-change: transform;
	}

	.frame-cast.selected-title,
	.frame-voice.selected-name {
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		transform: translate3d(0, 0, 0);
	}

}

@media (prefers-reduced-motion: reduce) {
	.frame-cast.selected-title,
	.frame-voice.selected-name {
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}
}
</style>
