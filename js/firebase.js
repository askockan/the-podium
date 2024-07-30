import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as authSignOut, onAuthStateChanged, signInWithRedirect } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { userModelLoader } from './main.js';

const firebaseConfig = {
    apiKey: "AIzaSyA1xIr1P-FI1JINyUFIiWfIlv-RmNEnTaE",
    authDomain: "the-podium-21756.firebaseapp.com",
    projectId: "the-podium-21756",
    storageBucket: "the-podium-21756.appspot.com",
    messagingSenderId: "116749765072",
    appId: "1:116749765072:web:56878ae6d3930650a711d5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

const googleSignIn = document.getElementById('google-sign-in');
const googleSignOut = document.getElementById('sign-out');
const userUploadBtn = document.getElementById('userUpload');
const modelUploadBtn = document.getElementById('modelUpload');
const modelSaveBtn = document.getElementById('modelSave');
const dashboardBtn = document.getElementById('dashboardBtn');
const navBtn = document.getElementById('navbutton');
const cModelName = document.getElementById('cModelName');

googleSignIn.addEventListener('click', signIn);
googleSignOut.addEventListener('click', signOut);
modelUploadBtn.addEventListener('click', uploadModel);
modelSaveBtn.addEventListener('click', saveModel);
dashboardBtn.addEventListener('click', dashboardDirect);
cModelName.addEventListener('input', ignoreSpace);

function signIn() {
    signInWithPopup(auth, provider)
    .then((result) => {;
        const user = result.user;
        UIForSignIn();
    }).catch((error) => {
        console.error(error);
    });
}

function signOut() {
    authSignOut(auth).then(() => {
        UIForSignOut();
    }).catch((error) => {
        console.error(error);
    });
}

function dashboardDirect() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        } else {
            alert("You need to sign in to open dashboard.");
        }
    })
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        UIForSignIn();
    } else {
        UIForSignOut();
    }
});

function UIForSignIn() {
    enableButtons(); 
    googleSignOut.style.display = 'block';
    googleSignIn.style.display = 'none';
    dashboardBtn.style.display = 'block';
}

function UIForSignOut() {
    disableButtons();
    googleSignOut.style.display = 'none';
    googleSignIn.style.display = 'block';
    dashboardBtn.style.display = 'none';
}

function enableButtons() {
    userUploadBtn.style.opacity = '1';
    modelUploadBtn.style.opacity = '1';
    modelSaveBtn.style.opacity = '1'; 
    cModelName.style.opacity = '1';
    userUploadBtn.style.cursor = 'pointer';
    userUploadBtn.disabled = false;
    modelUploadBtn.style.cursor = 'pointer';
    modelSaveBtn.style.cursor = 'pointer';
    cModelName.style.cursor = 'pointer';
    cModelName.disabled = false;
}

function disableButtons() {
    userUploadBtn.style.opacity = '0.6';
    modelUploadBtn.style.opacity = '0.6';
    modelSaveBtn.style.opacity = '0.6'; 
    cModelName.style.opacity = '0.6';
    userUploadBtn.style.cursor = 'not-allowed';
    userUploadBtn.disabled = true;
    modelUploadBtn.style.cursor = 'not-allowed';
    modelSaveBtn.style.cursor = 'not-allowed';
    cModelName.style.cursor = 'not-allowed';
    cModelName.disabled = true;
}

function uploadModel() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const file = userUploadBtn.files[0]
            if (file) {
                const fileUrl = URL.createObjectURL(file);
                userModelLoader(fileUrl);
            } else {
                alert("Please select a model first.");
            }
        } else {
            alert("You need to be signed in to upload files.");
        }
    })
}

function ignoreSpace() {
    cModelName.value = cModelName.value.replace(/\s+/g, '');
}

async function saveModel() {
    const file = userUploadBtn.files[0]
    if (!file) {
        alert("Please select a file to upload.")
        return;
    }

    if (!cModelName.value || !cModelName.validity.valid) {
        alert("Please enter a valid name for your model.")
        return;
    }
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userUID = user.uid;
            let holderforfilename = cModelName.value;
            const storageRef = ref(storage, `${userUID}/${holderforfilename}.glb`);

            try {
                await uploadBytes(storageRef, file);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        document.getElementById('save-info').style.display = 'block';
                        document.getElementById('save-info').innerText = 'Upload is ' + progress + '% done';
                    }, 
                    (error) => {
                        console.error('Error uploading model:', error);
                        document.getElementById('save-info').style.display = 'none';
                    }, 
                    () => {
                        document.getElementById('save-info').style.display = 'none';
                        cModelName.value = "";
                        userUploadBtn.value = "";
                        alert("File uploaded successfully!");
                    }
                );
            } catch (error) {
                console.error("Error uploading file:", error);
                alert("Error uploading file. Please try again.");
            }
        } else {
            alert("You need to be signed in to upload files.");
        }
    });
}