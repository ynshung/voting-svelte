import { writable } from 'svelte/store';
import { db } from "../firebase";
import { onValue, ref } from "firebase/database";

interface CurrentBallot {
    position_name: string;
    candidates: string[];
    id: string;
}

export const currentBallot = writable<CurrentBallot | null>({} as CurrentBallot);

const currentBallotRef = ref(db, "ballots/current");

onValue(currentBallotRef, (snapshot) => {
    const newCurrentBallot: CurrentBallot = snapshot.val();
    currentBallot.set(newCurrentBallot);
});
