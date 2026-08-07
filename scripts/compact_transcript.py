from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Remove word-level metadata from a transcript for the frontend.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    payload = json.loads(args.source.read_text(encoding="utf-8"))
    compact = {
        "source": payload["source"],
        "duration": payload["duration"],
        "segments": [
            {
                "id": segment["id"],
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"],
            }
            for segment in payload["segments"]
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(compact, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
