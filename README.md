# Final-Project-ITEC-103
Final Output: Web Gallery App

----- PLEASE VIEW IN CODE -----

Stack: Python / Flask · SQLite · Vanilla JS · HTML/CSS
Author: BSCS 1A - Xavier Kent C. Ortega

1. SYSTEM OVERVIEW ---------------------
  - Wally's Gallery is a private, self-hosted photo-sharing platform. Users can register an account, upload photos and GIFs, tag them, like and comment on posts, follow each other, and manage their profile.

2. FOLDER STRUCTURE ---------------------
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

3. REQUIREMENTS ---------------------
   Softwares:
   - Internet Connection, Browser, Python Compiler
   Libraries:
   - flask, flask-cors, bcrypt

5. HOW TO RUN THE SYSTEM ---------------------

   Step 1: Open VS Code then open folder, next locate the folder named "wallys_gallery" (base name) then open.
     #Example: "C:\Users\acer nitro v15\Downloads\School Activities 2nd Sem\ITEC 103\Project\wallys_gallery"
   Step 2: Install the required Libararies
     - Run this once in a terminal: pip install flask flask-cors bcrypt
   Step 3: Start the server/system
     - Run this in a terminal:
       - cd wallys_gallery
         python app.py
   Step 4: Open the website
     - Find the link that will appear in the terminal. Click it while holding the ctrl key in your keybaord until a browser appears.
     - To stop the server: Press  Ctrl + C  in the terminal window at any time.
   Step 5: First Time Setup
   The Database:
     - When app.py runs for the first time, it automatically creates gallery.db in your project folder and builds all the tables.

6. FEATURES GUIDE ---------------------

   Registration & Login
   - Register: Click "Create Account" → enter a username, email, password → click "Send OTP" → check your email for a 6-digit code → enter it → click "Create Account"
   - Login: Enter your username or email + password → click "Sign In"
   - Forgot Password: Click "Forgot your password?" → enter your email → click "Send OTP" → enter the code and your new password
   - Logout: Click the 🚪 Logout button in the left panel — a confirmation dialog will appear first
   - OTP Expiry: OTP codes expire after 10 minutes. If yours expired, click "Send OTP" again after the 60-second cooldown
   Uploading Photos:
   - Supported Formats: PNG, JPG, JPEG, GIF, WEBP
   - Hot to Upload: Click "Upload Wally" in the left panel → drag a file into the drop zone or click to browse → add a caption and tags → click "Upload Wally"
   - Tags: Separate multiple tags with commas. Example: meme, funny, dogs (max 5 tags per photo)
   - GIF Support: Animated GIFs play at their original frame rate in both the grid and the lightbox
   Browsing & Searching:
   - All Photos: Click "All Wally" in the left panel to see every uploaded photo
   - Filter by Tag: Click any tag pill in the tag bar at the top of the gallery, or click a tag on any photo card
   - Search by tag: Type a tag word in the # search bar in the top navigation. Results update as you type. Press Escape or ✕ to clear
   - Sort order: Click "Newest Bayola First" or "Most Bayo-Liked" in the left panel
   - Random Photo: Click 🎲 "Random Wally" in the left panel — a spotlight opens showing a random photo. Click "Another" for a different one
   Likes & Comments:
   - Like a Photo: Click the 🤍 heart on any photo card. It turns ❤️ red and the count updates instantly. Click again to unlike
   - View Comments: Click the 💬 icon on any photo card to expand the comments panel
   - Post a Comment: Type in the comment box and press Enter or click "Post" (max 500 characters)
   - Delete your Comment: Click the ✕ beside your own comment
   Editing & Deleting your Posts
   - Edit a Post: Within 30 minutes of uploading, a ✏️ button appears on your photo card. Click it to edit the caption and tags. A countdown timer shows how much time is left
   - After 30 Minutes: The edit button disappears. Caption and tags become permanent
   - Delete a Photo: Click the 🗑 trash icon on your own photo card → confirm in the browser dialog. This permanently deletes the photo file and all its likes, comments, and tags
   User Profile & Following
   - View a Profile: Click any username on a photo card — a profile popup appears showing their avatar, bio, post count, total likes received, total comments received, followers, and following count
   - Follow a User: Click "＋ Follow" in the profile popup. The button changes to "Following". Click again to unfollow
   - My Photos: Click "👤 My Wally" in the left panel or "My Photos Only" inside your profile sidebar to see only your own posts
   - View their Photos: Click "View [username]'s Photos →" at the bottom of the profile popup
   Profile Sidebar
   - Click "⚙️ My Bayola" in the left panel to open your profile sidebar. From here you can:
    •	See your follower and following counts
    •	Change your profile picture — click your avatar or "Change photo" — supports PNG, JPG, GIF, WEBP up to 2MB
    •	Write or edit your bio — click "✏️ Edit Bio-la" — max 200 characters — appears on your public profile card
    •	See your account info: username, email, member since date
    •	Quick actions: Upload Photo, Browse All, My Photos, Random Photo
    •	Delete your account

7. FILE REFERENCES
   - app.py	The entire backend server. Contains all API routes, database logic, email sending, session handling, and file management. This is the only Python file you need to run.
   - gallery.db	The SQLite database file. Auto-created when app.py first runs. Contains all users, photos, likes, comments, tags, follows, and OTP codes in one file.
   - index.html	The single HTML page the browser loads. References all CSS and JS files. Contains the nav bar, gallery layout, lightbox, and upload modal placeholder.
   - base.css	Global reset, CSS variables (colors, fonts, spacing), button styles, input styles, toast notifications, spinner, lightbox, and loading skeleton. Background images for auth and gallery pages are set here.
   - auth.css	Styles for the login, register, and forgot password cards only. Handles the glass-effect card and dark overlay over the background image.
   - gallery.css	Nav bar, search bar, tag filter pills, masonry photo grid, photo cards, like buttons, comment panels, and the left panel sidebar.
   - upload.css	The upload modal, drop zone, image preview, and form inside the modal.
   - sidebar.css	The profile sidebar that slides in from the right, and the left navigation panel.
   - api.js	The fetch() wrapper function used by all other JS files. Also contains toast(), escHtml() for XSS prevention, and timeAgo() for timestamp formatting.
   - auth.js	Handles login, registration, forgot password, OTP sending, password strength meter, and the logout confirmation dialog.
   - gallery.js	Photo grid rendering, likes, comments, edit modal (30-min window), delete photo, lightbox, random photo spotlight, and the user profile popup card.
   - upload.js	Upload modal HTML injection, drag-and-drop file handling, image preview, and the upload form submission.
   - sidebar.js	Profile sidebar HTML injection, avatar upload, bio editing, stats loading, and account deletion.
   - main.js	App entry point. Checks login session on load, builds the left panel, handles the tag search bar, and wires up the Escape key.

8. TROPUBLESHOOTING
   - "ModuleNotFoundError: No module named flask"	Run:   pip install flask flask-cors bcrypt   then try again
   - "Address already in use" error: Another program is using port 5000. Either stop that program, or change the port in app.py last line to:   app.run(port=5001)   then visit localhost:5001
   - OTP email not arriving: Check your Gmail App Password is correct in app.py. Check your spam folder. Make sure 2-Step Verification is ON on your Google account.
   - Background image not showing: Make sure the file is in static/images/ and the filename in base.css matches exactly (including the file extension, e.g. .jpg vs .jpeg)
   - Photos not loading after upload: The static/uploads/ folder was not created. Run app.py again — it creates the folder automatically on startup.
   - Tab icon not showing: Browsers cache favicons aggressively. Hard-refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac). Sometimes you need to clear browser cache.
   - "Edit" button missing on my photo: The 30-minute edit window has expired. You can still delete and re-upload the photo.
   - gallery.db file got deleted: Running app.py again creates a fresh empty database. All user accounts and photos are lost — this is why backups are important (see Section 8).

Gamitin na ang Wally's Gallery. Maging Isang Bayolanatics.
