# /// script
# requires-python = ">=3.12"
# dependencies = ["Pillow==13.0.0"]
# ///

"""Convert search-result hero masks to dark-mode PNGs for the OG renderer."""

import argparse
import json
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify PNGs without writing files")
    args = parser.parse_args()
    public = Path(__file__).resolve().parents[1] / "public"
    heroes = json.loads((public / "heroes/manifest.json").read_text())["heroes"]
    output = public / "og/heroes"
    if not args.check:
        output.mkdir(exist_ok=True)
    for hero in heroes:
        mask = Image.open(public / "heroes/insets" / f"{hero}.webp").convert("RGBA")
        image = Image.new("RGBA", mask.size, "#333333")
        image.putalpha(mask.getchannel("A"))
        path = output / f"{hero}.png"
        if args.check:
            actual = Image.open(path).convert("RGBA")
            if actual.size != image.size or actual.tobytes() != image.tobytes():
                raise SystemExit(f"OG hero inset differs from search-result mask: {path}")
        else:
            image.save(path, optimize=True)
        print(f"{'Verified' if args.check else 'Generated'} {path.relative_to(public)}")


if __name__ == "__main__":
    main()
