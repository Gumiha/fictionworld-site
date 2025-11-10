// === Anonymous user system and Data Utilities ===

const LS_KEY = "anonymousForumPosts";

// Проверяем, есть ли уже анонимный ID
if (!localStorage.getItem("anonUser")) {
  const id = Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem("anonUser", `User #${id}`);
}

// Получаем имя пользователя (может пригодиться)
const currentUser = localStorage.getItem("anonUser");
// console.log("Welcome,", currentUser);

/**
 * Загружает посты из localStorage или возвращает пустой массив.
 * @returns {Array} Массив постов
 */
function loadPosts() {
    try {
        const json = localStorage.getItem(LS_KEY);
        const posts = json ? JSON.parse(json) : [];
        posts.forEach(post => {
            // Гарантируем, что у каждого поста есть массив для ответов
            if (!post.replies) post.replies = [];
        });
        return posts;
    } catch (e) {
        console.error("Error loading posts from localStorage:", e);
        return [];
    }
}

/**
 * Сохраняет массив постов в localStorage.
 * @param {Array} posts - Массив постов для сохранения
 */
function savePosts(posts) {
    localStorage.setItem(LS_KEY, JSON.stringify(posts));
}

// === ФУНКЦИИ МОДЕРАЦИИ ===

/**
 * Проверяет, включен ли режим администратора.
 * Активируется в консоли: localStorage.setItem('isAdmin', 'true');
 * @returns {boolean}
 */
function isAdmin() {
    // Режим администратора включен, если в localStorage установлен ключ 'isAdmin' со значением 'true'
    return localStorage.getItem('isAdmin') === 'true'; 
}

/**
 * Удаляет пост по его ID.
 * @param {string} postId - ID поста
 */
function deletePost(postId) {
    if (!isAdmin()) {
        alert("Нет прав администратора для удаления поста.");
        return;
    }
    if (!confirm("ВЫ УВЕРЕНЫ? Удаление поста необратимо.")) {
        return;
    }
    
    let posts = loadPosts();
    // Фильтруем массив, оставляя только те посты, ID которых не совпадает
    posts = posts.filter(p => p.id !== postId);
    savePosts(posts);
    
    alert("Пост удален!");
    window.location.href = 'forum.html'; // Перенаправляем на главную страницу форума
}

/**
 * Удаляет конкретный ответ из поста.
 * @param {string} postId - ID поста, содержащего ответ
 * @param {string} replyTimestamp - timestamp ответа (используется как ID ответа)
 */
function deleteReply(postId, replyTimestamp) {
    if (!isAdmin()) {
        alert("Нет прав администратора для удаления ответа.");
        return;
    }
    if (!confirm("ВЫ УВЕРЕНЫ? Удаление ответа необратимо.")) {
        return;
    }
    
    const posts = loadPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        // Фильтруем ответы, оставляя только те, у которых timestamp не совпадает
        posts[postIndex].replies = posts[postIndex].replies.filter(
            // Сравниваем как строки, чтобы избежать проблем с типами
            r => r.timestamp.toString() !== replyTimestamp.toString() 
        );
        
        savePosts(posts);
        alert("Ответ удален!");
        // Обновляем страницу темы, чтобы увидеть изменения
        window.location.href = `thread.html?id=${postId}`;
    }
}