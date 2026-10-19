<script setup lang="ts">
import { Download, Upload } from "@lucide/vue";
import Modal from "../../components/AppModal.vue";
import { useDataPortability } from "../../composables/useDataPortability";

const {
  importModalOpen,
  dataFile,
  historyFile,
  importError,
  exportError,
  importing,
  exporting,
  exportData,
  openImportModal,
  onDataFileChange,
  onHistoryFileChange,
  onImport,
} = useDataPortability();
</script>

<template>
	<div class="tab-actions">
		<button type="button" class="btn action-btn" @click="openImportModal">
			<Upload :size="15" :stroke-width="1.75" />
			Import
		</button>
		<button type="button" class="btn action-btn" :disabled="exporting" @click="exportData">
			<Download :size="15" :stroke-width="1.75" />
			{{ exporting ? "..." : "Export" }}
		</button>
	</div>
	<p v-if="exportError" class="export-error">{{ exportError }}</p>

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
			<button type="button" class="btn btn--ghost" @click="importModalOpen = false">
				キャンセル
			</button>
			<button
				type="button"
				class="btn btn--primary"
				:disabled="!dataFile || !historyFile || importing"
				@click="onImport"
			>
				{{ importing ? "インポート中..." : "インポート" }}
			</button>
		</template>
	</Modal>
</template>

<style scoped>
.tab-actions {
	display: flex;
	gap: 4px;
}

.action-btn {
	--btn-bg: transparent;
}

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
	color: var(--danger-color);
	font-size: 13px;
	margin: 0;
}

.export-error {
	color: var(--danger-color);
	font-size: 12px;
	margin: 0;
	padding: 0 0.5em;
}
</style>
