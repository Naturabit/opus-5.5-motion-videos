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
};
