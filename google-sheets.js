// ===== GOOGLE SHEETS API INTEGRATION =====

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbzkAkHEcfvwrqQ3raaI-vIpd9OyF8ucHEGfFCfolURRTTrR2Xvh9RsPVZRDTWFuVav3/exec";

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

/**
 * Создает новый пост в Google Sheets
 * @param {string} question - Выбранный вопрос
 * @param {string} answer - Ответ пользователя
 * @returns {Promise<boolean>} Успешность операции
 */
async function createPost(question, answer) {
  try {
    const user = getAnonymousUser();
    const postData = {
      user: user,
      question: question,
      answer: answer
    };
    
    const response = await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    console.log("Post created successfully");
    return true;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

/**
 * Загружает все посты из Google Sheets
 * @param {string} sortType - Тип сортировки ('newest', 'random')
 * @returns {Promise<Array>} Массив постов
 */
async function loadPosts(sortType = 'newest') {
  try {
    const response = await fetch(SHEETS_URL);
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Преобразуем данные в нужный формат
    let posts = data.map((row, index) => ({
      id: index.toString(),
      timestamp: new Date(row.timestamp).getTime(),
      user: row.user,
      question: row.question,
      answer: row.answer
    }));
    
    // Сортировка
    if (sortType === 'newest') {
      posts.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortType === 'random') {
      posts.sort(() => Math.random() - 0.5);
    }
    
    return posts;
  } catch (error) {
    console.error("Error loading posts:", error);
    return [];
  }
}

/**
 * Проверяет, является ли пользователь администратором
 * @returns {boolean}
 */
function isAdmin() {
  return localStorage.getItem('isAdmin') === 'true';
}

// ===== EXPORT ALL FUNCTIONS =====
window.sheetsDB = {
  createPost,
  loadPosts,
  isAdmin,
  getAnonymousUser
};