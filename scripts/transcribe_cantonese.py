from __future__ import annotations

import argparse
import json
from pathlib import Path

from faster_whisper import WhisperModel


def srt_time(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a timestamped Cantonese transcript with faster-whisper.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--model", default="small")
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(args.source),
        language="zh",
        beam_size=5,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 450},
        condition_on_previous_text=False,
        word_timestamps=True,
        initial_prompt="以下內容是香港粵語日常對白，請保留粵語口語、語氣詞和人名。",
    )

    rows: list[dict[str, object]] = []
    for index, segment in enumerate(segments, start=1):
        text = segment.text.strip()
        if not text:
            continue
        row = {
            "id": f"line-{index}",
            "start": round(segment.start, 3),
            "end": round(segment.end, 3),
            "text": text,
            "words": [
                {
                    "start": round(word.start, 3),
                    "end": round(word.end, 3),
                    "word": word.word,
                    "probability": round(word.probability, 4),
                }
                for word in (segment.words or [])
            ],
        }
        rows.append(row)
        print(f"[{srt_time(segment.start)} --> {srt_time(segment.end)}] {text}", flush=True)

    payload = {
        "source": args.source.name,
        "model": args.model,
        "detected_language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": rows,
    }
    json_path = args.output.with_suffix(".raw.json")
    srt_path = args.output.with_suffix(".raw.srt")
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    srt_path.write_text(
        "\n\n".join(
            f"{index}\n{srt_time(float(row['start']))} --> {srt_time(float(row['end']))}\n{row['text']}"
            for index, row in enumerate(rows, start=1)
        ) + "\n",
        encoding="utf-8",
    )
    print(f"Saved {len(rows)} segments to {json_path} and {srt_path}")


if __name__ == "__main__":
    main()
