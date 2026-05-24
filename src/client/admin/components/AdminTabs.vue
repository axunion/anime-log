<script setup lang="ts">
import type { AdminTab } from "@shared/constants";
import AdminToolbar from "./AdminToolbar.vue";

defineProps<{ modelValue: AdminTab }>();
defineEmits<{ "update:modelValue": [tab: AdminTab] }>();

const tabs: { id: AdminTab; label: string }[] = [
	{ id: "history", label: "履歴" },
	{ id: "data", label: "データ" },
];
</script>

<template>
	<nav class="admin-tabs glass-surface">
		<div class="admin-tabs-inner">
			<div class="tabs">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					type="button"
					class="tab"
					:class="{ active: modelValue === tab.id }"
					@click="$emit('update:modelValue', tab.id)"
				>
					{{ tab.label }}
				</button>
			</div>
			<AdminToolbar />
		</div>
	</nav>
</template>

<style scoped>
.admin-tabs {
	border-bottom: 1px solid var(--glass-border);
	flex-shrink: 0;
	height: 48px;
}

.admin-tabs-inner {
	align-items: center;
	box-sizing: border-box;
	display: flex;
	height: 100%;
	justify-content: space-between;
	margin: 0 auto;
	max-width: 1200px;
	padding: 0 1.5em;
}

.tabs {
	align-items: center;
	display: flex;
	gap: 4px;
}

.tab {
	align-items: center;
	border-radius: 8px;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	font-size: 13px;
	font-weight: 500;
	gap: 0.4em;
	height: 32px;
	padding: 0 0.75em;
	transition: color 0.15s, background 0.15s;
}

.tab:hover {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}

.tab.active {
	background: color-mix(in srgb, var(--accent-color) 12%, transparent);
	color: var(--accent-color);
}
</style>
