package com.instantmessage;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import com.duanglink.flymepush.FlymePushManager;
import com.duanglink.getui.GeTuiManager;
import com.duanglink.huaweipush.HuaweiPushManager;
import com.duanglink.mipush.MiPushManager;
import com.duanglink.rnmixpush.MixPushMoudle;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.huawei.hms.api.HuaweiApiClient;
import com.huawei.hms.support.api.push.HuaweiPush;

import java.lang.String;

/**
 * IMModule
 * @author haoxl
 * @date 2018/5/30
 */

public class IMModule extends ReactContextBaseJavaModule {
    public static final String TAG = "IMModule";
    ReactApplicationContext reactContext = null;
    public IMModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "IMModule";
    }

    @ReactMethod
    public void getBrand(Callback callback) {
        String brand= Build.BRAND.toLowerCase();
        String tag;
        Log.i(TAG,"手机品牌");
        switch (brand){
            case "huawei":
                tag = "1";
                break;
            case "honor":
                tag = "1";
                break;
            case "xiaomi":
                tag = "2";
                break;
            case "meizu":
                tag = "5";// 3 苹果
                break;
            default:
                tag = "4";
                break;
        }
        callback.invoke(tag);
    }

    @ReactMethod
    public void call(String phoneNumber,Callback callback){
        try{
            Intent dialIntent =  new Intent(Intent.ACTION_DIAL,Uri.parse("tel:" + phoneNumber));//跳转到拨号界面，同时传递电话号码
            getCurrentActivity().startActivity(dialIntent);
        }catch (Exception e){
            Log.e(TAG,e.getMessage());
            e.printStackTrace();
            callback.invoke(e);
        }
    }
}