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
    
    // Set up real-time like status listeners for each article when user logs in
    document.querySelectorAll('.article').forEach(article => {
      const articleId = article.id;
      if (articleId && window.pfListeners) {
        // Remove any previous listener for this user/article combo
        if (window.pfListeners[`userLike_${articleId}`]) {
          try {
            window.pfListeners[`userLike_${articleId}`](); // Call unsubscribe function
          } catch (e) {
            console.error("Error unsubscribing from previous listener:", e);
          }
        }
        
        // Set up new real-time listener for this user/article
        window.pfListeners[`userLike_${articleId}`] = setupUserLikeListener(articleId);
      } else {
        // Fall back to one-time check if listeners aren't set up yet
        checkUserLiked(article.id);
      }
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
  try {
    // Verify Firestore is initialized
    if (!db) {
      console.error('Firebase Firestore is not initialized');
      return;
    }
    
    // Set up initial article data if it doesn't exist
    const articles = [
      { id: 'puja-nyc', title: 'Durga Puja in New York City', likeCount: 0, commentCount: 0 },
      { id: 'bricklane', title: 'Adda at Brick Lane', likeCount: 0, commentCount: 0 }
    ];
    
    console.log('Initializing article data for', articles.map(a => a.id).join(', '));
    
    for (const article of articles) {
      const articleRef = doc(db, `articles/${article.id}`);
      const articleDoc = await getDoc(articleRef);
      
      if (!articleDoc.exists()) {
        console.log(`Creating new article data for ${article.id}`);
        await setDoc(articleRef, {
          title: article.title,
          likeCount: 0,
          commentCount: 0,
          createdAt: serverTimestamp()
        });
      } else {
        console.log(`Article data for ${article.id} already exists`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing article data:', error);
    throw error; // Re-throw so we can catch it in the calling function
  }
}

// Toggle like on an article
async function toggleLike(articleId) {
  // First check if articleId exists
  if (!articleId) {
    console.error('No article ID provided to toggleLike function');
    return;
  }

  // Verify if Firebase auth is initialized
  if (!auth) {
    console.error('Firebase Auth is not initialized');
    return;
  }
  
  if (!auth.currentUser) {
    console.log('User not logged in, prompting sign in');
    // If not logged in, prompt to sign in
    loginBtn.click();
    return;
  }
  
  const userId = auth.currentUser.uid;
  
  // Verify if Firestore is initialized
  if (!db) {
    console.error('Firebase Firestore is not initialized');
    return;
  }
  
  console.log(`Toggling like for article ${articleId} by user ${userId}`);
  
  const likeRef = doc(db, `likes/${articleId}/users/${userId}`);
  const articleRef = doc(db, `articles/${articleId}`);
  
  // Find the like button before we start any async operations
  const likeButton = document.querySelector(`#${articleId} .like-button`);
  if (!likeButton) {
    console.error(`Like button for article ${articleId} not found in the DOM`);
    return;
  }
  
  // Disable button during operation to prevent double-clicks
  likeButton.disabled = true;
  
  try {
    const likeDoc = await getDoc(likeRef);
    
    if (likeDoc.exists()) {
      console.log(`User ${userId} unliking article ${articleId}`);
      // User already liked this article - unlike it
      await deleteDoc(likeRef);
      await updateDoc(articleRef, {
        likeCount: increment(-1)
      });
      
      // Update UI
      likeButton.classList.remove('liked');
      const likeText = likeButton.querySelector('.like-text');
      if (likeText) likeText.textContent = 'Like';
    } else {
      console.log(`User ${userId} liking article ${articleId}`);
      // User hasn't liked this article yet - like it
      await setDoc(likeRef, {
        userId: userId,
        timestamp: serverTimestamp()
      });
      await updateDoc(articleRef, {
        likeCount: increment(1)
      });
      
      // Update UI
      likeButton.classList.add('liked');
      const likeText = likeButton.querySelector('.like-text');
      if (likeText) likeText.textContent = 'Liked';
      
      // Show heart animation
      const heartIcon = likeButton.querySelector('i');
      if (heartIcon) {
        heartIcon.classList.add('heart-animation');
        setTimeout(() => {
          heartIcon.classList.remove('heart-animation');
        }, 300);
      }
    }
    
    console.log(`Like operation completed successfully for article ${articleId}`);
    
    // We don't need to manually update counts since we have real-time listeners
    // But keeping this for backwards compatibility
    updateLikeCount(articleId);
    
  } catch (error) {
    console.error(`Error toggling like for article ${articleId}:`, error);
    // Show error notification if needed
  } finally {
    // Re-enable the button regardless of success or failure
    likeButton.disabled = false;
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

// Set up real-time listener for comments
function setupCommentsListener(articleId) {
  const commentsRef = collection(db, `comments/${articleId}/messages`);
  const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(10));
  
  // Return the unsubscribe function in case we need to stop listening later
  return onSnapshot(q, {
    next: (querySnapshot) => {
      const commentsList = document.querySelector(`#${articleId} .comments-list`);
      if (!commentsList) return;
      
      // Clear existing comments
      commentsList.innerHTML = '';
      
      if (querySnapshot.empty) {
        commentsList.appendChild(createNoCommentsElement());
        return;
      }
      
      // Add comments to the list
      querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        const commentEl = createCommentElement(commentData);
        commentsList.appendChild(commentEl);
      });
      
      console.log(`Real-time update: loaded ${querySnapshot.size} comments for ${articleId}`);
    },
    error: (error) => {
      console.error('Error listening to comments:', error);
    }
  });
}

// For backward compatibility, keep a one-time loading function too
async function loadComments(articleId) {
  try {
    const commentsRef = collection(db, `comments/${articleId}/messages`);
    const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const commentsList = document.querySelector(`#${articleId} .comments-list`);
    if (!commentsList) return;
    
    // Clear existing comments
    commentsList.innerHTML = '';
    
    if (querySnapshot.empty) {
      commentsList.appendChild(createNoCommentsElement());
      return;
    }
    
    // Add comments to the list
    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      const commentEl = createCommentElement(commentData);
      commentsList.appendChild(commentEl);
    });
    
    console.log(`One-time loaded ${querySnapshot.size} comments for ${articleId}`);
    
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

// Set up real-time listener for like count updates
function setupLikeCountListener(articleId) {
  const articleRef = doc(db, `articles/${articleId}`);
  
  // Return the unsubscribe function in case we need to stop listening later
  return onSnapshot(articleRef, {
    next: (docSnapshot) => {
      if (docSnapshot.exists()) {
        const likeCount = docSnapshot.data().likeCount || 0;
        
        // Update count in card
        const cardLikeCount = document.querySelector(`.card[data-article="${articleId}"] .like-count`);
        if (cardLikeCount) cardLikeCount.textContent = likeCount;
        
        // Update count in article
        const articleLikeCount = document.querySelector(`#${articleId} .like-count-display`);
        if (articleLikeCount) {
          articleLikeCount.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
        }
        
        console.log(`Real-time update: ${articleId} now has ${likeCount} likes`);
      }
    },
    error: (error) => {
      console.error('Error listening to like count updates:', error);
    }
  });
}

// For backward compatibility, keep a one-time update function too
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
      
      console.log(`One-time update: ${articleId} has ${likeCount} likes`);
    }
  } catch (error) {
    console.error('Error updating like count:', error);
  }
}

// Set up real-time listener for comment count
function setupCommentCountListener(articleId) {
  const articleRef = doc(db, `articles/${articleId}`);
  
  // Return the unsubscribe function in case we need to stop listening later
  return onSnapshot(articleRef, {
    next: (docSnapshot) => {
      if (docSnapshot.exists()) {
        const commentCount = docSnapshot.data().commentCount || 0;
        
        // Update count in card
        const cardCommentCount = document.querySelector(`.card[data-article="${articleId}"] .comment-count`);
        if (cardCommentCount) cardCommentCount.textContent = commentCount;
        
        // Update count in article heading
        const commentsHeading = document.querySelector(`#${articleId} .comments-section h3`);
        if (commentsHeading) {
          commentsHeading.textContent = `Comments${commentCount > 0 ? ` (${commentCount})` : ''}`;
        }
        
        console.log(`Real-time update: ${articleId} now has ${commentCount} comments`);
      }
    },
    error: (error) => {
      console.error('Error listening to comment count updates:', error);
    }
  });
}

// For backward compatibility, keep a one-time update function too
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
      
      console.log(`One-time update: ${articleId} has ${commentCount} comments`);
    }
  } catch (error) {
    console.error('Error updating comment count:', error);
  }
}

// Set up real-time listener for user's like status
function setupUserLikeListener(articleId) {
  if (!auth.currentUser) return null;
  const userId = auth.currentUser.uid;
  
  const likeRef = doc(db, `likes/${articleId}/users/${userId}`);
  
  // Return the unsubscribe function in case we need to stop listening later
  return onSnapshot(likeRef, {
    next: (docSnapshot) => {
      const likeButton = document.querySelector(`#${articleId} .like-button`);
      if (!likeButton) return;
      
      const likeText = likeButton.querySelector('.like-text');
      if (!likeText) return;
      
      if (docSnapshot.exists()) {
        likeButton.classList.add('liked');
        likeText.textContent = 'Liked';
      } else {
        likeButton.classList.remove('liked');
        likeText.textContent = 'Like';
      }
      
      console.log(`Real-time update: User ${userId} ${docSnapshot.exists() ? 'has liked' : 'has not liked'} article ${articleId}`);
    },
    error: (error) => {
      console.error(`Error listening to user like status for article ${articleId}:`, error);
    }
  });
}

// For backward compatibility, keep a one-time check function too
async function checkUserLiked(articleId) {
  if (!auth.currentUser) return false;
  
  try {
    const userId = auth.currentUser.uid;
    console.log(`Checking if user ${userId} liked article ${articleId}`);
    
    const likeRef = doc(db, `likes/${articleId}/users/${userId}`);
    const likeDoc = await getDoc(likeRef);
    
    const likeButton = document.querySelector(`#${articleId} .like-button`);
    if (!likeButton) {
      console.warn(`Like button not found for article ${articleId}`);
      return false;
    }
    
    const likeText = likeButton.querySelector('.like-text');
    
    if (likeDoc.exists()) {
      console.log(`User ${userId} has liked article ${articleId}`);
      likeButton.classList.add('liked');
      if (likeText) likeText.textContent = 'Liked';
    } else {
      console.log(`User ${userId} has not liked article ${articleId}`);
      likeButton.classList.remove('liked');
      if (likeText) likeText.textContent = 'Like';
    }
    
    return likeDoc.exists();
  } catch (error) {
    console.error(`Error checking if user ${auth.currentUser?.uid} liked article ${articleId}:`, error);
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
  console.log('Initializing likes and comments functionality');
  
  // Initialize article data in Firestore
  initializeArticleData().then(() => {
    console.log('Article data initialized in Firestore');
    
    // Store listeners so we can unsubscribe later if needed
    const listeners = {};
    
    // Setup event listeners for articles
    document.querySelectorAll('.article').forEach(article => {
      const articleId = article.id;
      console.log(`Setting up article: ${articleId}`);
      
      // Make sure article is valid
      if (!articleId) {
        console.error('Found article without ID', article);
        return;
      }
      
      // Like button click
      const likeButton = article.querySelector('.like-button');
      if (likeButton) {
        console.log(`Setting up like button for ${articleId}`);
        likeButton.addEventListener('click', (e) => {
          e.preventDefault();
          toggleLike(articleId);
        });
      } else {
        console.warn(`Like button not found for article ${articleId}`);
      }
      
      // Comment form submission
      const commentForm = article.querySelector('.comment-form');
      if (commentForm) {
        const commentSubmit = commentForm.querySelector('.comment-submit');
        const textarea = commentForm.querySelector('textarea');
        const anonymousCheckbox = commentForm.querySelector('.anonymous-checkbox');
        
        if (commentSubmit && textarea) {
          console.log(`Setting up comment form for ${articleId}`);
          commentSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const commentText = textarea.value.trim();
            const isAnonymous = anonymousCheckbox ? anonymousCheckbox.checked : false;
            
            if (commentText) {
              addComment(articleId, commentText, isAnonymous);
            }
          });
          
          // Also allow Enter key to submit comment
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const commentText = textarea.value.trim();
              const isAnonymous = anonymousCheckbox ? anonymousCheckbox.checked : false;
              
              if (commentText) {
                addComment(articleId, commentText, isAnonymous);
              }
            }
          });
        }
      }
      
      // Double tap setup for mobile
      setupDoubleTap(articleId);      // Set up real-time listeners for this article
      console.log(`Setting up real-time listeners for ${articleId}`);
      listeners[`likes_${articleId}`] = setupLikeCountListener(articleId);
      listeners[`comments_${articleId}`] = setupCommentsListener(articleId);
      listeners[`commentCount_${articleId}`] = setupCommentCountListener(articleId);
      
      // Set up real-time listener for user's like status if logged in
      if (auth.currentUser) {
        listeners[`userLike_${articleId}`] = setupUserLikeListener(articleId);
      } else {
        // Just do a one-time check
        checkUserLiked(articleId);
      }
    });
    
    // Store listeners in window object so they persist
    window.pfListeners = listeners;
    
    console.log('Likes and comments functionality initialized successfully');
  }).catch(error => {
    console.error('Failed to initialize article data:', error);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Ensure Firebase is properly initialized before we start using it
  if (db) {
    console.log('Firebase Firestore is available - initializing features');
    // Give a bit more time for Firebase to fully initialize
    setTimeout(() => {
      initializeLikesAndComments();
    }, 1500);
  } else {
    console.error('Firebase Firestore is not available - check Firebase initialization');
  }
});

// The auth state change handler is already defined above, we just need to add
// checking like status to the existing handler
