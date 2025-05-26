// Fixed version of app.js with simplified like implementation
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

/* Firebase configuration */
const firebaseConfig = {
  apiKey: "AIzaSyDNoiJOr9uvTzM3HyQcyaK4-Pab_uRSXko",
  authDomain: "probashferry-magazine.firebaseapp.com",
  projectId: "probashferry-magazine",
  storageBucket: "probashferry-magazine.firebasestorage.app",
  messagingSenderId: "24509668619",
  appId: "1:24509668619:web:d61b7bd89ee444a051d60e",
  measurementId: "G-7J8JPB239G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Debug flag
const DEBUG = true;

// Debug log function
function debug(message) {
  if (DEBUG) {
    console.log(`[PF] ${message}`);
  }
}

/* elements from index.html */
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeMsg = document.getElementById('welcomeMsg');
const userName = document.getElementById('userName');

// Authentication event handlers
loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

// Auth state change handler
onAuthStateChanged(auth, user => {
  const logged = !!user;
  debug(`Auth state changed: ${logged ? 'logged in' : 'logged out'}`);
  
  loginBtn.hidden = logged;
  logoutBtn.hidden = !logged;
  welcomeMsg.hidden = !logged;
  
  loginBtn.style.display = logged ? 'none' : 'flex';
  logoutBtn.style.display = logged ? 'flex' : 'none';
  
  if (logged) {
    debug(`Logged in as ${user.displayName}`);
    
    // Extract first name from displayName
    const firstName = user.displayName.split(' ')[0];
    userName.textContent = firstName;
    
    // Check like status for all articles
    document.querySelectorAll('.article').forEach(article => {
      checkUserLiked(article.id);
    });
  } else {
    debug('User logged out');
  }
});

/* ---------- wheel: translate vertical wheel-scroll to horizontal ---------- */
document.querySelector('.h-scroll').addEventListener('wheel', e => {
  e.preventDefault();
  e.currentTarget.scrollBy({ left: e.deltaY, behavior: 'smooth' });
});

/* ---------- article open / close ---------- */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    const articleId = card.dataset.article;
    debug(`Opening article: ${articleId}`);
    
    document.getElementById(articleId).classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', () => {
    debug('Closing article');
    btn.closest('.article').classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ---------- Likes & Comments Feature ---------- */

// Initialize article data in Firestore
async function initializeArticleData() {
  debug('Initializing article data');
  
  const articles = [
    { id: 'puja-nyc', title: 'Durga Puja in New York City', likeCount: 0, commentCount: 0 },
    { id: 'bricklane', title: 'Adda at Brick Lane', likeCount: 0, commentCount: 0 }
  ];
  
  for (const article of articles) {
    const articleRef = doc(db, `articles/${article.id}`);
    const articleDoc = await getDoc(articleRef);
    
    if (!articleDoc.exists()) {
      debug(`Creating article data for ${article.id}`);
      await setDoc(articleRef, {
        title: article.title,
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });
    }
  }
}

// Toggle like on article
async function toggleLike(articleId) {
  debug(`Toggle like for article: ${articleId}`);
  
  if (!auth.currentUser) {
    debug('User not logged in, prompting sign in');
    loginBtn.click();
    return;
  }
  
  const userId = auth.currentUser.uid;
  const likeRef = doc(db, `likes/${articleId}/users/${userId}`);
  const articleRef = doc(db, `articles/${articleId}`);
  
  // Find the like button
  const likeButton = document.querySelector(`#${articleId} .like-button`);
  if (!likeButton) {
    debug('Like button not found');
    return;
  }
  
  try {
    const likeDoc = await getDoc(likeRef);
    
    if (likeDoc.exists()) {
      // Unlike
      debug('User already liked, removing like');
      await deleteDoc(likeRef);
      await updateDoc(articleRef, { likeCount: increment(-1) });
      
      likeButton.classList.remove('liked');
      likeButton.querySelector('.like-text').textContent = 'Like';
    } else {
      // Like
      debug('User not liked yet, adding like');
      await setDoc(likeRef, {
        userId: userId,
        timestamp: serverTimestamp()
      });
      await updateDoc(articleRef, { likeCount: increment(1) });
      
      likeButton.classList.add('liked');
      likeButton.querySelector('.like-text').textContent = 'Liked';
      
      // Show animation
      const heartIcon = likeButton.querySelector('i');
      if (heartIcon) {
        heartIcon.classList.add('heart-animation');
        setTimeout(() => {
          heartIcon.classList.remove('heart-animation');
        }, 300);
      }
    }
    
    // Update like counts in UI
    updateLikeCount(articleId);
    
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

// Check if user has liked an article
async function checkUserLiked(articleId) {
  if (!auth.currentUser) return false;
  
  try {
    debug(`Checking if user liked article: ${articleId}`);
    
    const userId = auth.currentUser.uid;
    const likeRef = doc(db, `likes/${articleId}/users/${userId}`);
    const likeDoc = await getDoc(likeRef);
    
    const likeButton = document.querySelector(`#${articleId} .like-button`);
    if (!likeButton) return false;
    
    if (likeDoc.exists()) {
      debug(`User has liked article: ${articleId}`);
      likeButton.classList.add('liked');
      likeButton.querySelector('.like-text').textContent = 'Liked';
    } else {
      debug(`User has not liked article: ${articleId}`);
      likeButton.classList.remove('liked');
      likeButton.querySelector('.like-text').textContent = 'Like';
    }
    
    return likeDoc.exists();
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

// Update like count in UI
async function updateLikeCount(articleId) {
  try {
    debug(`Updating like count for article: ${articleId}`);
    
    const articleRef = doc(db, `articles/${articleId}`);
    const articleDoc = await getDoc(articleRef);
    
    if (articleDoc.exists()) {
      const likeCount = articleDoc.data().likeCount || 0;
      
      // Update card
      const cardLikeCount = document.querySelector(`.card[data-article="${articleId}"] .like-count`);
      if (cardLikeCount) cardLikeCount.textContent = likeCount;
      
      // Update article
      const articleLikeCount = document.querySelector(`#${articleId} .like-count-display`);
      if (articleLikeCount) {
        articleLikeCount.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
      }
      
      debug(`Updated like count: ${likeCount}`);
    }
  } catch (error) {
    console.error('Error updating like count:', error);
  }
}

// Add comment to article
async function addComment(articleId, commentText, isAnonymous) {
  if (!commentText.trim()) return;
  
  debug(`Adding comment to article: ${articleId}`);
  
  if (!auth.currentUser && !isAnonymous) {
    debug('User not logged in and not anonymous, prompting sign in');
    loginBtn.click();
    return;
  }
  
  try {
    const commentsRef = collection(db, `comments/${articleId}/messages`);
    const articleRef = doc(db, `articles/${articleId}`);
    
    // Create comment data
    const commentData = {
      text: commentText,
      timestamp: serverTimestamp(),
      isAnonymous: isAnonymous
    };
    
    if (!isAnonymous && auth.currentUser) {
      commentData.userId = auth.currentUser.uid;
      commentData.userName = auth.currentUser.displayName || 'User';
      commentData.userPhoto = auth.currentUser.photoURL || null;
    } else {
      commentData.userName = 'Anonymous';
    }
    
    // Add comment
    await addDoc(commentsRef, commentData);
    
    // Update comment count
    await updateDoc(articleRef, {
      commentCount: increment(1)
    });
    
    // Update UI
    updateCommentCount(articleId);
    loadComments(articleId);
    
    // Clear form
    const textarea = document.querySelector(`#${articleId} .comment-form textarea`);
    if (textarea) textarea.value = '';
    
    debug('Comment added successfully');
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

// Load comments for article
async function loadComments(articleId) {
  try {
    debug(`Loading comments for article: ${articleId}`);
    
    const commentsRef = collection(db, `comments/${articleId}/messages`);
    const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const commentsList = document.querySelector(`#${articleId} .comments-list`);
    if (!commentsList) return;
    
    // Clear existing comments
    commentsList.innerHTML = '';
    
    if (querySnapshot.empty) {
      debug('No comments found');
      commentsList.appendChild(createNoCommentsElement());
      return;
    }
    
    // Add comments
    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      const commentEl = createCommentElement(commentData);
      commentsList.appendChild(commentEl);
    });
    
    debug(`Loaded ${querySnapshot.size} comments`);
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Create comment element
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

// Create "no comments" message
function createNoCommentsElement() {
  const message = document.createElement('p');
  message.className = 'no-comments-message';
  message.textContent = 'Be the first to comment!';
  return message;
}

// Format date for comments
function formatDate(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// Update comment count in UI
async function updateCommentCount(articleId) {
  try {
    debug(`Updating comment count for article: ${articleId}`);
    
    const articleRef = doc(db, `articles/${articleId}`);
    const articleDoc = await getDoc(articleRef);
    
    if (articleDoc.exists()) {
      const commentCount = articleDoc.data().commentCount || 0;
      
      // Update card
      const cardCommentCount = document.querySelector(`.card[data-article="${articleId}"] .comment-count`);
      if (cardCommentCount) cardCommentCount.textContent = commentCount;
      
      // Update article heading
      const commentsHeading = document.querySelector(`#${articleId} .comments-section h3`);
      if (commentsHeading) {
        commentsHeading.textContent = `Comments${commentCount > 0 ? ` (${commentCount})` : ''}`;
      }
      
      debug(`Updated comment count: ${commentCount}`);
    }
  } catch (error) {
    console.error('Error updating comment count:', error);
  }
}

// Setup double tap for mobile
function setupDoubleTap(articleId) {
  debug(`Setting up double tap for article: ${articleId}`);
  
  const article = document.getElementById(articleId);
  if (!article) return;
  
  const content = article.querySelector('.article-content');
  if (!content) return;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'double-tap-overlay';
  overlay.innerHTML = '<i class="fas fa-heart"></i>';
  article.appendChild(overlay);
  
  // Double tap detection
  let lastTap = 0;
  content.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      debug('Double tap detected');
      toggleLike(articleId);
      
      // Show animation
      overlay.classList.add('show');
      setTimeout(() => {
        overlay.classList.remove('show');
      }, 1000);
      
      e.preventDefault();
    }
    
    lastTap = currentTime;
  });
}

// Initialize likes and comments
function initializeLikesAndComments() {
  debug('Initializing likes and comments functionality');
  
  // Initialize article data
  initializeArticleData().then(() => {
    debug('Article data initialized');
    
    // Setup articles
    document.querySelectorAll('.article').forEach(article => {
      const articleId = article.id;
      debug(`Setting up article: ${articleId}`);
      
      // Find like button
      const likeButton = article.querySelector('.like-button');
      if (likeButton) {
        debug(`Setting up like button for article: ${articleId}`);
        
        // Remove any existing event listeners
        const newButton = likeButton.cloneNode(true);
        likeButton.parentNode.replaceChild(newButton, likeButton);
        
        // Add event listener
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          debug(`Like button clicked for article: ${articleId}`);
          toggleLike(articleId);
        });
      } else {
        debug(`No like button found for article: ${articleId}`);
      }
      
      // Find comment form
      const commentForm = article.querySelector('.comment-form');
      if (commentForm) {
        debug(`Setting up comment form for article: ${articleId}`);
        
        const commentSubmit = commentForm.querySelector('.comment-submit');
        const textarea = commentForm.querySelector('textarea');
        const anonymousCheckbox = commentForm.querySelector('.anonymous-checkbox');
        
        if (commentSubmit && textarea) {
          // Remove any existing event listeners
          const newSubmit = commentSubmit.cloneNode(true);
          commentSubmit.parentNode.replaceChild(newSubmit, commentSubmit);
          
          // Add event listener
          newSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const commentText = textarea.value.trim();
            const isAnonymous = anonymousCheckbox ? anonymousCheckbox.checked : false;
            
            if (commentText) {
              debug(`Comment submitted for article: ${articleId}`);
              addComment(articleId, commentText, isAnonymous);
            }
          });
        }
      } else {
        debug(`No comment form found for article: ${articleId}`);
      }
      
      // Setup double tap
      setupDoubleTap(articleId);
      
      // Initial load
      loadComments(articleId);
      updateLikeCount(articleId);
      updateCommentCount(articleId);
      
      if (auth.currentUser) {
        checkUserLiked(articleId);
      }
    });
  }).catch(error => {
    console.error('Error initializing likes and comments:', error);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  debug('DOM content loaded');
  
  // Delay to ensure Firebase is initialized
  setTimeout(() => {
    debug('Initializing functionality');
    initializeLikesAndComments();
  }, 1000);
});
