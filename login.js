import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbKyDJwcUSMcfUcj0AvH-xVM64Jw3UB0M",
  authDomain: "ntbee-185f6.firebaseapp.com",
  projectId: "ntbee-185f6",
  storageBucket: "ntbee-185f6.appspot.com",
  messagingSenderId: "1023710538392",
  appId: "1:1023710538392:web:4a09e23d56f53b5cedfeed"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // Fetch user data to determine role
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const userRole = userData.role || userData.type;

      // Redirect based on role
      if (userRole === 'provider' || userRole === 'producer') {
        window.location.href = "provider-dashboard.html";
      } else if (userRole === 'receiver' || userRole === 'consumer') {
        window.location.href = "client-dashboard.html";
      } else {
        // Default to index if role is not set
        window.location.href = "index.html";
      }
    } else {
      // No user data, redirect to index
      window.location.href = "index.html";
    }

  } catch (e) {
    alert(e.message);
    console.log(e.code, e.message);
  }
};
const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#password');

if (togglePassword) {
  togglePassword.addEventListener('click', function (e) {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);

    
    if (type === 'password') {
      
      this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    } else {
      
      this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    }
  });
}
