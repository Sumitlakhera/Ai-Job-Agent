from flask import Flask
from routes.resume_routes import resume_bp

app = Flask(__name__)

app.register_blueprint(resume_bp)

@app.route("/")
def home():
    return "AI Job Agent Backend Running 🚀"

if __name__ == "__main__":
    app.run(port=5001, debug=True)