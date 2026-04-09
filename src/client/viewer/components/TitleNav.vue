<script setup lang="ts">
type Tab = "history" | "year" | "name";

const props = defineProps<{
	activeTab: Tab;
}>();

const emit = defineEmits<{
	"update:activeTab": [tab: Tab];
}>();

const tabs: { id: Tab; label: string }[] = [
	{ id: "history", label: "History" },
	{ id: "year", label: "Year" },
	{ id: "name", label: "Name" },
];
</script>

<template>
	<nav class="nav">
		<ul class="nav-list">
			<li v-for="tab in tabs" :key="tab.id">
				<a
					href="#"
					:class="{ active: activeTab === tab.id }"
					@click.prevent="emit('update:activeTab', tab.id)"
				>{{ tab.label }}</a>
			</li>
		</ul>
	</nav>
</template>

<style scoped>
.nav {
	box-shadow: var(--assort-color) inset 0 -1px;
	line-height: 40px;
	user-select: none;
}

.nav-list {
	display: flex;
	padding: 0 1em;
}

.nav-list a {
	color: var(--assort-color);
	display: block;
	text-align: center;
	width: 60px;
}

.nav-list .active {
	box-shadow: var(--contrast-color) inset 0 -1px;
	color: var(--contrast-color);
}
</style>
