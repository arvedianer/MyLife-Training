import { useState, useEffect } from 'react';
import type { Exercise } from '@/types/exercise';

export function useExerciseDatabase() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/data/exercises.json')
            .then((res) => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then((data: Exercise[]) => {
                setExercises(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch exercises', err);
                setError('Fehler beim Laden der Übungsdatenbank.');
                setLoading(false);
            });
    }, []);

    return { exercises, loading, error };
}
