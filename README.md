# Homework to PDF

A clean, fast, and modern professional web application designed for students to convert their homework images into organized PDF files.

## Features
- **Drag & Drop Upload:** Upload multiple images easily.
- **Image Preview:** View all uploaded images before conversion.
- **Rearrange:** Drag and drop images to reorder them as they should appear in the PDF.
- **Image Enhancement:** Built-in option to increase image brightness and contrast for better readability.
- **Delete:** Remove unwanted images.
- **A4 PDF Conversion:** Automatically scales images to fit perfectly on A4 pages.
- **Bilingual:** Full support for English and Arabic (with RTL layout for Arabic).
- **Responsive:** Works seamlessly on mobile devices.
- **Dark/Light Mode:** Toggle between themes for comfortable viewing.

## Setup Instructions
Since the app is built with React and Vite, you'll need Node.js installed.

1. Open a terminal in this directory.
2. Run `npm install` to install dependencies (ensure you have an active internet connection).
3. Run `npm run dev` to start the local development server.
4. Open the link provided in the terminal (usually `http://localhost:5173`) in your browser.

## نشر على Cloudflare Pages

1. أنشئ مشروع جديد في Cloudflare Pages واربطه بهذا المستودع في GitHub.
2. استخدم إعدادات البناء التالية:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `.`
3. أضف أسرار GitHub التالية إلى `Settings > Secrets and variables > Actions`:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PROJECT_NAME`
4. هذا المستودع يحتوي على GitHub Actions جاهزة للنشر إلى Cloudflare Pages عند كل `push` إلى فرع `main`.

> بعد إنشاء مشروع Cloudflare Pages، كل `push` إلى `main` يبني وينشر الموقع تلقائياً.

## Technologies Used
- React (UI Framework)
- Vite (Build Tool)
- jsPDF (PDF Generation)
- react-dropzone (File Upload)
- @dnd-kit (Drag and Drop Sorting)
- lucide-react (Icons)
