import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const addHistoryMock = vi.hoisted(() => vi.fn());
const updateHistoryMock = vi.hoisted(() => vi.fn());
const deleteHistoryMock = vi.hoisted(() => vi.fn());
const persistOrderMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());

vi.mock("../../composables/useTitles", async () => {
	const { ref } = await import("vue");
	const titles = ref([
		{ id: 1, title: "One Piece", year: 1999 },
		{ id: 2, title: "Naruto", year: 2002 },
	]);

	return {
		useTitles: () => ({
			titles,
		}),
	};
});

vi.mock("../../composables/useHistory", async () => {
	const { ref } = await import("vue");
	const history = ref([
		{
			id: 1,
			title_id: 1,
			title: "One Piece",
			display_name: null,
			year: 2020,
			sort_order: 0,
		},
		{
			id: 2,
			title_id: 1,
			title: "One Piece",
			display_name: null,
			year: 2023,
			sort_order: 1,
		},
		{
			id: 3,
			title_id: 2,
			title: "Naruto",
			display_name: null,
			year: 2021,
			sort_order: 2,
		},
	]);

	return {
		useHistory: () => ({
			history,
			addHistory: addHistoryMock,
			updateHistory: updateHistoryMock,
			deleteHistory: deleteHistoryMock,
			persistOrder: persistOrderMock,
		}),
	};
});

vi.mock("../../composables/useConfirm", () => ({
	useConfirm: () => ({
		confirm: confirmMock,
	}),
}));

import HistoryManager from "./HistoryManager.vue";

const DraggableStub = {
	props: ["modelValue"],
	template:
		'<ul class="draggable-stub"><slot v-for="entry in modelValue" name="item" :element="entry" /></ul>',
};

describe("HistoryManager", () => {
	beforeEach(() => {
		addHistoryMock.mockReset();
		addHistoryMock.mockResolvedValue(undefined);
		updateHistoryMock.mockReset();
		deleteHistoryMock.mockReset();
		persistOrderMock.mockReset();
		confirmMock.mockReset();
	});

	it("renders draggable list when filter is empty", () => {
		const wrapper = mount(HistoryManager, {
			global: {
				stubs: { draggable: DraggableStub, HistoryItem: true },
			},
		});

		expect(wrapper.find(".draggable-stub").exists()).toBe(true);
		expect(
			wrapper.find("ul:not(.draggable-stub):not(.title-suggest)").exists(),
		).toBe(false);
	});

	it("switches to plain list and hides drag handles when filter is active", async () => {
		const wrapper = mount(HistoryManager, {
			global: {
				stubs: {
					draggable: DraggableStub,
					HistoryItem: {
						props: ["entry", "draggable"],
						template: `<li><span v-if="draggable" class="drag-handle" /><span class="title">{{ entry.title }}</span></li>`,
					},
				},
			},
		});

		await wrapper.get('input[placeholder="フィルター"]').setValue("One");

		expect(wrapper.find(".draggable-stub").exists()).toBe(false);
		expect(wrapper.find(".drag-handle").exists()).toBe(false);
		expect(wrapper.findAll("li")).toHaveLength(2);
	});

	it("sets filter when filter-by-title event is received", async () => {
		const wrapper = mount(HistoryManager, {
			global: {
				stubs: {
					draggable: DraggableStub,
					HistoryItem: {
						props: ["entry", "draggable"],
						emits: ["filter-by-title"],
						template: `<li @click="$emit('filter-by-title', entry.title)">{{ entry.title }}</li>`,
					},
				},
			},
		});

		const filterInput = wrapper.get<HTMLInputElement>(
			'input[placeholder="フィルター"]',
		);
		expect(filterInput.element.value).toBe("");

		await wrapper.findAll("li")[0].trigger("click");
		await flushPromises();

		expect(filterInput.element.value).toBe("One Piece");
	});

	it("submits the selected title from suggestions", async () => {
		const wrapper = mount(HistoryManager, {
			global: {
				stubs: {
					draggable: DraggableStub,
					HistoryItem: true,
				},
			},
		});

		const searchInput = wrapper.get('input[placeholder="タイトルを検索"]');
		await searchInput.trigger("focus");
		await searchInput.setValue("One");
		await wrapper.get(".title-suggest li").trigger("mousedown");
		await wrapper.get('input[placeholder="年"]').setValue("2024");
		await wrapper.get("form").trigger("submit");
		await flushPromises();

		expect(addHistoryMock).toHaveBeenCalledWith({
			title_id: 1,
			display_name: undefined,
			year: 2024,
		});
	});
});
