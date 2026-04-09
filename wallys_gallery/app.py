from flask import Flask, request, jsonify, send_from_directory, session, render_template
from flask_cors import CORS
import sqlite3, os, smtplib, random, string, bcrypt, re, base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'wallys-gallery-secret-key-change-in-production'
CORS(app, supports_credentials=True)

DB            = "gallery.db"
UPLOAD_FOLDER = "static/uploads"
AVATAR_FOLDER = "static/avatars"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AVATAR_FOLDER, exist_ok=True)

SMTP_EMAIL    = "wallygallery@gmail.com"
SMTP_PASSWORD = "ddca ogcr plab tfgk"

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT UNIQUE NOT NULL,
            password   TEXT NOT NULL,
            email      TEXT UNIQUE NOT NULL,
            avatar     TEXT DEFAULT NULL,
            bio        TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS otp_codes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT NOT NULL,
            code       TEXT NOT NULL,
            purpose    TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used       INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS photos (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            path       TEXT NOT NULL,
            caption    TEXT DEFAULT '',
            likes      INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS photo_tags (
            photo_id INTEGER,
            tag      TEXT,
            PRIMARY KEY (photo_id, tag),
            FOREIGN KEY (photo_id) REFERENCES photos(id)
        );
        CREATE TABLE IF NOT EXISTS likes (
            user_id  INTEGER,
            photo_id INTEGER,
            PRIMARY KEY (user_id, photo_id)
        );
        CREATE TABLE IF NOT EXISTS comments (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id   INTEGER NOT NULL,
            user_id    INTEGER NOT NULL,
            content    TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (photo_id) REFERENCES photos(id),
            FOREIGN KEY (user_id)  REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS follows (
            follower_id  INTEGER NOT NULL,
            following_id INTEGER NOT NULL,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (follower_id, following_id),
            FOREIGN KEY (follower_id)  REFERENCES users(id),
            FOREIGN KEY (following_id) REFERENCES users(id)
        );
    """)

    for col, defval in [("avatar","TEXT DEFAULT NULL"), ("bio","TEXT DEFAULT ''")]:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {defval}")
            conn.commit()
        except Exception:
            pass
    conn.commit()
    conn.close()

init_db()

def allowed_file(f): return '.' in f and f.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS
def hash_password(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
def check_password(pw, h): return bcrypt.checkpw(pw.encode(), h.encode())
def current_user(): return session.get("user_id")

def send_otp_email(to_email, otp, purpose="verify"):
    subject = "Wally's Gallery — Your OTP Code"
    if purpose == "reset": subject = "Wally's Gallery — Password Reset OTP"
    body = f"""
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;
                background:#0f0f1a;color:#e0d7ff;padding:40px;
                border-radius:12px;border:1px solid #7C3AED">
      <h1 style="color:#a78bfa">Wally's Gallery</h1>
      <p>Your one-time code:</p>
      <div style="background:#1a1a2e;border:2px dashed #7C3AED;border-radius:8px;
                  padding:20px;text-align:center;margin:24px 0">
        <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#a78bfa">{otp}</span>
      </div>
      <p style="color:#9ca3af;font-size:13px">Expires in <b>10 minutes</b>.</p>
    </div>"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject; msg["From"] = SMTP_EMAIL; msg["To"] = to_email
    msg.attach(MIMEText(body, "html"))
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as s:
            s.starttls(); s.login(SMTP_EMAIL, SMTP_PASSWORD); s.send_message(msg)
        return True
    except Exception as e:
        print(f"EMAIL ERROR: {e}"); return False

# ── FRONTEND ──────────────────────────────────────────────────────────────────
@app.route("/")
def index(): return render_template("index.html")

@app.route("/static/uploads/<filename>")
def uploaded_file(filename): return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/static/avatars/<filename>")
def avatar_file(filename): return send_from_directory(AVATAR_FOLDER, filename)

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    data = request.json
    email = data.get("email","").strip().lower()
    purpose = data.get("purpose","verify")
    if not email: return jsonify({"error":"Email required"}),400
    db = get_db()
    if purpose=="reset":
        if not db.execute("SELECT id FROM users WHERE email=?",(email,)).fetchone():
            db.close(); return jsonify({"error":"No account with that email"}),404
    otp = ''.join(random.choices(string.digits, k=6))
    expires = (datetime.now()+timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S")
    db.execute("DELETE FROM otp_codes WHERE email=? AND purpose=?",(email,purpose))
    db.execute("INSERT INTO otp_codes(email,code,purpose,expires_at) VALUES(?,?,?,?)",(email,otp,purpose,expires))
    db.commit(); db.close()
    if not send_otp_email(email,otp,purpose): return jsonify({"error":"Failed to send email"}),500
    return jsonify({"message":"OTP sent"})

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.json
    username = d.get("username","").strip()
    email    = d.get("email","").strip().lower()
    password = d.get("password","")
    otp      = d.get("otp","").strip()
    if not all([username,email,password,otp]): return jsonify({"error":"All fields required"}),400
    if len(password)<8: return jsonify({"error":"Password must be at least 8 characters"}),400
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$',username): return jsonify({"error":"Username: 3-20 chars, letters/numbers/underscore"}),400
    db = get_db()
    record = db.execute("SELECT * FROM otp_codes WHERE email=? AND code=? AND purpose='verify' AND used=0",(email,otp)).fetchone()
    if not record: db.close(); return jsonify({"error":"Invalid OTP"}),400
    if datetime.strptime(record["expires_at"],"%Y-%m-%d %H:%M:%S")<datetime.now(): db.close(); return jsonify({"error":"OTP expired"}),400
    if db.execute("SELECT id FROM users WHERE username=?",(username,)).fetchone(): db.close(); return jsonify({"error":"Username already taken"}),409
    if db.execute("SELECT id FROM users WHERE email=?",(email,)).fetchone(): db.close(); return jsonify({"error":"Email already registered"}),409
    db.execute("INSERT INTO users(username,password,email) VALUES(?,?,?)",(username,hash_password(password),email))
    db.execute("UPDATE otp_codes SET used=1 WHERE email=? AND purpose='verify'",(email,))
    db.commit()
    user = db.execute("SELECT id,username FROM users WHERE username=?",(username,)).fetchone()
    session["user_id"]=user["id"]; session["username"]=user["username"]
    db.close()
    return jsonify({"user":{"id":user["id"],"username":user["username"]}})

@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.json
    identifier = d.get("identifier","").strip()
    password   = d.get("password","")
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username=? OR email=?",(identifier,identifier)).fetchone()
    db.close()
    if not user or not check_password(password,user["password"]): return jsonify({"error":"Invalid credentials"}),401
    session["user_id"]=user["id"]; session["username"]=user["username"]
    return jsonify({"user":{"id":user["id"],"username":user["username"],"avatar":user["avatar"]}})

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear(); return jsonify({"message":"Logged out"})

@app.route("/api/auth/me")
def me():
    uid = current_user()
    if not uid: return jsonify({"user":None})
    db = get_db()
    user = db.execute("SELECT id,username,email,avatar,bio,created_at FROM users WHERE id=?",(uid,)).fetchone()
    db.close()
    return jsonify({"user":dict(user) if user else None})

@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    d = request.json
    email    = d.get("email","").strip().lower()
    otp      = d.get("otp","").strip()
    new_pass = d.get("new_password","")
    if len(new_pass)<8: return jsonify({"error":"Password must be at least 8 characters"}),400
    db = get_db()
    record = db.execute("SELECT * FROM otp_codes WHERE email=? AND code=? AND purpose='reset' AND used=0",(email,otp)).fetchone()
    if not record: db.close(); return jsonify({"error":"Invalid OTP"}),400
    if datetime.strptime(record["expires_at"],"%Y-%m-%d %H:%M:%S")<datetime.now(): db.close(); return jsonify({"error":"OTP expired"}),400
    db.execute("UPDATE users SET password=? WHERE email=?",(hash_password(new_pass),email))
    db.execute("UPDATE otp_codes SET used=1 WHERE email=? AND purpose='reset'",(email,))
    db.commit(); db.close()
    return jsonify({"message":"Password updated!"})

@app.route("/api/auth/update-avatar", methods=["POST"])
def update_avatar():
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    data = request.json
    avatar_data = data.get("avatar","")
    if not avatar_data: return jsonify({"error":"No image provided"}),400
    try:
        if "," in avatar_data:
            header, b64 = avatar_data.split(",",1)
            ext = "jpg"
            if "png" in header: ext="png"
            elif "gif" in header: ext="gif"
            elif "webp" in header: ext="webp"
        else:
            b64=avatar_data; ext="jpg"
        img_bytes = base64.b64decode(b64)
        if len(img_bytes)>2*1024*1024: return jsonify({"error":"Image too large (max 2MB)"}),400
        filename = f"avatar_{uid}.{ext}"
        filepath = os.path.join(AVATAR_FOLDER, filename)
        with open(filepath,"wb") as f: f.write(img_bytes)
        avatar_url = f"/static/avatars/{filename}"
        db = get_db()
        db.execute("UPDATE users SET avatar=? WHERE id=?",(avatar_url,uid))
        db.commit(); db.close()
        return jsonify({"avatar":avatar_url})
    except Exception as e:
        print(f"AVATAR ERROR: {e}"); return jsonify({"error":"Failed to process image"}),500

@app.route("/api/auth/update-bio", methods=["POST"])
def update_bio():
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    bio = request.json.get("bio","").strip()[:200]
    db = get_db()
    db.execute("UPDATE users SET bio=? WHERE id=?",(bio,uid))
    db.commit(); db.close()
    return jsonify({"bio":bio})

@app.route("/api/auth/delete-account", methods=["DELETE"])
def delete_account():
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    db = get_db()
    user_row = db.execute("SELECT email,avatar FROM users WHERE id=?",(uid,)).fetchone()
    if user_row and user_row["avatar"]:
        try:
            av = user_row["avatar"].lstrip("/")
            if os.path.exists(av): os.remove(av)
        except: pass
    photos = db.execute("SELECT id,path FROM photos WHERE user_id=?",(uid,)).fetchall()
    for photo in photos:
        try:
            if os.path.exists(photo["path"]): os.remove(photo["path"])
        except: pass
        pid = photo["id"]
        db.execute("DELETE FROM likes      WHERE photo_id=?",(pid,))
        db.execute("DELETE FROM comments   WHERE photo_id=?",(pid,))
        db.execute("DELETE FROM photo_tags WHERE photo_id=?",(pid,))
        db.execute("DELETE FROM photos     WHERE id=?",      (pid,))
    db.execute("DELETE FROM likes    WHERE user_id=?",(uid,))
    db.execute("DELETE FROM comments WHERE user_id=?",(uid,))
    db.execute("DELETE FROM follows  WHERE follower_id=? OR following_id=?",(uid,uid))
    if user_row: db.execute("DELETE FROM otp_codes WHERE email=?",(user_row["email"],))
    db.execute("DELETE FROM users WHERE id=?",(uid,))
    db.commit(); db.close()
    session.clear()
    return jsonify({"message":"Account deleted"})

# ── PHOTOS ────────────────────────────────────────────────────────────────────
def build_photo_list(photos, db, uid):
    result = []
    for p in photos:
        p = dict(p)
        p["tags"]          = [r["tag"] for r in db.execute("SELECT tag FROM photo_tags WHERE photo_id=?",(p["id"],)).fetchall()]
        p["liked_by_me"]   = bool(uid and db.execute("SELECT 1 FROM likes WHERE user_id=? AND photo_id=?",(uid,p["id"])).fetchone())
        p["comment_count"] = db.execute("SELECT COUNT(*) FROM comments WHERE photo_id=?",(p["id"],)).fetchone()[0]
        # editable within 30 minutes
        created = datetime.strptime(p["created_at"],"%Y-%m-%d %H:%M:%S")
        p["editable"] = bool(uid and p["owner_id"]==uid and (datetime.utcnow()-created).total_seconds()<1800)
        result.append(p)
    return result

@app.route("/api/photos")
def get_photos():
    tag = request.args.get("tag","").strip()
    uid = current_user()
    db  = get_db()
    if tag:
        photos = db.execute("""
            SELECT p.id,p.path,p.caption,p.likes,p.created_at,u.username,u.id as owner_id,u.avatar
            FROM photos p JOIN users u ON p.user_id=u.id
            JOIN photo_tags pt ON pt.photo_id=p.id
            WHERE pt.tag=? ORDER BY p.created_at DESC""",(tag,)).fetchall()
    else:
        photos = db.execute("""
            SELECT p.id,p.path,p.caption,p.likes,p.created_at,u.username,u.id as owner_id,u.avatar
            FROM photos p JOIN users u ON p.user_id=u.id
            ORDER BY p.created_at DESC""").fetchall()
    result = build_photo_list(photos, db, uid)
    db.close()
    return jsonify(result)

@app.route("/api/photos/random")
def random_photo():
    uid = current_user()
    db  = get_db()
    photo = db.execute("""
        SELECT p.id,p.path,p.caption,p.likes,p.created_at,u.username,u.id as owner_id,u.avatar
        FROM photos p JOIN users u ON p.user_id=u.id
        ORDER BY RANDOM() LIMIT 1""").fetchone()
    if not photo: db.close(); return jsonify({"error":"No photos yet"}),404
    result = build_photo_list([photo], db, uid)
    db.close()
    return jsonify(result[0])

@app.route("/api/photos", methods=["POST"])
def upload_photo():
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    if "file" not in request.files: return jsonify({"error":"No file"}),400
    file = request.files["file"]
    if not file or not allowed_file(file.filename): return jsonify({"error":"Invalid file type"}),400
    caption  = request.form.get("caption","").strip()
    tags_raw = request.form.get("tags","")
    tags = [t.strip().lower() for t in tags_raw.split(",") if t.strip()][:5]
    ext  = file.filename.rsplit('.',1)[1].lower()
    filename = f"{uid}_{int(datetime.now().timestamp()*1000)}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    db = get_db()
    db.execute("INSERT INTO photos(user_id,path,caption) VALUES(?,?,?)",(uid,f"static/uploads/{filename}",caption))
    photo_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    for tag in tags:
        db.execute("INSERT OR IGNORE INTO photo_tags(photo_id,tag) VALUES(?,?)",(photo_id,tag))
    db.commit(); db.close()
    return jsonify({"message":"Uploaded!","id":photo_id})

@app.route("/api/photos/<int:photo_id>", methods=["PATCH"])
def edit_photo(photo_id):
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    db = get_db()
    photo = db.execute("SELECT * FROM photos WHERE id=? AND user_id=?",(photo_id,uid)).fetchone()
    if not photo: db.close(); return jsonify({"error":"Not found or not your photo"}),404
    # 30-minute window
    created = datetime.strptime(photo["created_at"],"%Y-%m-%d %H:%M:%S")
    if (datetime.utcnow()-created).total_seconds()>1800:
        db.close(); return jsonify({"error":"Edit window expired (30 minutes)"}),403
    d = request.json
    new_caption  = d.get("caption", photo["caption"]).strip()
    new_tags_raw = d.get("tags","")
    new_tags = [t.strip().lower() for t in new_tags_raw.split(",") if t.strip()][:5]
    db.execute("UPDATE photos SET caption=? WHERE id=?",(new_caption,photo_id))
    db.execute("DELETE FROM photo_tags WHERE photo_id=?",(photo_id,))
    for tag in new_tags:
        db.execute("INSERT OR IGNORE INTO photo_tags(photo_id,tag) VALUES(?,?)",(photo_id,tag))
    db.commit(); db.close()
    return jsonify({"message":"Updated","caption":new_caption,"tags":new_tags})

@app.route("/api/photos/<int:photo_id>", methods=["DELETE"])
def delete_photo(photo_id):
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    db = get_db()
    photo = db.execute("SELECT * FROM photos WHERE id=? AND user_id=?",(photo_id,uid)).fetchone()
    if not photo: db.close(); return jsonify({"error":"Not found or not your photo"}),404
    try:
        if os.path.exists(photo["path"]): os.remove(photo["path"])
    except: pass
    db.execute("DELETE FROM likes      WHERE photo_id=?",(photo_id,))
    db.execute("DELETE FROM comments   WHERE photo_id=?",(photo_id,))
    db.execute("DELETE FROM photo_tags WHERE photo_id=?",(photo_id,))
    db.execute("DELETE FROM photos     WHERE id=?",      (photo_id,))
    db.commit(); db.close()
    return jsonify({"message":"Deleted"})

@app.route("/api/photos/<int:photo_id>/like", methods=["POST"])
def toggle_like(photo_id):
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    db = get_db()
    existing = db.execute("SELECT 1 FROM likes WHERE user_id=? AND photo_id=?",(uid,photo_id)).fetchone()
    if existing:
        db.execute("DELETE FROM likes WHERE user_id=? AND photo_id=?",(uid,photo_id))
        db.execute("UPDATE photos SET likes=likes-1 WHERE id=?",(photo_id,))
        liked=False
    else:
        db.execute("INSERT INTO likes(user_id,photo_id) VALUES(?,?)",(uid,photo_id))
        db.execute("UPDATE photos SET likes=likes+1 WHERE id=?",(photo_id,))
        liked=True
    count = db.execute("SELECT likes FROM photos WHERE id=?",(photo_id,)).fetchone()["likes"]
    db.commit(); db.close()
    return jsonify({"liked":liked,"likes":count})

# ── COMMENTS ──────────────────────────────────────────────────────────────────
@app.route("/api/photos/<int:photo_id>/comments")
def get_comments(photo_id):
    db = get_db()
    comments = db.execute("""
        SELECT c.id,c.content,c.created_at,u.username,u.id as user_id
        FROM comments c JOIN users u ON c.user_id=u.id
        WHERE c.photo_id=? ORDER BY c.created_at ASC""",(photo_id,)).fetchall()
    db.close()
    return jsonify([dict(c) for c in comments])

@app.route("/api/photos/<int:photo_id>/comments", methods=["POST"])
def add_comment(photo_id):
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    content = request.json.get("content","").strip()
    if not content: return jsonify({"error":"Empty comment"}),400
    if len(content)>500: return jsonify({"error":"Max 500 characters"}),400
    db = get_db()
    db.execute("INSERT INTO comments(photo_id,user_id,content) VALUES(?,?,?)",(photo_id,uid,content))
    db.commit()
    cid = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    row = db.execute("""
        SELECT c.id,c.content,c.created_at,u.username,u.id as user_id
        FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=?""",(cid,)).fetchone()
    db.close()
    return jsonify(dict(row))

@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    db = get_db()
    comment = db.execute("SELECT * FROM comments WHERE id=? AND user_id=?",(comment_id,uid)).fetchone()
    if not comment: db.close(); return jsonify({"error":"Not found"}),404
    db.execute("DELETE FROM comments WHERE id=?",(comment_id,))
    db.commit(); db.close()
    return jsonify({"message":"Deleted"})

# ── TAGS ──────────────────────────────────────────────────────────────────────
@app.route("/api/tags")
def get_tags():
    db = get_db()
    tags = db.execute("SELECT tag,COUNT(*) as count FROM photo_tags GROUP BY tag ORDER BY count DESC LIMIT 30").fetchall()
    db.close()
    return jsonify([dict(t) for t in tags])

# ── USERS ─────────────────────────────────────────────────────────────────────
@app.route("/api/users/<int:user_id>")
def get_user_profile(user_id):
    uid = current_user()
    db  = get_db()
    user = db.execute("SELECT id,username,avatar,bio,created_at FROM users WHERE id=?",(user_id,)).fetchone()
    if not user: db.close(); return jsonify({"error":"User not found"}),404
    u = dict(user)
    u["photos"]      = db.execute("SELECT COUNT(*) FROM photos   WHERE user_id=?",(user_id,)).fetchone()[0]
    u["total_likes"] = db.execute("SELECT COALESCE(SUM(likes),0) FROM photos WHERE user_id=?",(user_id,)).fetchone()[0]
    u["total_comments"] = db.execute("""
        SELECT COUNT(*) FROM comments c
        JOIN photos p ON c.photo_id=p.id
        WHERE p.user_id=? AND c.user_id!=?""",(user_id,user_id)).fetchone()[0]
    u["followers"]   = db.execute("SELECT COUNT(*) FROM follows WHERE following_id=?",(user_id,)).fetchone()[0]
    u["following"]   = db.execute("SELECT COUNT(*) FROM follows WHERE follower_id=?", (user_id,)).fetchone()[0]
    u["is_following"]= bool(uid and db.execute("SELECT 1 FROM follows WHERE follower_id=? AND following_id=?",(uid,user_id)).fetchone())
    u["is_me"]       = (uid == user_id)
    db.close()
    return jsonify(u)

@app.route("/api/users/<int:user_id>/stats")
def user_stats(user_id):
    db = get_db()
    photos   = db.execute("SELECT COUNT(*) FROM photos   WHERE user_id=?",(user_id,)).fetchone()[0]
    likes    = db.execute("SELECT COUNT(*) FROM likes    WHERE user_id=?",(user_id,)).fetchone()[0]
    comments = db.execute("SELECT COUNT(*) FROM comments WHERE user_id=?",(user_id,)).fetchone()[0]
    followers= db.execute("SELECT COUNT(*) FROM follows  WHERE following_id=?",(user_id,)).fetchone()[0]
    following= db.execute("SELECT COUNT(*) FROM follows  WHERE follower_id=?", (user_id,)).fetchone()[0]
    db.close()
    return jsonify({"photos":photos,"likes":likes,"comments":comments,"followers":followers,"following":following})

@app.route("/api/users/<int:user_id>/photos")
def user_photos(user_id):
    uid = current_user()
    db  = get_db()
    photos = db.execute("""
        SELECT p.id,p.path,p.caption,p.likes,p.created_at,u.username,u.id as owner_id,u.avatar
        FROM photos p JOIN users u ON p.user_id=u.id
        WHERE p.user_id=? ORDER BY p.created_at DESC""",(user_id,)).fetchall()
    result = build_photo_list(photos, db, uid)
    db.close()
    return jsonify(result)

@app.route("/api/users/<int:user_id>/follow", methods=["POST"])
def toggle_follow(user_id):
    uid = current_user()
    if not uid: return jsonify({"error":"Login required"}),401
    if uid==user_id: return jsonify({"error":"Cannot follow yourself"}),400
    db = get_db()
    existing = db.execute("SELECT 1 FROM follows WHERE follower_id=? AND following_id=?",(uid,user_id)).fetchone()
    if existing:
        db.execute("DELETE FROM follows WHERE follower_id=? AND following_id=?",(uid,user_id))
        following=False
    else:
        db.execute("INSERT INTO follows(follower_id,following_id) VALUES(?,?)",(uid,user_id))
        following=True
    count = db.execute("SELECT COUNT(*) FROM follows WHERE following_id=?",(user_id,)).fetchone()[0]
    db.commit(); db.close()
    return jsonify({"following":following,"followers":count})

if __name__=="__main__":
    app.run(debug=True, port=5000)
