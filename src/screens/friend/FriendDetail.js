import React, {Component} from 'react';
import {
	StyleSheet, Text, View, Image, TouchableOpacity, BackHandler,
	Platform, Dimensions, ToastAndroid, NativeModules, DeviceEventEmitter,
	Switch, ScrollView, Linking, Alert, PermissionsAndroid
} from 'react-native';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import XmlUtil from '../../util/XmlUtil';
import Sqlite from "../../util/Sqlite";
import Toast, {DURATION} from 'react-native-easy-toast';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Global from "../../util/Global";
import PermissionUtil from "../../util/PermissionUtil";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

const {height, width} = Dimensions.get('window');
let lastPresTime = 1;
export default class FriendDetail extends Component {
	constructor(props) {
		super(props);
		this.state = {
			friendDetail: {},
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			friendUserId: props.navigation.state.params.friendUserId,
			friendJidNode: props.navigation.state.params.friendJidNode,
			isFriendFlag: props.navigation.state.params.tigRosterStatus,
			// backPage: props.navigation.state.params.backPage ? props.navigation.state.params.backPage : 'Message',
			// room: props.navigation.state.params.room ? props.navigation.state.params.room : '',
			commonStatus: '',
			stepType: props.navigation.state.params.stepType,
			addMessage: {},//添加好友时，发请求需要的对象
			isTop: false,//是否置顶
			token: props.navigation.state.params.token,
			friendDeptName: '',//好友部门显示
		}
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
		if (Platform.OS == 'android') {
			// this._checkPermission(false);
			this.iqLis = XMPP.on('iq', (message) => {
				this.iqCallBack(message, this.state.addMessage)
			});
			this.msgLis = XMPP.on('presence', (message) => {
				this.msgCallBack(message)
			});
		} else {
			//ios处理
		}
		this._fetchFriendDetail();

		Sqlite.selectTalkers(this.state.basic.userId, this.state.friendJidNode, (userDetail) => {
			if (userDetail[0] && userDetail[0].promote_priority > 0) {
				this.setState({
					isTop: true
				})
			}
		})
		if (this.friendDetailBackKey) {
			this.friendDetailBackKey.remove();
		};
		this.friendDetailBackKey = BackHandler.addEventListener("back", () => {
			let curTime = new Date().getTime();
			if (curTime - lastPresTime > 500) {
				lastPresTime = curTime;
				return false;
			}
			return true;
		});
	};

	componentWillUnmount() {
		if (Platform.OS == 'android') {
			this.iqLis.remove();
			this.msgLis.remove();
		} else {

		}
		this.friendDetailBackKey.remove();
	}

	_fetchFriendDetail = () => {
		let params = {
			currentUid: this.state.basic.uid,
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		};
		if (this.state.friendUserId) {
			params.friendUserId = this.state.friendUserId;
		} else {
			params.jidNode = this.state.friendJidNode;
		}
		FetchUtil.netUtil(Path.getFriendDetail + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (res) => {
			if(res == 'tip'){
				this.refs.toast.show('网络错误，获取联系人详情失败');
			} else if (res.code == '200') {
				let tempDeptName = '';
				if (res.data.positionDeptVos.length > 1) {
					res.data.positionDeptVos.map((item, index) => {
						if (index == res.data.positionDeptVos.length - 1) {
							tempDeptName += item.branchName;
						} else {
							tempDeptName += item.branchName + '/';
						}
					})
				} else {
					tempDeptName = res.data.positionDeptVos[0].branchName;
				}
				//返回成功
				this.setState({
					friendDetail: res.data,
					friendDeptName: tempDeptName,
					addMessage: {
						trueName: this.state.basic.trueName,
						jid: this.state.basic.jid,
						validInfo: "我是" + this.state.basic.trueName,
						groupId: this.state.basic.groupId,//data.data.groupId,
						uid: res.data.uid,
						//添加发起人uid
						selfUid: this.state.basic.uid,
						//好友的真实姓名
						toTrueName: res.data.trueName,
						//好友的jid（带'@'+Path.xmppDomain）
						toJid: res.data.jid,
						photoId: res.data.photoId,
					},
					commonStatus: res.data.commonStatus
				});
			}else {
				this.refs.toast.show('操作失败！', DURATION.LENGTH_SHORT);
			}
		});

	};

	_toAddFriend = () => {

		let url = Path.addFriend;
		FetchUtil.sendPost(url, 'uuId=' + this.state.uuid
			+ '&ticket=' + this.state.ticket
			+ '&jidNode=' + this.props.navigation.state.params.basic.jidNode
			+ '&withJidNode=' + this.state.friendDetail.jidNode
			+ '&status=' + JSON.stringify(this.state.addMessage)
			+ '&remark=' + this.state.addMessage.trueName + '&userId=' + this.state.basic.userId + '请求添加好友', this.props.navigation, (data) => {

			if (data.status == 'true') {
				//返回成功
				if (Platform.OS == 'android') {
					let sendIQ = XmlUtil.sendIQ(this.state.friendDetail.jid, this.state.friendDetail.trueName, this.state.friendDetail.trueNamePinyin.substr(0, 1));

					XMPP.sendStanza(sendIQ);
					this.refs.toast.show('请求已发出，等待审核', ToastAndroid.LONG);
				} else {
					//ios处理
					XMPP.XMPPAddFriend(
						{
							'uuid': this.state.uuid,
							'friendJid': this.state.friendDetail.jid,
							'friendTrueName': this.state.friendDetail.trueName,
							'friendPinYinName': this.state.friendDetail.trueNamePinyin.substr(0, 1)
						},
						(error, event) => {
							if (error) {
								this.refs.toast.show(error, DURATION.LENGTH_SHORT);
							} else {
								this.refs.toast.show(event, DURATION.LENGTH_SHORT);
							}
						}
					)
				}
			}else {
				his.refs.toast.show(data.msg, DURATION.LENGTH_SHORT);
			}
		})
	};
	iqCallBack = (message, addMessage) => {
		if (message.type == 'result') {
			let addFriend = XmlUtil.addFriend(this.state.friendDetail.jid, JSON.stringify(addMessage));
			XMPP.sendStanza(addFriend);
		} else if (message.type == 'subscribe' && message.status == 'back') {
			this._fetchFriendDetail();
			DeviceEventEmitter.emit('refreshFriendList');

		}
	};
	msgCallBack = (message) => {
		if (message.type == 'subscribe' && message.status == 'back') {
			this._fetchFriendDetail();
		}
	};

	_toChatPage = () => {
		DeviceEventEmitter.emit('refreshChatContent', {
			backPage: 'Message',
			ticket: this.state.ticket,
			friendUserId: this.state.friendUserId,
			basic: this.state.basic,
			friendDetail: this.state.friendDetail,
			selectFlag: true
		});
		let obj = {
			token: this.state.token,
			backPage: 'Message',
			ticket: this.state.ticket,
			friendUserId: this.state.friendUserId,
			basic: this.state.basic,
			friendDetail: this.state.friendDetail,
			selectFlag: true,
		};
		Global.chat_detail = obj;
		DeviceEventEmitter.emit('refreshGroupName', this.state.friendDetail.trueName);
		this.props.navigation.navigate('Chat', obj);
	};

	//添加常用联系人
	_setContacts = () => {

		if(this.state.friendDetail.uid){
			let url = Path.setContacts;
			let params = {
				groupId: this.state.basic.groupId,
				buddyId: this.state.friendDetail.uid
			};
			FetchUtil.netUtil(url, params, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, this.setContactsCallBack);
		}
	};
	//添加常用联系人回调
	setContactsCallBack = (data) => {
		if(data == 'tip'){
			this.refs.toast.show('网络错误，添加常用联系人失败');
		} else if (data.status) {
			//返回成功
			//跳转好友列表页-------------------
			//if (Platform.OS == 'android') {
			this.refs.toast.show('添加常用联系人成功', DURATION.LENGTH_SHORT);
			DeviceEventEmitter.emit('refreshFriendList');
			DeviceEventEmitter.emit('refreshPage');
			this.setState({
				friendJidNode: this.state.friendDetail.jidNode,
				isFriendFlag: 'both'
			}, () => {
				this._fetchFriendDetail();
			});
			DeviceEventEmitter.emit('refreshFriendList');//刷新好友列表
			DeviceEventEmitter.emit('refreshPage');
		}else{
			this.refs.toast.show(data.msg);
		}
	};
	//移出常用联系人
	_removeContacts = () => {
		let url = Path.newDeleteContackts;
		let params = {
			//当前登录人的uid
			uid: Global.loginUserInfo.uid,
			buddyUids: [this.state.friendDetail.uid]
		};
		FetchUtil.netUtil(url, params, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, this.removeContactsCallBack);
	};
	//移出常用联系人回调
	removeContactsCallBack = (res) => {
		if(res == 'tip'){
			this.refs.toast.show('网络错误，移出联系人失败');
		} else if (res.status) {
			if (Platform.OS == 'android') {
				this.refs.toast.show('移出成功', DURATION.LENGTH_SHORT);
			} else {
				//ios
				//DeviceEventEmitter.emit('refreshFriendList');
				this.refs.toast.show('移出成功', DURATION.LENGTH_SHORT);
			}
			this.setState({
				isFriendFlag: 'both',
			}, () => {
				this._fetchFriendDetail();
			});
			DeviceEventEmitter.emit('refreshFriendList');//刷新好友列表
		}else{
            this.refs.toast.show(res.msg, DURATION.LENGTH_SHORT);
		}
	};

	isToTop = (value) => {
		let jid = (this.state.friendJidNode ? this.state.friendJidNode : this.state.friendUserId) + '@' + Path.xmppDomain;
		let jidNode = this.state.friendJidNode ? this.state.friendJidNode : this.state.friendUserId;
        XmppUtil.xmppIsConnect(() => {
            this.setState({
                isTop: value
            });
            Sqlite.updateTalkerPromote(this.state.basic.userId, 1, jid, jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, value, false, false, () => {
                Sqlite.saveMessage(this.state.basic.userId, jidNode, 'text', "", "", new Date().getTime(), null, (data) => {
                    DeviceEventEmitter.emit('refreshPage');
                });
            });
        }, (error) => {
            this.refs.toast.show('请检查您的网络状态！');
        });
	};

	_checkPermission = () => {
        PermissionUtil.requestAndroidPermission(
            PermissionsAndroid.PERMISSIONS.CALL_PHONE, (value) => {
                if (typeof value == "boolean" && value) {
                    NativeModules.IMModule.call(this.state.friendDetail.cell,(e)=>{
                        Alert.alert(
                            '提醒',
                            '使用拨号功能前，请先开启电话权限！',
                            [
                                {
                                    text: '确定',
                                }
                            ]
                        )
                    });
                    // Linking.openURL(`tel:${this.state.friendDetail.cell}`)
                } else if (typeof value == "boolean" && !value) {
                    Alert.alert(
                        '提醒',
                        '使用拨号功能前，请先开启电话权限！',
                        [
                            {
                                text: '确定',
                            }
                        ]
                    )
                }
            }
        );
		// let resultPhone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
		// if (resultPhone && mark) {
		// 	Linking.openURL(`tel:${this.state.friendDetail.cell}`)
		// } else {
		// 	this.requestCallPhonePermission(mark);
		// }
	}

	//动态获取录音权限
	async requestCallPhonePermission(mark) {
		try {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.CALL_PHONE
			);
			if (granted == PermissionsAndroid.RESULTS.GRANTED) {
				if (mark) {
					Linking.openURL(`tel:${this.state.friendDetail.cell}`)
				}
			} else {
			}
		} catch (err) {
		}
	}

	render() {

		return (
			<View style={styles.container}>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={true}
					headRightFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					rightItemImage={this.state.basic.jidNode != this.state.friendDetail.jidNode ? (this.state.commonStatus == '1' ? require('../../images/icon_star2.png') : require('../../images/icon_star1.png')) : null}
					onPressRightBtn={() => {
						HandlerOnceTap(() => {
							if(this.state.basic.jidNode != this.state.friendDetail.jidNode){
								if(this.state.commonStatus == '1'){
									this._removeContacts();
								}else{
									this._setContacts();
								}
							}
						})
					}}
					backTitle={'返回'}
					title={'详细资料'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
				>
					<View style={[styles.detailsView, styles.detailsCommon, {marginTop: 8}]}>
						<View style={[styles.detailsPictrue, styles.detailsImage]}>
							<Image
								source={{
									uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&imageName=' + this.state.friendDetail.photoId + '&userId=' + this.state.basic.userId + '&imageName=' + this.state.friendDetail.photoId + '&imageId=' + this.state.friendDetail.photoId + '&sourceType=singleImage&jidNode='
								}}
								style={styles.detailsImage}/>
						</View>
						<View style={[styles.detailsText, {height: 60}]}>
							<View style={styles.detailsList}>
								<Text style={styles.detailsFont}>{this.state.friendDetail.trueName}</Text>
								<Image
									source={this.state.friendDetail.sex == 0 ? require('../../images/man.png') : require('../../images/woman.png')}
									style={styles.sexIcon}
								/>
							</View>
							<View style={styles.detailsList}>
								<Text style={styles.detailsSmallFont}>{this.state.friendDetail.email}</Text>
							</View>
							<View style={styles.detailsList}>
								<Text
									style={styles.detailsSmallFont}>{this.state.friendDetail.mark ? '备注:' + this.state.friendDetail.mark : null}</Text>
							</View>
						</View>
					</View>
					<View style={styles.detailsView}>
						{/*<View style={[styles.detailsBox, styles.detailsCommon, {borderTopColor: 'transparent'}]}>*/}
						{/*<TouchableOpacity style={styles.detailsFunc} onPress={() => alert('设置备注')}>*/}
						{/*<Text style={[styles.detailsFont, {flex: 1}]}>备注</Text>*/}
						{/*<View style={styles.detailsFunIcon}>*/}
						{/*<Icons name={'ios-arrow-forward'} size={25} color={'#CCCCCC'}/>*/}
						{/*</View>*/}
						{/*</TouchableOpacity>*/}
						{/*</View>*/}
					</View>
					<View style={styles.detailsView}>
						<View style={[styles.detailsBox, styles.detailsCommon, {borderTopColor: 'transparent'}]}>
							<View style={styles.detailsTitle}>
								<Text style={styles.detailsFont}>电话号码</Text>
							</View>
							<View style={styles.detailsText}>
								<TouchableOpacity onPress={() => {

									if (this.state.friendDetail.cell){
										HandlerOnceTap(
											() => {

												if (Platform.OS == 'android') {
													Alert.alert(
														'提醒',
														'确认拨打该号码',
														[
															{
																text: '取消',
															},
															{
																text: '呼叫',
																onPress: () => {
																	this._checkPermission();
																}
															}
														]
													)
												} else {
													Linking.openURL(`tel:${this.state.basic.cell}`)
												}

											}
										)
									}

								}}>
									<View style={styles.detailsList}>
										<Text style={styles.detailsFont}>{this.state.friendDetail.cell}</Text>
									</View>
								</TouchableOpacity>
							</View>
						</View>
					</View>
					<View style={styles.detailsView}>
						<View style={[styles.detailsBox, styles.detailsCommon, {borderTopColor: 'transparent'}]}>
							<View style={styles.detailsTitle}>
								<Text style={styles.detailsFont}>所属部门</Text>
							</View>
							<View style={styles.detailsText}>
								<Text style={styles.detailsFont}>{this.state.friendDeptName}</Text>
							</View>
						</View>
					</View>
					{this.state.friendDetail.jidNode && this.state.friendDetail.jidNode != this.state.basic.jidNode ? (
						<View style={[styles.detailsView,{height:48}]}>
							<View style={[styles.detailsBox, styles.detailsCommon, {borderTopColor: 'transparent'}]}>
								<View style={styles.detailsFunc}>
									<Text style={[styles.detailsFont, {flex: 1}]}>置顶聊天</Text>
									<Switch style={styles.detailsSwitch}
									        onValueChange={(value) => {
										        this.isToTop(value)
									        }}
									        value={this.state.isTop}/>
								</View>
							</View>
							{/*<View style={[styles.detailsBox, styles.detailsCommon]}>*/}
							{/*<View style={styles.detailsFunc}>*/}
							{/*<Text style={[styles.detailsFont, {flex: 1}]}>消息免打扰</Text>*/}
							{/*<Switch style={styles.detailsSwitch} onValueChange={(value) => {*/}
							{/*this.setState({*/}
							{/*disturbingType: value*/}
							{/*})*/}
							{/*}} value={this.state.disturbingType}/>*/}
							{/*</View>*/}
							{/*</View>*/}
						</View>
					) : null}
					{this.state.friendDetail.jidNode && this.state.friendDetail.jidNode != this.state.basic.jidNode ? (
						<View style={[styles.detailsView,{height:48}]}>
							<View style={[styles.detailsBox, styles.detailsCommon, {borderTopColor: 'transparent'}]}>
								<TouchableOpacity style={styles.detailsFunc} onPress={() => {
									HandlerOnceTap(
										() => {
											this.props.navigation.navigate('History', {
												ticket: this.state.ticket,
												basic: this.state.basic,
												uuid: this.state.uuid,
												friendDetail: this.state.friendDetail,
												friendJidNode: this.state.friendJidNode ? this.state.friendJidNode : this.state.friendDetail.jidNode
											})
										}, "History"
									)
								}}>
									<Text style={[styles.detailsFont, {flex: 1}]}>聊天记录</Text>
									<View style={styles.detailsFunIcon}>
										<Icons name={'ios-arrow-forward'} size={25} color={'#CCCCCC'}/>
									</View>
								</TouchableOpacity>
							</View>
						</View>
					) : null}
					{this.state.friendDetail.jidNode ? (
						<View style={{flex: 1, paddingLeft: 12, paddingRight: 12}}>
							<View style={{height: 55}}>
								{
									this.state.friendDetail.jidNode != this.state.basic.jidNode ? (
										this.state.isFriendFlag == 'both' ? (
											<TouchableOpacity onPress={() => {
												HandlerOnceTap(this._toChatPage, "sendMsg")
											}} style={styles.btn}>
												<Text style={{fontSize: 15, color: '#fff'}}>发消息</Text>
											</TouchableOpacity>
										) : (
											<TouchableOpacity onPress={() => {
												HandlerOnceTap(this._toAddFriend)
											}} style={styles.btn}>
												<Text style={{fontSize: 15, color: '#fff'}}>加为好友</Text>
											</TouchableOpacity>
										)
									) : null
								}
							</View>
						</View>
					) : null}
				</ScrollView>
			</View>
		)
	}

}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	btn: {
		height: 43,
		borderRadius: 4,
		backgroundColor: '#789cfd',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 14
	},
	detailsCommon: {
		flexDirection: 'row',
		paddingTop: 8,
		paddingBottom: 8,
	},
	detailsView: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 15,
		paddingLeft: 12,
		backgroundColor: '#ffffff',
	},
	detailsPictrue: {
		borderRadius: 4,
		marginRight: 12,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	detailsImage: {
		width: 60,
		height: 60,
	},
	detailsBox: {
		borderTopWidth: 1,
		borderTopColor: '#f0f0f0',
		minHeight: 48,
		alignItems: 'center',
	},
	detailsTitle: {
		width: 90,
	},
	detailsText: {
		flex: 1,
		justifyContent: 'flex-start'
	},
	detailsList: {
		alignItems: 'center',
		height: 20,
		flexDirection: 'row'
	},
	detailsFont: {
		color: '#333',
		fontSize: 15
	},
	detailsSmallFont: {
		color: '#666',
		fontSize: 12
	},
	sexIcon: {
		width: 15,
		height: 15,
		marginLeft: 5,
	},
	detailsFunc: {
		flex: 1,
		flexDirection: 'row',
		height: 48,
		alignItems: 'center',
	},
	detailsFunIcon: {
		width: 25,
		justifyContent: 'center',
	},
	detailsSwitch: {
		marginRight: 10
	}
});