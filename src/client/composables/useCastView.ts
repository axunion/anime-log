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
    try {
      const detail = await get<TitleDetail>(`/titles/${titleId}`);
      if (token === castToken.current()) {
        selectedDetail.value = detail;
      }
    } catch {
      // On failure, clear stale detail if this token is still current to avoid
      // showing a mismatched cast panel (mirrors the loadVoice error handling).
      if (token === castToken.current()) {
        selectedDetail.value = null;
      }
    }
  }

  async function loadVoice(actorName: string) {
    const token = voiceToken.next();
    try {
      const results = await get<VoiceResult[]>(
        `/cast?actor=${encodeURIComponent(actorName)}`,
      );
      // Update name and results atomically inside the race guard.
      // This prevents a stale heading when the fetch fails or is superseded.
      if (token === voiceToken.current()) {
        selectedActorName.value = actorName;
        voiceResults.value = results;
      }
    } catch {
      // Discard silently — if this token is still current the panel stays blank,
      // which is preferable to showing a mismatched heading with stale results.
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
