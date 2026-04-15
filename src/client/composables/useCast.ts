import { ref } from "vue";
import { del, get, post, put } from "../lib/api";
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
	};
}
