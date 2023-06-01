<script lang="ts">
    import { sendSignInLinkToEmail, signInWithEmailAndPassword } from "firebase/auth";
    import { auth, functions } from "../firebase";
    import Swal from 'sweetalert2'
    import { onMount } from "svelte";
    import { httpsCallable } from "firebase/functions";

    let loading = false;
    let loginWithPassword = false;

    function login(event: SubmitEvent) {
        loading = true;
        const input = event.target as HTMLFormElement;
        const email = input.email.value;

        if (!loginWithPassword) {
            const checkAuthorized = httpsCallable(functions, "checkAuthorized");
            checkAuthorized({email: email}).then((result) => {
                if (result.data) {
                    sendSignInLinkToEmail(auth, email, {
                        url: window.location.href + "verify",
                        handleCodeInApp: true
                    }).then(() => {
                        window.localStorage.setItem("emailForSignIn", email);
                        Swal.fire({
                            icon: 'success',
                            title: 'Email sent',
                            text: 'Check your email for the login link. Make sure to check your spam folder as well!',
                        });
                    }).catch((error) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: error,
                        });
                    }).finally(() => {
                        loading = false;
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        html: `You are not authorized to enter the platform. Please use your USM email address.<br/>Contact us if you think this is a mistake.`,
                    });
                    loading = false;
                }
            }).catch((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: error,
                });
                    loading = false;
            });

        } else {
            const password = input.password.value;
            signInWithEmailAndPassword(auth, email, password).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'You have successfully logged in.',
                });
            }).catch((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: error,
                });
            });
        }
    }

    onMount(() => {
        // If the query contains "password", show the password input
        if (window.location.search.includes("password")) {
            loginWithPassword = true;
        }
    })
</script>


<div class="card">
    <div class="card-body">
        <!-- Input: Email and login button -->
        <form class="input-group flex justify-center" on:submit|preventDefault={login}>
            <div class="form-control">
                <div class="input-group">
                    <input type="email" id="email" placeholder="USM Email" class="form-control input input-bordered w-60" required />
                    <input type="password" id="password" placeholder="Password" class="form-control input input-bordered w-60" class:hidden={!loginWithPassword} />
                    <input type="submit" value="Login" class="btn btn-primary" disabled={loading} />
                </div>
            </div>
        </form>
        <div>
            <p class="text-xs text-center mb-1">Only USM CS undergraduates are allowed to enter the voting platform.</p>
            <p class="text-xs text-center">If you face any issue, you may fill in <a href="https://docs.google.com/forms/d/e/1FAIpQLSeWjbCJUjk_FwGh_JdltA2mQX_2d4XTVpapu59AmKqefAFyOg/viewform?usp=sf_link" target="_blank" class="link hover:text-primary-content transition">this form</a>.</p>
        </div>
    </div>
</div>
