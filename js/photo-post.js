/* ======================================================================
   PHOTO-POST.JS
   ----------------------------------------------------------------------
   Logic untuk fitur "Tempel Foto Kamu" (upload interaktif setelah galeri).
   - Foto dipilih pengunjung -> dikompres otomatis (biar hemat ruang) ->
     ditampilkan sebagai polaroid baru di #postsWall, gaya sama persis
     dengan galeri foto Yuna (tape/pin/rotasi acak) biar nyatu estetiknya.
   - Foto disimpan di Firebase Realtime Database (node terpisah dari
     pesan buku tamu), pakai config yang sama dari js/firebase-config.js,
     jadi SEMUA pengunjung dari device manapun bisa lihat foto yang sama
     secara real-time.
   - Kalau firebase-config.js belum diisi (masih placeholder), otomatis
     fallback ke localStorage (hanya tersimpan lokal per device).
   - Memakai playClick()/playPop()/burstSparkles() dari script.js,
     jadi file ini HARUS dimuat setelah script.js (dan setelah
     firebase-config.js kalau dipakai).
   ====================================================================== */

const POST_STORAGE_KEY = 'untuk-yuna-photo-posts';
const postDecorations = ['tape-tl','pin','tape-tr'];
const postSizes = ['size-md','size-lg','size-sm'];

// aktif kalau firebase-config.js sudah diisi config asli (bukan placeholder)
const usePhotoFirebase = (typeof db !== 'undefined')
  && typeof firebaseConfig !== 'undefined'
  && !String(firebaseConfig.apiKey).includes('GANTI');

const postsRef = usePhotoFirebase ? db.ref('photo-posts') : null;

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const previewImg = document.getElementById('previewImg');
const postCaption = document.getElementById('postCaption');
const confirmPostBtn = document.getElementById('confirmPostBtn');
const cancelPostBtn = document.getElementById('cancelPostBtn');
const postsWall = document.getElementById('postsWall');
const postsEmpty = document.getElementById('postsEmpty');

let pendingDataUrl = null;

/* ---------- kompres gambar sebelum disimpan ---------- */
function compressImage(file, maxDim = 900, quality = 0.75){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        let { width, height } = img;
        if(width > height && width > maxDim){
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        }else if(height > maxDim){
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- fallback localStorage (dipakai kalau Firebase belum diset) ---------- */
function loadLocalPosts(){
  try{
    const raw = localStorage.getItem(POST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveLocalPosts(list){
  try{ localStorage.setItem(POST_STORAGE_KEY, JSON.stringify(list)); }
  catch(e){ /* kalau penuh, biarin gagal senyap -> tetap tampil di sesi ini */ }
}
function updatePostsEmptyHint(){
  postsEmpty.style.display = postsWall.children.length > 0 ? 'none' : 'block';
}

function deletePost(id, el){
  playClick();
  el.classList.add('removing');
  setTimeout(()=>{
    el.remove();
    if(usePhotoFirebase){
      postsRef.child(id).remove();
    }else{
      saveLocalPosts(loadLocalPosts().filter(p => p.id !== id));
    }
    updatePostsEmptyHint();
  }, 320);
}

function renderPost(id, post, isNew){
  const el = document.createElement('div');
  const deco = postDecorations[Math.floor(Math.random()*postDecorations.length)];
  const size = postSizes[Math.floor(Math.random()*postSizes.length)];
  const rot = (Math.random()*10 - 5).toFixed(1);
  el.className = `polaroid ${deco} ${size}`;
  el.style.setProperty('--rot', rot + 'deg');
  el.style.setProperty('--stagger', '0ms');
  el.dataset.id = id;
  el.innerHTML = `
    ${isNew ? '<span class="badge-new">BARU</span>' : ''}
    <button class="photo-del" title="hapus foto" aria-label="hapus foto">✕</button>
    <div class="photo-frame"><img src="${post.dataUrl}" alt="foto dari pengunjung" loading="lazy"></div>
    <span class="cap">${post.caption ? post.caption : ''}</span>
  `;
  el.querySelector('.photo-del').addEventListener('click', (e)=>{
    e.stopPropagation();
    deletePost(id, el);
  });
  el.addEventListener('click', ()=>{
    if(typeof openLightbox === 'function'){ playClick(); openLightbox(post.dataUrl); }
  });

  postsWall.prepend(el);
  // trigger transisi masuk (reuse animasi .polaroid.in dari style galeri)
  requestAnimationFrame(()=> requestAnimationFrame(()=> el.classList.add('in')));
  updatePostsEmptyHint();
}

if(usePhotoFirebase){
  // ---------- mode Firebase: real-time sync ke semua pengunjung ----------
  let initialLoadDone = false;

  postsRef.once('value').then(()=>{
    initialLoadDone = true;
  });

  postsRef.on('child_added', (snapshot)=>{
    // foto lama (sudah ada sebelum halaman dibuka) tampil tanpa label "BARU",
    // foto yang ditempel setelah halaman terbuka tampil dengan label "BARU"
    renderPost(snapshot.key, snapshot.val(), initialLoadDone);
  });

  postsRef.on('child_removed', (snapshot)=>{
    const el = postsWall.querySelector(`[data-id="${snapshot.key}"]`);
    if(el) el.remove();
    updatePostsEmptyHint();
  });
}else{
  // ---------- mode fallback: localStorage lokal per device ----------
  loadLocalPosts().forEach(post => renderPost(post.id, post, false));
  updatePostsEmptyHint();
}

/* ---------- interaksi dropzone ---------- */
uploadZone.addEventListener('click', ()=>{ playClick(); fileInput.click(); });
uploadZone.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); }
});

['dragover','dragenter'].forEach(evt=>{
  uploadZone.addEventListener(evt, (e)=>{ e.preventDefault(); uploadZone.classList.add('dragover'); });
});
['dragleave','drop'].forEach(evt=>{
  uploadZone.addEventListener(evt, (e)=>{ e.preventDefault(); uploadZone.classList.remove('dragover'); });
});
uploadZone.addEventListener('drop', (e)=>{
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if(file) handleFile(file);
});
fileInput.addEventListener('change', ()=>{
  const file = fileInput.files[0];
  if(file) handleFile(file);
});

async function handleFile(file){
  if(!file.type.startsWith('image/')) return;
  try{
    pendingDataUrl = await compressImage(file);
    previewImg.src = pendingDataUrl;
    uploadPreview.classList.add('show');
    postCaption.value = '';
    postCaption.focus();
    playChime();
  }catch(e){ /* gagal baca file -> abaikan senyap */ }
}

cancelPostBtn.addEventListener('click', ()=>{
  playClick();
  uploadPreview.classList.remove('show');
  pendingDataUrl = null;
  fileInput.value = '';
});

confirmPostBtn.addEventListener('click', ()=>{
  if(!pendingDataUrl) return;
  const post = {
    dataUrl: pendingDataUrl,
    caption: postCaption.value.trim().slice(0,60),
    date: Date.now()
  };

  if(usePhotoFirebase){
    postsRef.push(post);
  }else{
    const localPost = { id: Date.now() + '-' + Math.random().toString(36).slice(2,7), ...post };
    const all = loadLocalPosts();
    all.push(localPost);
    saveLocalPosts(all);
    renderPost(localPost.id, localPost, true);
  }

  playPop();
  if(typeof burstSparkles === 'function'){
    const r = confirmPostBtn.getBoundingClientRect();
    burstSparkles(r.left + r.width/2, r.top + r.height/2, 10);
  }

  uploadPreview.classList.remove('show');
  pendingDataUrl = null;
  fileInput.value = '';
});
