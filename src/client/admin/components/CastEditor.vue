<script setup lang="ts">
import { ref, watch } from "vue";
import { del, get, post } from "../../lib/api";
import type { TitleDetail } from "../../lib/types";
import CastEditorRow from "./CastEditorRow.vue";

const props = defineProps<{
	selectedTitleId: number | null;
	selectedTitleName: string;
}>();

type CastRow = { id?: number; actor_name: string; character_name: string };

const castRows = ref<CastRow[]>([]);

watch(
	() => props.selectedTitleId,
	async (id) => {
		if (id === null) {
			castRows.value = [];
			return;
		}
		const detail = await get<TitleDetail>(`/titles/${id}`);
		castRows.value = detail.cast.map((m) => ({
			id: m.id,
			actor_name: m.actor_name,
			character_name: m.character_name,
		}));
	},
);

function addRow() {
	castRows.value.push({ actor_name: "", character_name: "" });
}

function removeRow(index: number) {
	castRows.value.splice(index, 1);
}

async function save() {
	if (props.selectedTitleId === null) return;
	const id = props.selectedTitleId;

	const rows = castRows.value.filter((r) => r.actor_name.trim());

	const existingIds = castRows.value.filter((r) => r.id).map((r) => r.id!);
	await Promise.all(existingIds.map((castId) => del(`/cast/${castId}`)));
	for (const row of rows) {
		await post(`/titles/${id}/cast`, {
			actor_name: row.actor_name,
			character_name: row.character_name,
		});
	}
	alert("保存しました");
}
</script>

<template>
	<section class="admin-section">
		<h2>キャスト編集</h2>
		<p v-if="!selectedTitleName" class="no-selection">タイトルを選択してください</p>
		<template v-else>
			<p class="selected-title">{{ selectedTitleName }}</p>
			<CastEditorRow
				v-for="(row, i) in castRows"
				:key="i"
				:actor-name="row.actor_name"
				:character-name="row.character_name"
				@update:actor-name="row.actor_name = $event"
				@update:character-name="row.character_name = $event"
				@remove="removeRow(i)"
			/>
			<button class="btn-add-row" type="button" @click="addRow">+ 行追加</button>
			<div class="admin-actions">
				<button class="btn-save" type="button" @click="save">保存</button>
			</div>
		</template>
	</section>
</template>

<style scoped>
.admin-section {
	border: var(--border-strong) solid 1px;
	border-radius: 4px;
	padding: 1em;
}

.admin-section h2 {
	font-size: 0.9em;
	font-weight: normal;
	letter-spacing: 0.1em;
	margin: 0 0 1em;
}

.no-selection {
	color: var(--text-muted);
	font-size: 0.85em;
	margin: 0;
}

.selected-title {
	color: var(--text-muted);
	font-size: 0.85em;
	margin-bottom: 0.75em;
}

.btn-add-row {
	background: none;
	border: var(--border-strong) dashed 1px;
	border-radius: 4px;
	color: var(--text-muted);
	cursor: pointer;
	font-size: 12px;
	margin-top: 0.25em;
	padding: 0.25em 0.75em;
	width: 100%;
}

.btn-add-row:hover {
	border-color: var(--text-muted);
	color: var(--contrast-color);
}

.admin-actions {
	margin-top: 0.75em;
	text-align: right;
}

.btn-save {
	background: var(--contrast-color);
	border-radius: 4px;
	color: var(--base-color);
	cursor: pointer;
	padding: 0.25em 1.5em;
}
</style>
