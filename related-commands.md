# 即时通讯常用命令

## adb相关

### 查看设备列表和状态

```
InstantMessage> adb devices
List of devices attached
127.0.0.1:62025 device
```

设备的状态有 3 种：

- device：设备正常连接
- offline：连接出现异常，设备无响应
- unknown：没有连接设备  

### 结束adb服务

```
adb kill-server
```

### 启动adb服务

```
adb start-server
```

当从模拟器切换真机调试时，可能会出现真机设备状态为：offline或者unknown，此时需要重启adb服务，即依次执行：adb kill-server、adb start-server、adb devices

### 呼出调试菜单

```
adb shell input keyevent 82
```


## RN相关

### 使用模拟器或真机联机调试运行

```
InstantMessage> react-native run-android
```

### 清除项目缓存  

```
InstantMessage/android> gradlew clean
```

### 生成key  

```
InstantMessage/android> keytool -genkey -v -keystore im.keystore -alias sinosoft -keyalg RSA -keysize 2048 -validity 10000 
```

- im.keystore 为密钥文件名称
- sinosoft 为密钥文件的keyAlias

### 生成realase包  

```
InstantMessage/android> gradlew assembleRelease
```

 生成的release包路径InstantMessage\android\app\build\outputs\apk\release\app-release.apk