import React, {Component} from 'react';
import {
	StyleSheet, Text, View, ActivityIndicator, Image, Platform,
	TouchableOpacity, TouchableHighlight,
	DeviceEventEmitter, NativeModules, Alert, BackHandler,
	Modal, Dimensions, NetInfo, Linking
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from '../../config/UrlConfig';
import FormatDate from '../../util/FormatDate';
import Chat from '../chat/Chat';
import Sqlite from "../../util/Sqlite";
import {SwipeListView} from 'react-native-swipe-list-view';
import DeviceInfo from 'react-native-device-info';
import RNFS from "react-native-fs";
import * as MyProgress from 'react-native-progress';
import Icons from 'react-native-vector-icons/Ionicons';
import Toast, {DURATION} from "react-native-easy-toast";
import HtmlUtil from "../../util/HtmlUtil";
import AwesomeAlert from "react-native-awesome-alerts";

import Global from "../../util/Global";

/**
 * 基础样式组件
 */
import baseStyles from '../../commen/styles/baseStyles';

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
const ApkInstaller = Platform.select({
	ios: () => null,
	android: () => require('react-native-apk-installer'),
})();
const {height, width} = Dimensions.get('window');

export default class Message extends Component {

	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			animating: true,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			showConfirm: false,//下载确认框显示，false不显示
			// updateFlag: props.navigation.state.params.updateFlag ? props.navigation.state.params.updateFlag : true,//更新弹框显示，false不显示
			prossesModalVisible: false,//进度条modal显示，false不显示
			progress: 0,//进度条百分比
			netWorkIsConnect: true,
			isPopShow: false,//下拉框
			headTitleContent: '',//头部标题
			token: props.navigation.state.params.token,
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	};


	//组件渲染完毕时调用此方法
	componentDidMount() {
		XmppUtil.xmppIsConnect(() => {
			this.fetchMessage();//获取本地消息列表
			this.refreshMsg();
			this.getJobAndNotification();
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
		/**
		 * 头部显示控制监听
		 */
		this.headTitle = DeviceEventEmitter.addListener('headTitle', (content) => {
			this.setState({
				headTitleContent: content
			}, () => this.refs.messageHead._changeHeaderTitle(content))

		});
		/**
		 * 获取离线消息监听
		 */
		this.getOfflineMessage = DeviceEventEmitter.addListener('getOfflineMessage', (content) => {
			this.refs.messageHead._changeHeaderTitle(content);
			this.refreshMsg();
		});
		/**
		 * 刷新本地消息监听
		 */
		this.refreshEvent = DeviceEventEmitter.addListener('refreshPage', () => {
			this.fetchMessage();
		});
		/**
		 * 群快捷弹窗显示控制监听
		 */
		this.isGetPopShow = DeviceEventEmitter.addListener('isGetPopShow', () => {
			this.setState({isPopShow: false});
		});
		/**
		 * 查询离线通知数量
		 */
		this.getNoticeNum = DeviceEventEmitter.addListener('getNoticeNum', () => {
			this.getJobAndNotification();
		});
	}

	componentWillUnmount() {
		this.refreshEvent.remove();
		this.isGetPopShow.remove();
		this.getNoticeNum.remove();
	}

	refreshMsg = () => {
		//Android XMPP重连处理
		if (!XMPP.isConnected && Global.isReconnectXMPP) {
			NativeModules.JudgeNetwork.judgeNetwork(Path.network_ip, (flag) => {
				flag && DeviceEventEmitter.emit('Foot_ReconnectXMPP');
			});
		}

		XmppUtil.xmppIsConnect(() => {
			this.getNotification();//获取通知数量
			this.compareGroups();//比较群组
			this.fetchMessageNum();
			if (this.state.headTitleContent == '消息(未连接)') {
				DeviceEventEmitter.emit('XMPPReconnnect');
			}else {
				this.refs.messageHead._changeHeaderTitle('消息');
			}
		}, (error) => {
			if (error == "xmppError") {
				this.refs.messageHead._changeHeaderTitle('消息(未连接)');
			}
			// else {
			// 	this.refs.messageHead._changeHeaderTitle('消息(无网络)');
			// }
		});
		/*NetInfo.isConnected.fetch().done((isConnected) => {
			if (isConnected) {

			} else {
				this.refs.messageHead._changeHeaderTitle('消息(无网络)');
			}
		});*/
	}

	joinRoom = () => {
		/**
		 * 加入群聊时判断用户当前在群聊中的状态
		 * */
		this.setState({
			isPopShow: false
		});

		this.props.navigation.navigate('GroupJoin', {
			'ticket': this.props.navigation.state.params.ticket,
			'uuid': this.state.uuid,
			'basic': this.props.navigation.state.params.basic,
			'pageType': 'add'
		});

	};

	creatRoom = () => {

		this.setState({
			isPopShow: false
		}, () => {
			this.props.navigation.navigate('GroupCreate', {
				'ticket': this.props.navigation.state.params.ticket,
				'uuid': this.state.uuid,
				'basic': this.props.navigation.state.params.basic,
				'pageType': 'create',
				'token': this.state.token
			});
		});

	};

	//判断是否为@群组消息
	isAtMessage = (myData) => {
		var tempStr;
		if (myData.content != null) {
			if (myData.is_anted) {
				tempStr = <Text style={{color: '#d90000', fontSize: 13}} numberOfLines={1}>{'[有人@我] '}</Text>;
			}
		}
		return tempStr;
	}

	/**
	 * 当数据还没有请求回来时执行该静态方法
	 * @returns {XML}
	 */
	renderLoadingView() {
		return (
			<ActivityIndicator
				animating={this.state.animating}
				style={[styles.centering, {height: 44, marginTop: 20}]}
				size="large"
				color='rgba(76,122,238,1)'
			/>
		);
	};

	/**
	 * 数据成功请求回来后渲染页面
	 * @param rowData 请求响应的data，即在fetchData方法中set给state的lists
	 * @returns {XML}
	 */
	callback(rowData) {
		let myData = rowData.item;
		const msgNum = myData.unread_number > 99 ? 99 : myData.unread_number;
		const typeName = ['image', 'file', 'announcement', 'activity', 'vote', 'topic', 'voice', 'other', null];
		const typeText = ['图片', '文件', '公告', '活动', '投票', '话题', '语音', '其他', ''];
		let typeIndex = -1;
		let showText = '';
		if (myData.mtype) {
			for (let i in typeName) {
				if (myData.mtype == typeName[i]) {
					typeIndex = i;
					break;
				}
			}
			showText = `${myData.sendUserName != '' ? myData.sendUserName + '：' : ''}[${typeText[typeIndex]}]`;
		} else {
			showText = '';
		}
		return (
			<TouchableHighlight
				activeOpacity={1}
				onPress={() => {
					this._onPressItem(myData)
				}}
				underlayColor='#f0f0f0'
				style={{backgroundColor: myData.promote_priority > 0 ? '#eeeeee' : '#fff'}}>
				<View style={styles.itemBody}>
					<View style={styles.itemLeft}>
						{myData.ttype == 3 ? (
							<View style={[{
								width: 46,
								height: 46,
								borderRadius: 4,
								backgroundColor: '#ffbe76'
							}, baseStyles.row_col_center]}>
								<Icons name={'ios-notifications'} size={28} color={'#FFFFFF'}/>
							</View>
						) : (
							<Image source={{
								uri: (myData.ttype == 1 ? Path.headImgNew + '?imageName=' + myData.image_name + '&imageId=' + myData.image_name + '&sourceType=singleImage&jidNode=' : Path.groupHeadImg + '?type=groupImage&fileInfoId=' + myData.image_name) + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket,
								cache: 'reload'
							}} style={{width: 46, height: 46, borderRadius: 4}}/>
						)}

						{
							myData.unread_number > 0 ? <View style={{
								backgroundColor: 'red',
								width: 16,
								height: 16,
								borderRadius: 50,
								// marginTop:5,
								alignItems: 'center',
								justifyContent: 'center',
								position: 'absolute',
								top: -5,
								right: -5,
							}}>
								<Text style={{color: '#FFFFFF', fontSize: 10}}>{msgNum}</Text>
							</View> : null
						}
					</View>
					<View style={styles.itemRight}>
						<View style={styles.itemRightTop}>
							<View style={styles.itemRightTopLeft}>
								<Text numberOfLines={1}
											style={{textAlign: 'left', color: '#333', fontSize: 16}}>{myData.trueName}</Text>
							</View>
							<View style={styles.itemRightTopRight}>
								<Text style={{
									textAlign: 'right',
									color: '#999',
									fontSize: 10
								}}>{FormatDate.formatTimeStmpToFullTime(myData.newest_time)}</Text>
							</View>
						</View>
						<View style={styles.itemRightBottom}>
							{
								myData.mtype == 'text' ? (
									<View style={{flexDirection: 'row'}}>
										{this.isAtMessage(myData)}
										<Text style={{color: '#999', fontSize: 13, width: width * 0.6}} numberOfLines={1}>
											{`${myData.sendUserName == '' || (myData.content.indexOf('撤回') != -1) ? '' : myData.sendUserName + '：'}${myData.content}`}
										</Text>
									</View>
								) : (
									<Text style={{color: '#999', fontSize: 13}} numberOfLines={1}>
										{showText}
									</Text>
								)
							}
						</View>
					</View>
				</View>
			</TouchableHighlight>
		)
	};

	/**
	 * 对比群组
	 */
	compareGroups = () => {
		// this.refs.messageHead._changeHeaderTitle('消息(接收中...)');
		Sqlite.selectTalkerByType(this.state.basic.userId, 2, (data) => {
			//检查本地库群组变更
			let url = Path.getAllGroups + '?occupantJid=' + this.state.basic.jidNode + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, {
				uuId: this.state.uuid,
				userId: this.state.basic.userId,
				ticket: this.state.ticket
			}, (responseJson) => {
				if (responseJson.code.toString() == '200') {
					let groupList = responseJson.data;
					let num = 0;
					data.map((item) => {
						num++;
						let flag = false;
						for (var i = 0; i < groupList.length; i++) {
							if (item.jid_node == groupList[i].roomJid) {//如果是群聊
								if (item.image_name != groupList[i].photoId) {
									Sqlite.updateTalkerName(this.state.basic.userId, 2, item.jid, item.jid_node, item.trueName, groupList[i].photoId, false, false, false, () => {
										this.fetchMessage();
									});
								}
								flag = true;
								break;
							}
						}
						if (!flag) {
							Sqlite.deleteTalker(this.state.basic.userId, item.jid_node, (res) => {
								if (num == data.length) {
									this.fetchMessage();
								}
							})
						}
					});
				}
			})
		})
	}


	/**
	 * 请求服务器获取list数据
	 */
	fetchMessage() {
		Sqlite.selectTalkers(this.state.basic.userId, "", (res) => {
			DeviceEventEmitter.emit('resetTabNum');//刷新单聊foot红点数量
			this.setState({
				dataSource: res,
				loaded: true,
				animating: false,
			});
		})
	};

	/**
	 * 获取工作邀请和群通知提醒数量
	 */
	getJobAndNotification() {
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
			if (parseInt(responseJson.data.noticeNum) > 0) {
				//通知
				DeviceEventEmitter.emit('invNotice', {
					tempMsgInfo: {applicant: 'notice'},
					num: parseInt(responseJson.data.noticeNum)
				});
			}
			if (parseInt(responseJson.data.jobNum) > 0) {
				//工作邀请
				DeviceEventEmitter.emit('workNew', 'true');
			} else {
				DeviceEventEmitter.emit('workNew', 'false');
			}

		});
	}

	/**
	 * 获取群组离线数据
	 */
	fetchMessageNum() {
		let url = Path.getOfflineMsg;
		let params = {
			backNewest: true,//true返回全部字段，false返回数量和roomJid
			jidNode: this.state.basic.jidNode,
			userRoomTimes: []
		};
		Sqlite.selectOfflineTime(this.state.basic.userId, '', (res) => {
			if (res.length > 0) {
				res.map((item, index) => {
					let tempObj = {
						lastTime: item.last_time,
						roomJidNode: item.room_jid
					}
					params.userRoomTimes.push(tempObj);
				});
			}
			FetchUtil.netUtil(url, params, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, (responseJson) => {
				// this.refs.messageHead._changeHeaderTitle('消息');
				if (responseJson.code == 200 && responseJson.data.result == 'Success') {
					let arr = responseJson.data.notRead;
					if (arr.length > 0) {
						arr.map((item, index) => {
							let groupId = item.roomName.split('@')[0];
							let body = typeof item.body == 'string' ? JSON.parse(item.body) : item.body;
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
							Sqlite.selectTalkers(this.state.basic.userId, groupId, (data) => {
								if (data.length > 0) {
									Sqlite.updateTalkerUnread(this.state.basic.userId, groupId, item.count, () => {
										Sqlite.saveMessage(this.state.basic.userId, groupId, msgType, msgContent, body.basic.userName, body.id, body.basic.sendTime, (data) => {
											this.fetchMessage();
											DeviceEventEmitter.emit('resetTabNum');
										});
									})
								} else {
									Sqlite.saveTalker(
										this.state.basic.userId,
										2,
										'',
										groupId,
										item.roomtruename,
										item.photo_id,
										false,
										false,
										false,
										() => {
											Sqlite.saveMessage(
												this.state.basic.userId,
												groupId,
												msgType,
												msgContent,
												body.basic.userName,
												body.id, body.basic.sendTime,
												(data) => {
													Sqlite.updateTalkerUnread(this.state.basic.userId, groupId, item.count, (data) => {
														this.fetchMessage();
														DeviceEventEmitter.emit('resetTabNum');
													});
													Sqlite.updateTalkerIsAnted(this.state.basic.userId, groupId, false, () => {
													});
												}
											);
										}
									);
								}
							});
						})
					}
				}
			});
		});
	}

	/**
	 * 获取通知数量
	 */
	getNotification(){
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
                DeviceEventEmitter.emit('invNotice', {
                    tempMsgInfo: {applicant: 'notice'},
                    num: parseInt(responseJson.data.noticeNum)
                });
                DeviceEventEmitter.emit('refreshPage', 'refresh');
            });
    	}



	_onPressItem = (item) => {
		NetInfo.isConnected.fetch().done((isConnected) => {
			if (isConnected) {
				if (item.ttype == 1) {
					let obj = {
						backPage: 'Message',
						basic: this.state.basic,
						token: this.state.token,
						selectFlag: false,
						friendDetail: {
							jid: item.jid.indexOf('@') > 0 ? item.jid : item.jid + '@' + Path.xmppDomain,
							jidNode: item.jid_node,
							photoId: item.image_name,
							trueName: item.trueName
						},
						ticket: this.state.ticket,
					};
					Global.chat_detail = obj;
					this.props.navigation.navigate('Chat', obj);
				} else if (item.ttype == 2) {
					if (typeof Global.groupMute[item.jid_node] == "string" && (Global.groupMute[item.jid_node] == "0" || Global.groupMute[item.jid_node] == "1")) {
						let obj = {
							backPage: 'Group',
							basic: this.state.basic,
							token: this.state.token,
							selectFlag: false,
							ticket: this.state.ticket,
							room: {
								roomName: item.trueName,
								roomJid: item.jid_node,
								photoId: item.image_name,
								mute: Global.groupMute[item.jid_node]
							}
						};
						Global.chat_detail = obj;
						this.props.navigation.navigate('Chat', obj);
					} else {
						let url = Path.baseUrl + '/groupChat/queryUserMute' + '?roomJid=' + item.jid_node + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
						FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
							if (responseJson == 'tip') {
								this._toast('查询当前用户禁言状态失败');
								// this.refs.toast.show(tip, DURATION.LENGTH_SHORT);
							} else if (responseJson.code.toString() == '200') {
								let mute = responseJson.data[0].isMute;
								Global.groupMute[item.jid_node] = mute;
								let obj = {
									backPage: 'Group',
									basic: this.state.basic,
									token: this.state.token,
									selectFlag: false,
									ticket: this.state.ticket,
									room: {
										roomName: item.trueName,
										roomJid: item.jid_node,
										photoId: item.image_name,
										mute: mute
									}
								};
								Global.chat_detail = obj;
								this.props.navigation.navigate('Chat', obj);
							}
						});
					}
				} else {
					//通知类型
					this.props.navigation.navigate('GroupCheck');
				}
			} else {
				this.refs.toast.show("请检查当前网络状态！", DURATION.LENGTH_SHORT);
			}
		});
	};
	_customRefresh = () => {
		return (
			<View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
				<View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
					<Image source={require('../../images/refreshIcon.png')} style={{width: 20, height: 20}}/>
				</View>
				<View style={{alignItems: 'center', justifyContent: 'center'}}>
					<Text style={{textAlign: 'center', color: 'rgba(76,122,238,1)'}}>{'下拉刷新'}</Text>
				</View>
			</View>
		)
	};

	_downloadFile = () => {
		let url = Path.downloadApk + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		let downloadDest = '';
		if (Platform.OS == 'android') {
			downloadDest = RNFS.ExternalDirectoryPath + '/InstantMessage.apk';
		} else {
			//downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/InstantMessage.api';
		}
		const options = {
			fromUrl: url + '&platformType=android',
			toFile: downloadDest,
			background: true,
			begin: (res) => {
			},
			progress: (res) => {
				let pro = res.bytesWritten / res.contentLength;
				this.setState({
					progress: pro,
				});
			},
			progressDivider: 1
		};
		try {
			const ret = RNFS.downloadFile(options);
			ret.promise.then(res => {
				if (res.statusCode == 200) {
					this.setState({
						prossesModalVisible: false//下载完成关闭modal框
					}, () => {
						if (Platform.OS == 'android') {
							// this.refs.toast.show('保存成功', DURATION.LENGTH_SHORT);
							// Install an app:自动安装
							ApkInstaller.install(downloadDest);
						}
					});
				}
			}).catch(err => {
			});
		}
		catch (e) {
		}
	};

	//确认下载弹框
	showAlert(version) {
		Alert.alert('新版本 v' + version, '更新测试',
			[
				{
					text: "取消", onPress: () => {
						this.setState({showConfirm: false, updateFlag: false})
					}
				},
				{
					text: "确认", onPress: () => {
						if (Platform.OS == 'android') {
							this.setState({prossesModalVisible: true}, () => {
								this._downloadFile();
							})
						} else {
							Linking.openURL(Path.downloadUrl).catch(err => console.error('网络错误，请重新打开', err));
						}
					}
				},
			]
		);
	};

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg: text//alert提示信息
		});
	};

	showAlertNew = () => {
		this.setState({
			showAlert: true
		});
	};

	hideAlert = () => {
		this.setState({
			showAlert: false
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
					//onCancelPressed={() => {
					//	this.hideAlert();
					//}}
					onConfirmPressed={() => {
						this.hideAlert();
					}}
				/>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={3000}/>
				<Modal
					visible={this.state.prossesModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'slide'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						this.setState({prossesModalVisible: false})
					}}
				>
					<View style={{flex: 1}}>
						<View style={{
							backgroundColor: 'rgba(0,0,0,0.5)',
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
							paddingLeft: 20,
							paddingRight: 20
						}}>
							<View style={{
								backgroundColor: 'white',
								width: width * 0.8,
								height: height * 0.25,
								borderRadius: 4,
								padding: 20
							}}>
								<View style={{flex: 2}}>
									<Text style={{flex: 1, fontSize: 18, fontWeight: 'bold'}}>{'正在更新'}</Text>
									<Text style={{flex: 1, fontSize: 15}}>{'请稍后...'}</Text>
								</View>
								<View style={{flex: 1}}>
									<MyProgress.Bar
										progress={this.state.progress}
										width={width * 0.8 - 40}
										color={'#278EEE'}
										unfilledColor={'#CCCCCC'}
										useNativeDriver={true}
									/>
									<Text style={{
										textAlign: 'right',
										fontSize: 12,
										color: '#CCCCCC'
									}}>{`${Math.floor(this.state.progress * 100).toFixed(0)}%`}</Text>
								</View>
							</View>
						</View>
					</View>
				</Modal>

				<Header
					ref={'messageHead'}
					headRightFlag={true}
					title={this.state.netWorkIsConnect ? (this.props.unReadCount > 0 ? '消息' + '(' + this.props.unReadCount + ')' : '消息') : '消息(无连接)'}
					onPressRightBtn={() => {
						this.setState({isPopShow: !this.state.isPopShow})
					}}
					rightItemImage={require('../../images/add-member.png')}
				/>
				{!this.state.loaded ? (
					this.renderLoadingView()
				) : (
					<SwipeListView
						useFlatList={true}
						keyExtractor={(item, index) => String(index)}
						data={this.state.dataSource}
						renderItem={this.callback.bind(this)}
						renderHiddenItem={(rowData, rowMap) => {
							return (
								<TouchableOpacity
									style={[styles.backRightBtn, styles.backRightBtnRight]}
									onPress={() => {
										rowMap[rowData.index].closeRow();
										Sqlite.updateTalkerIsAnted(this.state.basic.userId, rowData.item.jid_node, false, () => {
											DeviceEventEmitter.emit('refreshPage', 'refresh');
										});
										if (rowData.item.ttype == 2) {
											//更新离线时间
											Sqlite.saveOfflineTime(this.state.basic.userId, rowData.item.jid_node, new Date().getTime());
										}
										Sqlite.deleteTalker(this.state.basic.userId, rowData.item.jid_node, () => {
											DeviceEventEmitter.emit('resetTabNum');
											this.fetchMessage();
										})
									}}>
									<Text style={{color: '#fff'}}>删除</Text>
								</TouchableOpacity>
							)
						}}
						closeOnRowBeginSwipe={true}
						refreshing={false}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						onRefresh={() => {
							this.refreshMsg(1)
						}}
						disableRightSwipe={true}
						rightOpenValue={-75}
						stopRightSwipe={-75}
						swipeToClosePercent={5}
						previewOpenValue={0}
					/>
				)}
				{this.state.isPopShow ? (
					<View style={styles.cover}>
						<TouchableOpacity style={{flex: 1}} onPress={() => {
							this.setState({isPopShow: false})
						}}>
							<View style={{flex: 1, alignItems: 'flex-end', position: 'relative',}}>
								<View style={styles.popView}>
									{/*<Image source={require('../../images/popoverBackgroundRight.png')}*/}
									{/*style={styles.backgroundImage}/>*/}
									<View style={styles.popViewTip}/>
									<View style={styles.buttonView}>
										<TouchableOpacity style={styles.buttonViewBox} onPress={this.joinRoom}>
											<View style={styles.buttonViewIcon}>
												<Icons name={'ios-add'} size={28} color={'#FFFFFF'}/>
											</View>
											<Text style={styles.buttonText}>加入群</Text>
										</TouchableOpacity>
										<View style={{width: 100, height: 1, backgroundColor: '#fff'}}/>
										<TouchableOpacity style={styles.buttonViewBox} onPress={this.creatRoom}>
											<View style={styles.buttonViewIcon}>
												<Icons name={'ios-chatboxes-outline'} size={20} color={'#FFFFFF'}/>
											</View>
											<Text style={styles.buttonText}>创建群</Text>
										</TouchableOpacity>
										<View style={{width: 100, height: 1, backgroundColor: '#fff'}}/>
										<TouchableOpacity style={styles.buttonViewBox} onPress={
											() => {
												this.setState({
													isPopShow: false
												}, () => {
													this.props.navigation.navigate('QRScanner', {
														uuid: this.state.uuid,
														ticket: this.state.ticket,
														basic: this.state.basic
													})
												})
											}
										}>
											<View style={styles.buttonViewIcon}>
												<Icons name={'ios-qr-scanner'} size={18} color={'#FFFFFF'}/>
											</View>
											<Text style={styles.buttonText}>扫一扫</Text>
										</TouchableOpacity>
									</View>
								</View>
							</View>
						</TouchableOpacity>
					</View>) : (<View></View>)}
			</View>
		)
	}
}
const popSize = 42;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		paddingBottom: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 34 : 0) : 0,
	},
	centering: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	itemBody: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#E9E9E9',
		marginLeft: 10,
		// marginRight: 16,
		alignItems: 'center',
		paddingTop: 7,
		paddingBottom: 7,
	},
	itemLeft: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 46,
		height: 46,
		marginRight: 8,
		position: 'relative'
	},
	itemRight: {
		flex: 1,
	},
	itemRightTop: {
		flexDirection: 'row',
		marginBottom: 2,
	},
	itemRightTopLeft: {
		flex: 2,
		justifyContent: 'flex-start',
	},
	itemRightTopRight: {
		flex: 1,
		paddingRight: 8,
	},
	itemRightBottom: {
		justifyContent: 'center',
		paddingRight: 8,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
	},
	backRightBtnLeft: {
		backgroundColor: 'blue',
		left: 0,
	},
	backRightBtnRight: {
		backgroundColor: 'red',
		right: 0,
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#fff',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
	},
	cover: {
		flex: 1,
		position: 'absolute',
		top: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 88 : 60) : 40,
		left: 0,
		bottom: 0,
		right: 0,
		backgroundColor: 'rgba(0,0,0,0.1)'
	},
	popView: {
		width: (320 / 280) * 100,
		height: popSize * 3 + 12,
		justifyContent: 'center',
		alignItems: 'center'
	},
	popViewTip: {
		position: 'absolute',
		right: 15,
		top: -10,
		width: 1,
		height: 1,
		borderTopWidth: 10,
		borderLeftWidth: 5,
		borderRightWidth: 5,
		borderBottomWidth: 10,
		borderTopColor: 'transparent',
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderBottomColor: '#464646',
	},
	buttonView: {
		flex: 1,
		marginTop: 10,
		backgroundColor: '#464646',
		// borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: 5,
		paddingRight: 5
	},
	buttonViewBox: {
		flexDirection: 'row',
		height: popSize,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonViewIcon: {
		width: 20,
		height: 20,
		marginRight: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		textAlign: 'center',
		fontSize: 16,
		color: '#fff',
	},
});