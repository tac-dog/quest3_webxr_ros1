# Quest 3 WebXR ROS1 集成 / Quest 3 WebXR ROS1 Integration

> **致谢 / Acknowledgments**
> 
> 本项目修改自 [quest3-webxr-ros2](https://github.com/Jdhaworth/quest3-webxr-ros2.git)，感谢原作者的贡献。
> 
> 虚拟界面参考自 [XLeRobot](https://github.com/Vector-Wangel/XLeRobot.git)，感谢 Vector-Wangel 提供的虚拟界面设计。
> 
> This project is modified from [quest3-webxr-ros2](https://github.com/Jdhaworth/quest3-webxr-ros2.git). Thanks to the original author for their contribution.
> 
> Virtual interface reference from [XLeRobot](https://github.com/Vector-Wangel/XLeRobot.git), thanks to Vector-Wangel for the virtual interface design.

[English](#english) | [中文](#中文)

---

<a name="中文"></a>

## 中文文档

本包提供了 Oculus Quest 3 VR 头显与 ROS1 之间的无缝集成，使用 WebXR 技术。它将头显和控制器的位姿发布为 TF 坐标系和话题，支持基于 VR 的机器人控制和遥操作。

### 功能特性

- **WebXR 集成**: 原生 Quest 3 支持，使用 WebXR API
- **TF 发布**: 头显和控制器位姿作为 TF 变换发布
- **ROS1 话题**: 变换和按钮数据可通过标准 ROS1 话题获取
- **实时数据**: 低延迟的控制器和头显追踪
- **Quest 3**: 专为 Oculus Quest 3 功能设计
- **按键和摇杆支持**: 完整的控制器输入，包括所有按键和摇杆轴

### 发布的话题

#### 变换话题
- `/quest3/headset/transform` (geometry_msgs/TransformStamped)
- `/quest3/left_controller/transform` (geometry_msgs/TransformStamped)
- `/quest3/right_controller/transform` (geometry_msgs/TransformStamped)

#### 按钮话题
- `/quest3/left_controller/buttons` (sensor_msgs/Joy)
- `/quest3/right_controller/buttons` (sensor_msgs/Joy)

### 发布的 TF 坐标系

- `quest3_headset` - 头显在世界坐标系中的位置和方向
- `quest3_left_controller` - 左控制器相对于头显的位置
- `quest3_right_controller` - 右控制器相对于头显的位置

### 安装

#### 前置要求

- ROS1 (测试于 Noetic)
- Python 3.8+
- Oculus Quest 3，支持 WebXR
- WebXR 兼容浏览器 (Meta Quest Browser)

#### 构建包

```bash
cd ~/catkin_ws
catkin build quest3_webxr_ros1
source devel/setup.bash
```

### 快速开始

1. **构建包**: `catkin build quest3_webxr_ros1`
2. **生成证书**: `./generate_ssl_cert.sh`
3. **启动服务器**: `roslaunch quest3_webxr_ros1 quest3.launch`
4. **确保 Quest 3 处于开发者模式**: [Meta 开发者设备设置](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)
5. **打开 Quest 3 浏览器**: 访问 `https://你的IP:8443/quest3_webxr.html`
6. **进入 VR**: 点击 "Start VR" 开始控制！

### 使用方法

#### 1. SSL 证书

本包包含开发用的 SSL 证书。如需重新生成：

```bash
# 生成新的自签名证书（用于开发）
./generate_ssl_cert.sh
```

**注意**: 生产环境请使用证书颁发机构的正规证书。

#### 2. 启动 WebXR 服务器

```bash
# 使用 launch 文件（推荐）
roslaunch quest3_webxr_ros1 quest3.launch

# 或直接运行
rosrun quest3_webxr_ros1 webxr_server.py
```

#### 3. 访问 WebXR 应用

1. 在 Quest 3 上打开 Meta Quest 浏览器
2. 访问: `https://你的IP地址:8443/quest3_webxr.html`
3. 接受 SSL 证书（点击"高级" → "继续"）
4. 点击 "Start VR" 启动 WebXR 会话

#### 4. 监控 ROS1 数据

```bash
# 查看发布的话题
rostopic list | grep quest3

# 监控头显变换
rostopic echo /quest3/headset/transform

# 监控控制器变换
rostopic echo /quest3/left_controller/transform
rostopic echo /quest3/right_controller/transform

# 监控按钮数据
rostopic echo /quest3/left_controller/buttons
rostopic echo /quest3/right_controller/buttons

# 查看 TF 树
rosrun tf view_frames
```

### Quest 3 控制器映射

#### 按键 (sensor_msgs/Joy)
- `buttons[0]` - 扳机键 (食指)
- `buttons[1]` - 握持键
- `buttons[2]` - 菜单键
- `buttons[3]` - 摇杆点击
- `buttons[4]` - A 键 (右手柄) / X 键 (左手柄)
- `buttons[5]` - B 键 (右手柄) / Y 键 (左手柄)

#### 轴 (sensor_msgs/Joy)
- `axes[0]` - 摇杆 X 轴 (-1.0 到 1.0)
- `axes[1]` - 摇杆 Y 轴 (-1.0 到 1.0)

### 配置

#### Launch 参数

```bash
roslaunch quest3_webxr_ros1 quest3.launch \
    host:=0.0.0.0 \
    http_port:=8443 \
    ws_port:=8080 \
    wss_port:=8444
```

#### 网络配置

- **HTTP 端口**: 8443 (HTTPS 用于 WebXR 应用)
- **WebSocket 端口**: 8080 (WS 用于通信)
- **安全 WebSocket 端口**: 8444 (WSS 用于生产环境)

### 故障排除

#### WebXR 不支持
- 确保使用 Meta Quest 浏览器
- 尝试通过 HTTPS 访问（WebXR 所需）

#### 连接问题
- 验证浏览器中的 IP 地址和端口（使用本地 IP，不是 0.0.0.0）
- 检查防火墙设置
- 确保 Quest 3 和 PC 在同一 WiFi 网络
- 确保 SSL 证书已正确生成

#### 没有控制器数据
- 确保控制器已开机并配对
- 验证 WebSocket 连接已建立
- 点击 "Start VR" 激活 WebXR 会话

#### 按钮话题不更新
- 检查是否在 VR 模式中按按钮
- 验证 WebXR 会话处于活动状态
- 查看服务器日志中的错误信息

#### TF 坐标系不出现
- 检查 WebXR 会话是否处于活动状态
- 运行 `rosrun tf view_frames` 检查 TF 树

---

<a name="english"></a>

## English Documentation

This package provides seamless integration between Oculus Quest 3 VR headsets and ROS1 using WebXR technology. It publishes headset and controller transforms as TF frames and topics, enabling VR-based robot control and teleoperation.

### Features

- **WebXR Integration**: Native Quest 3 support with WebXR API
- **TF Publishing**: Headset and controller poses published as TF transforms
- **ROS1 Topics**: Transform and button data available as standard ROS1 topics
- **Real-time Data**: Low-latency controller and headset tracking
- **Quest 3**: Specifically designed for Oculus Quest 3 capabilities
- **Button & Thumbstick Support**: Full controller input including all buttons and thumbstick axes

### Published Topics

#### Transform Topics
- `/quest3/headset/transform` (geometry_msgs/TransformStamped)
- `/quest3/left_controller/transform` (geometry_msgs/TransformStamped)
- `/quest3/right_controller/transform` (geometry_msgs/TransformStamped)

#### Button Topics
- `/quest3/left_controller/buttons` (sensor_msgs/Joy)
- `/quest3/right_controller/buttons` (sensor_msgs/Joy)

### Published TF Frames

- `quest3_headset` - Headset position and orientation in world frame
- `quest3_left_controller` - Left controller relative to headset
- `quest3_right_controller` - Right controller relative to headset

### Installation

#### Prerequisites

- ROS1 (tested with Noetic)
- Python 3.8+
- Oculus Quest 3 with WebXR support
- WebXR-compatible browser (Meta Quest Browser)

#### Build the Package

```bash
cd ~/catkin_ws
catkin build quest3_webxr_ros1
source devel/setup.bash
```

### Quick Start

1. **Build the package**: `catkin build quest3_webxr_ros1`
2. **Generate certificates**: `./generate_ssl_cert.sh`
3. **Start the server**: `roslaunch quest3_webxr_ros1 quest3.launch`
4. **Ensure your Quest 3 is in developer mode**: [Meta Developers Device Setup](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)
5. **Open Quest 3 browser**: Navigate to `https://YOUR_IP:8443/quest3_webxr.html`
6. **Enter VR**: Click "Start VR" and start controlling!

### Usage

#### 1. SSL Certificates

The package includes development SSL certificates that are ready to use. To regenerate:

```bash
# Generate new self-signed certificates for development
./generate_ssl_cert.sh
```

**Note**: For production use, replace with proper certificates from a Certificate Authority.

#### 2. Start the WebXR Server

```bash
# Using launch file (recommended)
roslaunch quest3_webxr_ros1 quest3.launch

# Or run directly
rosrun quest3_webxr_ros1 webxr_server.py
```

#### 3. Access the WebXR App

1. Open Meta Quest Browser on your Quest 3
2. Navigate to: `https://YOUR_IP_ADDRESS:8443/quest3_webxr.html`
3. Accept the SSL certificate (click "Advanced" → "Proceed")
4. Click "Start VR" to start the WebXR session

#### 4. Monitor ROS1 Data

```bash
# View published topics
rostopic list | grep quest3

# Monitor headset transform
rostopic echo /quest3/headset/transform

# Monitor controller transforms
rostopic echo /quest3/left_controller/transform
rostopic echo /quest3/right_controller/transform

# Monitor button data
rostopic echo /quest3/left_controller/buttons
rostopic echo /quest3/right_controller/buttons

# View TF tree
rosrun tf view_frames
```

### Quest 3 Controller Mapping

#### Buttons (sensor_msgs/Joy)
- `buttons[0]` - Trigger (index finger)
- `buttons[1]` - Grip button
- `buttons[2]` - Menu button
- `buttons[3]` - Thumbstick click
- `buttons[4]` - A button (right controller) / X button (left controller)
- `buttons[5]` - B button (right controller) / Y button (left controller)

#### Axes (sensor_msgs/Joy)
- `axes[0]` - Thumbstick X axis (-1.0 to 1.0)
- `axes[1]` - Thumbstick Y axis (-1.0 to 1.0)

### Configuration

#### Launch Parameters

```bash
roslaunch quest3_webxr_ros1 quest3.launch \
    host:=0.0.0.0 \
    http_port:=8443 \
    ws_port:=8080 \
    wss_port:=8444
```

#### Network Configuration

- **HTTP Port**: 8443 (HTTPS for WebXR app)
- **WebSocket Port**: 8080 (WS for communication)
- **Secure WebSocket Port**: 8444 (WSS for production)

### Troubleshooting

#### WebXR Not Supported
- Ensure you're using Meta Quest Browser
- Try accessing via HTTPS (required for WebXR)

#### Connection Issues
- Verify the IP address and port in the browser (use local IP, not 0.0.0.0)
- Check firewall settings
- Ensure Quest 3 and PC are on the same WiFi network
- Ensure SSL certificates are properly generated

#### No Controller Data
- Make sure controllers are powered on and paired
- Verify WebSocket connection is established
- Click "Start VR" to activate the WebXR session

#### Button Topics Not Updating
- Check that you're pressing buttons while in VR mode
- Verify the WebXR session is active
- Monitor server logs for any error messages

#### TF Frames Not Appearing
- Check that the WebXR session is active
- Run `rosrun tf view_frames` to check TF tree

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with Quest 3
5. Submit a pull request

### Support

For issues and questions:
1. Check the troubleshooting section
2. Review the server logs: `tail -f ~/.ros/log/*/quest3_webxr_server-1.log`
3. Open an issue with detailed information about your setup

---
