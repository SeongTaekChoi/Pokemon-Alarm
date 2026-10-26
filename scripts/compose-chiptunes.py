# Renders the original 8-bit alarm tracks to android/app/src/main/res/raw/chip_*.ogg.
# The tunes are written for this app, so they carry no license terms.
# Usage: python3 scripts/compose-chiptunes.py   (needs numpy and ffmpeg)
import os
import subprocess
import tempfile
import wave

import numpy as np

RATE = 32000
OUT = os.path.join(os.path.dirname(__file__), '../android/app/src/main/res/raw')

NOTE_INDEX = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6,
              'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def midi(name):
    """'A4' -> 69."""
    return 12 * (int(name[-1]) + 1) + NOTE_INDEX[name[:-1]]


def freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)


CHORDS = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10]}


def chord_notes(chord, octave):
    root = chord[:2] if len(chord) > 1 and chord[1] in '#b' else chord[:1]
    return [midi(f'{root}{octave}') + i for i in CHORDS[chord[len(root):]]]


def pulse(f, n, duty):
    phase = (np.arange(n) * f / RATE) % 1.0
    return np.where(phase < duty, 1.0, -1.0)


def triangle(f, n):
    phase = (np.arange(n) * f / RATE) % 1.0
    return 4 * np.abs(phase - 0.5) - 1


def envelope(n, attack=0.005, decay=0.08, sustain=0.6, release=0.03):
    t = np.arange(n) / RATE
    env = np.where(t < attack, t / attack,
                   sustain + (1 - sustain) * np.exp(-(t - attack) / max(decay, 1e-4)))
    tail = min(n, int(release * RATE))
    if tail:
        env[-tail:] *= np.linspace(1, 0, tail)
    return env


def place(buf, start, sig):
    end = min(len(buf), start + len(sig))
    buf[start:end] += sig[:end - start]


def drum(kind, n):
    t = np.arange(n) / RATE
    rng = np.random.default_rng(7)
    if kind == 'k':  # kick: falling sine
        f = 150 * np.exp(-t * 30) + 45
        return np.sin(2 * np.pi * np.cumsum(f) / RATE) * np.exp(-t * 18)
    if kind == 's':  # snare: noise burst
        return rng.uniform(-1, 1, n) * np.exp(-t * 22) * 0.8
    return rng.uniform(-1, 1, n) * np.exp(-t * 90) * 0.35  # hat


DRUMS = {
    # One bar of 16ths: k kick, s snare, h hat, . rest
    'rock': 'k.h.s.h.k.h.s.h.',
    'drive': 'k.hhs.hhk.hhs.hh',
    'march': 'k.h.s.hsk.h.s.ss',
    'light': 'h...h...h...h...',
    'bounce': 'k..hs.h.k.hhs.h.',
}


def render(track):
    beat = 60 / track['bpm']
    beats = sum(b for _, b in track['chords'])
    n = int(round(beats * beat * RATE))
    lead, harm, bass, perc = (np.zeros(n) for _ in range(4))

    t = 0.0
    for note, b in track['melody']:
        length = int(b * beat * RATE)
        if note != 'R':
            gate = int(length * track.get('gate', 0.9))
            f = freq(midi(note))
            sig = pulse(f, gate, 0.25)
            # A little vibrato on long notes.
            if b >= 1:
                tt = np.arange(gate) / RATE
                sig = pulse(f * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt) * np.clip(tt - 0.15, 0, 1)), gate, 0.25)
            place(lead, int(t * beat * RATE), sig * envelope(gate, decay=0.15, sustain=0.7))
        t += b

    t = 0.0
    for chord, b in track['chords']:
        start = int(t * beat * RATE)
        length = int(b * beat * RATE)
        # Bass: root and octave in eighths.
        root = chord_notes(chord, 2)[0]
        step = int(beat * RATE / 2)
        for i in range(0, length, step):
            m = root + (12 if (i // step) % 2 else 0) if track.get('bass') == 'octave' else root
            g = int(step * 0.85)
            place(bass, start + i, triangle(freq(m), g) * envelope(g, decay=0.2, sustain=0.8))
        # Harmony: 16th-note arpeggio over the chord.
        notes = chord_notes(chord, 4)
        notes = notes + notes[-2:0:-1] if track.get('arp') == 'updown' else notes
        step = int(beat * RATE / 4)
        for k, i in enumerate(range(0, length, step)):
            g = int(step * 0.8)
            place(harm, start + i, pulse(freq(notes[k % len(notes)]), g, 0.125) * envelope(g, decay=0.05, sustain=0.3))
        t += b

    pattern = DRUMS[track['drums']]
    step = int(beat * RATE / 4)
    for i, start in enumerate(range(0, n, step)):
        kind = pattern[i % 16]
        if kind != '.':
            place(perc, start, drum(kind, int(0.2 * RATE)))

    mix = 0.30 * lead + 0.12 * harm + 0.40 * bass + 0.30 * perc
    # Soft low-pass so the square waves aren't harsh on a phone speaker.
    kernel = np.ones(3) / 3
    mix = np.convolve(mix, kernel, mode='same')
    return mix / np.max(np.abs(mix)) * 0.89


def m(text):
    """'E5:.5 G5:.5 C6:1' -> [('E5', .5), ...]"""
    return [(tok.split(':')[0], float(tok.split(':')[1])) for tok in text.split()]


def bars(*chords, beats=4):
    return [(c, beats) for c in chords]


TRACKS = {
    'chip_morning_adventure': dict(
        bpm=150, drums='rock', arp='up', bass='octave',
        chords=bars('C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'),
        melody=m('E5:.5 G5:.5 C6:1 B5:.5 G5:.5 E5:1 '
                 'D5:.5 G5:.5 B5:1 A5:.5 G5:.5 D5:1 '
                 'C5:.5 E5:.5 A5:1 G5:.5 E5:.5 C5:1 '
                 'F5:.5 A5:.5 C6:.5 A5:.5 G5:2 '
                 'E5:.5 G5:.5 C6:1 D6:.5 C6:.5 B5:1 '
                 'A5:.5 B5:.5 G5:1 D5:.5 G5:.5 B5:1 '
                 'A5:.5 C6:.5 F6:1 E6:.5 D6:.5 C6:1 '
                 'D6:1 B5:1 G5:1 R:1')),
    'chip_dreamy_arpeggio': dict(
        bpm=100, drums='light', arp='updown', bass='root', gate=0.97,
        chords=bars('F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'),
        melody=m('A5:1.5 G5:.5 F5:1 C5:1 '
                 'D5:1.5 E5:.5 F5:1 A5:1 '
                 'Bb5:1.5 A5:.5 G5:1 F5:1 '
                 'E5:2 G5:2 '
                 'A5:1.5 G5:.5 F5:1 C6:1 '
                 'A5:1.5 G5:.5 F5:1 D5:1 '
                 'D6:1 C6:1 Bb5:1 G5:1 '
                 'G5:1 E5:1 C5:2')),
    'chip_victory_fanfare': dict(
        bpm=132, drums='march', arp='up', bass='octave',
        chords=bars('C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'),
        melody=m('G4:.5 G4:.25 G4:.25 C5:1 E5:1 G5:1 '
                 'A5:1.5 G5:.5 F5:1 A5:1 '
                 'G5:.5 F5:.5 E5:.5 D5:.5 B4:1 G4:1 '
                 'C5:.5 E5:.5 G5:.5 C6:.5 C6:2 '
                 'E5:.5 E5:.25 E5:.25 A5:1 C6:1 E6:1 '
                 'D6:1.5 C6:.5 A5:1 F5:1 '
                 'G5:.5 A5:.5 B5:.5 D6:.5 G6:1 F6:1 '
                 'E6:1 C6:1 G5:1 C6:1')),
    'chip_forest_walk': dict(
        bpm=120, drums='bounce', arp='up', bass='octave', gate=0.6,
        chords=bars('G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'),
        melody=m('B4:.5 D5:.5 G5:.5 D5:.5 B5:1 A5:1 '
                 'G5:.5 F#5:.5 E5:.5 F#5:.5 G5:1 B4:1 '
                 'C5:.5 E5:.5 G5:.5 E5:.5 C6:1 B5:1 '
                 'A5:.5 G5:.5 F#5:.5 E5:.5 D5:2 '
                 'B4:.5 D5:.5 G5:.5 B5:.5 D6:1 B5:1 '
                 'E6:.5 D6:.5 B5:.5 G5:.5 E5:1 G5:1 '
                 'C6:.5 B5:.5 A5:.5 G5:.5 E5:.5 G5:.5 C6:1 '
                 'B5:.5 A5:.5 G5:.5 F#5:.5 A5:1 D5:1')),
    'chip_emergency_dispatch': dict(
        bpm=168, drums='drive', arp='up', bass='octave', gate=0.8,
        chords=bars('Am', 'Am', 'F', 'G', 'Am', 'Am', 'F', 'E'),
        melody=m('A5:.5 A5:.5 E6:.5 A5:.5 D6:.5 A5:.5 C6:.5 B5:.5 '
                 'A5:.5 A5:.5 E6:.5 A5:.5 G6:.5 F6:.5 E6:1 '
                 'F5:.5 F5:.5 C6:.5 F5:.5 A5:.5 F5:.5 C6:.5 A5:.5 '
                 'G5:.5 B5:.5 D6:.5 G6:.5 F6:.5 E6:.5 D6:.5 B5:.5 '
                 'C6:1 B5:.5 A5:.5 E6:1 A5:1 '
                 'C6:.5 D6:.5 E6:.5 G6:.5 A6:2 '
                 'F6:.5 E6:.5 D6:.5 C6:.5 A5:1 C6:1 '
                 'B5:.5 C6:.5 D6:.5 B5:.5 G#5:2')),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, track in TRACKS.items():
        assert abs(sum(b for _, b in track['melody']) - sum(b for _, b in track['chords'])) < 1e-6, name
        audio = render(track)
        pcm = (audio * 32767).astype('<i2')
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
            with wave.open(tmp.name, 'wb') as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(RATE)
                w.writeframes(pcm.tobytes())
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp.name, '-c:a', 'libvorbis',
                            '-q:a', '4', os.path.join(OUT, f'{name}.ogg')], check=True)
        print(f'{name}: {len(audio) / RATE:.1f}s')


if __name__ == '__main__':
    main()
