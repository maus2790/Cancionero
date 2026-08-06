'use client';

import { useMemo, ReactNode } from 'react';
import { Chord } from '@tonaljs/tonal';

interface PianoChordDiagramProps {
    chordName: string;
    width?: number;
    notes?: string[];
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

export function PianoChordDiagram({ chordName, width = 200, notes }: PianoChordDiagramProps) {
    const chordNotes = useMemo(() => {
        if (notes && notes.length > 0) return Array.from(new Set(notes));
        try {
            const chord = Chord.get(chordName);
            const genNotes = chord.notes.map((n: string) => n.replace(/[0-9]/g, ''));
            return Array.from(new Set(genNotes));
        } catch {
            return [];
        }
    }, [chordName, notes]);

    const noteSet = new Set(chordNotes);

    // Rango: C4 (60) a G5 (79) → 1.5 octavas
    const startMidi = 60;
    const endMidi = 79;

    const allKeys: { note: string; octave: number; isWhite: boolean; isBlack: boolean }[] = [];

    for (let midi = startMidi; midi <= endMidi; midi++) {
        const octave = Math.floor(midi / 12) - 1;
        const noteIndex = midi % 12;
        const note = NOTES[noteIndex];
        const isWhite = WHITE_KEYS.includes(note);
        const isBlack = BLACK_KEYS.includes(note);
        if (isWhite || isBlack) {
            allKeys.push({ note, octave, isWhite, isBlack });
        }
    }

    const whiteKeysCount = allKeys.filter(k => k.isWhite).length;
    const whiteKeyWidth = width / whiteKeysCount;
    const blackKeyWidth = whiteKeyWidth * 0.6;

    let x = 0;
    const keys: ReactNode[] = [];

    allKeys.forEach(({ note, octave, isWhite, isBlack }) => {
        const isActive = noteSet.has(note);

        if (isWhite) {
            keys.push(
                <div
                    key={`white-${note}${octave}`}
                    className="absolute bottom-0 border border-gray-300 dark:border-gray-600 rounded-b"
                    style={{
                        left: x,
                        width: whiteKeyWidth,
                        height: '100%',
                        backgroundColor: isActive ? '#3b82f6' : 'white',
                        zIndex: 1,
                    }}
                >
                    {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] text-white font-bold">
                            {note}
                        </span>
                    )}
                </div>
            );
            x += whiteKeyWidth;
        } else if (isBlack) {
            const blackX = x - blackKeyWidth / 2;
            keys.push(
                <div
                    key={`black-${note}${octave}`}
                    className="absolute top-0 rounded-b"
                    style={{
                        left: blackX,
                        width: blackKeyWidth,
                        height: '62%',
                        backgroundColor: isActive ? '#2563eb' : '#1f2937',
                        zIndex: 2,
                    }}
                >
                    {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[5px] text-white font-bold">
                            {note}
                        </span>
                    )}
                </div>
            );
        }
    });

    return (
        <div className="relative inline-block overflow-hidden" style={{ width, height: 100 }}>
            {keys}
        </div>
    );
}