import { currentUser } from "./auth.js";
import { db } from "./firebaseConfig.js";
import {
    collection,
    addDoc,
    setDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function addContributionToFirebase(contribution) {
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        console.log("userID: ", userId);
        const userRef = doc(db, "users", userId);
        await setDoc(
            userRef,
            {
                username: currentUser.username,
                name: currentUser.displayName,
            },
            { merge: true }
        );
        const contributionsRef = collection(userRef, "contributions");
        const docRef = await addDoc(contributionsRef, contribution);
        return { id: docRef.id, ...contribution };
    } catch (e) {
        console.error("Error adding: ", e);
    }
}

export async function getContributionsFromFirebase() {
    const contributions = [];
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const contributionsRef = collection(doc(db, "users", userId), "contributions");
        const querySnapshot = await getDocs(contributionsRef);
        querySnapshot.forEach((doc) => {
            contributions.push({ id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error("Error retrieving: ", e);
    }
    return contributions;
}

export async function deleteContributionFromFirebase(id) {
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        await deleteDoc(doc(db, "users", userId, "contributions", id));
    } catch (e) {
        console.error("Error deleting: ", e);
    }
}

export async function updateContributionInFirebase(id, updatedData) {
    console.log(updatedData, id);
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const contributionsRef = doc(db, "users", userId, "contributions", id);
        await updateDoc(contributionsRef, updatedData);
    } catch (e) {
        console.error("Error updating: ", e);
    }
}