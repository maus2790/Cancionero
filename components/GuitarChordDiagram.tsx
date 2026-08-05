'use client';

import { useMemo } from 'react';

export interface ChordPosition {
    barre: number | null;
    fingers: (number | -1)[];
    baseFret: number;
}

interface GuitarChordDiagramProps {
    chordName: string;
    width?: number;
    positions?: ChordPosition | null;
}

export function GuitarChordDiagram({ chordName, width = 160, positions }: GuitarChordDiagramProps) {
    const position = useMemo(() => {
        if (positions) {
            const fingers = [...positions.fingers];
            while (fingers.length < 6) fingers.push(-1);
            return {
                barre: positions.barre,
                fingers,
                baseFret: positions.baseFret ?? 1,
            };
        }
        return null;
    }, [positions]);

    if (!position) {
        return <div className="text-sm text-gray-500">Sin posición</div>;
    }

    const { barre, fingers, baseFret } = position;
    const strings = 6;
    const frets = 5;
    const boxWidth = width / (strings + 1);
    const boxHeight = boxWidth * 0.7;

    const leftMargin = boxWidth * 0.8;
    const topMargin = boxHeight * 0.8;
    const svgWidth = width + leftMargin;
    const svgHeight = boxHeight * (frets + 1) + topMargin;

    return (
        <div className="inline-block bg-white dark:bg-gray-100 rounded-lg p-1 shadow" style={{ width: svgWidth }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                <g transform={`translate(${leftMargin}, ${topMargin})`}>
                    {/* Trastes */}
                    {Array.from({ length: frets + 1 }, (_, i) => (
                        <line
                            key={`fret-${i}`}
                            x1={0}
                            y1={boxHeight * i}
                            x2={boxWidth * strings}
                            y2={boxHeight * i}
                            stroke="#333"
                            strokeWidth={i === 0 ? 3 : 1}
                        />
                    ))}
                    {/* Cuerdas */}
                    {Array.from({ length: strings }, (_, i) => (
                        <line
                            key={`string-${i}`}
                            x1={boxWidth * (i + 0.5)}
                            y1={0}
                            x2={boxWidth * (i + 0.5)}
                            y2={boxHeight * frets}
                            stroke="#333"
                            strokeWidth={1.5}
                        />
                    ))}
                    {/* Puntos guía */}
                    {[3, 5].map(relativeFret => {
                        if (relativeFret >= 1 && relativeFret <= frets) {
                            const x = boxWidth * (strings / 2);
                            const y = boxHeight * (relativeFret - 0.5);
                            return <circle key={`dot-${relativeFret}`} cx={x} cy={y} r={4} fill="#ccc" />;
                        }
                        return null;
                    })}
                    {/* Cejilla */}
                    {barre !== null && (() => {
                        const relativeBarre = barre - baseFret + 1;
                        if (relativeBarre >= 1 && relativeBarre <= frets) {
                            const y = boxHeight * (relativeBarre - 0.5);
                            return (
                                <rect
                                    x={boxWidth * 0.2}
                                    y={y - boxHeight * 0.35}
                                    width={boxWidth * (strings - 0.4)}
                                    height={boxHeight * 0.7}
                                    rx={4}
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                    stroke="#1e40af"
                                    strokeWidth={2}
                                />
                            );
                        }
                        return null;
                    })()}
                    {/* Dedos */}
                    {fingers.map((absoluteFret, stringIndex) => {
                        if (absoluteFret === -1) return null;
                        const x = boxWidth * (stringIndex + 0.5);
                        if (absoluteFret === 0) {
                            return (
                                <circle
                                    key={`open-${stringIndex}`}
                                    cx={x}
                                    cy={-boxHeight * 0.3}
                                    r={6}
                                    fill="none"
                                    stroke="#333"
                                    strokeWidth={2}
                                />
                            );
                        }
                        const relativeFret = absoluteFret - baseFret + 1;
                        if (relativeFret >= 1 && relativeFret <= frets) {
                            const y = boxHeight * (relativeFret - 0.5);
                            return (
                                <circle
                                    key={`finger-${stringIndex}`}
                                    cx={x}
                                    cy={y}
                                    r={7}
                                    fill="#3b82f6"
                                    stroke="#1e40af"
                                    strokeWidth={2}
                                />
                            );
                        }
                        return null;
                    })}
                </g>
                {/* Número de traste base: centrado exactamente entre primer y segundo traste */}
                {baseFret > 1 && (
                    <text
                        x={leftMargin * 0.25}
                        y={boxHeight * 0.5 + topMargin}
                        fontSize={16}
                        fontWeight="bold"
                        fill="#3b82f6"
                        textAnchor="middle"
                        dominantBaseline="central"
                    >
                        {baseFret}
                    </text>
                )}
            </svg>
        </div>
    );
}