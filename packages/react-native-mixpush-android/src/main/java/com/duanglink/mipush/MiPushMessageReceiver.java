package com.duanglink.mipush;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.support.v4.app.NotificationCompat;
import android.util.Log;
import com.duanglink.huaweipush.HuaweiPushActivity;
import com.duanglink.huaweipush.HuaweiPushMessageReceiver;
import com.duanglink.rnmixpush.MixPushMoudle;
import com.xiaomi.mipush.sdk.ErrorCode;
import com.xiaomi.mipush.sdk.MiPushClient;
import com.xiaomi.mipush.sdk.MiPushCommandMessage;
import com.xiaomi.mipush.sdk.MiPushMessage;
import com.xiaomi.mipush.sdk.PushMessageReceiver;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by wangheng on 2017/11/22.
 */
public class MiPushMessageReceiver extends PushMessageReceiver {
    private static final String TAG = "MiPushMessageReceiver";
    private String mRegId;
    private long mResultCode = -1;
    private String mReason;
    private String mCommand;
    private String mMessage;
    private String mTopic;
    private String mAlias;
    private String mUserAccount;
    private String mStartTime;
    private String mEndTime;

    @Override
    public void onReceivePassThroughMessage(Context context, MiPushMessage message) {
        mMessage = message.getContent();
        Log.i(TAG, "收到透传消息： " + mMessage);
//        MixPushMoudle.sendEvent(MixPushMoudle.EVENT_TYPE_PAYLOAD, mMessage);

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
                    .setContentTitle(message.getTitle())
                    .setContentText(mMessage)
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

    }

    @Override
    public void onNotificationMessageClicked(Context context, MiPushMessage message) {
        mMessage = message.getContent();
        try {
            final String extra = mapToJsonString(message.getExtra());
            //JSONObject.
            Log.i(TAG, "点击通知栏消息： " + mMessage + ",透传消息：" + extra);
            //启动应用
            Intent launchIntent = context.getPackageManager().
                    getLaunchIntentForPackage(context.getPackageName());
            launchIntent.setFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            context.startActivity(launchIntent);
            //发送事件
            //MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_REMOTE_NOTIFICATION, mMessage);
            //todo
            //延时1秒再发送事件 等待app初始化完成 1s这个事件待定
            TimerTask task = new TimerTask() {
                @Override
                public void run() {
                    MixPushMoudle.sendEvent(MixPushMoudle.EVENT_RECEIVE_REMOTE_NOTIFICATION, extra);
                }
            };
            Timer timer = new Timer();
            timer.schedule(task, 1000);

        } catch (JSONException e) {

        }
    }

    @Override
    public void onNotificationMessageArrived(Context context, MiPushMessage message) {
        mMessage = message.getContent();
        Log.i(TAG, "收到通知栏消息： " + mMessage);
    }

    @Override
    public void onCommandResult(Context context, MiPushCommandMessage message) {
        String command = message.getCommand();
        List<String> arguments = message.getCommandArguments();
        String cmdArg1 = ((arguments != null && arguments.size() > 0) ? arguments.get(0) : null);
        String cmdArg2 = ((arguments != null && arguments.size() > 1) ? arguments.get(1) : null);
        if (MiPushClient.COMMAND_REGISTER.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mRegId = cmdArg1;
            }
        } else if (MiPushClient.COMMAND_SET_ALIAS.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mAlias = cmdArg1;
            }
        } else if (MiPushClient.COMMAND_UNSET_ALIAS.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mAlias = cmdArg1;
            }
        } else if (MiPushClient.COMMAND_SUBSCRIBE_TOPIC.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mTopic = cmdArg1;
            }
        } else if (MiPushClient.COMMAND_UNSUBSCRIBE_TOPIC.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mTopic = cmdArg1;
            }
        } else if (MiPushClient.COMMAND_SET_ACCEPT_TIME.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mStartTime = cmdArg1;
                mEndTime = cmdArg2;
            }
        }
    }

    @Override
    public void onReceiveRegisterResult(Context context, MiPushCommandMessage message) {
        String command = message.getCommand();
        List<String> arguments = message.getCommandArguments();
        String cmdArg1 = ((arguments != null && arguments.size() > 0) ? arguments.get(0) : null);
        String cmdArg2 = ((arguments != null && arguments.size() > 1) ? arguments.get(1) : null);
        if (MiPushClient.COMMAND_REGISTER.equals(command)) {
            if (message.getResultCode() == ErrorCode.SUCCESS) {
                mRegId = cmdArg1;
                Log.i(TAG, "得到RegId： " + mRegId);

                final String stoken = mRegId;
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
                timer.schedule(task, 30000);


            }
        }
    }

    private String mapToJsonString(Map<String, String> map) throws JSONException {
        JSONObject info = new JSONObject();
        for (Map.Entry<String, String> entry : map.entrySet()) {
            info.put(entry.getKey(), entry.getValue());
        }
        return info.toString();
    }
}
