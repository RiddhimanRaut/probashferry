// Per-tag colors for essay flavor and type pills.

const TAG_COLORS: Record<string, string> = {
  // Flavors (topic/theme)
  Culture:  "#6B7F5E",   // olive green
  Faith:    "#9B7E35",   // deep gold
  Travel:   "#3A7B8B",   // teal
  Identity: "#7B5A8B",   // plum
  History:  "#8B6B4A",   // warm brown
  Food:     "#B85C3A",   // burnt orange
  Memory:   "#8B6378",   // dusty rose
  Diaspora: "#4A7B6F",   // muted teal

  // Types (literary form)
  Prose:    "#5A6570",   // steel
  Poem:     "#6B5A8B",   // soft indigo
  Memoir:   "#7B6B5A",   // taupe
  Report:   "#4A6B8B",   // slate blue
  Letter:   "#5A7B5A",   // forest
};

const FALLBACK = "#6B7B6B";

export function tagColor(tag: string): string {
  return TAG_COLORS[tag] || FALLBACK;
}
