import { PermissionsAndroid } from 'react-native';

/**
 * 检查Android权限
 * @param permissions
 * @param callback
 * @returns {Promise.<void>}
 * @private
 */
_checkAndroidPermission = async (permissions,callback) => {
    // console.log("Permission==========2");
    // console.log(permissions);
    if(typeof permissions == "string"){
        // console.log("Permission==========3");
        switch(permissions){
            case PermissionsAndroid.PERMISSIONS.CAMERA:
                let resultCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
                if(resultCamera){
                    callback(true);
                }else{
                    callback(false);
                }
                break;
            case PermissionsAndroid.PERMISSIONS.RECORD_AUDIO:
                let resultAudio = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if(resultAudio){
                    callback(true);
                }else{
                    callback(false);
                }
                break;
            case PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE:
                let resultRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                if(resultRead){
                    callback(true);
                }else{
                    callback(false);
                }
                break;
            case PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE:
                let resultWrite = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
                if(resultWrite){
                    callback(true);
                }else{
                    callback(false);
                }
                break;
            case PermissionsAndroid.PERMISSIONS.CALL_PHONE:
                let resultCallPhone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
                if(resultCallPhone){
                    callback(true);
                }else{
                    callback(false);
                }
                break;
            default:
                callback("Unknown Permission");//参数异常或者未处理的权限
        }
    }else if(permissions instanceof Array){
        // console.log("Permission==========4");
        let checkResult = {};
        let len = permissions.length;
        // console.log("len:"+len);
        for(let i = 0; i < len; i++) {
            switch(permissions[i]){
                case PermissionsAndroid.PERMISSIONS.CAMERA://相机权限
                    // console.log("Permission==========camera");
                    let resultCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
                    if (resultCamera){
                        checkResult[PermissionsAndroid.PERMISSIONS.CAMERA] = true;
                    }else{
                        checkResult[PermissionsAndroid.PERMISSIONS.CAMERA] = false;
                    }
                    break;
                case PermissionsAndroid.PERMISSIONS.RECORD_AUDIO://话筒权限
                    // console.log("Permission==========audio");
                    let resultAudio = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                    if (resultAudio){
                        checkResult[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] = true;
                    }else{
                        checkResult[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] = false;
                    }
                    break;
                case PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE://读文件权限
                    // console.log("Permission==========read");
                    let resultRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                    if (resultRead){
                        checkResult[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] = true;
                    }else{
                        checkResult[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] = false;
                    }
                    break;
                case PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE://写文件权限
                    // console.log("Permission==========write");
                    let resultWrite = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
                    if (resultWrite){
                        checkResult[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] = true;
                    }else{
                        checkResult[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] = false;
                    }
                    break;
                case PermissionsAndroid.PERMISSIONS.CALL_PHONE://电话权限
                    // console.log("Permission==========write");
                    let resultCallPhone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
                    if (resultCallPhone){
                        checkResult[PermissionsAndroid.PERMISSIONS.CALL_PHONE] = true;
                    }else{
                        checkResult[PermissionsAndroid.PERMISSIONS.CALL_PHONE] = false;
                    }
                    break;
                default:
                    // console.log("Permission==========default");
                    checkResult[permissions[i]] = "Unknown Permission";//数组参数异常或者存在方法未处理的权限
            }
        }
        // console.log("Permission==========checkResult");
        // console.log(checkResult);
        callback(checkResult);
    }else{
        // console.log("Permission==========unsupported parameter type");
        callback("unsupported parameter type");
    }
}

/**
 * 获取Android权限
 * @param permissions
 * @param callback
 * @returns {Promise.<void>}
 * @private
 */
_requestAndroidPermission = async (permissions,callback) =>{
    _checkAndroidPermission(permissions,(value)=>{
        // console.log(value);
        if(typeof value == "boolean" && value){
            callback(true);
        }else if(typeof value == "boolean" && !value){
            _requestPermission([permissions],(peams)=>{
                for (let key in peams) {
                    peams[key]?callback(true):callback(false);
                }
            });
        }else if(typeof value == "object"){
            let result = {};
            let refuseResult = [];
            let len = Object.keys(value).length;
            let num = 0;
            let isRequest = false;
            for (let key in value) {
                num++;
                if(typeof value[key] == "string"){
                    result[key] = value[key];
                }else{
                    // console.log(value[key]);
                    value[key]?result[key]=true:refuseResult.push(key);
                }
                if(num == len){
                    isRequest = true;
                }
            }
            // console.log(isRequest);
            if(isRequest){
                // console.log(refuseResult);
                if(refuseResult.length==0){
                    callback(result);
                }else{
                    _requestPermission(refuseResult,(peams)=>{
                        // console.log(peams);
                        for (let k in result) {
                            peams[k] = result[k];
                        }
                        callback(peams);
                    });
                }
            }
        }else{
            callback(value);
        }
    })
}

_requestPermission = async (permissions,callback) =>{
    let len = Object.keys(permissions).length;
    if(len>0){
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        let requestResult = {};
        for(let i = 0; i < len; i++) {
            requestResult[permissions[i]] = (granted[permissions[i]] == PermissionsAndroid.RESULTS.GRANTED?true:false);
        }
        callback(requestResult);
    }
}

export default PermissionsUtil = {
    Permissions : {
        "camera":PermissionsAndroid.PERMISSIONS.CAMERA,
        "write":PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        "read":PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        "audio":PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        "phone":PermissionsAndroid.PERMISSIONS.CALL_PHONE
    },
    checkAndroidPermission(permissions,callback){
        _checkAndroidPermission(permissions,callback);
    },
    requestAndroidPermission(permissions,callback){
        _requestAndroidPermission(permissions,callback)
    }
}
