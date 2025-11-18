import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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

// ROLE SELECT LOGIC
let selectedRole = null;
const roleOptions = document.querySelectorAll(".role-option");

roleOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    roleOptions.forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    selectedRole = opt.dataset.role;
  });
});

// LOGIN LOGIC
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if (!selectedRole) {
    alert("Please select Tenant or Owner.");
    return;
  }

  const recaptchaResponse = grecaptcha.getResponse();
  if (!recaptchaResponse) {
    alert("Please verify that you are not a robot.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);

    // Redirect by role
    if (selectedRole === "tenant") {
      window.location.href = "tenant-dashboard.html";
    } else {
      window.location.href = "owner-dashboard.html";
    }

  } catch (e) {
    alert(e.message);
  }
};
