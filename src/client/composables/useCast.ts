import { useCastEdit } from "./useCastEdit";
import { useCastView } from "./useCastView";

export function useCast() {
	return { ...useCastView(), ...useCastEdit() };
}
