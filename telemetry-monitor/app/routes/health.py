
import time

from datetime import datetime
from flask import Blueprint, jsonify

from app.config import VEHICLE_TIMEOUT
from app.services.telemetry_service import get_last_update


health_bp = Blueprint("health", __name__)


@health_bp.route("/health")
def health():
    """
    Return server and vehicle connection status.
    """

    last_update = get_last_update()

    online = (
        last_update > 0 and
        time.time() - last_update < VEHICLE_TIMEOUT
    )

    return jsonify({
        "server": "online",
        "vehicle": "online" if online else "offline",
        "time": datetime.now().isoformat()
    })
