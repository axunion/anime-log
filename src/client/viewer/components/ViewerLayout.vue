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
</template>

<style scoped>
/* Each frame is position:fixed directly in the root stacking context.
   This allows backdrop-filter on overlay panels to reference the html
   background gradients and sibling frame content — which is impossible
   when frames are children of a position:fixed wrapper (separate compositing
   layer that backdrop-filter cannot cross). */
.frame {
	bottom: 0;
	left: 0;
	position: fixed;
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

	/* voice slides up from bottom, overlaying only the cast column (right half).
	   backdrop-filter and background kept on the base selector so the GPU
	   compositing layer is never destroyed mid-transition. */
	.frame-voice {
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		border-left: none;
		left: 50%;
		transform: translateY(100%);
		transition: transform 0.4s 0.1s;
		width: 50%;
	}

	.frame-voice.selected-name {
		box-shadow: var(--shadow-overlay) 0 4px 24px;
		transform: translateY(0);
		transition: transform 0.4s;
	}
}

/* max-width: 640px */
@media screen and (max-width: 640px) {
	.frame {
		width: 100%;
	}

	/* cast and voice slide up from bottom as full-screen overlays.
	   z-index is always set (frames are off-screen when inactive) so
	   stacking is correct throughout open/close animations. */
	.frame-cast,
	.frame-voice {
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		border-left: none;
		left: 0;
		transform: translateY(100%);
		transition: transform 0.4s;
	}

	.frame-cast {
		z-index: 10;
	}

	.frame-voice {
		z-index: 11;
	}

	.frame-cast.selected-title,
	.frame-voice.selected-name {
		transform: translateY(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.frame-cast,
	.frame-voice {
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		transition: none;
	}
}
</style>
