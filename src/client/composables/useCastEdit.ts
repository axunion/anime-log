import type { CastInput } from "@shared/types";
import { del, patch, post, put } from "../lib/api";

export function useCastEdit() {
	async function addCast(
		titleId: number,
		payload: CastInput,
	): Promise<{ id: number }> {
		return post<{ id: number }>(`/titles/${titleId}/cast`, payload);
	}

	async function updateCast(
		castId: number,
		payload: Partial<CastInput>,
	): Promise<void> {
		await patch(`/cast/${castId}`, payload);
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

	return { addCast, updateCast, deleteCast, replaceCast };
}
