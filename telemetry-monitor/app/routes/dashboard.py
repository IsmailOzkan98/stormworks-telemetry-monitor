
from flask import Blueprint, render_template, jsonify, current_app
import json
import os


dashboard_bp = Blueprint("dashboard", __name__)


# 01. DASHBOARD

@dashboard_bp.route("/")
def home():

    return render_template("index.html")


# 02. FRONTEND CONFIGURATION LOADER

def load_frontend_config(*path_parts):
    """
    Load a frontend JSON configuration file.

    Returns the configuration as a JSON response.
    Handles missing files and invalid JSON data.

    Args:
        *path_parts: Relative path components of the configuration file.
    """

    config_path = os.path.join(
        current_app.root_path,
        "config",
        "frontend",
        *path_parts
    )

    try:

        with open(config_path, "r", encoding="utf-8") as file:
            return jsonify(json.load(file))

    except FileNotFoundError:

        return jsonify({
            "error": "Configuration not found"
        }), 404

    except json.JSONDecodeError:

        return jsonify({
            "error": "Invalid JSON configuration"
        }), 500



# 03. API ROUTES

@dashboard_bp.route("/api/frontend-config")
def frontend_config():
    return load_frontend_config("config.json")


@dashboard_bp.route("/api/cards-config")
def cards_config():
    return load_frontend_config("modules", "cards.json")


@dashboard_bp.route("/api/missionBar-config")
def mission_bar_config():
    return load_frontend_config("modules", "missionBar.json")


@dashboard_bp.route("/api/missionMonitor-config")
def mission_monitor_config():
    return load_frontend_config("modules", "missionMonitor.json")


@dashboard_bp.route("/api/projectData-config")
def project_data_config():
    return load_frontend_config("modules", "projectData.json")


@dashboard_bp.route("/api/systemDiagnostics-config")
def system_diagnostics_config():
    return load_frontend_config("modules", "systemDiagnostics.json")


@dashboard_bp.route("/api/telemetryGraphs-config")
def telemetry_graphs_config():
    return load_frontend_config("modules", "telemetryGraphs.json")


@dashboard_bp.route("/api/systemEvents-config")
def system_events_config():
    return load_frontend_config("modules", "systemEvents.json")


@dashboard_bp.route("/api/themes-config")
def themes_config():
    return load_frontend_config("themes.json")








