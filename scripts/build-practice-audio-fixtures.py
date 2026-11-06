"""Development fixtures derived offline from the existing ba/me sample videos.

Needs an existing FFmpeg executable (KIDEDU_FFMPEG). Does not publish content.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
output = root / "assets" / "practice-fixtures"
output.mkdir(parents=True, exist_ok=True)
ffmpeg = os.environ["KIDEDU_FFMPEG"]
recipes = []
for word in ("ba", "me"):
    source = root / "assets" / "default-media" / f"item-{word}" / "mouth-video-v1.mp4"
    destination = output / f"{word}-v1.wav"
    filters = "silenceremove=start_periods=1:start_duration=0.08:start_threshold=-45dB:stop_periods=-1:stop_duration=0.5:stop_threshold=-45dB"
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                    "-map", "0:a:0", "-vn", "-af", filters, "-ac", "1", "-ar", "44100",
                    "-c:a", "pcm_s16le", str(destination)], check=True)
    recipes.append({"file": destination.name, "source": str(source.relative_to(root)),
                    "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "filter": filters})
subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(output / "ba-v1.wav"),
                "-i", str(output / "me-v1.wav"), "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1[a]",
                "-map", "[a]", "-c:a", "pcm_s16le", str(output / "ba-me-v1.wav")], check=True)
recipes.append({"file": "ba-me-v1.wav", "source": ["ba-v1.wav", "me-v1.wav"], "filter": "authored concatenation, no runtime waveform cutting"})
for recipe in recipes:
    recipe["sha256"] = hashlib.sha256((output / recipe["file"]).read_bytes()).hexdigest()
version = subprocess.check_output([ffmpeg, "-version"], text=True).splitlines()[0]
(output / "manifest.json").write_text(json.dumps({"source": "development_fixture", "approvedForProduction": False,
    "authorization": "Owner requested existing samples on 2026-11-03", "tool": version, "assets": recipes}, ensure_ascii=False, indent=2), encoding="utf-8")
print("Created three development-only audio fixtures; no production approval inferred.")
