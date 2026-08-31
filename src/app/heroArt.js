import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const has = (file) => fs.existsSync(path.join(PUBLIC_DIR, file));

/**
 * Picks the hero artwork. Server-only — it touches the filesystem, and it is
 * evaluated once per server process, so dropping new art into public/ needs a
 * dev-server restart (or a rebuild in production) to be picked up.
 *
 * The split is all-or-nothing on purpose: the cutout layered over the original
 * hero.jpg would show two Venoms, and the plate on its own would show none.
 */
export function resolveHeroArt() {
  const figure =
    (has("hero-venom.webp") && "/hero-venom.webp") ||
    (has("hero-venom.png") && "/hero-venom.png") ||
    null;

  if (!has("hero-plate.jpg") || !figure) {
    return { plate: "/hero.jpg", figure: null, layered: false };
  }

  return { plate: "/hero-plate.jpg", figure, layered: true };
}
