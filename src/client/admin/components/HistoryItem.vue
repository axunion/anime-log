<script setup lang="ts">
import type { HistoryEntry } from "../../lib/types";

const props = defineProps<{
	entry: HistoryEntry;
	isFirst: boolean;
	isLast: boolean;
}>();

const emit = defineEmits<{
	moveUp: [];
	moveDown: [];
	delete: [];
}>();

</script>

<template>
	<li>
		<button class="btn-up" type="button" :disabled="isFirst" @click="$emit('moveUp')">▲</button>
		<button class="btn-down" type="button" :disabled="isLast" @click="$emit('moveDown')">▼</button>
		<span class="item-title">{{ entry.display_name ?? entry.title }}</span>
		<span class="item-year">{{ entry.year }}</span>
		<button
			class="btn-delete"
			type="button"
			@click="$emit('delete')"
		>×</button>
	</li>
</template>

<style scoped>
li {
	align-items: center;
	border-bottom: var(--assort-color) solid 1px;
	display: flex;
	gap: 0.5em;
	padding: 0.4em 0.5em;
}

li:last-child {
	border-bottom: none;
}

.item-title {
	flex: 1 1 auto;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-year {
	color: var(--gray-color);
	flex: 0 0 40px;
	text-align: right;
}

.btn-up,
.btn-down {
	background: none;
	border: var(--assort-color) solid 1px;
	border-radius: 2px;
	cursor: pointer;
	flex: 0 0 20px;
	font-size: 10px;
	padding: 0;
	text-align: center;
}

.btn-up:disabled,
.btn-down:disabled {
	opacity: 0.3;
	cursor: default;
}

.btn-delete {
	background: none;
	border: none;
	color: var(--gray-color);
	cursor: pointer;
	flex: 0 0 24px;
	font-size: 14px;
	padding: 0;
	text-align: center;
}

.btn-delete:hover {
	color: var(--contrast-color);
}
</style>
