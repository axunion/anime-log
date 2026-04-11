export type Title = { id: number; title: string; year: number };
export type CastMember = {
	id: number;
	actor_name: string;
	character_name: string;
};
export type TitleDetail = Title & { cast: CastMember[] };
export type HistoryEntry = {
	id: number;
	title_id: number;
	title: string;
	display_name: string | null;
	year: number;
	sort_order: number;
};
export type VoiceResult = { title: string; character_name: string };
export type Tab = "history" | "year";
