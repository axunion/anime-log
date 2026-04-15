<script setup lang="ts">
import { Mic2, Plus } from "lucide-vue-next";
import { ref, watch } from "vue";
import { useCast } from "../../composables/useCast";
import CastEditorRow from "./CastEditorRow.vue";

const props = defineProps<{
	selectedTitleId: number | null;
	selectedTitleName: string;
}>();

type CastRow = { id: number; actor_name: string; character_name: string };

const { selectedDetail, loadCast, addCast, updateCast, deleteCast } = useCast();
const castRows = ref<CastRow[]>([]);

const newActorName = ref("");
const newCharacterName = ref("");

watch(
	() => props.selectedTitleId,
	async (id) => {
		if (id === null) {
			castRows.value = [];
			return;
		}
		await loadCast(id);
		castRows.value = (selectedDetail.value?.cast ?? []).map((m) => ({
			id: m.id,
			actor_name: m.actor_name,
			character_name: m.character_name,
		}));
	},
);

async function onAdd() {
	if (props.selectedTitleId === null) return;
	const actor = newActorName.value.trim();
	if (!actor) return;
	const character = newCharacterName.value.trim();
	const result = await addCast(props.selectedTitleId, {
		actor_name: actor,
		character_name: character,
	});
	castRows.value.push({
		id: result.id,
		actor_name: actor,
		character_name: character,
	});
	newActorName.value = "";
	newCharacterName.value = "";
}

async function onCommit(index: number) {
	const row = castRows.value[index];
	await updateCast(row.id, {
		actor_name: row.actor_name,
		character_name: row.character_name,
	});
}

async function onRemove(index: number) {
	const row = castRows.value[index];
	await deleteCast(row.id);
	castRows.value.splice(index, 1);
}
</script>

<template>
	<section class="admin-section">
		<h2 class="admin-section-title">
			<Mic2 :size="14" :stroke-width="2" />
			キャスト編集
		</h2>

		<template v-if="selectedTitleName">
			<form class="admin-form" @submit.prevent="onAdd">
				<input
					class="admin-form-input"
					v-model="newActorName"
					type="text"
					placeholder="声優名"
				/>
				<input
					class="admin-form-input"
					v-model="newCharacterName"
					type="text"
					placeholder="役名"
				/>
				<button class="admin-form-button" type="submit">
					<Plus :size="13" :stroke-width="2.5" />
					追加
				</button>
			</form>
			<p class="selected-title">{{ selectedTitleName }}</p>
			<div class="cast-rows">
				<CastEditorRow
					v-for="(row, i) in castRows"
					:key="row.id"
					:actor-name="row.actor_name"
					:character-name="row.character_name"
					@update:actor-name="row.actor_name = $event"
					@update:character-name="row.character_name = $event"
					@commit="onCommit(i)"
					@remove="onRemove(i)"
				/>
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

.selected-title {
	color: var(--text-muted);
	flex-shrink: 0;
	font-size: 0.85em;
	margin-bottom: 0.75em;
}
</style>
