<script setup lang="ts">
import { Download } from "lucide-vue-next";
import { get } from "../../lib/api";
import type { AdminTab } from "../../lib/types";

defineProps<{ modelValue: AdminTab }>();
defineEmits<{ "update:modelValue": [tab: AdminTab] }>();

function downloadBlob(data: unknown, filename: string) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

async function exportData() {
	const [data, historyData] = await Promise.all([
		get("/export/data"),
		get("/export/history"),
	]);
	downloadBlob(data, "data.json");
	downloadBlob(historyData, "history.json");
}

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
			<button
				type="button"
				class="export-btn"
				@click="exportData"
			>
				<Download :size="15" :stroke-width="1.75" />
				Export
			</button>
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

.export-btn {
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

.export-btn:hover:not(:disabled) {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}

</style>
