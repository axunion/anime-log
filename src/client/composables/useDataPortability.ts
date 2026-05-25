import { type Ref, ref } from "vue";
import { get, post } from "../lib/api";
import { useConfirm } from "./useConfirm";
import { useHistory } from "./useHistory";
import { useTitles } from "./useTitles";

// Module-level singleton state — all callers share the same modal and import flow.
const importModalOpen = ref(false);
const dataFile = ref<File | null>(null);
const historyFile = ref<File | null>(null);
const importError = ref("");
const importing = ref(false);

export function useDataPortability() {
	const { confirm } = useConfirm();
	const { fetchTitles } = useTitles();
	const { fetchHistory } = useHistory();

	function downloadBlob(data: unknown, filename: string) {
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function exportData() {
		const [data, historyData] = await Promise.all([
			get("/export/data"),
			get("/export/history"),
		]);
		downloadBlob(data, "data.json");
		downloadBlob(historyData, "history.json");
	}

	function openImportModal() {
		dataFile.value = null;
		historyFile.value = null;
		importError.value = "";
		importModalOpen.value = true;
	}

	function makeFileHandler(target: Ref<File | null>) {
		return (e: Event) => {
			target.value = (e.target as HTMLInputElement).files?.[0] ?? null;
		};
	}

	const onDataFileChange = makeFileHandler(dataFile);
	const onHistoryFileChange = makeFileHandler(historyFile);

	async function readJson(file: File): Promise<unknown> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				try {
					resolve(JSON.parse(reader.result as string));
				} catch {
					reject(new Error(`${file.name} は有効な JSON ではありません`));
				}
			};
			reader.onerror = () =>
				reject(new Error(`${file.name} の読み込みに失敗しました`));
			reader.readAsText(file);
		});
	}

	async function onImport() {
		if (!dataFile.value || !historyFile.value) {
			importError.value = "両方のファイルを選択してください";
			return;
		}

		importError.value = "";

		const ok = await confirm({
			message: "既存のデータを全て削除して置き換えます。続行しますか?",
			danger: true,
		});
		if (!ok) return;

		importing.value = true;
		try {
			const [dataPayload, historyPayload] = await Promise.all([
				readJson(dataFile.value),
				readJson(historyFile.value),
			]);
			// NOTE: These are two separate destructive operations. If the second fails,
			// titles/cast will already be replaced. Re-import both files to recover.
			try {
				await post("/import/data?confirm=replace-all", dataPayload);
			} catch (err) {
				throw new Error(
					`タイトル・キャストのインポートに失敗しました: ${err instanceof Error ? err.message : "不明なエラー"}`,
				);
			}
			try {
				await post("/import/history?confirm=replace-all", historyPayload);
			} catch (err) {
				throw new Error(
					`タイトルはインポート済みですが履歴のインポートに失敗しました。再度両ファイルをインポートしてください: ${err instanceof Error ? err.message : "不明なエラー"}`,
				);
			}
			importModalOpen.value = false;
			await Promise.all([fetchTitles(), fetchHistory()]);
		} catch (err) {
			importError.value =
				err instanceof Error ? err.message : "インポートに失敗しました";
		} finally {
			importing.value = false;
		}
	}

	return {
		importModalOpen,
		dataFile,
		historyFile,
		importError,
		importing,
		exportData,
		openImportModal,
		onDataFileChange,
		onHistoryFileChange,
		onImport,
	};
}
