# 项目目录结构说明

```
--src/modules-项目模块文件夹，按模块规划建立子文件夹，按每个模块划分项的state,reducer和action,如登录授权模块为auth。
__|src/modules/auth-登录授权模块。
--src/resource-整个项目资源文件，多为图片。
--src/actionTypes.js-整个项目操作定义。
--src/appState.js-整个项目状态统一管理。
--src/appStore.js-state中间件。
--src/appReducer.js-整个项目reducer 统一管理。
--src/appRoot.js-项目路由管理。
```

# 配置yarn monorepo项目管理步骤

## 1、开启yarn workspaces配置

```
mobile_im_pure> yarn config set workspaces-experimental true
```

## 2、设置关联

```
mobile_im_pure> yarn install
```

执行yarn install后，yarn会自动将packages下的module与node_module建立关联

## 3、更新并生成bundle文件

```
android：
react-native bundle --platform android --entry-file indexPage.js --bundle-output ./bundles/index.android.bundle ./android/app/src/main/assets/ --dev false

ios：
react-native bundle --platform ios --entry-file indexPage.js --bundle-output ./bundles/index.ios.bundle --dev false
```

更新静态增量（bundle文件）


## 4、CodePush

```
登录Token: e1f3b96fd6a5f94999d36f7f7a43551ff93f1fa8
```

### 账户相关
```
code-push login 登陆
code-push logout 注销
code-push access-key ls 列出登陆的token
code-push access-key rm <accessKye> 删除某个 access-key
```

### app操作相关
```
code-push app add <appName> <platform> react-native  在账号里面添加一个新的app
code-push app remove 或者 rm 在账号里移除一个 app
code-push app rename 重命名一个存在 app
code-push app list 或则 ls 列出账号下面的所有 app
code-push app transfer 把app的所有权转移到另外一个账号
```

### 应用信息相关
```
code-push deployment add mobile_im_pure_android 部署
code-push deployment rm mobile_im_pure_android 删除部署
code-push deployment rename mobile_im_pure_android 重命名
code-push deployment ls mobile_im_pure_android 列出应用的部署情况
code-push deployment ls mobile_im_pure_android -k 查看部署的key
code-push deployment history mobile_im_pure_android <deploymentName> 查看历史版本
```

### 发布
```
code-push release-react <appName> <OS> <updateContents> <deploymentNmae> <description> <disabled> <mandatory>
<appName> //必须 app名称
<OS> //必须 发布平台iOS/Android
<updateContents> //非必须 Bundle文件所在目录
<targetBinaryVersion> //非必须 需要热更的app 版本
<deploymentNmae> //必须 需要发布的部署
<description> //非必须 描述 (更新客户端不可见必须有"hide"  eg: --description "hide xxxx")
<disabled> //非必须 该版本客户端是否可以获得更新,默认为false
<mandatory> //非必须  如果有则表示app强制更新

android:
code-push release-react mobile_im_pure_android android -t 1.0.0 -o ./bundles/index.android.bundle -s ./android/app/src/main/assets/ --dev false
code-push release mobile_im_pure_android ./bundles/index.android.bundle 1.0.0 --deploymentName Staging --description "第四次更新"
ios:
code-push release-react mobile_im_pure_ios ios -t 1.0.0 -o ./bundles --dev false
```

### 清除历史部署记录
```
code-push deployment clear mobile_im_pure_android Production or Staging
```

### 回滚
```
code-push rollback mobile_im_pure_android Production --targetRelease v4(codepush服务部署的版本号)
```

### 促进更新
```
code-push promote MyApp Staging Production
"MyApp" 中"Staging" 部署的最新更新发布到"Production" 部署中
```