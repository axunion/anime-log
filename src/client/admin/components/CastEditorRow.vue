<script setup lang="ts">
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
		<button class="btn-remove-row" type="button" @click="$emit('remove')">×</button>
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
	background: none;
	border: none;
	color: var(--text-muted);
	cursor: pointer;
	flex: 0 0 20px;
	font-size: 16px;
	padding: 0;
}
</style>
