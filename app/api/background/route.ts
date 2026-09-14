import { NextResponse } from "next/server";
import {
  BACKGROUND_ANIMALS,
  isBackgroundAnimal,
  type BackgroundAnimal,
} from "@/lib/backgrounds";

/**
 * Resolves a random animal photo and redirects the browser to it.
 *
 * This is server-side rather than a `fetch` in the background component because
 * the four sources are not uniform, and two of the differences are fatal in a
 * browser:
 *
 *   - random-d.uk sends no `Access-Control-Allow-Origin`, so a client-side fetch
 *     of its manifest is blocked outright.
 *   - random-d.uk also reports its photos as `http://`, which a browser refuses
 *     to load as mixed content on an HTTPS page. The scheme is rewritten below.
 *   - dog.ceo and randomfox.ca need a manifest request before the photo URL is
 *     even known, so a plain <img src> could not reach them at all.
 *
 * Doing it here means the component keeps pointing one URL at CSS regardless of
 * which animal is chosen, and the browser only ever talks to our own origin plus
 * the image host it gets redirected to.
 *
 * Route Handlers are uncached by default in Next 15+, so no opt-out is needed;
 * the no-store header is for the browser rather than the framework.
 */

/**
 * How long one upstream call gets before it is written off.
 *
 * Sized from measurement, not taste: randomfox.ca averages over 5 seconds and
 * has been seen taking 20. Without a ceiling, drawing a fox means the photo
 * arrives long after anyone is looking at the page, which is indistinguishable
 * from no background at all.
 */
const UPSTREAM_TIMEOUT_MS = 3000;

/** Total budget across retries, so a run of slow sources cannot stall a render. */
const TOTAL_BUDGET_MS = 8000;

const nonce = () => Math.random().toString(36).slice(2);

/** Fisher-Yates, on a copy — the exported source list must not be reordered. */
function shuffled<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Source = {
  /** Hosts a photo from this source may legitimately live on. */
  hosts: readonly string[];
  resolve: () => Promise<string>;
};

async function readManifest(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);

  // randomfox.ca intermittently serves an HTML error page under a 200 status —
  // about one request in eight when measured. Checking the type turns that into
  // a clean failure this route can fall back from, rather than a JSON parse
  // error thrown from somewhere less obvious.
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("json")) {
    throw new Error(`${url} returned ${type || "no content type"}`);
  }

  return response.json();
}

/** Pulls one string field out of an untrusted manifest. */
function field(payload: unknown, key: string): string {
  const value = (payload as Record<string, unknown> | null)?.[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Manifest had no usable "${key}"`);
  }
  return value;
}

const SOURCES: Record<BackgroundAnimal, Source> = {
  // cataas serves the photo directly, so there is no manifest step. `width`
  // alone keeps it a ~150KB JPEG; asking for both dimensions returns a
  // multi-megabyte PNG of the same picture.
  cat: {
    hosts: ["cataas.com"],
    resolve: async () => `https://cataas.com/cat?width=1200&nonce=${nonce()}`,
  },
  dog: {
    hosts: ["images.dog.ceo"],
    resolve: async () =>
      field(await readManifest("https://dog.ceo/api/breeds/image/random"), "message"),
  },
  fox: {
    hosts: ["randomfox.ca"],
    resolve: async () => field(await readManifest("https://randomfox.ca/floof/"), "image"),
  },
  duck: {
    hosts: ["random-d.uk"],
    resolve: async () => field(await readManifest("https://random-d.uk/api/v2/random"), "url"),
  },
};

/** Resolves one source to a photo URL, or null if it cannot be trusted. */
async function resolvePhoto(animal: BackgroundAnimal): Promise<URL | null> {
  const source = SOURCES[animal];

  try {
    const photo = new URL(await source.resolve());
    // random-d.uk reports http://; every one of these hosts serves the same
    // bytes over TLS, and a plain-http redirect would be blocked anyway.
    photo.protocol = "https:";

    // The redirect target comes out of a third party's response body, so it is
    // checked against the hosts that source is supposed to use. Without this,
    // a compromised or simply broken upstream could bounce our users anywhere.
    if (!source.hosts.includes(photo.hostname)) return null;

    return photo;
  } catch {
    return null;
  }
}

/**
 * The order sources are tried in.
 *
 * Smorgasbord means "any animal", so a failing source is a reason to try the
 * next one rather than to give up — one flaky source should not turn a quarter
 * of visits into a blank page. A named species is never silently swapped for a
 * different animal: it retries its own source instead, which is safe because
 * every one of these returns a different photo per call.
 */
function candidates(kind: BackgroundAnimal | "smorgasbord"): BackgroundAnimal[] {
  return kind === "smorgasbord" ? shuffled(BACKGROUND_ANIMALS) : [kind, kind, kind];
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("kind");
  if (requested !== "smorgasbord" && !isBackgroundAnimal(requested)) {
    return new NextResponse("Unknown background kind", { status: 400 });
  }

  const startedAt = Date.now();

  // Resolved per request, so a smorgasbord is a different species each visit
  // rather than one picked once and remembered.
  for (const animal of candidates(requested)) {
    if (Date.now() - startedAt > TOTAL_BUDGET_MS) break;

    const photo = await resolvePhoto(animal);
    if (photo) {
      return NextResponse.redirect(photo, {
        status: 302,
        headers: { "cache-control": "no-store" },
      });
    }
  }

  // Everything was down or too slow. The component treats a failed load as "no
  // background" and the page renders plain, so this stays quiet.
  return new NextResponse("Could not reach any photo source", { status: 502 });
}
