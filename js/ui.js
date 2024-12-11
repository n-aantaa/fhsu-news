import { openDB } from "https://unpkg.com/idb?module";
import {
    addContributionToFirebase,
    getContributionsFromFirebase,
    deleteContributionFromFirebase,
    updateContributionInFirebase,
} from "./firebaseDB.js"
// import { messaging, getToken } from "./firebaseConfig.js";
import { onMessage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js";

const STORAGE_THRESHOLD = 0.8;
let serviceWorkerRegistration = null;

document.addEventListener("DOMContentLoaded", function () {
    const menus = document.querySelector(".sidenav");
    M.Sidenav.init(menus, { edge: "right" });
    const forms = document.querySelector(".side-form");
    M.Sidenav.init(forms, { edge: "left" });
    checkStorageUsage();
    requestPersistentStorage();
    const notificationButton = document.getElementById(
        "enable-notifications-btn"
    );
    if (notificationButton) {
        notificationButton.addEventListener("click", initNotificationPermission);
    }
});

// Register Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/serviceworker.js")
        .then((registration) => {
            serviceWorkerRegistration = registration;
            console.log("Service Worker Registered!", registration);
        })
        .catch((err) => console.log("Service Worker registration failed", err));
}

let dbPromise;
async function getDB() {
    if (!dbPromise) {
        dbPromise = openDB("contributionManager", 1, {
            upgrade(db) {
                const store = db.createObjectStore("contributions", {
                    keyPath: "id",
                    autoIncrement: true,
                });
                store.createIndex("status", "status");
                store.createIndex("synced", "synced");
            },
        });
    }
    return dbPromise;
}

export async function syncContributions() {
    const db = await getDB();
    const tx = db.transaction("contributions", "readonly");
    const store = tx.objectStore("contributions");
    const contributions = await store.getAll();
    await tx.done;

    for (const contribution of contributions) {
        if (!contribution.synced && isOnline()) {
            try {
                const contributionToSync = {
                    title: contribution.title,
                    details: contribution.details,
                    status: contribution.status,
                };
                const savedContribution = await addContributionToFirebase(contributionToSync);
                const txUpdate = db.transaction("contributions", "readwrite");
                const storeUpdate = txUpdate.objectStore("contributions");
                await storeUpdate.delete(contribution.id);
                await storeUpdate.put({ ...contribution, id: savedContribution.id, synced: true });
                await txUpdate.done;
            } catch (error) {
                console.error("Error syncing contribution:", error);
            }
        }
    }
}

function isOnline() {
    return navigator.onLine;
}


// Add Contribution
async function addContribution(contribution) {
    const db = await getDB();
    let contributionId;

    if (isOnline()) {
        try {
            const savedContribution = await addContributionToFirebase(contribution);
            contributionId = savedContribution.id;
            const tx = db.transaction("contributions", "readwrite");
            const store = tx.objectStore("contributions");
            await store.put({ ...contribution, id: contributionId, synced: true });
            await tx.done;
        } catch (error) {
            console.error("Error adding contribution to Firebase:", error);
        }
    } else {
        contributionId = `temp-${Date.now()}`;
        const contributionToStore = { ...contribution, id: contributionId, synced: false };
        const tx = db.transaction("contributions", "readwrite");
        const store = tx.objectStore("contributions");
        await store.put(contributionToStore);
        await tx.done;
    }

    checkStorageUsage();
    return { ...contribution, id: contributionId };
}

// Edit Contribution
async function editContribution(id, updatedData) {
    if (!id) {
        console.error("Invalid ID passed to editContribution.");
        return;
    }

    const db = await getDB();

    if (isOnline()) {
        try {
            await updateContributionInFirebase(id, updatedData);
            const tx = db.transaction("contributions", "readwrite");
            const store = tx.objectStore("contributions");
            await store.put({ ...updatedData, id: id, synced: true });
            await tx.done;

            loadContributions();
        } catch (error) {
            console.error("Error updating contribution in Firebase:", error);
        }
    } else {
        const tx = db.transaction("contributions", "readwrite");
        const store = tx.objectStore("contributions");
        await store.put({ ...updatedData, id: id, synced: false });
        await tx.done;
        loadContributions();
    }
}

// Delete Contribution
async function deleteContribution(id) {
    if (!id) {
        console.error("Invalid ID passed to deleteContribution.");
        return;
    }
    const db = await getDB();
    if (isOnline()) {
        try {
            await deleteContributionFromFirebase(id);
        } catch (error) {
            console.error("Error deleting contribution from Firebase:", error);
        }
    }

    const tx = db.transaction("contributions", "readwrite");
    const store = tx.objectStore("contributions");
    try {
        await store.delete(id);
    } catch (e) {
        console.error("Error deleting contribution from IndexedDB:", e);
    }
    await tx.done;

    const contributionCard = document.querySelector(`[data-id="${id}"]`);
    if (contributionCard) {
        contributionCard.remove();
    }
    checkStorageUsage();
}

export async function loadContributions() {
    const db = await getDB();
    const contributionContainer = document.querySelector(".contributions");
    contributionContainer.innerHTML = "";

    if (isOnline()) {
        const firebaseContributions = await getContributionsFromFirebase();
        const tx = db.transaction("contributions", "readwrite");
        const store = tx.objectStore("contributions");

        for (const contribution of firebaseContributions) {
            await store.put({ ...contribution, synced: true });
            displayContribution(contribution);
        }
        await tx.done;
    } else {
        const tx = db.transaction("contributions", "readonly");
        const store = tx.objectStore("contributions");
        const contributions = await store.getAll();
        contributions.forEach((contribution) => {
            displayContribution(contribution);
        });
        await tx.done;
    }
}

function displayContribution(contribution) {
    const contributionContainer = document.querySelector(".contributions");

    const existingContribution = contributionContainer.querySelector(`[data-id="${contribution.id}"]`);
    if (existingContribution) {
        existingContribution.remove();
    }

    const html = `
    <div class="card-panel white row valign-wrapper" data-id="${contribution.id}">
      <div class="col s2">
        <img src="/img/icons/contribution.png" class="circle responsive-img" alt="Contribution icon" style="max-width: 100%; height: auto"/>
      </div>
      <div class="contribution-detail col s8">
        <h5 class="contribution-title black-text">${contribution.title}</h5>
        <div class="contribution-details">${contribution.details}</div>
        <div class="contribution-status">${contribution.status}</div>
      </div>
      <div class="col s2 right-align">
        <button class="contribution-delete btn-flat" aria-label="Delete contribution">
          <i class="material-icons black-text text-darken-1" style="font-size: 30px">delete</i>
        </button>
        <button class="contribution-edit btn-flat" data-target="side-form" aria-label="Edit contribution">
          <i class="material-icons black-text text-darken-1" style="font-size: 30px">edit</i>
        </button>
      </div>
    </div>
  `;
    contributionContainer.insertAdjacentHTML("beforeend", html);

    const deleteButton = contributionContainer.querySelector(
        `[data-id="${contribution.id}"] .contribution-delete`
    );
    deleteButton.addEventListener("click", () => deleteContribution(contribution.id));

    const editButton = contributionContainer.querySelector(
        `[data-id="${contribution.id}"] .contribution-edit`
    );
    editButton.addEventListener("click", () =>
        openEditForm(contribution.id, contribution.title, contribution.details)
    );
}

const addContributionButton = document.getElementById("submit-btn");
addContributionButton.addEventListener("click", async () => {
    const titleInput = document.getElementById("title");
    const detailsInput = document.getElementById("details");
    const formActionButton = document.getElementById("submit-btn");

    const contributionId = contributionIdInput.value;
    const contributionData = {
        title: titleInput.value,
        details: detailsInput.value,
        status: "pending",
    };
    if (!contributionId) {
        const savedContribution = await addContribution(contributionData);
        displayContribution(savedContribution);
    } else {
        await editContribution(contributionId, contributionData);
        loadContributions();
    }
    formActionButton.textContent = "Add";
});


// Function to check storage usage
async function checkStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        const usageInMB = (usage / (1024 * 1024)).toFixed(2); // Convert to MB
        const quotaInMB = (quota / (1024 * 1024)).toFixed(2); // Convert to MB

        console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

        const storageInfo = document.querySelector("#storage-info");
        if (storageInfo) {
            storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
        }

        if (usage / quota > 0.8) {
            const storageWarning = document.querySelector("#storage-warning");
            if (storageWarning) {
                storageWarning.textContent =
                    "Warning: You are running low on storage space. Please delete old objects to free up space.";
                storageWarning.style.display = "block";
            }
        } else {
            const storageWarning = document.querySelector("#storage-warning");
            if (storageWarning) {
                storageWarning.textContent = "";
                storageWarning.style.display = "none";
            }
        }
    }
}

// Function to request persistent storage
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersistent = await navigator.storage.persist();
        console.log(`Persistent storage granted: ${isPersistent}`);

        const storageMessage = document.querySelector("#persistent-storage-info");
        if (storageMessage) {
            if (isPersistent) {
                storageMessage.textContent =
                    "Persistent storage granted. Your data is safe!";
                storageMessage.classList.remove("red-text");
                storageMessage.classList.add("green-text");
            } else {
                storageMessage.textContent =
                    "Persistent storage not granted. Data might be cleared under storage pressure.";
                storageMessage.classList.remove("green-text");
                storageMessage.classList.add("red-text");
            }
        }
    }
}

// Event listener to detect online status and sync
window.addEventListener("online", syncContributions);
window.addEventListener("online", loadContributions);




