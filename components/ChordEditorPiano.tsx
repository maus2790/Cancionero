'use client';

import { useState, useEffect, ReactNode } from 'react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

interface ChordEditorPianoProps {
    initialNotes?: string[];
    onChange: (notes: string[]) => void;
    width?: number;
}

export function ChordEditorPiano({ initialNotes = [], onChange, width = 460 }: ChordEditorPianoProps) {
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set(initialNotes));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setActiveNotes(new Set(initialNotes));
    }, [initialNotes.join(',')]);

    const startMidi = 60;
    const endMidi = 83;

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
    const blackKeyWidth = whiteKeyWidth * 0.62;
    const height = Math.round(whiteKeyWidth * 4.5);

    const toggleNote = (note: string) => {
        const next = new Set(activeNotes);
        if (next.has(note)) {
            next.delete(note);
        } else {
            next.add(note);
        }
        setActiveNotes(next);
        onChange(Array.from(next));
    };

    let x = 0;
    const whiteKeyElements: ReactNode[] = [];
    const blackKeyElements: ReactNode[] = [];

    allKeys.forEach(({ note, octave, isWhite, isBlack }) => {
        const isActive = activeNotes.has(note);

        if (isWhite) {
            whiteKeyElements.push(
                <div
                    key={`white-${note}${octave}`}
                    onClick={() => toggleNote(note)}
                    className="absolute bottom-0 border border-gray-300 dark:border-gray-500 rounded-b cursor-pointer select-none transition-colors"
                    style={{
                        left: x,
                        width: whiteKeyWidth - 1,
                        height: '100%',
                        backgroundColor: isActive ? '#3b82f6' : 'white',
                        zIndex: 1,
                    }}
                    title={note}
                >
                    {isActive && (
                        <span
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 font-bold text-white"
                            style={{ fontSize: Math.max(8, whiteKeyWidth * 0.4) }}
                        >
                            {note}
                        </span>
                    )}
                </div>
            );
            x += whiteKeyWidth;
        } else if (isBlack) {
            const blackX = x - blackKeyWidth / 2;
            blackKeyElements.push(
                <div
                    key={`black-${note}${octave}`}
                    onClick={() => toggleNote(note)}
                    className="absolute top-0 rounded-b cursor-pointer select-none transition-colors"
                    style={{
                        left: blackX,
                        width: blackKeyWidth,
                        height: '60%',
                        backgroundColor: isActive ? '#2563eb' : '#1f2937',
                        zIndex: 2,
                    }}
                    title={note}
                >
                    {isActive && (
                        <span
                            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 font-bold text-white"
                            style={{ fontSize: Math.max(6, blackKeyWidth * 0.35) }}
                        >
                            {note.replace('#', String.fromCharCode(9839))}
                        </span>
                    )}
                </div>
            );
        }
    });

    const noteList = Array.from(activeNotes);

    return (
        <div className="space-y-3">
            <div
                className="relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900"
                style={{ width, height }}
            >
                {whiteKeyElements}
                {blackKeyElements}
            </div>

            <div className="flex flex-wrap gap-2 min-h-[28px] items-center">
                {noteList.length === 0 ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Toca las teclas para marcar las notas del acorde
                    </span>
                ) : (
                    noteList.map(note => (
                        <span
                            key={note}
                            onClick={() => toggleNote(note)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            title="Clic para quitar"
                        >
                            {note}
                            <span className="opacity-60">x</span>
                        </span>
                    ))
                )}
                {noteList.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setActiveNotes(new Set()); onChange([]); }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
                    >
                        Limpiar todo
                    </button>
                )}
            </div>
        </div>
    );
}
