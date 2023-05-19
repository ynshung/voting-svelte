import { writable } from 'svelte/store';
import { db } from "../firebase";
import { onChildAdded, onChildChanged, onChildRemoved, ref } from "firebase/database";

interface Ballot {
    position_name: string;
    votes: Record<string, number>;
}

export const ballots = writable<Record<string, Ballot>>({});
export const ballotsUID = writable<string[]>([]);

const ballotsRef = ref(db, "ballots");

onChildAdded(ballotsRef, (snapshot) => {
    const newBallot: Ballot = snapshot.val();
    ballots.update((currentballots) => {
        const updatedballots = { ...currentballots, [snapshot.key!]: newBallot };
        ballotsUID.set(Object.keys(updatedballots));
        return updatedballots;
    });
});

onChildChanged(ballotsRef, (snapshot) => {
    const updatedBallot: Ballot = snapshot.val();
    ballots.update((currentballots) => {
        const updatedballots = { ...currentballots, [snapshot.key!]: updatedBallot };
        return updatedballots;
    });
});

onChildRemoved(ballotsRef, (snapshot) => {
    ballots.update((currentballots) => {
        const updatedballots = { ...currentballots };
        delete updatedballots[snapshot.key!];
        ballotsUID.set(Object.keys(updatedballots));
        return updatedballots;
    });
});

