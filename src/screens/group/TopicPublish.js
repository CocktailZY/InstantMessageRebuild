/*
 * 话题发布
 * 页面元素 标题 内容 上传附件
 *
 */
import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	Platform,
	TouchableWithoutFeedback,
	DeviceEventEmitter,
	TouchableOpacity, Keyboard,
	NativeModules,
	ScrollView,
	PermissionsAndroid, Alert, BackHandler
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Icons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import cookie from '../../util/cookie';
import UUIDUtil from "../../util/UUIDUtil";
import XmlUtil from "../../util/XmlUtil";
import ToolUtil from '../../util/ToolUtil';
import AwesomeAlert from "react-native-awesome-alerts";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import RedisUtil from '../../util/RedisUtil';
import XmppUtil from "../../util/XmppUtil";
import PushUtil from "../../util/PushUtil";

const FilePickerManager = Platform.select({
	ios: () => null,
	android: () => require('react-native-file-picker'),//android
})();
const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
const inputComponents = [], ACT_HEIGHT = 38;
let onceSubmit;

class TopicPublish extends Component {
	constructor(props) {
		super(props);

		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			room: props.navigation.state.params.room,
			topicBody: {
				jidNode: props.navigation.state.params.basic.jidNode,
				mid: props.navigation.state.params.room.roomJid,
				title: '',
				content: '',
				fileName: ''
			},
			filesArr: [],
			messageBody: {
				"id": UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg',
				"messageType": 'topic',
				"topicId": '',
				"basic": {
					"userId": props.navigation.state.params.basic.jidNode,
					"userName": props.navigation.state.params.basic.trueName,
					"head": props.navigation.state.params.room.head,
					"sendTime": new Date().getTime(),
					"groupId": props.navigation.state.params.room.roomJid,
					"groupName": props.navigation.state.params.room.roomName,
					"type": 'topic'
				},
				"content": {
					"text": '',
					"interceptText": '',
					"file": [],
					"title": ''
				},
				"atMembers": [],
				"occupant": {
					"state": '',
					"effect": '',
					"active": ''
				}
			},
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	componentDidMount() {
		onceSubmit = this.state.basic.userId + new Date().getTime();

		RedisUtil.onceSubmit(onceSubmit, this.props.navigation,
			{
				ticket: this.state.ticket,
				uuId: this.state.uuid,
				userId: this.state.basic.userId
			});
		if (Platform.OS == 'android') {
			this.requestReadExternalStoragePermission();
		}

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
		let body = this.state.topicBody;
		body[key] = text;
		this.setState({
			topicBody: body
		}, () => {
		});
	};
	//上传附件
	_uploadFiles = () => {
		cookie.save('isUpload', 1);

		FilePickerManager.showFilePicker(null, (response) => {
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
						let fileName = response.fileName + '|$|' + responseData.data[0].data + '@';
						let body = this.state.topicBody;
						body.fileName = body.fileName + fileName;
						let arrey = this.state.filesArr;
						arrey.push({
							name: response.fileName,
							path: responseData.data[0].data
						});
						this.setState({
							topicBody: body,
							filesArr: arrey
						});
					}else{
						this._toast("上传失败");
					}
				}, () => {
                    this._toast("上传失败");
				}).catch((error) => {
                    this._toast("上传失败");
				});
			}

		});
	};

	//提交话题
	submitTopic = () => {
		// FetchUtil.netUtil(Path.isRoomAdmin + '?ticket=' + this.state.ticket + '&uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&roomJid=' + this.state.room.roomJid + '&jidNode=' + this.state.basic.jidNode, {}, 'GET', this.props.navigation, '', (responseJson) => {
		//
		// 	if (responseJson.code.toString() == '200') {
		// 		if (responseJson.data) {
					let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
					let body = this.state.topicBody;
					body['key'] = onceSubmit;
					if (body.title.trim() == '') {
						this._toast('话题标题不得为空');
					} else if(ToolUtil.isEmojiCharacterInString(body.title)){
						this._toast('标题不得含有非法字符');
					}else if(body.title.length > 32){
						this._toast('标题长度不得超过32位');
					} else if (body.content.trim() == '') {
						this._toast('内容不得为空');
					} else if (body.content.length > 60000) {
						this._toast('内容长度不得超过6万位');
					} else if (ToolUtil.isEmojiCharacterInString(body.content)) {
						this._toast('内容不得含有非法字符');
					}else {
                        XmppUtil.xmppIsConnect(()=>{
                            FetchUtil.netUtil(Path.getTopicPublish, body, 'POST', this.props.navigation, {
                                uuId: this.state.uuid,
                                ticket: this.state.ticket,
                                userId: this.state.basic.userId
                            }, (responseJson) => {
                                if(responseJson =="tip"){
                                    this._toast('提交会题失败！');
                                    // this.refs.toast.show('获取联系人失败！', DURATION.LENGTH_SHORT);
                                }else if(responseJson.code.toString() == '200') {
                                    let msgBody = this.state.messageBody;
                                    msgBody.topicId = responseJson.data.topicId;
                                    msgBody.content.title = body.title;
                                    msgBody.id = newMsgId;

                                    this.setState({
                                        messageBody: msgBody
                                    }, () => {
                                        if (Platform.OS == 'ios') {
                                            XMPP.XMPPSendGroupMessage({
                                                    'message': this.state.messageBody,
                                                    'jid': this.state.room.roomJid,
                                                    'uuid': this.state.uuid
                                                },
                                                (error, event) => {
                                                    if (error) {
                                                        this._toast(error);
                                                    } else {
                                                        DeviceEventEmitter.emit('topicAddPage');
                                                    }
                                                })

                                        } else {
                                            let sendGroupAnn = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgId);
                                            XMPP.sendStanza(sendGroupAnn);
                                            DeviceEventEmitter.emit('topicAddPage');
                                            // DeviceEventEmitter.emit('noticeChatPage', {body: this.state.messageBody, type: 'topic'});
                                        }
																			PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, '', this.state.room.roomName, this.props.navigation);
                                        this.props.navigation.goBack();
                                    });
                                } else if (responseJson.code.toString() == '-33') {
                                    this._toast('请求已提交，请勿重复操作');
                                }
                            });
                        },(error)=>{
                            this.setState({
                                showAlert: true,//alert框
                                tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
                            });
                        });
					}
	};

	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'发表话题'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					keyboardShouldPersistTaps={'always'}
					style={{flex: 1, backgroundColor: 'white', paddingLeft: 15, paddingRight: 15}}>
					<View style={[styles.voteGroup, {borderTopColor: 'transparent'}]}
					      onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
						<Text style={styles.voteTitle}>话题标题</Text>
						<TextInput ref={'voteTitle'}
						           onLayout={this._inputOnLayout.bind(this)}
						           style={styles.voteInput}
						           value={this.state.topicBody.title}
						           underlineColorAndroid={'transparent'}
						           maxLength={32}
						           placeholder='请输入话题标题'
						           onChangeText={(text) => this._inputInvite(text, 'title')}/>
					</View>
					{Platform.OS == 'ios' ? null : (<View style={styles.voteGroup}
					                                      onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
						<View style={{flex: 1}}>
							<Text style={styles.voteTitle}>上传附件</Text>
						</View>
						<TouchableWithoutFeedback onPress={() => {
							if(this.state.filesArr.length >= 8){
								this._toast('最多上传8个文件！');
							}else{
								HandlerOnceTap(this._uploadFiles)
							}
						}}>
							<View style={{flex: 1, justifyContent: 'center', alignItems: 'flex-end'}}>
								<MaterialIcon size={24} name="file-upload" color="#CCCCCC"/>
							</View>
						</TouchableWithoutFeedback>
					</View>)}

					<View style={[styles.voteGroup, {
						flexDirection: 'column',
						borderTopColor: this.state.filesArr.length <= 0 ? 'transparent' : '#ccc'
					}]}>
						{
							this.state.filesArr.map((item, index) => {
								return <View key={index}
								             style={{
									             justifyContent: 'center',
									             flexDirection: 'row',
									             borderTopColor: index == 0 ? 'transparent' : '#d7d7d7',
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
					<View style={[styles.voteGroup, {flexDirection: 'column', marginBottom: 10}]}
					      onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
						<Text style={styles.voteTitle}>话题内容</Text>
						<View style={{flex: 1, borderWidth: 1, borderColor: '#f0f0f0'}}
						      onStartShouldSetResponder={() => this.refs.textArea.focus()}>
							<TextInput ref="textArea"
							           style={{fontSize: 16, padding: 2, height: 100, textAlignVertical: 'top'}}
							           onLayout={this._inputOnLayout.bind(this)}
							           multiline={true}
							           numberOfLines={10}
												 maxLength={60000}
							           placeholder='请输入话题内容'
							           underlineColorAndroid={'transparent'}
							           onChangeText={(text) => this._inputInvite(text, 'content')}
							/>
						</View>
					</View>
					<TouchableOpacity style={styles.btn} onPress={() => {
						HandlerOnceTap(this.submitTopic)
					}}>
						<Text style={{fontSize: 15, color: '#fff'}}>发表</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.btn, {backgroundColor: '#979394'}]} onPress={() => {
						HandlerOnceTap(
							() => {
								this.props.navigation.goBack();
							}
						)
					}}>
						<Text style={{fontSize: 15, color: '#fff'}}>取消</Text>
					</TouchableOpacity>
				</ScrollView>
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
			</View>
		)
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

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
		});
	};

	//动态获取存储权限
	async requestReadExternalStoragePermission() {
		try {
			const granted = await PermissionsAndroid.requestMultiple(
				[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]
			)
			if (granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] == PermissionsAndroid.RESULTS.GRANTED &&
				granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] == PermissionsAndroid.RESULTS.GRANTED
			) {
			} else {
			}
		} catch (err) {
		}
	}

}

const styles = StyleSheet.create({
	container: {flex: 1, backgroundColor: '#FFFFFF'},
	voteGroup: {
		flexDirection: 'row',
		borderTopColor: '#ccc',
		borderTopWidth: 1,
		paddingTop: 5,
		paddingBottom: 5,
	},
	voteTitle: {
		fontSize: 16,
		color: '#333',
		height: ACT_HEIGHT,
		lineHeight: ACT_HEIGHT,
	},
	voteInput: {
		flex: 1,
		textAlign: 'right',
		fontSize: 16,
		padding: 0,
	},
	btn: {
		height: 43,
		borderRadius: 4,
		backgroundColor: '#4e71ff',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 14,
	}
});
export default TopicPublish;
