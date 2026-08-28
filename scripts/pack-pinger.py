#!/usr/bin/env python3
"""Zip the Chrome pinger so production can offer a download."""

from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "extension"
OUTPUT = ROOT / "public" / "desk-pinger.zip"


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(SOURCE.rglob("*")):
            if not path.is_file() or path.name == ".DS_Store":
                continue
            archive.write(path, path.relative_to(SOURCE))
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
