'use client';

import { useMemo } from 'react';
import { Chord } from '@tonaljs/tonal';

interface GuitarChordDiagramProps {
    chordName: string;
    width?: number;
}

// Diccionario de posiciones: [cuerda6, cuerda5, cuerda4, cuerda3, cuerda2, cuerda1]
// -1 = no tocar, 0 = al aire, 1-... = traste
// Para cejilla: usamos 'b' en la primera posición con el traste: ['b', 3, ...]
// Simplificamos: si el primer elemento es un número, se interpreta como cejilla si todas las cuerdas (excepto -1) tienen ese mismo número o mayor.
// Pero para claridad, definimos explícitamente.
const CHORD_POSITIONS: Record<string, (number | 'b')[]> = {
    // Mayores
    'C': [-1, 3, 2, 0, 1, 0],
    'C#': [-1, 4, 3, 1, 2, 1],
    'Db': [-1, 4, 3, 1, 2, 1],
    'D': [-1, -1, 0, 2, 3, 2],
    'D#': [-1, -1, 1, 3, 4, 3],
    'Eb': [-1, -1, 1, 3, 4, 3],
    'E': [0, 2, 2, 1, 0, 0],
    'F': ['b', 1, 3, 3, 2, 1, 1], // cejilla traste 1
    'F#': ['b', 2, 4, 4, 3, 2, 2],
    'Gb': ['b', 2, 4, 4, 3, 2, 2],
    'G': [3, 2, 0, 0, 0, 3],
    'G#': [4, 3, 1, 1, 1, 4],
    'Ab': [4, 3, 1, 1, 1, 4],
    'A': [-1, 0, 2, 2, 2, 0],
    'A#': [-1, 1, 3, 3, 3, 1],
    'Bb': [-1, 1, 3, 3, 3, 1],
    'B': [-1, 2, 3, 4, 4, 2],
    // Menores
    'Cm': [-1, 3, 3, 0, 1, 3],
    'C#m': [-1, 4, 4, 1, 2, 4],
    'Dm': [-1, -1, 0, 2, 3, 1],
    'D#m': [-1, -1, 1, 3, 4, 2],
    'Em': [0, 2, 2, 0, 0, 0],
    'Fm': ['b', 1, 3, 3, 1, 1, 1],
    'F#m': ['b', 2, 4, 4, 2, 2, 2],
    'Gm': [3, 3, 0, 0, 1, 3],
    'G#m': [4, 4, 1, 1, 2, 4],
    'Am': [-1, 0, 2, 2, 1, 0],
    'A#m': [-1, 1, 3, 3, 2, 1],
    'Bm': [-1, 2, 3, 4, 3, 2],
    // Séptimas
    'C7': [-1, 3, 2, 3, 1, 0],
    'C#7': [-1, 4, 3, 4, 2, 1],
    'D7': [-1, -1, 0, 2, 1, 2],
    'D#7': [-1, -1, 1, 3, 2, 3],
    'E7': [0, 2, 0, 1, 0, 0],
    'F7': ['b', 1, 3, 1, 2, 1, 1],
    'F#7': ['b', 2, 4, 2, 3, 2, 2],
    'G7': [3, 2, 0, 0, 1, 3],
    'G#7': [4, 3, 1, 1, 2, 4],
    'A7': [-1, 0, 2, 0, 2, 0],
    'A#7': [-1, 1, 3, 1, 3, 1],
    'B7': [-1, 2, 1, 2, 0, 2],
    // m7
    'Cm7': [-1, 3, 3, 3, 1, 3],
    'Dm7': [-1, -1, 0, 2, 1, 1],
    'Em7': [0, 2, 2, 0, 0, 0],
    'Fm7': ['b', 1, 3, 3, 1, 1, 1],
    'Gm7': [3, 3, 0, 0, 1, 3],
    'Am7': [-1, 0, 2, 2, 1, 0],
    'Bm7': [-1, 2, 3, 4, 3, 2],
    // maj7
    'Cmaj7': [-1, 3, 2, 0, 0, 0],
    'Dmaj7': [-1, -1, 0, 2, 2, 2],
    'Emaj7': [0, 2, 2, 1, 0, 0],
    'Fmaj7': ['b', 1, 3, 2, 1, 1, 1],
    'Gmaj7': [3, 2, 0, 0, 0, 2],
    'Amaj7': [-1, 0, 2, 2, 2, 0],
    'Bmaj7': [-1, 2, 3, 4, 4, 2],
    // sus4
    'Csus4': [-1, 3, 3, 0, 1, 3],
    'Dsus4': [-1, -1, 0, 2, 3, 3],
    'Esus4': [0, 2, 2, 2, 0, 0],
    'Fsus4': ['b', 1, 3, 3, 2, 1, 1],
    'Gsus4': [3, 2, 0, 0, 1, 3],
    'Asus4': [-1, 0, 2, 2, 3, 0],
    'Bsus4': [-1, 2, 3, 4, 4, 2],
};

function getChordPosition(chordName: string): (number | 'b')[] | null {
    // Normalizar: eliminar "maj" para maj7, etc.
    let cleanName = chordName;
    if (cleanName.includes('maj7')) cleanName = cleanName.replace('maj7', 'maj7');
    // Buscar en el diccionario exacto
    if (CHORD_POSITIONS[cleanName]) return CHORD_POSITIONS[cleanName];
    // Si no, intentar con la raíz y tipo
    const root = cleanName.charAt(0);
    let suffix = cleanName.substring(1);
    // Si hay alteración (ej: C#m7 => C# + m7)
    if (cleanName.length > 1 && (cleanName[1] === '#' || cleanName[1] === 'b')) {
        const rootWithAlt = cleanName.substring(0, 2);
        suffix = cleanName.substring(2);
        const key = rootWithAlt + suffix;
        if (CHORD_POSITIONS[key]) return CHORD_POSITIONS[key];
    }
    // Si no, intentar solo la raíz con el tipo (ej: Cm7 -> C + m7)
    if (CHORD_POSITIONS[root + suffix]) return CHORD_POSITIONS[root + suffix];
    // Si no, devolver mayor simple
    if (CHORD_POSITIONS[root]) return CHORD_POSITIONS[root];
    return null;
}

export function GuitarChordDiagram({ chordName, width = 150 }: GuitarChordDiagramProps) {
    const position = useMemo(() => {
        return getChordPosition(chordName);
    }, [chordName]);

    // Si no hay posición, mostrar un mensaje
    if (!position) {
        return <div className="text-sm text-gray-500">Acorde no disponible</div>;
    }

    const strings = 6;
    const frets = 4; // mostramos 4 trastes
    const boxWidth = width / (strings + 1);
    const boxHeight = boxWidth * 0.9;

    // Determinar si hay cejilla: el primer elemento es 'b' y luego un número
    let barreFret: number | null = null;
    let fingerPositions: (number | 'b')[] = position;
    if (position[0] === 'b' && position.length > 1 && typeof position[1] === 'number') {
        barreFret = position[1] as number;
        fingerPositions = position.slice(1);
    } else {
        fingerPositions = position;
    }

    // Asegurar que tenemos 6 valores (las cuerdas)
    while (fingerPositions.length < 6) {
        fingerPositions.push(-1);
    }

    return (
        <div className="inline-block bg-white dark:bg-gray-100 rounded-lg p-2 shadow" style={{ width }}>
            <svg viewBox={`0 0 ${width} ${boxHeight * (frets + 1.5)}`} className="w-full h-auto">
                {/* Líneas horizontales (trastes) */}
                {Array.from({ length: frets + 1 }, (_, i) => (
                    <line
                        key={`fret-${i}`}
                        x1={boxWidth * 0.5}
                        y1={boxHeight * (i + 0.5)}
                        x2={boxWidth * (strings + 0.5)}
                        y2={boxHeight * (i + 0.5)}
                        stroke="#333"
                        strokeWidth={i === 0 ? 3 : 1}
                    />
                ))}
                {/* Líneas verticales (cuerdas) */}
                {Array.from({ length: strings }, (_, i) => (
                    <line
                        key={`string-${i}`}
                        x1={boxWidth * (i + 1)}
                        y1={boxHeight * 0.5}
                        x2={boxWidth * (i + 1)}
                        y2={boxHeight * (frets + 0.5)}
                        stroke="#333"
                        strokeWidth={1.5}
                    />
                ))}
                {/* Marcadores de trastes */}
                {[3, 5, 7, 9].map(fret => {
                    if (fret <= frets) {
                        const x = boxWidth * (strings / 2 + 0.5);
                        const y = boxHeight * (fret + 0.5);
                        return <circle key={`dot-${fret}`} cx={x} cy={y} r={4} fill="#ccc" />;
                    }
                })}

                {/* Dibujar cejilla si existe */}
                {barreFret !== null && (
                    <rect
                        x={boxWidth * 0.8}
                        y={boxHeight * (barreFret - 0.3)}
                        width={boxWidth * (strings - 0.6)}
                        height={boxHeight * 0.6}
                        rx={4}
                        fill="#3b82f6"
                        opacity={0.4}
                    />
                )}

                {/* Dibujar dedos */}
                {fingerPositions.map((fret, stringIndex) => {
                    if (fret === -1 || fret === 'b') return null; // no tocar
                    const numFret = fret as number;
                    const x = boxWidth * (stringIndex + 1);
                    // y = centro del espacio entre trastes: (fret - 0.5) * boxHeight + boxHeight * 0.5? 
                    // Mejor: y = (fret - 0.5) * boxHeight + boxHeight * 0.5 => fret * boxHeight
                    const y = numFret * boxHeight; // porque el primer traste empieza en boxHeight * 0.5, pero queremos centro del espacio
                    // Más preciso: y = (fret - 0.5) * boxHeight + boxHeight * 0.5 = fret * boxHeight
                    // Para que el círculo esté en medio del espacio entre trastes:
                    const yPos = (numFret - 0.5) * boxHeight + boxHeight * 0.5;
                    if (fret === 0) {
                        // cuerda al aire
                        return (
                            <circle key={`open-${stringIndex}`} cx={x} cy={boxHeight * 0.25} r={6} fill="none" stroke="#333" strokeWidth={2} />
                        );
                    }
                    // si es cejilla y estamos en una cuerda que no sea la primera, no dibujamos círculo adicional (ya está la cejilla)
                    if (barreFret !== null && stringIndex > 0 && fret === barreFret) {
                        return null;
                    }
                    // dedo normal
                    return (
                        <circle key={`finger-${stringIndex}`} cx={x} cy={yPos} r={8} fill="#3b82f6" stroke="#1e40af" strokeWidth={2} />
                    );
                })}

                {/* Etiqueta del acorde */}
                <text x={width / 2} y={boxHeight * (frets + 1.2)} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">
                    {chordName}
                </text>
            </svg>
        </div>
    );
}