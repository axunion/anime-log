import type { TitleDetail, VoiceResult } from "@shared/types";
import { ref } from "vue";
import { get } from "../lib/api";
import { createRaceToken } from "../lib/raceToken";

const selectedDetail = ref<TitleDetail | null>(null);
const voiceResults = ref<VoiceResult[]>([]);
const selectedActorName = ref<string | null>(null);

const castToken = createRaceToken();
const voiceToken = createRaceToken();

export function useCastView() {
	async function loadCast(titleId: number) {
		const token = castToken.next();
		const detail = await get<TitleDetail>(`/titles/${titleId}`);
		if (token === castToken.current()) {
			selectedDetail.value = detail;
		}
	}

	async function loadVoice(actorName: string) {
		const token = voiceToken.next();
		selectedActorName.value = actorName;
		const results = await get<VoiceResult[]>(
			`/cast?actor=${encodeURIComponent(actorName)}`,
		);
		if (token === voiceToken.current()) {
			voiceResults.value = results;
		}
	}

	function clearCast() {
		castToken.invalidate();
		selectedDetail.value = null;
	}

	function clearVoice() {
		voiceToken.invalidate();
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
