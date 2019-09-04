package com.instantmessage;

import android.util.Log;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.instantmessage.util.EquipmentInfoUtil;

import java.io.File;
import java.io.IOException;
import java.util.List;

public class NetworkModule extends ReactContextBaseJavaModule {

    static final String _ip = "ping -c 1 -i 0.2 -w 1 ";
    static final String TAG = NetworkModule.class.getName() + " pid::" + android.os.Process.myPid();
    ReactApplicationContext rc;
    public NetworkModule(ReactApplicationContext reactContext) {
        super(reactContext);
        rc=reactContext;
    }

    @Override
    public String getName() {
        return "JudgeNetwork";
    }

    /**
     * judgeNetwork 判断手机有没有网
     * @return
     */
    @ReactMethod
    public void judgeNetwork(String ip,Callback ok){
//        Log.i(TAG,"++++++++++++++++++++++检测网络开始+++++++++++++++++++++++++++");
        try {
            Process p  = Runtime.getRuntime().exec(_ip+ip);
            int status = p.waitFor();
//            Log.i(TAG,"++++++++++++++++++++++检测网络结果+++++++++++++++++++++++++++status："+status);
            if (status == 0) {
//                Log.i(TAG," 检测网络 拼 ip::"+_ip+ip+" 成功");
                ok.invoke("true");
            }else{
                Log.i(TAG," 检测网络 拼 ip::"+_ip+ip+" 失败");
                ok.invoke("false");
            }
        } catch (Exception e) {
            Log.e(TAG,"ping ip 报错：："+e.getStackTrace());
            e.printStackTrace();
        }
    }

}
