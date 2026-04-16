<script setup lang="ts">
import { Mic2, Save } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useCast } from "../../composables/useCast";
import type { CastInput } from "../../lib/types";

const props = defineProps<{
	selectedTitleId: number | null;
	selectedTitleName: string;
}>();

const { selectedDetail, loadCast, replaceCast } = useCast();

const tsv = ref("");
const savedTsv = ref("");
const saving = ref(false);

const dirty = computed(() => tsv.value !== savedTsv.value);

watch(
	() => props.selectedTitleId,
	async (id) => {
		if (id === null) {
			tsv.value = "";
			savedTsv.value = "";
			return;
		}
		await loadCast(id);
		const lines = (selectedDetail.value?.cast ?? [])
			.map((m) => `${m.actor_name}\t${m.character_name}`)
			.join("\n");
		tsv.value = lines;
		savedTsv.value = lines;
	},
);

function parseTsv(raw: string): CastInput[] {
	return raw.split("\n").flatMap((l) => {
		const trimmed = l.trim();
		if (!trimmed) return [];
		const [actor = "", character = ""] = trimmed.split("\t");
		const actorTrimmed = actor.trim();
		return actorTrimmed
			? [{ actor_name: actorTrimmed, character_name: character.trim() }]
			: [];
	});
}

async function onSave() {
	if (props.selectedTitleId === null || !dirty.value) return;
	saving.value = true;
	try {
		await replaceCast(props.selectedTitleId, parseTsv(tsv.value));
		savedTsv.value = tsv.value;
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
					:disabled="!dirty || saving"
					@click="onSave"
				>
					<Save :size="13" :stroke-width="2.5" />
					保存
				</button>
			</div>
			<textarea
				class="cast-textarea"
				v-model="tsv"
				placeholder="声優名&#9;役名"
				spellcheck="false"
			/>
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
	gap: 0.75em;
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

.cast-textarea {
	background: var(--glass-bg-strong);
	border: 1px solid var(--glass-border);
	border-radius: 8px;
	flex: 1;
	font-family: monospace;
	font-size: 13px;
	line-height: 1.7;
	min-height: 0;
	padding: 0.5em 0.75em;
	resize: none;
	transition:
		border-color 0.15s,
		box-shadow 0.15s;
	width: 100%;
}

.cast-textarea:focus {
	border-color: var(--focus-ring);
	box-shadow: 0 0 0 3px var(--focus-glow);
	outline: none;
}

.cast-placeholder {
	color: var(--text-subtle);
	font-size: 0.85em;
	margin: 0;
}
</style>
