from dotenv import load_dotenv
from flask_cors import CORS
import os
load_dotenv()

from flask import Flask
from routes.resume_routes import resume_bp
from routes.job_routes import job_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(resume_bp)
app.register_blueprint(job_bp)

@app.route("/")
def home():
    return "AI Job Agent Backend Running 🚀"

if __name__ == "__main__":
    app.run(port=5001, debug=True)