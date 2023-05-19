<script lang="ts">
    import { onAuthStateChanged } from "firebase/auth";
    import { auth } from "../../firebase";
    import CandidateList from "../../components/CandidateList.svelte";
    import { onMount } from "svelte";
    import BallotList from "../../components/BallotList.svelte";

    onMount(() => {
        onAuthStateChanged(auth, (user) => {
            user?.getIdTokenResult().then((idTokenResult) => {
                if (!!!idTokenResult.claims.admin) {
                    window.location.href = "/";
                }
            });
        });
    });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 mx-4 gap-16">
    <BallotList />
    <CandidateList />
</div>
