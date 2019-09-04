package com.instantmessage.service;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import com.instantmessage.IMModule;
import com.instantmessage.model.User;

import java.util.ArrayList;
import java.util.List;

/**
 * UserService
 * @author haoxl
 * @date 2018/5/30
 */
public class UserService {

    /*static final String TAG = UserService.class.getName() + " pid::" + android.os.Process.myPid();
    public static SQLiteDatabase db;
    //初始化数据库
    public static void initDB(){
        if(db==null||!db.isOpen()){
            Log.e(TAG, "打开数据库");
            try{
                db= SQLiteDatabase.openOrCreateDatabase(IMModule.dbfile, null);
            }catch (SQLException e){
                e.printStackTrace();
            }
        }
    }
    //保存数据,jid不可以重复，如果重复则执行更新操作
    public static void saveDate(User user) {
        User r = getUserByUid(user.getUser_id());
        if (r != null) {
            Log.e(TAG, "更新数据成功");
            update(user);
        } else {
            UserService.insertData(user);
            Log.e(TAG, "插入数据成功");
        }

    }
    //插入数据
    public static void insertData(User user) {
        initDB();
        //实例化内容值
        ContentValues values = new ContentValues();
        values.put("jid_node", user.getJid_node());//
        values.put("user_id", user.getJid_node());
        values.put("name", user.getName());//
        values.put("notes", user.getNotes());
        values.put("is_friend", user.getIs_friend());
        values.put("account_no", user.getAccount_no());
        values.put("phone", user.getPhone());
        values.put("email", user.getJid_node());
        values.put("sex", user.getSex());
        values.put("picture_path", user.getPicture_path());
        values.put("picture_name", user.getPicture_name());
        values.put("notes_initial", user.getNotes_initial());
        values.put("is_details", user.getIs_details());
        //调用方法插入数据
        Log.e(TAG, "开始插入数据");
        db.insert("user", null, values);
        //关闭SQLiteDatabase对象
        db.close();

    }
    //插入数据
    public static void insertDataNoDB(User user) {
        initDB();
        //实例化内容值
        ContentValues values = new ContentValues();
        values.put("jid_node", user.getJid_node());//
        values.put("user_id", user.getJid_node());
        values.put("name", user.getName());//
        values.put("notes", user.getNotes());
        values.put("is_friend", user.getIs_friend());
        values.put("account_no", user.getAccount_no());
        values.put("phone", user.getPhone());
        values.put("email", user.getJid_node());
        values.put("sex", user.getSex());
        values.put("picture_path", user.getPicture_path());
        values.put("picture_name", user.getPicture_name());
        values.put("notes_initial", user.getNotes_initial());
        values.put("is_details", user.getIs_details());
        //调用方法插入数据
        Log.e(TAG, "开始插入数据");
        db.insert("user", null, values);
    }
    //根据id修改人员信息
    public static void update(User user){
        initDB();
        //实例化内容值
        ContentValues values = new ContentValues();
        values.put("jid_node", user.getJid_node());//
        values.put("user_id", user.getJid_node());
        values.put("name", user.getName());//
        values.put("notes", user.getNotes());
        values.put("is_friend", user.getIs_friend());
        values.put("account_no", user.getAccount_no());
        values.put("phone", user.getPhone());
        values.put("email", user.getJid_node());
        values.put("sex", user.getSex());
        values.put("picture_path", user.getPicture_path());
        values.put("picture_name", user.getPicture_name());
        values.put("notes_initial", user.getNotes_initial());
        values.put("is_details", user.getIs_details());

        //修改条件
        String whereClause = "id=?";

        //修改添加参数
        String[] whereArgs = {String.valueOf(user.getId())};
        //修改
        db.update("user", values, whereClause, whereArgs);
        //关闭SQLiteDatabase对象
        db.close();
    }
    //获取好友
    public static List<User> getFriends(String isFriend){
        String sql = "SELECT * FROM user ";
        String[] str = null;
        if(isFriend!=null){
            str = new String[]{isFriend};
            sql +="where is_friend=? ";
            sql +="ORDER BY notes_initial";
        }
        Log.e(TAG, "查询所有资源sql："+sql);
        Log.e(TAG, "查询所有资源sql条件："+str);
        return getBaseUserList(db.rawQuery(sql, str));
    }

    //通过jid获取User对象
    public static User getUserByJid(String jidString) {
        initDB();
        Log.e(TAG, "通过Jid获取资源："+jidString);
        Cursor cur = db.rawQuery("SELECT * FROM user where jid_node=? ", new String[]{jidString});
        return getBaseUser(cur);
    }
    //通过jid获取User对象
    public static User getUserByUid(String uidString) {
        initDB();
        Log.e(TAG, "通过uid获取资源："+uidString);
        Cursor cur = db.rawQuery("SELECT * FROM user where user_id=? ", new String[]{uidString});
        db.close();
        return getBaseUser(cur);
    }

    //获取基础User对象
    public static User getBaseUser(Cursor cur) {
        while (cur.moveToNext()) {
            String id = cur.getString(cur.getColumnIndex("id"));
            String jid_node = cur.getString(cur.getColumnIndex("jid_node"));
            String user_id = cur.getString(cur.getColumnIndex("user_id"));
            String name = cur.getString(cur.getColumnIndex("name"));
            String notes = cur.getString(cur.getColumnIndex("notes"));
            String is_friend = cur.getString(cur.getColumnIndex("is_friend"));
            String account_no = cur.getString(cur.getColumnIndex("account_no"));
            String phone = cur.getString(cur.getColumnIndex("phone"));
            String email = cur.getString(cur.getColumnIndex("email"));
            String sex = cur.getString(cur.getColumnIndex("sex"));
            String picture_path = cur.getString(cur.getColumnIndex("picture_path"));
            String picture_name = cur.getString(cur.getColumnIndex("picture_name"));
            String notes_initial = cur.getString(cur.getColumnIndex("notes_initial"));
            String is_details = cur.getString(cur.getColumnIndex("is_details"));
            User r = new User(Integer.valueOf(id), jid_node, user_id, name, notes, Integer.valueOf(is_friend), account_no, phone, email, Integer.valueOf(sex), picture_path, picture_name, notes_initial, Integer.valueOf(is_details));
            return r;
        }
        return null;
    }
    //获取User基础列表
    public static List<User> getBaseUserList(Cursor cur){
        List<User> resourceList = new ArrayList<User>();
        while (cur.moveToNext()) {
            Log.e(TAG,"进入基础遍历");
            String id = cur.getString(cur.getColumnIndex("id"));
            String jid_node = cur.getString(cur.getColumnIndex("jid_node"));
            String user_id = cur.getString(cur.getColumnIndex("user_id"));
            String name = cur.getString(cur.getColumnIndex("name"));
            String notes = cur.getString(cur.getColumnIndex("notes"));
            String is_friend = cur.getString(cur.getColumnIndex("is_friend"));
            String account_no = cur.getString(cur.getColumnIndex("account_no"));
            String phone = cur.getString(cur.getColumnIndex("phone"));
            String email = cur.getString(cur.getColumnIndex("email"));
            String sex = cur.getString(cur.getColumnIndex("sex"));
            String picture_path = cur.getString(cur.getColumnIndex("picture_path"));
            String picture_name = cur.getString(cur.getColumnIndex("picture_name"));
            String notes_initial = cur.getString(cur.getColumnIndex("notes_initial"));
            String is_details = cur.getString(cur.getColumnIndex("is_details"));
            if(id!=null){
                User r = new User(Integer.valueOf(id), jid_node, user_id, name, notes, Integer.valueOf(is_friend), account_no, phone, email, Integer.valueOf(sex), picture_path, picture_name, notes_initial, Integer.valueOf(is_details));
                resourceList.add(r);
            }
        }
        return resourceList;
    }*/
}
