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
  onSnapshot,
  serverTimestamp,
  Timestamp
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

/**
 * Получает или создает анонимного пользователя
 * @returns {string} Имя анонимного пользователя
 */
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

/**
 * Создает новый пост в Firestore
 * @param {string} question - Выбранный вопрос
 * @param {string} answer - Ответ пользователя
 * @returns {Promise<string>} ID созданного поста
 */
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

/**
 * Загружает все посты из Firestore
 * @param {string} sortType - Тип сортировки ('newest', 'most', 'random')
 * @returns {Promise<Array>} Массив постов
 */
async function loadPosts(sortType = 'newest') {
  try {
    let q;
    
    if (sortType === 'newest') {
      q = query(collection(db, POSTS_COLLECTION), orderBy("timestamp", "desc"));
    } else if (sortType === 'most') {
      q = query(collection(db, POSTS_COLLECTION), orderBy("replyCount", "desc"));
    } else {
      // Для random загружаем все и перемешиваем на клиенте
      q = collection(db, POSTS_COLLECTION);
    }
    
    const querySnapshot = await getDocs(q);
    let posts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        question: data.question,
        answer: data.answer,
        user: data.user,
        timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now(),
        replyCount: data.replyCount || 0
      });
    });
    
    // Если random, перемешиваем
    if (sortType === 'random') {
      posts.sort(() => Math.random() - 0.5);
    }
    
    return posts;
  } catch (error) {
    console.error("Error loading posts:", error);
    return [];
  }
}

/**
 * Загружает один пост по ID
 * @param {string} postId - ID поста
 * @returns {Promise<Object|null>} Объект поста или null
 */
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

/**
 * Удаляет пост (только для админов)
 * @param {string} postId - ID поста
 */
async function deletePost(postId) {
  try {
    // Сначала удаляем все ответы
    const repliesQuery = query(collection(db, REPLIES_COLLECTION));
    const repliesSnapshot = await getDocs(repliesQuery);
    
    const deletePromises = [];
    repliesSnapshot.forEach((replyDoc) => {
      const replyData = replyDoc.data();
      if (replyData.postId === postId) {
        deletePromises.push(deleteDoc(doc(db, REPLIES_COLLECTION, replyDoc.id)));
      }
    });
    
    await Promise.all(deletePromises);
    
    // Затем удаляем сам пост
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
    console.log("Post and replies deleted successfully");
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// ===== REPLIES FUNCTIONS =====

/**
 * Добавляет ответ к посту
 * @param {string} postId - ID поста
 * @param {string} text - Текст ответа
 * @returns {Promise<string>} ID созданного ответа
 */
async function addReply(postId, text) {
  try {
    const user = getAnonymousUser();
    const replyData = {
      postId: postId,
      text: text,
      user: user,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, REPLIES_COLLECTION), replyData);
    
    // Обновляем счетчик ответов в посте
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const currentCount = postSnap.data().replyCount || 0;
      await updateDoc(postRef, {
        replyCount: currentCount + 1
      });
    }
    
    console.log("Reply created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
}

/**
 * Загружает все ответы для конкретного поста
 * @param {string} postId - ID поста
 * @returns {Promise<Array>} Массив ответов
 */
async function loadReplies(postId) {
  try {
    const q = query(
      collection(db, REPLIES_COLLECTION),
      orderBy("timestamp", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    let replies = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.postId === postId) {
        replies.push({
          id: doc.id,
          text: data.text,
          user: data.user,
          timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now()
        });
      }
    });
    
    return replies;
  } catch (error) {
    console.error("Error loading replies:", error);
    return [];
  }
}

/**
 * Удаляет ответ (только для админов)
 * @param {string} replyId - ID ответа
 * @param {string} postId - ID поста (для обновления счетчика)
 */
async function deleteReply(replyId, postId) {
  try {
    await deleteDoc(doc(db, REPLIES_COLLECTION, replyId));
    
    // Обновляем счетчик ответов
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const currentCount = postSnap.data().replyCount || 0;
      await updateDoc(postRef, {
        replyCount: Math.max(0, currentCount - 1)
      });
    }
    
    console.log("Reply deleted successfully");
  } catch (error) {
    console.error("Error deleting reply:", error);
    throw error;
  }
}

// ===== ADMIN FUNCTIONS =====

/**
 * Проверяет, является ли пользователь администратором
 * @returns {boolean}
 */
function isAdmin() {
  return localStorage.getItem('isAdmin') === 'true';
}

// ===== EXPORT ALL FUNCTIONS =====
window.firebaseDB = {
  createPost,
  loadPosts,
  loadPostById,
  deletePost,
  addReply,
  loadReplies,
  deleteReply,
  isAdmin,
  getAnonymousUser
};