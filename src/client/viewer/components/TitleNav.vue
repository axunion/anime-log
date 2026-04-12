<script setup lang="ts">
import { CalendarArrowDown, Clock, Search } from "lucide-vue-next";
import type { Tab } from "../../lib/types";

defineProps<{ activeTab: Tab; query: string }>();
defineEmits<{ "update:activeTab": [tab: Tab]; "update:query": [q: string] }>();

const tabs: { id: Tab; icon: typeof Clock; label: string }[] = [
	{ id: "history", icon: Clock, label: "History" },
	{ id: "year", icon: CalendarArrowDown, label: "Year" },
];
</script>

<template>
	<nav class="nav glass-surface">
		<div class="tabs">
			<button
				v-for="tab in tabs"
				:key="tab.id"
				type="button"
				class="tab"
				:class="{ active: activeTab === tab.id }"
				:aria-label="tab.label"
				:title="tab.label"
				@click="$emit('update:activeTab', tab.id)"
			>
				<component :is="tab.icon" :size="18" :stroke-width="1.75" />
			</button>
		</div>
		<label class="search">
			<Search :size="15" :stroke-width="1.75" class="search-icon" />
			<input
				class="search-input"
				type="text"
				:value="query"
				placeholder="Search"
				@input="$emit('update:query', ($event.target as HTMLInputElement).value)"
			/>
		</label>
	</nav>
</template>

<style scoped>
.nav {
	align-items: center;
	border-bottom: 1px solid var(--glass-border);
	display: flex;
	gap: 0.5em;
	height: 48px;
	padding: 0 0.625em;
	position: sticky;
	top: 0;
	user-select: none;
	z-index: 2;
}

.tabs {
	display: flex;
	gap: 2px;
}

.tab {
	align-items: center;
	border-radius: 8px;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	height: 32px;
	justify-content: center;
	transition: color 0.15s, background 0.15s;
	width: 32px;
}

.tab:hover {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}

.tab.active {
	background: color-mix(in srgb, var(--accent-color) 12%, transparent);
	color: var(--accent-color);
}

.search {
	align-items: center;
	background: var(--glass-bg-strong);
	border: 1px solid var(--glass-border);
	border-radius: 8px;
	cursor: text;
	display: flex;
	flex: 1;
	gap: 0.5em;
	height: 30px;
	padding: 0 0.625em;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.search:focus-within {
	border-color: var(--focus-ring);
	box-shadow: 0 0 0 3px var(--focus-glow);
}

.search-icon {
	color: var(--text-subtle);
	flex: 0 0 auto;
}

.search-input {
	background: transparent;
	flex: 1;
	font-size: 13px;
	min-width: 0;
}

.search-input::placeholder {
	color: var(--text-subtle);
}
</style>
