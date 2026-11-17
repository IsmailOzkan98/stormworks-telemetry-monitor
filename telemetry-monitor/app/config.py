"""
Application configuration and filesystem paths.

Defines the base directories, configuration file locations
and telemetry monitoring parameters.
"""


import os


# Absolute path to the directory containing this file.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# Backend configuration directory.
BACKEND_CONFIG_DIR = os.path.join(
    BASE_DIR, "config", "backend"
)


# Recorder configuration file.
RECORDER_CONFIG_FILE = os.path.join(
    BACKEND_CONFIG_DIR, "recorder_config.json"
)


# Telemetry data schema definition.
TELEMETRY_SCHEMA_FILE = os.path.join(
    BACKEND_CONFIG_DIR, "telemetry_schema.json"
)


# Application log directory.
LOG_DIR = os.path.join(BASE_DIR, "logs")


# Maximum time without receiving telemetry before
# considering the vehicle disconnected (seconds).
VEHICLE_TIMEOUT = 2
