
from flask import Blueprint, request, jsonify, current_app

from app.services.telemetry_service import (
    update_telemetry,
    get_telemetry
)

from app.services.recorder_service import save_flight_event


telemetry_bp = Blueprint("telemetry", __name__)


@telemetry_bp.route("/telemetry", methods=["GET"])
def receive_telemetry():
    """
    Receive and process incoming vehicle telemetry.

    Updates the telemetry state and records flight events.
    """

    received = request.args.to_dict()

    if not received:
        return "No telemetry data", 400

    try:

        recording_snapshot = update_telemetry(received)

        save_flight_event(recording_snapshot)

        return "OK", 200

    except Exception as error:

        current_app.logger.exception("Telemetry reception error")

        return str(error), 500


@telemetry_bp.route("/api/telemetry")
def get_telemetry_data():
    """Return the latest telemetry data as JSON."""

    data = get_telemetry()

    return jsonify(data)
