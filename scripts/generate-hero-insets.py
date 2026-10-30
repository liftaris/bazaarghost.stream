# /// script
# requires-python = ">=3.12"
# dependencies = ["Pillow==13.0.0"]
# ///

"""Generate transparent hero cutouts from the shipped gold sprites."""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify the shipped masks without writing files")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / "public" / "heroes"
    heroes = json.loads((root / "manifest.json").read_text())["heroes"]
    output = root / "insets"
    if not args.check:
        output.mkdir(exist_ok=True)
    for hero, metadata in heroes.items():
        source = Image.open(root / metadata["webp"]).convert("RGBA")
        shapes = ImageOps.grayscale(source).point(lambda value: 255 if value >= 100 else 0)
        alpha = ImageChops.multiply(shapes, source.getchannel("A"))
        path = output / f"{hero}.webp"
        if args.check:
            actual = Image.open(path).convert("RGBA")
            if actual.size != source.size or actual.getchannel("A").tobytes() != alpha.tobytes():
                raise SystemExit(f"Hero inset differs from its source: {path}")
        else:
            image = Image.new("RGBA", source.size, "white")
            image.putalpha(alpha)
            image.save(path, format="WEBP", lossless=True)
        print(f"{'Verified' if args.check else 'Generated'} {path.relative_to(root)}")


if __name__ == "__main__":
    main()
