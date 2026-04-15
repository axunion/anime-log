<script setup lang="ts">
defineProps<{
	titleName: string;
	year: number;
	selected: boolean;
}>();

defineEmits<{
	select: [];
}>();
</script>

<template>
	<li class="search-item" :class="{ selected }" @click="$emit('select')">
		<span class="item-title">{{ titleName }}</span>
		<span class="item-year">{{ year }}</span>
	</li>
</template>

<style scoped>
.search-item {
	align-items: center;
	border-bottom: 1px solid var(--glass-border);
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	font-size: 13px;
	gap: 0.5em;
	padding: 0.4em 0.5em;
	transition: background 0.1s, color 0.1s;
}

.search-item:last-child {
	border-bottom: none;
}

.search-item:hover {
	background: var(--hover-overlay);
}

.search-item.selected {
	background: color-mix(in srgb, var(--accent-color) 12%, transparent);
	color: var(--accent-color);
}

.item-title {
	flex: 1 1 auto;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-year {
	color: var(--text-subtle);
	flex: 0 0 40px;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
	text-align: right;
}
</style>
