<script lang="ts">
    import { db } from "../firebase";
    import { ref, update, remove, set, push, get } from "firebase/database";
    import { candidates } from "../stores/candidates";
    import { ballots, ballotsUID } from "../stores/ballots";
    import { currentBallot } from "../stores/currentBallot";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";

    let selectedBallot = "";

    const addCandidate = () => {
        const candidatesNotInBallot = $ballots[selectedBallot].votes ? Object.keys($candidates).filter((candidateUID) => {
            return !Object.keys($ballots[selectedBallot].votes).includes(candidateUID);
        }) : Object.keys($candidates);

        if (candidatesNotInBallot.length === 0) {
            Swal.fire({
                title: "Oops...",
                text: `There are no more candidates to add.`,
            });
            return;
        }

        Swal.fire({
            title: "Add Candidate",
            html: `
                <select id="candidate" class="swal2-input">
                    ${candidatesNotInBallot.map((candidateUID) => {
                        return `<option value="${candidateUID}">${$candidates[candidateUID].name}</option>`;
                    })}
                </select>
            `,
            confirmButtonText: "Add",
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const candidateUID = (document.getElementById("candidate") as HTMLSelectElement).value;

                if (candidateUID === "") {
                    Swal.showValidationMessage("Please select a candidate");
                }

                return candidateUID;
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const candidateUID = result.value;

                const ballotRef = ref(db, `ballots/${selectedBallot}/votes`);
                update(ballotRef, {
                    [candidateUID!]: 0,
                }).catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Error while adding candidate: ${error.message}`,
                    });
                });
            }
        });

    };

    const removeCandidate = () => {
        const candidatesInBallot = Object.keys($ballots[selectedBallot].votes);

        Swal.fire({
            title: "Remove Candidate",
            html: `
                <select id="candidate" class="swal2-input">
                    ${candidatesInBallot.map((candidateUID) => {
                        return `<option value="${candidateUID}">${$candidates[candidateUID].name}</option>`;
                    })}
                </select>
            `,
            confirmButtonText: "Remove",
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const candidateUID = (document.getElementById("candidate") as HTMLSelectElement).value;

                if (candidateUID === "") {
                    Swal.showValidationMessage("Please select a candidate");
                }

                return candidateUID;
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const candidateUID = result.value;

                const ballotRef = ref(db, `ballots/${selectedBallot}/votes`);
                update(ballotRef, {
                    [candidateUID!]: null,
                }).catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Error while removing candidate: ${error.message}`,
                    });
                });
            }
        });
            
    };

    const createBallot = () => {
        Swal.fire({
            title: "Create Ballot",
            input: "text",
            inputLabel: "Position Name",
            inputValue: "",
            confirmButtonText: "Create",
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: (position) => {
                if (position === "") {
                    Swal.showValidationMessage("Please enter a position name");
                }

                return position;
            },
        }).then((result) => {
            if (result.isConfirmed) {
                const position = result.value;

                const ballotRef = ref(db, `ballots`);
                set(
                    push(ballotRef), {
                        position_name: position,
                        votes: {},
                    },
                ).catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Error while creating ballot: ${error.message}`,
                    });
                });
            }
        });
    };

    const removeBallot = () => {
        Swal.fire({
            title: "Remove Ballot",
            html: `
                <p>Are you sure you want to remove this ballot?</p>
                <p>This will remove the ballot.</p>
            `,
            confirmButtonText: "Remove",
            focusConfirm: false,
            showCancelButton: true,
        }).then((result) => {
            if (result.isConfirmed) {
                const ballotRef = ref(db, `ballots/${selectedBallot}`);
                remove(ballotRef).then(() => {
                    selectedBallot = "";
                }).catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Error while removing ballot: ${error.message}`,
                    });
                });
            }
        });
    };

    const resetBallot = () => {
        Swal.fire({
            title: "Reset Ballot",
            html: `
                <p>Are you sure you want to reset this ballot?</p>
                <p>This will set all votes to zero but does not reset the voter's vote.</p>
            `,
            confirmButtonText: "Reset",
            focusConfirm: false,
            showCancelButton: true,
        }).then((result) => {
            if (result.isConfirmed) {
                const ballotRef = ref(db, `ballots/${selectedBallot}/votes`);
                update(ballotRef, {
                    ...Object.keys($ballots[selectedBallot].votes).reduce((acc: Record<string, number>, candidateUID) => {
                        acc[candidateUID] = 0;
                        return acc;
                    }, {}),
                }).catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Error while resetting ballot: ${error.message}`,
                    });
                });
            }
        });
    };

    const toggleActive = () => {
        const currentBallotRef = ref(db, `ballots/current`);
        
        // Check if there is any candidate in the ballot
        if (!$ballots[selectedBallot].votes) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: `There are no candidates in this ballot.`,
            });
            return;
        }

        if ($currentBallot) {
            // If the selected ballot is the same as the current ballot
            if ($currentBallot.id === selectedBallot) {
                Swal.fire({
                    title: "Stop Ballot",
                    html: `
                        <p>Are you sure you want to stop the ballot of<br/><b>${$ballots[selectedBallot].position_name}</b>?</p>
                    `,
                    confirmButtonText: "Stop",
                    focusConfirm: false,
                    showCancelButton: true,
                }).then((result) => {
                    if (result.isConfirmed) {
                        remove(currentBallotRef).catch((error) => {
                            Swal.fire({
                                icon: "error",
                                title: "Oops...",
                                text: `Error while stopping ballot: ${error.message}`,
                            });
                        });
                    }
                });
            } else {
                // If the selected ballot is not the same as the current ballot
                Swal.fire({
                    title: "Start Ballot",
                    html: `
                        <p>Are you sure you want to start the ballot of<br/><b>${$ballots[selectedBallot].position_name}</b>?</p>
                        <br/>
                        <p>This will stop the ballot of<br/><b>${$currentBallot.position_name}</b>.</p>
                    `,
                    confirmButtonText: "Stop and Start",
                    focusConfirm: false,
                    showCancelButton: true,
                }).then((result) => {
                    if (result.isConfirmed) {
                        selectedBallotToActive();
                    }
                });
            }
        } else {
            Swal.fire({
                title: "Start Ballot",
                html: `
                    <p>Are you sure you want to start the ballot of<br/><b>${$ballots[selectedBallot].position_name}</b>?</p>
                `,
                confirmButtonText: "Start",
                focusConfirm: false,
                showCancelButton: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    selectedBallotToActive();
                }
            });
        }
    };

    const selectedBallotToActive = () => {
        const currentBallotRef = ref(db, `ballots/current`);
        set(currentBallotRef, {
            id: selectedBallot,
            position_name: $ballots[selectedBallot].position_name,
            candidates: Object.keys($ballots[selectedBallot].votes),
        }).catch((error) => {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: `Error while starting ballot: ${error.message}`,
            });
        });
    }

    onMount(() => {
        get(ref(db, `ballots/current`)).
            then((snapshot) => {
                if (snapshot.exists()) {
                    selectedBallot = snapshot.val().id;
                }
            });
    })

</script>

<div class="w-96">
    {#if selectedBallot !== ""}
        {@const ballot = $ballots[selectedBallot]}
        {@const voting = $currentBallot && $currentBallot.id === selectedBallot}
        <div class="flex flex-col items-center gap-4">
            <div class="flex flex-col items-center gap-4">
                <p class="text-2xl font-bold">{ballot.position_name}</p>
            </div>

            {#if ballot.votes}
                {@const totalVotes = Object.values(ballot.votes).reduce((a, b) => a + b, 0)}
                <div class="flex flex-col gap-4">
                    {#each Object.keys(ballot.votes) as candidateUID}
                        {@const candidate = $candidates[candidateUID]}
                        {@const percentage = ((ballot.votes[candidateUID] / totalVotes) * 100).toFixed(2)}
                        <div class="flex flex-row items-center gap-4">
                            <img src={candidate.image} alt={candidate.name} title={candidate.name} class="rounded-full h-24 w-24" />
                            <div >
                                <p class="text-xl">{candidate.name}</p>
                                <p class="flex flex-row gap-3 items-end"><span class="text-2xl font-bold">{ballot.votes[candidateUID]}</span>{percentage}%</p>
                            </div>
                        </div>
                    {/each}
                    <p>Total votes: <span class="font-bold">{totalVotes}</span></p>
                </div>
            {/if}
            <br/>
            {#if !voting}
                <div class="flex flex-row gap-4 items-center">
                    <h2 class="font-bold">Candidates:</h2>
                    <button class="btn btn-primary btn-sm" on:click={addCandidate}>Add</button>
                    <button class="btn btn-primary btn-sm" on:click={removeCandidate}>Remove</button>
                </div>
            {/if}
            <!-- Button: Reset, Remove -->
            <div class="flex flex-row gap-4 items-center">
                <h2 class="font-bold">Ballot:</h2>
                <button class="btn btn-primary btn-sm {!voting ? 'btn-success' : 'btn-error'}" on:click={toggleActive}>{!voting ? "Start" : "Stop"}</button>
                <button class="btn btn-primary btn-sm" on:click={resetBallot}>Reset</button>
                <button class="btn btn-primary btn-sm" on:click={removeBallot}>Remove</button>
            </div>
        </div>
    {/if}

    <br/>
    <hr class="divider"/>

    <!-- Menu of all ballots, show the position name only and make it clickable -->
    <div class="flex flex-col items gap-2">
        <p class="text-xl font-bold mb-1">List of Ballots</p>

        {#each $ballotsUID as ballotUID}
            {#if ballotUID !== "current"}
                {@const ballot = $ballots[ballotUID]}
                {@const selected = ballotUID === selectedBallot}
                <a href={null} on:click={() => selectedBallot = ballotUID} class="flex flex-row gap-2 items-center border-current border rounded-lg px-4 py-2 cursor-pointer {selected ? 'text-slate-50 bg-gray-950 dark:text-gray-950 dark:bg-slate-50' : ''}">
                    {#if $currentBallot && ballotUID === $currentBallot.id}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-5 h-5 animate-spin {selected ? 'fill-white dark:fill-gray-950': 'dark:fill-white'}"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>
                    {/if}
                    <p class="text-lg">{ballot.position_name}</p>
                </a>
            {/if}
        {/each}

        <button class="btn btn-primary btn-sm mt-4" on:click={createBallot}>Create</button>
    </div>
</div>

