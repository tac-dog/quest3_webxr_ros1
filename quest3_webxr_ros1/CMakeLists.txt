cmake_minimum_required(VERSION 3.0.2)
project(quest3_webxr_ros1)

find_package(catkin REQUIRED COMPONENTS
  rospy
  geometry_msgs
  sensor_msgs
  std_msgs
  tf
)

catkin_package(
  CATKIN_DEPENDS rospy geometry_msgs sensor_msgs std_msgs tf
)

catkin_install_python(PROGRAMS
  quest3_webxr_ros1/webxr_server.py
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY launch/
  DESTINATION share/${PROJECT_NAME}
)

install(DIRECTORY webxr_app/
  DESTINATION share/${PROJECT_NAME}
)