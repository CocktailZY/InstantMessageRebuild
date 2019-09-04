/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {
	ActivityIndicator,
	Alert,
	BackHandler,
	DeviceEventEmitter,
	Dimensions,
	Image,
	Modal,
	NativeModules,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import Path from './config/UrlConfig';
import FetchUtil from './util/FetchUtil';
import MD5 from './util/MD5';
import DeviceInfo from 'react-native-device-info';
import FileSystem from "react-native-filesystem";
import CheckBox from 'react-native-checkbox';
import Sqlite from "./util/Sqlite";
import XmlUtil from "./util/XmlUtil";
import RedisUtil from './util/RedisUtil';
import cookie from './util/cookie';
import UUIDUtil from './util/UUIDUtil';
//import MixPush from 'react-native-mixpush-android';
// import XGPush from 'react-native-xinge-push';
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from './util/HandlerOnceTap';
import ListenerUtil from './util/ListenerUtil';
import Global from "./util/Global";
import ToolUtil from "./util/ToolUtil";
import PermissionUtil from "./util/PermissionUtil";
import AwesomeAlert from 'react-native-awesome-alerts';

const {height, width} = Dimensions.get('window');
const uuid = DeviceInfo.getUniqueID().replace(/\-/g, '');
const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

let token = Global.pushToken;
export default class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			password: '',//测试用

			autoLogin: props.navigation.state.params && props.navigation.state.params.autoLogin ? props.navigation.state.params.autoLogin : true,
			userInfo: {},
			ticket: '',
			groupListData: [],//群列表
			isDebug: false,//推送debug
			loginLoad: false,//点击登录后loading
			offlineNum: 0,//离线监听数量
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		};
		this._enableDebug = this._enableDebug.bind(this);
		this._isEnableDebug = this._isEnableDebug.bind(this);

	}

	componentDidMount() {

		Global.headPhotoNum = new Date().getTime();
		//确定重新登录的监听
		if (ListenerUtil['Login']['Login_ConfirmLoginListener']) {
			ListenerUtil['Login']['Login_ConfirmLoginListener'].remove();
		}
		ListenerUtil['Login']['Login_ConfirmLoginListener'] = DeviceEventEmitter.addListener('confirmLogin', () => {
			this._login();
		});

		//确定重新登录的监听
		if (ListenerUtil['Login']['Login_CloseLoadingListener']) {
			ListenerUtil['Login']['Login_CloseLoadingListener'].remove();
		}
		ListenerUtil['Login']['Login_CloseLoadingListener'] = DeviceEventEmitter.addListener('closeLoading', () => {
			this.setState({
				loginLoad: false
			})
		});

		if (Platform.OS == 'android') {

			//XMPP断线监听
			if (ListenerUtil['Login']['Login_XmppDisconnectListener']) {
				ListenerUtil['Login']['Login_XmppDisconnectListener'].remove();
			}
			ListenerUtil['Login']['Login_XmppDisconnectListener'] = XMPP.on('disconnect', (exception) => {
			});

			//XMPP登录失败监听
			if (ListenerUtil['Login']['Login_XmppLoginErrorListener']) {
				ListenerUtil['Login']['Login_XmppLoginErrorListener'].remove();
			}

			//XMPP登录成功监听
			if (ListenerUtil['Login']['Login_XmppLoginSuccess']) {
				ListenerUtil['Login']['Login_XmppLoginSuccess'].remove();
			}
			ListenerUtil['Login']['Login_XmppLoginSuccess'] = XMPP.on('login', (message) => {
				this._updateDeviceToken(Global.pushToken);
				// XMPP.sendStanza('<presence xmlns=\'jabber:client\' id=\''+UUIDUtil.getUUID()+'\' from=\''+this.state.userInfo.jid+'/'+this.state.userInfo.userId+'\' type=\'unavailable\'></presence>');
				XMPP.sendStanza(XmlUtil.loginStatus());

				let tempIq = '<iq xmlns="jabber:client" from="' + this.state.userInfo.jidNode + '@' + Path.xmppDomain + '/' + this.state.userInfo.jidNode + '" id="' + UUIDUtil.getUUID() + '" type="set"><enable xmlns="urn:xmpp:carbons:2"/></iq>'
				XMPP.sendStanza(tempIq);

                if(this.state.groupListData.length > 0){
									let roomJids = "";
									this.state.groupListData.map(item => {
										Global.groupMute[item.roomJid] = item.mute;
										if(roomJids != ""){roomJids += ",";}
										roomJids += item.roomJid + Path.xmppGroupDomain;
									});
									XMPP.joinRoomNewThread(roomJids, this.state.userInfo.jidNode);
								}
				//this._getAuditCheck();
				let obj = {
					ticket: this.state.ticket,
					userId: this.state.userInfo.userId,
					uuId: uuid
				}

				RedisUtil.update(uuid, this.props.navigation, obj, 'redis', 'front', () => {
					RedisUtil.update(uuid, this.props.navigation, obj, 'lineStatus', 'front', () => {
						// this._getModelInfor();
						this.setState({
							loginLoad: false
						}, () => {
							ListenerUtil.removeOut("Login",["Login_OfflineMessage"],()=>{});
							this.props.navigation.navigate('Index', {
								token: token,
								ticket: this.state.ticket,
								basic: this.state.userInfo,
								uuid: uuid,
								loginType: 'unauto'
							});

						});
					});
				});
			});//登录成功回调

			//离线消息监听
			if (ListenerUtil["Login"]['Login_OfflineMessage']) {
				ListenerUtil["Login"]['Login_OfflineMessage'].remove();
			}
			ListenerUtil["Login"]['Login_OfflineMessage'] = XMPP.on('offlineMessage', (message) => {
				if (message.body) {
					this.setState({
						offlineNum: this.state.offlineNum + 1
					}, () => {
						let body = typeof message.body == 'string' ? JSON.parse(message.body) : message.body;
						Sqlite.selectTalkers(this.state.userInfo.userId, body.basic.fromId, (data) => {
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
								Sqlite.saveMessage(this.state.userInfo.userId, body.basic.fromId, tempType, msgContent, '', body.id, ToolUtil.strToStemp(body.content.sendTime), (data) => {
									Sqlite.updateTalker(this.state.userInfo.userId, body.basic.fromId, this.state.offlineNum, false, null, false, () => {
										DeviceEventEmitter.emit('refreshPage', 'refresh');
									});
								});
							} else {
								Sqlite.saveTalker(
									//userId,type,jid,jid_nade,trueName,imageName,callback
									this.state.userInfo.userId,
									1,
									body.basic.fromId + '@' + Path.xmppDomain,
									body.basic.fromId,
									body.basic.userName,
									body.basic.photoId,
									false,
									false,
									false,
									() => {
										Sqlite.saveMessage(this.state.userInfo.userId, body.basic.fromId, tempType, msgContent, '', body.id, ToolUtil.strToStemp(body.content.sendTime), (data) => {
											Sqlite.updateTalker(this.state.userInfo.userId, body.basic.fromId, this.state.offlineNum, false, null, false, () => {
												DeviceEventEmitter.emit('refreshPage', 'refresh');
											});
										});
									}
								);
							}
						});
					})
				}
			});

			//物理返回键监听
			ListenerUtil["Login"]['Login_BackKey'] = BackHandler.addEventListener("back", () => {
				return true;
			});
		}

		this.loginTimer = setTimeout(()=>{
			//获取权限
			PermissionUtil.requestAndroidPermission([PermissionsUtil.Permissions.write,PermissionsUtil.Permissions.read,PermissionsUtil.Permissions.camera,PermissionsUtil.Permissions.audio,PermissionsUtil.Permissions.phone],(value)=>{});
		},1000)

	}

	//更新服务器信鸽token值
	_updateDeviceToken = (deviceToken) => {
		console.log(deviceToken);
		if (deviceToken) {
			if (Platform.OS == 'android') {
				NativeModules.IMModule.getBrand((brand) => {
					console.log(brand);
					FetchUtil.netUtil(
						Path.updateToken,
						{
							token: deviceToken ? deviceToken : "-1",
							modelType: brand
						},
						"POST",
						this.props.navigation,
						{
							ticket: Global.basicParam.ticket,
							userId: Global.basicParam.userId,
							uuId: Global.basicParam.uuId
						},
						data => {
							if (data.code.toString() == "200") {
								console.log('更新token成功:' + deviceToken);
							}
						},
						true
					);
				})
			} else {
				FetchUtil.netUtil(
					Path.updateToken,
					{
						token: deviceToken ? deviceToken : "-1",
						modelType: '3'
					},
					"POST",
					this.props.navigation,
					{
						ticket: Global.basicParam.ticket,
						userId: Global.basicParam.userId,
						uuId: Global.basicParam.uuId
					},
					data => {
						if (data.code.toString() == "200") {
							console.log('更新token成功:' + deviceToken);
						}
					},
					true
				);
			}
		}
	};

	_enableDebug() {
		XGPush.enableDebug(!this.state.isDebug);
	}

	_isEnableDebug() {
		XGPush.isEnableDebug().then(result => {
			this.setState({
				isDebug: result
			});
		});
	}

	_setApplicationIconBadgeNumber(number = 0) {
		XGPush.setApplicationIconBadgeNumber(number);
	}

	componentWillUnmount() {
		Global.updateFlag = null;
		clearTimeout(this.loginTimer);
	}

	_getModelInfor = () => {
		let url = Path.getLockInfo + '?userId=' + this.state.userInfo.userId + '&uuId=' + uuid + '&ticket=' + this.state.ticket;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (data) => {

			if (data.code.toString() == '200') {
				//android群出席
				if (Platform.OS == 'android') {
					if(this.state.groupListData.length > 0){
						let roomJids = "";
						this.state.groupListData.map(item => {
							Global.groupMute[item.roomJid] = item.mute;
							if(roomJids != ""){roomJids += ",";}
							roomJids += item.roomJid + Path.xmppGroupDomain;
						});
						XMPP.joinRoomNewThread(roomJids, this.state.userInfo.jidNode);
					}
				}
				let resetBody = JSON.parse(JSON.stringify(data.data));
				resetBody.errorCount = 0;
				FetchUtil.netUtil(Path.postLockUpdate, resetBody, 'POST', this.props.navigation, {
					userId: this.state.userInfo.userId,
					uuId: uuid,
					ticket: this.state.ticket
				}, (data) => {
					if (data.code.toString() == '200') {
						cookie.save('modelInfor', resetBody);
					}
				});
				ListenerUtil.removeOut("Login",["Login_OfflineMessage"],()=>{});
				this.setState({
					loginLoad: false
				}, () => {

					this.props.navigation.navigate('Index', {
						token: token,
						ticket: this.state.ticket,
						basic: this.state.userInfo,
						uuid: uuid,
						loginType: 'unauto'
					});

				});
			}
		});
	}

	_getAuditCheck = () => {
		let userInfo = this.state.userInfo;
		let ticket = this.state.ticket;
		let checkUrl = Path.getDeviceCheck + '?userId=' + userInfo.userId + '&uuId=' + uuid + '&ticket=' + ticket;
		FetchUtil.netUtil(checkUrl, {}, 'GET', this.props.navigation, '', (data) => {
			if (data.code.toString() == '200') {
				if (!data.data.id) {//data为空执行绑定
					this._getAuditSave(data.data.auto_register);
				} else {
					if (data.data.userId == this.state.userInfo.userId) {
						if (data.data.bindingStatus == 0) {//是否绑定解绑
							if (data.data.examineStatus == 0 || data.data.examineStatus == 2) {//0正在审核 2审核失败
								ListenerUtil.removeOut("Login",["Login_OfflineMessage"],()=>{});
								this.setState({
									loginLoad: false
								}, () => {
									this.props.navigation.navigate('Audit', {uuid: uuid, ticket: ticket, basic: userInfo, token: token});
								});

							} else if (data.data.examineStatus == 1) {//审核成功
								this.initXmpp(userInfo, ticket);
							}
						} else {
							this._getAuditSave();
						}
					} else {

						if (data.data.examineStatus == 2) {
							this._getUpdate('other')
						} else {
							Alert.alert(
								'提示',
								'该设备已被其他人绑定',
								[
									{text: '确定', onPress: () => this.setState({loginLoad: false})}
								]
							);
							return false;
						}
					}
				}
			}
		})
	}

	_getUpdate = (type) => {
		let device = DeviceInfo.getModel();
		FetchUtil.netUtil(Path.getDeviceUpdate, {
			model: device,
			userName: this.state.userInfo.trueName,
			examineStatus: 0,
			token: token,
			platform: Platform.OS == 'ios' ? 'ios' : 'android',
			type: type
		}, 'POST', this.props.navigation, {
			uuId: uuid,
			userId: this.state.userInfo.userId,
			ticket: this.state.ticket
		}, (str) => {

			if (str.code.toString() == '200') {
				ListenerUtil.removeOut("Login",["Login_OfflineMessage"],()=>{});
				this.setState({
					loginLoad: false
				}, () => {
					this.props.navigation.navigate('Audit', {
						uuid: uuid,
						ticket: this.state.ticket,
						basic: this.state.userInfo
					});
				});
			}
		})
	};

	_getAuditSave = (type) => {
		let userInfo = this.state.userInfo;
		let ticket = this.state.ticket;
		let device = DeviceInfo.getModel();

		FetchUtil.netUtil(Path.getDeviceSave, {
			model: device,
			userName: userInfo.trueName,
			token: token,
			platform: Platform.OS == 'ios' ? 'ios' : 'android'
		}, 'POST', this.props.navigation, {
			uuId: uuid,
			userId: userInfo.userId,
			ticket: ticket
		}, (data) => {
			if (data.code.toString() == '200') {
				if (type) {
					this.initXmpp(userInfo, ticket);
				} else {
					this.setState({
						loginLoad: false
					}, () => {
						ListenerUtil.removeOut("Login",["Login_OfflineMessage"],()=>{});
						this.props.navigation.navigate('Audit', {uuid: uuid, ticket: ticket, basic: userInfo});
					})
				}
			}
		})
	};

	_setUname = (text) => {
		this.setState({
			username: text
		})
	};
	_setPwd = (text) => {
		this.setState({
			password: text
		})
	};

	//登录
	_login = () => {
		if (this._userNameBox) {
			this._userNameBox.blur();
			this._pwdBox.blur();
		}
		if(this.state.username == "" || this.state.password == ""){
            this._toast('用户名和密码不能为空！');
            return false;
		}
		if (this.state.username.indexOf(' ') == -1 && this.state.password.indexOf(' ') == -1) {
            this.setState({loginLoad: true});
			//不包含空格
			let url = Path.login + '?userName=' + this.state.username + '&password=' + this.state.password + '&uuId=' + uuid;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson, tip) => {
				if (responseJson == 'tip') {
					this._toast(tip);
          this.setState({loginLoad: false});
				} else if (responseJson.code.toString() == '-1') {
					this._toast('登录失败！');
					this.setState({loginLoad: false});
				} else {
					let ticket = responseJson.data.ticket;
					let userId = responseJson.data.tigUser.userId;
					let userInfo = responseJson.data.tigUser;
					userInfo['groupId'] = responseJson.data.groupId;
					userInfo['demoAccount'] = responseJson.data.demoAccount;
					userInfo['token'] = token;
					let fileCategory = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
					if (responseJson.code.toString() == '200') {
						if (this.state.autoLogin) {
							FileSystem.writeToFile('my-directory/my-file.txt', JSON.stringify(responseJson.data), fileCategory).then((res) => {});
						}
						this.setState({
							userInfo: userInfo,
							ticket: ticket
						}, () => {
							Global.basicParam.ticket = ticket;
							Global.basicParam.uuId = uuid;
							Global.basicParam.userId = userId;
							this._getAuditCheck();
						});
					} else {
						this._toast('登录失败,网络错误！');
					}
				}
			});
		} else {
			this._toast('用户名或密码含有非法字符！');
		}
	};

	initXmpp = (userInfo, ticket) => {
		let url = Path.getAllGroups + '?occupantJid=' + userInfo.jidNode + '&uuId=' + uuid + '&ticket=' + ticket + '&userId=' + userInfo.userId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, {
				uuId: uuid,
				userId: this.state.userInfo.userId,
				ticket: this.state.ticket
			}, (responseJson) => {
				let groupList = responseJson.data;
				if (responseJson.code.toString() == '200') {
					if (Platform.OS == 'android') {
						this.setState({
							groupListData: groupList
						}, () => {
							// XMPP.trustHosts([Path.xmppDomain]);
							let timeresource = userInfo.userId + new Date().getTime();
							XMPP.disconnect();
							XMPP.connect(userInfo.jidNode + '@' + Path.xmppHost + '/' + userInfo.jidNode, 'android#' + ticket);
							Global.loginResource = userInfo.jidNode;
						});
					} else {
						XMPP.XMPPDisConnect();
						let timeresource = userInfo.userId + new Date().getTime();
						Global.loginResource = userInfo.jidNode;
						XMPP.XMPPLoginAccount(
							{
								'account': userInfo.jidNode,
								'password': 'android#' + ticket,
								'uuid': uuid,
								'username': userInfo.trueName,
								'userId': userInfo.jidNode
							},
							(error, event) => {
								this.setState({
									loginLoad: false
								});
								if (event == '登录成功') {
									// this.XGRegister();
									Global.iosXmppIsConnect = true;
									groupList.map((item) => {
										Global.groupMute[item.roomJid] = item.mute;
										XMPP.XMPPMapgroupes(
											{
												'roomJid': item.roomJid,
												'account': userInfo.jidNode
											},
											(error, event) => {
											}
										)
									});
									//离线消息
									XMPP.loginNext({
										'from': this.state.userInfo.jidNode + '@' + Path.xmppDomain + '/' + this.state.userInfo.jidNode,
										'id': UUIDUtil.getUUID().replace(/\-/g, '')
									});
									RedisUtil.update(uuid, this.props.navigation, {
										ticket: ticket,
										userId: userInfo.userId,
										uuId: uuid
									}, 'redis', 'front', () => {
										this.setState({
											loginLoad: false
										}, () => {
											this.refs.toast.show('登录成功', DURATION.LENGTH_SHORT);
											ListenerUtil.removeOut("Login",["Login_OfflineMessage"],()=>{});
											this.props.navigation.navigate('Index', {
												token: token,
												ticket: this.state.ticket,
												basic: this.state.userInfo,
												uuid: uuid,
												loginType: 'unauto'
											});

										});
									});
								} else {
									this.setState({
										loginLoad: false
									});
									this._toast(event);
									return;
								}
							}
						)
					}
				} else {
					this.setState({
						loginLoad: false
					});
					this._toast('登录失败，网络错误');
				}

				Sqlite.init(userInfo.userId);
			}
		);
	}

	/*//信鸽注册
	XGRegister() {
		// 注册
		// XGPush.register(this.state.userInfo.userId)
		// 	.then(result => {
		// 	})
		// 	.catch(err => {
		// 	});
	}*/
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
			tipMsg:text//alert提示信息
		});
	};
	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
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
					onCancelPressed={() => {
						this.hideAlert();
					}}
					onConfirmPressed={() => {
						this.hideAlert();
					}}
				/>
				<Toast ref="toast" opacity={0.7}
							 fadeOutDuration={1000}
							 position={'center'}
							 style={{padding:18,height:80,backgroundColor:'#57606F',justifyContent:'center',alignItems:'center'}}
							 textStyle={{color:'#FFFFFF'}}/>
				<View style={styles.welcome}>
					<Image source={require('./images/icon/icon_logo.png')}
								 style={{
									 width: width > 600 ? 85 : 60,
									 height: width > 600 ? 85 : 60,
									 borderRadius: Platform.OS == 'ios' ? (width > 600 ? 42.5 : 30) : 50,
								 }}/>
					<Text style={{marginTop: 14, fontSize: 16, color: '#666'}}>{'即时通讯'}</Text>
				</View>
				<View style={styles.inputView}>
					<Image
						source={require('./images/icon/icon_user.png')}
						style={styles.icon}
					/>
					<TextInput
						ref={(TextInput) => {
							this._userNameBox = TextInput;
						}}
						placeholder='用户名'
						onChangeText={(text) => this._setUname(text)}
						underlineColorAndroid={'transparent'}
						value={this.state.username}
						style={styles.inputText}
					/>
				</View>
				<View style={styles.inputView}>
					<Image
						source={require('./images/icon/icon_password.png')}
						style={styles.icon}
					/>
					<TextInput
						ref={(TextInput) => {
							this._pwdBox = TextInput;
						}}
						placeholder='密码'
						secureTextEntry={true}
						onChangeText={(text) => this._setPwd(text)}
						underlineColorAndroid={'transparent'}
						value={this.state.password}
						style={styles.inputText}
					/>
				</View>
				<TouchableOpacity onPress={() => {
					HandlerOnceTap(this._login)
				}} style={styles.btn}>
					<Text style={{
						fontSize: 15,
						color: '#fff'
					}}>登录</Text>
				</TouchableOpacity>
				{/*<CustomBtn*/}
				{/*onBtnPressCallback={this._login}*/}
				{/*btnText={'登录'}*/}
				{/*btnStyle={{*/}
				{/*width: width > 600 ? '50%' : '80%',*/}
				{/*borderRadius: 20,*/}
				{/*backgroundColor: '#4a77f1',*/}
				{/*height: width > 600 ? 50 : 40,*/}
				{/*justifyContent: 'center',*/}
				{/*alignItems: 'center',*/}
				{/*marginTop: 22,*/}
				{/*}}*/}
				{/*/>*/}
				<View style={{
					width: width > 600 ? '50%' : '80%',
					flexDirection: 'row',
					justifyContent: 'flex-start',
					marginTop: 13
				}}>
					<CheckBox
						label={null}
						checked={this.state.autoLogin}
						onChange={() => {
							this.setState({
								autoLogin: !this.state.autoLogin
							})
						}}
						containerStyle={{marginBottom: 0, marginRight: 9}}
						checkedImage={require('./images/check-sqr.png')}
						uncheckedImage={require('./images/uncheck-sqr.png')}
					/>
					<View style={{justifyContent: 'center'}}>
						<Text>{'自动登录'}</Text>
					</View>
				</View>
				<Modal
					visible={this.state.loginLoad}
					animationType={'none'}
					transparent={true}
					onRequestClose={() => {
					}}>
					<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'}}>
						<ActivityIndicator
							size={'large'}
							color={'rgba(0,0,0,0.7)'}
						/>
					</View>
				</Modal>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ffffff',//#F5FCFF
	},
	welcome: {
		alignItems: 'center',
		marginBottom: 30,
	},
	inputView: {
		width: width > 600 ? '50%' : '80%',
		height: width > 600 ? 80 : 50,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#d1d1d2',
	},
	icon: {
		width: 24,
		height: 24,
		marginRight: 10,
	},
	inputText: {
		flex: 1,
		fontSize: 14,
		color: '#999',
		padding: 0,
		marginTop: 13,
		marginBottom: 13,
	},
	btn: {
		width: width > 600 ? '50%' : '80%',
		borderRadius: 20,
		backgroundColor: '#4a77f1',
		height: width > 600 ? 50 : 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 22,
	}
});
