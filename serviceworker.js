// Import Firebase libraries using importScripts
importScripts(
    "https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js"
);
importScripts(
    "https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js"
);

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyDT8QtVJWKKiWupHjjR784KwTKee2CiugA",
    authDomain: "fhsu-news.firebaseapp.com",
    projectId: "fhsu-news",
    storageBucket: "fhsu-news.firebasestorage.app",
    messagingSenderId: "459375271581",
    appId: "1:459375271581:web:d2b3489e0cc55e0793be74",
    measurementId: "G-E87KHQKESH"
});

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
    console.log("[serviceworker.js] Received background message ", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/images/logo.png",
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = "fhsu-news-v3";

const ASSETS_TO_CACHE = [
    "/pages/index.html",
    "/pages/contact.html",
    "/pages/contributions.html",
    "/pages/login.html",
    "/pages/signup.html",
    "/pages/athletics.html",
    "/pages/gallery.html",
    "/pages/news.html",
    "/css/styles.css",
    "/js/materialize.min.js",
    "/js/ui.js",
    "/images/logo.png",
];

self.addEventListener("install", (event) => {
    console.log("Service worker: Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Service worker: caching files");
            console.log(ASSETS_TO_CACHE);
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker: Activating...");
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("Service Worker: Deleting old Cache");
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event with async/await
self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async function () {
            // Only cache GET requests
            if (event.request.method !== "GET") {
                return fetch(event.request);
            }

            const cachedResponse = await caches.match(event.request);

            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const networkResponse = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone()); // Update cache with the fetched response
                return networkResponse;
            } catch (error) {
                console.error("Fetch failed, returning offline page:", error);
                // Optionally, return an offline page here if available in the cache
            }
        })()
    );


});
// Listen for messages from ui.js
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "FCM_TOKEN") {
        const fcmToken = event.data.token;
        console.log("Received FCM token in service worker:", fcmToken);
        // Here you might store or use the token as needed for push notifications
    }
});

// Display notification for background messages
self.addEventListener("push", (event) => {
    if (event.data) {
        const payload = event.data.json();
        const {title, body, icon} = payload.notification;
        const options = {
            body,
            icon: icon || "/img/icons/icon-192x192.png",
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
});