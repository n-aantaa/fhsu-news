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

// Add a task
export async function addTaskToFirebase(task) {
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
                email: currentUser.email,
                name: currentUser.displayName,
            },
            { merge: true }
        );
        const tasksRef = collection(userRef, "tasks");
        const docRef = await addDoc(tasksRef, task);
        return { id: docRef.id, ...task };
    } catch (e) {
        console.error("Error adding task: ", e);
    }
}

export async function getTasksFromFirebase() {
    const tasks = [];
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const taskRef = collection(doc(db, "users", userId), "tasks");
        const querySnapshot = await getDocs(taskRef);
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error("Error retrieving tasks: ", e);
    }
    return tasks;
}

export async function deleteTaskFromFirebase(id) {
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        await deleteDoc(doc(db, "users", userId, "tasks", id));
    } catch (e) {
        console.error("Error deleting task: ", e);
    }
}

export async function updateTaskInFirebase(id, updatedData) {
    console.log(updatedData, id);
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const taskRef = doc(db, "users", userId, "tasks", id);
        await updateDoc(taskRef, updatedData);
    } catch (e) {
        console.error("Error updating task: ", e);
    }
}