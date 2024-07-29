import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as authSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
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

googleSignIn.addEventListener('click', signIn);
googleSignOut.addEventListener('click', signOut);
modelUploadBtn.addEventListener('click', uploadModel);
modelSaveBtn.addEventListener('click', saveModel);


function signIn() {
    signInWithPopup(auth, provider)
    .then((result) => {
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

onAuthStateChanged(auth, (user) => {
    if (user) {
        UIForSignIn();
    } else {
        UIForSignOut();
    }
});

function UIForSignIn() {
    googleSignOut.style.display = 'block';
    googleSignIn.style.display = 'none';
    userUploadBtn.style.display = 'inline-block';
    modelUploadBtn.style.display = 'inline-block';
    modelSaveBtn.style.display = 'inline-block';

}

function UIForSignOut() {
    googleSignOut.style.display = 'none';
    googleSignIn.style.display = 'block';
    userUploadBtn.style.display = 'none';
    modelUploadBtn.style.display = 'none';
    modelSaveBtn.style.display = 'none';
}

function uploadModel() {
    const file = userUploadBtn.files[0]
    if (file) {
        console.log(file);
        const fileUrl = URL.createObjectURL(file);
        userModelLoader(fileUrl);
    } else {
        alert("Please select a model first.");
    }
}

async function saveModel() {
    const file = userUploadBtn.files[0]
    
    if (!file) {
        alert("Please select a file to upload.")
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userUID = user.uid;
            const storageRef = ref(storage, `${userUID}/${file.name}`);

            try {
                await uploadBytes(storageRef, file);
                /* const downloadURL = await getDownloadURL(storageRef); */
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        console.log('Upload is ' + progress + '% done');
                        document.getElementById('save-info').style.display = 'block';
                        document.getElementById('save-info').innerText = 'Upload is ' + progress + '% done';
                    }, 
                    (error) => {
                        console.error('Error uploading model:', error);
                        document.getElementById('save-info').style.display = 'none';
                    }, 
                    () => {
                        alert("File uploaded successfully!");
                    }
                );

                // Store model metadata in Firestore
                /* await setDoc(doc(db, 'users', userUID), {
                    userUpload: {
                        filename: file.name,
                        url: downloadURL,
                        uploadTime: new Date()
                    }
                }); */

            } catch (error) {
                console.error("Error uploading file:", error);
                alert("Error uploading file. Please try again.");
            }
        } else {
            alert("You need to be signed in to upload files.");
        }
    });
}