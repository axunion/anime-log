import { del, get, post, put } from "../lib/api";
import type {
	CastMember,
	HistoryEntry,
	Title,
	TitleDetail,
} from "../lib/types";

// --- token ---
document.getElementById("btn-token")!.addEventListener("click", () => {
	const token = prompt("API Token:", localStorage.getItem("api_token") ?? "");
	if (token !== null) localStorage.setItem("api_token", token);
});

// --- state ---
let allTitles: Title[] = [];
let selectedTitleId: number | null = null;
let historyList: HistoryEntry[] = [];

// --- title search ---
const inputTitleSearch = document.getElementById(
	"input-title-search",
) as HTMLInputElement;
const listTitleSearch = document.getElementById("list-title-search")!;
const castEditorTitle = document.getElementById("cast-editor-title")!;
const castRows = document.getElementById("cast-rows")!;

function buildHistorySelect(titles: Title[]) {
	const select = document.querySelector<HTMLSelectElement>(
		"#select-history-title",
	)!;
	select.innerHTML = "";
	titles.forEach((t) => {
		const opt = document.createElement("option");
		opt.value = String(t.id);
		opt.textContent = `${t.title} (${t.year})`;
		select.appendChild(opt);
	});
}

async function loadTitles() {
	allTitles = await get<Title[]>("/titles");
	buildHistorySelect(allTitles);
}

function renderTitleSearchResults(titles: Title[]) {
	listTitleSearch.innerHTML = "";
	titles.slice(0, 30).forEach((t) => {
		const li = document.createElement("li");
		const spanTitle = document.createElement("span");
		spanTitle.className = "item-title";
		spanTitle.textContent = t.title;
		const spanYear = document.createElement("span");
		spanYear.className = "item-year";
		spanYear.textContent = String(t.year);
		li.append(spanTitle, spanYear);
		li.dataset.id = String(t.id);
		li.addEventListener("click", () => selectTitle(t.id, t.title));
		listTitleSearch.appendChild(li);
	});
}

inputTitleSearch.addEventListener("input", () => {
	const q = inputTitleSearch.value.trim();
	if (!q) {
		listTitleSearch.innerHTML = "";
		return;
	}
	const re = new RegExp(q.split(/\s+/).join(".+"), "i");
	renderTitleSearchResults(allTitles.filter((t) => re.test(t.title)));
});

// --- title add ---
document
	.getElementById("form-title-add")!
	.addEventListener("submit", async (e) => {
		e.preventDefault();
		const nameInput = document.getElementById(
			"input-title-name",
		) as HTMLInputElement;
		const yearInput = document.getElementById(
			"input-title-year",
		) as HTMLInputElement;
		await post("/titles", {
			title: nameInput.value,
			year: Number(yearInput.value),
		});
		nameInput.value = "";
		yearInput.value = "";
		allTitles = await get<Title[]>("/titles");
		buildHistorySelect(allTitles);
	});

// --- cast editor ---
async function selectTitle(id: number, title: string) {
	selectedTitleId = id;
	castEditorTitle.textContent = title;

	document.querySelectorAll("#list-title-search li").forEach((li) => {
		li.classList.toggle(
			"selected",
			(li as HTMLElement).dataset.id === String(id),
		);
	});

	const detail = await get<TitleDetail>(`/titles/${id}`);
	renderCastRows(detail.cast);
}

function renderCastRows(cast: CastMember[]) {
	castRows.innerHTML = "";
	for (const m of cast) addCastRow(m.actor_name, m.character_name);
}

function addCastRow(actorName = "", characterName = "") {
	const row = document.createElement("div");
	row.className = "cast-row";

	const actorInput = document.createElement("input");
	actorInput.type = "text";
	actorInput.className = "actor-input";
	actorInput.placeholder = "声優名";
	actorInput.value = actorName;

	const charInput = document.createElement("input");
	charInput.type = "text";
	charInput.className = "char-input";
	charInput.placeholder = "役名";
	charInput.value = characterName;

	const removeBtn = document.createElement("button");
	removeBtn.className = "btn-remove-row";
	removeBtn.type = "button";
	removeBtn.textContent = "×";
	removeBtn.addEventListener("click", () => row.remove());

	row.append(actorInput, charInput, removeBtn);
	castRows.appendChild(row);
}

document
	.getElementById("btn-cast-add-row")!
	.addEventListener("click", () => addCastRow());

document
	.getElementById("btn-cast-save")!
	.addEventListener("click", async () => {
		if (selectedTitleId === null) return;

		const cast = Array.from(castRows.querySelectorAll(".cast-row"))
			.map((row) => ({
				actor_name: (row.querySelector(".actor-input") as HTMLInputElement)
					.value,
				character_name: (row.querySelector(".char-input") as HTMLInputElement)
					.value,
			}))
			.filter((m) => m.actor_name);

		// Delete all existing cast then re-insert sequentially (parallel would collide on sort_order)
		const detail = await get<TitleDetail>(`/titles/${selectedTitleId}`);
		await Promise.all(detail.cast.map((m) => del(`/cast/${m.id}`)));
		for (const m of cast) {
			await post(`/titles/${selectedTitleId}/cast`, m);
		}
		alert("保存しました");
	});

// --- history ---
async function loadHistory() {
	historyList = await get<HistoryEntry[]>("/history");
	renderHistoryList();
}

function renderHistoryList() {
	const ul = document.getElementById("list-history")!;
	ul.innerHTML = "";

	historyList.forEach((h, i) => {
		const li = document.createElement("li");
		const name = h.display_name ?? h.title;
		li.innerHTML = `
      <button class="btn-up" type="button">▲</button>
      <button class="btn-down" type="button">▼</button>
      <span class="item-title"></span>
      <span class="item-year"></span>
      <button class="btn-delete" type="button">×</button>
    `;
		li.querySelector(".item-title")!.textContent = name;
		li.querySelector(".item-year")!.textContent = String(h.year);

		li.querySelector(".btn-up")!.addEventListener("click", async () => {
			if (i === 0) return;
			[historyList[i - 1], historyList[i]] = [
				historyList[i],
				historyList[i - 1],
			];
			await put("/history/reorder", { ids: historyList.map((x) => x.id) });
			renderHistoryList();
		});

		li.querySelector(".btn-down")!.addEventListener("click", async () => {
			if (i === historyList.length - 1) return;
			[historyList[i], historyList[i + 1]] = [
				historyList[i + 1],
				historyList[i],
			];
			await put("/history/reorder", { ids: historyList.map((x) => x.id) });
			renderHistoryList();
		});

		li.querySelector(".btn-delete")!.addEventListener("click", async () => {
			if (!confirm(`「${name}」を削除しますか？`)) return;
			await del(`/history/${h.id}`);
			await loadHistory();
		});

		ul.appendChild(li);
	});
}

document
	.getElementById("form-history-add")!
	.addEventListener("submit", async (e) => {
		e.preventDefault();
		const select = document.querySelector<HTMLSelectElement>(
			"#select-history-title",
		)!;
		const nameInput = document.querySelector<HTMLInputElement>(
			"#input-history-name",
		)!;
		const yearInput = document.querySelector<HTMLInputElement>(
			"#input-history-year",
		)!;

		if (!select.value) return;

		await post("/history", {
			title_id: Number(select.value),
			display_name: nameInput.value || undefined,
			year: Number(yearInput.value),
		});

		nameInput.value = "";
		yearInput.value = "";
		select.value = "";
		await loadHistory();
	});

// --- bootstrap ---
async function init() {
	await Promise.all([loadTitles(), loadHistory()]);
}

init();
