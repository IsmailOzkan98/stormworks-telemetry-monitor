
from flask import Flask, render_template, jsonify, request
from datetime import datetime
from threading import Lock
import time

app = Flask(__name__)

# ==========================================
# OAI MIZUSHIMA YR-02 - TELEMETRY SERVER
# ==========================================

telemetry_lock = Lock()

telemetry = {
    "stage": "WAITING",
    "state": 0,
    "status": "IDLE",
    "timer": 0,

    "alt": 0,
    "alt_target": 0,
    "alt_error": 0,

    "vs": 0,
    "vs_target": 0,
    "vs_error": 0,

    "rps": 0,
    "rps_target": 0,

    "roll": 0,
    "pitch": 0,

    "ap": 0,
    "ap_distance": 0,
    "yaw": 0,

    "my_x": 0,
    "my_y": 0,
    "target_x": 0,
    "target_y": 0,

    "main": 0,
    "alt_hold": 0,
    "roll_stab": 0,
    "accel": 0,

    "north": 0,
    "east": 0,
    "south": 0,
    "west": 0,

    "spoiler": 0,

    "timestamp": 0
}

# ==========================================
# DASHBOARD
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


# ==========================================
# RECEIVE STORMWORKS TELEMETRY
# ==========================================

@app.route("/telemetry", methods=["GET"])
def receive_telemetry():

    global telemetry

    received = request.args.to_dict()

    if not received:
        return "No telemetry data", 400

    try:
        with telemetry_lock:

            # Convertir valores numéricos
            for key, value in received.items():

                if key in telemetry and key != "stage" and key != "status":
                    try:
                        telemetry[key] = float(value)
                    except (ValueError, TypeError):
                        continue

                elif key in ("stage", "status"):
                    telemetry[key] = value

            telemetry["timestamp"] = time.time()

        return "OK", 200

    except Exception as error:
        app.logger.exception("Telemetry reception error")
        return str(error), 500


# ==========================================
# API FOR HTML DASHBOARD
# ==========================================

@app.route("/api/telemetry")
def get_telemetry():

    with telemetry_lock:
        data = telemetry.copy()

    return jsonify(data)


# ==========================================
# SERVER HEALTH
# ==========================================

@app.route("/health")
def health():

    with telemetry_lock:
        last_update = telemetry["timestamp"]

    online = (
        last_update > 0 and
        time.time() - last_update < 2
    )

    return jsonify({
        "server": "online",
        "vehicle": "online" if online else "offline",
        "time": datetime.now().isoformat()
    })


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    print("====================================")
    print("      OAI MIZUSHIMA YR-02")
    print("         FLIGHT MONITOR")
    print("====================================")
    print("Dashboard: http://127.0.0.1:8080")
    print("Telemetry: /telemetry")
    print("API:       /api/telemetry")
    print("Waiting for vehicle connection...")

    app.run(
        host="0.0.0.0",
        port=8080,
        debug=False,
        threaded=True
    )
