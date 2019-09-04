/*
* 工作邀请发布页
* */
import React, {Component} from 'react';
import {
	StyleSheet, Text, View,
	Platform, TouchableOpacity, BackHandler, ScrollView, TextInput,
	DeviceEventEmitter, Keyboard, NativeModules, Alert
} from 'react-native';
import Header from '../../component/common/Header';
import DeviceInfo from 'react-native-device-info';
import Icons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import ParticipantsList from './ParticipantsList';
import cookie from '../../util/cookie';
import Toast, {DURATION} from 'react-native-easy-toast';
import XmlUtil from '../../util/XmlUtil';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import RedisUtil from '../../util/RedisUtil';
import UUIDUtil from '../../util/UUIDUtil';
import ToolUtil from "../../util/ToolUtil";
import Global from "../../util/Global";
import AwesomeAlert from "react-native-awesome-alerts";

const FilePickerManager = Platform.select({
	ios: () => null,
	android: () => require('react-native-file-picker'),//android
})();

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
let onceSubmit;
const inputComponents = [], HEIGHT = 48;
export default class InvitePublish extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			jobBody: {//工作信息提交对象
				jidNode: props.navigation.state.params.basic.jidNode,
				title: '',//工作主题
				content: '',//工作详情
				pushContent: '您有一条新的工作邀请',
				participants: [],//参与人
				endTime: '',//工作结束时间
				fileName: '',//附件
				depts: [],
				currentUid: Global.loginUserInfo.uid,
			},
			filesArr: [],
			selectedParticipants: [],//存一下选择的参与人员完整信息
			isDateTimeVisible: false,//日期选择显示
			isParticipants: false,//参与人员选择显示
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	}

	componentDidMount() {
		onceSubmit = this.state.basic.userId + new Date().getTime();

		RedisUtil.onceSubmit(onceSubmit, this.props.navigation,
			{
				ticket: this.state.ticket,
				uuId: this.state.uuid,
				userId: this.state.basic.userId
			});

	}

	componentWillMount() {
		if (Platform.OS == 'android') {
//			this.groupIq = XMPP.on('iq', (iq) => this._XMPPdidReceiveIQ(iq));
			this.InvitePubBack = BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
		}
	}

	componentWillUnmount() {
		if (Platform.OS == 'android') {
			this.InvitePubBack.remove();
		}
	}

	_XMPPdidReceiveIQ = (iq) => {

		if (iq.type == 'result' && this.workInviteNodeStatue) {

			this.state.jobBody.participants.map((id) => {
				//发送订阅
				let sendReadIqToGroup = XmlUtil.subscriptionToGroup(id + '@' + Path.xmppDomain, this.join);
				XMPP.sendStanza(sendReadIqToGroup);
			});

			this.workInviteNodeStatue = false;
			this.workInviteReadStatue = true;
		}

		if (iq.type == 'result' && this.workInviteReadStatue) {

			this.state.jobBody.participants.map((id) => {
				//发布消息
				let sendGroup = XmlUtil.sendMessageInviteWorkGroup(id, this.state.basic.jid, this.join, 'WORKINVITATION');
				XMPP.sendStanza(sendGroup);
			});
			this.workInviteReadStatue = false;
		}
	};

	onBackAndroid = () => {
		if (this.state.isParticipants) {
			this.setState({isParticipants: false})
		} else {
			this.props.navigation.goBack();
		}
		return true;
	}

	_showDateTimePicker = () => this.setState({isDateTimeVisible: true});
	_hideDateTimePicker = () => this.setState({isDateTimeVisible: false});

	_selectJobInviteDay = (date) => {
		let body = this.state.jobBody,
			now = new Date(),
			Y = date.getFullYear(),
			M = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1),
			D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate(),
			h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours(),
			m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
			s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
		let day = `${Y}-${M}-${D} ${h}:${m}:${s}`;
		if (date > now) {
			body.endTime = day;
		} else {
			this._toast('请选择合理时间');
		}
		this.setState({
			jobBody: body,
			isDateTimeVisible: false
		});
	}

	//处理TextInput失焦聚焦问题 start
	_onStartShouldSetResponderCapture(event) {
		let target = event.nativeEvent.target;
		if (!inputComponents.includes(target)) {
			Keyboard.dismiss();
		}
		return false;
	};

	_inputOnLayout(event) {
		inputComponents.push(event.nativeEvent.target);
	};

	//处理TextInput失焦聚焦问题 end

	_inputInvite = (text, key) => {
		let body = this.state.jobBody;
		body[key] = text;
		this.setState({
			jobBody: body
		});
	}
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
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'工作发布'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					style={{flex: 1}}>
					<View style={styles.inviteContainer}>
						<View style={[styles.inviteGroup, {borderTopColor: 'transparent'}]}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.inviteGroupTitle}>工作主题</Text>
							<TextInput style={styles.inviteGroupText}
												 onLayout={this._inputOnLayout.bind(this)}
												 underlineColorAndroid={'transparent'}
												 placeholder='请输入工作主题'
												 maxLength={90}
												 onChangeText={(text) => this._inputInvite(text, 'title')}
							/>
						</View>
						<View style={[styles.inviteGroup, {flexDirection: 'column', flex: 1}]}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.inviteGroupTitle}>工作内容</Text>
							<View style={styles.inviteGroupTextArea}
										onStartShouldSetResponder={() => this.refs.textArea.focus()}>
								<TextInput ref="textArea"
													 style={{fontSize: 16, padding: 2}}
													 onLayout={this._inputOnLayout.bind(this)}
													 multiline={true}
													 underlineColorAndroid={'transparent'}
													 placeholder='请填写具体内容'
													 onChangeText={(text) => this._inputInvite(text, 'content')}
								/>
							</View>
						</View>
						<View style={styles.inviteGroup}>
							<Text style={styles.inviteGroupTitle}>参与者</Text>
							<TouchableOpacity style={styles.inviteTouch} onPress={() => {
								HandlerOnceTap(
									() => {
										this.setState({isParticipants: true});
									}
								)
							}}>
								<Text style={styles.inviteTouchText}>{this.state.jobBody.participants.length}</Text>
								<Icons name={'ios-arrow-forward'} size={30} color={'#CCCCCC'}/>
							</TouchableOpacity>
						</View>
						<View style={styles.inviteGroup}>
							<Text style={styles.inviteGroupTitle}>完成时间</Text>
							<TouchableOpacity style={styles.inviteTouch} onPress={() => {
								HandlerOnceTap(this._showDateTimePicker)
							}}>
								<Text style={styles.inviteTouchText}>{this.state.jobBody.endTime}</Text>
								<Icons name={'ios-arrow-forward'} size={30} color={'#CCCCCC'}/>
							</TouchableOpacity>
						</View>
					</View>
					<View style={styles.separatorLine}/>
					<View style={styles.inviteContainer}>
						{Platform.OS == 'ios' ? null : (<View style={[styles.inviteGroup, {borderTopColor: 'transparent'}]}>
							<Text style={styles.inviteGroupTitle}>附件</Text>
							<TouchableOpacity style={styles.inviteTouch} onPress={() => {
								HandlerOnceTap(this._updateFile)
							}}>
								<Text style={styles.inviteTouchText}></Text>
								<Icons name={'ios-arrow-forward'} size={30} color={'#CCCCCC'}/>
							</TouchableOpacity>
						</View>)}

						{
							this.state.filesArr.map((item, index) => {
								return <View key={index}
														 style={{
															 height: HEIGHT,
															 justifyContent: 'center',
															 flexDirection: 'row',
															 borderTopColor: '#d7d7d7',
															 borderTopWidth: 1,
															 paddingTop: 10,
															 paddingBottom: 10
														 }}>
									<Text numberOfLines={1} style={{flex: 1, marginRight: 10}}>{item.name}</Text>
									<TouchableOpacity onPress={() => {
										HandlerOnceTap(
											() => {
												let arr = this.state.filesArr, str = '';
												for (let i in arr) {
													if (arr[i].path == item.path) {
														arr.splice(i, 1);
													}
												}
												for (let a in arr) {
													str += arr[a].name + '|$|' + arr[a].path + '@';
												}
												this.setState({
													fileName: str,
													filesArr: arr
												});
											}
										)
									}}>
										<Icons name={'ios-close'} size={26} color={'#000'}/>
									</TouchableOpacity>
								</View>
							})
						}
					</View>
					<View style={styles.separatorLine}/>
					<View style={styles.inviteContainer}>
						<TouchableOpacity style={styles.inviteSubmit} onPress={() => {
							HandlerOnceTap(this._postInvite)
						}}>
							<Text style={{fontSize: 16, color: 'white'}}>发表</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
				<DateTimePicker
					mode='datetime'
					date={new Date()}
					titleIOS={'选择时间'}
					cancelTextIOS={'取消'}
					confirmTextIOS={'确认'}
					isVisible={this.state.isDateTimeVisible}
					onConfirm={this._selectJobInviteDay}
					onCancel={this._hideDateTimePicker}
				/>
				{
					this.state.isParticipants ? <ParticipantsList
						infor={{
							uuid: this.state.uuid,
							basic: this.state.basic,
							ticket: this.state.ticket,
							selectedParticipants: this.state.selectedParticipants,
							selectedNot: []
						}}
						cancelParticipants={() => {
							this.setState({isParticipants: false});
						}}
						selectedParticipants={(info) => {
							let body = this.state.jobBody,
								arr = [];
							for (let i in info) {
								arr.push(info[i].jidNode);
							}
							body.participants = arr;
							this.setState({
								selectedParticipants: info,
								participants: body,
								isParticipants: false
							})
						}}
						title="选择参与人员"
					/> : null
				}
			</View>
		)
	}

	_updateFile = () => {
		cookie.save('isUpload', 1);
		FilePickerManager.showFilePicker(null, (response) => {
			if (!response.didRequestPermission) {
				if (response.didCancel) {
				} else if (response.error) {
				} else {
					response.fileName = response.path.substring(response.path.lastIndexOf('/') + 1, response.path.length);
					let formData = new FormData();
					let file = {uri: response.uri, type: 'multipart/form-data', name: encodeURIComponent(response.fileName)};
					formData.append("file", file);
					let url = Path.getInviteFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'multipart/form-data',
						},
						body: formData,
					}).then((response) => response.json()).then((responseData) => {
						if (responseData.code.toString() == '200') {
							let fileName = response.fileName.replace(/&/g, '').replace(/@/g, '').replace(/=/g, '') + '|$|' + responseData.data[0].data + '@';
							let body = this.state.jobBody;
							body.fileName = body.fileName + fileName;
							let arrey = this.state.filesArr;
							arrey.push({
								name: response.fileName,
								path: responseData.data[0].data
							});
							this.setState({
								jobBody: body,
								filesArr: arrey
							});
						} else {
							this._toast("上传失败");
						}
					}, () => {
						this._toast("上传失败");
					}).catch((error) => {
						this._toast("上传失败");
						console.error('error', error);
					});
				}
			} else {
				if (Platform.OS == 'android') {
					this.requestReadExternalStoragePermission();
				}
			}
		});
	}

	_postInvite = () => {

		const body = this.state.jobBody;
		body['key'] = onceSubmit;

		if (body['title'] == '') {
			this._toast('标题为空或含有非法字符');
		} else if (body['title'].length >= 90) {
			this._toast('标题长度不得超过90位');
		} else if (ToolUtil.isEmojiCharacterInString(body['title'])) {
			this._toast('标题不得含有非法字符');
		} else if (body['content'] == '') {
			this._toast('内容不得为空');
		} else if (ToolUtil.isEmojiCharacterInString(body['content'])) {
			this._toast('内容不得含有非法字符');
		} else if (body['participants'].length <= 0) {
			this._toast('请选择参与人员');
		} else if (body['endTime'] == '') {
			this._toast('请选择工作需要完成的时间');
		} else {
			DeviceEventEmitter.emit('changeLoading', 'true');
			FetchUtil.netUtil(Path.getInvitePublish, body, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, (responseJson, msg) => {
				DeviceEventEmitter.emit('changeLoading', 'false');
				if (responseJson == 'tip') {
					this._toast(msg);
					return;
				}
				if (responseJson.code.toString() == '200') {

					if (Platform.OS == 'ios') {
						XMPP.XMPPInviteWorkNode({
								'uuid': UUIDUtil.getUUID().replace(/\-/g, ''),
								'userJid': this.state.basic.jidNode,
								'inviteJids': body['participants'],
								'type': 'WORKINVITATION',
								'userId': this.state.basic.jidNode
							},
							(error, event) => {
								if (error) {
									this.setState({
										showAlert: true,//alert框
										tipMsg: error//alert提示信息
									});
								}
							})

					} else {
						this.join = UUIDUtil.getUUID().replace(/\-/g, '');
						this.workInviteNodeStatue = true;

						/*let sendMetuIqToGroup = XmlUtil.createGroupNode(this.state.basic.jidNode, this.join);
						XMPP.sendStanza(sendMetuIqToGroup);*/
					}

					DeviceEventEmitter.emit('inviteAddPage');
					DeviceEventEmitter.emit('changeLoading', 'false');
					this.props.navigation.goBack();
				} else if (responseJson.code.toString() == '-33') {
					this._toast('请求已提交，请勿重复操作');
					// this.refs.toast.show('请求已提交，请勿重复操作', DURATION.LENGTH_SHORT);
				}
			});
		}
	}

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg: text//alert提示信息
		});
		// this.refs.toast.show(text, DURATION.LENGTH_SHORT);
	}

	//动态获取存储权限
	async requestReadExternalStoragePermission() {
		try {
			const granted = await PermissionsAndroid.requestMultiple(
				[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]
			);
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
		flex: 1,
		backgroundColor: '#fff',
	},
	inviteContainer: {
		paddingLeft: 15,
		paddingRight: 15,
	},
	separatorLine: {
		height: 10,
		backgroundColor: '#f0f0f0'
	},
	inviteGroup: {
		flexDirection: 'row',
		justifyContent: 'center',
		borderTopColor: '#dadada',
		borderTopWidth: 1,
		backgroundColor: 'white',
	},
	inviteGroupTitle: {
		fontSize: 16,
		color: '#333',
		height: HEIGHT,
		lineHeight: HEIGHT,
	},
	inviteGroupText: {
		flex: 1,
		textAlign: 'right',
		height: HEIGHT,
		fontSize: 16,
		padding: 2,
	},
	inviteGroupTextArea: {
		borderColor: '#dadada',
		borderWidth: 1,
		marginBottom: 10,
		paddingLeft: 5,
		paddingRight: 5,
		height: HEIGHT * 3,
		justifyContent: 'flex-start',
	},
	inviteTouch: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row'
	},
	inviteTouchText: {
		flex: 1,
		fontSize: 16,
		color: '#999',
		textAlign: 'right',
		marginRight: 10
	},
	inviteSubmit: {
		backgroundColor: '#549dff',
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 10,
		paddingBottom: 10,
		marginTop: 40,
		marginBottom: 40,
	}
});
