package com.duanglink.getui;

import android.annotation.TargetApi;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.support.v4.app.NotificationCompat;
import android.util.Log;
import android.widget.Toast;

import com.duanglink.huaweipush.HuaweiPushActivity;
import com.duanglink.rnmixpush.MixPushMoudle;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.igexin.sdk.GTIntentService;
import com.igexin.sdk.message.GTCmdMessage;
import com.igexin.sdk.message.GTTransmitMessage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import static com.duanglink.huaweipush.HuaweiPushMessageReceiver.CHANNEL_ID;

/**
 * Created by wangheng on 2017/11/22.
 */
public class GeTuiMessageIntentService extends GTIntentService {
    public GeTuiMessageIntentService() {

    }

    @Override
    public void onReceiveServicePid(Context context, int pid) {
    }

    @Override
    protected void onHandleIntent(Intent intent) {
        super.onHandleIntent(intent);
    }

    @TargetApi(Build.VERSION_CODES.O)
    @Override
    public void onReceiveMessageData(Context context, GTTransmitMessage msg) {
        //Toast.makeText(context, "收到消息", Toast.LENGTH_SHORT).show();
        try {
            final String message = new String(msg.getPayload());
            JSONObject tmpMsg = new JSONObject(message);
            final Context tmpContext = context;
            Log.e(TAG, "收到透传消息：" + message);
            //GetuiModule.sendEvent(GetuiModule.EVENT_RECEIVE_REMOTE_NOTIFICATION, param);
            //Toast.makeText(context, "sendEvent",Toast.LENGTH_SHORT).show();
            MixPushMoudle.sendEvent(MixPushMoudle.EVENT_TYPE_PAYLOAD, message);

//            ActivityManager activityManager = (ActivityManager) tmpContext.getSystemService(Context.ACTIVITY_SERVICE);
//            List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
//            for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
//                if (appProcess.processName.equals(tmpContext.getPackageName())) {
            if ("background".equals(HuaweiPushActivity.APPStatus)) {
                Log.i(TAG, "后台:" + HuaweiPushActivity.APPStatus);
                //显示不重复通知
                int requestCode = (int) System.currentTimeMillis();
                Intent launchIntent = tmpContext.getPackageManager().getLaunchIntentForPackage(tmpContext.getPackageName());
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                PendingIntent pendingIntent = PendingIntent.
                        getActivity(tmpContext, requestCode, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT);

//                    NotificationManager manager = (NotificationManager) tmpContext.getSystemService(Context.NOTIFICATION_SERVICE);
                NotificationCompat.Builder builder = new NotificationCompat.Builder(tmpContext, CHANNEL_ID);
                builder.setWhen(System.currentTimeMillis())
                        .setContentTitle(tmpMsg.getString("title"))
                        .setContentText(tmpMsg.getString("content"))
                        //.setVibrate(new long[]{0, 300, 300, 300})
                        //设置点击通知跳转页面后，通知消失
                        .setAutoCancel(true)
                        .setPriority(NotificationManager.IMPORTANCE_HIGH)
                        .setContentIntent(pendingIntent)
                        .setDefaults(Notification.DEFAULT_ALL);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    //悬挂式Notification，5.0后显示
                    builder.setTicker(tmpMsg.getString("title") + "  " + tmpMsg.getString("content"));
//                            builder.setFullScreenIntent(pendingIntentNew, true);
//                            builder.setCategory(NotificationCompat.CATEGORY_MESSAGE);
//                            builder.setVisibility(Notification.VISIBILITY_PUBLIC);
                }
                //获取app工程中的图片资源
                int logoId = tmpContext.getResources().getIdentifier("ic_launcher", "mipmap", tmpContext.getPackageName());
                builder.setSmallIcon(logoId);
                HuaweiPushActivity.notificationManager.notify(requestCode, builder.build());
            } else {
                Log.i(TAG, "前台:" + HuaweiPushActivity.APPStatus);
            }
//                }
//            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        /*
        if (msg.getPayload() == null) {
            Log.e(TAG, "onReceiveMessageData -> " + "payload=null");
            return;
        }
        String data = new String(msg.getPayload());
        Log.e(TAG, "onReceiveMessageData -> " + "payload = " + data);
        try {
            JSONObject jsonObject = new JSONObject(data);

        } catch (JSONException e) {
            e.printStackTrace();
        }*/
    }

    @Override
    public void onReceiveClientId(Context context, String clientid) {
        //Toast.makeText(context,"onReceiveClientId -> " + "clientid = " + clientid, Toast.LENGTH_SHORT).show();
        MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_CLIENTID, clientid);
        Log.e(TAG, "onReceiveClientId -> " + "clientid = " + clientid);
    }

    @Override
    public void onReceiveOnlineState(Context context, boolean online) {

    }

    @Override
    public void onReceiveCommandResult(Context context, GTCmdMessage cmdMessage) {
        Log.e(TAG, "onReceiveCommandResult -> " + "action = " + cmdMessage.getAction());
    }
}
