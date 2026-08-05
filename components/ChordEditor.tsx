'use client';

import { useState, useEffect } from 'react';

export interface ChordEditorData {
    barre: number | null;
    fingers: (number | -1)[];
    baseFret: number;
}

interface ChordEditorProps {
    initialPositions?: ChordEditorData;
    onChange?: (positions: ChordEditorData) => void;
    width?: number;
}

export function ChordEditor({ initialPositions, onChange, width = 400 }: ChordEditorProps) {
    const strings = 6;
    const frets = 5;
    const boxWidth = width / (strings + 1);
    const boxHeight = boxWidth * 0.7;

    const [baseFret, setBaseFret] = useState<number>(
        initialPositions?.baseFret ?? 1
    );
    const [fingers, setFingers] = useState<(number | -1)[]>(
        () => initialPositions?.fingers || Array(6).fill(-1)
    );
    const [barre, setBarre] = useState<number | null>(
        () => initialPositions?.barre ?? null
    );

    useEffect(() => {
        if (onChange) {
            onChange({ barre, fingers, baseFret });
        }
    }, [fingers, barre, baseFret, onChange]);

    const isFretVisible = (absoluteFret: number) => {
        return absoluteFret >= baseFret && absoluteFret <= baseFret + frets - 1;
    };

    const isBehindBarre = (absoluteFret: number) => {
        if (barre === null) return false;
        return absoluteFret < barre;
    };

    const toggleFinger = (stringIndex: number, absoluteFret: number) => {
        if (isBehindBarre(absoluteFret)) return;
        if (!isFretVisible(absoluteFret)) return;
        setFingers(prev => {
            const copy = [...prev];
            if (copy[stringIndex] === absoluteFret) {
                copy[stringIndex] = -1;
            } else {
                copy[stringIndex] = absoluteFret;
            }
            return copy;
        });
    };

    const setBarreFret = (absoluteFret: number | null) => {
        if (absoluteFret !== null && !isFretVisible(absoluteFret)) return;
        setBarre(absoluteFret);
    };

    const clearAll = () => {
        setFingers(Array(6).fill(-1));
        setBarre(null);
    };

    const barreOptions = Array.from({ length: frets }, (_, i) => baseFret + i);

    const leftMargin = boxWidth * 0.8;
    const topMargin = boxHeight * 0.8;
    const svgWidth = width + leftMargin;
    const svgHeight = boxHeight * (frets + 1) + topMargin;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex flex-col items-center">
                <div className="flex flex-wrap gap-4 mb-4 items-center w-full">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Traste base:</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={baseFret}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setBaseFret(Math.max(1, val));
                            }}
                            className="w-16 px-2 py-1 border rounded-lg text-sm bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Cejilla:</span>
                        <select
                            value={barre ?? ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    setBarreFret(null);
                                } else {
                                    setBarreFret(Number(val));
                                }
                            }}
                            className="px-2 py-1 border rounded-lg text-sm bg-white dark:bg-gray-700"
                        >
                            <option value="">Sin</option>
                            {barreOptions.map(f => (
                                <option key={f} value={f}>{f}º traste</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={clearAll}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                        Limpiar
                    </button>
                </div>

                <div style={{ width: svgWidth }} className="relative">
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
                                    stroke="#555"
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
                                    stroke="#555"
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
                                        <>
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
                                                className="cursor-pointer"
                                                onClick={() => setBarreFret(null)}
                                            />
                                            <text
                                                x={boxWidth * (strings / 2)}
                                                y={y - boxHeight * 0.5 - 4}
                                                fontSize={12}
                                                fill="#1e40af"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                            >
                                                {barre}º
                                            </text>
                                        </>
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
                                            r={8}
                                            fill="#3b82f6"
                                            stroke="#1e40af"
                                            strokeWidth={2}
                                            className="cursor-pointer"
                                            onClick={() => toggleFinger(stringIndex, absoluteFret)}
                                        />
                                    );
                                }
                                return null;
                            })}
                            {/* Áreas clickeables */}
                            {Array.from({ length: strings }, (_, s) =>
                                Array.from({ length: frets }, (_, f) => {
                                    const absoluteFret = baseFret + f;
                                    if (isBehindBarre(absoluteFret)) return null;
                                    const x = boxWidth * (s + 0.5);
                                    const y = boxHeight * (f + 0.5);
                                    return (
                                        <circle
                                            key={`click-${s}-${absoluteFret}`}
                                            cx={x}
                                            cy={y}
                                            r={boxHeight * 0.35}
                                            fill="transparent"
                                            className="cursor-pointer hover:fill-blue-200/30"
                                            onClick={() => toggleFinger(s, absoluteFret)}
                                        />
                                    );
                                })
                            )}
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

                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg w-full text-xs font-mono overflow-x-auto">
                    {JSON.stringify({ barre, fingers, baseFret })}
                </div>
            </div>
        </div>
    );
}