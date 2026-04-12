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
	border-bottom: var(--border-strong) solid 1px;
	cursor: pointer;
	display: flex;
	gap: 0.5em;
	padding: 0.4em 0.5em;
}

.search-item:last-child {
	border-bottom: none;
}

.search-item:hover {
	background: var(--fill-muted);
	color: var(--base-color);
}

.search-item.selected {
	background: var(--contrast-color);
	color: var(--base-color);
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
	text-align: right;
}

</style>
