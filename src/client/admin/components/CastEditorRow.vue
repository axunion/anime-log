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
			type="text"
			placeholder="声優名"
			:value="actorName"
			@input="emit('update:actorName', ($event.target as HTMLInputElement).value)"
		/>
		<input
			type="text"
			placeholder="役名"
			:value="characterName"
			@input="emit('update:characterName', ($event.target as HTMLInputElement).value)"
		/>
		<button class="btn-remove-row" type="button" @click="$emit('remove')">×</button>
	</div>
</template>

<style scoped>
.cast-row {
	align-items: center;
	display: flex;
	gap: 0.5em;
	margin-bottom: 0.5em;
}

.cast-row input {
	background: var(--base-color);
	border: var(--assort-color) solid 1px;
	border-radius: 4px;
	flex: 1 1 auto;
	min-width: 0;
	padding: 0.25em 0.5em;
}

.cast-row input:focus {
	border-color: var(--gray-color);
	outline: none;
}

.btn-remove-row {
	background: none;
	border: none;
	color: var(--gray-color);
	cursor: pointer;
	flex: 0 0 20px;
	font-size: 16px;
	padding: 0;
}
</style>
