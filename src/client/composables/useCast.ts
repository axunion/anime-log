import { ref } from "vue";
import { get } from "../lib/api";
import type { TitleDetail, VoiceResult } from "../lib/types";

const selectedDetail = ref<TitleDetail | null>(null);
const voiceResults = ref<VoiceResult[]>([]);
const selectedActorName = ref<string | null>(null);

export function useCast() {
	async function loadCast(titleId: number) {
		selectedDetail.value = await get<TitleDetail>(`/titles/${titleId}`);
	}

	async function loadVoice(actorName: string) {
		selectedActorName.value = actorName;
		voiceResults.value = await get<VoiceResult[]>(
			`/cast?actor=${encodeURIComponent(actorName)}`,
		);
	}

	function clearCast() {
		selectedDetail.value = null;
	}

	function clearVoice() {
		selectedActorName.value = null;
		voiceResults.value = [];
	}

	return {
		selectedDetail,
		voiceResults,
		selectedActorName,
		loadCast,
		loadVoice,
		clearCast,
		clearVoice,
	};
}
