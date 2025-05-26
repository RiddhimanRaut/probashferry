/* ---------- Firebase Google sign-in ---------- */
import { initializeApp } from
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getAuth, GoogleAuthProvider,
         signInWithPopup, onAuthStateChanged,
         signOut } from
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
         addDoc, query, where, orderBy, limit, getDocs, onSnapshot, 
         serverTimestamp, increment } from
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

/* 🔑  paste your own keys here  */
const firebaseConfig = {
  apiKey: "AIzaSyDNoiJOr9uvTzM3HyQcyaK4-Pab_uRSXko",
  authDomain: "probashferry-magazine.firebaseapp.com",
  projectId: "probashferry-magazine",
  storageBucket: "probashferry-magazine.firebasestorage.app",
  messagingSenderId: "24509668619",
  appId: "1:24509668619:web:d61b7bd89ee444a051d60e",
  measurementId: "G-7J8JPB239G"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

/* elements from index.html */
const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeMsg = document.getElementById('welcomeMsg');
const userName = document.getElementById('userName');

loginBtn.onclick  = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  const logged = !!user;
  
  // Force reflow of DOM to ensure proper display
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'none';
  
  // Set visibility states
  loginBtn.hidden = logged;
  logoutBtn.hidden = !logged;
  welcomeMsg.hidden = !logged;
  
  // Reset display to default/flex after a slight delay to ensure DOM updates
  setTimeout(() => {
    loginBtn.style.display = logged ? 'none' : 'flex';
    logoutBtn.style.display = logged ? 'flex' : 'none';
  }, 10);
  
  if (logged) {
    console.log(`Logged in as ${user.displayName}`);
    
    // Extract first name from displayName (assumes format is "First Last")
    const firstName = user.displayName.split(' ')[0];
    userName.textContent = firstName;
    
    // Check like status for each article when user logs in
    document.querySelectorAll('.article').forEach(article => {
      checkUserLiked(article.id);
    });
  }
});
/* ---------- end Firebase block ---------- */

// Function to force refresh UI state if there are issues with button visibility
function forceRefreshUI() {
  const logged = auth.currentUser !== null;
  loginBtn.hidden = logged;
  logoutBtn.hidden = !logged;
  welcomeMsg.hidden = !logged;
  
  loginBtn.style.display = logged ? 'none' : 'flex';
  logoutBtn.style.display = logged ? 'flex' : 'none';
  
  // Re-apply first name if logged in
  if (logged && auth.currentUser.displayName) {
    const firstName = auth.currentUser.displayName.split(' ')[0];
    userName.textContent = firstName;
  }
}

// Call this function when page loads to ensure correct UI state
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(forceRefreshUI, 500);
});

// Handle focus events - sometimes helps with cached UI states
window.addEventListener('focus', forceRefreshUI);

/* ---------- wheel: translate vertical wheel-scroll to horizontal ---------- */
document.querySelector('.h-scroll').addEventListener('wheel', e=>{
  e.preventDefault();
  e.currentTarget.scrollBy({ left: e.deltaY, behavior: 'smooth' });
});

/* ---------- article open / close ---------- */
document.querySelectorAll('.card').forEach(card=>{
  card.addEventListener('click', ()=>{
    document.getElementById(card.dataset.article).classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

document.querySelectorAll('.close').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.closest('.article').classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ---------- Likes & Comments Feature ---------- */

// Initialize article data in Firestore
async function initializeArticleData() {
  // Set up initial article data if it doesn't exist
  const articles = [
    { id: 'puja-nyc', title: 'Durga Puja in New York City', likeCount: 0, commentCount: 0 },
    { id: 'bricklane', title: 'Adda at Brick Lane', likeCount: 0, commentCount: 0 }
  ];
  
  for (const article of articles) {
    const articleRef = doc(db, `articles/${article.id}`);
    const articleDoc = await getDoc(articleRef);
    
    if (!articleDoc.exists()) {
      await setDoc(articleRef, {
        title: article.title,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });
    }
  }
}

// Toggle like on an article
async function toggleLike(articleId) {
  if (!auth.currentUser) {
    // If not logged in, prompt to sign in
    loginBtn.click();
    return;
  }
  
  const userId = auth.currentUser.uid;
  const likeRef = doc(db, `likes/${articleId}/users/${userId}`);
  const articleRef = doc(db, `articles/${articleId}`);
  
  try {
    const likeDoc = await getDoc(likeRef);
    
    if (likeDoc.exists()) {
      // User already liked this article - unlike it
      await deleteDoc(likeRef);
      await updateDoc(articleRef, {
        likeCount: increment(-1)
      });
      
      // Update UI
      const likeButton = document.querySelector(`#${articleId} .like-button`);
      likeButton.classList.remove('liked');
      likeButton.querySelector('.like-text').textContent = 'Like';
    } else {
      // User hasn't liked this article yet - like it
      await setDoc(likeRef, {
        userId: userId,
        timestamp: serverTimestamp()
      });
      await updateDoc(articleRef, {
        likeCount: increment(1)
      });
      
      // Update UI
      const likeButton = document.querySelector(`#${articleId} .like-button`);
      likeButton.classList.add('liked');
      likeButton.querySelector('.like-text').textContent = 'Liked';
      
      // Show heart animation
      likeButton.querySelector('i').classList.add('heart-animation');
      setTimeout(() => {
        likeButton.querySelector('i').classList.remove('heart-animation');
      }, 300);
    }
    
    // Update like counts in UI
    updateLikeCount(articleId);
    
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

// Add a comment to an article
async function addComment(articleId, commentText, isAnonymous) {
  if (!commentText.trim()) return;
  
  if (!auth.currentUser && !isAnonymous) {
    // If not logged in and not anonymous, prompt to sign in
    loginBtn.click();
    return;
  }
  
  try {
    const commentsRef = collection(db, `comments/${articleId}/messages`);
    const articleRef = doc(db, `articles/${articleId}`);
    
    // Create the comment data
    const commentData = {
      text: commentText,
      timestamp: serverTimestamp(),
      isAnonymous: isAnonymous
    };
    
    // Add user data if not anonymous
    if (!isAnonymous && auth.currentUser) {
      commentData.userId = auth.currentUser.uid;
      commentData.userName = auth.currentUser.displayName || 'User';
      commentData.userPhoto = auth.currentUser.photoURL || null;
    } else {
      commentData.userName = 'Anonymous';
    }
    
    // Add the comment
    await addDoc(commentsRef, commentData);
    
    // Update comment count
    await updateDoc(articleRef, {
      commentCount: increment(1)
    });
    
    // Update UI
    updateCommentCount(articleId);
    loadComments(articleId);
    
    // Clear the comment form
    const textarea = document.querySelector(`#${articleId} .comment-form textarea`);
    textarea.value = '';
    
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

// Load comments for an article
async function loadComments(articleId) {
  try {
    const commentsRef = collection(db, `comments/${articleId}/messages`);
    const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const commentsList = document.querySelector(`#${articleId} .comments-list`);
    const noCommentsMessage = document.querySelector(`#${articleId} .no-comments-message`);
    
    // Clear existing comments
    commentsList.innerHTML = '';
    
    if (querySnapshot.empty) {
      commentsList.appendChild(noCommentsMessage || createNoCommentsElement());
      return;
    }
    
    // Add comments to the list
    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      const commentEl = createCommentElement(commentData);
      commentsList.appendChild(commentEl);
    });
    
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Create a comment element
function createCommentElement(commentData) {
  const comment = document.createElement('div');
  comment.className = 'comment';
  
  const header = document.createElement('div');
  header.className = 'comment-header';
  
  const author = document.createElement('span');
  author.className = 'comment-author';
  author.textContent = commentData.userName;
  
  const time = document.createElement('span');
  time.className = 'comment-time';
  const timestamp = commentData.timestamp?.toDate() || new Date();
  time.textContent = formatDate(timestamp);
  
  header.appendChild(author);
  header.appendChild(time);
  
  const text = document.createElement('div');
  text.className = 'comment-text';
  text.textContent = commentData.text;
  
  comment.appendChild(header);
  comment.appendChild(text);
  
  return comment;
}

// Create "no comments" message element
function createNoCommentsElement() {
  const message = document.createElement('p');
  message.className = 'no-comments-message';
  message.textContent = 'Be the first to comment!';
  return message;
}

// Format date for comments
function formatDate(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  
  // If older than a month, show the date
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// Update like count in UI
async function updateLikeCount(articleId) {
  try {
    const articleRef = doc(db, `articles/${articleId}`);
    const articleDoc = await getDoc(articleRef);
    
    if (articleDoc.exists()) {
      const likeCount = articleDoc.data().likeCount || 0;
      
      // Update count in card
      const cardLikeCount = document.querySelector(`.card[data-article="${articleId}"] .like-count`);
      if (cardLikeCount) cardLikeCount.textContent = likeCount;
      
      // Update count in article
      const articleLikeCount = document.querySelector(`#${articleId} .like-count-display`);
      if (articleLikeCount) {
        articleLikeCount.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
      }
    }
  } catch (error) {
    console.error('Error updating like count:', error);
  }
}

// Update comment count in UI
async function updateCommentCount(articleId) {
  try {
    const articleRef = doc(db, `articles/${articleId}`);
    const articleDoc = await getDoc(articleRef);
    
    if (articleDoc.exists()) {
      const commentCount = articleDoc.data().commentCount || 0;
      
      // Update count in card
      const cardCommentCount = document.querySelector(`.card[data-article="${articleId}"] .comment-count`);
      if (cardCommentCount) cardCommentCount.textContent = commentCount;
      
      // Update count in article heading
      const commentsHeading = document.querySelector(`#${articleId} .comments-section h3`);
      if (commentsHeading) {
        commentsHeading.textContent = `Comments${commentCount > 0 ? ` (${commentCount})` : ''}`;
      }
    }
  } catch (error) {
    console.error('Error updating comment count:', error);
  }
}

// Check if current user liked an article
async function checkUserLiked(articleId) {
  if (!auth.currentUser) return false;
  
  try {
    const likeRef = doc(db, `likes/${articleId}/users/${auth.currentUser.uid}`);
    const likeDoc = await getDoc(likeRef);
    
    const likeButton = document.querySelector(`#${articleId} .like-button`);
    if (likeDoc.exists()) {
      likeButton.classList.add('liked');
      likeButton.querySelector('.like-text').textContent = 'Liked';
    } else {
      likeButton.classList.remove('liked');
      likeButton.querySelector('.like-text').textContent = 'Like';
    }
    
    return likeDoc.exists();
  } catch (error) {
    console.error('Error checking if user liked:', error);
    return false;
  }
}

// Setup double tap for mobile devices
function setupDoubleTap(articleId) {
  const article = document.getElementById(articleId);
  const content = article.querySelector('.article-content');
  
  // Create overlay for heart animation
  const overlay = document.createElement('div');
  overlay.className = 'double-tap-overlay';
  overlay.innerHTML = '<i class="fas fa-heart"></i>';
  article.appendChild(overlay);
  
  // Variables for double tap detection
  let lastTap = 0;
  
  content.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      toggleLike(articleId);
      
      // Show heart animation
      overlay.classList.add('show');
      setTimeout(() => {
        overlay.classList.remove('show');
      }, 1000);
      
      e.preventDefault();
    }
    
    lastTap = currentTime;
  });
}

// Initialize likes and comments feature
function initializeLikesAndComments() {
  // Initialize article data
  initializeArticleData();
  
  // Setup event listeners for articles
  document.querySelectorAll('.article').forEach(article => {
    const articleId = article.id;
    
    // Like button click
    const likeButton = article.querySelector('.like-button');
    likeButton.addEventListener('click', () => toggleLike(articleId));
    
    // Comment form submission
    const commentForm = article.querySelector('.comment-form');
    const commentSubmit = commentForm.querySelector('.comment-submit');
    const textarea = commentForm.querySelector('textarea');
    const anonymousCheckbox = commentForm.querySelector('.anonymous-checkbox');
    
    commentSubmit.addEventListener('click', () => {
      const commentText = textarea.value.trim();
      const isAnonymous = anonymousCheckbox.checked;
      
      if (commentText) {
        addComment(articleId, commentText, isAnonymous);
      }
    });
    
    // Double tap setup for mobile
    setupDoubleTap(articleId);
    
    // Initial load of comments and like status
    loadComments(articleId);
    updateLikeCount(articleId);
    updateCommentCount(articleId);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initializeLikesAndComments();
  }, 1000);
});

// The auth state change handler is already defined above, we just need to add
// checking like status to the existing handler
