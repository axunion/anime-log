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
	<li :class="{ selected }" :title="titleName" @click="$emit('select')">
		<span class="name">{{ titleName }}</span>
		<span class="year">{{ year }}</span>
	</li>
</template>

<style scoped>
li {
	cursor: pointer;
	display: flex;
	padding: 0.75em 1em;
}

li.selected {
	background: var(--assort-color);
	color: var(--base-color);
}

.name {
	flex: 0 1 100%;
	letter-spacing: 0.1em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.year {
	color: var(--assort-color);
	flex: 0 1 40px;
	text-align: right;
}

li.selected .year {
	color: var(--base-color);
}
</style>
