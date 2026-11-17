"""
Main entry point for the OAi Electronics Telemetry Monitor.

Initializes the Flask application and starts the web server.
"""


from app import create_app


# Initialize the Flask application.
application = create_app()


if __name__ == "__main__":


    # Display application startup information.
    print("====================================")
    print("         OAi Electronics")
    print("         TELEMETRY MONITOR")
    print("====================================")
    print("Dashboard: http://127.0.0.1:8080")
    print("Telemetry: /telemetry")
    print("API:       /api/telemetry")
    print("Waiting for vehicle connection...")

    # Configure the web server.
    # The server listens on all network interfaces
    # and accepts multiple simultaneous connections.
    application.run(
        host="0.0.0.0",
        port=8080,
        debug=False,
        threaded=True
    )
