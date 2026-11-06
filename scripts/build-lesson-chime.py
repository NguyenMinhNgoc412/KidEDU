"""Original, non-speech 0.95s completion chime. No external samples or voices."""
from pathlib import Path
import math, wave, struct, json, hashlib

rate, duration = 44100, 0.95
notes = [(0.0, 523.25), (0.17, 659.25), (0.34, 783.99)]
frames = []
for i in range(int(rate * duration)):
    t = i / rate
    sample = 0.0
    for start, frequency in notes:
        age = t - start
        if 0 <= age < 0.58:
            attack = min(1, age / 0.025)
            release = min(1, (0.58 - age) / 0.07)
            envelope = attack * release * math.exp(-5.2 * age)
            sample += 0.085 * envelope * (math.sin(2 * math.pi * frequency * age) + 0.12 * math.sin(2 * math.pi * 2 * frequency * age))
    frames.append(struct.pack('<h', int(max(-1, min(1, sample)) * 32767)))
output = Path('assets/practice-fixtures/lesson-complete-v1.wav')
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), 'wb') as stream:
    stream.setnchannels(1); stream.setsampwidth(2); stream.setframerate(rate); stream.writeframes(b''.join(frames))
metadata = {'asset': output.name, 'source': 'original deterministic synthesis', 'role': 'optional completion sfx', 'durationMs': 950, 'sampleRate': rate, 'channels': 1, 'speech': False, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'reviewStatus': 'development candidate; native listening QA pending'}
output.with_suffix('.json').write_text(json.dumps(metadata, indent=2)+'\n', encoding='utf-8')
print(f'{output}: {duration}s mono PCM, gentle attack/release')
