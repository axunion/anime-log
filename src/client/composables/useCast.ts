import { ref } from "vue";
import { del, get, post, put } from "../lib/api";
import type { CastInput, TitleDetail, VoiceResult } from "../lib/types";

const selectedDetail = ref<TitleDetail | null>(null);
const voiceResults = ref<VoiceResult[]>([]);
const selectedActorName = ref<string | null>(null);
let castRequestToken = 0;
let voiceRequestToken = 0;

export function useCast() {
	async function loadCast(titleId: number) {
		const token = ++castRequestToken;
		const detail = await get<TitleDetail>(`/titles/${titleId}`);
		if (token === castRequestToken) {
			selectedDetail.value = detail;
		}
	}

	async function loadVoice(actorName: string) {
		const token = ++voiceRequestToken;
		selectedActorName.value = actorName;
		const results = await get<VoiceResult[]>(
			`/cast?actor=${encodeURIComponent(actorName)}`,
		);
		if (token === voiceRequestToken) {
			voiceResults.value = results;
		}
	}

	function clearCast() {
		castRequestToken++;
		selectedDetail.value = null;
	}

	function clearVoice() {
		voiceRequestToken++;
		selectedActorName.value = null;
		voiceResults.value = [];
	}

	async function addCast(
		titleId: number,
		payload: { actor_name: string; character_name: string },
	): Promise<{ id: number }> {
		return post<{ id: number }>(`/titles/${titleId}/cast`, payload);
	}

	async function updateCast(
		castId: number,
		payload: Partial<{ actor_name: string; character_name: string }>,
	): Promise<void> {
		await put(`/cast/${castId}`, payload);
	}

	async function deleteCast(castId: number): Promise<void> {
		await del(`/cast/${castId}`);
	}

	async function replaceCast(
		titleId: number,
		cast: CastInput[],
	): Promise<void> {
		await put(`/titles/${titleId}/cast`, { cast });
	}

	return {
		selectedDetail,
		voiceResults,
		selectedActorName,
		loadCast,
		loadVoice,
		clearCast,
		clearVoice,
		addCast,
		updateCast,
		deleteCast,
		replaceCast,
	};
}
