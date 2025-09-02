# Vercel serverless function entry point
import sys
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the Flask app
from app import app

# Export the Flask app for Vercel - this is the required format
app = app