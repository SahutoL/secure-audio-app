from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import jwt
import datetime
from werkzeug.utils import secure_filename
import functools
from dotenv import load_dotenv

load_dotenv()

USERS = {
    "username": "password"
}

app = Flask(__name__)
CORS(app, origins="https://secure-audio-app.vercel.app")
app.config['UPLOAD_FOLDER'] = 'files'
app.config['ALLOWED_EXTENSIONS'] = {'mp3'}
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
os.makedirs(files, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def token_required(f):
    @functools.wraps(f)
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"msg": "Missing token"}), 401
        try:
            token = token.split(" ")[1]
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"msg": "Expired token"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"msg": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorator

@app.route('/files', methods=['GET'])
@token_required
def list_files():
    files = [{"name": f, "title": os.path.splitext(f)[0]} for f in os.listdir("files") if allowed_file(f)]
    return jsonify(files)

@app.route('/files/<filename>', methods=['GET'])
@token_required
def get_file(filename):
    try:
        filename = secure_filename(filename)
        return send_file(os.path.join('files', filename), as_attachment=True)
    except Exception as e:
        return jsonify({"msg": str(e)}), 500

@app.route('/upload', methods=['POST'])
@token_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join("files", filename))
        return jsonify({"msg": "File uploaded successfully"}), 201
    return jsonify({"msg": "Invalid file type"}), 400

@app.route('/token', methods=['POST'])
def generate_token():
    auth = request.json
    if auth and auth.get("username") in USERS and auth.get("password") == USERS[auth.get("username")]:
        now = datetime.datetime.now(tz=datetime.timezone.utc)
        token = jwt.encode({
            'sub': auth.get("username"),
            'iat': now - datetime.timedelta(seconds=10),
            'exp': now + datetime.timedelta(minutes=30)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token})
    return jsonify({'msg': 'Invalid credentials'}), 401

if __name__ == '__main__':
    app.run()
