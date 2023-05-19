<script lang="ts">
    import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
    import { db, auth } from "../../firebase";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";

    onMount(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem("emailForSignIn");
            if (!email) {
                email =
                    window.prompt(
                        "Please provide your email for confirmation"
                    ) || "";
            }
            signInWithEmailLink(auth, email, window.location.href)
                .then((result) => {
                    window.localStorage.removeItem("emailForSignIn");
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: "You have successfully verified your email address! Logging you in...",
                    }).then(() => {
                        window.location.href = "/";
                    });
                })
                .catch((error) => {
                    if (error.code === 'auth/internal-error' && error.message.includes("Unauthorized email")) {
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: "You are not authorized to enter the platform. Please use your USM email address.",
                        }).then(() => {
                            window.location.href = "/";
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: error.message,
                        }).then(() => {
                            window.location.href = "/";
                        });
                    }
                });
        }
    });
</script>
