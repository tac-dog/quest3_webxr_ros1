// Quest 3 WebXR ROS2 Integration
class Quest3WebXRROS2 {
    constructor() {
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.gl = null;
        this.canvas = null;
        this.animationId = null;
        this.websocket = null;
        this.controllers = [];
        this.controllerData = {
            headset: { position: null, rotation: null },
            left: { position: null, rotation: null, buttons: {} },
            right: { position: null, rotation: null, buttons: {} }
        };
        
        // Quest 3 specific button mapping
        this.buttonMapping = {
            trigger: 0,    // Index trigger
            grip: 1,       // Grip button
            menu: 2,       // Menu button
            thumbstick: 3, // Thumbstick click
            a: 4,          // A button (right controller)
            b: 5,          // B button (right controller)
            x: 4,          // X button (left controller)
            y: 5           // Y button (left controller)
        };
        
        this.init();
    }
    
    init() {
        this.log('Initializing Quest 3 WebXR ROS2 Integration with A-Frame...');
        
        // A-Frame will handle WebGL context
        this.canvas = document.getElementById('xr-canvas');
        
        // Check WebXR support
        this.checkWebXRSupport();
        
        // Set up WebSocket connection
        this.setupWebSocket();
        
        // Set up event listeners
        document.getElementById('enter-vr-btn').addEventListener('click', () => this.enterVR());
        document.getElementById('exit-vr-btn').addEventListener('click', () => this.exitVR());
        
        // Store instance globally for A-Frame component to access
        window.quest3Instance = this;
    }
    
    log(message) {
        const logEl = document.getElementById('log-output');
        const timestamp = new Date().toLocaleTimeString();
        logEl.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
        console.log('[Quest3 WebXR]', message);
    }
    

    
    checkWebXRSupport() {
        this.log('Checking WebXR support...');
        
        const statusEl = document.getElementById('webxr-status');
        const statusText = document.getElementById('webxr-status-text');
        
        if (!navigator.xr) {
            statusEl.className = 'status error';
            statusText.textContent = 'WebXR not supported';
            this.log('ERROR: WebXR not supported in this browser');
            return;
        }
        
        this.log('WebXR API is available');
        
        // Check for immersive-vr support
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                statusEl.className = 'status success';
                statusText.textContent = 'WebXR supported';
                document.getElementById('enter-vr-btn').disabled = false;
                this.log('SUCCESS: WebXR immersive-vr supported');
            } else {
                statusEl.className = 'status error';
                statusText.textContent = 'WebXR not supported';
                this.log('ERROR: WebXR immersive-vr not supported');
            }
        }).catch((error) => {
            statusEl.className = 'status error';
            statusText.textContent = 'WebXR check failed';
            this.log('ERROR: WebXR check failed: ' + error.message);
        });
        
        // Update WebGL status - A-Frame handles this
        document.getElementById('webgl-status').className = 'status success';
        document.getElementById('webgl-status-text').textContent = 'A-Frame managed';
    }
    
    setupWebSocket() {
        this.log('Setting up WebSocket connection...');
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = window.location.protocol === 'https:' ? '8444' : '8080';
        const wsUrl = `${protocol}//${window.location.hostname}:${port}`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            this.log('SUCCESS: WebSocket connected');
            document.getElementById('ws-status').textContent = 'Connected';
            document.getElementById('connection-status').className = 'status success';
        };
        
        this.websocket.onclose = () => {
            this.log('WebSocket disconnected');
            document.getElementById('ws-status').textContent = 'Disconnected';
            document.getElementById('connection-status').className = 'status error';
        };
        
        this.websocket.onerror = (error) => {
            this.log('ERROR: WebSocket error: ' + error);
            document.getElementById('ws-status').textContent = 'Error';
            document.getElementById('connection-status').className = 'status error';
        };
        
        this.websocket.onmessage = (event) => {
            this.log('Received: ' + event.data);
        };
    }
    
    async enterVR() {
        try {
            this.log('Attempting to enter VR via A-Frame...');
            
            // Use A-Frame to enter VR
            const sceneEl = document.querySelector('a-scene');
            if (sceneEl) {
                sceneEl.enterVR(true).catch((err) => {
                    this.log('ERROR: A-Frame failed to enter VR: ' + err.message);
                    alert(`Failed to start VR session via A-Frame: ${err.message}`);
                });
                
                // Update UI when A-Frame enters VR
                sceneEl.addEventListener('enter-vr', () => {
                    this.log('SUCCESS: VR session started via A-Frame!');
                    document.getElementById('enter-vr-btn').disabled = true;
                    document.getElementById('exit-vr-btn').disabled = false;
                    document.getElementById('session-status').className = 'status success';
                    document.getElementById('session-status-text').textContent = 'Active';
                });
                
                sceneEl.addEventListener('exit-vr', () => {
                    this.onXRSessionEnd();
                });
            } else {
                this.log('ERROR: A-Frame scene not found');
                alert('A-Frame scene not found');
            }
            
        } catch (error) {
            this.log('ERROR: Failed to enter VR: ' + error.message);
            alert('Failed to enter VR: ' + error.message);
        }
    }
    

    
    // Note: updateQuest3Data is now handled by A-Frame controller-updater component
    
    getControllerButtons(inputSource, hand) {
        const buttons = {};
        
        // Debug: Log input source properties (commented out for performance)
        // this.log(`${hand} input source: gamepad=${!!inputSource.gamepad}, targetRayMode=${inputSource.targetRayMode}, handedness=${inputSource.handedness}`);
        
        if (inputSource.gamepad) {
            const gamepad = inputSource.gamepad;
            
            // Quest 3 button mapping
            buttons.trigger = gamepad.buttons[0]?.pressed || false;
            buttons.grip = gamepad.buttons[1]?.pressed || false;
            buttons.menu = gamepad.buttons[2]?.pressed || false;
            buttons.thumbstick = gamepad.buttons[3]?.pressed || false;
            
            // Hand-specific buttons
            if (hand === 'right') {
                buttons.a = gamepad.buttons[4]?.pressed || false;
                buttons.b = gamepad.buttons[5]?.pressed || false;
            } else {
                buttons.x = gamepad.buttons[4]?.pressed || false;
                buttons.y = gamepad.buttons[5]?.pressed || false;
            }
            
            // Thumbstick axes - Quest 3 uses axes[2] and axes[3] for thumbstick
            if (gamepad.axes && gamepad.axes.length >= 4) {
                buttons.thumbstick_x = gamepad.axes[2] || 0.0;
                buttons.thumbstick_y = gamepad.axes[3] || 0.0;
            } else if (gamepad.axes && gamepad.axes.length >= 2) {
                // Fallback to axes[0] and axes[1] if only 2 axes available
                buttons.thumbstick_x = gamepad.axes[0] || 0.0;
                buttons.thumbstick_y = gamepad.axes[1] || 0.0;
            } else {
                buttons.thumbstick_x = 0.0;
                buttons.thumbstick_y = 0.0;
            }
            
            // Debug: Log gamepad info (commented out for performance)
            // if (gamepad.axes) {
            //     this.log(`${hand} controller: ${gamepad.axes.length} axes, values: [${gamepad.axes.join(', ')}]`);
            // } else {
            //     this.log(`${hand} controller: No axes available`);
            // }
            // 
            // // Debug: Log all gamepad properties
            // this.log(`${hand} controller gamepad: buttons=${gamepad.buttons?.length || 0}, axes=${gamepad.axes?.length || 0}`);
        }
        
        return buttons;
    }
    
    updateControllerUI(hand) {
        const pos = this.controllerData[hand].position;
        const buttons = this.controllerData[hand].buttons;
        
        if (pos) {
            const statusText = `Rel Pos: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
            const buttonText = Object.entries(buttons)
                .filter(([key, value]) => value && key !== 'thumbstick_x' && key !== 'thumbstick_y')
                .map(([key, value]) => key)
                .join(', ');
            
            const fullStatus = buttonText ? `${statusText} | Buttons: ${buttonText}` : statusText;
            document.getElementById(`${hand}-status`).textContent = fullStatus;
        }
    }
    
    // Note: sendQuest3Data is now handled by A-Frame controller-updater component
    
    // Note: Helper functions are now handled by A-Frame controller-updater component
    
    exitVR() {
        this.log('Exiting VR...');
        const sceneEl = document.querySelector('a-scene');
        if (sceneEl) {
            sceneEl.exitVR();
        } else {
            this.log('ERROR: A-Frame scene not found');
        }
    }
    
    onXRSessionEnd() {
        this.log('XR session ended');
        this.xrSession = null;
        this.xrReferenceSpace = null;
        
        // Update UI
        document.getElementById('enter-vr-btn').disabled = false;
        document.getElementById('exit-vr-btn').disabled = true;
        
        // Update status
        document.getElementById('session-status').className = 'status';
        document.getElementById('session-status-text').textContent = 'None';
        
        // Reset controller status
        document.getElementById('headset-status').textContent = 'Not detected';
        document.getElementById('left-status').textContent = 'Not detected';
        document.getElementById('right-status').textContent = 'Not detected';
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    new Quest3WebXRROS2();
});

// A-Frame controller-updater component for transparent VR scene
AFRAME.registerComponent('controller-updater', {
    init: function () {
        console.log("Controller updater component initialized for transparent VR scene.");
        
        // Get A-Frame entities
        this.leftHand = document.querySelector('#leftHand');
        this.rightHand = document.querySelector('#rightHand');
        this.leftHandInfoText = document.querySelector('#leftHandInfo');
        this.rightHandInfoText = document.querySelector('#rightHandInfo');
        
        // Add headset tracking
        this.headset = document.querySelector('#headset');
        this.headsetInfoText = document.querySelector('#headsetInfo');
        
        // WebSocket for data transmission (reuse existing connection)
        this.websocket = null;
        this.setupAFrameWebSocket();
        
        // Get existing Quest3WebXRROS2 instance for data access
        this.quest3Instance = null;
        
        // Try to find existing instance or wait for it
        this.waitForQuest3Instance();
        
        if (!this.leftHand || !this.rightHand) {
            console.error("Controller entities not found!");
            return;
        }
        
        // Apply initial rotation to text elements
        const textRotation = '-90 0 0';
        if (this.leftHandInfoText) this.leftHandInfoText.setAttribute('rotation', textRotation);
        if (this.rightHandInfoText) this.rightHandInfoText.setAttribute('rotation', textRotation);
        
        // Create axis indicators for controllers
        this.createAxisIndicators();
    },
    
    setupAFrameWebSocket: function() {
        // Setup WebSocket connection for A-Frame data
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = window.location.protocol === 'https:' ? '8444' : '8080';
        const wsUrl = `${protocol}//${window.location.hostname}:${port}`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('A-Frame WebSocket connected');
        };
        
        this.websocket.onclose = () => {
            console.log('A-Frame WebSocket disconnected');
        };
        
        this.websocket.onerror = (error) => {
            console.error('A-Frame WebSocket error:', error);
        };
    },
    
    waitForQuest3Instance: function() {
        // Wait for Quest3WebXRROS2 instance to be available
        const checkInterval = setInterval(() => {
            // Look for existing instance in global scope or DOM
            const instances = document.querySelectorAll('[data-quest3-instance]');
            if (instances.length > 0) {
                this.quest3Instance = instances[0].__quest3Instance;
                clearInterval(checkInterval);
                console.log('Found Quest3WebXRROS2 instance');
            }
            
            // Also check if we can find it through window
            if (window.quest3Instance) {
                this.quest3Instance = window.quest3Instance;
                clearInterval(checkInterval);
                console.log('Found Quest3WebXRROS2 instance via window');
            }
        }, 1000);
    },
    
    createAxisIndicators: function() {
        // Create simple axis indicators for both controllers
        
        // Left Controller Axes
        // X-axis (Red)
        const leftXAxis = document.createElement('a-cylinder');
        leftXAxis.setAttribute('height', '0.08');
        leftXAxis.setAttribute('radius', '0.003');
        leftXAxis.setAttribute('color', '#ff0000');
        leftXAxis.setAttribute('position', '0.04 0 0');
        leftXAxis.setAttribute('rotation', '0 0 90');
        this.leftHand.appendChild(leftXAxis);
        
        // Y-axis (Green)
        const leftYAxis = document.createElement('a-cylinder');
        leftYAxis.setAttribute('height', '0.08');
        leftYAxis.setAttribute('radius', '0.003');
        leftYAxis.setAttribute('color', '#00ff00');
        leftYAxis.setAttribute('position', '0 0.04 0');
        leftYAxis.setAttribute('rotation', '0 0 0');
        this.leftHand.appendChild(leftYAxis);
        
        // Z-axis (Blue)
        const leftZAxis = document.createElement('a-cylinder');
        leftZAxis.setAttribute('height', '0.08');
        leftZAxis.setAttribute('radius', '0.003');
        leftZAxis.setAttribute('color', '#0000ff');
        leftZAxis.setAttribute('position', '0 0 0.04');
        leftZAxis.setAttribute('rotation', '90 0 0');
        this.leftHand.appendChild(leftZAxis);
        
        // Right Controller Axes
        // X-axis (Red)
        const rightXAxis = document.createElement('a-cylinder');
        rightXAxis.setAttribute('height', '0.08');
        rightXAxis.setAttribute('radius', '0.003');
        rightXAxis.setAttribute('color', '#ff0000');
        rightXAxis.setAttribute('position', '0.04 0 0');
        rightXAxis.setAttribute('rotation', '0 0 90');
        this.rightHand.appendChild(rightXAxis);
        
        // Y-axis (Green)
        const rightYAxis = document.createElement('a-cylinder');
        rightYAxis.setAttribute('height', '0.08');
        rightYAxis.setAttribute('radius', '0.003');
        rightYAxis.setAttribute('color', '#00ff00');
        rightYAxis.setAttribute('position', '0 0.04 0');
        rightYAxis.setAttribute('rotation', '0 0 0');
        this.rightHand.appendChild(rightYAxis);
        
        // Z-axis (Blue)
        const rightZAxis = document.createElement('a-cylinder');
        rightZAxis.setAttribute('height', '0.08');
        rightZAxis.setAttribute('radius', '0.003');
        rightZAxis.setAttribute('color', '#0000ff');
        rightZAxis.setAttribute('position', '0 0 0.04');
        rightZAxis.setAttribute('rotation', '90 0 0');
        this.rightHand.appendChild(rightZAxis);
        
        console.log('Axis indicators created for both controllers');
    },
    
    tick: function () {
        // Update controller text if controllers are visible
        if (!this.leftHand || !this.rightHand) return;
        
        // Collect data from both controllers
        const leftController = {
            hand: 'left',
            position: null,
            rotation: null
        };
        
        const rightController = {
            hand: 'right',
            position: null,
            rotation: null
        };
        
        // Collect headset data
        const headset = {
            position: null,
            rotation: null
        };
        
        // Update Left Hand Text & Collect Data
        if (this.leftHand && this.leftHand.object3D && this.leftHand.object3D.visible) {
            const leftPos = this.leftHand.object3D.position;
            const leftRotEuler = this.leftHand.object3D.rotation;
            const leftRotX = THREE.MathUtils.radToDeg(leftRotEuler.x);
            const leftRotY = THREE.MathUtils.radToDeg(leftRotEuler.y);
            const leftRotZ = THREE.MathUtils.radToDeg(leftRotEuler.z);
            
            const leftText = `Pos: ${leftPos.x.toFixed(2)} ${leftPos.y.toFixed(2)} ${leftPos.z.toFixed(2)}\\nRot: ${leftRotX.toFixed(0)} ${leftRotY.toFixed(0)} ${leftRotZ.toFixed(0)}`;
            
            if (this.leftHandInfoText) {
                this.leftHandInfoText.setAttribute('value', leftText);
            }
            
            // Collect left controller data
            leftController.position = { x: leftPos.x, y: leftPos.y, z: leftPos.z };
            leftController.rotation = { x: leftRotX, y: leftRotY, z: leftRotZ };
            leftController.quaternion = {
                x: this.leftHand.object3D.quaternion.x,
                y: this.leftHand.object3D.quaternion.y,
                z: this.leftHand.object3D.quaternion.z,
                w: this.leftHand.object3D.quaternion.w
            };
            
            // Collect left controller buttons and thumbstick
            if (this.leftHand && this.leftHand.components && this.leftHand.components['tracked-controls']) {
                const leftGamepad = this.leftHand.components['tracked-controls'].controller?.gamepad;
                if (leftGamepad) {
                    // Thumbstick
                    leftController.thumbstick = {
                        x: leftGamepad.axes[2] || 0,
                        y: leftGamepad.axes[3] || 0
                    };
                    // Buttons - using correct names for server
                    leftController.buttons = {
                        trigger: !!leftGamepad.buttons[0]?.pressed,
                        grip: !!leftGamepad.buttons[1]?.pressed,
                        menu: !!leftGamepad.buttons[2]?.pressed,
                        thumbstick: !!leftGamepad.buttons[3]?.pressed,
                        x: !!leftGamepad.buttons[4]?.pressed,
                        y: !!leftGamepad.buttons[5]?.pressed,
                        thumbstick_x: leftGamepad.axes[2] || 0.0,
                        thumbstick_y: leftGamepad.axes[3] || 0.0
                    };
                    leftController.trigger = leftGamepad.buttons[0]?.pressed ? 1 : 0;
                    leftController.gripActive = !!leftGamepad.buttons[1]?.pressed;
                }
            }
        }
        
        // Update Right Hand Text & Collect Data
        if (this.rightHand && this.rightHand.object3D && this.rightHand.object3D.visible) {
            const rightPos = this.rightHand.object3D.position;
            const rightRotEuler = this.rightHand.object3D.rotation;
            const rightRotX = THREE.MathUtils.radToDeg(rightRotEuler.x);
            const rightRotY = THREE.MathUtils.radToDeg(rightRotEuler.y);
            const rightRotZ = THREE.MathUtils.radToDeg(rightRotEuler.z);
            
            const rightText = `Pos: ${rightPos.x.toFixed(2)} ${rightPos.y.toFixed(2)} ${rightPos.z.toFixed(2)}\\nRot: ${rightRotX.toFixed(0)} ${rightRotY.toFixed(0)} ${rightRotZ.toFixed(0)}`;
            
            if (this.rightHandInfoText) {
                this.rightHandInfoText.setAttribute('value', rightText);
            }
            
            // Collect right controller data
            rightController.position = { x: rightPos.x, y: rightPos.y, z: rightPos.z };
            rightController.rotation = { x: rightRotX, y: rightRotY, z: rightRotZ };
            rightController.quaternion = {
                x: this.rightHand.object3D.quaternion.x,
                y: this.rightHand.object3D.quaternion.y,
                z: this.rightHand.object3D.quaternion.z,
                w: this.rightHand.object3D.quaternion.w
            };
            
            // Collect right controller buttons and thumbstick
            if (this.rightHand && this.rightHand.components && this.rightHand.components['tracked-controls']) {
                const rightGamepad = this.rightHand.components['tracked-controls'].controller?.gamepad;
                if (rightGamepad) {
                    // Thumbstick
                    rightController.thumbstick = {
                        x: rightGamepad.axes[2] || 0,
                        y: rightGamepad.axes[3] || 0
                    };
                    // Buttons - using correct names for server
                    rightController.buttons = {
                        trigger: !!rightGamepad.buttons[0]?.pressed,
                        grip: !!rightGamepad.buttons[1]?.pressed,
                        menu: !!rightGamepad.buttons[2]?.pressed,
                        thumbstick: !!rightGamepad.buttons[3]?.pressed,
                        a: !!rightGamepad.buttons[4]?.pressed,
                        b: !!rightGamepad.buttons[5]?.pressed,
                        thumbstick_x: rightGamepad.axes[2] || 0.0,
                        thumbstick_y: rightGamepad.axes[3] || 0.0
                    };
                    rightController.trigger = rightGamepad.buttons[0]?.pressed ? 1 : 0;
                    rightController.gripActive = !!rightGamepad.buttons[1]?.pressed;
                }
            }
        }
        
        // Collect headset data
        if (this.headset && this.headset.object3D && this.headset.object3D.visible) {
            const headsetPos = this.headset.object3D.position;
            const headsetRotEuler = this.headset.object3D.rotation;
            const headsetRotX = THREE.MathUtils.radToDeg(headsetRotEuler.x);
            const headsetRotY = THREE.MathUtils.radToDeg(headsetRotEuler.y);
            const headsetRotZ = THREE.MathUtils.radToDeg(headsetRotEuler.z);
            
            // Update headset info text
            const headsetText = `Pos: ${headsetPos.x.toFixed(2)} ${headsetPos.y.toFixed(2)} ${headsetPos.z.toFixed(2)}\\nRot: ${headsetRotX.toFixed(0)} ${headsetRotY.toFixed(0)} ${headsetRotZ.toFixed(0)}`;
            if (this.headsetInfoText) {
                this.headsetInfoText.setAttribute('value', headsetText);
            }
            
            // Collect headset data
            headset.position = { x: headsetPos.x, y: headsetPos.y, z: headsetPos.z };
            headset.rotation = { x: headsetRotX, y: headsetRotY, z: headsetRotZ };
            headset.quaternion = {
                x: this.headset.object3D.quaternion.x,
                y: this.headset.object3D.quaternion.y,
                z: this.headset.object3D.quaternion.z,
                w: this.headset.object3D.quaternion.w
            };
        }
        
        // Send combined packet if WebSocket is open and at least one controller has valid data
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const hasValidLeft = leftController.position !== null;
            const hasValidRight = rightController.position !== null;
            const hasValidHeadset = headset.position !== null;
            
            if (hasValidLeft || hasValidRight || hasValidHeadset) {
                const dualControllerData = {
                    type: 'quest3_data',
                    timestamp: Date.now(),
                    headset: headset,
                    left: leftController,
                    right: rightController
                };
                this.websocket.send(JSON.stringify(dualControllerData));
                
                // Debug: Log button data
                if (leftController.buttons) {
                    const pressedLeft = Object.entries(leftController.buttons)
                        .filter(([key, value]) => value && key !== 'thumbstick_x' && key !== 'thumbstick_y')
                        .map(([key, value]) => key);
                    if (pressedLeft.length > 0) {
                        console.log('Left buttons pressed:', pressedLeft.join(', '));
                    }
                }
                if (rightController.buttons) {
                    const pressedRight = Object.entries(rightController.buttons)
                        .filter(([key, value]) => value && key !== 'thumbstick_x' && key !== 'thumbstick_y')
                        .map(([key, value]) => key);
                    if (pressedRight.length > 0) {
                        console.log('Right buttons pressed:', pressedRight.join(', '));
                    }
                }
                
                console.log('Sending A-Frame VR data:', {
                    left: hasValidLeft ? 'valid' : 'invalid',
                    right: hasValidRight ? 'valid' : 'invalid',
                    headset: hasValidHeadset ? 'valid' : 'invalid',
                    hasLeftButtons: !!leftController.buttons,
                    hasRightButtons: !!rightController.buttons
                });
            }
        }
    }
});

// Add the component to the scene after it's loaded
document.addEventListener('DOMContentLoaded', (event) => {
    const scene = document.querySelector('a-scene');
    
    if (scene) {
        // Listen for controller connection events
        scene.addEventListener('controllerconnected', (evt) => {
            console.log('Controller CONNECTED:', evt.detail.name, evt.detail.component.data.hand);
        });
        scene.addEventListener('controllerdisconnected', (evt) => {
            console.log('Controller DISCONNECTED:', evt.detail.name, evt.detail.component.data.hand);
        });
        
        // Add controller-updater component when scene is loaded
        if (scene.hasLoaded) {
            scene.setAttribute('controller-updater', '');
            console.log("controller-updater component added immediately.");
        } else {
            scene.addEventListener('loaded', () => {
                scene.setAttribute('controller-updater', '');
                console.log("controller-updater component added after scene loaded.");
            });
        }
    } else {
        console.error('A-Frame scene not found!');
    }
});
