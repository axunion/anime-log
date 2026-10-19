<script setup lang="ts">
import { Plus } from "@lucide/vue";
import type { CastInput } from "@shared/types";
import { computed, ref } from "vue";
import Modal from "../../components/AppModal.vue";
import { useTitles } from "../../composables/useTitles";

defineProps<{ open: boolean }>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  added: [id: number, title: string];
}>();

const { addTitle } = useTitles();

const title = ref("");
const year = ref("");
const castText = ref("");
const saving = ref(false);
const submitError = ref("");

// Both fields are required by the server, so lines missing either are
// reported instead of being sent (which would reject the whole title).
const parsedCast = computed(() => {
  const cast: CastInput[] = [];
  const invalidLines: number[] = [];
  castText.value.split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    const [actor = "", character = ""] = line.split("\t");
    if (actor.trim() && character.trim()) {
      cast.push({ actor_name: actor.trim(), character_name: character.trim() });
    } else {
      invalidLines.push(i + 1);
    }
  });
  return { cast, invalidLines };
});

const canSubmit = computed(
  () =>
    !saving.value &&
    !!title.value.trim() &&
    !!Number(year.value) &&
    parsedCast.value.invalidLines.length === 0,
);

function reset() {
  title.value = "";
  year.value = "";
  castText.value = "";
  submitError.value = "";
}

function onCancel() {
  emit("update:open", false);
  reset();
}

async function onSubmit() {
  if (!canSubmit.value) return;
  const name = title.value.trim();
  submitError.value = "";
  saving.value = true;
  let id: number;
  try {
    id = await addTitle(name, Number(year.value), parsedCast.value.cast);
  } catch (err) {
    // The App.vue banner sits behind the overlay, so show the error here too.
    submitError.value = err instanceof Error ? err.message : String(err);
    return;
  } finally {
    saving.value = false;
  }
  emit("update:open", false);
  reset();
  emit("added", id, name);
}
</script>

<template>
	<Modal :open="open" @update:open="emit('update:open', $event)" title="タイトルを追加" size="md" :close-on-overlay="false" @close="reset">
		<form id="title-add-form" @submit.prevent="onSubmit">
			<div class="admin-form">
				<input class="admin-form-input" v-model="title" type="text" placeholder="タイトル名" />
				<input class="admin-form-input admin-form-input--narrow" v-model="year" type="text" inputmode="numeric" maxlength="4" placeholder="年" />
			</div>
			<textarea
				class="admin-form-textarea"
				v-model="castText"
				placeholder="声優名&#9;役名（1行1件、タブ区切り）"
				spellcheck="false"
			/>
			<p v-if="parsedCast.invalidLines.length" class="form-message">
				{{ parsedCast.invalidLines.join(", ") }}行目: 声優名と役名をタブ区切りで入力してください
			</p>
			<p v-if="submitError" class="form-message" role="alert">{{ submitError }}</p>
		</form>
		<template #footer>
			<button class="btn btn--ghost" type="button" @click="onCancel">キャンセル</button>
			<button class="btn btn--primary" type="submit" form="title-add-form" :disabled="!canSubmit">
				<Plus :size="13" :stroke-width="2.5" />
				追加
			</button>
		</template>
	</Modal>
</template>

<style scoped>
@import "../styles/admin-shared.css";

.form-message {
	color: var(--danger-color);
	font-size: 12px;
	margin: 0.5em 0 0;
}
</style>
