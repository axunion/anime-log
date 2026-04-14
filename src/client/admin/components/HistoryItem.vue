<script setup lang="ts">
import { ChevronDown, ChevronUp, Trash2 } from "lucide-vue-next";
import type { HistoryEntry } from "../../lib/types";

defineProps<{
	entry: HistoryEntry;
	isFirst: boolean;
	isLast: boolean;
}>();

defineEmits<{
	moveUp: [];
	moveDown: [];
	delete: [];
}>();
</script>

<template>
	<li class="history-item">
		<button class="btn-order" type="button" :disabled="isFirst" @click="$emit('moveUp')">
			<ChevronUp :size="14" :stroke-width="2" />
		</button>
		<button class="btn-order" type="button" :disabled="isLast" @click="$emit('moveDown')">
			<ChevronDown :size="14" :stroke-width="2" />
		</button>
		<span class="item-title">{{ entry.display_name ?? entry.title }}</span>
		<span class="item-year">{{ entry.year }}</span>
		<button class="btn-delete" type="button" @click="$emit('delete')">
			<Trash2 :size="13" :stroke-width="1.75" />
		</button>
	</li>
</template>

<style scoped>
.history-item {
	align-items: center;
	border-bottom: 1px solid var(--glass-border);
	display: flex;
	gap: 0.4em;
	padding: 0.4em 0.25em;
	transition: background 0.1s;
}

.history-item:last-child {
	border-bottom: none;
}

.history-item:hover {
	background: var(--hover-overlay);
	border-radius: 6px;
}

.item-title {
	flex: 1 1 auto;
	font-size: 13px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-year {
	color: var(--text-subtle);
	flex: 0 0 40px;
	font-size: 12px;
	text-align: right;
}

.btn-order {
	align-items: center;
	background: none;
	border: 1px solid var(--glass-border);
	border-radius: 4px;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	flex: 0 0 22px;
	height: 22px;
	justify-content: center;
	padding: 0;
	transition: border-color 0.1s, color 0.1s;
	width: 22px;
}

.btn-order:hover:not(:disabled) {
	border-color: var(--accent-color);
	color: var(--accent-color);
}

.btn-order:disabled {
	cursor: default;
	opacity: 0.25;
}

.btn-delete {
	align-items: center;
	background: none;
	border: none;
	color: var(--text-subtle);
	cursor: pointer;
	display: flex;
	flex: 0 0 24px;
	justify-content: center;
	padding: 0;
	transition: color 0.15s;
}

.btn-delete:hover {
	color: var(--contrast-color);
}
</style>
