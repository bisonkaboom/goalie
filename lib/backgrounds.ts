/**
 * Which animal, if any, sits behind the Home page.
 *
 * Shared by the settings screen and the resolver route, so the list of options
 * and the list of things the API will actually serve cannot drift apart.
 */

/** A kind that names one species. "smorgasbord" picks among these per request. */
export type BackgroundAnimal = "cat" | "dog" | "fox" | "duck";

export type BackgroundKind = BackgroundAnimal | "none" | "smorgasbord";

export const BACKGROUND_ANIMALS: readonly BackgroundAnimal[] = [
  "cat",
  "dog",
  "fox",
  "duck",
] as const;

/** Display order on the settings screen: off, then species, then everything. */
export const BACKGROUND_KINDS: readonly BackgroundKind[] = [
  "none",
  "cat",
  "dog",
  "fox",
  "duck",
  "smorgasbord",
] as const;

export function isBackgroundKind(value: unknown): value is BackgroundKind {
  return BACKGROUND_KINDS.includes(value as BackgroundKind);
}

export function isBackgroundAnimal(value: unknown): value is BackgroundAnimal {
  return BACKGROUND_ANIMALS.includes(value as BackgroundAnimal);
}

/** Defined in one place for the same reason as directionLabel. */
export function backgroundLabel(kind: BackgroundKind): string {
  switch (kind) {
    case "none":
      return "None";
    case "cat":
      return "Cats";
    case "dog":
      return "Dogs";
    case "fox":
      return "Foxes";
    case "duck":
      return "Ducks";
    case "smorgasbord":
      return "Smorgasbord";
  }
}
