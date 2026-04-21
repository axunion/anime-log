import { ref } from "vue";

export type ConfirmOptions = {
	message: string;
	title?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
};

const state = ref<ConfirmOptions | null>(null);
let resolver: ((ok: boolean) => void) | null = null;

export function useConfirm() {
	function confirm(opts: ConfirmOptions): Promise<boolean> {
		state.value = opts;
		return new Promise((resolve) => {
			resolver = resolve;
		});
	}

	function resolve(ok: boolean) {
		state.value = null;
		resolver?.(ok);
		resolver = null;
	}

	return { state, confirm, resolve };
}
