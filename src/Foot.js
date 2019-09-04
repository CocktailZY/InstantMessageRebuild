/**
 * 底部导航器
 * 导入原生组件
 */
import React, {Component} from 'react';
import {
	Text,
	View,
	Image,
	StyleSheet, Platform, DeviceEventEmitter, NativeModules,
	BackHandler, AppState, NetInfo, PermissionsAndroid, ActivityIndicator, Modal,Alert
} from 'react-native';

/**
 * 基础样式组件
 */
import baseStyles from './commen/styles/baseStyles';

/**
 * 导入第三方组件
 */
import TabNavigator from 'react-native-tab-navigator';
import DeviceInfo from 'react-native-device-info';
import TouchID from 'react-native-touch-id';
import UUIDUtil from './util/UUIDUtil';

import Global from "./util/Global";

const StatusBarAndroid = Platform.select({
	ios: () => null,
	android: () => require('react-native-android-statusbar'),
})();

console.disableYellowBox = true;
console.warn("YellowBox is disabled.");

import Message from './screens/message/Message';
import Group from './screens/group/Group';
import Friend from './screens/friend/Friend';
import Setting from './screens/setting/Setting';
import Job from './screens/job/Job';
import Sqlite from "./util/Sqlite";
import XmlUtil from "./util/XmlUtil";
import FetchUtil from "./util/FetchUtil";
import Path from "./config/UrlConfig";
import cookie from './util/cookie';
import RedisUtil from "./util/RedisUtil";
import Toast, {DURATION} from 'react-native-easy-toast';
import AwesomeAlert from "react-native-awesome-alerts";
import Sound from "react-native-sound";
import ListenerUtil from './util/ListenerUtil';
import HtmlUtil from './util/HtmlUtil';
import ToolUtil from "./util/ToolUtil";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
const uuid = DeviceInfo.getUniqueID().replace(/\-/g, '');
let groupId;
let _appStatus;
let setLeaveFlag = true;//移除消息入库标记
let connentStatus = false;//标记XMPP连接状态
let pingNum = 0;//标记ping网络次数
let tmpFlag = false;//标记是否进入XMPP重连
let playVoice = true;//是否开启声音播放
if (Platform.OS == 'android') {
	StatusBarAndroid.setHexColor('#549dff');
}

export default class foot extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tabNames: ['消息', '群组', '联系人', '我的'],
			tab: 'message',
			uuid: props.navigation.state.params.uuid,
			ticket: props.navigation.state.params.ticket,
			basic: props.navigation.state.params.basic,
			newFriendTab: false,
			newMeesageTab: 0,
			nowPage: '',
			token: props.navigation.state.params.token,
			loginType: props.navigation.state.params.loginType,
			isLoading: false,//loading框显示标记
			groupList: [],
			jobInvite: false,//工作邀请通知标记
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		};
		this.flage = false;//前后台切换标记
	};

	/**
	 * XMPP断线重连
	 */
	reconnectXMPP_new = () => {
		let url = Path.getAllGroups + '?occupantJid=' + this.state.basic.jidNode + '&uuId=' + uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, {
			uuId: uuid,
			userId: this.state.basic.userId,
			ticket: this.state.ticket
		}, (responseJson) => {
			let groupList = responseJson.data;
			if (responseJson.code.toString() == '200') {
				if (Platform.OS == 'android') {
					this.setState({
						groupList: groupList
					}, () => {
						let timeresource = this.state.basic.userId + new Date().getTime();
						XMPP.disconnect();
						DeviceEventEmitter.emit('headTitle', "消息(连接中...)");
						// XMPP.connect(this.state.basic.jidNode + '@' + Path.xmppHost + '/' + this.state.basic.jidNode, 'android#' + this.state.ticket);
						Global.loginResource = this.state.basic.jidNode;
					});

				} else {
					XMPP.XMPPDisConnect();
					DeviceEventEmitter.emit('headTitle', "消息（连接中...）");
					let timeresource = this.state.basic.userId + new Date().getTime();
					Global.loginResource = this.state.basic.jidNode;
					XMPP.XMPPLoginAccount(
						{
							'account': this.state.basic.jidNode,
							'password': 'android#' + this.state.ticket,
							'uuid': uuid,
							'username': this.state.basic.trueName,
							'userId': this.state.basic.jidNode
						},
						(error, event) => {
							if (event == '登录成功') {
								Global.iosXmppIsConnect = true;
								DeviceEventEmitter.emit('headTitle', "消息（获取中...）");
								DeviceEventEmitter.emit('getOfflineMessage', "消息");
								groupList.map((item) => {
									Global.groupMute[item.roomJid] = item.mute;
									XMPP.XMPPMapgroupes(
										{
											'roomJid': item.roomJid,
											'account': this.state.basic.jidNode
										},
										(error, event) => {
											if (error) {
											} else {
											}

										}
									)
								});

								DeviceEventEmitter.emit('headTitle', "消息");

								//离线消息
								XMPP.loginNext({
									'from': this.state.basic.jidNode + '@' + Path.xmppDomain + '/' + this.state.basic.jidNode,
									'id': UUIDUtil.getUUID().replace(/\-/g, '')
								});


							} else {
								DeviceEventEmitter.emit('headTitle', "消息(未连接)");
								return;
							}
						}
					)
				}
			}
		});
	}
	/**
	 * 网络变化处理
	 * @param isConnected
	 * @param type
	 */
	handleFirstConnectivityChange = (isConnected, type) => {
		if (!Global.netWorkStatus_old && Global.netWorkStatus_new) {//网络状态由false->true
			Global.netWorkStatus_old = Global.netWorkStatus_new;
			//通过ping网络方式判断真实网络状态
			if (Platform.OS == "android") {
				NativeModules.JudgeNetwork.judgeNetwork(Path.network_ip, (flag) => {
					if (flag && flag == "true" && !tmpFlag && Global.isReconnectXMPP) {
						tmpFlag = true;
						this.reconnectXMPP_new();
						if (type == 'cellular') {
							this.refs.toast.show('您当前使用移动数据流量，请注意消耗!', 3000);
						}
					}
				});
			} else {
				this.reconnectXMPP_new();
				if (type == 'cellular') {
					this.refs.toast.show('您当前使用移动数据流量，请注意消耗!', 3000);
				}
			}
		} else if (Global.netWorkStatus_old && !Global.netWorkStatus_new) {//网络状态由true->false
			Global.netWorkStatus_old = Global.netWorkStatus_new;
			// DeviceEventEmitter.emit('headTitle', "消息(无网络)");
		} else if (Global.netWorkStatus_old && Global.netWorkStatus_new) {//网络状态由true->true
			if (type == 'cellular') {
				this.refs.toast.show('您当前使用移动数据流量，请注意消耗', 3000);
			}
		} else {//网络状态由false->false

		}
		// DeviceEventEmitter.emit('netWorkStatue', isConnected);
	};

	componentDidMount() {
		NetInfo.isConnected.fetch().done((isConnected) => {
			if (isConnected) {
				Global.netWorkStatus_old = true;
			} else {
				Global.netWorkStatus_old = false;
			}
		});

		//参数赋给全局
		Global.basicParam.ticket = this.state.ticket;
		Global.basicParam.uuId = this.state.uuid;
		Global.basicParam.userId = this.state.basic.userId;
		Global.parseBasicParam = '&ticket=' + this.state.ticket + '&uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId;
		Global.loginUserInfo = this.state.basic;

		//监听网络状态
		if (ListenerUtil["Foot"]["Foot_NetListener"]) {
			ListenerUtil["Foot"]["Foot_NetListener"].remove();
		}
		ListenerUtil["Foot"]["Foot_NetListener"] = NetInfo.isConnected.addEventListener(
			'connectionChange',
			(data) => {
				Global.netWorkStatus_new = data;
				NetInfo.getConnectionInfo().then((connectionInfo) => {
					this.handleFirstConnectivityChange(data, connectionInfo.type);
				});

			});

		// this._getCurrentState();
		//if(Platform.OS == 'android'){
		this.appStateLis = AppState.addEventListener('change', this._handleAppStateChange);
		//}
		Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
			this.setState({
				newMeesageTab: data ? data : 0
			})
		});

		if (Platform.OS == 'android') {
			if (ListenerUtil["Foot"]["Foot_XmppdisconnectListener"]) {
				ListenerUtil["Foot"]["Foot_XmppdisconnectListener"].remove();
			}
			ListenerUtil["Foot"]["Foot_XmppdisconnectListener"] = XMPP.on('disconnect', (exception) => {
				DeviceEventEmitter.emit('headTitle', "消息(未连接)");
				connentStatus = false;
				tmpFlag = false;
				this.netWorkPing();//判断网络状况
			});
			if (ListenerUtil["Foot"]["Foot_XmppConnectListener"]) {
				ListenerUtil["Foot"]["Foot_XmppConnectListener"].remove();
			}
			ListenerUtil["Foot"]["Foot_XmppConnectListener"] = XMPP.on('connect', (message) => {})
			/**
			 * XMPP异常监听
			 */
			if (ListenerUtil["Foot"]["Foot_XmppErrorListener"]) {
				ListenerUtil["Foot"]["Foot_XmppErrorListener"].remove();
			}
			ListenerUtil["Foot"]['Foot_XmppErrorListener'] = XMPP.on('error', (exception) => {
				connentStatus = false;
				tmpFlag = false;
				DeviceEventEmitter.emit('headTitle', "未连接");
			});
			/**
			 * XMPP登录失败监听
			 */
			if (ListenerUtil["Foot"]['Foot_XmpploginErrorListener']) {
				ListenerUtil['Foot_XmpploginErrorListener'].remove();
			}
			ListenerUtil["Foot"]['Foot_XmpploginErrorListener'] = XMPP.on('loginError', (message) => {
				connentStatus = false;
				tmpFlag = false;
				DeviceEventEmitter.emit('headTitle', "未连接");
				this.netWorkPing();
			});
			/**
			 * XMPP普通消息监听
			 */
			if (ListenerUtil["Foot"]['Foot_XmppMessageListener']) {
				ListenerUtil["Foot"]['Foot_XmppMessageListener']
			}
			ListenerUtil["Foot"]['Foot_XmppMessageListener'] = XMPP.on('message', (message) => this._loadMessageToDB(message));
			/**
			 * XMPP登录成功监听
			 */
			if (ListenerUtil["Foot"]['Foot_XmpploginListener']) {
				ListenerUtil["Foot"]['Foot_XmpploginListener'].remove();
			}
			ListenerUtil["Foot"]['Foot_XmpploginListener'] = XMPP.on('login', (message) => {
				Global.isReconnectXMPP = false;
				XMPP.sendStanza(XmlUtil.loginStatus());
				let tempIq = '<iq xmlns="jabber:client" from="' + this.state.basic.jidNode + '@' + Path.xmppDomain + '/' + this.state.basic.jidNode + '" id="' + UUIDUtil.getUUID() + '" type="set"><enable xmlns="urn:xmpp:carbons:2"/></iq>'
				XMPP.sendStanza(tempIq);
				if (!connentStatus) {
					connentStatus = true;
					if (this.state.groupList.length > 0) {
						let roomJids = "";
						this.state.groupList.map((item, index) => {
							Global.groupMute[item.roomJid] = item.mute;
							if (roomJids != "") {
								roomJids += ",";
							}
							roomJids += item.roomJid + Path.xmppGroupDomain;
						});
						XMPP.joinRoomNewThread(roomJids, this.state.basic.jidNode);
					}
					DeviceEventEmitter.emit('getOfflineMessage', "消息");
				}
				DeviceEventEmitter.emit('headTitle', "消息");
			});

			/**
			 * XMPP presence消息监听
			 */
			if (ListenerUtil['Foot_XmppPresenceListener']) {
				ListenerUtil["Foot"]['Foot_XmppPresenceListener'].remove();
			}
			ListenerUtil["Foot"]['Foot_XmppPresenceListener'] = XMPP.on('presence', (message) => {
				this._presenceCallBack(message);
			});
		} else {
			//ios监听
			//更改头像监听
			if (this.updateHeadImage) {
				this.updateHeadImage.remove();
			}
			this.updateHeadImage = DeviceEventEmitter.addListener('updateheadImagePresenceToRN', (params) => {
				Global.personnel_photoId[params.userid] = params.newphotoId;
				if (params.userid == this.state.basic.jidNode) {
					//pc同步个人头像更新
					let tempBasic = this.state.basic;
					tempBasic.photoId = params.newphotoId;
					this.setState({
						basic: tempBasic
					}, () => {
						DeviceEventEmitter.emit('refUserInfo');//更新个人头像
						Sqlite.selectTalkers(this.state.basic.userId, params.userid, (data) => {
							if (data.length > 0) {
								// else {
								let url = Path.setting + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&currentUid=' + this.state.basic.uid + '&jidNode=' + params.userid;
								FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
									if (responseJson.code.toString() == '200') {
										let tmpDetail = responseJson.data;
										Sqlite.updateTalkerName(this.state.basic.userId, 1, tmpDetail.jid, tmpDetail.jidNode, tmpDetail.trueName, params.newphotoId, false, false, false, () => {
											DeviceEventEmitter.emit('refreshPage');
										});
									}
								});
							} else {

							}
						});
					})
				} else {
					DeviceEventEmitter.emit('refUserInfo');//更新个人头像
					Sqlite.selectTalkers(this.state.basic.userId, params.userid, (data) => {
						if (data.length > 0) {
							// else {
							let url = Path.setting + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&currentUid=' + this.state.basic.uid + '&jidNode=' + params.userid;
							FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
								if (responseJson.code.toString() == '200') {
									let tmpDetail = responseJson.data;
									Sqlite.updateTalkerName(this.state.basic.userId, 1, tmpDetail.jid, tmpDetail.jidNode, tmpDetail.trueName, params.newphotoId, false, false, false, () => {
										DeviceEventEmitter.emit('refreshPage');
									});
								}
							});
						} else {

						}
					});
				}
			});

			//iosXMPP断开连接回调
			if (this.XMPPReconnnect) {
				this.XMPPReconnnect.remove();
			}
			this.XMPPReconnnect = DeviceEventEmitter.addListener('XMPPReconnnect', (params) => {
				DeviceEventEmitter.emit('headTitle', "消息(未连接)");
				Global.iosXmppIsConnect = false;
				this.reconnectXMPP_new();
				// this.reconnectXMPP()
			});
			//监听单聊发送消息
			if (this.messageSendNotification) {
				this.messageSendNotification.remove();
			}
			this.messageSendNotification = DeviceEventEmitter.addListener('messageSendToRN', (messageBody) => {
				let mesbody = {};
				mesbody['body'] = messageBody;
				//this._loadMessageToDB(mesbody);
				this._presenceCallBack(mesbody);
			});
			//监听单聊接收消息
			if (this.messageReceiveNotification) {
				this.messageReceiveNotification.remove();
			}
			this.messageReceiveNotification = DeviceEventEmitter.addListener('messageReceiveToRN', (messageBody) => {


				this._loadMessageToDB(messageBody);
				this._presenceCallBack(messageBody);

			});
			//监听群聊
			if (this.iqDetailNotification) {
				this.iqDetailNotification.remove();
			}
			this.iqDetailNotification = DeviceEventEmitter.addListener('groupMessageToRN', (messageBody) => {

				// let mesbody = {};
				// mesbody['body'] = messageBody;

				this._loadMessageToDB(messageBody);

				this._presenceCallBack(messageBody);

			});
		}
		this.resetEvent = DeviceEventEmitter.addListener('resetTabNum', () => {
			this.resetTabNum();
		});
		if (this.changeFoot) {
			this.changeFoot.remove();
		}
		this.changeFoot = DeviceEventEmitter.addListener('changeFoot', (type) => {
			this.changeRouter(type);
		});
		if (this.changeRoute) {
			this.changeRoute.remove();
		}
		this.changeRoute = DeviceEventEmitter.addListener('changeRoute', (nowRoute) => {
			this.setState({
				nowPage: nowRoute.routeName
			})
		});
		if (this.footBackKey) {
			this.footBackKey.remove();
		}
		this.footBackKey = BackHandler.addEventListener("back", () => {
			let routeName = this.state.nowPage;
			if (routeName.indexOf('Index') != -1 || routeName.indexOf('Login') != -1 || routeName.indexOf('Home') != -1) {
				return true;
			} else {
				return false;
			}
		});
		if (this.changeLoading) {
			this.changeLoading.remove();
		}
		this.changeLoading = DeviceEventEmitter.addListener('changeLoading', (isShow) => {
			this.setState({
				isLoading: isShow == 'true' ? true : false
			})
		});
		//第一、二层通讯录监听
		if (this.fetchAddressListener) {
			this.fetchAddressListener.remove();
		}
		this.fetchAddressListener = DeviceEventEmitter.addListener('userListListener', (params) => {

			let url = Path.address + '?uuId=' + params.uuid + '&ticket=' + params.ticket + '&userId=' + params.userId + '&deptId=' + params.deptId + '&realId=' + params.realId + '&version=' + params.version;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson.code.toString() == '200') {
					let tempParams = JSON.parse(responseJson.data);
					let i = 0;

					let length = 0;
					if (tempParams.dept.code.toString() == '200' && tempParams.dept.original.toString() == '0') {
						length += tempParams.dept.addDeptInfo.length + tempParams.dept.updateDeptInfo.length + tempParams.dept.deleteDeptInfo.length;
					} else if (tempParams.dept.code.toString() == '200' && tempParams.dept.original.toString() == '1') {
						length += tempParams.dept.originalDeptInfo.length;
					}
					if (tempParams.user.code.toString() == '200' && tempParams.user.original.toString() == '0') {
						length += tempParams.user.addUserInfo.length + tempParams.user.updateUserInfo.length + tempParams.user.deleteUserInfo.length;
					} else if (tempParams.user.code.toString() == '200' && tempParams.user.original.toString() == '1') {
						length += tempParams.user.originalUserInfo.length;
					}
					//保存部门信息
					if (tempParams.dept.code.toString() == '200' && tempParams.dept.original.toString() == '0') {
						//通讯录部门变化

						if (tempParams.dept.add.toString() == '1') {
							tempParams.dept.addDeptInfo.map((item, index) => {

								Sqlite.saveDepartment(this.state.basic.userId, item.branchNo, item.branchName, item.parentNo, () => {
									i++;

									this.checkCall(i, length, tempParams.deptId, tempParams.version);
								});
							});
						}
						if (tempParams.dept.update.toString() == '1') {
							tempParams.dept.updateDeptInfo.map((item, index) => {

								Sqlite.updateDepartment(this.state.basic.userId, item.branchNo, item.branchName, item.parentNo, () => {
									i++;

									this.checkCall(i, length, tempParams.deptId, tempParams.version);
								});
							});
						}
						if (tempParams.dept.delete.toString() == '1') {
							tempParams.dept.deleteDeptInfo.map((item, index) => {

								Sqlite.deleteDepartment(this.state.basic.userId, item.branchNo, () => {
									i++;

									this.checkCall(i, length, tempParams.deptId, tempParams.version);
								});
							});
						}
					} else if (tempParams.dept.code.toString() == '200' && tempParams.dept.original.toString() == '1') {
						//通讯录部门原始数据
						tempParams.dept.originalDeptInfo.map((item, index) => {
							Sqlite.saveDepartment(this.state.basic.userId, item.branchNo, item.branchName, item.parentNo, () => {
								i++;
								this.checkCall(i, length, tempParams.deptId, tempParams.version);
							});
						});

					}
					//保存人员信息
					if (tempParams.user.code.toString() == '200' && tempParams.user.original.toString() == '0') {
						//通讯录部门变化
						if (tempParams.user.add.toString() == '1') {
							tempParams.user.addUserInfo.map((item, index) => {

								let userOjb = {
									department_id: tempParams.deptId,//所属部门id
									jid_node: item.jidNode,//人员jidNode
									user_id: item.userId,//人员userId
									true_name: item.trueName,//真实姓名
									nick_name: item.userName,//昵称
									notes_name: '',//备注名称
									is_contacts: item.commonStatus != '' && item.commonStatus == '1' ? 1 : 0,//是否为常用联系人 0-否 1-是
									label: '',//分组
									phone: '',//电话
									email: '',//邮箱
									sex: 0,//性别 0-女，1-男
									head_photo_name: item.photoId,//头像名称
									notes_initial: '',//备注首字母
									is_details: 0//是否已经获取详情 0-未获取，1-已获取
								};
								Sqlite.saveUser(this.state.basic.userId, userOjb, () => {
									i++;
									this.checkCall(i, length, tempParams.deptId, tempParams.version);
								})
							});
						}
						if (tempParams.user.update.toString() == '1') {
							tempParams.user.updateUserInfo.map((item, index) => {

								let userOjb = {
									department_id: tempParams.deptId,//所属部门id
									jid_node: item.jidNode,//人员jidNode
									user_id: item.userId,//人员userId
									true_name: item.trueName,//真实姓名
									nick_name: item.userName,//昵称
									notes_name: '',//备注名称
									is_contacts: item.commonStatus != '' && item.commonStatus == '1' ? 1 : 0,//是否为常用联系人 0-否 1-是
									label: '',//分组
									phone: '',//电话
									email: '',//邮箱
									sex: 0,//性别 0-女，1-男
									head_photo_name: item.photoId,//头像名称
									notes_initial: '',//备注首字母
									is_details: 0//是否已经获取详情 0-未获取，1-已获取
								};
								Sqlite.saveUser(this.state.basic.userId, userOjb, () => {
									i++;
									this.checkCall(i, length, tempParams.deptId, tempParams.version);
								})
							});
						}
						if (tempParams.user.delete.toString() == '1') {
							tempParams.user.deleteUserInfo.map((item, index) => {

								Sqlite.deleteUser(this.state.basic.userId, item.userId, () => {
									i++;

									this.checkCall(i, length, tempParams.deptId, tempParams.version);
								});
							});
						}
					} else if (tempParams.user.code.toString() == '200' && tempParams.user.original.toString() == '1') {
						tempParams.user.originalUserInfo.map((item, index) => {
							//人员入库
							let userOjb = {
								department_id: tempParams.deptId,//所属部门id
								jid_node: item.jidNode,//人员jidNode
								user_id: item.userId,//人员userId
								true_name: item.trueName,//真实姓名
								nick_name: item.userName,//昵称
								notes_name: '',//备注名称
								is_contacts: item.commonStatus != '' && item.commonStatus == '1' ? 1 : 0,//是否为常用联系人 0-否 1-是
								label: '',//分组
								phone: '',//电话
								email: '',//邮箱
								sex: 0,//性别 0-女，1-男
								head_photo_name: item.photoId,//头像名称
								notes_initial: '',//备注首字母
								is_details: 0//是否已经获取详情 0-未获取，1-已获取
							};
							Sqlite.saveUser(this.state.basic.userId, userOjb, () => {
								i++;
								this.checkCall(i, length, tempParams.deptId, tempParams.version);
							});
						});
					}
				}
			})

		});
		//第三层通讯录树监听
		this.fetchAddressLastListener = DeviceEventEmitter.addListener('userLastListListener', (params) => {

			let url = Path.thrAddress + '?uuId=' + params.uuid + '&ticket=' + params.ticket + '&userId=' + params.userId + '&deptId=' + params.deptId + '&realId=' + params.realId + '&version=' + params.version;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson.code.toString() == '200') {
					let tempParams = JSON.parse(responseJson.data);
					let peamData = {
						tree: tempParams.tree,
						deptId: params.deptId
					};
					DeviceEventEmitter.emit('refAddressThirdList', peamData);
					if (tempParams.tree) {
						Sqlite.saveValue(this.state.basic.userId, 'tree_' + tempParams.deptId, JSON.stringify(tempParams.tree), () => {
							Sqlite.saveValue(this.state.basic.userId, 'userList_' + tempParams.deptId, tempParams.version, () => {
							});
						});
					}
				}
			})
		});
		//设置GroupId
		this.setGroupId = DeviceEventEmitter.addListener('setGroupId', (tempGroupId) => {
			groupId = tempGroupId;
		});
		//删除本地库监听
		this.delGroup = DeviceEventEmitter.addListener('delGroup', (groupId) => {
			Sqlite.deleteTalker(this.state.basic.userId, groupId, () => {
				Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
					this.setState({
						newMeesageTab: data ? data : 0
					})
				});
				DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
			})
		});
		//存个人photoId
		let photo = this.state.basic.photoId ? this.state.basic.photoId : null;
		//工作邀请红点
		this.workLis = DeviceEventEmitter.addListener('workNew', (param) => {
			this.setState({
				jobInvite: param == 'true' ? true : false
			})
		});
		//审核消息通知
		this.invNotice = DeviceEventEmitter.addListener('invNotice', (param) => {
		    //param.num：获取服务器传入
			this._getGroupInform(false, param.num);
		});
		//弹出框
		this.showFootAlert = DeviceEventEmitter.addListener('showFootAlert', (param) => {
			this.setState({
				isLoading: false
			}, () => {
				this._toast(param.msg);
			});

		});
		this.reconnectXMPP = DeviceEventEmitter.addListener('Foot_ReconnectXMPP', () => {
			this.reconnectXMPP_new();
		});
		cookie.save('selfPhotoId', photo);
	};

	//前后台切换监听
	_handleAppStateChange = (nextAppState) => {
		if (nextAppState != null && nextAppState == 'active') {
			//如果是true ，表示从后台进入了前台 ，请求数据，刷新页面。或者做其他的逻辑
			this.flage = false;
		} else if (nextAppState != null && nextAppState == 'background') {
			this.flage = true;
		}
		this._getCurrentState();//手势锁判断
	}

	//监听播放语音
	//播放/暂停语音播放
	playVoiceMessage = () => {
		if (playVoice) {
			playVoice = false;
			const s = new Sound('shake.wav', Sound.MAIN_BUNDLE, (e) => {
				if (e) {
					return;
				}
				//canPlay = false;
				s.play(() => s.release());
			});
		} else {
			setTimeout(() => {
			playVoice = true;
			}, 500);
		}
	};

	checkCall = (i, len, deptId, version) => {
		if (i == len) {
			Sqlite.saveValue(this.state.basic.userId, 'userList_' + deptId, version, () => {
				setTimeout(() => {
					if (deptId == '0') {
						DeviceEventEmitter.emit('updateAddress');//刷新通讯录页面
					} else {
						DeviceEventEmitter.emit('updateAddressSec');//刷录页面
					}
				}, 50);
			});
		}
	};

	_presenceCallBack = (message) => {
		if (message.ischange && message.ischange == 'true') {
			Global.personnel_photoId[message.userid] = message.newphotoid;
			// cookie.save(message.userid, message.newphotoid);
			if (message.userid == this.state.basic.jidNode) {
				//pc同步个人头像更新
				let tempBasic = this.state.basic;
				tempBasic.photoId = message.newphotoid;
				this.setState({
					basic: tempBasic
				}, () => {
					DeviceEventEmitter.emit('refUserInfo');//更新个人头像
					Sqlite.selectTalkers(this.state.basic.userId, (message.from).split('@')[0], (data) => {
						if (data.length > 0) {
							// else {
							let url = Path.setting + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&currentUid=' + this.state.basic.uid + '&jidNode=' + message.userid;
							FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
								if (responseJson.code.toString() == '200') {
									let tmpDetail = responseJson.data;
									Sqlite.updateTalkerName(this.state.basic.userId, 1, tmpDetail.jid, tmpDetail.jidNode, tmpDetail.trueName, message.newphotoid, false, false, false, () => {
										DeviceEventEmitter.emit('refreshPage');
									});
								}
							});
						} else {

						}
					});
				})
			} else {
				DeviceEventEmitter.emit('refUserInfo');//更新个人头像
				Sqlite.selectTalkers(this.state.basic.userId, (message.from).split('@')[0], (data) => {
					if (data.length > 0) {
						// else {
						let url = Path.setting + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&currentUid=' + this.state.basic.uid + '&jidNode=' + message.userid;
						FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
							if (responseJson.code.toString() == '200') {
								let tmpDetail = responseJson.data;
								Sqlite.updateTalkerName(this.state.basic.userId, 1, tmpDetail.jid, tmpDetail.jidNode, tmpDetail.trueName, message.newphotoid, false, false, false, () => {
									DeviceEventEmitter.emit('refreshPage');
								});
							}
						});
					} else {

					}
				});
			}


		}
		if (message.type == 'subscribe' && message.status == 'back') {
			DeviceEventEmitter.emit('refreshFriendList');
		}

	};


	componentWillUnmount() {
		AppState.removeEventListener('change', this._getCurrentState);

		if (Platform.OS == 'ios') {
			this.XMPPReconnnect.remove();
			this.messageSendNotification.remove();
			this.messageReceiveNotification.remove();
			this.iqDetailNotification.remove();
			this.updateHeadImage.remove();
		}

		this.resetEvent.remove();
		this.setGroupId.remove();
		this.changeFoot.remove();
		this.changeRoute.remove();
		this.fetchAddressListener.remove();
		this.fetchAddressLastListener.remove();
		this.footBackKey.remove();
		this.delGroup.remove();
		this.workLis.remove();
		this.showFootAlert.remove();
		this.reconnectXMPP.remove();
	}

	//清空数据库未读条数方法
	resetTabNum = () => {
		//查询数据库未读条数后，修改tabnum
		Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
			this.setState({
				newMeesageTab: data
			})
		})
	};
	//控制foot显示和隐藏
	// resetTabBar = (isHide) => {
	//     if (isHide) {
	//         this.setState({
	//             hideBar: isHide
	//         })
	//     } else {
	//         this.setState({
	//             hideBar: isHide
	//         })
	//     }
	// };


	/** 监听到启用群组的结点消息后，出席当前启用的群组，并且刷新群详情也面*/
	iOS_receiveOpenGroupNode = (tempMsgInfo) => {
		//收到启用后主动出席
		XMPP.XMPPMapgroupes(
			{
				'roomJid': tempMsgInfo.roomjid,
				'account': this.state.basic.jidNode
			},
			(error, event) => {
				if (error) {
					this._toast(error);
				} else {
					let url = Path.getGroupDetailNew + '?roomJid=' + tempMsgInfo.roomjid + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
					FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
						if (responseJson.code.toString() == '200' && responseJson.status) {
							let tmpDetail = responseJson.data;
							Sqlite.saveTalker(
								this.state.basic.userId,
								2,
								'',
								tempMsgInfo.roomjid,
								tmpDetail.roomName,
								tmpDetail.photoId,
								false,
								false,
								false,
								() => {
									Sqlite.saveMessage(this.state.basic.userId, tempMsgInfo.roomjid, 'text', tmpDetail.userName + '取消了禁用', '', '-1', null, (data) => {
										DeviceEventEmitter.emit('refreshPage', 'refresh');
										//更新离线时间
										Sqlite.saveOfflineTime(this.state.basic.userId, tempMsgInfo.roomjid, message.st);
									});
								}
							);
						}
					});
				}
			});
	}

	/** 监听到当前登录人被踢出，或者主动退群，所在群被禁用时，进行离开当前被操作的群组*/
	iOS_leaveCurrentGroup = (tempMsgInfo) => {
		let tempEffectId = '';//移除群，被踢，群禁用的作用id
		if (tempMsgInfo.mode == 'OWNLEAVE') {
			tempEffectId = tempMsgInfo.active;
		} else {
			tempEffectId = tempMsgInfo.effect;
		}

		if (tempMsgInfo.mode == 'SETLEAVE' || tempMsgInfo.mode == 'DISABLEGROUP') {

			if (tempEffectId == this.state.basic.jidNode) {
				//离开房间
				XMPP.initiativeLeaveGroup(
					{
						'roomJid': tempMsgInfo.roomjid,
						'peopleId': this.state.basic.jidNode,
						'id': UUIDUtil.getUUID().replace(/\-/g, '')

					},
					(error, event) => {
						if (error) {
							this._toast(error);

						} else {

							//群聊
							Sqlite.selectTalkers(this.state.basic.userId, tempMsgInfo.roomjid, (data) => {
								if (data.length > 0) {

									Sqlite.deleteTalker(this.state.basic.userId, tempMsgInfo.roomjid, () => {
										Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
											this.setState({
												newMeesageTab: data ? data : 0
											})
										});
										Global.groupMute[tempMsgInfo.roomjid] = "0";
										DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
									})
								}
							});
						}
					})
			}
		}
	}

	/** ios处理结点消息*/
	receiveiOSNodeMessage = (tempMsgInfo) => {

		//监听到主动加入时，通知提醒
		if (tempMsgInfo.mode == 'join' && tempMsgInfo.applicant != Global.loginUserInfo.jidNode) {
			let params = {
				occupantJid: this.state.basic.jidNode,
				pageNum: 1,
				pageSize: Path.pageSize
			};
			FetchUtil.netUtil(Path.receivedJobs, params, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, (responseJson) => {
				console.log("voice   "+responseJson);
				this._getGroupInform(true, responseJson.data.noticeNum);
			});
		}

		if (tempMsgInfo.mode == 'CREATE_ROOM' || tempMsgInfo.mode == 'JOIN_ROOM') {
			DeviceEventEmitter.emit('refreshPage', 'refresh');
		}

		//监听到启用群组并且操作人不是当前登录用户时调用
		if (tempMsgInfo.mode == 'OPENGROUP' && tempMsgInfo.active != this.state.basic.jidNode) {
			this.iOS_receiveOpenGroupNode(tempMsgInfo);
		}

		//监听到当前登录人被踢出，或者主动退群，所在群被禁用时调用
		if (tempMsgInfo.mode == 'OWNLEAVE' || tempMsgInfo.mode == 'SETLEAVE' || tempMsgInfo.mode == 'DISABLEGROUP') {
			this.iOS_leaveCurrentGroup(tempMsgInfo);
		}

		if (tempMsgInfo && tempMsgInfo.mode == 'WORKINVITATION' && tempMsgInfo.occupantJid != this.state.basic.jidNode) {
			this.setState({
				jobInvite: true
			})
		}

		if (tempMsgInfo && tempMsgInfo.mode == 'SETMUTE' && tempMsgInfo.effect == this.state.basic.jidNode) {
			Global.groupMute[tempMsgInfo.roomjid] = "1";
		}

		if (tempMsgInfo && tempMsgInfo.mode == 'SETUNMUTE' && tempMsgInfo.effect == this.state.basic.jidNode || (tempMsgInfo && tempMsgInfo.mode == 'SETOWNER' && tempMsgInfo.effect == this.state.basic.jidNode)) {
			Global.groupMute[tempMsgInfo.roomjid] = "0";
		}

	}

	/** 接收到IOS普通私聊消息*/
	receiveiOSGeneralPrivateChatMessage = (message) => {
		let item = message;
		let body = typeof item.body == 'string' ? JSON.parse(message.body) : message.body;
		if (item.to.indexOf(item.from) != -1) {
			//包含转发
			//单聊
			Sqlite.selectTalkers(this.state.basic.userId, body.basic.toId, (data) => {
				let messageType = '';
				let msgContent = '';
				if ((body.type + '') && ((body.type + '') == '0' || (body.type + '') == '3')) {
					messageType = 'text';
					msgContent = HtmlUtil.htmlDecodeByRegExp(body.content.interceptText);
				} else if (body.type && body.type == '2') {
					if (body.content.file[0].listFileInfo[0].showPic == 'img') {
						messageType = 'image';
					} else if (body.content.file[0].listFileInfo[0].showPic == 'audio') {
						messageType = 'voice';
					} else {
						messageType = 'file';
					}
				}
				let tempType = messageType;
				if (data.length > 0) {
					Sqlite.saveMessage(this.state.basic.userId, body.basic.toId, tempType, msgContent, '', body.id, null, (data) => {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
						if (body.basic.fromId != this.state.basic.jidNode && groupId != body.basic.fromId) {
							this.playVoiceMessage();//正常消息，播放语音
							this.setState({
								newMeesageTab: this.state.newMeesageTab + 1
							});
							Sqlite.updateTalker(this.state.basic.userId, body.basic.fromId, 1, false, null, false, () => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							});
						}
					});
				} else {
					let url = Path.setting + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&currentUid=' + this.state.basic.uid + '&jidNode=' + body.basic.toId;
					FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
						let tempDetail = responseJson.data;
						let tempType = (body.type == 0 || body.content.type == '0' || body.content.type == 'text') ? 'text' : body.messageType;
						Sqlite.saveTalker(
							//userId,type,jid,jid_nade,trueName,imageName,callback
							this.state.basic.userId,
							1,
							body.basic.toId + '@' + Path.xmppDomain,
							body.basic.toId,
							tempDetail.trueName,
							tempDetail.photoId,
							false,
							false,
							false,
							() => {
								Sqlite.saveMessage(this.state.basic.userId, body.basic.toId, tempType, msgContent, '', body.id, null, (data) => {
									DeviceEventEmitter.emit('refreshPage', 'refresh');
									if (body.basic.fromId != this.state.basic.jidNode && groupId != body.basic.fromId) {
										this.playVoiceMessage();//正常消息，播放语音
										this.setState({
											newMeesageTab: this.state.newMeesageTab + 1
										});
										Sqlite.updateTalker(this.state.basic.userId, body.basic.fromId, 1, false, null, false, () => {
											DeviceEventEmitter.emit('refreshPage', 'refresh');
										});
									}
								});
							}
						);
					})
				}
			});
		} else {
			//单聊
			Sqlite.selectTalkers(this.state.basic.userId, body.basic.fromId, (data) => {
				let messageType = '';
				let msgContent = '';
				if ((body.type + '') && ((body.type + '') == '0' || (body.type + '') == '3')) {
					messageType = 'text';
					msgContent = HtmlUtil.htmlDecodeByRegExp(body.content.interceptText);
				} else if (body.type && body.type == '2') {
					if (body.content.file[0].listFileInfo[0].showPic == 'img') {
						messageType = 'image';
					} else if (body.content.file[0].listFileInfo[0].showPic == 'audio') {
						messageType = 'voice';
					} else {
						messageType = 'file';
					}
				}
				let tempType = messageType;
				if (data.length > 0) {
					Sqlite.saveMessage(this.state.basic.userId, body.basic.fromId, tempType, msgContent, '', body.id, null, (data) => {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
						if (body.basic.fromId != this.state.basic.jidNode && groupId != body.basic.fromId) {
							this.playVoiceMessage();//正常消息，播放语音
							this.setState({
								newMeesageTab: this.state.newMeesageTab + 1
							});
							Sqlite.updateTalker(this.state.basic.userId, body.basic.fromId, 1, false, null, false, () => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							});
						}
					});
				} else {
					let tempType = (body.type == 0 || body.content.type == '0' || body.content.type == 'text') ? 'text' : body.messageType;
					Sqlite.saveTalker(
						//userId,type,jid,jid_nade,trueName,imageName,callback
						this.state.basic.userId,
						1,
						body.basic.fromId + '@' + Path.xmppDomain,
						body.basic.fromId,
						body.basic.userName,
						body.basic.photoId,
						false,
						false,
						false,
						() => {
							Sqlite.saveMessage(this.state.basic.userId, body.basic.fromId, tempType, msgContent, '', body.id, null, (data) => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
								if (body.basic.fromId != this.state.basic.jidNode && groupId != body.basic.fromId) {
									this.playVoiceMessage();//正常消息，播放语音
									this.setState({
										newMeesageTab: this.state.newMeesageTab + 1
									});
									Sqlite.updateTalker(this.state.basic.userId, body.basic.fromId, 1, false, null, false, () => {
										DeviceEventEmitter.emit('refreshPage', 'refresh');
									});
								}
							});
						}
					);
				}
			});
		}
	}

	/** 当前数据库可以查到当前聊天内容*/
	currentGroupMessageIsExist = (body, isanted, tempType, tempTo, msgContent, tempEffectId) => {
		if ((body.occupant && ((body.occupant.state == 'OWNLEAVE' || body.occupant.state == 'SETLEAVE') && tempEffectId == this.state.basic.jidNode)) || (body.occupant && body.occupant.state == 'DISABLEGROUP')) {
			//说明当前登录人被移出群组或主动退群
			//删除本地库数据

			if (body.occupant.state == 'SETLEAVE' || (body.occupant.state == 'DISABLEGROUP' && body.basic.userId != this.state.basic.jidNode)) {

				XMPP.initiativeLeaveGroup(
					{
						'roomJid': body.basic.groupId,
						'peopleId': this.state.basic.jidNode,
						'id': UUIDUtil.getUUID().replace(/\-/g, '')

					},
					(error, event) => {
						if (error) {
							this._toast(error);
						} else {

							Sqlite.deleteTalker(this.state.basic.userId, body.basic.groupId, () => {
								Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
									this.setState({
										newMeesageTab: data ? data : 0
									})
								});
								Global.groupMute[body.basic.groupId] = "0";
								DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
							})
						}
					})
			} else if (body.occupant.state == 'DISABLEGROUP' && body.basic.userId == this.state.basic.jidNode) {
				Sqlite.saveMessage(this.state.basic.userId, body.basic.groupId, tempType, msgContent, body.basic.userName, body.id, null, (data) => {
					DeviceEventEmitter.emit('refreshPage', 'refresh');
				});
			}
		} else {
			if (body.occupant && body.occupant.state == 'UPDATENAME') {
				let url = Path.getGroupDetailNew + '?roomJid=' + message.from.split('@')[0] + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
				FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
					if (responseJson.code.toString() == '200' && responseJson.status) {
						let tmpDetail = responseJson.data;
						// let tmpDetail = JSON.parse(responseJson.data).groupDetail;
						Sqlite.updateTalkerName(this.state.basic.userId, 2, tmpDetail.roomJid + Path.xmppGroupDomain, tmpDetail.roomJid, tmpDetail.roomName, tmpDetail.photoId, false, false, false, () => {
							DeviceEventEmitter.emit('refreshPage');
						});
					}
				});
			}
			//正常消息入库
			if (body.occupant) {
				if (body.occupant.state == '' || (body.occupant.state == 'DISABLEGROUP' && body.basic.userId == this.state.basic.jidNode) || (body.occupant.state == 'OWNLEAVE' && body.occupant.effect != this.state.basic.jidNode) || (body.occupant.state == 'INVITEJOINROOM' && body.basic.formId != this.state.basic.userId) || (body.occupant.state == 'INVITEJOINAUDITROON' && body.basic.formId != this.state.basic.userId) || (body.occupant.state == 'JOINNOTPASS' && body.basic.userId != this.state.basic.userId) || (body.occupant.state == 'SETLEAVE' && setLeaveFlag)) {
					//正常消息入库
					Sqlite.saveMessage(this.state.basic.userId, body.basic.groupId, tempType, msgContent, body.basic.userName, body.id, null, (data) => {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
						//如果监听到的消息不是我自己发的并且不是当前所在群，更新角标，播放声音
						if (body.basic.userId != this.state.basic.jidNode && groupId != body.basic.groupId) {
							if ((body.occupant.state == 'INVITEJOINROOM' || body.occupant.state == 'OPENGROUP' || body.occupant.state == 'INVITEJOINAUDITROON') && body.basic.formId != this.state.basic.userId) {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							} else {
								this.playVoiceMessage();//正常消息，播放语音
								this.setState({
									newMeesageTab: this.state.newMeesageTab + 1
								});
								//更新未读条数
								Sqlite.updateTalker(this.state.basic.userId, body.basic.groupId, 1, false, null, false, (data) => {
									DeviceEventEmitter.emit('refreshPage', 'refresh');
								});
								Sqlite.updateTalkerIsAnted(this.state.basic.userId, body.basic.groupId, isanted, () => {
									DeviceEventEmitter.emit('refreshPage', 'refresh');
								});
							}
						}
					});
				} else {
					//正常消息入库
					Sqlite.saveMessage(this.state.basic.userId, body.basic.groupId, tempType, msgContent, body.basic.userName, body.id, null, (data) => {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
						//如果监听到的消息不是我自己发的并且不是当前所在群，更新角标，播放声音
						if (body.basic.userId != this.state.basic.jidNode && groupId != body.basic.groupId) {

							this.playVoiceMessage();//正常消息，播放语音
							this.setState({
								newMeesageTab: this.state.newMeesageTab + 1
							});
							//更新未读条数
							Sqlite.updateTalker(this.state.basic.userId, body.basic.groupId, 1, false, null, false, (data) => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							});
							Sqlite.updateTalkerIsAnted(this.state.basic.userId, body.basic.groupId, isanted, () => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							});
						}

					});
				}
			} else {
				//正常消息入库
				Sqlite.saveMessage(this.state.basic.userId, body.basic.groupId, tempType, msgContent, body.basic.userName, body.id, null, (data) => {
					DeviceEventEmitter.emit('refreshPage', 'refresh');
					//如果监听到的消息不是我自己发的并且不是当前所在群，更新角标，播放声音
					if (body.basic.userId != this.state.basic.jidNode && groupId != body.basic.groupId) {
						this.playVoiceMessage();//正常消息，播放语音
						this.setState({
							newMeesageTab: this.state.newMeesageTab + 1
						});
						//更新未读条数
						Sqlite.updateTalker(this.state.basic.userId, body.basic.groupId, 1, false, null, false, (data) => {
							DeviceEventEmitter.emit('refreshPage', 'refresh');
						});
						Sqlite.updateTalkerIsAnted(this.state.basic.userId, body.basic.groupId, isanted, () => {
							DeviceEventEmitter.emit('refreshPage', 'refresh');
						});
					}
				});
			}
		}
	}

	/** 当前数据库查不到当前聊天内容*/
	currentGroupMessageIsNotExist = (body, isanted, tempType, tempTo, msgContent) => {
		if (body.occupant && (body.occupant.state == 'SETLEAVE' || (body.occupant.state == 'DISABLEGROUP' && body.basic.userId != this.state.basic.jidNode) || body.occupant.state == 'OWNLEAVE')) {

			//离开房间
			XMPP.initiativeLeaveGroup(
				{
					'roomJid': body.basic.groupId,
					'peopleId': this.state.basic.jidNode,
					'id': UUIDUtil.getUUID().replace(/\-/g, '')

				},
				(error, event) => {
					if (error) {
						this._toast(error);
					} else {
						// //删除本地库数据
						Sqlite.deleteTalker(this.state.basic.userId, body.basic.groupId, () => {
							Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
								this.setState({
									newMeesageTab: data ? data : 0
								})
							});
							Global.groupMute[body.basic.groupId] = "0";
							DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
						})
					}
				})

		} else {
			let url = Path.getGroupDetailNew + '?roomJid=' + body.basic.groupId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson.code.toString() == '200' && responseJson.status) {
					let tmp = responseJson.data;
					// let tmp = JSON.parse(responseJson.data).groupDetail;
					if ((body.occupant.state == 'INVITEJOINROOM' || body.occupant.state == 'JOINPASS') && body.occupant.effectJids.indexOf(this.state.basic.jidNode) != -1) {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
					} else {
						Sqlite.saveTalker(
							//userId,type,jid,jid_nade,trueName,imageName,callback
							this.state.basic.userId,
							2,
							'',
							body.basic.groupId,
							tmp.roomName,
							body.basic.head,
							false,
							false,
							body.isAt,
							() => {
								Sqlite.saveMessage(
									this.state.basic.userId,
									body.basic.groupId,
									tempType,
									msgContent,
									body.basic.userName,
									tmp.id, null,
									(data) => {
										DeviceEventEmitter.emit('refreshPage', 'refresh');
										//如果监听到的消息不是我自己发的并且不是当前所在群，更新角标，播放声音
										if (body.basic.userId != this.state.basic.jidNode && groupId != body.basic.groupId) {
											if ((body.occupant.state == 'INVITEJOINROOM' || body.occupant.state == 'OPENGROUP' || body.occupant.state == 'INVITEJOINAUDITROON') && body.basic.formId != this.state.basic.userId) {
												//DeviceEventEmitter.emit('refreshPage', 'refresh');
											} else {
												this.playVoiceMessage();//正常消息，播放语音
												this.setState({
													newMeesageTab: this.state.newMeesageTab + 1
												});
												//更新未读条数
												Sqlite.updateTalker(this.state.basic.userId, body.basic.groupId, 1, false, null, false, (data) => {
													DeviceEventEmitter.emit('refreshPage', 'refresh');
												});
												Sqlite.updateTalkerIsAnted(this.state.basic.userId, body.basic.groupId, isanted, () => {
													DeviceEventEmitter.emit('refreshPage', 'refresh');
												});
											}
										}
									}
								);
							}
						);
					}

				}
			});
		}
	}

	/** 接收到IOS普通群聊消息,并判断是否为@消息*/
	receiveiOSGeneralGroupChatMessage = (message, tempEffectId) => {
		let item = message;
		let body = typeof item.body == 'string' ? JSON.parse(message.body) : message.body;
		let isanted = false;
		let tempStr = new RegExp('@' + this.state.basic.trueName + '\\s');
		let tempStrAll = new RegExp('@全员\\s');
		if (body.content.interceptText != null) {
			if (tempStr.test(body.content.interceptText) || tempStrAll.test(body.content.interceptText)) {
				isanted = true;
			} else {
				isanted = false;
			}
		}

		let msgType = '';
		let msgContent = '';
		if (!body.basic.type || (body.basic.type && body.basic.type == 'groupChat')) {
			if ((body.type + '') && ((body.type + '') == '0' || (body.type + '') == '3')) {
				msgType = 'text';
				msgContent = HtmlUtil.htmlDecodeByRegExp(body.content.interceptText);
			} else if (body.type && body.type == '2') {
				if (body.content.file[0].listFileInfo[0].showPic == 'img') {
					msgType = 'image';
				} else if (body.content.file[0].listFileInfo[0].showPic == 'audio') {
					msgType = 'voice';
				} else {
					msgType = 'file';
				}
				msgContent = '';
			}
		} else {
			msgType = body.basic.type;
			msgContent = HtmlUtil.htmlDecodeByRegExp(body.content.title);
		}
		let tempType = msgType;
		let tempTo = message.to.split('@')[0];


		//更新离线时间
		Sqlite.saveOfflineTime(this.state.basic.userId, body.basic.groupId, message.st);

		//群聊
		Sqlite.selectTalkers(this.state.basic.userId, body.basic.groupId, (data) => {

			if (data.length > 0) {
				//数据库已存在聊天
				this.currentGroupMessageIsExist(body, isanted, tempType, tempTo, msgContent, tempEffectId);
			} else {
				//数据库未存在聊天
				this.currentGroupMessageIsNotExist(body, isanted, tempType, tempTo, msgContent);
			}
		});
	}

	_loadMessageToDB = (message) => {
		console.log(message);
		let tempEffectId = '';//移除群，被踢，群禁用的作用id
		let item = message;
		if (Platform.OS == 'ios') {

			//监听是否更改头像
			if (message.isUpdateGroupHeadImage == 'true') {
				Sqlite.selectTalkers(this.state.basic.userId, (message.from).split('@')[0], (data) => {
					if (data.length > 0) {
						// else {
						let url = Path.getGroupDetailNew + '?roomJid=' + message.from.split('@')[0] + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
						FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
							if (responseJson.code.toString() == '200' && responseJson.status) {
								let tmpDetail = responseJson.data;
								// let tmpDetail = JSON.parse(responseJson.data).groupDetail;
								Sqlite.updateTalkerName(this.state.basic.userId, 2, tmpDetail.roomJid + Path.xmppGroupDomain, tmpDetail.roomJid, tmpDetail.roomName, tmpDetail.photoId, false, false, false, () => {
									DeviceEventEmitter.emit('refreshPage');
								});
							}
						});
					}
				});
			}


			//当前消息非撤回消息
			if (item.isRemoveMsg == 'false') {
				//处理结点消息
				if (message.msgInfo) {
					if (message.msgInfo.mode == 'OWNLEAVE') {
						tempEffectId = message.msgInfo.active;
					} else {
						tempEffectId = message.msgInfo.effect;
					}
					this.receiveiOSNodeMessage(message.msgInfo);
				}

				//处理普通消息
				if (item.body) {
					//if (typeof item.body == 'string' && item.body.indexOf('{') != -1) {
					let body = typeof item.body == 'string' ? JSON.parse(message.body) : message.body;
					if (body == '') {

					} else {
						if (body.basic.type == 'privateChat') {
							//单聊普通消息
							this.receiveiOSGeneralPrivateChatMessage(message);
						} else {

							//监听到PC自己退群调用
							if (body.occupant && body.occupant.state == 'OWNLEAVE' && body.basic.userId == this.state.basic.jidNode) {
								Sqlite.deleteTalker(this.state.basic.userId, body.basic.groupId, () => {
									Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
										this.setState({
											newMeesageTab: data ? data : 0
										})
									});
									DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
								})
							}

							//群聊普通消息
							this.receiveiOSGeneralGroupChatMessage(message, tempEffectId);
						}
					}
					//}
				}
			} else {
				//消息为撤回消息
				if (message.from) {

					let removeJidNode;
					if (message.isforwarded == 'true') {
						removeJidNode = message.from.split('\@')[0];
					} else {
						removeJidNode = message.from.split('\/')[1];
					}

					if (message.from.indexOf('muc') == -1) {
						Sqlite.updateMessage(this.state.basic.userId, message.removeMsgId, '', 'text', removeJidNode == this.state.basic.jidNode ? '您撤回了一条消息' : '对方撤回了一条消息', () => {
							DeviceEventEmitter.emit('refreshPage', 'refresh');
						})
					} else {
						//群聊撤回
						Sqlite.updateMessage(this.state.basic.userId, message.removeMsgId, message.removeName, 'text', removeJidNode == this.state.basic.jidNode ? '您撤回了一条消息' : message.removeName + '：撤回了一条消息', () => {
							DeviceEventEmitter.emit('refreshPage', 'refresh');
						})
					}
				}
			}
		} else {
			let messageBody = (message.body && typeof message.body == 'string') ? (message.body.indexOf('{') != -1 ? JSON.parse(message.body) : null) : message.body;
			if (messageBody && messageBody.basic && messageBody.basic.type && messageBody.basic.type != 'privateChat') {
				/** 群聊普通消息处理（不包括撤回消息） **/
				this._groupGeneralMessage(message, messageBody);
			} else if (!messageBody && message.removeMsgId && message.from.indexOf('muc') != -1) {
				/** 群聊撤回消息处理 **/
				this._groupWithdrawMessage(message);
			} else if (!messageBody && !message.removeMsgId) {
				/** 群聊节点消息处理 **/
				this._groupSubscriptionMessage(message);
			} else if (messageBody && messageBody.basic && messageBody.basic.type && messageBody.basic.type == 'privateChat') {
				/** 私聊普通消息处理（不包括撤回消息） **/
				this._privateGeneralMessage(message, messageBody);
			} else if (!messageBody && message.removeMsgId && message.from.indexOf('muc') == -1) {
				/** 私聊撤回消息处理 **/
				this._privateWithdrawMessage(message);
			}
		}
	};
	/**
	 * 私聊普通消息
	 * @param message message完整信息
	 * @param messageBody message中的body字段 json对象类型
	 * @private
	 */
	_privateGeneralMessage = (message, messageBody) => {
		let messageType = '';//消息类型，用于本地数据库入库
		let msgContent = '';//消息内容，用于本地数据库入库
		if ((messageBody.type + '') && (messageBody.type + '') == '0') {
			messageType = 'text';
			msgContent = HtmlUtil.htmlDecodeByRegExp(messageBody.content.interceptText);
		} else if (messageBody.type && messageBody.type == '2') {
			if (messageBody.content.file[0].listFileInfo[0].showPic == 'img') {
				messageType = 'image';
			} else if (messageBody.content.file[0].listFileInfo[0].showPic == 'audio') {
				messageType = 'voice';
			} else {
				messageType = 'file';
			}
		}
		//获取本地私聊Talker
		this._getLocalPrivateTalker(message, messageBody, messageType, msgContent);
	};
	/**
	 * 私聊撤回消息
	 * @param message message完整信息
	 * @private
	 */
	_privateWithdrawMessage = (message) => {
		let removeJidNode = null;
		if (message.from) {
			removeJidNode = message.from.split('/')[1];
			if (!removeJidNode) {
				removeJidNode = message.from.split('@')[0];
			}
			let msgContent = (removeJidNode == this.state.basic.jidNode) ? '您撤回了一条消息' : '对方撤回了一条消息';
			Sqlite.updateMessage(this.state.basic.userId, message.removeMsgId, '', 'text', msgContent, () => {
				DeviceEventEmitter.emit('refreshPage', 'refresh');
			})
		}
	};
	/**
	 * 群聊普通消息
	 * @param message message完整信息
	 * @param messageBody message中的body字段 json对象类型
	 * @private
	 */
	_groupGeneralMessage = (message, messageBody) => {
		if (messageBody.basic.type == "announcement" || messageBody.basic.type == "activity" || messageBody.basic.type == "vote" || messageBody.basic.type == "topic") {
			/** 公告、活动、话题、投票 **/
			this._groupGeneralMessage_Extend(messageBody, message.st);
		}
		else if (messageBody.occupant && ((messageBody.occupant.state == 'DISABLEGROUP' && messageBody.basic.userId != this.state.basic.jidNode) || (messageBody.occupant.state == 'OWNLEAVE' && message.from.indexOf(this.state.basic.jidNode) != -1))) {
			/** 别人禁用群组普通消息、主动退群普通消息 **/
			this._leaveRoomAndDeleteTalker(messageBody);
		}
		else if (messageBody.occupant && (messageBody.occupant.state == 'INVITEJOINROOM' || messageBody.occupant.state == 'JOINPASS') && messageBody.occupant.effectJids && messageBody.occupant.effectJids.indexOf(this.state.basic.jidNode) != -1) {
			/** 自己被邀请入群普通消息 自己被同意入群普通消息 **/
			let resST = '';
			if (message.st) {
				resST = message.st;
			} else if (message.extenEl != '') {
				let time = JSON.parse(message.extenEl).delay.stamp;
				let n_time = new Date(time).toJSON();
				resST = new Date(new Date(+new Date(n_time) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '')).getTime() + 999;
			} else {
				//没有离线时间
			}
			Sqlite.saveOfflineTime(this.state.basic.userId, messageBody.basic.groupId, resST);
		}
		else if (messageBody.occupant && messageBody.occupant.state == 'OPENGROUP') {
			/** 自己启用群组消息 **/
			Sqlite.saveOfflineTime(this.state.basic.userId, messageBody.basic.groupId, message.st);
		} else {
			/** 文本、语音、图片、文件、除自己外的其它成员被移除群组 **/
			this._groupGeneralMessage_General(messageBody, message.st);
		}
	};
	/**
	 * 群聊一般消息（文本、语音、图片、文件）
	 * @param messageBody message中的body字段 json对象类型
	 * @param messageST message服务器入库时间
	 * @private
	 */
	_groupGeneralMessage_General = (messageBody, messageST) => {
		let isAnted = false;//该消息是否为@我的消息
		let tempStr = new RegExp('@' + this.state.basic.trueName + '\\s');//@我的正则匹配
		let tempStrAll = new RegExp('@全员\\s');//@全员的正则匹配
		//移动端普通文本消息使用字段为interceptText，该字段去除了PC端的h5标签元素
		if (messageBody.content.interceptText != null && (tempStr.test(messageBody.content.interceptText) || tempStrAll.test(messageBody.content.interceptText))) {
			isAnted = true;
		}
		let msgType = '';//消息类型，用于本地数据库入库
		let msgContent = '';//消息内容，用于本地数据库入库
		if (messageBody.type + "" && messageBody.type + "" == '0') {
			//文本消息
			msgType = 'text';
			msgContent = HtmlUtil.htmlDecodeByRegExp(messageBody.content.interceptText);
		} else if (messageBody.type + "" && messageBody.type + "" == '2') {//图片、语音、文件消息
			if (messageBody.content.file[0].listFileInfo[0].showPic == 'img') {
				//普通图片消息
				msgType = 'image';
			} else if (messageBody.content.file[0].listFileInfo[0].showPic == 'audio') {
				//普通语音消息
				msgType = 'voice';
			} else {
				//普通文件消息
				msgType = 'file';
			}
		}
		//查询本地数据库是否有记录
		this._getLocalGroupTalker(messageBody, msgType, msgContent, messageST, isAnted);

	}
	/**
	 * 群聊扩展消息（公告、活动、投票、话题）
	 * @param messageBody message中的body字段 json对象类型
	 * @param messageST message服务器入库时间
	 * @private
	 */
	_groupGeneralMessage_Extend = (messageBody, messageST) => {
		let isAnted = false;//该消息是否为@我的消息
		let msgType = messageBody.basic.type;//消息类型，用于本地数据库入库
		let msgContent = HtmlUtil.htmlDecodeByRegExp(messageBody.content.title);//消息内容，用于本地数据库入库
		//查询本地数据库是否有记录
		this._getLocalGroupTalker(messageBody, msgType, msgContent, messageST, isAnted);
	}
	/**
	 * 群聊撤回消息
	 * @param message message完整信息
	 * @private
	 */
	_groupWithdrawMessage = (message) => {
		let removeJidNode = null;
		if (message.from) {
			removeJidNode = message.from.split('/')[1];
			if (!removeJidNode) {
				removeJidNode = message.from.split('@')[0];
			}
			let msgContent = (removeJidNode == this.state.basic.jidNode) ? '您撤回了一条消息' : message.removeName + '：撤回了一条消息';
			Sqlite.updateMessage(this.state.basic.userId, message.removeMsgId, message.removeName, 'text', msgContent, () => {
				this._refreshMessageList(0, 0);
			})
		}
	}
	/**
	 * 群聊节点消息
	 * @param message
	 * @private
	 */
	_groupSubscriptionMessage = (message) => {
		let tempMsgInfo = message.msgInfo ? JSON.parse(message.msgInfo) : null;
		let tempEffectId = '';//移除群，被踢，群禁用的作用id
		if (tempMsgInfo && tempMsgInfo.mode == 'SETLEAVE') {
			//被移除群组消息
			tempEffectId = tempMsgInfo.effect;
			if (tempEffectId == this.state.basic.jidNode) {
				setLeaveFlag = false;
				//离开房间
				XMPP.leaveRoom(tempMsgInfo.roomjid + Path.xmppGroupDomain);
				Global.groupMute[tempMsgInfo.roomjid] = "0";
				//群聊
				Sqlite.selectTalkers(this.state.basic.userId, tempMsgInfo.roomjid, (data) => {
					if (data.length > 0) {
						Sqlite.deleteTalker(this.state.basic.userId, tempMsgInfo.roomjid, () => {
							Sqlite.selectUnreadMsgTatol(this.state.basic.userId, (data) => {
								this.setState({
									newMeesageTab: data ? data : 0
								})
							});
							Sqlite.deleteOfflineTime(this.state.basic.userId, tempMsgInfo.roomjid);
							DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
							DeviceEventEmitter.emit('refreshGroupList');//刷新group列表
						})
					}
				});
			}
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'DISABLEGROUP') {
			//禁用群组
			tempEffectId = tempMsgInfo.effect;
			//如果自己是群主，则不删除本地数据库记录
			if (tempEffectId == this.state.basic.jidNode) {
				setLeaveFlag = false;
				//离开房间
				XMPP.leaveRoom(tempMsgInfo.roomjid + Path.xmppGroupDomain);
				//查询本地记录
				Sqlite.selectTalkers(this.state.basic.userId, tempMsgInfo.roomjid, (data) => {
					if (data.length > 0) {
						//删除本地库数据
						Sqlite.deleteTalker(this.state.basic.userId, tempMsgInfo.roomjid, () => {
							DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
							DeviceEventEmitter.emit('refreshGroupList');//刷新group列表
						})
					}
				});
			}
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'INVITEJOINROOM' && this.state.basic.jidNode == tempMsgInfo.occupantJid) {
			//被邀请加入非审核群消息
			//为了传参发的
            XMPP.joinRoom(tempMsgInfo.roomjid + Path.xmppGroupDomain, this.state.basic.jidNode, 0);
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'JOINPASS' && tempMsgInfo.effect == this.state.basic.jidNode) {
			//被邀请加入审核群消息
			//为了传参发的
			let url = Path.getGroupDetailNew + '?roomJid=' + tempMsgInfo.roomjid + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson.code.toString() == '200' && responseJson.status) {
					let tmpDetail = responseJson.data;
					if (tmpDetail.banRoom == '0') {
						//收到邀请后主动出席
						XMPP.joinRoom(tempMsgInfo.roomjid + Path.xmppGroupDomain, this.state.basic.jidNode,0);
					}
				}
			});
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'OPENGROUP') {
			//启用群组消息
			//收到启用后主动出席
			XMPP.joinRoom(tempMsgInfo.roomjid + Path.xmppGroupDomain, this.state.basic.jidNode,0);
			let url = Path.getGroupDetailNew + '?roomJid=' + tempMsgInfo.roomjid + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson.code.toString() == '200' && responseJson.status) {
					let tmpDetail = responseJson.data;
					Sqlite.saveTalker(
						this.state.basic.userId,
						2,
						'',
						tempMsgInfo.roomjid,
						tmpDetail.roomName,
						tmpDetail.photoId,
						false,
						false,
						false,
						() => {
							Sqlite.saveMessage(this.state.basic.userId, tempMsgInfo.roomjid, 'text', tmpDetail.userName + '取消了禁用', '', '-1', null, (data) => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
								DeviceEventEmitter.emit('refreshGroupList');//刷新group列表
							});
						}
					);
				}
			});
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'join' && tempMsgInfo.applicant != Global.loginUserInfo.jidNode) {
			//审核入群通知消息
			//获取服务器num
			let params = {
                occupantJid: this.state.basic.jidNode,
                pageNum: 1,
                pageSize: Path.pageSize
            };
            FetchUtil.netUtil(Path.receivedJobs, params, 'POST', this.props.navigation, {
                    uuId: this.state.uuid,
                    ticket: this.state.ticket,
                    userId: this.state.basic.userId
            }, (responseJson) => {
                console.log("voice   "+responseJson);
                this._getGroupInform(true, responseJson.data.noticeNum);
            });
			//this._getGroupInform(true, 0);
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'WORKINVITATION' && tempMsgInfo.occupantJid != this.state.basic.jidNode) {
			this.setState({
				jobInvite: true
			})
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'SETMUTE' && tempMsgInfo.effect == this.state.basic.jidNode) {
			Global.groupMute[tempMsgInfo.roomjid] = "1";
		}
		else if (tempMsgInfo && (tempMsgInfo.mode == 'SETUNMUTE' || tempMsgInfo.mode == 'SETOWNER') && tempMsgInfo.effect == this.state.basic.jidNode) {
			Global.groupMute[tempMsgInfo.roomjid] = "0";
		}
		else if (tempMsgInfo && (tempMsgInfo.mode == 'CREATE_ROOM' || tempMsgInfo.mode == 'JOIN_ROOM')) {
			XMPP.joinRoom(tempMsgInfo.roomjid + Path.xmppGroupDomain, this.state.basic.jidNode,0);
		}
		else if (message.extenEl && message.extenEl.indexOf('{"changeinfo":{"xmlns":"jabber:client"}}') != -1) {
			/** 更新群头像和名称 **/
			let url = Path.getGroupDetailNew + '?roomJid=' + message.from.split('@')[0] + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson.code.toString() == '200' && responseJson.status) {
					let tmpDetail = responseJson.data;
					Sqlite.updateTalkerName(this.state.basic.userId, 2, tmpDetail.roomJid + '@muc.imserver', tmpDetail.roomJid, tmpDetail.roomName, tmpDetail.photoId, false, false, false, () => {
						DeviceEventEmitter.emit('refreshPage');
					});
				}
			});
		}
	}
	/**
	 * 刷新message页面列表，当前刷新标记数等于总计刷新标记数时，执行刷新方法
	 * @param currentNum 当前刷标记数
	 * @param totalNum 总计刷新标记数
	 * @private
	 */
	_refreshMessageList = (currentNum, totalNum) => {
		if (currentNum == totalNum) {
			DeviceEventEmitter.emit('refreshPage', 'refresh');
		}
	}
	/**
	 * 保存本地数据库私聊mesaage，并刷新消息列表
	 * @param messageBody message中的body字段 json对象类型
	 * @param tempType 消息类型：text-文本、image-图片、voice-语音、file-文件
	 * @param msgContent 消息内容：除文本类型消息外，其它都为空字符串
	 * @private
	 */
	_saveLocalPrivateMessage = (messageBody, tempType, msgContent, messageId, isSlef) => {
		Sqlite.saveMessage(this.state.basic.userId, messageId, tempType, msgContent, '', messageBody.id, typeof messageBody.content.sendTime == "string" ? ToolUtil.strToStemp(messageBody.content.sendTime) : messageBody.content.sendTime, (data) => {
			if (!isSlef && groupId != messageId) {
				this.setState({
					newMeesageTab: this.state.newMeesageTab + 1
				});
				Sqlite.updateTalker(this.state.basic.userId, messageId, 1, false, null, false, () => {
					this.playVoiceMessage();//正常消息，播放语音
					DeviceEventEmitter.emit('refreshPage', 'refresh');
				});
			} else {
				DeviceEventEmitter.emit('refreshPage', 'refresh');
			}
		});
	}
	/**
	 * 保存本地数据库群聊Message，并刷新消息列表
	 * @param messageBody message中的body字段 json对象类型
	 * @param msgType 消息类型：text-文本、image-图片、voice-语音、file-文件
	 * @param msgContent 消息内容：除文本类型消息外，其它都为空字符串
	 * @param messageST 消息在服务器的入库时间：时间戳
	 * @param isanted 该消息是否@我：ture/false
	 * @private
	 */
	_saveLocalGroupMessage = (messageBody, msgType, msgContent, messageST, isanted) => {
		Sqlite.saveMessage(this.state.basic.userId, messageBody.basic.groupId, msgType, msgContent, messageBody.basic.userName, messageBody.id, messageBody.basic.sendTime, (data) => {
			//如果监听到的消息不是我自己发的并且不是当前所在群，更新角标，播放声音
			let currentRefreshNum = 0, totalRefreshNum = 0;
			if (messageBody.basic.userId != this.state.basic.jidNode && groupId != messageBody.basic.groupId) {
				this.playVoiceMessage();//正常消息，播放语音
				this.setState({
					newMeesageTab: this.state.newMeesageTab + 1
				});
				totalRefreshNum = 2;
				//更新未读条数
				Sqlite.updateTalker(this.state.basic.userId, messageBody.basic.groupId, 1, false, null, false, (date) => {
					currentRefreshNum++;
					this._refreshMessageList(currentRefreshNum, totalRefreshNum);
				}, (err) => {
					currentRefreshNum++;
					this._refreshMessageList(currentRefreshNum, totalRefreshNum);
				});
				Sqlite.updateTalkerIsAnted(this.state.basic.userId, messageBody.basic.groupId, isanted, (date) => {
					currentRefreshNum++;
					this._refreshMessageList(currentRefreshNum, totalRefreshNum);
				}, (err) => {
					currentRefreshNum++;
					this._refreshMessageList(currentRefreshNum, totalRefreshNum);
				});
			} else {
				//更新群聊离线时间
				Sqlite.saveOfflineTime(this.state.basic.userId, messageBody.basic.groupId, messageST);
				this._refreshMessageList(0, 0);
			}
			//刷新消息列表
			// this._refreshMessageList(currentRefreshNum,totalRefreshNum);
		});
	}
	/**
	 * 保存本地数据库群通知Message，并刷新消息列表
	 * @param tempMsgInfo
	 * @private
	 */
	_saveLocalMessage_inform = (tempMsgInfo, num, coverFlag) => {
		Sqlite.saveMessage(this.state.basic.userId, Global.loginUserInfo.userId, 'text', '您有新的群申请待处理', '',
			tempMsgInfo.applicant + new Date().getTime(), null,
			(data) => {
				//更新角标，播放声音
				this.playVoiceMessage();//播放声音
				//更新未读条数
				Sqlite.updateTalkerNew(this.state.basic.userId, Global.loginUserInfo.userId, true, (data) => {
					//刷新消息列表
					this._refreshMessageList(0, 0);
				}, (err) => {
					//刷新消息列表
					this._refreshMessageList(0, 0);
				});
			}
		);
	}
	/**
	 * 获取本地数据库私聊Talker,本地存在时直接操作message，本地不存在时先生成新的talker
	 * @param messageBody
	 * @param msgType
	 * @param msgContent
	 * @private
	 */
	_getLocalPrivateTalker = (message, messageBody, messageType, msgContent) => {
		let talkerId = messageBody.basic.fromId;//本地talker的jidnode
		let talkerName = messageBody.basic.userName;//本地talker的名称
		let talkerPhotoId = messageBody.basic.photoId;//本地talker的头像id
		let isSlef = false;//是否为消息同步的标记
		if (messageBody.basic.fromId == this.state.basic.jidNode) {
			//自己发的同步消息
			talkerId = messageBody.basic.toId;
			isSlef = true;
		}
		//普通单聊
		Sqlite.selectTalkers(this.state.basic.userId, talkerId, (data) => {
			if (data.length > 0) {
				this._saveLocalPrivateMessage(messageBody, messageType, msgContent, talkerId, isSlef);
			} else if (data.length <= 0 && isSlef) {
				//本地没有数据，并且属于消息同步类消息
				let url = Path.setting + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&currentUid=' + this.state.basic.uid + '&jidNode=' + messageBody.basic.toId;
				FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
					talkerName = responseJson.data.trueName;
					talkerPhotoId = responseJson.data.photoId;
					Sqlite.saveTalker(
						this.state.basic.userId,
						1,
						talkerId + '@' + Path.xmppDomain,
						talkerId,
						talkerName,
						talkerPhotoId,
						false,
						false,
						false,
						() => {
							this._saveLocalPrivateMessage(messageBody, messageType, msgContent, talkerId, isSlef);
						}
					);
				});
			} else {
				Sqlite.saveTalker(
					this.state.basic.userId,
					1,
					talkerId + '@' + Path.xmppDomain,
					talkerId,
					talkerName,
					talkerPhotoId,
					false,
					false,
					false,
					() => {
						this._saveLocalPrivateMessage(messageBody, messageType, msgContent, talkerId, isSlef);
					}
				);
			}
		});
	}
	/**
	 * 获取本地数据库群聊Talker,本地存在时直接操作message，本地不存在时先生成新的talker
	 * @param messageBody message中的body字段 json对象类型
	 * @param msgType 消息类型：text-文本、image-图片、voice-语音、file-文件
	 * @param msgContent 消息内容：除文本类型消息外，其它都为空字符串
	 * @param messageST 消息在服务器的入库时间：时间戳
	 * @param isanted 该消息是否@我：ture/false
	 * @private
	 */
	_getLocalGroupTalker = (messageBody, msgType, msgContent, messageST, isanted) => {
		//查询本地数据库是否有记录
		Sqlite.selectTalkers(this.state.basic.userId, messageBody.basic.groupId, (data) => {
			if (data.length > 0) {
				this._saveLocalGroupMessage(messageBody, msgType, msgContent, messageST, isanted);
			} else {
				//获取群信息
				let url = Path.getGroupDetailNew + '?roomJid=' + messageBody.basic.groupId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
				FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
					if (responseJson.code.toString() == '200' && responseJson.data) {
						Sqlite.saveTalker(
							this.state.basic.userId,
							2,
							'',
							messageBody.basic.groupId,
							responseJson.data.roomName,
							messageBody.basic.head,
							false,
							false,
							messageBody.isAt,
							() => {
								this._saveLocalGroupMessage(messageBody, msgType, msgContent, messageST, isanted);
							}
						);
					}
				});
			}
		});
	}
	/**
	 * 获取群通知及入库
	 * @param isRalTime
	 * @param num
	 * @private
	 */
	 //num每一次都从服务器获取
	_getGroupInform = (isRalTime, num) => {
		Sqlite.selectTalkers(this.state.basic.userId, Global.loginUserInfo.userId, (data) => {
	        //已有talker,不入库 不更新时间与message
	        //没有talker时入库，保存时间message，saveTalker  saveMessage
	        //data.length为talker数
			let content = "";
			if(num===0){
			    content = "没有新消息";
			}else{
			    content = "您有新的群申请待处理";
			}
			if (data.length > 0) {

                Sqlite.saveMessage(this.state.basic.userId, Global.loginUserInfo.userId, 'text', content, '',
                    new Date().getTime(), null,
                    (data) => {
                        this._unreadAndVoice(isRalTime, isRalTime, num);
                    }
                );
			} else {
                if(num===0){
                }else{
                    Sqlite.saveTalker(this.state.basic.userId, 3, '', Global.loginUserInfo.userId, '通知', content,
                        false,
                        false,
                        false,
                        () => {
                            Sqlite.saveMessage(this.state.basic.userId, Global.loginUserInfo.userId, 'text', content, '',
                                new Date().getTime(), null,
                                (data) => {
                                    this._unreadAndVoice(isRalTime, isRalTime, num);
                                }
                            );
                        }
                    );
                }
			}
		});
	}
	/**
	 * 更新未读、播放声音、刷新列表
	 * @param isRalTime 是否为实时消息
	 * @param isPlayVoice 是否播放声音
	 * @param num 未读次数，当isRalTime为true时传0
	 * @private
	 */
	_unreadAndVoice = (isRalTime, isPlayVoice, num) => {
		isPlayVoice && this.playVoiceMessage();
        Sqlite.updateTalkerUnread(this.state.basic.userId, Global.loginUserInfo.userId, num, () => {
            //刷新消息列表
            this._refreshMessageList(num, num);
        });
	}
	/**
	 * 离开房间并删除本地数据
	 * @param messageBody
	 * @private
	 */
	_leaveRoomAndDeleteTalker = (messageBody) => {
		XMPP.leaveRoom(messageBody.basic.groupId + Path.xmppGroupDomain);//离开房间
		Global.groupMute[messageBody.basic.groupId] = "0";
		Sqlite.deleteTalker(this.state.basic.userId, messageBody.basic.groupId, () => {//删除本地库数据
			Sqlite.deleteOfflineTime(this.state.basic.userId, messageBody.basic.groupId);
			DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
		})
	}

	//配置路由跳转
	changeRouter(type) {
		this.setState({
			tab: type
		}, () => {
			DeviceEventEmitter.emit('isGetPopShow');//Group and Message PopShow
			if (type == 'message') {
				DeviceEventEmitter.emit('refreshPage');//刷新MessageList
			} else if (type == 'groups') {
				DeviceEventEmitter.emit('refreshGroupList');//刷新GroupList
			} else if (type == 'mine') {
				DeviceEventEmitter.emit('refUserInfo');//刷新GroupList
			}else if (type == 'friend') {
                DeviceEventEmitter.emit('refreshFriendList');//刷新FriendList
            }
		})
	}

	//判断设备锁启用start
	_getCurrentState = () => {
		if (Platform.OS == 'ios') {
			if (AppState.currentState == 'active') {//当前为前台

				//后台禁用群组之后返回前台
				if(Global.groupDisable[groupId]=='0'){
					Alert.alert(
						'提醒',
						'该群组已禁用!',
						[
							{
								text: '确定',
								onPress: () => {
									this.props.navigation.navigate('Index', {
										token: this.state.token,
										ticket: this.state.ticket,
										basic: this.state.tigUser,
										uuid: this.state.uuid,
										loginType: this.state.uuid//这里是为了不执行手势锁
									});
								},
							}
						],
						{cancelable: false}
					)
				}


				if (this.state.nowPage.indexOf('HandLock') != -1) {

				} else {
					cookie.get('isUpload').then((str) => {
						if (!str) {//前台时判断是否存入cookie“isUpload”，未存入判断是否弹出设备锁
							if (_appStatus && this.state.loginType == 'auto') {//如记录切换后台的时间执行开启设备锁
								cookie.get('modelInfor').then(res => {
									if (res.isStart != 0) {//已设置设备锁
										let nowSec = (new Date().getTime() - _appStatus) / 1000;//切换前台与后台相差的时间
										if (nowSec > Path.AppStateSeconds) {//判断时间超出限制
											if (res.lockType == 0 || res.lockType == 2) {//执行指纹锁优先
												this.touchUnLock(res);
											} else if (res.lockType == 1) {//仅设置手势锁
												this.handUnLock(res);
											}
										}
									}
								});
							}
							//更新redis
							RedisUtil.update(uuid, this.props.navigation, {
								ticket: this.state.ticket,
								userId: this.state.basic.userId,
								uuId: uuid
							}, 'lineStatus', 'front', () => {
								//设备当前为“前台”状态
							});
						} else {
							cookie.delete('isUpload');
						}
					});
				}

			} else if (AppState.currentState == 'background') {//当前为后台
				cookie.get('isUpload').then((str) => {
					if (!str) {//后台时判断是否存入cookie“isUpload”，未存入记录当前后台时间
						_appStatus = new Date().getTime();
						//更新redis
						RedisUtil.update(uuid, this.props.navigation, {
							ticket: this.state.ticket,
							userId: this.state.basic.userId,
							uuId: uuid
						}, 'lineStatus', 'back', () => {
							//设备当前为“后台”状态
						});
					}
				});
			}

		} else {
			if (AppState.currentState == 'active') {//当前为前台
                //后台禁用群组之后返回前台
			    if(Global.groupDisable[groupId]=='0'){
                    Alert.alert(
                        '提醒',
                        '该群组已禁用!',
                        [
                            {
                                text: '确定',
                                onPress: () => {
                                    this.props.navigation.navigate('Index', {
                                        token: this.state.token,
                                        ticket: this.state.ticket,
                                        basic: this.state.tigUser,
                                        uuid: this.state.uuid,
                                        loginType: this.state.uuid//这里是为了不执行手势锁
                                    });
                                },
                            }
                        ],
                        {cancelable: false}
                    )
			    }

				cookie.get('isUpload').then((str) => {
					if (!str) {//前台时判断是否存入cookie“isUpload”，未存入判断是否弹出设备锁
						if (_appStatus && this.state.loginType == 'auto') {//如记录切换后台的时间执行开启设备锁
							cookie.get('modelInfor').then(res => {
								if (res && res.isStart && res.isStart != 0) {//已设置设备锁
									let nowSec = (new Date().getTime() - _appStatus) / 1000;//切换前台与后台相差的时间
									if (nowSec > Path.AppStateSeconds) {//判断时间超出限制
										if (res.lockType == 0 || res.lockType == 2) {//执行指纹锁优先
											this.touchUnLock(res);
										} else if (res.lockType == 1) {//仅设置手势锁
											this.handUnLock(res);
										}
									}
								}
							});
						}
						//更新redis
						RedisUtil.update(uuid, this.props.navigation, {
							ticket: this.state.ticket,
							userId: this.state.basic.userId,
							uuId: uuid
						}, 'lineStatus', 'front', () => {
							//设备当前为“前台”状态
						});
					} else if (this.state.nowPage.indexOf('HandLock') != -1) {

					} else {
						cookie.delete('isUpload');
					}
				});
				if (!XMPP.isConnected && Global.isReconnectXMPP) {
					NativeModules.JudgeNetwork.judgeNetwork(Path.network_ip, (flag) => {
						flag && this.reconnectXMPP_new();
					});
				}
			} else if (AppState.currentState == 'background') {//当前为后台
				cookie.get('isUpload').then((str) => {
					if (!str) {//后台时判断是否存入cookie“isUpload”，未存入记录当前后台时间
						_appStatus = new Date().getTime();
						//更新redis
						RedisUtil.update(uuid, this.props.navigation, {
							ticket: this.state.ticket,
							userId: this.state.basic.userId,
							uuId: uuid
						}, 'lineStatus', 'back', () => {
							//设备当前为“后台”状态
						});
					}
				});
			}
		}
	}
	touchUnLock = (json) => {
		let optionalConfigObject = {
			title: '验证指纹密码',
			color: '#e00606',
			fallbackLabel: '显示密码'
		}
		TouchID.authenticate('abc', optionalConfigObject).then(success => {
			// this.props.navigation.goBack();
		}).catch(error => {
			this.handUnLock(json);
		})
	}
	handUnLock = (json) => {
		// 	this.props.navigation.navigate('HandLock', {
		// 		uuid: uuid,
		// 		ticket: this.state.ticket,
		// 		basic: this.state.basic,
		// 		lockInfor: json,
		// 		headerVisable: false,
		// 		isBackGroundRecall: true
		// 	});
	}
	netWorkPing = () => {
		if (tmpFlag) {
			pingNum = 0;
			return;
		}
		NativeModules.JudgeNetwork.judgeNetwork(Path.network_ip, (flag) => {
			if (flag == "true") {
				pingNum = 0;
				if (!tmpFlag) {
					tmpFlag = true;
					this.reconnectXMPP_new();
				}
				if (this.tmpTimeout) {
					clearTimeout(this.tmpTimeout)
				}
				;
			} else {
				pingNum++;
				if (pingNum < 15) {
					DeviceEventEmitter.emit('headTitle', "消息(连接中...)");
					if (this.tmpTimeout) {
						clearTimeout(this.tmpTimeout);
					}
					;
					this.tmpTimeout = setTimeout(this.netWorkPing(), 1000);
				} else {
					pingNum = 0;
					Global.isReconnectXMPP = true;
					DeviceEventEmitter.emit('headTitle', "消息(无网络)");
					if (this.tmpTimeout) {
						clearTimeout(this.tmpTimeout)
					}
					;
				}
			}
		});
	};
	//判断设备锁启用end
	showAlert = () => {
		this.setState({
			showAlert: true
		});
	};

	hideAlert = () => {
		this.setState({
			showAlert: false
		});
	};

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg: text//alert提示信息
		});
	};

	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={baseStyles.flex_one}>
				<AwesomeAlert
					show={showAlert}
					alertContainerStyle={{zIndex: 999999}}
					showProgress={false}
					title="提示"
					message={tipMsg}
					closeOnTouchOutside={false}
					closeOnHardwareBackPress={false}
					showCancelButton={false}
					showConfirmButton={true}
					// cancelText="No, cancel"
					confirmText="确定"
					confirmButtonColor="#278EEE"
					//onCancelPressed={() => {
					//	this.hideAlert();
					//}}
					onConfirmPressed={() => {
						this.hideAlert();
					}}
				/>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<TabNavigator tabBarStyle={styles.container} hidesTabTouch={true}>
					<TabNavigator.Item
						title="消息"
						titleStyle={[baseStyles.row_col_center, styles.tabItemTitle]}
						tabStyle={baseStyles.row_col_center}
						selected={this.state.tab == 'message'}
						onPress={() => {
							this.changeRouter('message')
						}}
						renderIcon={() => (
							<Image source={require('./images/icon/message_o.png')} style={styles.tabIcon}/>)}
						renderSelectedIcon={() => (
							<Image source={require('./images/icon/message.png')} style={styles.tabIcon}/>)}
						renderBadge={() => {
							if (this.state.newMeesageTab == 0) {
								return null;
							} else {
								const msgNum = this.state.newMeesageTab > 99 ? 99 : this.state.newMeesageTab;
								return (<View style={{
									backgroundColor: 'red',
									width: 16,
									height: 16,
									borderRadius: 50,
									// marginTop:5,
									alignItems: 'center',
									justifyContent: 'center',
									position: 'absolute',
									top: 1,
									right: -7,
								}}>
									<Text style={{color: '#FFFFFF', fontSize: 10}}>{msgNum}</Text>
								</View>)
							}
						}}
					>
						<Message navigation={this.props.navigation} resetTabNum={() => this.resetTabNum}
										 unReadCount={this.state.newMeesageTab}/>
					</TabNavigator.Item>
					<TabNavigator.Item
						title="群组"
						titleStyle={[baseStyles.row_col_center, styles.tabItemTitle]}
						tabStyle={baseStyles.row_col_center}
						selected={this.state.tab == 'groups'}
						onPress={this.changeRouter.bind(this, 'groups')}
						renderIcon={() => (
							<Image source={require('./images/icon/group_o.png')} style={styles.tabIcon}/>)}
						renderSelectedIcon={() => (
							<Image source={require('./images/icon/group.png')} style={styles.tabIcon}/>)}
					>
						<Group navigation={this.props.navigation}/>
					</TabNavigator.Item>
					<TabNavigator.Item
						title="工作台"
						titleStyle={[baseStyles.row_col_center, styles.tabItemTitle]}
						tabStyle={baseStyles.row_col_center}
						selected={this.state.tab == 'job'}
						onPress={this.changeRouter.bind(this, 'job')}
						renderIcon={() => (
							<Image source={require('./images/icon/work_plat_o.png')} style={{width: 29, height: 29}}/>)}
						renderSelectedIcon={() => (
							<Image source={require('./images/icon/work_plat.png')} style={{width: 29, height: 29}}/>)}
						renderBadge={() => {
							if (this.state.jobInvite) {
								return (<View style={{
									backgroundColor: 'red',
									width: 8,
									height: 8,
									borderRadius: 50,
									// marginTop:5,
									alignItems: 'center',
									justifyContent: 'center',
									position: 'absolute',
									top: 1,
									right: -7,
								}}/>)
							} else {
								return null;
							}
						}}
					>
						<Job navigation={this.props.navigation}/>
					</TabNavigator.Item>
					<TabNavigator.Item
						title="联系人"
						titleStyle={[baseStyles.row_col_center, styles.tabItemTitle]}
						tabStyle={{justifyContent: 'center', alignItems: 'center'}}
						selected={this.state.tab == 'friend'}
						onPress={this.changeRouter.bind(this, 'friend')}
						renderIcon={() => (
							<Image source={require('./images/icon/address_o.png')} style={styles.tabIcon}/>)}
						renderSelectedIcon={() => (
							<Image source={require('./images/icon/address.png')} style={styles.tabIcon}/>)}
					>
						<Friend navigation={this.props.navigation}/>
					</TabNavigator.Item>
					<TabNavigator.Item
						title="我的"
						titleStyle={[baseStyles.row_col_center, styles.tabItemTitle]}
						tabStyle={baseStyles.row_col_center}
						selected={this.state.tab == 'mine'}
						onPress={this.changeRouter.bind(this, 'mine')}
						renderIcon={() => (
							<Image source={require('./images/icon/my_o.png')} style={styles.tabIcon}/>)}
						renderSelectedIcon={() => (
							<Image source={require('./images/icon/my.png')} style={styles.tabIcon}/>)}
					>
						<Setting navigation={this.props.navigation}/>
					</TabNavigator.Item>
				</TabNavigator>
				<Modal
					visible={this.state.isLoading}
					animationType={'none'}
					transparent={true}
					onRequestClose={() => {
					}}>
					<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'}}>
						<ActivityIndicator
							size={'large'}
							color={'rgba(76,122,238,0.6)'}
						/>
					</View>
				</Modal>
			</View>

		);
	}

	//动态获取存储权限
	async requestReadExternalStoragePermission() {
		try {
			const granted = await
				PermissionsAndroid.requestMultiple(
					[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]
				)
			if (granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] == PermissionsAndroid.RESULTS.GRANTED &&
				granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] == PermissionsAndroid.RESULTS.GRANTED
			) {
			} else {
			}
		} catch (err) {
			console.warn(err)
		}
	}

}

const styles = StyleSheet.create({
	container: {
		height: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 83 : 49) : 50,
		alignItems: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 'flex-start' : null) : null,
		justifyContent: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 'center' : null) : null,
	},
	tabItemTitle: {fontSize: 12, marginTop: 0},
	tabIcon: {width: 28, height: 28},
});
