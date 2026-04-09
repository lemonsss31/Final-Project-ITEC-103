# Final-Project-ITEC-103
Final Output: Web Gallery App

Stack: Python / Flask · SQLite · Vanilla JS · HTML/CSS
Author: BSCS 1A - Xavier Kent C. Ortega

1. SYSTEM OVERVIEW
  - Wally's Gallery is a private, self-hosted photo-sharing platform. Users can register an account, upload photos and GIFs, tag them, like and comment on posts, follow each other, and manage their profile.

2. FOLDER STRUCTURE
  - It should look ike this:

your-project-folder/
│
├── app.py                  ← main server file (Flask)
├── gallery.db              ← SQLite database (auto-created)
│
├── templates/
│   └── index.html          ← the single HTML page
│
└── static/
    ├── css/
    │   ├── base.css        ← global reset, variables, shared styles
    │   ├── auth.css        ← login / register page styles
    │   ├── gallery.css     ← nav, photo grid, cards, search bar
    │   ├── upload.css      ← upload modal styles
    │   └── sidebar.css     ← profile sidebar + left panel
    │
    ├── js/
    │   ├── api.js          ← fetch wrapper + toast + helpers
    │   ├── auth.js         ← login, register, logout logic
    │   ├── gallery.js      ← photo grid, likes, comments, edit, follow
    │   ├── upload.js       ← upload modal + drag-and-drop
    │   ├── sidebar.js      ← profile sidebar, avatar, bio, delete account
    │   └── main.js         ← entry point, left panel, search bar
    │
    ├── images/
    │   ├── auth-bg.jpg     ← background for login/register page
    │   ├── gallery-bg.jpg  ← background for the main gallery
    │   ├── favicon.png     ← browser tab icon
    │   └── nav-logo.png    ← small icon beside "Wally's Gallery" in nav
    │
    ├── uploads/            ← uploaded photos (auto-created)
    └── avatars/            ← user profile pictures (auto-created)

3. REQUIREMENTS
