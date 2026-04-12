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
	<li :class="{ selected }" @click="$emit('select')">
		<span class="item-title">{{ titleName }}</span>
		<span class="item-year">{{ year }}</span>
	</li>
</template>

<style scoped>
li {
	align-items: center;
	border-bottom: var(--border-strong) solid 1px;
	cursor: pointer;
	display: flex;
	gap: 0.5em;
	padding: 0.4em 0.5em;
}

li:last-child {
	border-bottom: none;
}

li:hover {
	background: var(--fill-muted);
	color: var(--base-color);
}

li.selected {
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
