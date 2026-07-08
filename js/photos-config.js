/* ======================================================================
   KONFIGURASI FOTO
   ----------------------------------------------------------------------
   Ini satu-satunya file yang perlu kamu edit kalau mau GANTI, TAMBAH,
   atau HAPUS foto di galeri.

   Cara ganti foto:
   1. Taruh file foto baru di folder  img/  (format .jpg / .jpeg / .png)
   2. Ubah nilai "src" di bawah supaya sesuai nama file foto kamu
   3. Ubah "cap" (caption) sesuai keinginan, atau kosongkan  cap: ""

   Cara tambah foto baru:
   - Copy salah satu baris  { src: ..., cap: ... },  lalu tempel baris baru,
     ganti src & cap-nya. Urutan di list ini = urutan tampil di galeri.

   Cara hapus foto:
   - Hapus saja baris { ... } yang tidak diinginkan.

   Catatan: jumlah foto boleh berapa saja (tidak harus 8), galeri akan
   otomatis menyesuaikan.
   ====================================================================== */

const PHOTOS = [
  { src: "img/foto-1.jpg", },
  { src: "img/foto-2.jpg", },
  { src: "img/foto-3.jpg", },
  { src: "img/foto-4.jpg", },
  { src: "img/foto-5.jpg", },
  { src: "img/foto-6.jpg", },
  { src: "img/foto-7.jpg", },
  { src: "img/foto-8.jpg", },
];
