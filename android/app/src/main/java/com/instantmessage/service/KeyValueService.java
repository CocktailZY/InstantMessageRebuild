package com.instantmessage.service;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import com.instantmessage.IMModule;
import com.instantmessage.model.KeyValue;

/**
 * KeyValueService
 * @author haoxl
 * @date 2018/5/30
 */
public class KeyValueService {

    /*static final String TAG = KeyValueService.class.getName() + " pid::" + android.os.Process.myPid();
    public static SQLiteDatabase db;
    //初始化数据库A
    public static void initDB(){
        if(db==null||!db.isOpen()){
            Log.e(TAG, "打开数据库");
            db= SQLiteDatabase.openOrCreateDatabase(IMModule.dbfile, null);
        }
    }
    //保存数据,jid不可以重复，如果重复则执行更新操作
    public static void saveDate(KeyValue keyValue) {
        String v = getValueByKeyDB(keyValue.getKey());
        if (v != null&&!"".equals(v)) {
            Log.e(TAG, "更新keyValue数据成功");
            update(keyValue);
        } else {
            KeyValueService.insertDataDB(keyValue);
            Log.e(TAG, "插入keyValue数据成功");
        }

    }
    //插入数据
    public static void insertData(KeyValue keyValue) {
        initDB();
        //实例化内容值
        ContentValues values = new ContentValues();
        values.put("key", keyValue.getKey());//
        values.put("value", keyValue.getValue());
        //调用方法插入数据
        Log.e(TAG, "开始插入数据");
        db.insert("key_value", null, values);
        //关闭SQLiteDatabase对象
        db.close();

    }
    //插入数据
    public static void insertDataDB(KeyValue keyValue) {
        //实例化内容值
        ContentValues values = new ContentValues();
        values.put("key", keyValue.getKey());//
        values.put("value", keyValue.getValue());
        //调用方法插入数据
        Log.e(TAG, "开始插入数据");
        db.insert("key_value", null, values);
    }
    //根据id修改人员信息
    public static void update(KeyValue keyValue){
        initDB();
        //实例化内容值
        ContentValues values = new ContentValues();
        values.put("value", keyValue.getValue());

        //修改条件
        String whereClause = "key=?";
        //修改添加参数
        String[] whereArgs = {String.valueOf(keyValue.getKey())};
        //修改
        db.update("key_value", values, whereClause, whereArgs);
        //关闭SQLiteDatabase对象
        db.close();
    }

    //通过key获取value值
    public static String getValueByKey(String key) {
        initDB();
        Cursor cur = db.rawQuery("SELECT * FROM key_value where key=? ", new String[]{key});
        KeyValue kv= getBaseKeyValue(cur);
        db.close();
        if(kv!=null){
            return kv.getValue();
        }
        return null;
    }
    //通过key获取value值
    public static String getValueByKeyDB(String key) {
        initDB();
        Cursor cur = db.rawQuery("SELECT * FROM key_value where key=? ", new String[]{key});
        KeyValue kv= getBaseKeyValue(cur);
        if(kv!=null){
            return kv.getValue();
        }
        return null;
    }
    //获取基础KeyValue对象
    private static KeyValue getBaseKeyValue(Cursor cur) {
        while (cur.moveToNext()) {
            String key = cur.getString(cur.getColumnIndex("key"));
            String value = cur.getString(cur.getColumnIndex("value"));
            KeyValue kv = new KeyValue(key, value);
            return kv;
        }
        return null;
    }*/

}
