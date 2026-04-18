<script setup lang="ts">
import { Download, History, Library } from "lucide-vue-next";
import { useHistory } from "../../composables/useHistory";
import { useTitles } from "../../composables/useTitles";
import { get } from "../../lib/api";
import type { AdminTab } from "../../lib/types";

defineProps<{ modelValue: AdminTab }>();
defineEmits<{ "update:modelValue": [tab: AdminTab] }>();

const { titles } = useTitles();
const { history } = useHistory();

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

const tabs: {
	id: AdminTab;
	icon: typeof Library;
	label: string;
	getCount: () => number;
}[] = [
	{
		id: "history",
		icon: History,
		label: "履歴",
		getCount: () => history.value.length,
	},
	{
		id: "data",
		icon: Library,
		label: "データ",
		getCount: () => titles.value.length,
	},
];
</script>

<template>
	<nav class="admin-tabs glass-surface">
		<div class="admin-tabs-inner">
			<div class="left">
				<div class="tabs">
					<button
						v-for="tab in tabs"
						:key="tab.id"
						type="button"
						class="tab"
						:class="{ active: modelValue === tab.id }"
						@click="$emit('update:modelValue', tab.id)"
					>
						<component :is="tab.icon" :size="15" :stroke-width="1.75" />
						{{ tab.label }}
					</button>
				</div>
				<div class="stats">
					<span v-for="tab in tabs" :key="tab.id" class="stat">
						<component :is="tab.icon" :size="15" :stroke-width="1.75" />
						{{ tab.getCount() }}
					</span>
				</div>
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

.left {
	align-items: center;
	display: flex;
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

.stats {
	align-items: center;
	display: flex;
	gap: 4px;
	margin-left: 1.25em;
}

.stat {
	align-items: center;
	border-radius: 8px;
	color: var(--text-subtle);
	display: flex;
	font-size: 13px;
	gap: 0.4em;
	height: 32px;
	padding: 0 0.75em;
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

@media screen and (max-width: 480px) {
	.stats {
		display: none;
	}
}
</style>
