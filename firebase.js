import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbKyDJwcUSMcfUcj0AvH-xVM64Jw3UB0M",
  authDomain: "ntbee-185f6.firebaseapp.com",
  projectId: "ntbee-185f6",
  storageBucket: "ntbee-185f6.appspot.com",
  messagingSenderId: "1023710538392",
  appId: "1:1023710538392:web:4a09e23d56f53b5cedfeed"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
