/**
 * Copyright 2018 SinoSoft. All Rights Reserved.
 */
package com.rnxmpp.utils;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;


/**
 * <B>系统名称：排序</B><BR>
 * <B>模块名称：</B><BR>
 * <B>中文类名：</B><BR>
 * <B>概要说明：json
 * 格式：{"body":{"basic":{"userId":"111194","fromId":"8529108726f24405a0b8ad7222f2d26c","userName":"xxx1z","photoId":"",
 * "toId":"f010c89c711e46d9abd8bdbcddf2a55b","type":"privateChat"},"content":{"text":"3","file":[],"imageFiles":[],
 * "sendTime":"2017-12-29 11:46:26"},"keyId":"privateSend00","type":0,"id":"1514519186000Msg"}}</B><BR>
 * 
 * @author 中科软科技 lihaiyi
 * @since 2018年6月4日
 */
public class JSONSortUtil {
    /**
     * 
     * <B>方法名称：getJSONs</B><BR>
     * <B>概要说明：获取json</B><BR>
     *
     * @author：lihaiyi
     * @cretetime:2018年6月4日 上午11:25:21
     * @param xmljson
     * @return List<JSONObject>
     */
    public static List<JSONObject> getJSONs(String xmljson) throws JSONException {
        List<JSONObject> list = new ArrayList<>();
        JSONObject fromJson = new JSONObject(xmljson);
        if(fromJson.has("from")){
            Object fromObject = fromJson.get("from");
            if (fromObject instanceof JSONArray) {
                JSONArray formArray = fromJson.getJSONArray("from");
                for (int i = 0; i < formArray.length(); i++) {
                    formArray.getJSONObject(i).put("sendType", "from");
                    list.add(formArray.getJSONObject(i));
                }
            }
            else {
                JSONObject from = fromJson.getJSONObject("from");
                from.put("sendType", "from");
                list.add(from);
            }
        }
        if(fromJson.has("to")) {
            Object toObject = fromJson.get("to");
            if (toObject instanceof JSONArray) {
                JSONArray toArray = fromJson.getJSONArray("to");
                for (int j = 0; j < toArray.length(); j++) {
                    toArray.getJSONObject(j).put("sendType", "to");
                    list.add(toArray.getJSONObject(j));
                }
            } else {
                JSONObject to = fromJson.getJSONObject("to");
                to.put("sendType", "to");
                list.add(to);
            }
        }
        return list;
    }

    /**
     * 
     * <B>方法名称：bubbleSort</B><BR>
     * <B>概要说明：排序</B><BR>
     *
     * @author：lihaiyi
     * @cretetime:2018年6月4日 上午11:21:15
     * @param list
     * @param n list长度
     * @throws ParseException void
     */
    public static void bubbleSort(List<JSONObject> list, int n) throws ParseException, JSONException {
        int i, j;
        for (i = 0; i < n; i++) {//表示n次排序过程。
            for (j = 1; j < n - i; j++) {

                if (comperTime(list.get(j - 1), list.get(j))) {//前面的数字大于后面的数字就交换
                    JSONObject temp;
                    /* 交换 */
                    temp = list.get(j - 1);
                    list.set(j - 1, list.get(j));
                    list.set(j, temp);
                }
            }
        }
    }// end

    /**
     * 
     * <B>方法名称：comperTime</B><BR>
     * <B>概要说明：时间比较</B><BR>
     *
     * @author：lihaiyi
     * @cretetime:2018年6月4日 上午11:20:12
     * @param jsonOne
     * @param jsonTwo
     * @return
     * @throws ParseException Boolean
     */
    public static Boolean comperTime(JSONObject jsonOne, JSONObject jsonTwo) throws ParseException, JSONException {
        Object oneTimeObj = new JSONObject(jsonOne.getString("body")).getJSONObject("content").get("sendTime");
        Object twoTimeObj =new JSONObject(jsonTwo.getString("body")).getJSONObject("content").get("sendTime");
        if(oneTimeObj!=null&&twoTimeObj!=null){
            Long ontTime= 0L;
            Long twoTime=0L;

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            if(oneTimeObj instanceof  Long){
                ontTime=Long.parseLong(oneTimeObj.toString());
            }else{
                ontTime=sdf.parse(oneTimeObj.toString()).getTime();
            }
            if(twoTimeObj instanceof  Long){
                twoTime=Long.parseLong(twoTimeObj.toString());
            }else{
                twoTime=sdf.parse(twoTimeObj.toString()).getTime();
            }

            if (ontTime> twoTime) {
                return true;
            }
            else {
                return false;
            }
        }else {
            return false;
        }

    }
    /**
     *
     * <B>方法名称：addTime</B><BR>
     * <B>概要说明：比较两天记录的时间差，时间差大于50 就插入一条时间字符串</B><BR>
     *
     * @author：lihaiyi
     * @cretetime:2018年6月4日 下午7:20:11
     * @param list
     * @return
     * @throws ParseException List<JSONObject>
     */
    public static List<JSONObject> addTime(List<JSONObject> list,String startNum) throws ParseException, JSONException {
        List<JSONObject> resultList = new ArrayList<>();
        int beginNum = Integer.valueOf(startNum);
        for (int j = 0; j < list.size(); j++) {
            beginNum+=j;
            if (j != 0 && !comperTimeOne(list.get(j - 1), list.get(j))) {//前面的数字大于后面的数字就交换
                /* 添加时间 */
                JSONObject timeJson = new JSONObject();
                Object twoTimeObj = new JSONObject(list.get(j).getString("body")).getJSONObject("content").get("sendTime");
                Long twoTime = 0L;
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                if(twoTimeObj instanceof  Long){
                    twoTime=Long.parseLong(twoTimeObj.toString());
                }else{
                    twoTime=sdf.parse(twoTimeObj.toString()).getTime();
                }
                timeJson.put("time", twoTime.toString());
                resultList.add(timeJson);
                list.get(j).put("index",beginNum);
                resultList.add(list.get(j));
            }
            else {
                list.get(j).put("index",beginNum);
                resultList.add(list.get(j));
            }
        }
        return resultList;
    }// end

    /**
     *
     * <B>方法名称：comperTimeOne</B><BR>
     * <B>概要说明：比较时间间隔是否大于50秒</B><BR>
     *
     * @author：lihaiyi
     * @cretetime:2018年6月4日 上午11:20:12
     * @param jsonOne
     * @param jsonTwo
     * @return
     * @throws ParseException Boolean
     */
    public static Boolean comperTimeOne(JSONObject jsonOne, JSONObject jsonTwo) throws ParseException, JSONException {
//        String oneTime = new JSONObject(jsonOne.getString("body")).getJSONObject("content").getString("sendTime");
//        String twoTime =new JSONObject(jsonOne.getString("body")).getJSONObject("content").getString("sendTime");
//        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//        if (sdf.parse(twoTime).getTime() - sdf.parse(oneTime).getTime() <= 50 * 1000) {
//            return true;
//        }
//        else {
//            return false;
//        }
        Object oneTimeObj = new JSONObject(jsonOne.getString("body")).getJSONObject("content").get("sendTime");
        Object twoTimeObj =new JSONObject(jsonTwo.getString("body")).getJSONObject("content").get("sendTime");
        if(oneTimeObj!=null&&twoTimeObj!=null){
            Long ontTime= 0L;
            Long twoTime=0L;
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            if(oneTimeObj instanceof  Long){
                ontTime=Long.parseLong(oneTimeObj.toString());
            }else{
                ontTime=sdf.parse(oneTimeObj.toString()).getTime();
            }
            if(twoTimeObj instanceof  Long){
                twoTime=Long.parseLong(twoTimeObj.toString());
            }else{
                twoTime=sdf.parse(twoTimeObj.toString()).getTime();
            }
            Log.i("时间", twoTime+"");
            Log.i("时间", ontTime+"");
            if (twoTime-ontTime<= 180 * 1000) {
                return true;
            }
            else {
                return false;
            }
        }else{
            return false;
        }

    }

}
