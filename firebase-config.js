// ===== FIREBASE CONFIGURATION AND FIRESTORE INTEGRATION =====

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlfmpfZGo-WRL-8FP_9rdYpBASgo8Zz1o",
  authDomain: "fictionworld-7be25.firebaseapp.com",
  projectId: "fictionworld-7be25",
  storageBucket: "fictionworld-7be25.firebasestorage.app",
  messagingSenderId: "176078900139",
  appId: "1:176078900139:web:f67d55ec25edf1423360ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection names
const POSTS_COLLECTION = "posts";
const REPLIES_COLLECTION = "replies";

// ===== ANONYMOUS USER SYSTEM =====

function getAnonymousUser() {
  let anonUser = localStorage.getItem("anonUser");
  if (!anonUser) {
    const id = Math.floor(1000 + Math.random() * 9000);
    anonUser = `User #${id}`;
    localStorage.setItem("anonUser", anonUser);
  }
  return anonUser;
}

// ===== POSTS FUNCTIONS =====

async function createPost(question, answer) {
  try {
    const user = getAnonymousUser();
    const postData = {
      question: question,
      answer: answer,
      user: user,
      timestamp: serverTimestamp(),
      replyCount: 0
    };
    
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
    console.log("Post created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

async function loadPosts(sortType = 'newest') {
  try {
    let q;
    
    if (sortType === 'newest') {
      q = query(collection(db, POSTS_COLLECTION), orderBy("timestamp", "desc"));
    } else if (sortType === 'most') {
      q = query(collection(db, POSTS_COLLECTION), orderBy("replyCount", "desc"));
    } else {
      q = collection(db, POSTS_COLLECTION);
    }
    
    const querySnapshot = await getDocs(q);
    let posts = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      posts.push({
        id: docSnap.id,
        question: data.question,
        answer: data.answer,
        user: data.user,
        timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now(),
        replyCount: data.replyCount || 0
      });
    });
    
    if (sortType === 'random') {
      posts.sort(() => Math.random() - 0.5);
    }
    
    return posts;
  } catch (error) {
    console.error("Error loading posts:", error);
    return [];
  }
}

async function loadPostById(postId) {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        question: data.question,
        answer: data.answer,
        user: data.user,
        timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now(),
        replyCount: data.replyCount || 0
      };
    } else {
      console.log("Post not found");
      return null;
    }
  } catch (error) {
    console.error("Error loading post:", error);
    return null;
  }
}