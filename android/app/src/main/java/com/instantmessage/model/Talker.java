package com.instantmessage.model;

import com.alibaba.fastjson.annotation.JSONField;
import java.util.Date;

/**
 * 聊天对象
 * @author haoxl
 * @date 2018/5/30
 */
public class Talker {
    /**
     * 主键id
     */
    private Integer id;
    /**
     * 类型 1-单聊 2-群聊
     */
    private Integer type;
    /**
     * 聊天人ID主键
     * 外键，关联user主键ID
     * type为2时，为空
     */
    private Integer user_id;
    /**
     * 聊天群ID主键
     * 外键，关联groups主键ID
     * type为1时，为空
     */
    private Integer groups_id;
    /**
     * 创建时间
     */
    @JSONField(format = "yyyy-MM-dd HH:mm:ss")
    private Date create_time;
    /**
     * 排列序号
     * 用时间戳序号表示，排序时以时间戳倒序排列，用于页面列表排序
     */
    private Integer sequence_number;
    /**
     * 未读条数
     */
    private Integer unread_number;
    /**
     * 置顶优先级
     * 用时间戳序号表示，排序时以时间戳倒序排列
     * 未设置置顶时，为空
     */
    private Integer promote_priority;
    /**
     * 最近消息时间
     * 该最近聊天对象中的最新一条消息的时间
     */
    @JSONField(format = "yyyy-MM-dd HH:mm:ss")
    private Date newest_time;
    /**
     * 是否免打扰
     * 0-关闭免打扰，1-开启免打扰
     */
    private Integer is_no_remind;

    public Talker(){

    }

    public Talker(Integer id, Integer type,Integer user_id,Integer groups_id,Date create_time,Integer sequence_number,Integer unread_number,Integer promote_priority,Date newest_time,Integer is_no_remind){
        this.id = id;
        this.type = type;
        this.user_id = user_id;
        this.groups_id = groups_id;
        this.create_time = create_time;
        this.sequence_number = sequence_number;
        this.unread_number = unread_number;
        this.promote_priority = promote_priority;
        this.newest_time = newest_time;
        this.is_no_remind = is_no_remind;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public Integer getUser_id() {
        return user_id;
    }

    public void setUser_id(Integer user_id) {
        this.user_id = user_id;
    }

    public Integer getGroups_id() {
        return groups_id;
    }

    public void setGroups_id(Integer groups_id) {
        this.groups_id = groups_id;
    }

    public Date getCreate_time() {
        return create_time;
    }

    public void setCreate_time(Date create_time) {
        this.create_time = create_time;
    }

    public Integer getSequence_number() {
        return sequence_number;
    }

    public void setSequence_number(Integer sequence_number) {
        this.sequence_number = sequence_number;
    }

    public Integer getUnread_number() {
        return unread_number;
    }

    public void setUnread_number(Integer unread_number) {
        this.unread_number = unread_number;
    }

    public Integer getPromote_priority() {
        return promote_priority;
    }

    public void setPromote_priority(Integer promote_priority) {
        this.promote_priority = promote_priority;
    }

    public Date getNewest_time() {
        return newest_time;
    }

    public void setNewest_time(Date newest_time) {
        this.newest_time = newest_time;
    }

    public Integer getIs_no_remind() {
        return is_no_remind;
    }

    public void setIs_no_remind(Integer is_no_remind) {
        this.is_no_remind = is_no_remind;
    }
}
