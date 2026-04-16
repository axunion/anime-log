<script setup lang="ts">
import { X } from "lucide-vue-next";

defineProps<{
	actorName: string;
	characterName: string;
}>();

const emit = defineEmits<{
	"update:actorName": [value: string];
	"update:characterName": [value: string];
	commit: [];
	remove: [];
}>();
</script>

<template>
	<div
		class="cast-row"
		@focusout="($event.currentTarget as HTMLElement).contains($event.relatedTarget as Node) || emit('commit')"
	>
		<input
			class="admin-form-input cast-row-input cast-row-input--actor"
			type="text"
			placeholder="声優名"
			:value="actorName"
			@input="emit('update:actorName', ($event.target as HTMLInputElement).value)"
		/>
		<input
			class="admin-form-input cast-row-input cast-row-input--character"
			type="text"
			placeholder="役名"
			:value="characterName"
			@input="emit('update:characterName', ($event.target as HTMLInputElement).value)"
		/>
		<button class="btn-remove-row" type="button" @click="$emit('remove')">
			<X :size="14" :stroke-width="2" />
		</button>
	</div>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.cast-row {
	align-items: center;
	display: flex;
	gap: 0.5em;
}

/* cast inputs are more compact than the standard admin form input */
.cast-row-input {
	background: transparent;
	border-color: transparent;
	padding: 0.1em 0.5em;
}

.cast-row-input:focus {
	border-color: var(--focus-ring);
	box-shadow: 0 0 0 3px var(--focus-glow);
}

.cast-row-input--actor {
	flex: 0 0 96px;
}

.cast-row-input--character {
	flex: 1 1 auto;
}

.btn-remove-row {
	align-items: center;
	background: none;
	border: none;
	color: var(--text-subtle);
	cursor: pointer;
	display: flex;
	flex: 0 0 20px;
	justify-content: center;
	padding: 0;
	transition: color 0.15s;
}

.btn-remove-row:hover {
	color: var(--contrast-color);
}
</style>
