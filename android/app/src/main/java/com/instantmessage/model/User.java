package com.instantmessage.model;

/**
 * 人员对象
 * @author haoxl
 * @date 2018/5/30
 */
public class User {
    /**
     * 主键id
     */
    private Integer id;
    /**
     * 用于XMPP的jid
     */
    private String jid_node;
    /**
     * 用户id
     */
    private String user_id;
    /**
     * 真实姓名
     */
    private String name;
    /**
     * 备注
     */
    private String notes;
    /**
     * 是否为好友
     * 1-是好友 0-不是好友
     */
    private Integer is_friend;
    /**
     * 帐号
     */
    private String account_no;
    /**
     * 电话
     */
    private String phone;
    /**
     * 邮箱
     */
    private String email;
    /**
     * 性别
     * 0-女，1-男
     */
    private Integer sex;
    /**
     * 本地头像路径
     * 本地文件夹路径，不包含文件名
     */
    private String picture_path;
    /**
     * 头像名
     * 头像文件名，包含后缀
     */
    private String picture_name;
    /**
     * 备注（真实姓名）首字母
     */
    private String notes_initial;
    /**
     * 是否已经获取详情
     * 0-未获取，1-已获取
     */
    private Integer is_details;

    public User(){

    }

    public User(Integer id,String jid_node,String user_id,String name,String notes,Integer is_friend,String account_no,String phone,String email,Integer sex,String picture_path,String picture_name,String notes_initial,Integer is_details){
        this.id = id;
        this.jid_node = jid_node;
        this.user_id = user_id;
        this.name = name;
        this.notes = notes;
        this.is_friend = is_friend;
        this.account_no = account_no;
        this.phone =phone;
        this.email = email;
        this.sex = sex;
        this.picture_path =picture_path;
        this.picture_name = picture_name;
        this.notes_initial=notes_initial;//zip存放路径
        this.is_details=is_details;//页面名称
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getJid_node() {
        return jid_node;
    }

    public void setJid_node(String jid_node) {
        this.jid_node = jid_node;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getIs_friend() {
        return is_friend;
    }

    public void setIs_friend(Integer is_friend) {
        this.is_friend = is_friend;
    }

    public String getAccount_no() {
        return account_no;
    }

    public void setAccount_no(String account_no) {
        this.account_no = account_no;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getSex() {
        return sex;
    }

    public void setSex(Integer sex) {
        this.sex = sex;
    }

    public String getPicture_path() {
        return picture_path;
    }

    public void setPicture_path(String picture_path) {
        this.picture_path = picture_path;
    }

    public String getPicture_name() {
        return picture_name;
    }

    public void setPicture_name(String picture_name) {
        this.picture_name = picture_name;
    }

    public String getNotes_initial() {
        return notes_initial;
    }

    public void setNotes_initial(String notes_initial) {
        this.notes_initial = notes_initial;
    }

    public Integer getIs_details() {
        return is_details;
    }

    public void setIs_details(Integer is_details) {
        this.is_details = is_details;
    }
}
