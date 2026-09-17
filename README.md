# Restaurant Digital Menu Viewer

พร้อมสำหรับ GitHub Pages เป็น Static Web App

## โครงสร้าง

- `index.html`
- `style.css`
- `script.js`
- `menu/3.png` ถึง `menu/15.png`

นำรูปเมนูจริงของคุณใส่ไว้ในโฟลเดอร์ `menu` โดยใช้ชื่อไฟล์ตามที่กำหนด

## GitHub Pages

1. สร้าง Repository ใหม่
2. อัปโหลดไฟล์ทั้งหมดและโฟลเดอร์ `menu`
3. ไปที่ Settings → Pages
4. เลือก Deploy from a branch
5. เลือก branch `main` และ folder `/ (root)`
6. Save

โค้ดใช้ relative paths (`./menu/...`) จึงทำงานได้ทั้ง GitHub Pages แบบ project URL และ custom domain

## อัปเดตเมนู

ถ้าต้องการเปลี่ยนหน้า 7 ให้แทนที่ `menu/7.png` แล้ว commit/push

## Social Preview

หลังทราบ URL จริงของ GitHub Pages ให้แก้ `og:image` และ `og:url` ใน `index.html`

## ไม่มีบริการภายนอก

ไม่มี backend, database, login, API, Firebase หรือ Gemini API
