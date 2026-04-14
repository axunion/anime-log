<script setup lang="ts">
import { Mic2, Plus, Save } from "lucide-vue-next";
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
		<h2 class="admin-section-title">
			<Mic2 :size="14" :stroke-width="2" />
			キャスト編集
		</h2>
		<p v-if="!selectedTitleName" class="no-selection">タイトルを選択してください</p>
		<template v-else>
			<p class="selected-title">{{ selectedTitleName }}</p>
			<div class="cast-rows">
				<CastEditorRow
					v-for="(row, i) in castRows"
					:key="i"
					:actor-name="row.actor_name"
					:character-name="row.character_name"
					@update:actor-name="row.actor_name = $event"
					@update:character-name="row.character_name = $event"
					@remove="removeRow(i)"
				/>
			</div>
			<button class="btn-add-row" type="button" @click="addRow">
				<Plus :size="13" :stroke-width="2" />
				行追加
			</button>
			<div class="admin-actions">
				<button class="admin-form-button admin-form-button--wide" type="button" @click="save">
					<Save :size="13" :stroke-width="2" />
					保存
				</button>
			</div>
		</template>
	</section>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.cast-rows {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}

.no-selection {
	color: var(--text-muted);
	font-size: 0.85em;
	margin: 0;
}

.selected-title {
	color: var(--text-muted);
	flex-shrink: 0;
	font-size: 0.85em;
	margin-bottom: 0.75em;
}

.btn-add-row {
	align-items: center;
	background: none;
	border: 1px dashed var(--glass-border);
	flex-shrink: 0;
	border-radius: 8px;
	color: var(--text-muted);
	cursor: pointer;
	display: flex;
	font-size: 12px;
	gap: 0.35em;
	justify-content: center;
	margin-top: 0.25em;
	padding: 0.35em 0.75em;
	transition: border-color 0.15s, color 0.15s;
	width: 100%;
}

.btn-add-row:hover {
	border-color: var(--accent-color);
	color: var(--accent-color);
}

.admin-actions {
	flex-shrink: 0;
	margin-top: 0.75em;
	text-align: right;
}
</style>
