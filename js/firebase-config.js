const firebaseConfig = {
  apiKey: "AIzaSyBCMqxJGkRkwsWUnDECB34XM5kjXaRwQyo",
  authDomain: "yunaa-41f50.firebaseapp.com",
  databaseURL: "https://yunaa-41f50-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "yunaa-41f50",
  storageBucket: "yunaa-41f50.firebasestorage.app",
  messagingSenderId: "585765202653",
  appId: "1:585765202653:web:32b8474a051e7771588934"
};

let db;
try{
  if(typeof firebase !== 'undefined'){
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
  }
}catch(e){
  console.warn('Firebase belum siap / gagal dimuat, fitur pesan pakai localStorage dulu.', e);
}