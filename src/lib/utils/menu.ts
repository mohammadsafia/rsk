/**
 * The translation key of a menu entry's label: a block's entry carries its own (`block-<id>:nav.<id>`), the app's
 * entries use their id in `nav`. Typed by shape, so an app whose menu type has no `labelKey` (made before blocks) still
 * fits the kit's menu code.
 */
export const menuLabelKey = (entry: { id: string; labelKey?: string }): string => entry.labelKey ?? entry.id;
