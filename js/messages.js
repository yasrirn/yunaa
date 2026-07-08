/* ======================================================================
   MESSAGES.JS
   ----------------------------------------------------------------------
   Logic untuk fitur "Tinggalkan Pesan" (buku tamu).
   - Pesan disimpan di Firebase Realtime Database, jadi SEMUA pengunjung
     dari device manapun bisa lihat pesan yang sama secara real-time.
   - Kalau firebase-config.js belum diisi (masih placeholder), fitur ini
     otomatis fallback ke localStorage (hanya tersimpan lokal per device)
     supaya tetap jalan walau belum setup Firebase.
   - Menampilkan tiap pesan sebagai sticky note beranimasi, warna &
     kemiringan acak, bisa dihapus lagi kalau perlu.
   - Memakai playClick() / playPop() yang sudah didefinisikan di script.js,
     jadi file ini HARUS dimuat setelah script.js (dan setelah
     firebase-config.js kalau dipakai).
   ====================================================================== */

const STORAGE_KEY = 'untuk-yuna-guestbook-messages';
const noteColors = ['c-pink','c-yellow','c-lavender','c-mint','c-peach'];

// aktif kalau firebase-config.js sudah diisi config asli (bukan placeholder)
const useFirebase = (typeof db !== 'undefined')
  && typeof firebaseConfig !== 'undefined'
  && !String(firebaseConfig.apiKey).includes('GANTI');

const messagesRef = useFirebase ? db.ref('guestbook-messages') : null;

const form = document.getElementById('messageForm');
const nameInput = document.getElementById('msgName');
const textInput = document.getElementById('msgText');
const counter = document.getElementById('msgCounter');
const submitBtn = document.getElementById('msgSubmit');
const wall = document.getElementById('notesWall');
const emptyHint = document.getElementById('notesEmpty');

/* ---------- fallback localStorage (dipakai kalau Firebase belum diset) ---------- */
function loadLocalMessages(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveLocalMessages(list){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }catch(e){}
}

function formatDate(ts){
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function updateEmptyHint(){
  const hasNotes = wall.children.length > 0;
  emptyHint.style.display = hasNotes ? 'none' : 'block';
}

function deleteMessage(id, noteEl){
  playClick();
  noteEl.classList.add('removing');
  setTimeout(()=>{
    noteEl.remove();
    if(useFirebase){
      messagesRef.child(id).remove();
    }else{
      const remaining = loadLocalMessages().filter(m => m.id !== id);
      saveLocalMessages(remaining);
    }
    updateEmptyHint();
  }, 320);
}

function renderNote(id, msg, animate){
  const note = document.createElement('div');
  const color = noteColors[Math.floor(Math.random()*noteColors.length)];
  const rot = (Math.random()*10 - 5).toFixed(1);
  note.className = `note ${color}`;
  note.style.setProperty('--nrot', rot + 'deg');
  if(!animate) note.style.animationDuration = '0s';
  note.dataset.id = id;
  note.innerHTML = `
    <button class="note-del" title="hapus pesan" aria-label="hapus pesan">✕</button>
    <span class="note-text"></span>
    <div class="note-meta">
      <span class="note-from"></span>
      <span class="note-date">${formatDate(msg.date)}</span>
    </div>
  `;
  note.querySelector('.note-text').textContent = msg.text;
  note.querySelector('.note-from').textContent = '— ' + (msg.name || 'anonim');

  note.querySelector('.note-del').addEventListener('click', ()=>{
    deleteMessage(id, note);
  });

  wall.prepend(note);
  updateEmptyHint();
}

if(useFirebase){
  // ---------- mode Firebase: real-time sync ke semua pengunjung ----------
  let initialLoadDone = false;

  messagesRef.once('value').then(()=>{
    initialLoadDone = true;
  });

  messagesRef.on('child_added', (snapshot)=>{
    // pesan lama (sudah ada sebelum halaman dibuka) tampil tanpa animasi masuk,
    // pesan baru yang ditambahkan setelah halaman terbuka tampil dengan animasi
    renderNote(snapshot.key, snapshot.val(), initialLoadDone);
  });

  messagesRef.on('child_removed', (snapshot)=>{
    const id = snapshot.key;
    const noteEl = wall.querySelector(`[data-id="${id}"]`);
    if(noteEl) noteEl.remove();
    updateEmptyHint();
  });
}else{
  // ---------- mode fallback: localStorage lokal per device ----------
  loadLocalMessages().slice().reverse().forEach(msg => renderNote(msg.id, msg, false));
  updateEmptyHint();
}

// counter karakter live
textInput.addEventListener('input', ()=>{
  counter.textContent = `${textInput.value.length}/220`;
});

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const text = textInput.value.trim();
  if(!text) return;

  const msg = {
    name: nameInput.value.trim().slice(0,24),
    text: text.slice(0,220),
    date: Date.now()
  };

  if(useFirebase){
    messagesRef.push(msg);
  }else{
    const localMsg = { id: Date.now() + '-' + Math.random().toString(36).slice(2,7), ...msg };
    const all = loadLocalMessages();
    all.push(localMsg);
    saveLocalMessages(all);
    renderNote(localMsg.id, localMsg, true);
  }

  playPop();
  if(typeof burstSparkles === 'function'){
    const r = submitBtn.getBoundingClientRect();
    burstSparkles(r.left + r.width/2, r.top + r.height/2, 10);
  }
  submitBtn.classList.remove('sent');
  void submitBtn.offsetWidth; // restart animasi
  submitBtn.classList.add('sent');

  textInput.value = '';
  nameInput.value = '';
  counter.textContent = '0/220';
  textInput.focus();
});
