<script setup lang="ts">
import { ref, watch } from "vue";
import type { TitleDetail } from "../../lib/types";
import CastRow from "./CastRow.vue";
import ExternalLinks from "./ExternalLinks.vue";

const props = defineProps<{
	detail: TitleDetail | null;
}>();

const emit = defineEmits<{
	close: [];
	actorClick: [name: string];
}>();

// Retain the last non-null detail so content stays visible during exit animation.
const displayDetail = ref<TitleDetail | null>(props.detail);
watch(
	() => props.detail,
	(val) => {
		if (val !== null) displayDetail.value = val;
	},
);
</script>

<template>
	<div class="panel-content" :class="{ visible: detail !== null }">
		<ExternalLinks
			:text="displayDetail?.title ?? ''"
			@close="emit('close')"
		/>
		<table class="cast-table">
			<tbody>
				<CastRow
					v-for="member in displayDetail?.cast ?? []"
					:key="member.id"
					:actor-name="member.actor_name"
					:character-name="member.character_name"
					@actor-click="emit('actorClick', $event)"
				/>
			</tbody>
		</table>
	</div>
</template>

<style scoped>
@import "../styles/viewer-shared.css";

.cast-table {
	line-height: 20px;
	margin: 1em auto 1.5em;
	width: 100%;
}

/* In 1-column mode the frame itself animates (slide left/right), so
   panel-content must stay visible throughout. display:none would erase
   the content before the frame finishes sliding off-screen. */
@media screen and (max-width: 640px) {
	.panel-content {
		display: block;
	}
}
</style>
