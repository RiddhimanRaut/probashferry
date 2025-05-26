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

/* buttons from index.html */
const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.onclick  = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, user => {
  const logged = !!user;
  loginBtn.hidden  = logged;
  logoutBtn.hidden = !logged;
  if (logged) console.log(`Logged in as ${user.displayName}`);
});
/* ---------- end Firebase block ---------- */



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
