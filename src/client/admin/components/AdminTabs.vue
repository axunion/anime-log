<script setup lang="ts">
import { Download, Upload } from "lucide-vue-next";
import { type Ref, ref } from "vue";
import { useConfirm } from "../../composables/useConfirm";
import { useHistory } from "../../composables/useHistory";
import { useTitles } from "../../composables/useTitles";
import { get, post } from "../../lib/api";
import type { AdminTab } from "../../lib/types";
import Modal from "../../components/Modal.vue";

defineProps<{ modelValue: AdminTab }>();
defineEmits<{ "update:modelValue": [tab: AdminTab] }>();

const { confirm } = useConfirm();
const { fetchTitles } = useTitles();
const { fetchHistory } = useHistory();

const importModalOpen = ref(false);
const dataFile = ref<File | null>(null);
const historyFile = ref<File | null>(null);
const importError = ref("");
const importing = ref(false);

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

function openImportModal() {
	dataFile.value = null;
	historyFile.value = null;
	importError.value = "";
	importModalOpen.value = true;
}

function makeFileHandler(target: Ref<File | null>) {
	return (e: Event) => {
		target.value = (e.target as HTMLInputElement).files?.[0] ?? null;
	};
}
const onDataFileChange = makeFileHandler(dataFile);
const onHistoryFileChange = makeFileHandler(historyFile);

async function readJson(file: File): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				resolve(JSON.parse(reader.result as string));
			} catch {
				reject(new Error(`${file.name} は有効な JSON ではありません`));
			}
		};
		reader.onerror = () => reject(new Error(`${file.name} の読み込みに失敗しました`));
		reader.readAsText(file);
	});
}

async function onImport() {
	if (!dataFile.value || !historyFile.value) {
		importError.value = "両方のファイルを選択してください";
		return;
	}

	importError.value = "";

	const ok = await confirm({
		message: "既存のデータを全て削除して置き換えます。続行しますか?",
		danger: true,
	});
	if (!ok) return;

	importing.value = true;
	try {
		const [dataPayload, historyPayload] = await Promise.all([
			readJson(dataFile.value),
			readJson(historyFile.value),
		]);
		await post("/import/data?confirm=replace-all", dataPayload);
		await post("/import/history?confirm=replace-all", historyPayload);
		importModalOpen.value = false;
		await Promise.all([fetchTitles(), fetchHistory()]);
	} catch (err) {
		importError.value = err instanceof Error ? err.message : "インポートに失敗しました";
	} finally {
		importing.value = false;
	}
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
			<div class="tab-actions">
				<button
					type="button"
					class="action-btn"
					@click="openImportModal"
				>
					<Upload :size="15" :stroke-width="1.75" />
					Import
				</button>
				<button
					type="button"
					class="action-btn"
					@click="exportData"
				>
					<Download :size="15" :stroke-width="1.75" />
					Export
				</button>
			</div>
		</div>
	</nav>

	<Modal v-model:open="importModalOpen" title="データをインポート" size="sm">
		<div class="import-form">
			<p class="import-warning">既存のタイトル・キャスト・履歴が全て置き換えられます。</p>
			<label class="import-label">
				タイトル / キャストデータ (data.json)
				<input type="file" accept=".json" @change="onDataFileChange" />
			</label>
			<label class="import-label">
				履歴データ (history.json)
				<input type="file" accept=".json" @change="onHistoryFileChange" />
			</label>
			<p v-if="importError" class="import-error">{{ importError }}</p>
		</div>
		<template #footer>
			<button
				type="button"
				class="btn-cancel"
				@click="importModalOpen = false"
			>
				キャンセル
			</button>
			<button
				type="button"
				class="btn-import"
				:disabled="!dataFile || !historyFile || importing"
				@click="onImport"
			>
				{{ importing ? "インポート中..." : "インポート" }}
			</button>
		</template>
	</Modal>
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

.tab-actions {
	display: flex;
	gap: 4px;
}

.action-btn {
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

.action-btn:hover:not(:disabled) {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}

/* Import modal */
.import-form {
	display: flex;
	flex-direction: column;
	gap: 1em;
}

.import-warning {
	color: var(--text-muted);
	font-size: 13px;
	line-height: 1.5;
	margin: 0;
}

.import-label {
	display: flex;
	flex-direction: column;
	font-size: 13px;
	gap: 6px;
}

.import-label input[type="file"] {
	cursor: pointer;
	font-size: 13px;
}

.import-error {
	color: var(--danger-color, #e53e3e);
	font-size: 13px;
	margin: 0;
}

.btn-cancel,
.btn-import {
	border-radius: 8px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	height: 32px;
	padding: 0 1em;
	transition: background 0.15s, color 0.15s;
}

.btn-cancel {
	background: transparent;
	border: 1px solid var(--glass-border);
	color: var(--text-muted);
}

.btn-cancel:hover {
	background: var(--hover-overlay);
	color: var(--contrast-color);
}

.btn-import {
	background: var(--accent-color);
	color: #fff;
}

.btn-import:hover:not(:disabled) {
	filter: brightness(1.1);
}

.btn-import:disabled {
	cursor: not-allowed;
	opacity: 0.5;
}
</style>
