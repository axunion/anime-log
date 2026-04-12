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
	<li class="title-item" :class="{ selected }" :title="titleName" @click="$emit('select')">
		<span class="title-item-name">{{ titleName }}</span>
		<span class="title-item-year">{{ year }}</span>
	</li>
</template>

<style scoped>
.title-item {
	cursor: pointer;
	display: flex;
	padding: 0.75em 1em;
}

.title-item.selected {
	background: var(--fill-muted);
	color: var(--base-color);
}

.title-item-name {
	flex: 0 1 100%;
	letter-spacing: 0.1em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.title-item-year {
	color: var(--text-subtle);
	flex: 0 1 40px;
	text-align: right;
}

.title-item.selected .title-item-year {
	color: var(--base-color);
}
</style>
