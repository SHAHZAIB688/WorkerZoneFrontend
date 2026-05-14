export const translateStoreCategory = (t, categoryId) =>
  t(`dash.store.categories.${categoryId}`, { defaultValue: String(categoryId || "").replace(/_/g, " ") });
