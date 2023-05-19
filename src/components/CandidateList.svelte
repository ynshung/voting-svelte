<script lang="ts">
    import { candidates, candidatesUID } from "../stores/candidates";
    import { db, storage } from "../firebase";
    import { push, ref, remove, set, update } from "firebase/database";
    import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
    import Swal from "sweetalert2";

    // @ts-ignore
    import FilePond, { registerPlugin } from 'svelte-filepond';
    import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
    import FilePondPluginImageResize from 'filepond-plugin-image-resize';
    import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
    import FilePondPluginImageTransform from 'filepond-plugin-image-transform';
    import FilePondPluginImageValidateSize from 'filepond-plugin-image-validate-size';
    import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
    import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

    import 'filepond/dist/filepond.min.css';
    import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

    registerPlugin(FilePondPluginImagePreview, FilePondPluginImageResize, FilePondPluginImageCrop, FilePondPluginImageTransform, FilePondPluginImageValidateSize, FilePondPluginImageExifOrientation, FilePondPluginFileValidateType);

    // @ts-ignore
    let pond;
    let name = 'filepond';
    let processedImg: Blob;
    function handleProcessedImg(file: any, output: Blob) {
        processedImg = output;
    }

    let cName = "";

    const addCandidate = (submit: SubmitEvent) => {
        const formData = new FormData(submit.target as HTMLFormElement);

        const candidateRef = ref(db, "candidates");
        const newCandidateRef = push(candidateRef);

        // @ts-ignore
        const fileName = pond.getFile().file.name;
        const imgRef = storageRef(storage, `candidates/${newCandidateRef.key}-${fileName}`);

        uploadBytes(imgRef, processedImg).then((snapshot) => {
            getDownloadURL(imgRef).then((url) => {
                set(newCandidateRef, {
                    name: formData.get("name") as string,
                    image: url,
                    imageRef: imgRef.fullPath,
                }).then(() => {
                    // @ts-ignore
                    pond.removeFile();
                    cName = "";
                }).catch((error) => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Error while adding candidate: ${error.message}`,
                    });
                });
            }).catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: `Error while retrieving image URL: ${error.message}`,
                });
            });
        }).catch((error) => {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: `Error while uploading image: ${error.message}`,
            });
        });
    };

    const editCandidate = (uid: string) => {
        const candidateRef = ref(db, `candidates/${uid}`);
        Swal.fire({
            title: 'Input name',
            input: 'text',
            inputPlaceholder: 'Enter name',
            inputValue: $candidates[uid].name,
            showCancelButton: true,
        }).then((nameResult) => {
            if (nameResult.isDismissed) return;
            update(candidateRef, {
                name: nameResult.value,
            });
        });
    };

    const deleteCandidate = (uid: string) => {

        Swal.fire({
            title: 'Are you sure?',
            html: `You are deleting <b>${$candidates[uid].name}</b>. You won't be able to revert this!`,
            icon: 'warning',
            showCancelButton: true,
            focusConfirm: false,
        }).then((result) => {
            if (result.isDismissed) return;

            const imgRef = storageRef(storage, $candidates[uid].imageRef);
            deleteObject(imgRef).catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: `Error while deleting image: ${error.message}`,
                });
            });

            const candidateRef = ref(db, `candidates/${uid}`);
            remove(candidateRef).catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: `Error while deleting candidate: ${error.message}`,
                });
            });
        });
    };
</script>

<!-- Candidate list -->
<div class="flex flex-col items-center gap-4 w-96">
    <div class="flex flex-col gap-4">
        <h1 class="text-xl font-bold">Candidate List</h1>
        <div class="flex flex-col gap-4">
            {#each $candidatesUID as uid}
                {@const candidate = $candidates[uid]}
                <div class="flex flex-row items-center gap-4">
                    <div class="flex flex-row items-center gap-4">
                        <img src={candidate.image} alt={candidate.name} class="w-24 min-w-min h-24 rounded-full shadow-lg">
                    </div>
                   <div class="flex flex-col gap-4">
                        <p class="text-xl font-bold w-64">{candidate.name}</p>
                        <div class="flex flex-row items-center gap-4">
                            <button class="btn btn-sm btn-primary" on:click={() => editCandidate(uid)}>Edit</button>
                            <button class="btn btn-sm" on:click={() => deleteCandidate(uid)}>Delete</button>
                        </div>
                   </div>
                </div>
            {/each}
        </div>
    </div>  
    <hr class="divider"/>
    <div class="flex flex-col gap-4">
        <h1 class="text-xl font-bold">Add Candidate</h1>
        <form class="flex flex-row items-center gap-4" on:submit|preventDefault={addCandidate}>
            <div class="block w-32 items-center gap-4">
                <FilePond
                    bind:this={pond}
                    {name}
                    onpreparefile={handleProcessedImg}
                    imagePreviewHeight=200,
                    imageCropAspectRatio="1:1"
                    imageResizeTargetWidth=400
                    imageResizeTargetHeight=400
                    stylePanelLayout="compact circle"
                    styleLoadIndicatorPosition="center bottom"
                    styleProgressIndicatorPosition="right bottom"
                    styleButtonRemoveItemPosition="left bottom"
                    styleButtonProcessItemPosition="right bottom"
                    acceptedFileTypes={['image/*']}
                    required
                />
            </div>
            <div class="flex flex-col items-center gap-4">
                <input name="name" bind:value={cName} type="text" placeholder="Name" class="input input-bordered" required>
                <button class="btn btn-primary">Add candidate</button>
            </div>
        </form>
    </div>
</div>
