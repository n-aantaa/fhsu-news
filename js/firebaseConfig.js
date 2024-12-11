import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
    getMessaging,
    onMessage,
    getToken,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDT8QtVJWKKiWupHjjR784KwTKee2CiugA",
    authDomain: "fhsu-news.firebaseapp.com",
    projectId: "fhsu-news",
    storageBucket: "fhsu-news.firebasestorage.app",
    messagingSenderId: "459375271581",
    appId: "1:459375271581:web:d2b3489e0cc55e0793be74",
    measurementId: "G-E87KHQKESH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

export { db, auth, messaging, getToken };
