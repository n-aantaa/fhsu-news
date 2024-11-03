if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/serviceworker.js")
        .then((req) => console.log("Service Worker Registered!", req))
        .catch((err) => console.log("Service Worker registration failed", err));
}
