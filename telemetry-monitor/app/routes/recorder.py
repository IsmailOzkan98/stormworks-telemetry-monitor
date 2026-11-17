
import os

from flask import Blueprint, jsonify

from app.services.recorder_service import (
    start_recording,
    stop_recording,
    get_recorder_status
)


recorder_bp = Blueprint("recorder", __name__)


@recorder_bp.route("/api/recorder/start", methods=["POST"])
def api_start_recording():
    """Start a new telemetry recording."""

    success, result = start_recording()

    if not success:

        status = get_recorder_status()

        return jsonify({
            "recording": status["recording"],
            "message": result
        }), 409

    return jsonify({
        "recording": True,
        "filename": os.path.basename(result)
    })


@recorder_bp.route("/api/recorder/stop", methods=["POST"])
def api_stop_recording():
    """Stop the current telemetry recording."""

    success, result = stop_recording()

    if not success:

        return jsonify({
            "recording": False,
            "message": result
        }), 409

    return jsonify({
        "recording": False,
        "filename": os.path.basename(result)
    })


@recorder_bp.route("/api/recorder", methods=["GET"])
def api_recorder_status():
    """Return the current recorder status."""

    return jsonify(get_recorder_status())
