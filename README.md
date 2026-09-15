# WARZT PROMT — Telegram Cloud Backup

## Isi
- `index.html` — website WARZT PROMT, tanpa menu pairing.
- `server.js` — backend Node.js yang menyimpan cache dan mengirim backup JSON ke Telegram.
- `.env.example` — contoh environment variables.

## Setup backend
1. Buat Telegram Bot memakai BotFather.
2. Buat private group/channel untuk backup dan tambahkan bot sebagai anggota/admin sesuai kebutuhan.
3. Siapkan `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, dan `WARZT_CLOUD_KEY` sebagai environment variables di hosting.
4. Jalankan:
   `node server.js`
5. Buka website, login sebagai Admin → ADMIN → TELEGRAM.
6. Masukkan URL backend, misalnya `https://api.domainanda.com`.
7. Masukkan Cloud Key yang sama dengan `WARZT_CLOUD_KEY`.
8. Klik TEST KONEKSI, lalu gunakan SYNC KE TELEGRAM.

## Catatan
- Token Telegram tidak pernah ditaruh di `index.html`.
- LocalStorage tetap dipakai sebagai cache/fallback browser.
- Backup Telegram berupa file JSON. Pull mengambil salinan terakhir dari backend cache.
- Untuk produksi, gunakan HTTPS dan secret yang panjang.
