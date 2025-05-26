/* ---------- Firebase Google sign-in ---------- */
import { initializeApp } from
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import { getAuth, GoogleAuthProvider,
         signInWithPopup, onAuthStateChanged,
         signOut } from
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';

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
