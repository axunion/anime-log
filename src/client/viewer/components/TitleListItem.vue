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
	border-radius: var(--radius-md);
	cursor: pointer;
	display: flex;
	margin: 1px 0.5em;
	padding: 0.7em 0.75em;
	transition:
		background-color var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
}

@media (hover: hover) {
	.title-item:hover:not(.selected) {
		background: var(--hover-overlay);
	}
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
