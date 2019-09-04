import UUIDUtil from './UUIDUtil';
import HtmlUtil from './HtmlUtil';
import Path from "../config/UrlConfig";

export default SendStanza = {
	//发送登录状态
	loginStatus() {
		var context = '';
		context += '<presence xmlns="jabber:client" type="available" id="' + UUIDUtil.getUUID() + ':sendIQ">';
		context += '<status>在线</status>';
		context += '</presence>';
		return context;
	},
	//获取单聊总页数
	getPageTotal(pageSize, friendJid) {
		var context = '';
		context += '<iq type="get" xmlns="jabber:client" id="' + UUIDUtil.getUUID() + '">';
		context += '<retrieve xmlns="urn:xmpp:archive" with="' + friendJid + '">';
		context += '<set xmlns="http://jabber.org/protocol/rsm">';
		context += '<max>' + pageSize + '</max>';
		context += '</set>';
		context += '</retrieve>';
		context += '</iq>';
		return context;
	},
	//获取单聊消息记录
	getPrivateChatHistory(startSize, pageSize, friendJid) {
		var context = '';
		context += '<iq type="get">';
		context += '<retrieve xmlns="urn:xmpp:archive" with="' + friendJid + '">';
		context += '<set xmlns="http://jabber.org/protocol/rsm">';
		context += '<index>' + startSize + '</index>'
		context += '<max>' + pageSize + '</max>';
		context += '</set>';
		context += '</retrieve>';
		context += '</iq>';
		return context;
	},
	//发送群聊消息
	sendGroup(msgType, groupJid, msgBody, msgId) {
		var context = '';
		context += '<message type="' + msgType + '" to="' + groupJid + '" id="' + msgId + '">';
		context += '<body>' + HtmlUtil.htmlEncodeByRegExp(msgBody) + '</body>';
		context += '</message>';
		return context;
	},
	//出席群
	enterGroup(groupId) {
		var context = '';
		context += '<presence to="' + groupId + '" xmlns="jabber:client">';//C7F212452E800001453C4CBB1F04A1E0@muc.gkzq.com.cn/42280f4a306c41829b6ee23cbcd31e10
		context += '<x xmlns="http://jabber.org/protocol/muc"><history maxstanzas="1"/></x>';
		context += '</presence>';
		return context;
	},
	//添加好友
	addFriend(friendJid, message) {
		var context = '';
		context += '<presence to="' + friendJid + '" type="subscribe" xmlns="jabber:client">';
		context += '<status>' + message + '</status>';
		context += '</presence>';
		return context;
	},
	//同意添加好友
	successFriend(friendJid, toTrueName, fromJid) {
		var context = '';
		context += '<presence to="' + friendJid + '" type="subscribed" xmlns="jabber:client">';
		context += '<status>' + toTrueName + '</status>';
		context += '</presence>';
		return context;
	},
	successBack(friendJid) {
		var context = '';
		context += '<presence to="' + friendJid + '" type="subscribe" xmlns="jabber:client">';
		context += '<status>back</status>';
		context += '</presence>';
		return context;
	},
	//添加好友时
	sendIQ(jid, activeUserName, firstSpell) {
		var context = '';
		context += '<iq type="set" xmlns="jabber:client" id="' + UUIDUtil.getUUID() + ':sendIQ">';
		context += '<query xmlns="jabber:iq:roster">';
		context += '<item jid="' + jid + '" name="' + activeUserName + '">';
		context += '<group>' + firstSpell + '</group>';
		context += '</item>';
		context += '</query>';
		context += '</iq>';
		return context;
	},
	//删除好友 start
	sendRemoveIQ(friendJid,) {
		var context = '';
		context += '<iq type="set" xmlns="jabber:client" id="' + UUIDUtil.getUUID() + ':sendIQ">';
		context += '<query xmlns="jabber:iq:roster">';
		context += '<item jid="' + friendJid + '" subscription="remove" />';
		context += '</query>';
		context += '</iq>';
		return context;
	},
	sendPresence(curredJid, jid) {
		var context = '';
		context += '<presence from="' + curredJid + '" to="' + jid + '" xmlns="jabber:client">';
		context += '<status>roster:remove</status>';
		context += '</presence>';
		return context;
	},
	//拒绝好友
	sendRefuseFriend(curredJid, jid, trueName) {
		var context = '';
		context += '<presence from="' + curredJid + '" to="' + jid + '" type="unsubscribed" xmlns="jabber:client">';
		context += '<status>' + trueName + '</status>';
		context += '</presence>';
		return context;
	},
	//创建群
	createPresence(to) {
		var context = '';
		context += '<presence to="' + to + '" xmlns="jabber:client">';//b91e11d58c2cea0eab489899651ebba4@muc.gkzq.com.cn/ce0bd5d9ed214c18a92f66e98822bf73
		context += '<x xmlns="http://jabber.org/protocol/muc"></x>';
		context += '</presence>';
		return context;
	},
	createGroup(roomJid, groupName, groupContent, isNeed) {
		//房间id，房间名，房间介绍，是否需要审核：true是，
		var context = '';
		context += '<iq to="' + roomJid + '" type="set" xmlns="jabber:client" id="' + UUIDUtil.getUUID() + ':sendIQ">';//C8045C50C3E00001C38618C018C063C0@muc.gkzq.com.cn
		context += '<query xmlns="http://jabber.org/protocol/muc#owner">';
		context += '<x xmlns="jabber:x:data" type="submit">';
		context += '<field var="muc#roomconfig_persistentroom"><value>1</value></field>';
		context += '<field var="muc#roomconfig_roomname"><value>' + groupName + '</value></field>';
		context += '<field var="muc#roomconfig_roomdesc"><value>' + groupContent + '</value></field>';
		context += '<field var="muc#roomconfig_enablelogging"><value>1</value></field>';
		context += '<field var="muc#roomconfig_whois"><value>anyone</value></field>';
		context += '<field var="muc#roomconfig_changesubject"><value>1</value></field>';
		context += '<field var="muc#roomconfig_publicroom"><value>1</value></field>';
		context += '<field var="muc#roomconfig_membersonly"><value>' + isNeed + '</value></field>';//isNeed
		context += '</x></query></iq>';
		return context;
	},
	//邀请人
	inviteToGroup(jid, groupId, myJid) {//ce0bd5d9ed214c18a92f66e98822bf73@gkzq.com.cn/123
		var context = '';
		context += '<message to="' + groupId + '" from="' + myJid + '" id="' + UUIDUtil.getUUID() + '" xmlns="jabber:client">';
		context += '<x xmlns="http://jabber.org/protocol/muc#user">';
		context += '<invite to="' + jid + '"><reason>邀请入群！</reason></invite>';
		context += '</x></message>';
		return context;
	},
	//创建节点
	createGroupNode(myJid, join) {
		var context = '';
		context += "<iq from='" + myJid + "@" + Path.xmppDomain + "' to='pubsub." + Path.xmppDomain + "' type='set' id='" + UUIDUtil.getUUID() + ":pubsubcreatenode' xmlns='jabber:client'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub'>";
		context += "<create node='" + join + "'/></pubsub></iq>";
		return context;
	},
	//订阅
	subscriptionToGroup(toJid, join) {//toJid@gkzq.com.cn
		var context = '';
		context += "<iq type='set' to='pubsub." + Path.xmppDomain + "' xmlns='jabber:client' id='" + UUIDUtil.getUUID() + ":sendIQ'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub'>";
		context += "<subscribe node='" + join + "' jid='" + toJid + "'/></pubsub></iq>";
		return context;
	},
	//发布消息
	sendMessageGroup(roomJid, toJid, myJid, join, type) {
		var context = '';
		context += "<iq from='" + myJid + "@" + Path.xmppDomain + "' to='pubsub." + Path.xmppDomain + "' type='set' id='" + UUIDUtil.getUUID() + ":pubsubpublishnode' xmlns='jabber:client'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub'>";
		context += "<publish node='" + join + "' jid='" + myJid + "@" + Path.xmppDomain + "'>";
		context += "<item>";
		context += "<msgInfo>{\"mode\":\"" + type + "\",\"active\":\"" + myJid + "\",\"roomjid\":\"" + roomJid + "\",\"occupantJid\":\"" + toJid + "\",\"effect\":\"" + toJid + "\"}</msgInfo>";
		context += "</item></publish></pubsub></iq>";
		return context;
	},
	/**
	 * 主动加入审核群，或者审核群的普通成员邀请其他人入群
	 * @param roomJid
	 * @param curredJid 被邀请人JidNode
	 * @param type 'join'
	 * @param occupantName 被邀请人TrueName
	 * @param join
	 * @param myJid
	 * @returns {string}
	 * 管理员订阅
	 */
	approvePublishSendMessageGroup(roomJid, curredJid, type, occupantName, join, myJid) {
		var context = '';
		context += "<iq from='" + myJid + "@" + Path.xmppDomain + "' to='pubsub." + Path.xmppDomain + "' type='set' id='" + UUIDUtil.getUUID() + ":pubsubpublishnode' xmlns='jabber:client'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub'>";
		context += "<publish node='" + join + "' jid='" + myJid + "@"+Path.xmppDomain+"'>";
		context += "<item>";
		context += "<msgInfo>{\"mode\":\"" + type + "\",\"applicant\":\"" + curredJid + "\",\"roomjid\":\"" + roomJid + "\",\"occupantName\":\"" + occupantName + "\"}</msgInfo>";
		context += "</item></publish></pubsub></iq>";
		return context;
	},
	/**
	 * 主动加入非审核群，或者审核群的群主管理员邀请其他人入群
	 * @param roomJid
	 * @param curredJid 被邀请人JidNode
	 * @param type 'INVITEJOINROOM'
	 * @param join
	 * @param myJid
	 * @returns {string}
	 * 被邀请人订阅
	 */
	notApproveSendMessageGroup(roomJid, curredJid, type, join, myJid) {
		var context = '';
		context += "<iq from='" + myJid + "@" + Path.xmppDomain + "' to='pubsub." + Path.xmppDomain + "' type='set' id='" + UUIDUtil.getUUID() + ":pubsubpublishnode' xmlns='jabber:client'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub'>";
		context += "<publish node='" + join + "' jid='" + myJid + "@"+Path.xmppDomain+"'>";
		context += "<item mode='" + type + "' occupantJid='" + curredJid + "' roomjid='" + roomJid + "'>";
		context += "<msgInfo>" + HtmlUtil.htmlEncodeByRegExp("{\"mode\":\"" + type + "\",\"occupantJid\":\"" + curredJid + "\",\"roomjid\":\"" + roomJid + "\"}") + "</msgInfo>";
		context += "</item></publish></pubsub></iq>";
		return context;
	},
	//踢出群聊
	removeFromGroup(groupId, memberJidNode) {
		var context = '';
		context += '<iq type="set" to="' + groupId + '" xmlns="jabber:client">';//@muc.gkzq.com.cn
		context += '<query xmlns="http://jabber.org/protocol/muc#admin">';
		context += '<item jid="' + memberJidNode + '@' + Path.xmppDomain + '" affiliation="none"><reason>无岗位</reason></item>';
		context += '</query></iq>';
		return context;
	},
	//退出群聊
	quitGroup(groupId, msgBody) {
		var context = '';
		context += '<message type="groupchat" to="' + groupId + Path.xmppGroupDomain + '" id="' + UUIDUtil.getUUID() + '">';
		context += '<body>' + msgBody + '</body>';
		context += '</message>';
		return context;
	},
	//撤回单聊消息
	refuseSingleMsg(friendJidNode, selfJidNode, msgId, tip, trueName) {
		var context = '';
		context += '<message to="' + friendJidNode + '@' +Path.xmppDomain + '" from="' + selfJidNode+ '@' + Path.xmppDomain + '" type="chat" id="' + UUIDUtil.getUUID().replace(/\-/g, '') + '" xmlns="jabber:client">';
		context += '<removemsg id="' + msgId + '" xmlns="http://sinosoft.com.webim/protocol/amp?action=drop" type="chat">';
		context += '<content></content>';//<strong>' + tip + '</strong>
		// context += '<removeMsg>{"content":"' + tip + '","removeMsgId":"' + msgId + '"}</removeMsg>';
		context += '<removeMsg>{"content":"' + tip + '","trueName":"' + trueName + '","removeMsgId":"' + msgId + '"}</removeMsg>';
		context += '</removemsg></message>';
		return context;
	},
	//撤回群聊消息
	refuseMucMsg(roomJid, msgId, trueName) {
		var context = '';
		let temp = '{"content":"\\<strong\\>撤回了一条消息\\<\\/strong\\>","trueName":"\' + trueName + \'"}'
		context += '<message to="' + roomJid + Path.xmppGroupDomain + '" type="groupchat" id="' + UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg" xmlns="jabber:client">';
		context += '<removemsg id="' + msgId + '" xmlns="http://sinosoft.com.webim/protocol/amp?action=drop" type="groupchat">';
		context += '<content></content>';
		context += '<removeMsg>{"content":"撤回了一条消息","trueName":"' + trueName + '","removeMsgId":"' + msgId + '"}</removeMsg>';
		context += '</removemsg></message>';
		return context;
	},
	//删除节点
	delIqNode(node) {
		var context = "<iq to='pubsub.imserver' type='set' id='"+UUIDUtil.getUUID()+"' xmlns='jabber:client'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub#owner'>";
		context += "<delete node='"+node+"'/>";
		context += "</pubsub></iq>";
		return context;
	},
	//设置管理员
	setAdmin(groupId, memberJidNode,affiliation,tip) {
		var context = '';
		context += '<iq type="set" to="' + groupId + '" xmlns="jabber:client" id="' + UUIDUtil.getUUID() + ':sendIQ">';//@muc.gkzq.com.cn
		context += '<query xmlns="http://jabber.org/protocol/muc#admin">';
		context += '<item jid="' + memberJidNode + '@' + Path.xmppDomain + '" affiliation="'+affiliation+'"><reason>'+tip+'</reason></item>';
		context += '</query></iq>';
		return context;
	},

	//设置为成员
	setMember(groupId, memberJidNode) {
		var context = '';
		context += '<iq type="set" to="' + groupId + '" xmlns="jabber:client" id="' + UUIDUtil.getUUID() + ':sendIQ">';//@muc.gkzq.com.cn
		context += '<query xmlns="http://jabber.org/protocol/muc#admin">';
		context += '<item jid="' + memberJidNode + '@' + Path.xmppDomain + '" affiliation="member"><reason>设为成员</reason></item>';
		context += '</query></iq>';
		return context;
	},

	//工作邀请发布消息
	sendMessageInviteWorkGroup(toJid, myJid, join, type) {
		var context = '';
		context += "<iq from='" + myJid + "' to='pubsub." + Path.xmppDomain + "' type='set' id='" + UUIDUtil.getUUID() + ":pubsubpublishnode' xmlns='jabber:client'>";
		context += "<pubsub xmlns='http://jabber.org/protocol/pubsub'>";
		context += "<publish node='" + join + "' jid='" + myJid + "'>";
		context += "<item mode='" + type + "' occupantJid='" + toJid + "'>";
		context += "<msgInfo>"+JSON.stringify({mode:type,occupantJid:toJid})+"</msgInfo>";
		context += "</item></publish></pubsub></iq>";
		return context;
	},
	//修改头像
	modifyHead(changeBody) {
		var context = '';
		context += '<presence xmlns="jabber:client" id="' + UUIDUtil.getUUID() + ':sendIQ">';
		context += '<status>在线</status>';
		context += '<headchang><ischange>' + changeBody.isChange + '</ischange>';
		context += '<userid>' + changeBody.userId + '</userid>';//jidNode
		context += '<newphotoid>' + changeBody.newPhotoId + '</newphotoid>';
		context += '</headchang></presence>';
		return context;
	},
	//修改群信息
	changeGroupInfo(groupJid) {
		var context = '';
		context += '<message type="groupchat" to="' + groupJid + '" id="' + UUIDUtil.getUUID().replace(/\-/g, '') + '">';
		context += '<changeinfo/>';
		context += '</message>';
		return context;
	},
}