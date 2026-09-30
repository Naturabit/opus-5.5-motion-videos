export type Ingredient = { name: string; amount?: string; note: string };

export type Product = {
  id: string;
  lang: string;
  energy: "sleep" | "energy" | "skin" | "hair" | "digestive" | "daily";
  name: string;
  subtitle: string;
  bottle: string;
  hook: string[];
  capsules: number;
  days: number;
  doseLine: string;
  countLabels: { capsules: string; days: string; weeks?: string };
  ingredients: Ingredient[];
  badges: string[];
  tagline: string[];
  photos?: { hook?: string; product?: string; dose?: string; brand?: string };
  horizon?: { hook: string[]; product: string; ingredients: string[] };
  /** Logo on the end card. Default "estado-puro". */
  brand?: "estado-puro" | "essence-pure";
  /** Base colour replacing navy. Default "navy"; "burgundy" is the Clinic line. */
  palette?: "navy" | "burgundy";
  /** "powder": `capsules` holds grams and `days` doses; the count scene shows the tin instead of a capsule grid. */
  unit?: "capsules" | "powder";
  /** Capsule/pearl photo (transparent PNG, pointing down-right at ~38deg). Default products/capsule.png. */
  capsule?: string;
};
