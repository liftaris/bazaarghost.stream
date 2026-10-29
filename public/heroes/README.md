# Hero icons

The small gold hero-head UI sprites, not portraits or full character art.
Extracted from the local Steam installation of The Bazaar. The source build ID and Unity version are in `manifest.json`.

| Hero        | Web asset                  |
| ----------- | -------------------------- |
| Dooley      | `/heroes/dooley.webp`      |
| Jules       | `/heroes/jules.webp`       |
| Karnok      | `/heroes/karnok.webp`      |
| Mak         | `/heroes/mak.webp`         |
| Pygmalien   | `/heroes/pygmalien.webp`   |
| Stelle      | `/heroes/stelle.webp`      |
| The Dragons | `/heroes/the_dragons.webp` |
| Vanessa     | `/heroes/vanessa.webp`     |

The WebP files are lossless and retain transparency and native dimensions, approximately 240 to 256 pixels per side.
`original/` contains PNG exports with the Unity sprite names. These are decoded sprites, not the original source PNG files.
`manifest.json` records the source build, bundle hashes, sprite IDs, dimensions, and file hashes.

All eight hero icons come from the same Steam build. No portrait substitutes are provided.

## Use an icon

```html
<img
  src="/heroes/vanessa.webp"
  alt="Vanessa"
  width="24"
  height="24"
  style="object-fit: contain"
/>
```

## Extract the icons again

With [uv](https://docs.astral.sh/uv/) installed, run from the repository root with the Steam game directory:

```sh
uv run scripts/extract-hero-icons.py "$HOME/.local/share/Steam/steamapps/common/The Bazaar"
```

The script reads the game files without changing them. It loads both the UI atlas and the hero-object bundle because some sprites reference a separate atlas.

The older official Windows build ZIP is also supported:

```sh
uv run scripts/extract-hero-icons.py /path/to/bazaarwinprodlatest.zip
```

That download reported a July 2, 2025 last-modified date and contains only six hero icons, without Karnok or The Dragons.
Use a separate output directory with `--output` when inspecting the older ZIP.
The script exports only `Icon_Hero_Metal_*_TUI` sprites. It does not run the game or extract the whole build.

## Rights

The Bazaar artwork belongs to its respective rights holders. Public availability and extraction do not grant a reuse license.
Confirm the applicable fan-content terms or obtain permission before publishing these assets.
