<script lang="ts">
    import { onAuthStateChanged } from "firebase/auth";
    import Login from "../components/Login.svelte";
    import { auth, db, functions } from "../firebase";
    import { child, get, onValue, ref } from "firebase/database";
    import Swal from "sweetalert2";
    import { currentBallot } from "../stores/currentBallot";
    import { candidates } from "../stores/candidates";
    import { httpsCallable } from "firebase/functions";

    let loggedIn = false;
    let enteredInfo = false;

    let votedRecord: Record<string, boolean> = {};

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loggedIn = true;

            get(child(ref(db), `voters/${user?.uid}`))
                .then((snapshot) => {
                    enteredInfo = snapshot.exists();

                    if (enteredInfo) {
                        onValue(child(ref(db), `voted/${user.uid}`), (snapshot) => {
                            votedRecord = snapshot.exists() ? snapshot.val() : {};
                        });
                    }
                })
                .catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Something went wrong while retrieving your data: ${error.message}`,
                    });
                });
        } else {
            loggedIn = false;
        }
    });

    const voteCandidate = (candidate: string) => {

        // Confirm with user, show the current position and the candidate's name and image
        Swal.fire({
            icon: "question",
            title: "Are you sure?",
            html: `You are voting for <b>${$candidates[candidate].name}</b> for <b>${$currentBallot?.position_name}</b>.`,
            showCancelButton: true,
            confirmButtonText: "Yes, vote!",
            cancelButtonText: "No, cancel!",
        }).then((result) => {
            if (result.isConfirmed) {
                const vote = httpsCallable(functions, "voteCandidate");
                vote({ballot: $currentBallot?.id, candidate: candidate})
                    .then((result) => {
                        Swal.fire({
                            icon: "success",
                            title: "Success!",
                            text: `You have voted for ${$candidates[candidate].name}!`,
                        });
                    })
                    .catch((error) => {
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: `${error.message}`,
                        });
                    });
            }
        });     
    }
</script>

{#if loggedIn}
    <div class="flex flex-col items-center gap-4 mx-8">
        <h1 class="text-3xl font-bold">USM CS Society AGM 2023</h1>
        {#if enteredInfo}
            {#if $currentBallot}
                {@const voted = $currentBallot.id in votedRecord}
                <div class="alert alert-info shadow-lg w-min mt-6 mb-4 {voted ? 'alert-success' : 'alert-info'}">
                    <div>
                        {#if voted}
                            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {/if}
                        <div class="ml-1">
                            <p class="whitespace-nowrap mr-16 text-lg">Current Position: <span class="font-bold">{$currentBallot.position_name}</span></p>
                            {#if voted}
                                <p class="text-sm">You have already voted!</p>
                            {/if}
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap items-end gap-16 justify-center mx-8">
                    {#each $currentBallot.candidates as candidate}
                        <div class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <h2 class="text-xl font-bold w-64">{$candidates[candidate].name}</h2>
                            </div>
                            <button on:click={() => {if (!voted) voteCandidate(candidate)}}>
                                <img
                                    src="{$candidates[candidate].image}"
                                    alt="{$candidates[candidate].name}"
                                    class="w-64 h-64 rounded-lg shadow-lg transition {voted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}"
                                />
                            </button>
                        </div>
                    {/each}
                </div>
            {:else}
                <br/>
                <p>No ballot ongoing.</p>
            {/if}

        {:else}
            <div class="alert alert-warning shadow-lg">
                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current flex-shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        /></svg
                    >
                    <span>Please complete your profile!</span>
                </div>
            </div>
        {/if}
        <br/>
        <a href="/profile" class="gap-3 rounded-lg shadow px-4 py-2 btn mb-8">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                class="w-4 fill-current"
                ><path
                    d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"
                /></svg
            >Profile
        </a>
    </div>
{:else}
    <Login />
{/if}
