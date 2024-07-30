import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as authSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable, listAll } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

document.addEventListener('DOMContentLoaded', function() {
    const dashboard = document.getElementById('dashboard');

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
    const refreshBtn = document.getElementById('refreshBtn');
    const directLinks = document.querySelector('.sidenav a');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');

    googleSignIn.addEventListener('click', signIn);
    googleSignOut.addEventListener('click', signOut);
    refreshBtn.addEventListener('click', refreshPage);
    

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

    function UIForSignIn() {
        googleSignOut.style.display = 'block';
        googleSignIn.style.display = 'none';
        directLinks.style.display = 'block';
        userDisplayName.style.display = 'block';
        userEmail.style.display = 'block';
        refreshBtn.style.display = 'block';

    }
    
    function UIForSignOut() {
        googleSignOut.style.display = 'none';
        googleSignIn.style.display = 'block';
        directLinks.style.display = 'none';
        userDisplayName.style.display = 'none';
        userEmail.style.display = 'none';
        refreshBtn.style.display = 'none';
    }

    function refreshPage() {
        fetchUserModels();
    }
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log(user);
            userDisplayName.innerHTML = "Signed in as: " + user.displayName;
            userEmail.innerHTML = user.email;
            UIForSignIn();
            fetchUserModels();
        } else {
            UIForSignOut();
            dashboard.innerHTML = '';
            window.location.href = 'index.html';
        }
    });
    
    async function fetchUserModels() {
        const user = auth.currentUser;
        if (user) {
            const userUID = user.uid;
            const modelsFolderRef = ref(storage, `${userUID}`);
            console.log(modelsFolderRef);
            
            try {
                const listResult = await listAll(modelsFolderRef);
                console.log(listResult);

                dashboard.innerHTML = '';

                console.log(listResult.items)
                for (const item of listResult.items) {
                    const url = await getDownloadURL(item);
                    const fileName = item.name;
                    
                    displayModelCard({ name: fileName, url: url });
                }
            } catch (error) {
                console.error("Error fetching files:", error);
            }
        } else {
            alert("You need to sign in to view your models.");
        }
    }

    function displayModelCard(data) {
        const card = document.createElement('div');
        card.classList.add('card');

        const title = document.createElement('h3');
        title.innerText = data.name.split('.')[0];

        const preview = document.createElement('img');
        preview.src = data.url;

        card.appendChild(title);
        card.appendChild(preview);
        dashboard.appendChild(card);
    }

});