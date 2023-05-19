import { writable } from 'svelte/store';
import { db } from "../firebase";
import { onChildAdded, onChildChanged, onChildRemoved, ref } from "firebase/database";

interface Candidate {
    name: string;
    image: string;
    imageRef: string;
};

export const candidates = writable<Record<string, Candidate>>({});
export const candidatesUID = writable<string[]>([]);

const candidatesRef = ref(db, "candidates");

onChildAdded(candidatesRef, (snapshot) => {
    const newCandidate: Candidate = snapshot.val();
    candidates.update((currentCandidates) => {
        const updatedCandidates = { ...currentCandidates, [snapshot.key!]: newCandidate };
        candidatesUID.set(Object.keys(updatedCandidates));
        return updatedCandidates;
    });
});

onChildChanged(candidatesRef, (snapshot) => {
    const updatedCandidate: Candidate = snapshot.val();
    candidates.update((currentCandidates) => {
        const updatedCandidates = { ...currentCandidates, [snapshot.key!]: updatedCandidate };
        return updatedCandidates;
    });
});

onChildRemoved(candidatesRef, (snapshot) => {
    candidates.update((currentCandidates) => {
        const updatedCandidates = { ...currentCandidates };
        delete updatedCandidates[snapshot.key!];
        candidatesUID.set(Object.keys(updatedCandidates));
        return updatedCandidates;
    });
});