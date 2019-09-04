package com.duanglink.huaweipush;
import android.annotation.TargetApi;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

import com.duanglink.flymepush.FlymePushManager;
import com.duanglink.getui.GeTuiManager;
import com.duanglink.mipush.MiPushManager;
import com.duanglink.rnmixpush.MixPushMoudle;
import com.facebook.react.ReactActivity;
import com.huawei.hms.api.ConnectionResult;
import com.huawei.hms.api.HuaweiApiAvailability;
import com.huawei.hms.api.HuaweiApiClient;
import com.huawei.hms.support.api.client.PendingResult;
import com.huawei.hms.support.api.client.ResultCallback;
import com.huawei.hms.support.api.push.HuaweiPush;
import com.huawei.hms.support.api.push.PushException;
import com.huawei.hms.support.api.push.TokenResult;

/**
 * Created by wangheng on 2017/11/27.
 */
public class HuaweiPushActivity extends ReactActivity implements HuaweiApiClient.ConnectionCallbacks, HuaweiApiClient.OnConnectionFailedListener {
    public static final String TAG = "HuaweiPushActivity";
    public static String APPStatus = "background";
    //华为移动服务Client
    private HuaweiApiClient client;
    private static final int REQUEST_HMS_RESOLVE_ERROR = 1000;
    public static NotificationManager notificationManager;

    @TargetApi(Build.VERSION_CODES.O)
    private void createNotificationChannel(String channelId, String channelName, int importance) {

        if(Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O){
            NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);

            if (notificationManager != null)
                notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.e(TAG,"创建通知渠道");
            createNotificationChannel(HuaweiPushMessageReceiver.CHANNEL_ID, HuaweiPushMessageReceiver.CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
        }

        String brand= Build.BRAND.toLowerCase();
        //手机型号接入判断
        Log.i(TAG, "手机型号："+brand);
        switch (brand){
            case "huawei":
                MixPushMoudle.pushManager=new HuaweiPushManager("","");
                //连接回调以及连接失败监听
                client = new HuaweiApiClient.Builder(this)
                        .addApi(HuaweiPush.PUSH_API)
                        .addConnectionCallbacks(this)
                        .addOnConnectionFailedListener(this)
                        .build();
                client.connect();
                break;
            case "honor":
                MixPushMoudle.pushManager=new HuaweiPushManager("","");
                //连接回调以及连接失败监听
                client = new HuaweiApiClient.Builder(this)
                        .addApi(HuaweiPush.PUSH_API)
                        .addConnectionCallbacks(this)
                        .addOnConnectionFailedListener(this)
                        .build();
                client.connect();
                break;
            case "xiaomi":
                MiPushManager mipush=new MiPushManager(savedInstanceState.getString("xiaomiAppId"),savedInstanceState.getString("xiaomiAppKey"));
                MixPushMoudle.pushManager=mipush;
                mipush.registerPush(this.getApplicationContext());
                break;
            case "meizu":
                FlymePushManager meizupush=new FlymePushManager(savedInstanceState.getString("meizuAppId"),savedInstanceState.getString("meizuAppKey"));
                MixPushMoudle.pushManager=meizupush;
                meizupush.registerPush(this.getApplicationContext());
                break;
            default:
                GeTuiManager getui=new GeTuiManager();
                MixPushMoudle.pushManager=getui;
                getui.registerPush(this.getApplicationContext());
                break;
        }
    }

    @Override
    protected String getMainComponentName() {
        return "mixpush";
    }

    @Override
    public void onConnected() {
        //华为移动服务client连接成功，在这边处理业务自己的事件
        Log.i(TAG, "HuaweiApiClient 连接成功");
        getTokenAsyn();
    }

    @Override
    public void onConnectionSuspended(int arg0) {
        //HuaweiApiClient异常断开连接
        //if (!this.isDestroyed() && !this.isFinishing()) {
        if (!this.isFinishing()) {
            client.connect();
        }
        Log.i(TAG, "HuaweiApiClient 连接断开");
    }

    @Override
    public void onConnectionFailed(ConnectionResult arg0) {
        Log.i(TAG, "HuaweiApiClient连接失败，错误码：" + arg0.getErrorCode());
        if(HuaweiApiAvailability.getInstance().isUserResolvableError(arg0.getErrorCode())) {
            HuaweiApiAvailability.getInstance().resolveError(this, arg0.getErrorCode(), REQUEST_HMS_RESOLVE_ERROR);
        } else {
            //其他错误码请参见开发指南或者API文档
        }
    }

    //Activity创建或者从后台重新回到前台时被调用
    @Override
    protected void onStart() {
        super.onStart();
        APPStatus = "front";
    }

    //Activity从后台重新回到前台时被调用
    @Override
    protected void onRestart() {
        super.onRestart();
        APPStatus = "front";
    }

    //Activity创建或者从被覆盖、后台重新回到前台时被调用
    @Override
    protected void onResume() {
        super.onResume();
        APPStatus = "front";
    }

    //Activity窗口获得或失去焦点时被调用,在onResume之后或onPause之后
    /*@Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        Log.i(TAG, "onWindowFocusChanged called.");
    }*/

    //Activity被覆盖到下面或者锁屏时被调用
    @Override
    protected void onPause() {
        super.onPause();
        APPStatus = "background";
        //有可能在执行完onPause或onStop后,系统资源紧张将Activity杀死,所以有必要在此保存持久数据
        Log.i(TAG, "进程onPause");
    }

    //退出当前Activity或者跳转到新Activity时被调用
    @Override
    protected void onStop() {
        super.onStop();
        APPStatus = "background";
        Log.i(TAG, "进程onStop");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "进程被干掉");
        //建议在onDestroy的时候停止连接华为移动服务
        //业务可以根据自己业务的形态来确定client的连接和断开的时机，但是确保connect和disconnect必须成对出现
        if(client!=null)client.disconnect();
    }

    private void getTokenAsyn() {
        PendingResult<TokenResult> tokenResult = HuaweiPush.HuaweiPushApi.getToken(client);
        tokenResult.setResultCallback(new ResultCallback<TokenResult>() {
            @Override
            public void onResult(TokenResult result) {
                if(result.getTokenRes().getRetCode() == 0) {
                    Log.i(TAG, "获取Token成功");
                }
                else{
                    Log.i(TAG, "获取Token失败");
                }
            }
        });
    }

    private void deleteToken(String token) {
        Log.i(TAG, "删除Token：" + token);
        if (!TextUtils.isEmpty(token)) {
            try {
                HuaweiPush.HuaweiPushApi.deleteToken(client, token);
            } catch (PushException e) {
                Log.i(TAG, "删除Token失败:" + e.getMessage());
            }
        }
    }

    private void getPushStatus() {
        Log.i(TAG, "开始获取PUSH连接状态");
        new Thread() {
            public void run() {
                HuaweiPush.HuaweiPushApi.getPushState(client);
            };
        }.start();
    }
}
