<script setup lang="ts">
import { X } from "lucide-vue-next";

defineProps<{
	actorName: string;
	characterName: string;
}>();

const emit = defineEmits<{
	"update:actorName": [value: string];
	"update:characterName": [value: string];
	remove: [];
}>();
</script>

<template>
	<div class="cast-row">
		<input
			class="admin-form-input cast-row-input"
			type="text"
			placeholder="声優名"
			:value="actorName"
			@input="emit('update:actorName', ($event.target as HTMLInputElement).value)"
		/>
		<input
			class="admin-form-input cast-row-input"
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
	margin-bottom: 0.5em;
}

/* cast inputs are more compact than the standard admin form input */
.cast-row-input {
	padding: 0.25em 0.5em;
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
