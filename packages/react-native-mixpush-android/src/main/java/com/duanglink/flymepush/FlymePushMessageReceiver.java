package com.duanglink.flymepush;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.duanglink.huaweipush.HuaweiPushActivity;
import com.duanglink.rnmixpush.MixPushMoudle;
import com.meizu.cloud.pushinternal.DebugLogger;
import com.meizu.cloud.pushsdk.MzPushMessageReceiver;
import com.meizu.cloud.pushsdk.notification.PushNotificationBuilder;
import com.meizu.cloud.pushsdk.platform.message.PushSwitchStatus;
import com.meizu.cloud.pushsdk.platform.message.RegisterStatus;
import com.meizu.cloud.pushsdk.platform.message.SubAliasStatus;
import com.meizu.cloud.pushsdk.platform.message.SubTagsStatus;
import com.meizu.cloud.pushsdk.platform.message.UnRegisterStatus;
import org.json.JSONObject;

import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by wangheng on 2017/11/22.
 */
public class FlymePushMessageReceiver extends MzPushMessageReceiver {
    private static final String TAG = "MeizuPushMsgReceiver";
    private int mipush_notification;
    private int mipush_small_notification;

    @Override
    @Deprecated
    public void onRegister(Context context, String pushid) {
        final String stoken = pushid;
        Log.i(TAG, "得到pushId： " + stoken);
        Log.i(TAG, "得到MixPushMoudle为:" + MixPushMoudle.class.getName());

        TimerTask task = new TimerTask() {
            @Override
            public void run() {
                Log.i(TAG, "得到MixPushMoudle为:" + MixPushMoudle.class.getName());
                if (null != MixPushMoudle.class) {
                    MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_CLIENTID, stoken);
                } else {
                    Log.i(TAG, "没有取到MixPushMoudle");
                }

            }
        };
        Timer timer = new Timer();
        timer.schedule(task, 60000);
        //应用在接受返回的pushid
    }

    @Override
    public void onHandleIntent(Context context, Intent intent) {
        mipush_notification = context.getResources().getIdentifier("mipush_notification", "drawable", context.getPackageName());
        mipush_small_notification = context.getResources().getIdentifier("mipush_small_notification", "drawable", context.getPackageName());
        super.onHandleIntent(context, intent);
    }

    @Override
    public void onMessage(Context context, String s) {
        Log.i(TAG, "收到透传消息： " + s);
        //接收服务器推送的透传消息
        MixPushMoudle.sendEvent(MixPushMoudle.EVENT_TYPE_PAYLOAD, s);
        try {
            JSONObject tmpMsg = new JSONObject(s);
            if ("background".equals(HuaweiPushActivity.APPStatus)) {
                Log.i(TAG, "后台:" + HuaweiPushActivity.APPStatus);

                //显示不重复通知
                int requestCode = (int) System.currentTimeMillis();

                Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                PendingIntent pendingIntent = PendingIntent.
                        getActivity(context, requestCode, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT);

                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                Notification.Builder builder = new Notification.Builder(context);
                builder.setWhen(System.currentTimeMillis())
                        .setContentTitle(tmpMsg.getString("title"))
                        .setContentText(tmpMsg.getString("content"))
                        .setDefaults(Notification.DEFAULT_LIGHTS)
                        //.setVibrate(new long[]{0, 300, 300, 300})
                        //设置点击通知跳转页面后，通知消失
                        .setAutoCancel(true)
                        .setContentIntent(pendingIntent)
                        .setDefaults(Notification.DEFAULT_SOUND);
                //获取app工程中的图片资源
                int logoId = context.getResources().getIdentifier("ic_launcher", "mipmap", context.getPackageName());
                builder.setSmallIcon(logoId);

                manager.notify(requestCode, builder.build());
            }else{
                Log.i(TAG, "前台:" + HuaweiPushActivity.APPStatus);
            }
        }catch (Exception e){
            Log.i("转JSON异常", e.getMessage());
        }
    }

    @Override
    @Deprecated
    public void onUnRegister(Context context, boolean b) {
        //调用PushManager.unRegister(context）方法后，会在此回调反注册状态
    }

    //设置通知栏小图标
    @Override
    public void onUpdateNotificationBuilder(PushNotificationBuilder pushNotificationBuilder) {
        if (mipush_notification > 0){
            pushNotificationBuilder.setmLargIcon(mipush_notification);
            Log.d(TAG,"设置通知栏大图标");
        }else {
            Log.e(TAG,"缺少drawable/mipush_notification.png");
        }
        if (mipush_small_notification > 0){
            pushNotificationBuilder.setmStatusbarIcon(mipush_small_notification);
            Log.d(TAG,"设置通知栏小图标");
            Log.e(TAG,"缺少drawable/mipush_small_notification.png");
        }
    }

    @Override
    public void onPushStatus(Context context,PushSwitchStatus pushSwitchStatus) {
        //检查通知栏和透传消息开关状态回调
    }

    @Override
    public void onRegisterStatus(Context context,RegisterStatus registerStatus) {
        //新版订阅回调
        final String pushId= registerStatus.getPushId();
        Log.i(TAG, "得到pushId：" + pushId);
        Log.i(TAG, "得到MixPushMoudle为:" + MixPushMoudle.class.getName());

        TimerTask task = new TimerTask() {
            @Override
            public void run() {
                Log.i(TAG, "得到MixPushMoudle为:" + MixPushMoudle.class.getName());
                if (null != MixPushMoudle.class) {
                    MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_CLIENTID, pushId);
                } else {
                    Log.i(TAG, "没有取到MixPushMoudle");
                }

            }
        };
        Timer timer = new Timer();
        timer.schedule(task, 30000);
        //应用在接受返回的pushid

    }

    @Override
    public void onUnRegisterStatus(Context context,UnRegisterStatus unRegisterStatus) {
        Log.i(TAG,"onUnRegisterStatus "+unRegisterStatus);
        //新版反订阅回调
    }

    @Override
    public void onSubTagsStatus(Context context,SubTagsStatus subTagsStatus) {
        Log.i(TAG, "onSubTagsStatus " + subTagsStatus);
        //标签回调
    }

    @Override
    public void onSubAliasStatus(Context context,SubAliasStatus subAliasStatus) {
        Log.i(TAG, "onSubAliasStatus " + subAliasStatus);
        //别名回调
    }
    @Override
    public void onNotificationArrived(Context context, String title, String content, String selfDefineContentString) {
        //通知栏消息到达回调，flyme6基于android6.0以上不再回调
        DebugLogger.i(TAG,"onNotificationArrived title "+title + "content "+content + " selfDefineContentString "+selfDefineContentString);
    }

    @Override
    public void onNotificationClicked(Context context, String title, String content, String selfDefineContentString) {
        //通知栏消息点击回调
        Log.i(TAG, "点击通知栏消息："+content+",自定义消息："+selfDefineContentString);
        //MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_REMOTE_NOTIFICATION, selfDefineContentString);
        final  String msg=selfDefineContentString;
        TimerTask task = new TimerTask() {
            @Override
            public void run() {
            MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_REMOTE_NOTIFICATION, msg);
            }
        };
        Timer timer = new Timer();
        timer.schedule(task, 1000);
    }

    @Override
    public void onNotificationDeleted(Context context, String title, String content, String selfDefineContentString) {
        //通知栏消息删除回调；flyme6基于android6.0以上不再回调
        DebugLogger.i(TAG,"onNotificationDeleted title "+title + "content "+content + " selfDefineContentString "+selfDefineContentString);
    }
}
