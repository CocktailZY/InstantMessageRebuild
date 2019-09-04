package com.duanglink.huaweipush;

import android.app.*;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.util.Log;
import android.widget.Toast;

import com.duanglink.rn_mixpush_android.R;
import com.duanglink.rnmixpush.MixPushMoudle;
import com.huawei.hms.support.api.push.PushReceiver;
import com.igexin.sdk.PushManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.annotation.Target;
import java.lang.reflect.Array;
import java.util.Iterator;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import android.annotation.TargetApi;
import android.app.NotificationChannel;

/**
 * Created by wangheng on 2017/11/22.
 */
public class HuaweiPushMessageReceiver extends PushReceiver {
    public static final String TAG = "HuaweiPushRevicer";

    public static final String ACTION_UPDATEUI = "action.updateUI";
    public static final String CHANNEL_ID = "im_chat";
    public static final String CHANNEL_NAME = "聊天消息";
    public static final String CHANNEL_DESCRIPTION = "聊天内容通知";
    public static NotificationManager notificationManager;

    @TargetApi(Build.VERSION_CODES.O)
    private void createNotificationChannel(String channelId, String channelName, int importance) {
        Log.i(TAG, "createNotificationChannel为:" + channelId+","+ channelName+","+ importance);

        if(Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O){
            NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);

            if (notificationManager != null)
                notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onToken(Context context, String token, Bundle extras) {
        Log.i(TAG, "得到Token为:" + token);
        //Toast.makeText(context, "Token为:" + token, Toast.LENGTH_SHORT).show();
        //MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_CLIENTID, token);
        //延时1秒后再发送事件，防止RN客户端还未初始化完成时在注册前就发送了事件
        final String stoken = token;
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
        timer.schedule(task, 10000);
    }

    @TargetApi(Build.VERSION_CODES.O)
    @Override
    public boolean onPushMsg(Context context, byte[] msg, Bundle bundle) {
        try {
            //CP可以自己解析消息内容，然后做相应的处理
            String content = new String(msg, "UTF-8");
            Log.i(TAG, "收到PUSH透传消息,消息内容为:" + content);
            JSONObject tmpMsg = new JSONObject(content);
//            MixPushMoudle.sendEvent(MixPushMoudle.EVENT_TYPE_PAYLOAD, content);

            if ("background".equals(HuaweiPushActivity.APPStatus)) {
                Log.i(TAG, "后台:" + HuaweiPushActivity.APPStatus);

                //显示不重复通知
                int requestCode = (int) System.currentTimeMillis();
                Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                PendingIntent pendingIntent = PendingIntent.
                    getActivity(context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT);
                notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                createNotificationChannel(CHANNEL_ID,CHANNEL_NAME,NotificationManager.IMPORTANCE_HIGH);
                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID);
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
                int logoId = context.getResources().getIdentifier("ic_launcher", "mipmap", context.getPackageName());
                builder.setSmallIcon(logoId, 10);

                notificationManager.notify(requestCode, builder.build());
            } else {
                Log.i(TAG, "前台:" + HuaweiPushActivity.APPStatus);

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public void onEvent(Context context, Event event, Bundle extras) {
        Log.i(TAG, "收到通知栏消息点击事件:" + event);
        if (Event.NOTIFICATION_OPENED.equals(event) || Event.NOTIFICATION_CLICK_BTN.equals(event)) {
            String message = extras.getString(BOUND_KEY.pushMsgKey);
            final String content = parseMessage(message);
            int notifyId = extras.getInt(BOUND_KEY.pushNotifyId, 0);
            Log.i(TAG, "收到通知栏消息点击事件,notifyId:" + notifyId + ",message:" + content);
            TimerTask task = new TimerTask() {
                @Override
                public void run() {
                    MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_REMOTE_NOTIFICATION, content);
                }
            };
            Timer timer = new Timer();
            timer.schedule(task, 1000);

            if (0 != notifyId) {
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                manager.cancel(notifyId);
            }
        }
        super.onEvent(context, event, extras);
    }

    @Override
    public void onPushState(Context context, boolean pushState) {
        Log.i(TAG, "Push连接状态为:" + pushState);
        //Toast.makeText(context, "Push连接状态为:" + pushState, Toast.LENGTH_SHORT).show();
        Intent intent = new Intent();
        intent.setAction(ACTION_UPDATEUI);
        intent.putExtra("type", 2);
        intent.putExtra("pushState", pushState);
        context.sendBroadcast(intent);
    }

    private String parseMessage(String message) {
        JSONObject info = new JSONObject();
        try {
            JSONArray json = new JSONArray(message);
            if (json.length() > 0) {
                for (int i = 0; i < json.length(); i++) {
                    JSONObject job = json.getJSONObject(i);
                    Iterator<String> sIterator = job.keys();
                    while (sIterator.hasNext()) {
                        String key = sIterator.next();
                        String value = job.getString(key);
                        info.put(key, value);
                    }
                }
            }
        } catch (JSONException e) {

        }
        return info.toString();
    }
}
