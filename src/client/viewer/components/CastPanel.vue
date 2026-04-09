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
	<div class="block">
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

.cast-table {
	line-height: 20px;
	margin: 1em auto;
	width: 100%;
}
</style>
