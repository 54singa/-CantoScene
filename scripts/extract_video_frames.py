from __future__ import annotations

import argparse
from pathlib import Path

import av


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract regularly sampled video frames as PPM images.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--interval", type=float, default=0.4)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    container = av.open(str(args.source))
    stream = container.streams.video[0]
    next_sample = 0.0
    count = 0

    for frame in container.decode(stream):
        timestamp = float(frame.time or 0)
        if timestamp + 0.001 < next_sample:
            continue
        pixels = frame.to_ndarray(format="rgb24")
        destination = args.output / f"frame-{timestamp:07.2f}.ppm"
        with destination.open("wb") as output:
            output.write(f"P6\n{pixels.shape[1]} {pixels.shape[0]}\n255\n".encode())
            output.write(pixels.tobytes())
        next_sample += args.interval
        count += 1

    print(f"Saved {count} frames to {args.output}")


if __name__ == "__main__":
    main()
