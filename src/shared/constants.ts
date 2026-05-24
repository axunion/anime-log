export const TABS = ["history", "year"] as const;
export const ADMIN_TABS = ["history", "data"] as const;

export type Tab = (typeof TABS)[number];
export type AdminTab = (typeof ADMIN_TABS)[number];
