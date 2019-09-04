package com.instantmessage;

import android.os.Bundle;
import com.duanglink.huaweipush.HuaweiPushActivity;
import com.facebook.react.ReactActivity;


public class MainActivity extends HuaweiPushActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "InstantMessage";
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        if(savedInstanceState==null){
            savedInstanceState=new Bundle();
        }
        savedInstanceState.putString("meizuAppId","115815");
        savedInstanceState.putString("meizuAppKey","b9d2df23298c41cf8ba126a5ed475ab7");
        savedInstanceState.putString("xiaomiAppId","2882303761517867697");
        savedInstanceState.putString("xiaomiAppKey","5371786731697");
        super.onCreate(savedInstanceState);
    }

}
