from flask import Blueprint, request, jsonify
from services.job_service import fetch_jobs

job_bp = Blueprint("jobs", __name__)

@job_bp.route("/jobs", methods=["GET"])
def get_jobs():
    query = request.args.get("query")
    location = request.args.get("location")

    if not query or not location:
        return jsonify({"error": "Missing query or location"}), 400

    jobs = fetch_jobs(query, location)

    return jsonify({"jobs": jobs})