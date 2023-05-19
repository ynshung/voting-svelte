<script lang="ts">
    import { onAuthStateChanged } from "firebase/auth";
    import { auth, db } from "../../firebase";
    import { child, ref, get, set } from "firebase/database";
    import Swal from "sweetalert2";
    import { onMount } from "svelte";

    let email = "";
    let name = "";
    let year: string = "0";
    let matric: number;

    onMount(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) email = user.email || "";
            else {
                window.location.href = "/";
            }

            get(child(ref(db), `voters/${user?.uid}`))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        name = snapshot.val().name;
                        year = snapshot.val().year.toString();
                        matric = snapshot.val().matric;
                    } else {
                        console.log("No data available");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    });

    const editProfile = () => {
        set(ref(db, `voters/${auth.currentUser?.uid}`), {
            email: email,
            name: name,
            year: parseInt(year.toString()),
            matric: matric,
        })
            .then(() => {
                Swal.fire({
                    icon: "success",
                    title: "Success",
                    text: "You have successfully updated your profile!",
                });
            })
            .catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: error.message,
                });
            });
    };

    const logOut = () => {
        auth.signOut()
            .then(() => {
                window.location.href = "/";
            })
            .catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: error.message,
                });
            });
    };
</script>

<div>
    <div class="flex flex-row gap-3 align-middle">
        <a href="/" class="w-8 h-8 rounded-full hover:bg-white hover:bg-opacity-10 transition">
            <svg
                class="mx-auto w-4 h-8 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                ><path
                    d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"
                /></svg
            >
        </a>
        <h2 class="text-2xl font-semibold mb-4">Edit Profile</h2>
    </div>
    <div class="w-96 mx-auto p-6 rounded-md shadow-md bg-base-300">
        <form on:submit|preventDefault={editProfile}>
            <div class="mb-4">
                <label for="Email">Email</label>
                <input
                    type="text"
                    id="email"
                    name="email"
                    class="input input-bordered mt-1 block w-full"
                    placeholder=""
                    disabled
                    bind:value={email}
                />
            </div>
    
            <div class="mb-4">
                <label for="name">Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    class="input input-bordered mt-1 block w-full"
                    placeholder=""
                    required
                    bind:value={name}
                />
            </div>
    
            <div class="mb-4">
                <label for="year">Year</label>
                <select
                    id="year"
                    name="year"
                    class="input input-bordered mt-1 block w-full"
                    required
                    bind:value={year}
                >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">Other</option>
                </select>
            </div>
    
            <div class="mb-4">
                <label for="matric">Matric Number</label>
                <input
                    type="number"
                    id="matric"
                    name="matric"
                    class="input input-bordered mt-1 block w-full"
                    required
                    bind:value={matric}
                />
            </div>
    
            <div class="flex justify-end">
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form>
    </div>
    <div class="flex justify-center mt-4">
        <button class="btn btn-sm btn-accent" on:click={logOut}> Log Out </button>
    </div>
</div>
