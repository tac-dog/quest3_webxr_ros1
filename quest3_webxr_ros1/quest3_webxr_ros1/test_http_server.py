#!/usr/bin/env python3
"""
Simple HTTP test server for Quest 3 WebXR
This server uses HTTP instead of HTTPS for testing connectivity
"""

import asyncio
import sys
import json
import threading
import time
from pathlib import Path
import os

# WebSocket imports
import websockets
from websockets.server import serve

# ROS1 imports
import rospy
from geometry_msgs.msg import TransformStamped
from sensor_msgs.msg import Joy
from tf import TransformBroadcaster

# HTTP server imports
import http.server
import socketserver

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_local_ip():
    """Get the local IP address of this machine."""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "localhost"

class SimpleHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler that serves files from the webxr_app directory"""
    
    def __init__(self, *args, **kwargs):
        self.directory = os.path.join(os.path.dirname(__file__), '..', 'webxr_app')
        super().__init__(*args, directory=self.directory, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

class Quest3HTTPServer:
    def __init__(self):
        rospy.init_node('quest3_webxr_server', anonymous=True)
        
        self.host = '0.0.0.0'
        self.http_port = rospy.get_param('~http_port', 8080)
        self.ws_port = rospy.get_param('~ws_port', 8081)
        
        # TF broadcaster
        self.tf_broadcaster = TransformBroadcaster()
        
        # Publishers
        self.headset_transform_pub = rospy.Publisher('/quest3/headset/transform', TransformStamped, queue_size=10)
        self.left_controller_transform_pub = rospy.Publisher('/quest3/left_controller/transform', TransformStamped, queue_size=10)
        self.right_controller_transform_pub = rospy.Publisher('/quest3/right_controller/transform', TransformStamped, queue_size=10)
        self.left_controller_buttons_pub = rospy.Publisher('/quest3/left_controller/buttons', Joy, queue_size=10)
        self.right_controller_buttons_pub = rospy.Publisher('/quest3/right_controller/buttons', Joy, queue_size=10)
        
        logger.info("Quest 3 HTTP Server initialized")
    
    async def handle_websocket(self, websocket, path=None):
        """Handle WebSocket connections"""
        client_addr = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        logger.info(f"New WebSocket client connected: {client_addr}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get('type') == 'quest3_data':
                        logger.info(f"Received Quest 3 data")
                    elif data.get('type') == 'test':
                        logger.info(f"Test message: {data.get('message', 'No message')}")
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON: {e}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            logger.info(f"WebSocket client disconnected: {client_addr}")
    
    def start_http_server(self):
        """Start HTTP server (not HTTPS)"""
        try:
            httpd = socketserver.TCPServer((self.host, self.http_port), SimpleHTTPRequestHandler)
            logger.info(f"HTTP server started on http://{self.host}:{self.http_port}")
            
            def run_server():
                httpd.serve_forever()
            
            server_thread = threading.Thread(target=run_server, daemon=True)
            server_thread.start()
            
        except Exception as e:
            logger.error(f"Failed to start HTTP server: {e}")
    
    async def start_websocket_server(self):
        """Start WebSocket server"""
        try:
            ws_server = await serve(
                self.handle_websocket,
                self.host,
                self.ws_port,
                ping_interval=30,
                ping_timeout=20
            )
            logger.info(f"WebSocket server started on ws://{self.host}:{self.ws_port}")
            return ws_server
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            return None
    
    async def run(self):
        """Main server loop"""
        local_ip = get_local_ip()
        
        print("\n" + "="*60)
        print("  Quest 3 WebXR HTTP Test Server")
        print("="*60)
        print(f"\n  Local IP Address: {local_ip}")
        print(f"\n  WebXR App URL (HTTP - for testing):")
        print(f"  http://{local_ip}:{self.http_port}/quest3_webxr.html")
        print(f"\n  WebSocket URL:")
        print(f"  ws://{local_ip}:{self.ws_port}")
        print(f"\n" + "="*60)
        print(f"\n  NOTE: If this works, the issue is with HTTPS certificates.")
        print(f"  You may need to install the certificate on your Quest 3.")
        print("="*60 + "\n")
        
        # Start HTTP server
        self.start_http_server()
        
        # Start WebSocket server
        ws_server = await self.start_websocket_server()
        
        if ws_server:
            logger.info("All servers started successfully!")
            
            try:
                await asyncio.Future()
            except KeyboardInterrupt:
                logger.info("Shutdown requested")
            finally:
                ws_server.close()
                await ws_server.wait_closed()

def main():
    """Main function"""
    server = Quest3HTTPServer()
    
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(server.run())
    except KeyboardInterrupt:
        print("\nShutdown requested")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()