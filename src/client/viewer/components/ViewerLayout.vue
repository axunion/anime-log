<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
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

// Asymmetric cast animation: enters from right, exits to right.
// Managed in JS because CSS transitions can't express different
// source and destination positions for enter vs leave.
const castVisible = ref(false);
const castLeaving = ref(false);
let castLeaveTimer: ReturnType<typeof setTimeout> | null = null;

watch(
	() => props.castDetail,
	async (val, old) => {
		if (val !== null) {
			if (castLeaveTimer) {
				clearTimeout(castLeaveTimer);
				castLeaveTimer = null;
			}
			castLeaving.value = false;
			// Wait one tick so the DOM settles at translateX(100%) before animating in.
			await nextTick();
			castVisible.value = true;
		} else if (old !== null) {
			castVisible.value = false;
			castLeaving.value = true;
			castLeaveTimer = setTimeout(() => {
				castLeaving.value = false;
				castLeaveTimer = null;
			}, 420);
		}
	},
);

onUnmounted(() => {
	if (castLeaveTimer) clearTimeout(castLeaveTimer);
});
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

	<div class="frame frame-cast" :class="{ 'cast-visible': castVisible, 'cast-leaving': castLeaving }">
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

/* voice frame: shared modal layout for 2-column and 1-column.
   pointer-events:none lets clicks pass through to content below;
   selected-name re-enables events once the panel is open. */
@media screen and (max-width: 960px) {
	.frame-voice {
		align-items: flex-start;
		border-left: none;
		display: flex;
		justify-content: center;
		pointer-events: none;
	}

	.frame-voice.selected-name {
		pointer-events: auto;
	}
}

/* min-width: 641px and max-width: 960px */
@media screen and (min-width: 641px) and (max-width: 960px) {
	.frame {
		width: 50%;
	}

	.frame-cast {
		left: 50%;
	}

	.frame-voice {
		left: 50%;
		width: 50%;
	}
}

/* max-width: 640px */
@media screen and (max-width: 640px) {
	.frame {
		width: 100%;
	}

	/* cast enters from the right, exits to the right.
	   Default position (translateX(100%)) has no transition so the
	   snap back after leaving (0 → 100%) is invisible off-screen. */
	.frame-cast {
		backdrop-filter: var(--glass-blur);
		background: var(--glass-bg);
		border-left: none;
		left: 0;
		transform: translateX(100%);
		z-index: 10;
	}

	.frame-cast.cast-visible {
		transform: translateX(0);
		transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.frame-cast.cast-leaving {
		transform: translateX(100%);
		transition: transform 0.35s cubic-bezier(0.3, 0.8, 0.7, 1);
	}

	.frame-voice {
		left: 0;
		z-index: 11;
	}
}

@media (prefers-reduced-motion: reduce) {
	.frame-cast {
		backdrop-filter: none;
	}

	.frame-cast.cast-visible,
	.frame-cast.cast-leaving {
		transition: none;
	}
}
</style>
