# File Uploader V2

A modern full-stack web application for user authentication and cloud file management. Built with React (Vite) on the frontend and Express (Node.js) on the backend, integrated with Cloudinary for file storage and Prisma ORM for data management.

---

## 🚀 Features

- **User Authentication:** Registration, login, and logout using JWT stored in `httpOnly`, `Secure`, `SameSite=None` cross-site cookies.
- **File Management:** Upload, viewing, and deletion of user media and documents via Cloudinary.
- **Protected Routing:** Client side route guarding and automatic session verification (`/api/status`).
- **Folder Management:** Create, view, edit, and delete user created folders.
- **Share Folders:** Folder sharing, for selected period of time, available to view both for authenticated and unauthenticated users.

---

## 🛠 Tech Stack

### Frontend

- **Framework:** React (Vite)
- **Routing:** React Router DOM
- **State Management:** React Context API (`AuthContext`)
- **Hosting:** Vercel

### Backend

- **Runtime:** Node.js (Express.js)
- **Database / ORM:** PostgreSQL / Prisma ORM
- **File Uploads:** Multer & `multer-storage-cloudinary` / Cloudinary SDK
- **Auth & Security:** JSON Web Tokens (JWT), `cookie-parser`, `cors`
- **Hosting:** Render

---
