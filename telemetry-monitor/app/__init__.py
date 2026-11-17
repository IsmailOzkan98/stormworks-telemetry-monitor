"""
Flask application initialization.

Creates the Flask application instance and registers
the application route blueprints.
"""


from flask import Flask

from app.routes.dashboard import dashboard_bp
from app.routes.telemetry import telemetry_bp
from app.routes.recorder import recorder_bp
from app.routes.health import health_bp


def create_app():
    """
    Create and configure the Flask application.

    Initializes the Flask instance and registers all
    application blueprints.

    Returns:
        Flask: Configured Flask application instance.
    """


    app = Flask(__name__)

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(telemetry_bp)
    app.register_blueprint(recorder_bp)
    app.register_blueprint(health_bp)

    return app
