package com.rnxmpp.service;

import android.support.annotation.Nullable;

import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;

import org.jivesoftware.smack.packet.*;
import org.jivesoftware.smack.roster.Roster;
import org.jivesoftware.smack.roster.RosterEntry;
import org.jivesoftware.smack.roster.RosterGroup;

import org.json.JSONObject;
import org.json.XML;
import com.rnxmpp.utils.JSONSortUtil;
import com.rnxmpp.utils.Parser;

import java.util.ArrayList;
import java.util.List;

import static android.content.ContentValues.TAG;


/**
 * Created by Kristian Frølund on 7/19/16.
 * Copyright (c) 2016. Teletronics. All rights reserved
 */

public class RNXMPPCommunicationBridge implements XmppServiceListener {

    public static final String RNXMPP_ERROR =       "RNXMPPError";
    public static final String RNXMPP_LOGIN_ERROR = "RNXMPPLoginError";
    public static final String RNXMPP_MESSAGE =     "RNXMPPMessage";
    public static final String RNXMPP_ROSTER =      "RNXMPPRoster";
    public static final String RNXMPP_IQ =          "RNXMPPIQ";
    public static final String RNXMPP_UnparsedIQ =  "RNXMPPUnparsedIQ";
    public static final String RNXMPP_PRESENCE =    "RNXMPPPresence";
    public static final String RNXMPP_CONNECT =     "RNXMPPConnect";
    public static final String RNXMPP_DISCONNECT =  "RNXMPPDisconnect";
    public static final String RNXMPP_LOGIN =       "RNXMPPLogin";
    public static final String RNXMPP_OFFLINEMESSAGE =       "RNXMPPOfflineMessage";

    ReactContext reactContext;

    public RNXMPPCommunicationBridge(ReactContext reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public void onError(Exception e) {
        sendEvent(reactContext, RNXMPP_ERROR, e.getLocalizedMessage());
    }

    @Override
    public void onLoginError(String errorMessage) {
        sendEvent(reactContext, RNXMPP_LOGIN_ERROR, errorMessage);
    }

    @Override
    public void onLoginError(Exception e) {
        onLoginError(e.getLocalizedMessage());
    }

    @Override
    public void onMessage(Message message) {
        /*WritableMap params = Arguments.createMap();
        params.putString("thread", message.getThread());
        params.putString("subject", message.getSubject());
        params.putString("body", message.getBody());
        params.putString("from", message.getFrom());
        params.putString("src", message.toXML().toString());
        sendEvent(reactContext, RNXMPP_MESSAGE, params);*/

        //        WritableMap params = Arguments.createMap();
//        params.putString("thread", message.getThread());
//        params.putString("subject", message.getSubject());
//        params.putString("body", message.getBody());
//        params.putString("from", message.getFrom());
//        params.putString("src", message.toXML().toString());
//        sendEvent(reactContext, RNXMPP_MESSAGE, params);
		    String temp = message.toXML().toString();
		    Log.e(TAG,"messageXML-------------------------");
		    Log.e(TAG,temp);
		    Log.e(TAG,"messageXML new -------------------------");
//        if(message.getExtension("http://jabber.org/protocol/offline") != null){
//          onOfflineMessage(message);
//        }else
        if(temp.indexOf("Offline") != -1){
	        onOfflineMessage(message);
        }else{
            try{
                JSONObject obj = XML.toJSONObject(temp);
                Log.e(TAG,"message-------------------------");
                Log.e(TAG,obj.toString());
                WritableMap params = Arguments.createMap();
                params.putString("thread", message.getThread());
                params.putString("subject", message.getSubject());
                params.putString("from", message.getFrom());
                params.putString("src", message.toXML().toString());
                if(message.getExtensions().size() > 0){
                    params.putString("extenEl", XML.toJSONObject(message.getExtensions().get(0).toXML().toString()).toString());
                }
                obj=obj.getJSONObject("message");
                if(obj.has("sent")){
                    Log.e(TAG,"进sent-------------------------");
                    if(obj.getJSONObject("sent").has("forwarded")){
                        Log.e(TAG,"进forwarded-------------------------");
                        //包含forwarded
                        if(obj.getJSONObject("sent").getJSONObject("forwarded").has("message")){
                            Log.e(TAG,"进message-------------------------");
                            //包含第二层message
                            if(obj.getJSONObject("sent").getJSONObject("forwarded").getJSONObject("message").has("body")){
                                Log.e(TAG,"进普通message-------------------------");
                                //包含body
                                params.putString("body", obj.getJSONObject("sent").getJSONObject("forwarded").getJSONObject("message").getString("body"));
                            }else if(obj.getJSONObject("sent").getJSONObject("forwarded").getJSONObject("message").has("removemsg")){
                                Log.e(TAG,"进撤回message-------------------------");
                                //包含撤回消息removemsg
                                JSONObject temp1 = new JSONObject(obj.getJSONObject("sent").getJSONObject("forwarded").getJSONObject("message").getJSONObject("removemsg").getString("removeMsg"));
                                params.putString("removeMsgId", temp1.getString("removeMsgId"));
                                params.putString("removeName", temp1.getString("trueName"));
                            }
                        }
                    }
                }else{
                    params.putString("body", message.getBody());
                }
                if(obj.has("st")){
                    Log.e(TAG,"进st-------------------------");
                    params.putString("st", obj.getJSONObject("st").getString("content"));
                }
                if(obj.has("id")){
                    Log.e(TAG,"id-----------------");
                    Log.e(TAG,obj.toString());
                    Log.e(TAG,obj.getString("id"));
                    params.putString("id", obj.getString("id"));
                }
                if(obj.has("to")){
                    Log.e(TAG,"to-----------------");
                    Log.e(TAG,obj.getString("to"));
                    params.putString("to", obj.getString("to"));
                }
                if(obj.has("event") &&
                        obj.getJSONObject("event").has("items") &&
                        obj.getJSONObject("event").getJSONObject("items").has("item") &&
                        obj.getJSONObject("event").getJSONObject("items").getJSONObject("item").has("msgInfo")
                ){
                    Log.e(TAG,"msgInfo-----------------");
//                    obj.getJSONObject("event").has("items") &&
//                            obj.getJSONObject("event").getJSONObject("items").has("item") &&
//                            obj.getJSONObject("event").getJSONObject("items").getJSONObject("item").getJSONObject("item-entry").getJSONObject("content").has("msgInfo")
//                    Log.e(TAG,obj.getJSONObject("event").getJSONObject("items").getJSONObject("item").getJSONObject("item-entry").getJSONObject("content").getJSONObject("msgInfo").getString("content"));
//                    params.putString("msgInfo", obj.getJSONObject("event").getJSONObject("items").getJSONObject("item").getJSONObject("item-entry").getJSONObject("content").getJSONObject("msgInfo").getString("content"));

                    Log.e(TAG,obj.getJSONObject("event").getJSONObject("items").getJSONObject("item").getJSONObject("msgInfo").getString("content"));
                    params.putString("msgInfo", obj.getJSONObject("event").getJSONObject("items").getJSONObject("item").getJSONObject("msgInfo").getString("content"));
                }
                if(obj.has("x")){
                    if(obj.getJSONObject("x").has("status")){
                        Log.e(TAG,obj.getJSONObject("x").toString());
                        Object tempobj = obj.getJSONObject("x").get("status");
                        Log.e(TAG,tempobj.toString());
                        params.putString("code", tempobj.toString());
                    /*if(tempobj instanceof String){
                        presenceMap.putString("code", tempobj.toString());
                    }else if(tempobj instanceof JSONArray){
                        presenceMap.putString("code", tempobj.toString());
                    }*/
                    }else if(obj.getJSONObject("x").has("invite")){
                        JSONObject tempInvite = obj.getJSONObject("x").getJSONObject("invite");
                        Log.e(TAG,"Invite---------------------");
                        Log.e(TAG,tempInvite.toString());
                        if(tempInvite.has("reason")){
                            params.putString("invite", tempInvite.getString("from"));
                        }
                    }
                }else{
                    Log.e(TAG,"进入到message的else");
                    params.putString("code", null);
                    if(obj.has("removemsg")){
                        JSONObject temp1 = new JSONObject(obj.getJSONObject("removemsg").getString("removeMsg"));
                        params.putString("removeMsgId", temp1.getString("removeMsgId"));
                        params.putString("removeName", temp1.getString("trueName"));
                    }
                }
                Log.e(TAG,"message的结果："+params.toString());
                sendEvent(reactContext, RNXMPP_MESSAGE, params);
            }catch (Exception e){
                Log.e(TAG,"捕获异常："+e.getStackTrace()[0]);
                e.printStackTrace();
            }
        }

    }

    @Override
    public void onOfflineMessage(Message message){
        Log.e(TAG,"进入新监听-----------");
        WritableMap params = Arguments.createMap();
        params.putString("thread", message.getThread());
        params.putString("subject", message.getSubject());
        params.putString("body", message.getBody());
        params.putString("from", message.getFrom());
        params.putString("src", message.toXML().toString());
        sendEvent(reactContext, RNXMPP_OFFLINEMESSAGE, params);
    }

    @Override
    public void onRosterReceived(Roster roster) {
        WritableArray rosterResponse = Arguments.createArray();
        for (RosterEntry rosterEntry : roster.getEntries()) {
            WritableMap rosterProps = Arguments.createMap();
            rosterProps.putString("username", rosterEntry.getUser());
            rosterProps.putString("displayName", rosterEntry.getName());
            WritableArray groupArray = Arguments.createArray();
            for (RosterGroup rosterGroup : rosterEntry.getGroups()) {
                groupArray.pushString(rosterGroup.getName());
            }
            rosterProps.putArray("groups", groupArray);
            rosterProps.putString("subscription", rosterEntry.getType().toString());
            rosterResponse.pushMap(rosterProps);
        }
        sendEvent(reactContext, RNXMPP_ROSTER, rosterResponse);
    }

    @Override
    public void onIQ(IQ iq) {
        sendEvent(reactContext, RNXMPP_IQ, Parser.parse(iq.toString()));
    }

    @Override
    public void onUnparsedIQ(UnparsedIQ iq) {
        Log.e(TAG,iq.getContent().toString());
        try{
            String pattern = "<\\s*img\\s+([^>]+)\\s*>";
            String pattern1 = "<div[\\S\\s]*?>([\\S\\s]*?)</div>";
            String result = iq.getContent().toString().replaceAll(pattern,"");
            result = result.replaceAll(pattern1,"");
            JSONObject obj = XML.toJSONObject(result);
            JSONObject temp = new JSONObject();
            Log.e(TAG,"78945---------");
            Log.e(TAG,obj.toString());
            if(obj.has("chat")){
                List<JSONObject> list = JSONSortUtil.getJSONs(obj.getString("chat"));
                temp.put("set",obj.getJSONObject("chat").has("set") ? obj.getJSONObject("chat").get("set") : "");
                JSONSortUtil.bubbleSort(list,list.size());
//                List<JSONObject> list1 = new ArrayList<JSONObject>();
//                if(list.size() > 0){
//                    list1 = JSONSortUtil.addTime(list,"1");
//                }
                temp.put("list",list);

                Log.e(TAG,"78945------jjjjjjjjjjjj---");
                Log.e(TAG,temp.toString());
                sendEvent(reactContext, RNXMPP_UnparsedIQ, temp.toString());
            }else{
                temp.put("list",new ArrayList<>());
                sendEvent(reactContext, RNXMPP_UnparsedIQ, temp.toString());
            }

        }catch (Exception e){
            e.printStackTrace();
        }
    }

    @Override
    public void onPresence(Presence presence) {
        /*WritableMap presenceMap = Arguments.createMap();
        presenceMap.putString("type", presence.getType().toString());
        presenceMap.putString("from", presence.getFrom());
        presenceMap.putString("status", presence.getStatus());
        presenceMap.putString("mode", presence.getMode().toString());
        sendEvent(reactContext, RNXMPP_PRESENCE, presenceMap);*/
        String temp = presence.toXML().toString();
        try{
            JSONObject obj = XML.toJSONObject(temp);
            Log.e(TAG,"presence----------12121-----------------------");
            Log.e(TAG,obj.toString());
            Log.e(TAG,obj.has("x")+"");
            WritableMap presenceMap = Arguments.createMap();
            presenceMap.putString("type", presence.getType().toString());
            presenceMap.putString("from", presence.getFrom());
            presenceMap.putString("status", presence.getStatus());
            presenceMap.putString("mode", presence.getMode().toString());
            obj=obj.getJSONObject("presence");
            if(obj.has("x")){
                Object tempx = obj.get("x");
                if(tempx instanceof JSONObject){
                    if(obj.getJSONObject("x").has("status")){
                        Object tempobj = obj.getJSONObject("x").get("status");
                        presenceMap.putString("code", tempobj.toString());
                    /*if(tempobj instanceof String){
                        presenceMap.putString("code", tempobj.toString());
                    }else if(tempobj instanceof JSONArray){
                        presenceMap.putString("code", tempobj.toString());
                    }*/
                    }
                }else{
                    presenceMap.putString("code", null);
                }
            }
            if(obj.has("to")){
                Object tempx = obj.get("to");
                presenceMap.putString("to", tempx.toString());
            }
            if(obj.has("headchang")){
                JSONObject headchang = obj.getJSONObject("headchang");

                presenceMap.putString("ischange", headchang.getString("ischange"));
                presenceMap.putString("userid", headchang.getString("userid"));
                presenceMap.putString("newphotoid", headchang.getString("newphotoid"));
            }
            sendEvent(reactContext, RNXMPP_PRESENCE, presenceMap);
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    @Override
    public void onConnnect(String username, String password) {
        WritableMap params = Arguments.createMap();
        params.putString("username", username);
        params.putString("password", password);
        sendEvent(reactContext, RNXMPP_CONNECT, params);
    }

    @Override
    public void onDisconnect(Exception e) {
        if (e != null) {
            sendEvent(reactContext, RNXMPP_DISCONNECT, e.getLocalizedMessage());
        } else {
            sendEvent(reactContext, RNXMPP_DISCONNECT, null);
        }
    }

    @Override
    public void onLogin(String username, String password) {
        WritableMap params = Arguments.createMap();
        params.putString("username", username);
        params.putString("password", password);
        sendEvent(reactContext, RNXMPP_LOGIN, params);
    }

    void sendEvent(ReactContext reactContext, String eventName, @Nullable Object params) {
        reactContext
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }
}
