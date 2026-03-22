from flask import Blueprint, request, jsonify
from services.resume_service import parse_resume

resume_bp = Blueprint("resume", __name__)

@resume_bp.route("/parse-resume", methods=["POST"])
def handle_parse_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    result = parse_resume(file)

    return jsonify(result)