import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as authSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, listAll, deleteObject, getMetadata } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

document.addEventListener('DOMContentLoaded', function() {
    const content = document.getElementById('content');

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

    const body = document.querySelector('body');
    const navSignIn = document.getElementById('sign-in');
    const navSignOut = document.getElementById('sign-out');
    const navToggler = document.getElementById('navClose');
    const navToggler1 = document.getElementById('navOpen');
    const userName = document.getElementById('userName');
    const userMail = document.getElementById('userMail');
    const directHome = document.getElementById('directHomepage');
    const header = document.querySelector('.header');
    const navRoot = document.querySelector('.navroot');
    const refreshBtn = document.getElementById('refreshBtn');
    const directLinks = document.querySelector('.sidenav a');

    navSignIn.addEventListener('click', signIn);
    navSignOut.addEventListener('click', signOut);
    refreshBtn.addEventListener('click', refreshPage);
    navToggler.addEventListener('click', closeSideNav);
    navToggler1.addEventListener('click', openSideNav);
    directHome.addEventListener('click', () => {
        window.location.href = 'index.html';
    })
    

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
        navSignOut.style.display = 'flex';
        navSignIn.style.display = 'none';
        directLinks.style.display = 'flex';
        refreshBtn.style.display = 'flex';
    }
    
    function UIForSignOut() {
        navSignOut.style.display = 'none';
        navSignIn.style.display = 'flex';
        directLinks.style.display = 'none';
        refreshBtn.style.display = 'none';
    }

    function refreshPage() {
        fetchUserModels();
    }

    function closeSideNav() {
        header.style.gridColumn = '1 / 3';
        navRoot.style.display = 'none';
        body.style.gridTemplateColumns = '75px 1fr';
        navToggler1.style.display = 'block';
        userName.style.visibility = 'hidden';
        userMail.style.visibility = 'hidden';
    }

    function openSideNav() {
        header.style.gridColumn = '2 / 3';
        navRoot.style.display = 'flex';
        body.style.gridTemplateColumns = '200px 1fr';
        navToggler1.style.display = 'none';
        userName.style.visibility = 'visible';
        userMail.style.visibility = 'visible';
    }
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userName.innerHTML = user.displayName;
            userMail.innerHTML = user.email;
            fetchUserModels();
            UIForSignIn();
        } else {
            UIForSignOut();
            content.innerHTML = '';
            window.location.href = 'index.html';
        }
    });
    
    async function fetchUserModels() {
        const user = auth.currentUser;
        if (user) {
            const userUID = user.uid;
            const modelsFolderRef = ref(storage, `${userUID}`);
            
            try {
                const listResult = await listAll(modelsFolderRef);

                content.innerHTML = '';

                for (const item of listResult.items) {
                    const metadata = await getMetadata(item);
                    const customMetadata = metadata.customMetadata;
                    const url = customMetadata.preview
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

        const loadBtn = document.createElement('ion-icon')
        loadBtn.id = 'loadBtn';
        /* loadBtn.innerText = "View Model"; */
        loadBtn.setAttribute('name', 'eye-outline');
        loadBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                const userUID = user.uid;
                const loadFolderName = data.name;
                window.location.href = `index.html?model=${loadFolderName}`;
            } else {
                alert("You need to sign in to view your models.");
            }
        })
        
        const delBtn = document.createElement('ion-icon');
        delBtn.id = 'delBtn';
        /* delBtn.innerText = "Delete Model"; */
        delBtn.setAttribute('name', 'trash-outline');
        delBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                const userUID = user.uid;
                const deleteFolderRef = ref(storage, `${userUID}/${data.name}`);
                try {
                    await deleteObject(deleteFolderRef);
                    alert("File deleted succesfully.");
                    fetchUserModels();
                } catch (error) {
                    console.log(error);
                }
            } else {
                alert("You need to sign in to delete your models.");
            }
        });

        const dropdown = document.createElement('div');
        dropdown.id = 'dropdown';
        const dropBtn = document.createElement('ion-icon');
        dropBtn.id = 'dropBtn';
        dropBtn.setAttribute('name', 'chevron-down-outline');
        const dropdown_content = document.createElement('div');
        dropdown_content.id = 'dropdown-content';
        dropBtn.addEventListener('click', () => {
            dropBtn.classList.toggle('active');
            dropdown_content.classList.toggle('active');
        })

        dropdown_content.appendChild(loadBtn);
        dropdown_content.appendChild(delBtn);
        dropdown.appendChild(dropBtn);
        dropdown.appendChild(dropdown_content);

        card.appendChild(title);
        card.appendChild(preview);
        card.appendChild(dropdown);
        content.appendChild(card);
    }

});