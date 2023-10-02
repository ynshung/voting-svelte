<script lang="ts">
    import { onAuthStateChanged } from "firebase/auth";
    import Login from "../components/Login.svelte";
    import { auth, db, functions } from "../firebase";
    import { child, get, onValue, ref } from "firebase/database";
    import Swal from "sweetalert2";
    import { currentBallot } from "../stores/currentBallot";
    import { candidates } from "../stores/candidates";
    import { httpsCallable } from "firebase/functions";
    import { onMount } from "svelte";

    let loggedIn = false;
    let enteredInfo = false;
    let isAdmin = false;

    let votedRecord: Record<string, boolean> = {};
    let message = "";

    onValue(child(ref(db), "message"), (snapshot) => {
        message = snapshot.val();
    });

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
            
            user.getIdTokenResult().then((idTokenResult) => {
                isAdmin = !!idTokenResult.claims.admin;
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
        <h1 class="text-3xl font-bold">Svelte Voting Platform</h1>
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
                <div class="text-center">{@html message}</div>
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
        <div class="flex gap-4">
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
            {#if isAdmin}
                <a href="/admin" class="gap-3 rounded-lg shadow px-4 py-2 btn mb-8" data-sveltekit-reload>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-6 fill-current"><path d="M224 0a128 128 0 1 1 0 256A128 128 0 1 1 224 0zM178.3 304h91.4c11.8 0 23.4 1.2 34.5 3.3c-2.1 18.5 7.4 35.6 21.8 44.8c-16.6 10.6-26.7 31.6-20 53.3c4 12.9 9.4 25.5 16.4 37.6s15.2 23.1 24.4 33c15.7 16.9 39.6 18.4 57.2 8.7v.9c0 9.2 2.7 18.5 7.9 26.3H29.7C13.3 512 0 498.7 0 482.3C0 383.8 79.8 304 178.3 304zM436 218.2c0-7 4.5-13.3 11.3-14.8c10.5-2.4 21.5-3.7 32.7-3.7s22.2 1.3 32.7 3.7c6.8 1.5 11.3 7.8 11.3 14.8v30.6c7.9 3.4 15.4 7.7 22.3 12.8l24.9-14.3c6.1-3.5 13.7-2.7 18.5 2.4c7.6 8.1 14.3 17.2 20.1 27.2s10.3 20.4 13.5 31c2.1 6.7-1.1 13.7-7.2 17.2l-25 14.4c.4 4 .7 8.1 .7 12.3s-.2 8.2-.7 12.3l25 14.4c6.1 3.5 9.2 10.5 7.2 17.2c-3.3 10.6-7.8 21-13.5 31s-12.5 19.1-20.1 27.2c-4.8 5.1-12.5 5.9-18.5 2.4l-24.9-14.3c-6.9 5.1-14.3 9.4-22.3 12.8l0 30.6c0 7-4.5 13.3-11.3 14.8c-10.5 2.4-21.5 3.7-32.7 3.7s-22.2-1.3-32.7-3.7c-6.8-1.5-11.3-7.8-11.3-14.8V454.8c-8-3.4-15.6-7.7-22.5-12.9l-24.7 14.3c-6.1 3.5-13.7 2.7-18.5-2.4c-7.6-8.1-14.3-17.2-20.1-27.2s-10.3-20.4-13.5-31c-2.1-6.7 1.1-13.7 7.2-17.2l24.8-14.3c-.4-4.1-.7-8.2-.7-12.4s.2-8.3 .7-12.4L343.8 325c-6.1-3.5-9.2-10.5-7.2-17.2c3.3-10.6 7.7-21 13.5-31s12.5-19.1 20.1-27.2c4.8-5.1 12.4-5.9 18.5-2.4l24.8 14.3c6.9-5.1 14.5-9.4 22.5-12.9V218.2zm92.1 133.5a48.1 48.1 0 1 0 -96.1 0 48.1 48.1 0 1 0 96.1 0z"/></svg>
                    Admin Dashboard
                </a>
            {/if}
        </div>
            <div>
                <p class="text-xs text-center mb-1">This is a footer, you may add any text or <a href="https://example.com" target="_blank" class="link hover:text-primary-content transition">link</a> here.</p>
                <p class="text-xs text-center">© 2023 <a href="https://example.com" class="link hover:text-primary-content transition">Example Corporation</a></p>    
            </div>
    </div>
{:else}
    <Login />
{/if}
