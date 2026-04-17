<script setup lang="ts">
import {
	ClipboardList,
	Mic2,
	RotateCcw,
	Save,
	Trash2,
	X,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useCast } from "../../composables/useCast";
import CastEditorRow from "./CastEditorRow.vue";

const props = defineProps<{
	selectedTitleId: number | null;
	selectedTitleName: string;
}>();

const { selectedDetail, loadCast, replaceCast } = useCast();

type CastRow = { key: number; actor_name: string; character_name: string };
let nextKey = 0;

const rows = ref<CastRow[]>([]);
const savedRows = ref<CastRow[]>([]);
const saving = ref(false);

const bulkOpen = ref(false);
const bulkText = ref("");

const dirty = computed(
	() =>
		JSON.stringify(
			rows.value.map(({ actor_name, character_name }) => ({
				actor_name,
				character_name,
			})),
		) !==
		JSON.stringify(
			savedRows.value.map(({ actor_name, character_name }) => ({
				actor_name,
				character_name,
			})),
		),
);

function castToRows(
	cast: { actor_name: string; character_name: string }[],
): CastRow[] {
	return cast.map((m) => ({
		key: nextKey++,
		actor_name: m.actor_name,
		character_name: m.character_name,
	}));
}

watch(
	() => props.selectedTitleId,
	async (id) => {
		bulkOpen.value = false;
		bulkText.value = "";
		if (id === null) {
			rows.value = [];
			savedRows.value = [];
			return;
		}
		await loadCast(id);
		const cast = selectedDetail.value?.cast ?? [];
		rows.value = castToRows(cast);
		savedRows.value = castToRows(cast);
	},
);

function clearAll() {
	rows.value = [];
}

function onCancel() {
	rows.value = savedRows.value.map((r) => ({ ...r }));
}

function removeRow(index: number) {
	rows.value.splice(index, 1);
}

function updateRow(
	index: number,
	field: keyof Omit<CastRow, "key">,
	value: string,
) {
	rows.value[index][field] = value;
}

function openBulk() {
	bulkText.value = "";
	bulkOpen.value = true;
}

function cancelBulk() {
	bulkOpen.value = false;
	bulkText.value = "";
}

function commitBulk() {
	const parsed = bulkText.value.split("\n").flatMap((line) => {
		const trimmed = line.trim();
		if (!trimmed) return [];
		const [actor = "", character = ""] = trimmed.split("\t");
		return actor.trim()
			? [
					{
						key: nextKey++,
						actor_name: actor.trim(),
						character_name: character.trim(),
					},
				]
			: [];
	});
	rows.value.push(...parsed);
	bulkOpen.value = false;
	bulkText.value = "";
}

async function onSave() {
	if (props.selectedTitleId === null || !dirty.value) return;
	saving.value = true;
	try {
		const payload = rows.value
			.filter((r) => r.actor_name.trim())
			.map(({ actor_name, character_name }) => ({
				actor_name,
				character_name,
			}));
		await replaceCast(props.selectedTitleId, payload);
		savedRows.value = castToRows(payload);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<section class="admin-section">
		<h2 class="admin-section-title">
			<Mic2 :size="14" :stroke-width="2" />
			キャスト編集
		</h2>

		<template v-if="selectedTitleName">
			<div class="cast-header">
				<p class="selected-title">{{ selectedTitleName }}</p>
				<button
					class="admin-form-button"
					type="button"
					@click="bulkOpen ? cancelBulk() : openBulk()"
				>
					<ClipboardList :size="13" :stroke-width="2.5" />
					追加
				</button>
				<button
					class="admin-form-button btn-outline"
					type="button"
					:disabled="rows.length === 0"
					@click="clearAll"
				>
					<Trash2 :size="13" :stroke-width="2.5" />
					クリア
				</button>
			</div>

			<div v-if="bulkOpen" class="bulk-panel">
				<textarea
					class="bulk-textarea"
					v-model="bulkText"
					placeholder="声優名&#9;役名（1行1件、タブ区切り）"
					spellcheck="false"
					autofocus
				/>
				<div class="bulk-actions">
					<button class="admin-form-button" type="button" :disabled="!bulkText.trim()" @click="commitBulk">
						取り込む
					</button>
					<button class="btn-cancel" type="button" @click="cancelBulk">
						<X :size="13" :stroke-width="2.5" />
						キャンセル
					</button>
				</div>
			</div>

			<div v-show="!bulkOpen" class="cast-rows">
				<CastEditorRow
					v-for="(row, i) in rows"
					:key="row.key"
					:actor-name="row.actor_name"
					:character-name="row.character_name"
					@update:actor-name="(v) => updateRow(i, 'actor_name', v)"
					@update:character-name="(v) => updateRow(i, 'character_name', v)"
					@remove="removeRow(i)"
				/>
			</div>
			<div v-show="!bulkOpen" class="cast-footer">
				<button
					class="btn-cancel"
					type="button"
					:disabled="!dirty || saving"
					@click="onCancel"
				>
					<RotateCcw :size="13" :stroke-width="2.5" />
					キャンセル
				</button>
				<button
					class="admin-form-button"
					type="button"
					:disabled="!dirty || saving"
					@click="onSave"
				>
					<Save :size="13" :stroke-width="2.5" />
					保存
				</button>
			</div>
		</template>

		<p v-else class="cast-placeholder">← タイトルを選択</p>
	</section>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.cast-header {
	align-items: center;
	display: flex;
	flex-shrink: 0;
	gap: 0.5em;
	margin-bottom: 0.75em;
}

.selected-title {
	color: var(--text-muted);
	flex: 1;
	font-size: 0.85em;
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.admin-form-button:disabled {
	cursor: default;
	opacity: 0.35;
}

.bulk-panel {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.5em;
	min-height: 0;
}

.bulk-textarea {
	background: var(--glass-bg-strong);
	border: 1px solid var(--glass-border);
	border-radius: 6px;
	box-sizing: border-box;
	flex: 1;
	font-size: 13px;
	line-height: 1.6;
	padding: 0.5em 0.6em;
	resize: none;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
	width: 100%;
}

.bulk-textarea:focus {
	border-color: var(--focus-ring);
	box-shadow: 0 0 0 3px var(--focus-glow);
	outline: none;
}

.bulk-actions {
	align-items: center;
	display: flex;
	gap: 0.5em;
}

.btn-cancel {
	align-items: center;
	background: none;
	border: none;
	color: var(--text-subtle);
	cursor: pointer;
	display: inline-flex;
	font-size: 13px;
	gap: 0.35em;
	padding: 0.25em 0.5em;
	transition: color 0.1s;
}

.btn-cancel:disabled {
	cursor: default;
	opacity: 0.35;
}

.btn-cancel:hover:not(:disabled) {
	color: var(--contrast-color);
}

.cast-rows {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.2em;
	min-height: 0;
	overflow-y: auto;
	padding-right: 0.25em;
}

.btn-outline {
	background: none;
	border-color: var(--glass-border);
	color: var(--text-muted);
}

.btn-outline:hover:not(:disabled) {
	background: var(--glass-bg-strong);
	opacity: 1;
}

.cast-footer {
	display: flex;
	flex-shrink: 0;
	gap: 0.5em;
	justify-content: flex-end;
	margin-top: 0.75em;
}

.cast-placeholder {
	color: var(--text-subtle);
	font-size: 0.85em;
	margin: 0;
}
</style>
