<script setup lang="ts">
import type { TitleDetail } from "../../lib/types";
import CastRow from "./CastRow.vue";
import ExternalLinks from "./ExternalLinks.vue";

defineProps<{
	detail: TitleDetail | null;
}>();

const emit = defineEmits<{
	close: [];
	actorClick: [name: string];
}>();
</script>

<template>
	<div class="block" :class="{ active: detail !== null }">
		<ExternalLinks
			:text="detail?.title ?? ''"
			@close="emit('close')"
		/>
		<table class="cast-table">
			<tbody>
				<CastRow
					v-for="member in detail?.cast ?? []"
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
.block {
	display: none;
	height: 100%;
	overflow: auto;
	scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
	scrollbar-width: thin;
}

/* glass only in mobile overlay mode */
@media screen and (max-width: 640px) {
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

.cast-table {
	line-height: 20px;
	margin: 1em auto;
	width: 100%;
}
</style>
