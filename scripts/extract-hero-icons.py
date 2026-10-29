# /// script
# requires-python = ">=3.12"
# dependencies = ["UnityPy==1.25.4", "Pillow==13.0.0"]
# ///

"""Extract gold hero icons from a Bazaar Windows ZIP or Steam install directory."""

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path

import UnityPy


SOURCE_URL = "https://cdn.playthebazaar.com/bazaarprodbuild/bazaarwinprodlatest.zip"
HEROES = {
    "DRA": "the_dragons",
    "DOO": "dooley",
    "JUL": "jules",
    "KAR": "karnok",
    "MAK": "mak",
    "PYG": "pygmalien",
    "STE": "stelle",
    "VAN": "vanessa",
}
SPRITE_NAME = re.compile(r"Icon_Hero_Metal_([A-Z]+)_TUI")


def load_source(source):
    """Load UI atlases and hero references without changing the game files."""
    environment = UnityPy.Environment()
    bundles = {}
    if source.is_dir():
        data = source / "TheBazaar_Data" if (source / "TheBazaar_Data").is_dir() else source
        managers = UnityPy.load(str(data / "globalgamemanagers"))
        version = next(iter(managers.files.values())).unity_version
        UnityPy.config.FALLBACK_UNITY_VERSION = version
        provenance = {"type": "steam", "steamAppId": "1617400", "unityVersion": version}
        app_manifest = data.parent.parent.parent / "appmanifest_1617400.acf"
        if app_manifest.is_file():
            build = re.search(r'"buildid"\s+"(\d+)"', app_manifest.read_text())
            if build:
                provenance["steamBuildId"] = build[1]
        for path in sorted((data / "StreamingAssets" / "aa").rglob("*.bundle")):
            if not path.name.startswith(("ui_sprite_atlas_", "heroobjects_")):
                continue
            bundle = environment.load_file(str(path))
            bundles[bundle.name] = {
                "bundle": path.relative_to(data.parent).as_posix(),
                "bundleSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
    else:
        with source.open("rb") as archive_file:
            digest = hashlib.file_digest(archive_file, "sha256").hexdigest()
        provenance = {"type": "zip", "url": SOURCE_URL, "archiveSha256": digest}
        with zipfile.ZipFile(source) as archive:
            for entry in archive.infolist():
                path = entry.filename.replace("\\", "/")
                if "ui_sprite_atlas_" not in path or not path.endswith(".bundle"):
                    continue
                contents = archive.read(entry)
                bundle = environment.load_file(contents, name=path)
                bundles[bundle.name] = {
                    "bundle": path,
                    "bundleSha256": hashlib.sha256(contents).hexdigest(),
                }
    return environment, provenance, bundles


def main():
    """Write PNG originals, lossless WebP copies, and their source manifest."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Windows build ZIP or Steam install directory")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "public" / "heroes",
    )
    args = parser.parse_args()
    sprites = {}
    environment, provenance, bundles = load_source(args.source)
    for obj in environment.objects:
        if obj.type.name != "Sprite":
            continue
        sprite = obj.read()
        match = SPRITE_NAME.fullmatch(sprite.m_Name)
        if match is None:
            continue
        hero = HEROES[match[1]]
        if hero in sprites:
            raise ValueError(f"Duplicate hero icon: {hero}")
        metadata = {
            "sprite": sprite.m_Name,
            **bundles[obj.assets_file.parent.name],
            "pathId": str(obj.path_id),
        }
        if sprite.m_SpriteAtlas.m_PathID:
            atlas_bundle = sprite.m_SpriteAtlas.deref().assets_file.parent.name
            metadata["atlasBundle"] = bundles[atlas_bundle]["bundle"]
        sprites[hero] = (
            sprite.image.convert("RGBA"),
            metadata,
        )

    expected = set(HEROES.values())
    if not args.source.is_dir():
        expected -= {"karnok", "the_dragons"}
    missing = expected - sprites.keys()
    if missing:
        raise ValueError(f"Missing hero icons: {', '.join(sorted(missing))}")

    originals = args.output / "original"
    originals.mkdir(parents=True, exist_ok=True)
    manifest = {"source": provenance, "heroes": {}}
    manifest["extraction"] = {"UnityPy": "1.25.4", "Pillow": "13.0.0"}

    for hero, (image, metadata) in sorted(sprites.items()):
        png = originals / f"{metadata['sprite']}.png"
        webp = args.output / f"{hero}.webp"
        image.save(png, optimize=True)
        image.save(webp, lossless=True, exact=True, method=6)
        metadata.update(
            {
                "width": image.width,
                "height": image.height,
                "png": png.relative_to(args.output).as_posix(),
                "webp": webp.name,
                "pngSha256": hashlib.sha256(png.read_bytes()).hexdigest(),
                "webpSha256": hashlib.sha256(webp.read_bytes()).hexdigest(),
            }
        )
        manifest["heroes"][hero] = metadata
        print(f"{hero}: {image.width} × {image.height}, {webp.stat().st_size:,} bytes")

    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
