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
	const history = ref([]);

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
