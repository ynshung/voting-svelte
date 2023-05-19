<script lang="ts">
    import { sendSignInLinkToEmail } from "firebase/auth";
    import { auth } from "../firebase";
    import Swal from 'sweetalert2'

    function login(event: SubmitEvent) {
        const input = event.target as HTMLFormElement;
        const email = input.email.value;
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
        });
    }
</script>


<div class="card">
    <div class="card-body">
        <!-- Input: Email and login button -->
        <form class="input-group flex justify-center" on:submit|preventDefault={login}>
            <div class="form-control">
                <div class="input-group">
                    <input type="email" id="email" placeholder="USM Email" class="form-control input input-bordered w-60" required />
                    <input type="submit" value="Login" class="btn btn-primary" />
                </div>
            </div>
        </form>
        <p class="text-xs text-center">Only USM CS undergraduates are allowed to enter the voting platform.</p>
    </div>
</div>
