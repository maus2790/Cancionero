'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createChord, updateChord } from '@/app/actions/chords';
import { ChordEditor, type ChordEditorData } from '@/components/ChordEditor';
import { ChordEditorPiano, type PianoData } from '@/components/ChordEditorPiano';
import { CHORD_TYPES, NOTE_OPTIONS, getChordName, normalizeNote } from '@/lib/constants';

type Instrument = 'guitar' | 'piano';

const emptyGuitar = (): ChordEditorData => ({ barre: null, fingers: Array(6).fill(-1), baseFret: 1 });
const emptyPiano = (): PianoData => ({ startingNote: 'C', notes: [] });

interface ChordFormModalProps {
    isOpen: boolean;
    chord?: any | null;
    initialInstrument: Instrument;
    onClose: () => void;
    onSaved: (chord: any) => void;
}

export function ChordFormModal({ isOpen, chord, initialInstrument, onClose, onSaved }: ChordFormModalProps) {
    const [instrument, setInstrument] = useState<Instrument>(initialInstrument);
    const [note, setNote] = useState('C');
    const [type, setType] = useState('major');
    const [guitar, setGuitar] = useState<ChordEditorData>(emptyGuitar());
    const [piano, setPiano] = useState<PianoData>(emptyPiano());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setInstrument(initialInstrument);
        setNote(normalizeNote(chord?.root || chord?.name?.charAt(0) || 'C'));
        setType(chord?.type || 'major');
        try {
            const value = chord?.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
            setGuitar(value ? { barre: value.barre ?? null, fingers: value.fingers || Array(6).fill(-1), baseFret: value.baseFret ?? 1 } : emptyGuitar());
        } catch { setGuitar(emptyGuitar()); }
        try {
            const value = chord?.pianoPositions ? JSON.parse(chord.pianoPositions) : null;
            setPiano(Array.isArray(value) ? { startingNote: 'C', notes: value } : value?.notes ? value : emptyPiano());
        } catch { setPiano(emptyPiano()); }
    }, [isOpen, chord, initialInstrument]);

    if (!isOpen) return null;
    const name = getChordName(note, type);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        const data = new FormData();
        data.append('name', name);
        data.append('root', note);
        data.append('type', type);
        if (instrument === 'guitar') data.append('guitarPositions', JSON.stringify(guitar));
        else data.append('pianoPositions', JSON.stringify(piano));

        try {
            const saved = chord ? await updateChord(chord.id, data) : await createChord(data);
            onSaved(saved);
            toast.success(chord ? 'Acorde actualizado' : 'Acorde creado');
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo guardar el acorde');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
            <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{chord ? 'Editar' : 'Nuevo'} acorde</h2>
                    <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <select value={note} onChange={(event) => setNote(event.target.value)} className="rounded-lg border p-2 dark:bg-gray-700">
                        {NOTE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border p-2 dark:bg-gray-700">
                        {CHORD_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </div>
                <div className="mt-4 flex w-fit rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                    {(['guitar', 'piano'] as const).map((value) => <button key={value} type="button" onClick={() => setInstrument(value)} className={`rounded-md px-4 py-2 text-sm ${instrument === value ? 'bg-white text-blue-600 shadow dark:bg-gray-600' : 'text-gray-500'}`}>{value === 'guitar' ? 'Guitarra' : 'Teclado'}</button>)}
                </div>
                <div className="mt-4 flex justify-center">{instrument === 'guitar' ? <ChordEditor initialPositions={guitar} onChange={setGuitar} width={400} /> : <ChordEditorPiano initialData={piano} onChange={setPiano} width={460} />}</div>
                <button disabled={saving} className="mt-5 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Guardando…' : `Guardar ${name}`}</button>
            </form>
        </div>
    );
}
