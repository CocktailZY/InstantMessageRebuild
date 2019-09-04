package com.instantmessage.model;

/**
 * 键值对象
 * @author haoxl
 * @date 2018/5/30
 */

public class KeyValue {
    /**
     * key
     * 可使用的键值: userListVersion : 人员列表请求版本号
     *              friendListVersion : 好友列表请求版本号
     *              userDeatilVersion : 人员详情请求版本号
     *              userTree : 通讯录列表树
     *              friendTree : 好友列表树
     */
    private String key;
    /**
     * value
     * 数据库类型为text
     */
    private String value;

    public KeyValue(){

    }

    public KeyValue(String key, String value){
        this.key = key;
        this.value = value;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
