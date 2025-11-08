// =================================================================
// ВАШИ КЛЮЧИ FIREBASE - УЖЕ ВСТАВЛЕНЫ!
// =================================================================
const firebaseConfig = {
    apiKey: "AIzaSyBlfmpfZGo-WRL-8FP_9rdYpBASgo8Zz1o",
    authDomain: "fictionworld-7be25.firebaseapp.com",
    projectId: "fictionworld-7be25",
    storageBucket: "fictionworld-7be25.firebasestorage.app",
    messagingSenderId: "176078900139",
    appId: "1:176078900139:web:f67d55ec25edf1423360ee"
};

// Инициализация Firebase
let db;
let postsCol;

// Функция для инициализации базы данных, вызывается из HTML после загрузки Firebase SDK
export function initFirebase() {
    // Проверяем, доступны ли функции Firebase (window.firebase)
    if (typeof firebase !== 'undefined') {
        const app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        postsCol = db.collection("posts"); // Главная коллекция для постов
        console.log("Firebase initialized successfully.");
    } else {
        console.error("Firebase SDK is not loaded. Check script tags in HTML.");
    }
}

// === Anonymous user system ===

// Проверяем, есть ли уже анонимный ID
if (!localStorage.getItem("anonUser")) {
  const id = Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem("anonUser", `User #${id}`);
}

// Получаем имя пользователя
export const currentUser = localStorage.getItem("anonUser");


// === АСИНХРОННЫЕ ФУНКЦИИ РАБОТЫ С FIREBASE ===

/**
 * Загружает все посты с сервера Firebase.
 */
export async function loadPosts() {
    if (!db) return [];
    try {
        // Загружаем посты, сортируя по времени создания
        const querySnapshot = await postsCol.orderBy('timestamp', 'desc').get();
        
        // Преобразуем данные из Firestore в наш формат
        const posts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id, // ID документа Firestore используем как ID поста
                replies: data.replies || [],
                // timestamp теперь всегда в миллисекундах для JS, если это Firebase Timestamp
                timestamp: data.timestamp && data.timestamp.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now()) 
            };
        });
        return posts;
    } catch (e) {
        console.error("Error loading posts from Firebase:", e);
        // Если ошибка, возвращаем пустой массив
        return [];
    }
}

/**
 * Сохраняет новый пост на сервер Firebase.
 */
export async function saveNewPost(postData) {
    if (!db) return;
    try {
        // Firebase автоматически создаст ID
        await postsCol.add(postData);
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Ошибка при сохранении поста. Пожалуйста, проверьте консоль.");
    }
}

/**
 * Обновляет существующий пост (добавляет новый ответ) на сервере.
 */
export async function updatePost(postId, updatedPostData) {
    if (!db) return;
    try {
        const postRef = db.collection("posts").doc(postId);
        // Отправляем весь объект поста, включая обновленный массив replies
        // Используем .set с merge: false, чтобы полностью перезаписать документ
        await postRef.set(updatedPostData, { merge: false });
    } catch (e) {
        console.error("Error updating document: ", e);
        alert("Ошибка при обновлении поста. Пожалуйста, проверьте консоль.");
    }
}


// === ФУНКЦИИ МОДЕРАЦИИ (КОНВЕРТИРОВАНЫ ДЛЯ FIREBASE) ===

export function isAdmin() {
    // Активируйте в консоли браузера: localStorage.setItem('isAdmin', 'true');
    return localStorage.getItem('isAdmin') === 'true'; 
}

/**
 * Удаляет пост по его ID с сервера Firebase.
 */
export async function deletePost(postId) {
    if (!db || !isAdmin()) {
        alert("Ошибка: Нет прав или база данных не инициализирована.");
        return;
    }
    if (!confirm("ВЫ УВЕРЕНЫ? Удаление поста необратимо.")) {
        return;
    }
    
    try {
        await postsCol.doc(postId).delete();
        alert("Пост удален с сервера!");
        // ВАЖНО: Перезагрузка должна быть после успешного удаления
        window.location.href = 'forum.html'; 
    } catch (e) {
        console.error("Error removing document: ", e);
        alert("Ошибка при удалении поста. Пожалуйста, проверьте консоль.");
    }
}