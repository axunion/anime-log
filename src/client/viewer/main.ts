import { get } from "../lib/api";
import type {
	HistoryEntry,
	Title,
	TitleDetail,
	VoiceResult,
} from "../lib/types";

const _ = (s: string, e?: Element | null): Element | null =>
	(e instanceof Element ? e : document).querySelector(s);
const __ = (s: string, e?: Element | null): NodeListOf<Element> =>
	(e instanceof Element ? e : document).querySelectorAll(s);

function removeClassAll(className: string, context?: Element | null): void {
	const el = context instanceof Element ? context : document.documentElement;
	const targets = el.getElementsByClassName(className);
	while (targets[0]) targets[0].classList.remove(className);
}

function removeChildAll(target: Element): void {
	while (target.firstChild) target.removeChild(target.firstChild);
}

const page = {
	titles: [] as Title[],
	history: [] as HistoryEntry[],

	_viewport: null as Element | null,
	_frameTitle: null as Element | null,
	_titleNav: null as Element | null,
	_historyBlock: null as Element | null,
	_historyList: null as Element | null,
	_yearBlock: null as Element | null,
	_yearList: null as Element | null,
	_nameBlock: null as Element | null,
	_nameList: null as Element | null,
	_filterInputs: null as NodeListOf<Element> | null,
	_titleListItemTemplate: null as HTMLTemplateElement | null,

	_frameCast: null as Element | null,
	_castBlock: null as Element | null,
	_castBlockHead: null as Element | null,
	_castClose: null as Element | null,
	_castTable: null as Element | null,
	_castTableRecordTemplate: null as HTMLTemplateElement | null,

	_frameVoice: null as Element | null,
	_voiceBlock: null as Element | null,
	_voiceBoxHead: null as Element | null,
	_voiceClose: null as Element | null,
	_voiceList: null as Element | null,
	_voiceListItemTemplate: null as HTMLTemplateElement | null,

	getElements() {
		this._viewport = _("#viewport");
		this._frameTitle = _("#frame-title");
		this._titleNav = _(".nav", this._frameTitle);
		this._historyBlock = _("#history");
		this._historyList = _(".title-list", this._historyBlock);
		this._yearBlock = _("#year");
		this._yearList = _(".title-list", this._yearBlock);
		this._nameBlock = _("#name");
		this._nameList = _(".title-list", this._nameBlock);
		this._filterInputs = __(".filter input");
		this._titleListItemTemplate = _(
			"#title-list-item-template",
		) as HTMLTemplateElement | null;

		this._frameCast = _("#frame-cast");
		this._castBlock = _(".block", this._frameCast);
		this._castBlockHead = _(".h", this._castBlock);
		this._castClose = _(".close", this._castBlock);
		this._castTable = _(".cast-table", this._castBlock);
		this._castTableRecordTemplate = _(
			"#cast-table-record-template",
		) as HTMLTemplateElement | null;

		this._frameVoice = _("#frame-voice");
		this._voiceBlock = _(".block", this._frameVoice);
		this._voiceBoxHead = _(".h", this._voiceBlock);
		this._voiceClose = _(".close", this._voiceBlock);
		this._voiceList = _(".voice-list", this._voiceBlock);
		this._voiceListItemTemplate = _(
			"#voice-list-item-template",
		) as HTMLTemplateElement | null;
	},

	appendTitleList(ul: Element, data: (Title | HistoryEntry)[]) {
		const tmpl = this._titleListItemTemplate!;
		const df = document.createDocumentFragment();
		const content = document.importNode(tmpl.content, true);
		const li = content.querySelector("li") as HTMLElement;

		for (const item of data) {
			const displayName =
				"display_name" in item ? (item.display_name ?? item.title) : item.title;
			const titleId = "title_id" in item ? item.title_id : item.id;

			li.dataset.id = String(titleId);
			li.title = displayName;
			li.querySelector(".name")!.textContent = displayName;
			li.querySelector(".year")!.textContent = String(item.year);

			df.appendChild(document.importNode(li, true));
		}

		ul.appendChild(df);
	},

	clearFilters() {
		this._filterInputs!.forEach((input) => {
			(input as HTMLInputElement).value = "";
		});
	},

	setFiltersPosition(target: Element) {
		(target as HTMLElement).scrollTop = (
			_(".filter", target) as HTMLElement
		).clientHeight;
	},

	setGoogWkpd(target: Element | null, text: string) {
		if (!target) return;
		const goog = _(".goog", target) as HTMLAnchorElement | null;
		const wkpd = _(".wkpd", target) as HTMLAnchorElement | null;
		const encoded = encodeURIComponent(text);
		if (goog) {
			goog.textContent = text;
			goog.href = `https://www.google.com/search?q=${encoded}`;
		}
		if (wkpd) {
			wkpd.href = `https://ja.wikipedia.org/w/index.php?search=${encoded}`;
		}
	},

	async appendCastTable(titleId: number) {
		const detail = await get<TitleDetail>(`/titles/${titleId}`);
		const tmpl = this._castTableRecordTemplate!;
		const df = document.createDocumentFragment();
		const content = document.importNode(tmpl.content, true);
		const tr = content.querySelector("tr")!;

		const nameSp = tr.querySelector(".name") as HTMLElement;
		const partSp = tr.querySelector(".part") as HTMLElement;

		for (const member of detail.cast) {
			nameSp.textContent = member.actor_name;
			nameSp.title = member.actor_name;
			partSp.innerHTML = member.character_name.split(", ").join("<br>");

			df.appendChild(document.importNode(tr, true));
		}

		this._castTable!.appendChild(df);

		this.setGoogWkpd(this._castBlockHead, detail.title);
	},

	async appendVoiceList(actorName: string) {
		const results = await get<VoiceResult[]>(
			`/cast?actor=${encodeURIComponent(actorName)}`,
		);
		const tmpl = this._voiceListItemTemplate!;
		const df = document.createDocumentFragment();
		const content = document.importNode(tmpl.content, true);
		const dt = content.querySelector("dt")!;
		const dd = content.querySelector("dd")!;

		const dtTitle = dt.querySelector(".title")!;
		const ddPart = dd.querySelector(".part") as HTMLElement;

		for (const item of results) {
			dtTitle.textContent = item.title;
			ddPart.innerHTML = item.character_name.split(", ").join("<br>");

			df.appendChild(document.importNode(dt, true));
			df.appendChild(document.importNode(dd, true));
		}

		this._voiceList!.appendChild(df);
	},

	async init() {
		this.getElements();

		const [titles, history] = await Promise.all([
			get<Title[]>("/titles"),
			get<HistoryEntry[]>("/history"),
		]);

		this.titles = titles;
		this.history = history;

		this.appendTitleList(this._historyList!, history);

		const byTitle = [...titles].sort((a, b) => a.title.localeCompare(b.title));
		this.appendTitleList(this._nameList!, byTitle);

		const byYear = [...titles].sort((a, b) => b.year - a.year);
		this.appendTitleList(this._yearList!, byYear);

		this.clearFilters();

		// Activate default tab (History)
		const firstLink = _(
			'[href="#history"]',
			this._titleNav,
		) as HTMLElement | null;
		firstLink?.dispatchEvent(new Event("click", { bubbles: true }));
	},
};

// --- init ---
page.init();

// --- frame-title: tab switch ---
document.querySelector(".nav")!.addEventListener("click", (e) => {
	const target = e.target as HTMLElement;
	if (target.tagName.toLowerCase() !== "a") return;
	e.preventDefault();

	const href = target.getAttribute("href")!;
	const targetBlock = _(href) as HTMLElement | null;

	removeClassAll("active", _("#frame-title") as Element);
	target.classList.add("active");
	targetBlock?.classList.add("active");
	if (targetBlock) page.setFiltersPosition(targetBlock);
});

// --- frame-title: filter ---
document.querySelectorAll(".filter input").forEach((input) => {
	input.addEventListener("keyup", function (this: HTMLInputElement) {
		const list = this.closest(".block")?.querySelector(".title-list");
		if (!list) return;
		const str = this.value.trim();
		const re = new RegExp(str.split(/\s+/).join(".+"), "i");

		if (!str) {
			removeClassAll("hide", list);
		} else {
			list.querySelectorAll("li").forEach((li) => {
				li.classList.toggle("hide", !re.test(li.textContent ?? ""));
			});
		}
	});
});

// --- frame-title: title click ---
document.querySelectorAll(".title-list").forEach((ul) => {
	ul.addEventListener("click", async (e) => {
		const target = e.target as HTMLElement;
		const li = target.closest("li") as HTMLElement | null;
		if (!li) return;

		const className = "selected-title";
		if (li.classList.contains(className)) {
			removeClassAll(className);
			return;
		}

		const titleId = Number(li.dataset.id);
		removeClassAll(className, ul);
		removeChildAll(page._castTable!);
		li.classList.add(className);
		page._frameCast!.classList.add(className);
		(page._castBlock as HTMLElement).scrollTop = 0;

		await page.appendCastTable(titleId);
	});
});

// --- frame-cast: close ---
page._castClose!.addEventListener("click", () => {
	removeClassAll("selected-title");
});

// --- frame-cast: voice actor click ---
page._castTable!.addEventListener("click", async (e) => {
	const target = e.target as HTMLElement;
	if (!target.classList.contains("name")) return;

	const actorName = target.textContent ?? "";
	page.setGoogWkpd(page._voiceBoxHead, actorName);
	removeChildAll(page._voiceList!);
	page._frameVoice!.classList.add("selected-name");
	(page._voiceBlock as HTMLElement).scrollTop = 0;

	await page.appendVoiceList(actorName);
});

// --- frame-voice: close ---
page._voiceClose!.addEventListener("click", () => {
	removeClassAll("selected-name");
});

// --- frame-voice: title click (toggle part) ---
page._voiceList!.addEventListener("click", (e) => {
	const target = e.target as HTMLElement;
	if (target.classList.contains("title")) {
		const dd = target.closest("dt")?.nextElementSibling;
		dd?.classList.toggle("show");
	}
});
