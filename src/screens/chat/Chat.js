import React, {Component, PureComponent} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Platform,
	Image,
	TouchableOpacity,
	TouchableWithoutFeedback,
	ScrollView,
	DeviceEventEmitter,
	NativeModules,
	RefreshControl,
	Keyboard,
	Modal,
	Dimensions,
	ToastAndroid,
	Alert,
	ActivityIndicator,
	PanResponder,
	BackHandler,
	PermissionsAndroid,
	FlatList, Animated,
	ImageBackground,
} from 'react-native';
import Header from '../../component/common/Header';
import CustomTextInput from '../../component/common/TextInput';
import CustomBtn from '../../component/common/CommitBtn';
import BottomMenu from '../../component/common/BottomMenu';
import Icons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import IMUI from 'aurora-imui-react-native';

let InputView = IMUI.ChatInput;
let MessageListView = IMUI.MessageList;
const AuroraIController = IMUI.AuroraIMUIController;

import BottomPanel from './BottomPanel';
import FormatDate from '../../util/FormatDate';
import DeviceInfo from 'react-native-device-info';
import Path from '../../config/UrlConfig';
import FetchUtil from '../../util/FetchUtil';
import ToolUtil from '../../util/ToolUtil';
import GroupDetail from "../group/GroupDetail";
import AtMember from './AtMember';
import TranspondMember from './TranspondMember';
// import DialogBox from '../../component/common/DialogBottom';
import ImagePickerManager from 'react-native-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import OpenFile from 'react-native-doc-viewer';
import ShowEmoji from 'react-native-emoji';
import GridView from 'react-native-super-grid';
import UUIDUtil from '../../util/UUIDUtil';
import XmlUtil from '../../util/XmlUtil';
import Sqlite from "../../util/Sqlite";
import FileType from "../../util/FileType";
import Base64Util from "../../util/Base64Util";
import EmojiUtil from '../../util/EmojiDeal';
import cookie from '../../util/cookie';
import Sound from "react-native-sound";
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import RNFS from 'react-native-fs';
import fileTypeReturn from '../../util/FileType';
import Toast, {DURATION} from 'react-native-easy-toast';
import PushUtil from "../../util/PushUtil";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Pdf from 'react-native-pdf';
import RedisUtil from "../../util/RedisUtil";
import PermissionUtil from "../../util/PermissionUtil";
import Global from "../../util/Global";
import HtmlUtil from "../../util/HtmlUtil";
import {Popover, PopoverController} from 'react-native-modal-popover';
import AwesomeAlert from "react-native-awesome-alerts";
import XmppUtil from "../../util/XmppUtil";
import ParamsDealUtil from "../../util/ParamsDealUtil";
// const Pdf = Platform.select({
// 	ios: () => null,
// 	//android: () => require('react-native-pdf'),//android
// })();

const StatusBarAndroid = Platform.select({
	ios: () => null,
	android: () => require('react-native-android-statusbar'),
})();

const FilePickerManager = Platform.select({
	ios: () => null,
	android: () => require('react-native-file-picker'),//android
})();

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

const uuid = DeviceInfo.getUniqueID().replace(/\-/g, '');
const {height, width} = Dimensions.get('window');

let photoOptions = {
	//底部弹出框选项
	title: '请选择',
	cancelButtonTitle: '取消',
	takePhotoButtonTitle: '拍照',
	chooseFromLibraryButtonTitle: '打开相册',
	cameraType: 'back',//only ios
	mediaType: 'photo',
	quality: 1,
	allowsEditing: false,//only ios
	noData: false,
	storageOptions: {
		cameraRoll: true,
		path: 'file'
	}
};


let messagesBody = [];
let chatMessagesBody = [];
let pageBegin = 0;
let pageSize = Path.pageSize;
let keyCode = {};//图片id对应下标
let audioPath = Platform.OS == 'android' ? '/storage/emulated/0/Android/data/com.instantmessage/files/test.aac' : AudioUtils.DocumentDirectoryPath + '/test.aac';//AudioUtils.DocumentDirectoryPath + '/test.aac';
let beginTime = '', endTime = '';
let pressInTime, pressOutTime;
let currentSelectPostion = 0;
let tempEmojiPanelStatus = false, tempPanelStatus = false;
let s;
let scrollViewHeight = 0;
let firstJidNode = '';//上一次的头像
let lastPresTime = 1;
let recordStatus = false;
let flagAni = 0;//是否循环动画
let tempTime = 0;//时间小灰条
let nowPageFlag = 0;//标记当前页
export default class Chat extends PureComponent {
	constructor(props) {
		super(props);

		/**
		 *  imui
		 */
		let initHeight;
		if (Platform.OS === "ios") {
			initHeight = 46
		} else {
			initHeight = 100
		}

		this.state = {
			scrollFlag: true,//滚动标记
			fileAnimating: false,//文件预览动画
			text: '',
			// password: '1qaz@WSX',
			msgType: 'text',
			panelMark: false,
			emojiMark: false,
			data: [],
			pageTotal: 0,//总记录条数
			totalPage: 1,//总页数
			currentNum: 0,//下拉首条下标
			nowPageNum: 1,//当前页
			numFlag: 0,
			isRefreshing: false,
			refreshFlag: true,
			backPage: props.navigation.state.params.backPage,
			messageBody: props.navigation.state.params.backPage == 'Group' ? {
				"id": UUIDUtil.getUUID().replace(/\-/g, ''),
				"type": 0,
				"basic": {
					"userId": props.navigation.state.params.basic.jidNode,
					"userName": props.navigation.state.params.basic.trueName,
					"head": props.navigation.state.params.room.photoId,
					"sendTime": new Date().getTime(),
					"groupId": props.navigation.state.params.room.roomJid,
					"groupName": props.navigation.state.params.room.roomName,
					"type": 'groupChat'
				},
				"content": {
					"text": '',
					"interceptText": '',
					"file": [],
				},
				"atMembers": [],
				"occupant": {
					"state": '',
					"effect": '',
					"active": ''
				}
			} : {
				"id": UUIDUtil.getUUID().replace(/\-/g, ''),
				"type": 0,
				"basic": {
					"toId": props.navigation.state.params.friendDetail.jidNode,
					"type": "privateChat",
					"fromId": props.navigation.state.params.basic.jidNode,
					"userId": props.navigation.state.params.basic.userId,
					"photoId": props.navigation.state.params.basic.photoId,
					"userName": props.navigation.state.params.basic.trueName
				},
				"keyId": "privateSend00",
				"content": {
					"file": [],
					"text": "",
					"interceptText": '',
					"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
					"imageFiles": [],
				},
				"showTime": true
			},
			room: props.navigation.state.params.backPage == 'Group' ? props.navigation.state.params.room : '',
			friendDetail: props.navigation.state.params.backPage == 'Group' ? '' : props.navigation.state.params.friendDetail,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			selectFlag: props.navigation.state.params.selectFlag,//是否为第一次聊天
			AtMemberType: false,
			TranspondMemberType: false,//转发好友列表显示
			msgImgList: [],//聊天区图片地址数组，用于预览
			imgModalVisible: false,//图片预览模态框，false不显示
			chooseImgId: '',//选中图片下标
			secText: '',
			isPlay: false,//是否播放语音消息中
			isRecard: false,//是否录制语音中
			chooseFile: {},//选中文件
			isFileShow: false,//文件长按转发
			isFileShowID: '',
			TranspondMemberItem: {},//转发file
			showConfirm: false,//下载确认框显示，false不显示
			isImageShow: false,//图片长按转发
			isImageShowID: '',
			isTextShow: false,//文本长按转发
			isTextShowID: '',
			isAudioShow: false,//文本长按转发
			isAudioShowID: '',
			animatingOther: true,
			childClickFlag: true,
			jidArr: [],//at成员jid数组
			atItems: [],//at成员数组
			tempMsgType: 0,//转发消息类型
			isAudioBoxShow: false,//录音状态
			uuid: uuid,
			memberNumber: 1,
			isNewMsg: true,//标记，false下拉数据,true新消息数据
			enterType: 'done', //发送键类型
			token: props.navigation.state.params.token,
			tempHead: 0,//暂存头像
			pdfModalVisible: false,//pdf预览Modal
			tempViewFileSize: 0,//点击预览文件大小
			pdfInsideModalVisible: false,//pdf里面的Modal
			source: {uri: '', cache: true},//pdf
			canAudio: Platform.OS == 'android' ? false : true,//默认不可提交录音文件,ios默认全程开启
			isShowIcon: false,//默认上传失败的icon不显示
			isFailPosition: 0,//上传失败的data位置
			isNotPC: false,//不是PC消息，true不是，false是
			chooseShowModalVisible: false,//文件预览Modal
			viewFile: {},//被预览文件对象
			left: new Animated.Value(0),//录音播放时动画
			voiceHeight: new Animated.Value(100),//语音录制时动画
			isRemove: false,//ios消息测绘状态
			playAnimation: true,//动画状态
			isRefresh: true,
			choosedItem: {},//被长按对象
			showAlert: false,//alert框
			tipMsg: '',//alert提示信息

			/**
			 *  imui
			 */
			inputLayoutHeight: initHeight,
			messageListLayout: {flex: 1, width: window.width, margin: 0},
			inputViewLayout: {width: window.width, height: initHeight,},
			isAllowPullToRefresh: true,
			navigationBar: {},

		};
		this.nowLen = '';
		this.renderFlag = true;
		this.popObj = () => {
		};
		this.timeNum = 0;
		this.pageNumFlag = true;
		this.flagPageNum = 0;

		/**
		 *  imui
		 */
		this.updateLayout = this.updateLayout.bind(this);
		this.onMsgClick = this.onMsgClick.bind(this);
		this.messageListDidLoadEvent = this.messageListDidLoadEvent.bind(this);
	}

	componentDidMount() {

		/**
		 * Android only imui
		 * Must set menu height once, the height should be equals with the soft keyboard height so that the widget won't flash.
		 * 在别的界面计算一次软键盘的高度，然后初始化一次菜单栏高度，如果用户唤起了软键盘，则之后会自动计算高度。
		 */
		if (Platform.OS === "android") {
			this.refs["ChatInput"].setMenuContainerHeight(316)
		}
		this.resetMenu();
		AuroraIController.addMessageListDidLoadListener(this.messageListDidLoadEvent);


		// download progress
		DeviceEventEmitter.addListener(
			'RNDownloaderProgress',
			(Event) => {
				// this.setState({progress: Event.progress + " %"});
			}
		);
		//录音开始监听
		this.recordStartedListener = DeviceEventEmitter.addListener(
			'recordStarted',
			(data) => {
			}
		);
		//录音初始化完成监听
		this.recordInitedListener = DeviceEventEmitter.addListener(
			'recordInited',
			(data) => {
				if (data.status == "OK" && recordStatus) {
					this.setState({
						isAudioBoxShow: true,
					}, () => {
						AudioRecorder.startRecording();
					});
				}
			}
		);

		//录音完成监听
		if (this.recordFinishedListener) {
			this.recordFinishedListener.remove();
		}
		this.recordFinishedListener = DeviceEventEmitter.addListener(
			'recordFinished',
			(data) => {
				if (data.status == "OK") {
					RNFS.exists(audioPath).then((value) => {
                        if(!value){
                            Alert.alert(
                                '提醒',
                                '请确认是否开启录音权限！',
                                [
                                    {
                                        text: '确定',
                                    }
                                ]
                            )
						}else if (value == true && endTime - beginTime >= 1000) {
							this.upLoadVoiceFile();
						} else {
							this.refs.toast.show('语音时间太短！', 3000);
						}
					}).catch((err) => {
					});
				} else if (data.status == "false") {
				} else {
					RNFS.unlink(audioPath).then(() => {
					}).catch((err) => {
					});
				}

			}
		);


		if (this.chatBackKey) {
			this.chatBackKey.remove();
		}
		this.chatBackKey = BackHandler.addEventListener("back", () => {
			let curTime = new Date().getTime();
			if (curTime - lastPresTime > 500) {
				lastPresTime = curTime;
				return false;
			}
			return true;
		});
		if (this.refreshChatContent) {
			this.refreshChatContent.remove();
		}
		this.refreshChatContent = DeviceEventEmitter.addListener('refreshChatContent', (params) => {
			this.setState({
				backPage: params.backPage,
				ticket: params.ticket,
				friendUserId: params.friendUserId,
				basic: params.basic,
				friendDetail: params.friendDetail,
				selectFlag: params.selectFlag,
				data: []
			}, () => {
				this.fetchData()
			});
		});

		//刷新导航条群名称
		if (this.reRoomName) {
			this.reRoomName.remove();
		}
		this.reRoomName = DeviceEventEmitter.addListener(
			'refreshGroupName', (newName) => {
				this.setState({roomName: newName ? newName : this.props.navigation.params.room.roomName}, () => {
					this.refs.chatHeader._changeHeaderTitle(newName);
				});
			}
		);

		if (this.noticeChatPage) {
			this.noticeChatPage.remove();
		}
		this.noticeChatPage = DeviceEventEmitter.addListener('noticeChatPage', (params) => {
			let tempItemObj = {};
			tempItemObj.body = params.body;
			let arr = [];
			arr.push(tempItemObj);
			this.setState({
				data: this.state.data.concat(arr),
				messageBody: params.body,
				isNewMsg: true,
				isNotPC: true
			}, () => {
				// this.sendType = 'mobile';
				// this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, params.type, params.body.basic.userName, params.body.id);//'announcement'
			});
			// 本地数据库公告入库
		});

		if (this.chatHeadChange) {
			this.chatHeadChange.remove();
		}
		this.chatHeadChange = DeviceEventEmitter.addListener('changeChatHead', () => {
			this.fetchgetMemberNumber();
		});

		//update消息页面未读条数
		Sqlite.updateTalker(this.state.basic.userId, this.state.backPage == 'Message' ? this.state.friendDetail.jidNode : this.state.room.roomJid, 0, true, false, false, () => {
			DeviceEventEmitter.emit('refreshPage', 'refresh');
			DeviceEventEmitter.emit('resetTabNum');

		});
		//更新离线时间
		if (this.props.navigation.state.params.backPage == 'Group') {
			Sqlite.saveOfflineTime(this.state.basic.userId, this.state.room.roomJid, null);
		}

		/*if (this.keyboardDidShowListener) {
			this.keyboardDidShowListener.remove();
		}*/
		/*this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
			// this.renderFlag = false;
			this.setState({
				panelMark: false,
				emojiMark: false,
			}, () => {
				//this._scrollView.recordInteraction();
				if (this.state.data.length >= Path.pageSizeNew) {
					// this._scrollView.scrollToIndex({animated:true,index:this.state.data.length-1,viewPosition: 0})
					//this._scrollView.scrollToEnd({animated: false})
				}
				//this._scrollView.scrollToEnd();
			});
		});*/

		this.changeAtMemberShow = DeviceEventEmitter.addListener('changeAtMember', (param) => {
			this.setState({
				AtMemberType: param
			})
		})

		if (Platform.OS == 'ios') {
			if (this.groupMessageNotification) {
				this.groupMessageNotification.remove();
			}
			this.groupMessageNotification = DeviceEventEmitter.addListener('groupMessageToRN', (messageBody) => {

				let tempRoom = JSON.parse(JSON.stringify(this.state.room));
				if (messageBody.msgInfo && messageBody.msgInfo.mode == 'SETMUTE' && messageBody.msgInfo.effect == this.state.basic.jidNode && messageBody.msgInfo.roomjid == this.state.room.roomJid) {// &&occupant": {

					tempRoom.mute = '1';//被禁言
					this.setState({
						room: tempRoom
					})
				} else if ((messageBody.msgInfo && messageBody.msgInfo.mode == 'SETUNMUTE' && messageBody.msgInfo.effect == this.state.basic.jidNode && messageBody.msgInfo.roomjid == this.state.room.roomJid) || (messageBody.msgInfo && messageBody.msgInfo.mode == 'SETOWNER' && messageBody.msgInfo.effect == this.state.basic.jidNode)) {
					tempRoom.mute = '0';//取消禁言
					this.setState({
						room: tempRoom
					})
				}

				if (messageBody.msgInfo) {
					let tempMsgInfo = messageBody.msgInfo;
					let tempEffectId;
					if (tempMsgInfo.mode == 'OWNLEAVE' || tempMsgInfo.mode == 'SETLEAVE' || tempMsgInfo.mode == 'DISABLEGROUP') {

						if (tempMsgInfo.mode == 'OWNLEAVE') {
							tempEffectId = tempMsgInfo.active;
						} else {
							tempEffectId = tempMsgInfo.effect;
						}

						if (tempMsgInfo.mode == 'SETLEAVE' || tempMsgInfo.mode == 'DISABLEGROUP') {

							if (tempEffectId == this.state.basic.jidNode && tempMsgInfo.roomjid == this.state.room.roomJid) {

								Alert.alert(
									'提醒',
									tempMsgInfo.mode == 'SETLEAVE' ? '您被移出该群组' : '该群组已禁用',
									[
										{
											text: '确定',
											onPress: () => {
												DeviceEventEmitter.emit('refreshGroupList');
												this.props.navigation.goBack();
											},
										}
									]
								)
							}
						}

						if (tempEffectId == this.state.basic.jidNode) {
							//群聊
							Sqlite.selectTalkers(this.state.basic.userId, tempMsgInfo.roomjid, (data) => {
								if (data.length > 0) {
									// if (body.occupant && ((body.occupant.state == 'OWNLEAVE' || body.occupant.state == 'SETLEAVE' || body.occupant.state == 'DISABLEGROUP') && tempEffectId == this.state.basic.jidNode)) {
									//说明当前登录人被移出群组或主动退群
									//删除本地库数据
									Sqlite.deleteTalker(this.state.basic.userId, tempMsgInfo.roomjid, () => {
										DeviceEventEmitter.emit('refreshPage', 'refresh');//删除后刷新message列表
									})
									// }
								}
							});
						}
					}

					//SETADMIN' : 'SETMEMBER'
					if (tempMsgInfo.effect == this.state.basic.jidNode && (tempMsgInfo.mode == 'SETMEMBER' || tempMsgInfo.mode == 'SETADMIN')) {
						DeviceEventEmitter.emit('refreshGroupDetail');
					}
				}

				if (messageBody.isRemoveMsg == 'true') {
					//messagesBody = [];
					this.setState({
						//data: messagesBody,
						currentNum: 0
					}, () => {
						nowPageFlag = 0;
						if (this.state.backPage == 'Group') {
							this.fetchData();
						}

					});
					//this.fetchData();
				} else {
					if (messageBody.body) {
						let groupMesbody = JSON.parse(messageBody.body);
						Sqlite.updateTalkerIsAnted(this.state.basic.userId, groupMesbody.basic.groupId, false, () => {
							DeviceEventEmitter.emit('refreshPage', 'refresh');
						});


						if (groupMesbody.basic.groupId == this.state.room.roomJid) {

							let mesbody = {};
							mesbody['body'] = groupMesbody;
							messagesBody.push(mesbody);

							let imgArr = [];
							let i = 0;
							messagesBody.map((item, index) => {
								if (item.time) {
									//当前项是时间项
								} else {
									let body = item.body;
									if (body.content.file && body.content.file.length > 0) {
										if ((body.content.file[0].listFileInfo[0].showPic == 'img') && (body.type.toString() == '2')) {

											imgArr.push({
												url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].fileName + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode='
												// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName + '&type=image' + '&userId=' + this.state.basic.userId,
											})
											keyCode[body.content.file[0].listFileInfo[0].id] = i;
											i++;
										}
									}
								}
							});

							this.setState({
								data: messagesBody,
								pageTotal: this.state.pageTotal++,
								currentNum: this.state.currentNum++,
								msgImgList: imgArr
							})
						}

						if (groupMesbody.occupant && groupMesbody.occupant.state == 'OWNLEAVE' && groupMesbody.basic.userId == this.state.basic.jidNode && groupMesbody.basic.groupId == this.state.room.roomJid) {
							this.props.navigation.goBack();
						}

						if (groupMesbody.occupant && (groupMesbody.occupant.state == 'DISABLEGROUP' && groupMesbody.basic.userId != this.state.basic.jidNode)) {
							XMPP.initiativeLeaveGroup(
								{
									'roomJid': this.state.room.roomJid,
									'peopleId': this.state.basic.jidNode,
									'id': UUIDUtil.getUUID().replace(/\-/g, '')

								},
								(error, event) => {
									if (error) {
										this.refs.toast.show('系统异常', DURATION.LENGTH_SHORT);

									} else {
										if (groupMesbody.basic.userId != this.state.basic.jidNode && groupMesbody.basic.groupId == this.state.room.roomJid) {
											Alert.alert(
												'提醒',
												'该群组已禁用',
												[
													{
														text: '确定',
														onPress: () => {
															DeviceEventEmitter.emit('refreshGroupList');
															this.props.navigation.goBack();
														},
													}
												]
											)
										}
									}
								})
						}

						if (groupMesbody.occupant && groupMesbody.occupant.state == 'UPDATENAME') {
							let url = Path.getGroupDetail + '?roomJid=' + messageBody.from.split('@')[0] + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
							FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
								if (responseJson == 'tip') {
									this.refs.toast.show('网络错误，获取群详情失败');
								} else if (responseJson.code.toString() == '200') {
									let tmpDetail = JSON.parse(responseJson.data).groupDetail;
									Sqlite.updateTalkerName(this.state.basic.userId, 2, tmpDetail.roomJid + Path.xmppGroupDomain, tmpDetail.roomJid, tmpDetail.roomName, tmpDetail.photoId, false, false, false, () => {
										DeviceEventEmitter.emit('refreshPage');
									});
								}
							});
						}
					}
				}
			});

			if (this.messageReceiveNotification) {
				this.messageReceiveNotification.remove();
			}
			this.messageReceiveNotification = DeviceEventEmitter.addListener('messageReceiveToRN', (messageBody) => {

				if (messageBody.isRemoveMsg == 'true') {

					chatMessagesBody = [];
					this.setState({
						data: [],
						isRemove: true,
					}, () => {
						if (this.state.backPage == 'Message') {
							this.fetchData();
						}
					});

				} else {

					if (messageBody.body && messageBody.body != '(null)') {

						let mesbody = {};
						mesbody['body'] = JSON.parse(messageBody.body);
						if (messageBody.to.indexOf(messageBody.from) != -1) {
							mesbody['sendType'] = 'to';
						} else {
							mesbody['sendType'] = 'from';
						}


						if ((mesbody.body.basic.fromId == this.state.friendDetail.jidNode) || (mesbody.body.basic.fromId == this.state.basic.jidNode)) {

							let imgArr = [];
							if (mesbody.body.content.file && mesbody.body.content.file.length > 0) {
								if ((mesbody.body.content.file[0].listFileInfo[0].showPic == 'img') && (mesbody.body.type.toString() == '2')) {

									this.state.msgImgList.push({
										url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + mesbody.body.content.file[0].listFileInfo[0].fileName + '&imageId=' + mesbody.body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode='
										// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName + '&type=image' + '&userId=' + this.state.basic.userId,
									})

								}
							}

							//this.state.data.push(mesbody)
							chatMessagesBody.push(mesbody)
							this.setState({
								data: chatMessagesBody,
								isRemove: false,
								msgImgList: imgArr.concat(this.state.msgImgList)
							})
						}
						if (messageBody.to.indexOf(messageBody.from) != -1) {
							this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'text', '', mesbody.body.id);
						}

					}

				}

			});

			if (this.messageSendNotification) {
				this.messageSendNotification.remove();
			}
			this.messageSendNotification = DeviceEventEmitter.addListener('messageSendToRN', (messageBody) => {

				let mesbody = {};
				mesbody['body'] = JSON.parse(messageBody);
				mesbody['sendType'] = 'to';

				if ((mesbody.body.basic.fromId == this.state.friendDetail.jidNode) || (mesbody.body.basic.fromId == this.state.basic.jidNode) && (mesbody.body.basic.toId == this.state.friendDetail.jidNode)) {

					//this.state.data.push(mesbody)
					chatMessagesBody.push(mesbody);
					this.setState({
						data: chatMessagesBody
					})
				}

			});

			if (this.iqCountNotification) {
				this.iqCountNotification.remove();
			}
			this.iqCountNotification = DeviceEventEmitter.addListener('iqCountToRN', (iq) => {

				let url = Path.getCount + '?xml=' + iq + '&userId=' + this.state.basic.userId + '&uuId=' + uuid + '&ticket=' + this.state.ticket;
				FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {

					if (responseJson.code.toString() == '200') {

						this.setState({
							pageTotal: responseJson.set.count
						});

						if (pageBegin <= 0 - pageSize) {
							this.setState({
								refreshFlag: false
							})
						} else {
							pageBegin = responseJson.set.count <= pageSize ? '0' : responseJson.set.count - pageSize;
							XMPP.XMPPGetHistoryMessageDetail({
								'friendJid': this.state.friendDetail.jid,
								'pageSize': responseJson.set.count < pageSize ? responseJson.set.count : pageSize,
								'index': pageBegin
							})
						}
					}
				});
			});

			if (this.iqDetailNotification) {
				this.iqDetailNotification.remove();
			}
			this.iqDetailNotification = DeviceEventEmitter.addListener('iqDetailToRN', (iq) => {

				if (iq) {
					let baseIQ = Base64Util.encode(iq);
					let url = Path.getDetail;

					FetchUtil.netUtil(url, {'xml': baseIQ}, 'POST', this.props.navigation, {
						'ticket': this.state.ticket,
						'userId': this.state.basic.userId,
						'uuId': this.state.uuid
					}, (responseJson) => {

						if (responseJson == 'tip') {
							this.refs.toast.show('网络错误，获取聊天记录失败');
						} else if (responseJson.code.toString() == '200') {

							if (this.state.isRemove) {
								chatMessagesBody = responseJson.list;
							} else {
								chatMessagesBody = responseJson.list.concat(this.state.data);
							}

							let imgArr = [];
							let i = 0;
							chatMessagesBody.map((item, index) => {
								if (item.time) {
									//当前项是时间项
								} else {
									let body = item.body;
									if (body.content.file && body.content.file.length > 0) {
										if ((body.content.file[0].listFileInfo[0].showPic == 'img') && (body.type.toString() == '2')) {

											imgArr.push({
												url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].fileName + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode='
												// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName + '&type=image' + '&userId=' + this.state.basic.userId,
											})
											keyCode[body.content.file[0].listFileInfo[0].id] = i;
											i++;
										}
									}
								}
							});

							this.setState({
								data: chatMessagesBody,
								msgImgList: imgArr.concat(this.state.msgImgList)
							})
						}
					})
				}

			});

		} else {
			XMPP.on('unparsedIQ', (message) => this._xmlToJson(message));
			this._chatMsgListener = XMPP.on('message', (message) => this._loadMessage(message));
		}

		if (this.setGroupId) {
			this.setGroupId.remove();
		}
		this.setGroupId = DeviceEventEmitter.emit('setGroupId', this.state.backPage == 'Group' ? this.state.room.roomJid : this.state.friendDetail.jidNode);

		// 获取个人photoId
		// cookie.get('selfPhotoId').then(res => {
		// 	let basic = this.state.basic;
		// 	basic.photoId = res;
		// 	this.setState({basic: basic}, () => {
		// 	});
		// });
	};

	componentWillUnmount() {
		pageBegin = 0;
		nowPageFlag = 0;
		this.nowLen = '';
		this.renderFlag = true;
		this.popObj = () => {
		};
		this.timeNum = 0;
		this.pageNumFlag = true;
		this.flagPageNum = 0;
		keyCode = {};
		if (s) {
			s.stop(() => s.release());
		}
		DeviceEventEmitter.emit('setGroupId', null);
		if (Platform.OS == 'ios') {
			this.messageReceiveNotification.remove();
			this.messageSendNotification.remove()
			this.groupMessageNotification.remove();
			this.iqDetailNotification.remove();
			this.iqCountNotification.remove();
			messagesBody = [];
			chatMessagesBody = [];
		} else {
			this._chatMsgListener.remove();
			this.noticeChatPage.remove();
			XMPP.removeListener('unparsedIQ');
		}
		this.chatHeadChange.remove();
		this.chatBackKey.remove();
		this.recordStartedListener.remove();
		this.recordInitedListener.remove();
		this.recordFinishedListener.remove();
		this.changeAtMemberShow.remove();

		/**
		 *  imui
		 */
		AuroraIController.removeMessageListDidLoadListener(this.messageListDidLoadEvent);
	}

	/**
	 *  imui
	 */
	messageListDidLoadEvent = () => {
		this.fetchData();
	};
	/**
	 *  imui
	 */
	resetMenu = () => {
		if (Platform.OS === "android") {
			this.refs["ChatInput"].showMenu(false);
			this.setState({
				messageListLayout: {flex: 1, width: window.width, margin: 0},
				navigationBar: {height: 64, justifyContent: 'center'},
			});
			this.forceUpdate();
		} else {
			AuroraIController.hidenFeatureView(true);
		}
	};
	/**
	 * Android need this event to invoke onSizeChanged
	 */
	onTouchEditText = () => {
		this.refs["ChatInput"].showMenu(false)
	};

	onFullScreen = () => {
		console.log("on full screen");
		this.setState({
			messageListLayout: {flex: 0, width: 0, height: 0},
			inputViewLayout: {flex: 1, width: window.width, height: window.height},
			navigationBar: {height: 0}
		})
	};

	onRecoverScreen = () => {
		// this.setState({
		//   inputLayoutHeight: 100,
		//   messageListLayout: { flex: 1, width: window.width, margin: 0 },
		//   inputViewLayout: { flex: 0, width: window.width, height: 100 },
		//   navigationBar: { height: 64, justifyContent: 'center' }
		// })
	};

	onInputViewSizeChange = (size) => {
		console.log("onInputViewSizeChange height: " + size.height + " width: " + size.width)
		if (this.state.inputLayoutHeight != size.height) {
			this.setState({
				inputLayoutHeight: size.height,
				inputViewLayout: {width: window.width, height: size.height},
				messageListLayout: {flex: 1, width: window.width, margin: 0}
			})
		}
	};
	onAvatarClick = (message) => {
		AuroraIController.removeMessage(message.msgId)
		Alert.alert('消息撤回', message);
	}

	onMsgClick(message) {
		console.log(message)
		Alert.alert("message", JSON.stringify(message))
	}

	onMsgLongClick = (message) => {
		Alert.alert('message bubble on long press', 'message bubble on long press')
	}

	onStatusViewClick = (message) => {
		message.status = 'send_succeed'
		AuroraIController.updateMessage(message)
	}

	onBeginDragMessageList = () => {
		this.resetMenu()
		AuroraIController.hidenFeatureView(true)
	}

	onTouchMsgList = () => {
		AuroraIController.hidenFeatureView(true)
	};

	onPullToRefresh = () => {
		console.log("on pull to refresh");
		/*let messages = [];
		for (let i = 0; i < 14; i++) {
			let message = this.constructorXMPPMessage();
			// if (index%2 == 0) {
			message.msgType = "text";
			message.text = "" + i;
			// }

			if (i % 3 == 0) {
				message.msgType = "video";
				message.text = "" + i;
				message.mediaPath = "/storage/emulated/0/ScreenRecorder/screenrecorder.20180323101705.mp4"
				message.duration = 12
			}
			messages.push(message)
		}
		AuroraIController.insertMessagesToTop(messages)
		if (Platform.OS === 'android') {
			this.refs["MessageList"].refreshComplete()
		}*/

		this._onRefresh();

	}

	onSendText = (text) => {
		// let message = this.constructorXMPPMessage(true);
		// let evenmessage = this.constructorXMPPMessage(true);
		//
		// message.msgType = 'text';
		// message.text = text;
		//
		// AuroraIController.appendMessages([message]);

		this._setText(text);
		this._sendText();
	};

	onTakePicture = (media) => {
		console.log("media " + JSON.stringify(media));
		let message = this.constructorXMPPMessage(true);
		message.msgType = 'image';
		message.mediaPath = media.mediaPath;
		AuroraIController.appendMessages([message]);
		this.resetMenu();
		AuroraIController.scrollToBottom(true)
	};

	onStartRecordVoice = (e) => {
		console.log("on start record voice")
	}

	onFinishRecordVoice = (mediaPath, duration) => {
		let message = this.constructorXMPPMessage(true);
		message.msgType = "voice";
		message.mediaPath = mediaPath;
		message.duration = duration;
		AuroraIController.appendMessages([message]);
		console.log("on finish record voice");
	};

	onCancelRecordVoice = () => {
		console.log("on cancel record voice");
	};

	onStartRecordVideo = () => {
		console.log("on start record video");
	};

	onFinishRecordVideo = (video) => {
		// let message = this.constructorXMPPMessage();

		// message.msgType = "video"
		// message.mediaPath = video.mediaPath
		// message.duration = video.duration
		// AuroraIController.appendMessages([message])
	}

	onSendGalleryFiles = (mediaFiles) => {
		/**
		 * WARN: This callback will return original image,
		 * if insert it directly will high memory usage and blocking UI。
		 * You should crop the picture before insert to messageList。
		 *
		 * WARN: 这里返回的是原图，直接插入大会话列表会很大且耗内存.
		 * 应该做裁剪操作后再插入到 messageListView 中，
		 * 一般的 IM SDK 会提供裁剪操作，或者开发者手动进行裁剪。
		 *
		 * 代码用例不做裁剪操作。
		 */
		Alert.alert('fas', JSON.stringify(mediaFiles));
		for (let index in mediaFiles) {
			let message = this.constructorXMPPMessage(true);
			if (mediaFiles[index].mediaType == "image") {
				message.msgType = "image";
			} else {
				message.msgType = "video";
				message.duration = mediaFiles[index].duration;
			}

			message.mediaPath = mediaFiles[index].mediaPath;
			// message.status = "send_going";
			AuroraIController.appendMessages([message]);
			AuroraIController.scrollToBottom(true)
		}

		this.resetMenu()
	};

	onSwitchToMicrophoneMode = () => {
		AuroraIController.scrollToBottom(true)
	};

	onSwitchToEmojiMode = () => {
		AuroraIController.scrollToBottom(true)
	};
	onSwitchToGalleryMode = () => {
		AuroraIController.scrollToBottom(true)
	};

	onSwitchToCameraMode = () => {
		AuroraIController.scrollToBottom(true)
	};

	onShowKeyboard = (keyboard_height) => {
	};

	updateLayout(layout) {
		this.setState({inputViewLayout: layout})
	};

	onInitPress() {
		console.log('on click init push ');
		this.updateAction();
	};

	onClickSelectAlbum = () => {
		console.log("on click select album")
	};

	onCloseCamera = () => {
		console.log("On close camera event")
		this.setState({
			inputLayoutHeight: 100,
			messageListLayout: {flex: 1, width: window.width, margin: 0},
			inputViewLayout: {flex: 0, width: window.width, height: 100},
			navigationBar: {height: 64, justifyContent: 'center'}
		})
	};

	/**
	 * Switch to record video mode or not
	 */
	switchCameraMode = (isRecordVideoMode) => {
		console.log("Switching camera mode: isRecordVideoMode: " + isRecordVideoMode)
		// If record video mode, then set to full screen.
		if (isRecordVideoMode) {
			this.setState({
				messageListLayout: {flex: 0, width: 0, height: 0},
				inputViewLayout: {flex: 1, width: window.width, height: window.height},
				navigationBar: {height: 0}
			})
		}
	};
	// imui方法end------------------------------------------------------------------------------------------

	fetchgetMemberNumber() {
		if (this.state.backPage == 'Group') {
			let url = Path.getMemberNumber + '?roomJid=' + this.state.room.roomJid + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&currentJidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				let data = JSON.parse(responseJson.data);
				this.setState({
					memberNumber: data.data
				})
			})
		}
	}

	fetchData() {
		this.timeNum = 0;
		if (this.state.backPage == 'Group') {
			let url = Path.getGroupHistory + '?pageNum=' + this.state.nowPageNum + '&pageSize=' + Path.pageSizeNew + '&currentNum=' + this.state.currentNum + '&roomName=' + this.state.room.roomJid + Path.xmppGroupDomain
				+ '&uuId=' + uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + "&version=1";

			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				console.log('response:');
				console.log(responseJson);
				if (responseJson == 'tip') {
					this.refs.toast.show('网络错误，获取聊天记录失败');
				} else if (responseJson.code.toString() == '200') {
					let tempMsgBodyArr = [];
					if (responseJson.data.recordList.length < Path.pageSizeNew) {
						this.pageNumFlag = false;
					} else {
						this.pageNumFlag = true;
					}
					responseJson.data.recordList.map((item, index) => {
						let time = item.timestamp;
						if (tempTime != 0 && time && time - tempTime > 180000) {
							this.timeNum++;
							tempMsgBodyArr.push({time: time});
						}
						tempTime = time;
						tempMsgBodyArr.push(item);
					});
					if (!this.pageNumFlag) {
						this.flagPageNum = tempMsgBodyArr.length;
					}
					//如果是下拉加载更多，则拼接，否则不拼接数组
					messagesBody = this.state.nowPageNum == 1 ? tempMsgBodyArr : tempMsgBodyArr.concat(this.state.data);
					let imgArr = [];
					let i = 0;
					messagesBody = messagesBody.filter(obj => !obj.time);
					messagesBody.map((item, index) => {
						let body = item.body && (typeof item.body == "string") ? JSON.parse(item.body) : item.body;

						//像视图添加消息
						let isSelfMsg = this.state.basic.jidNode == body.basic.userId ? true : false;
						let imui_message = this.constructorXMPPMessage(isSelfMsg);

						if (body && body.type && body.type.toString() == '2' && body.content.file && body.content.file.length > 0 && body.content.file[0].listFileInfo[0].showPic == 'img') {
							imgArr.push({
								url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].fileName + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
							});
							keyCode[body.content.file[0].listFileInfo[0].id] = i;
							i++;
							imui_message.msgType = 'image';
						}else{
							if(body && body.type == '0'){
								imui_message.text = `${body.content.text}`;
							}
						}

						imui_message.status = 'send_succeed';
						AuroraIController.appendMessages([imui_message]);

					});
					this.setState({
						data: messagesBody,
						loaded: true,
						animatingOther: false,
						totalPage: responseJson.data.totalPage,
						pageTotal: responseJson.data.totalResult,
						nowPageNum: responseJson.data.currentPage,
						isNewMsg: responseJson.data.currentPage == 1 ? true : false,
						msgImgList: imgArr,
						memberNumber: responseJson.data.currentPage == 1 ? responseJson.data.members : this.state.memberNumber
					},()=>{
						if (Platform.OS === 'android') {
							this.refs["MessageList"].refreshComplete()
						}
						AuroraIController.scrollToBottom(true); //视图滚动到底部
					});
				}

			});

			//群聊查询本地数据库
			if (this.state.selectFlag) {
				Sqlite.selectTalkers(this.state.basic.userId, this.state.room.roomJid, (data) => {
					if (data.length > 0) {
						this.setState({
							selectFlag: false
						})
					}
				});
			}
		} else {
			//单聊
			if (Platform.OS == 'ios') {
				XMPP.XMPPGetHistoryMessageCount({
					'friendJid': this.state.friendDetail.jid,
					'uuid': uuid,
					'pageSize': '0'
				})

			} else {
				//获取单聊历史总页数
				this.setState({
					isRefresh: true
				}, () => {
					let pageTotal = XmlUtil.getPageTotal(0, this.state.friendDetail.jid);
					XMPP.sendStanza(pageTotal);
					//获取单聊历史分页数据
				})
			}

			//单聊查询本地数据库
			if (this.state.selectFlag) {
				Sqlite.selectTalkers(this.state.basic.userId, this.state.friendDetail.jidNode, (data) => {
					if (data.length > 0) {
						this.setState({
							selectFlag: false
						})
					}
				});
			}

		}

	};

	_xmlToJson = (message) => {
		try {
			let resultData = JSON.parse(message);
			let tempList = JSON.parse(resultData.list);
			if (tempList.length == 0) {
				if (resultData.set) {
					//有set说明有历史，没有set说明两个用户之前没有聊天历史
					this.setState({
						pageTotal: resultData.set.count,
						totalPage: Math.ceil(resultData.set.count / Path.pageSize)
					});
					if (resultData.set.count <= Path.pageSize) {
						pageBegin = 0;
						pageSize = resultData.set.count;
					} else {
						pageBegin = resultData.set.count - Path.pageSize;
						pageSize = Path.pageSize;
					}
					//最后一页数据
					let data = XmlUtil.getPrivateChatHistory(pageBegin, pageSize, this.state.friendDetail.jid);
					//console..log(data);
					XMPP.sendStanza(data);
				}
			} else {
				if (this.state.isRefresh) {
					this.timeNum = 0;
					this.setState({
						data: [],
						nowPageNum: 1,
					}, () => {
						let tempMsgBodyArr = [];
						let tempList = JSON.parse(resultData.list);
						tempList.map((item, index) => {
							let body = typeof item.body == 'string' ? JSON.parse(item.body) : item.body;
							item.body = body;
							let time = typeof body.content.sendTime == "string" ? ToolUtil.strToStemp(body.content.sendTime) : body.content.sendTime;
							if (tempTime != 0 && time && time - tempTime > 180000) {
								this.timeNum++;
								tempMsgBodyArr.push({time: time});
							}
							tempTime = time;
							tempMsgBodyArr.push(item);
						});
						if (tempList.length < Path.pageSize) {
							this.pageNumFlag = false;
						} else {
							this.pageNumFlag = true;
						}
						if (!this.pageNumFlag) {
							this.flagPageNum = tempMsgBodyArr.length;
						}
						this.setState({
							pageTotal: resultData.set.count,
							// nowPageNum:this.state.nowPageNum+1,
							data: tempMsgBodyArr.concat(this.state.data),
							isNewMsg: false
						});
						let tmpSize = 0;
						if (tempList.length < Path.pageSize || pageBegin == 0) {
							this.setState({
								refreshFlag: false,
								isRefresh: false
							})
						} else {
							tmpSize = pageBegin;
							pageBegin = pageBegin - Path.pageSize;
						}
						if (pageBegin < 0) {
							pageSize = tmpSize;
							pageBegin = 0;
						}
						let imgArr = [];
						let i = 0;
						tempList.map((item, index) => {
							if (item.time) {
								//当前项是时间项
							} else {
								let body = typeof item.body == 'object' ? item.body : JSON.parse(item.body);
								if (typeof body.type != 'undefined') {
									if (body.type.toString() == '2' && body.content.file[0].listFileInfo[0].showPic == 'img') {
										imgArr.push({
											url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].fileName + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
											// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName + '&userId=' + this.state.basic.userId,
										})
										keyCode[body.content.file[0].listFileInfo[0].id] = i;
										i++;
									}
								}
							}
						});
						this.setState({
							msgImgList: imgArr.concat(this.state.msgImgList)
						})
					})
				} else {
					let tempMsgBodyArr = [];
					let tempList = JSON.parse(resultData.list);
					tempList.map((item, index) => {
						let body = typeof item.body == 'string' ? JSON.parse(item.body) : item.body;
						item.body = body;
						let time = typeof body.content.sendTime == "string" ? ToolUtil.strToStemp(body.content.sendTime) : body.content.sendTime;
						if (tempTime != 0 && time && time - tempTime > 180000) {
							this.timeNum++;
							tempMsgBodyArr.push({time: time});
						}
						tempTime = time;
						tempMsgBodyArr.push(item);
					});
					if (tempList.length < Path.pageSize) {
						this.pageNumFlag = false;
					} else {
						this.pageNumFlag = true;
					}
					if (!this.pageNumFlag) {
						this.flagPageNum = tempMsgBodyArr.length;
					}
					this.setState({
						pageTotal: resultData.set.count,
						nowPageNum: this.state.nowPageNum + 1,
						data: tempMsgBodyArr.concat(this.state.data),
						isNewMsg: false
					});
					let tmpSize = 0;
					if (tempList.length < Path.pageSize || pageBegin == 0) {
						this.setState({
							refreshFlag: false,
							isRefresh: false
						})
					} else {
						tmpSize = pageBegin;
						pageBegin = pageBegin - Path.pageSize;
					}
					if (pageBegin < 0) {
						pageSize = tmpSize;
						pageBegin = 0;
					}
					let imgArr = [];
					let i = 0;
					tempList.map((item, index) => {
						if (item.time) {
							//当前项是时间项
						} else {
							let body = JSON.parse(item.body);
							if (typeof body.type != 'undefined') {
								if (body.type.toString() == '2' && body.content.file[0].listFileInfo[0].showPic == 'img') {
									imgArr.push({
										url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].fileName + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
										// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName + '&userId=' + this.state.basic.userId,
									})
									keyCode[body.content.file[0].listFileInfo[0].id] = i;
									i++;
								}
							}
						}
					});
					this.setState({
						msgImgList: imgArr.concat(this.state.msgImgList)
					})
				}
			}
		} catch (e) {
		}
	};

	_setText = (text) => {

		this.setState({
			text: text
		});

		if (this.state.backPage == 'Group') { // 群聊判断输入的是否是@
			if (text.length >= this.nowLen.length) { // 根据前后输入的字符串长度判断
				let str = '';
				for (let a = 0; a < text.length; a++) {
					str += text[a]; // 把最新输入位置之前的字符串取出
					if (text[a] !== this.nowLen[a]) {
						if (text[a] == '@') { // 最新输入的字符为@时
							if (this.state.AtMemberType == false) {
								Keyboard.dismiss();
								this.setState({
									secText: str,
									AtMemberType: true,
								});
							}
						}
						break;
					}
				}
			}
			this.nowLen = text;
		}

		if (text.length <= 0) {
			this.setState({
				jidArr: []
			})
		}
	};

	constructorXMPPMessage = (isOutgoing) => {
		let date = new Date();
		let m = date.getMinutes();
		if (m < 10) {
			m = "0" + m;
		}
		let message = {
			msgId: UUIDUtil.getUUID().replace(/\-/g, ''), //消息id
			msgType: 'text', //消息类型
			status: 'send_going', //消息状态 "send_succeed", "send_failed", "send_going", "download_failed" 默认值是 "send_succeed"
			isOutgoing: isOutgoing, //是否为自己发送的消息
			timeString: date.getHours() + ":" + m, //消息发送时间
			text:'默认文本内容', //消息内容
			fromUser: {
				userId: this.state.basic.jidNode,
				displayName: this.state.basic.trueName,
				avatarPath: "ironman"
			}
		};
		return message
	};

	/**
	 * 发送文本消息
	 * @returns {boolean}
	 * @private
	 */
	_sendText = () => {
		XmppUtil.xmppIsConnect(() => {
			let spaceArr = this.state.text.split(' ');
			let enterArr = this.state.text.split('\n');
			let spaceNum = spaceArr.length - 1;
			let enterNum = enterArr.length - 1;

			let imui_message = this.constructorXMPPMessage(true); //构造发送message对象

			if (!((spaceNum + enterNum) == this.state.text.length)) {
				let jidArr = [];
				let memberArr = [];
				let atMessage = '';
				let replacetext = this.state.text;

				if (this.state.text.indexOf("@全员") != -1) {

					atMessage = this.state.text.replace(/@全员/g, '<span class="atwho-inserted site-message-alt-name allId" data-atwho-at-query="@" contenteditable="false">@全员</span>');
					let atAllMembers = {'userId': 'allId'};
					jidArr.push('allId');
					memberArr.push(atAllMembers);

					this.setState({
						jidArr: jidArr
					})
				} else if (this.state.text.indexOf("@") != -1 && this.state.text.indexOf("@全员") == -1) {
					this.state.atItems.map((item, index) => {
						if (item.occupantJid) {

							let itemName = '@' + item.occupantTrueName + ' ';
							replacetext = replacetext.replace(itemName, '<span class="atwho-inserted site-message-alt-name ' + item.occupantJid + '" data-atwho-at-query="@" contenteditable="false">' + itemName + '</span>&nbsp;');

							if (this.state.text.indexOf(itemName) != -1) {
								let memberObj = {'userId': item.occupantJid};
								memberArr.push(memberObj);
								jidArr.push(item.occupantJid);
							}
						}
					})
					atMessage = replacetext
					this.setState({
						jidArr: jidArr
					})
				}

				let basic = this.state.backPage == 'Message' ? {
					"toId": this.state.friendDetail.jidNode,
					"type": "privateChat",
					"fromId": this.state.basic.jidNode,
					"userId": this.state.basic.userId,
					"photoId": this.state.basic.photoId,
					"userName": this.state.basic.trueName
				} : {
					"userId": this.state.basic.jidNode,
					"userName": this.state.basic.trueName,
					"head": this.state.room.photoId,
					"sendTime": new Date().getTime(),
					"groupId": this.state.room.roomJid,
					"groupName": this.state.room.roomName,
					"type": 'groupChat'
				};

				this.setState({
					messageBody: this.state.backPage == 'Group' ? {
						"id": UUIDUtil.getUUID().replace(/\-/g, ''),
						"type": 0,
						"messageType": 'text',
						"isAt": atMessage.length > 1 ? true : false,

						"basic": basic,
						"content": {
							"text": atMessage.length > 1 ? atMessage.replace(/\n/g, "<br/>") : this.state.text.replace(/\n/g, "<br/>"),
							"interceptText": this.state.text,
							"file": []
						},
						"atMembers": atMessage.length > 1 ? memberArr : [],
						"occupant": {
							"state": '',
							"effect": '',
							"active": ''
						}
					} : {
						"id": UUIDUtil.getUUID().replace(/\-/g, ''),
						"type": 0,
						"basic": basic,
						"keyId": "privateSend00",
						"content": {
							"file": [],
							"text": this.state.text.replace(/\n/g, "<br/>"),
							"interceptText": this.state.text,
							"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
							"imageFiles": []
						},
						"showTime": true
					},
				}, () => {
					// this.refs.textInputBox.onBlurText();
					let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
					let newMsgSingleId = UUIDUtil.getUUID().replace(/\-/g, '');
					this.state.messageBody.messageType = 'text';
					let tempItemObj = {};
					if (this.state.backPage == 'Group' && this.state.text.length > 0) {

						this.state.messageBody.id = newMsgId;

						if (this.state.room.mute == '1') {
							this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

						} else {
							if (Platform.OS == 'ios') {

								XMPP.XMPPSendGroupMessage({
										'message': this.state.messageBody,
										'jid': this.state.room.roomJid,
										'uuid': newMsgId
									},
									(error, event) => {
										if (error) {
											this.refs.toast.show(error, DURATION.LENGTH_SHORT);

										} else if (event == '发送成功') {

											PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':' + this.state.messageBody.content.interceptText, this.state.room.roomName, this.props.navigation);
											if (this.state.messageBody.isAt) {
												let tempBody = 'uuId=' + uuid
													+ '&ticket=' + this.state.ticket
													+ '&roomJid=' + this.state.room.roomJid
													+ '&body=' + Base64Util.encode(encodeURI(JSON.stringify(this.state.messageBody)))
													+ '&recipient=' + this.state.jidArr.join(',')
													+ '&sender=' + this.state.basic.jidNode
													+ '&userId=' + this.state.basic.userId;
												FetchUtil.sendPost(Path.atSave, tempBody, this.props.navigation, (memberData) => {

													this.setState({
														jidArr: []
													})
												})
											}

										}
									}
								)
							} else {
								//android发送群聊消息
								let sendGroupMsg = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgId);
								XMPP.sendStanza(sendGroupMsg);

								PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':' + this.state.messageBody.content.interceptText, this.state.room.roomName, this.props.navigation);
								if (this.state.messageBody.isAt) {
									let tempBody = 'uuId=' + uuid
										+ '&ticket=' + this.state.ticket
										+ '&roomJid=' + this.state.room.roomJid
										+ '&body=' + Base64Util.encode(encodeURI(JSON.stringify(this.state.messageBody)))
										+ '&recipient=' + this.state.jidArr.join(',')
										+ '&sender=' + this.state.basic.jidNode
										+ '&userId=' + this.state.basic.userId;
									FetchUtil.sendPost(Path.atSave, tempBody, this.props.navigation, (memberData) => {

										this.setState({
											jidArr: []
										})
									})
								}
								// })
								// this.state.data.push(tempItemObj);
							}
							// this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'text', this.state.basic.trueName, newMsgId);
							// PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':' + this.state.messageBody.content.interceptText, this.state.room.roomName, this.props.navigation);
							this.setState({text: ''});
						}

					} else if (this.state.backPage == 'Message' && this.state.text.length > 0) {
						this.state.messageBody.id = newMsgSingleId;
						if (Platform.OS == 'ios') {

							//ios发送单聊消息
							XMPP.XMPPSendMessage({
								'message': this.state.messageBody,
								'friendJid': this.state.friendDetail.jid,
								'messageId': newMsgSingleId//this.state.messageBody.id
							})
							PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, this.state.messageBody.content.interceptText, this.state.basic.trueName, this.props.navigation);
						} else {
							//android发送单聊消息
							// XMPP.message(JSON.stringify(this.state.messageBody), this.state.friendDetail.jid);
							let sendSigleMsg = XmlUtil.sendGroup('chat', this.state.friendDetail.jid, JSON.stringify(this.state.messageBody), newMsgSingleId);
							XMPP.sendStanza(sendSigleMsg);

							imui_message.text = `${item.content.text}`;
							AuroraIController.appendMessages([imui_message]); //向视图添加消息
							AuroraIController.scrollToBottom(true); //将视图滚动到底

							tempItemObj.body = JSON.stringify(this.state.messageBody);
							tempItemObj.sendType = 'to';
							let tempArr = [];
							tempArr.push(tempItemObj);
							this.setState({
								data: this.state.data.concat(tempArr),
								isNewMsg: true
							}, () => {
								PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, this.state.messageBody.content.interceptText, this.state.basic.trueName, this.props.navigation);
							});
						}

						this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'text', '', newMsgSingleId);
					}
					this.setState({
						text: '',
						enterType: 'done'
					},()=>{
						// imui_message.status = 'send_succeed';
						// AuroraIMUIController.updateMessage(imui_message); //更新消息发送状态
					});
					this.nowLen = '';
				});
			} else {
				this.refs.toast.show('发送内容为空', DURATION.LENGTH_SHORT);
			}
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
	};
	_loadMessage = (message) => {
		//mussage存在body: "Room is locked. Please configure."，此时需要判断body是否为json字符串，即：判断是否包含"｛"字符，该情况在出息群组时会出现
		let messageBody = (message.body && typeof message.body == 'string') ? (message.body.indexOf('{') != -1 ? JSON.parse(message.body) : null) : message.body;
		if (messageBody && messageBody.basic && messageBody.basic.type && messageBody.basic.type != 'privateChat' && messageBody.basic.groupId == this.state.room.roomJid) {
			/** 群聊普通消息处理（不包括撤回消息） **/
			this._groupGeneralMessage(message, messageBody);
		}
		else if (!messageBody && message.removeMsgId && message.from.indexOf('muc') != -1) {
			/** 群聊撤回消息处理 **/
			this._groupWithdrawMessage();
		}
		else if (!messageBody && !message.removeMsgId) {
			/** 群聊节点消息处理 **/
			this._groupSubscriptionMessage(message);
		}
		else if (messageBody && messageBody.basic && messageBody.basic.type && messageBody.basic.type == 'privateChat') {
			/** 私聊普通消息处理（不包括撤回消息） **/
			this._privateGeneralMessage(message, messageBody);
		}
		else if (!messageBody && message.removeMsgId && message.from.indexOf('muc') == -1) {
			/** 私聊撤回消息处理 **/
			this._privateWithdrawMessage(message);
		}
		// this._scrollView.scrollToEnd({animated: true})//滚动到底部
	};
	/**
	 * 私聊页面渲染数组数据封装
	 * @param messageBody
	 * @returns {Array}
	 * @private
	 */
	_privateDataInit = (messageBody) => {
		let tempItemObj = {};
		if (messageBody.type && messageBody.type == '2' && messageBody.content.file[0].listFileInfo[0].showPic == 'audio') {
			tempItemObj['isPlay'] = new Animated.Value(0);
		}
		tempItemObj['body'] = messageBody;
		if (messageBody.basic.fromId == this.state.basic.jidNode) {
			tempItemObj['sendType'] = 'to';
		} else {
			tempItemObj['sendType'] = 'from';
		}
		let tempArr = [];
		tempArr.push(tempItemObj);
		return tempArr;
	}
	/**
	 * 私聊普通消息
	 * @param message
	 * @param messageBody
	 * @private
	 */
	_privateGeneralMessage = (message, messageBody) => {
		//同一个用户的同步类型消息||对方发送的消息
		if ((messageBody.basic.fromId == this.state.basic.jidNode && messageBody.basic.toId == this.state.friendDetail.jidNode) || messageBody.basic.fromId == this.state.friendDetail.jidNode) {
			this.setState({
				data: this.state.data.concat(this._privateDataInit(messageBody)),
				numFlag: this.state.numFlag + 1,
				isNewMsg: true
			}, () => {
				let imgArr = [];
				let i = 0;
				this.state.data.map((item, index) => {
					//像视图添加消息
					let isSelfMsg = item.body.basic.fromId == this.state.basic.jidNode ? true : false;
					let imui_message = this.constructorXMPPMessage(isSelfMsg);

					if (!item.time && item.body && item.body.content.file && item.body.content.file.length > 0 && item.body.content.file[0].listFileInfo[0].showPic == 'img' && item.body.type.toString() == '2') {
						imgArr.push({
							url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.body.content.file[0].listFileInfo[0].fileName + '&imageId=' + item.body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
						});
						keyCode[item.body.content.file[0].listFileInfo[0].id] = i;
						i++;

						imui_message.msgType = 'image';
					}else{
						imui_message.text = item.body.content.text;
					}

					imui_message.status = 'send_succeed';
					AuroraIController.appendMessages([imui_message]);

				});
				this.setState({
					msgImgList: []
				}, () => {
					this.setState({
						msgImgList: imgArr//.concat(this.state.msgImgList)
					});
					AuroraIController.scrollToBottom(true); //视图滚动到底部
				})
			});
		}
	};
	/**
	 * 私聊撤回消息
	 * @param message
	 * @private
	 */
	_privateWithdrawMessage = (message) => {
		this.setState({
			currentNum: 0
		}, () => {
			nowPageFlag = 0;
			this.fetchData();
		})
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
				// this._groupGeneralMessage_Extend(messageBody,message.st);
			let tempArr = [];
			tempArr.push(message);
			let tempRoom = JSON.parse(JSON.stringify(this.state.room));
			this.setState({
				data: this.state.data.concat(tempArr),
				numFlag: this.state.numFlag + 1,
				pageTotal: this.state.pageTotal + 1,
				currentNum: this.state.currentNum + 1,
				isNewMsg: true,
				room: tempRoom
			});
			Sqlite.saveOfflineTime(this.state.basic.userId, this.state.room.roomJid, message.st);
		}
		else if (messageBody.occupant && messageBody.occupant.state == 'DISABLEGROUP' && messageBody.basic.userId != this.state.basic.jidNode) {
			/** 别人禁用群组普通消息 **/
			Global.groupDisable[this.state.room.roomJid] = '0';//后台禁用群组返回前台
			XMPP.leaveRoom(this.state.room.roomJid + Path.xmppGroupDomain);
			DeviceEventEmitter.emit('refreshGroupList');
			Alert.alert(
				'提醒',
				'该群组已禁用!',
				[
					{
						text: '确定',
						onPress: () => {
							this.props.navigation.goBack();
						},
					}
				],
				{cancelable: false}
			)
		}
		else if (messageBody.occupant.state == 'OWNLEAVE' && message.from && message.from.indexOf(this.state.basic.jidNode) != -1) {
			/** 主动退群普通消息 **/
			XMPP.leaveRoom(this.state.room.roomJid + Path.xmppGroupDomain);
			DeviceEventEmitter.emit('refreshGroupList');
			Alert.alert(
				'提醒',
				'您已退出该群组!',
				[
					{
						text: '确定',
						onPress: () => {
							this.props.navigation.goBack();
						},
					}
				],
				{cancelable: false}
			)
		}
		else if (messageBody.occupant && (messageBody.occupant.state == 'DISABLEGROUP' && messageBody.basic.userId == this.state.basic.jidNode)) {
			/** 自己禁用群组普通消息 **/
			let tempArr = [];
			tempArr.push(message);
			let tempRoom = JSON.parse(JSON.stringify(this.state.room));
			this.setState({
				data: this.state.data.concat(tempArr),
				numFlag: this.state.numFlag + 1,
				pageTotal: this.state.pageTotal + 1,
				currentNum: this.state.currentNum + 1,
				isNewMsg: true,
				room: tempRoom
			});
			Sqlite.saveOfflineTime(this.state.basic.userId, this.state.room.roomJid, message.st);
		}
		else if (messageBody.occupant && (messageBody.occupant.state == 'INVITEJOINROOM' || messageBody.occupant.state == 'JOINPASS') && messageBody.occupant.effectJids && messageBody.occupant.effectJids.indexOf(this.state.basic.jidNode) != -1) {
			/** 自己邀请入群普通消息 自己同意入群普通消息 **/
		}
		else {
			/** 文本、语音、图片、文件、除自己外的其它成员被移除群组、自己启用群组、其它人被邀请入群 **/
			this._groupGeneralMessage_General(message, messageBody);
		}
	};
	/**
	 * 群聊一般消息（文本、语音、图片、文件、除自己外的其它成员被移除群组、自己启用群组、其它人被邀请入群）
	 * @param message
	 * @param messageBody
	 * @private
	 */
	_groupGeneralMessage_General = (message, messageBody) => {
		//文本消息||其他人发的消息||PC发的消息
		if ((messageBody.type + "" && messageBody.type + "" == '0') || messageBody.basic.userId != this.state.basic.jidNode || !this.state.isNotPC) {
			//像视图添加消息
			let isSelfMsg = this.state.basic.jidNode == messageBody.basic.userId ? true : false;
			let imui_message = this.constructorXMPPMessage(isSelfMsg);
			imui_message.status = 'send_succeed';
			console.log('messageBody');
			console.log(messageBody);
			if(messageBody.type == '0'){
				imui_message.text = messageBody.content.text;
			}
			imui_message.timeString = FormatDate.formatTimeStmpToFullTime(messageBody.basic.sendTime);
			AuroraIController.appendMessages([imui_message]);

			let tempArr = [];
			tempArr.push(message);
			let tempRoom = JSON.parse(JSON.stringify(this.state.room));
			this.setState({
				data: this.state.data.concat(tempArr),
				numFlag: this.state.numFlag + 1,
				pageTotal: this.state.pageTotal + 1,
				currentNum: this.state.currentNum + 1,
				isNewMsg: true,
				room: tempRoom
			}, () => {
				let imgArr = [];
				let i = 0;
				this.state.data.map((item, index) => {
					if (typeof item.body == 'string') {
						item.body = JSON.parse(item.body);
					}
					if (!item.time && item.body && item.body.content.file && item.body.content.file.length > 0 && item.body.content.file[0].listFileInfo[0].showPic == 'img' && item.body.type.toString() == '2') {
						imgArr.push({
							url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.body.content.file[0].listFileInfo[0].fileName + '&imageId=' + item.body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
						});
						keyCode[item.body.content.file[0].listFileInfo[0].id] = i;
						i++;

					}
				});
				this.setState({
					msgImgList: []
				}, () => {
					this.setState({
						msgImgList: imgArr//.concat(this.state.msgImgList)
					});

					AuroraIController.scrollToBottom(true); //视图滚动到底部
				})
			});
			Sqlite.saveOfflineTime(this.state.basic.userId, this.state.room.roomJid, message.st);
		}
	}
	/**
	 * 群聊节点消息
	 * @param message
	 * @private
	 */
	_groupSubscriptionMessage = (message) => {
		let tempMsgInfo = message.msgInfo ? JSON.parse(message.msgInfo) : null;
		if (tempMsgInfo && tempMsgInfo.mode == 'SETLEAVE' && tempMsgInfo.roomjid == this.state.room.roomJid && tempMsgInfo.effect == this.state.basic.jidNode) {
			Alert.alert(
				'提醒',
				'您被移出该群组!',
				[
					{
						text: '确定',
						onPress: () => {
							this.props.navigation.goBack();
						},
					}
				],
				{cancelable: false}
			)
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'SETMUTE' && tempMsgInfo.roomjid == this.state.room.roomJid && tempMsgInfo.effect == this.state.basic.jidNode) {
			// if (tempMsgInfo.effect == this.state.basic.jidNode) {
			let tempRoom = this.state.room;
			tempRoom.mute = '1';//被禁言
			this.setState({
				room: tempRoom
			});
			// }
		}
		else if (tempMsgInfo && tempMsgInfo.mode == 'SETUNMUTE' && tempMsgInfo.roomjid == this.state.room.roomJid && tempMsgInfo.effect == this.state.basic.jidNode) {
			// if (tempMsgInfo.effect == this.state.basic.jidNode) {
			let tempRoom = this.state.room;
			tempRoom.mute = '0';//取消禁言
			this.setState({
				room: tempRoom
			})
			// }
		}else if (tempMsgInfo && tempMsgInfo.effect == this.state.basic.jidNode && (tempMsgInfo.mode == 'SETMEMBER' || tempMsgInfo.mode == 'SETADMIN')) {
			DeviceEventEmitter.emit('refreshGroupDetail');
		}
	}

	_groupWithdrawMessage = () => {
		this.setState({
			currentNum: 0
		}, () => {
			nowPageFlag = 0;
			this.fetchData();
		})
	}
	moreDetail = () => {
		if (this.textInputBox) {
			this.textInputBox.onBlurText();
		}
		if (this.state.backPage == 'Group') {
			this.props.navigation.navigate('GroupDetail', {
				'ticket': this.state.ticket,
				'uuid': uuid,
				'room': this.state.room,
				'basic': this.state.basic,
				'isQRCode': false
			});
		} else {
			this.props.navigation.navigate('FriendDetail', {
				'ticket': this.state.ticket,
				'basic': this.state.basic,
				'uuid': uuid,
				'friendJidNode': this.state.friendDetail.jidNode,
				'tigRosterStatus': 'both',
				'stepType': 'back',
				'token': this.state.token
			})
		}
	};
	_onRefresh = () => {
		this.timeNum = 0;
		if (this.state.backPage == 'Message') {
			this.setState({
				isRefresh: false,//标记是否为第一页的数据
			}, () => {
				if (Platform.OS == 'ios') {
					pageBegin = pageBegin - pageSize;

					XMPP.XMPPGetHistoryMessageDetail({
						'friendJid': this.state.friendDetail.jid,
						'pageSize': (pageBegin <= 0) ? (pageSize + pageBegin) : pageSize,
						'index': (pageBegin <= 0) ? 0 : pageBegin,
					})
				} else {
					let data = XmlUtil.getPrivateChatHistory(pageBegin, pageSize, this.state.friendDetail.jid);
					//console..log(data);
					XMPP.sendStanza(data);
				}
			})
		} else {
			this.setState({
				nowPageNum: this.state.nowPageNum + 1,
				currentNum: this.state.currentNum + Path.pageSizeNew > this.state.pageTotal ? this.state.currentNum : this.state.currentNum + Path.pageSizeNew,
			}, () => {
				if (this.state.nowPageNum > this.state.totalPage) {
					//没有更多了
					this.setState({
						refreshFlag: false,
						isRefresh: false
					})
				} else {
					this.fetchData();
				}
			})
		}
	};

//上传图片
	uploadImages = () => {

		if (this.state.room.mute == '1') {
			this.setState({
				showAlert: true,//alert框
				tipMsg: '您已被禁言，请联系管理员!'//alert提示信息
			});
		} else {
			if (Platform.Version < 23 || Platform.OS == 'ios') {
				if (Platform.OS == 'ios') {
					XMPP.getIOSPermission({'permissionType': 'photo'},
						(error, event) => {
							if (event == 'true') {
								XMPP.getIOSPermission({'permissionType': 'camera'},
									(error, event) => {
										if (event == 'true') {
											this.openImagePicker();
										}
									});
							}
						});
				} else {
					this.openImagePicker();
				}

			} else {
				PermissionUtil.requestAndroidPermission(
					[PermissionsUtil.Permissions.read, PermissionsUtil.Permissions.write, PermissionsUtil.Permissions.camera], (value) => {
						if (typeof value == "boolean" && value) {
							this.openImagePicker();
						} else if (typeof value == "boolean" && !value) {
							this.setState({
								showAlert: true,//alert框
								tipMsg: '使用相册功能前，请先开启相册权限和存储权限！'//alert提示信息
							});
						} else if (typeof value == "object") {

							let status = true;
                            for (let key in value) {
                                if (!value[key]) {
                                    status = false;
                                }
                            }
                            if (status) {
                                this.openImagePicker();
                            } else {
                                this.setState({
                                    showAlert: true,//alert框
                                    tipMsg: '使用相册功能前，请先开启相机权限和存储权限！'//alert提示信息
                                });
                            }
						} else {
						}
					}
				);
			}
		}
	};
	//文件选择
	openFilePicker = () => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
		FilePickerManager.showFilePicker(null, (response) => {
			XmppUtil.xmppIsConnect(() => {
				if (response.didCancel) {
				}
				else if (response.error) {
				}
				else {
					response.fileName = response.path.substring(response.path.lastIndexOf('/') + 1, response.path.length);
					let tempFileType = fileTypeReturn.fileTypeSelect(response.fileName);
					let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
					let newMsgIdSigle = UUIDUtil.getUUID().replace(/\-/g, '');
					let tempData = JSON.parse(JSON.stringify(this.state.data));
					let truePosition = tempData.length;//当前文件在数组的位置 记录
					if (tempFileType == 'img') {//如果选择图片，先拼接本地图片
						let files = [{
							status: 'success',
							listFileInfo: [{fileName: response.fileName, showPic: 'img'}]
						}, {imageUrl: response.uri}];//本地图片路径
						let tempmessageBody = this.state.backPage == 'Group' ? {
							"id": newMsgId,
							"type": 2,
							"otherFlag": true,
							"basic": {
								"userId": this.state.basic.jidNode,
								"userName": this.state.basic.trueName,
								"head": '',
								"sendTime": new Date().getTime(),
								"groupId": this.state.room.roomJid,
								"groupName": this.state.room.roomName,
								"type": 'groupChat'
							},

							"content": {
								"text": '',
								"interceptText": '',
								"file": files,
							},
							"atMembers": [],
							"occupant": {
								"state": '',
								"effect": '',
								"active": ''
							}
						} : {
							"id": newMsgIdSigle,
							"type": 2,
							"otherFlag": true,
							"basic": {
								"toId": this.state.friendDetail.jidNode,
								"type": "privateChat",
								"fromId": this.state.basic.jidNode,
								"userId": this.state.basic.userId,
								"photoId": this.state.basic.photoId,
								"userName": this.state.basic.trueName
							},
							"keyId": "privateSend00",
							"content": {
								"file": files,
								"text": "",
								"interceptText": '',
								"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
								"imageFiles": []
							},
							"showTime": true
						};
						let tempItemObjNotTrue = {
							body: JSON.stringify(tempmessageBody),
							sendType: 'to',
							position: truePosition
						};
						let tempArr = [];
						tempArr.push(tempItemObjNotTrue);
						this.setState({
							chooseFile: response,
							data: this.state.data.concat(tempArr),//拼接本地图片
						}, () => {
							this._uploadFile(response, newMsgId, newMsgIdSigle, tempItemObjNotTrue.position);
						})
					} else {
						this.setState({
							chooseFile: response
						}, () => {
							this._uploadFile(response, newMsgId, newMsgIdSigle, truePosition);
						});
					}
				}
			}, (error) => {
				this.setState({
					showAlert: true,//alert框
					tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
				});
			});
		});
	};
	//上传文件请求
	_uploadFile = (response, newMsgId, newMsgIdSigle, position) => {
		let formData = new FormData();
		let file = {uri: response.uri, type: 'multipart/form-data', name: encodeURIComponent(response.fileName)};
		formData.append("file", file);
		let stype = this.state.backPage == 'Group' ? 'groupchat' : 'sglc';
		let to = this.state.backPage == 'Group' ? this.state.room.roomJid : this.state.friendDetail.jidNode;
		let tempType = '';
		let url = Path.uploadImage + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&stype=' + stype + '&to=' + to + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
		fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'multipart/form-data;charset=UTF-8',
			},
			body: formData,
		})
			.then((response) => response.json())
			.then((responseData) => {
				if (responseData == 'tip') {
					this.refs.toast.show('  上传失败！  ', 3000);
				} else if (responseData.code.toString() == '200') {
					responseData.data.map((item, index) => {
						let body = JSON.parse(item);

						if (body.code + '' == '200') {
							let data = body.data;
							let fileBody = JSON.parse(data);
							let files = [];
							let obj = new Object();
							let obj1 = new Object();
							obj.status = "success";
							obj.listFileInfo = fileBody.listFileInfo;
							tempType = fileTypeReturn.fileTypeSelect(fileBody.listFileInfo[0].fileName);
							obj1.imageUrl = tempType == 'img' ? '/file/downloadThumbnail?fileInfoId=' + fileBody.listFileInfo[0].id : 'images/' + fileBody.listFileInfo[0].showPic + '.png';
							;
							files.push(obj);
							files.push(obj1);

							this.setState({
								sendMsgId: this.state.backPage == 'Group' ? newMsgId : newMsgIdSigle,
								messageBody: this.state.backPage == 'Group' ? {
									"id": newMsgId,
									"type": 2,
									"messageType": 'file',
									"basic": {
										"userId": this.state.basic.jidNode,
										"userName": this.state.basic.trueName,
										"head": '',
										"sendTime": new Date().getTime(),
										"groupId": this.state.room.roomJid,
										"groupName": this.state.room.roomName,
										"type": 'groupChat'
									},
									"content": {
										"text": '',
										"interceptText": '',
										"file": files,
									},
									"atMembers": [],
									"occupant": {
										"state": '',
										"effect": '',
										"active": ''
									}
								} : {
									"id": newMsgIdSigle,
									"type": 2,
									"messageType": 'file',
									"basic": {
										"toId": this.state.friendDetail.jidNode,
										"type": "privateChat",
										"fromId": this.state.basic.jidNode,
										"userId": this.state.basic.userId,
										"photoId": this.state.basic.photoId,
										"userName": this.state.basic.trueName
									},
									"keyId": "privateSend00",
									"content": {
										"file": files,
										"text": "",
										"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
										"imageFiles": []
									},
									"showTime": true
								},
							})

							if (Platform.OS == 'ios') {
								if (this.state.backPage == 'Group') {
									if (this.state.room.mute == '1') {
										this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

									} else {
										XMPP.XMPPSendGroupMessage({
												'message': this.state.messageBody,
												'jid': this.state.room.roomJid,
												'uuid': newMsgId
											},
											(error, event) => {
												if (error) {
													this.refs.toast.show(error, DURATION.LENGTH_SHORT);

												} else {
													this.refs.toast.show(event, DURATION.LENGTH_SHORT);

													this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'file', this.state.basic.trueName, newMsgId);

												}
											})
									}

								} else {
									//单聊
									XMPP.XMPPSendMessage({
										'message': this.state.messageBody,
										'friendJid': this.state.friendDetail.jid,
										'messageId': newMsgIdSigle//this.state.messageBody.id
									});
									this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'file', '', newMsgIdSigle);//入库当前朋友信息
								}
							} else {
								let tempItemObj = {};
								//android
								if (this.state.backPage == 'Group') {
									if (this.state.room.mute == '1') {
										this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

									} else {
										if (tempType == 'img') {
											tempItemObj.body = this.state.messageBody;
											let tempData = JSON.parse(JSON.stringify(this.state.data));
											tempData.splice(position, 1, tempItemObj);
											this.setState({
												data: tempData,
												isNotPC: true
											});
										}/*else{
											let tempArr = [];

											console.log(tempItemObj);
											tempItemObj.body = this.state.messageBody;
											console.log(tempItemObj);
											tempArr.push(tempItemObj);
											console.log(tempArr);
											this.setState({
												data: this.state.data.concat(tempArr),
												isNewMsg: true
											});
											console.log(this.state.data);
										}*/

										let sendGroupMsg = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgId);
										XMPP.sendStanza(sendGroupMsg);
										PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, '', this.state.room.roomName, this.props.navigation);
										// this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'file', this.state.basic.trueName, newMsgId);

									}

								} else {
									tempItemObj.body = JSON.stringify(this.state.messageBody);
									tempItemObj.sendType = 'to';
									if (tempType == 'img') {
										tempItemObj.body = this.state.messageBody;
										let tempData = JSON.parse(JSON.stringify(this.state.data));
										tempData.splice(position, 1, tempItemObj);
										this.setState({
											data: tempData,
										}, () => {
											let imgArr = [];
											let i = 0;
											this.state.data.map((item, index) => {
												if (item.time) {
													//当前项是时间项
												} else {
													let body = typeof item.body == 'object' ? item.body : JSON.parse(item.body);
													if (body.content.file && body.content.file.length > 0) {
														if ((body.content.file[0].listFileInfo[0].showPic == 'img') && (body.type.toString() == '2')) {

															imgArr.push({
																url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].fileName + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
																// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName + '&type=image' + '&userId=' + this.state.basic.userId,
															})
															keyCode[body.content.file[0].listFileInfo[0].id] = i;
															i++;
														}
													}
												}
											});
											this.setState({
												msgImgList: []
											}, () => {
												this.setState({
													msgImgList: imgArr//.concat(this.state.msgImgList)
												})
											})
										})
									} else {
										let tempArr = [];
										tempArr.push(tempItemObj);
										this.setState({
											data: this.state.data.concat(tempArr),
											isNewMsg: true
										});
									}
									//单聊
									// XMPP.message(JSON.stringify(this.state.messageBody), this.state.friendDetail.jid);
									let sendSigleMsg = XmlUtil.sendGroup('chat', this.state.friendDetail.jid, JSON.stringify(this.state.messageBody), newMsgIdSigle);
									XMPP.sendStanza(sendSigleMsg);
									this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', tempType == 'img' ? 'image' : 'file', '', newMsgIdSigle);//入库当前朋友信息
									PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, '', this.state.basic.trueName, this.props.navigation);
								}
							}
						} else {
							this.setState({
								isShowIcon: true,
								isFailPosition: position//tempItemObjNotTrue.position
							})
						}
					})
				} else if (responseData.code.toString() == '-32') {
					this.refs.toast.show('不能上传空文件！', 3000);
				}
			}, () => {
				// alert('success');
				this.refs.toast.show('  上传失败！  ', 3000);
			})
			.catch((error) => {
				console.error('error', error);
			});
	};
	//打开相册
	openImagePicker = () => {
		cookie.save('isUpload', 1);//用于判断是否为选择图片后台状态
		//打开图像库：
		ImagePickerManager.launchImageLibrary(photoOptions, (response) => {
			console.log(response);
			if (response.didCancel) {
				//选择了取消
			} else {
                if ("permissionsError"==response.error) {
                    Alert.alert(
                        '提醒',
                        '使用相册功能前，请先开启相册和存储权限！',
                        [
                            {
                                text: '确定',
                            }
                        ]
                    )
                    return;
                }
				XmppUtil.xmppIsConnect(() => {
					//选择图片后
					let imageType;
					if (response.fileName && response.fileName.indexOf('HEIC') == -1) {
						imageType = response.fileName.substr(response.fileName.lastIndexOf('.') + 1);
					} else {
						imageType = response.uri.substr(response.uri.lastIndexOf('.') + 1);
					}
					const trueType = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'gif', 'GIF'];
					if (trueType.indexOf(imageType) > -1) {
						//将本地图片拼接到聊天区域
						let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
						let newMsgIdSigle = UUIDUtil.getUUID().replace(/\-/g, '');
						let files = [{
							status: 'success',
							listFileInfo: [{
								fileName: response.fileName && response.fileName.indexOf('HEIC') == -1 ? encodeURIComponent(response.fileName) : 'image.' + imageType,
								showPic: 'img'
							}]
						}, {imageUrl: response.uri}];//本地图片路径
						let tempmessageBody = this.state.backPage == 'Group' ? {
							"id": newMsgId,
							"type": 2,
							"otherFlag": true,
							"basic": {
								"userId": this.state.basic.jidNode,
								"userName": this.state.basic.trueName,
								"head": '',
								"sendTime": new Date().getTime(),
								"groupId": this.state.room.roomJid,
								"groupName": this.state.room.roomName,
								"type": 'groupChat'
							},

							"content": {
								"text": '',
								"interceptText": '',
								"file": files,
							},
							"atMembers": [],
							"occupant": {
								"state": '',
								"effect": '',
								"active": ''
							}
						} : {
							"id": newMsgIdSigle,
							"type": 2,
							"otherFlag": true,
							"basic": {
								"toId": this.state.friendDetail.jidNode,
								"type": "privateChat",
								"fromId": this.state.basic.jidNode,
								"userId": this.state.basic.userId,
								"photoId": this.state.basic.photoId,
								"userName": this.state.basic.trueName
							},
							"keyId": "privateSend00",
							"content": {
								"file": files,
								"text": "",
								"interceptText": '',
								"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
								"imageFiles": []
							},
							"showTime": true
						};
						let tempItemObjNotTrue = {
							body: JSON.stringify(tempmessageBody),
							sendType: 'to',
							position: this.state.data.length
						};
						let tempArr = [];
						tempArr.push(tempItemObjNotTrue);
						this.setState({
							data: this.state.data.concat(tempArr),//拼接本地图片
						}, () => {
							//执行上传
							//发送post上传请求
							let formData = new FormData();
							let file = {
								uri: response.uri,
								type: 'multipart/form-data',
								name: response.fileName && response.fileName.indexOf('HEIC') == -1 ? encodeURIComponent(response.fileName) : 'image.' + imageType
							};
							formData.append("file", file);
							let stype = this.state.backPage == 'Group' ? 'groupchat' : 'sglc';
							let to = this.state.backPage == 'Group' ? this.state.room.roomJid : this.state.friendDetail.jidNode
							let url = Path.uploadImage + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&stype=' + stype + '&to=' + to + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
							XmppUtil.xmppIsConnect(() => {
								fetch(url, {
									method: 'POST',
									headers: {
										'Content-Type': 'multipart/form-data',
									},
									body: formData,
								}).then((response) => response.json()).then((responseData) => {

									if (responseData.code.toString() == '200') {
										responseData.data.map((item, index) => {

											let body = JSON.parse(item);

											if (body.code + '' == '200') {
												let data = body.data;
												let fileBody = JSON.parse(data);
												let files = [];
												let obj = new Object();
												let obj1 = new Object();
												obj.status = "success";
												obj.listFileInfo = fileBody.listFileInfo;
												obj1.imageUrl = fileTypeReturn.fileTypeSelect(fileBody.listFileInfo[0].fileName) == 'img' ? '/file/downloadThumbnail?fileInfoId=' + fileBody.listFileInfo[0].id : 'images/' + fileBody.listFileInfo[0].showPic + '.png';
												files.push(obj);
												files.push(obj1);

												let newMsgIdTrue = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
												let newMsgIdSigleTrue = UUIDUtil.getUUID().replace(/\-/g, '');
												this.setState({
													sendMsgId: this.state.backPage == 'Group' ? newMsgIdTrue : newMsgIdSigleTrue,
													messageBody: this.state.backPage == 'Group' ? {
														"id": newMsgIdTrue,
														"type": 2,
														"messageType": 'image',
														"basic": {
															"userId": this.state.basic.jidNode,
															"userName": this.state.basic.trueName,
															"head": '',
															"sendTime": new Date().getTime(),
															"groupId": this.state.room.roomJid,
															"groupName": this.state.room.roomName,
															"type": 'groupChat'
														},

														"content": {
															"text": '',
															"interceptText": '',
															"file": files,
														},
														"atMembers": [],
														"occupant": {
															"state": '',
															"effect": '',
															"active": ''
														}
													} : {
														"id": newMsgIdSigleTrue,
														"type": 2,
														"messageType": 'image',
														"basic": {
															"toId": this.state.friendDetail.jidNode,
															"type": "privateChat",
															"fromId": this.state.basic.jidNode,
															"userId": this.state.basic.userId,
															"photoId": this.state.basic.photoId,
															"userName": this.state.basic.trueName
														},
														"keyId": "privateSend00",
														"content": {
															"file": files,
															"text": "",
															"interceptText": '',
															"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
															"imageFiles": []
														},
														"showTime": true
													},
												})

												if (Platform.OS == 'ios') {
													if (this.state.backPage == 'Group') {

														if (this.state.room.mute == '1') {
															this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

														} else {
															if (this.state.messageBody.content.file.length > 0) {
																XMPP.XMPPSendGroupMessage({
																		'message': this.state.messageBody,
																		'jid': this.state.room.roomJid,
																		'uuid': newMsgIdTrue
																	},
																	(error, event) => {
																		if (error) {
																			this.refs.toast.show(error, DURATION.LENGTH_SHORT);

																		} else {
																			//this.refs.toast.show(event, DURATION.LENGTH_SHORT);
																			this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'image', this.state.basic.trueName);

																			// let mesbody = {};
																			// mesbody['body'] = this.state.messageBody;
																			// messagesBody.push(mesbody);
																			// this.setState({
																			//     data: messagesBody
																			// })
																		}
																	})
															} else {
																this.refs.toast.show('发送失败', DURATION.LENGTH_SHORT);
															}
														}

													} else {
														if (this.state.messageBody.content.file.length > 0) {
															//单聊
															XMPP.XMPPSendMessage({
																'message': this.state.messageBody,
																'friendJid': this.state.friendDetail.jid,
																'messageId': newMsgIdSigleTrue//this.state.messageBody.id
															});
															this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'image', '', newMsgIdSigleTrue);//入库当前朋友信息
														}
													}
												} else {
													let tempItemObj = {};
													//android
													if (this.state.backPage == 'Group') {
														if (this.state.room.mute == '1') {
															this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

														} else {
															tempItemObj.body = this.state.messageBody;
															// let tempArr = [];
															// tempArr.push(tempItemObj);
															let tempData = JSON.parse(JSON.stringify(this.state.data));
															tempData.splice(tempItemObjNotTrue.position, 1, tempItemObj);
															this.setState({
																data: tempData,
																isNotPC: true
															});
															if (this.state.messageBody.content.file.length > 0) {
																let sendGroupMsg = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgIdTrue);
																XMPP.sendStanza(sendGroupMsg);
																// this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'image', this.state.basic.trueName, newMsgIdTrue);
															}
														}

													} else {
														tempItemObj.body = JSON.stringify(this.state.messageBody);
														tempItemObj.sendType = 'to';
														let tempArr = [];
														tempArr.push(tempItemObj);
														let tempData = JSON.parse(JSON.stringify(this.state.data));
														tempData.splice(tempItemObjNotTrue.position, 1, tempItemObj);
														this.setState({
															data: tempData//this.state.data.concat(tempArr),
														});
														//单聊
														if (this.state.messageBody.content.file.length > 0) {
															// XMPP.message(JSON.stringify(this.state.messageBody), this.state.friendDetail.jid);
															let sendSigleMsg = XmlUtil.sendGroup('chat', this.state.friendDetail.jid, JSON.stringify(this.state.messageBody), newMsgIdSigleTrue);
															XMPP.sendStanza(sendSigleMsg);
															this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'image', '', newMsgIdSigleTrue);//入库当前朋友信息
														}
													}
												}
												let imgArr = [];
												let tempBody = this.state.messageBody;
												imgArr.push({
													url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&imageId=' + tempBody.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
													// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + tempBody.content.file[0].listFileInfo[0].id + '&fileName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&type=image&userId=' + this.state.basic.userId,
												})
												keyCode[tempBody.content.file[0].listFileInfo[0].id] = this.state.msgImgList.length;
												this.setState({
													msgImgList: this.state.msgImgList.concat(imgArr)
												})
											} else {
												this.setState({
													isShowIcon: true,
													isFailPosition: tempItemObjNotTrue.position
												})
											}

										});
										if (this.state.backPage == 'Group') {
											PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':[图片]', this.state.room.roomName, this.props.navigation);
										} else {
											PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, '[图片]', this.state.basic.trueName, this.props.navigation);
										}
									} else {
										Alert.alert(
											'提醒',
											'系统异常,请退出重试',
											[
												{
													text: '确定',
													onPress: () => {
														//更新redis
														RedisUtil.update(uuid, this.props.navigation, {
															ticket: this.state.ticket,
															userId: this.state.basic.userId,
															uuId: uuid
														}, 'lineStatus', 'back', () => {
															//设备当前为“后台”状态
															BackHandler.exitApp();
														});
													},
												}
											]
										)
									}
								}, () => {
									//alert('success')
									this.setState({
										isShowIcon: true,
										isFailPosition: tempItemObjNotTrue.position
									})
								}).catch((error) => {
									// console.error('error', error)
									this.setState({
										isShowIcon: true,
										isFailPosition: tempItemObjNotTrue.position
									})
								});

							}, (error) => {
								this.setState({
									showAlert: true,//alert框
									tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
								});
							});
						});
					}
				}, (error) => {
					this.setState({
						showAlert: true,//alert框
						tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
					});
				});
			}
		});
	};

//打开相机直接拍摄
	cameraUploadImage = () => {
		if (this.state.room.mute == '1') {
			this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);
		} else {
			//打开图像库：
			if (Platform.Version < 23 || Platform.OS == 'ios') {
				XmppUtil.xmppIsConnect(() => {
					this.takePicture();
				}, (error) => {
					this.setState({
						showAlert: true,//alert框
						tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
					});
				});

			} else {
				// this.requestCameraPermission(true);
				// this._checkPermission(true, 'camera');
				PermissionUtil.requestAndroidPermission(
					[PermissionsUtil.Permissions.read, PermissionsUtil.Permissions.write, PermissionsUtil.Permissions.camera], (value) => {
						if (typeof value == "boolean" && value) {
							XmppUtil.xmppIsConnect(() => {
								this.takePicture();
							}, (error) => {
								this.setState({
									showAlert: true,//alert框
									tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
								});
							});
						} else if (typeof value == "boolean" && !value) {
							this.setState({
                                showAlert: true,//alert框
                                tipMsg: '使用相机功能前，请先开启存储和相机权限！'//alert提示信息
                            });
						} else if (typeof value == "object") {
						    let status = true;
							for (let key in value) {
								if (!value[key]) {
                                    status = false;
                                }
							}
							if (status) {
                                XmppUtil.xmppIsConnect(() => {
                                    this.takePicture();
                                }, (error) => {
                                    this.setState({
                                        showAlert: true,//alert框
                                        tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
                                    });
                                });
                            } else {
                                this.setState({
                                    showAlert: true,//alert框
                                    tipMsg: '使用相机功能前，请先开启存储和相机权限！'//alert提示信息
                                });
                            }
						} else {
						}
					}
				);
			}
		}

	}
	takePicture = () => {
		cookie.save('isUpload', 1);//用于判断是否为选择图片后台状态
		ImagePickerManager.launchCamera(photoOptions, (response) => {
			console.log(response);
			if (response.didCancel) {
				//选择了取消
			} else {
                if (response.error) {
                    Alert.alert(
                        '提醒',
                        '使用相机功能前，请先开启相机和存储权限！',
                        [
                            {
                                text: '确定',
                            }
                        ]
                    )
                    return;
                }
				let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
				let newMsgIdSigle = UUIDUtil.getUUID().replace(/\-/g, '');
				let files = [{
					status: 'success',
					listFileInfo: [{
						fileName: response.fileName ? encodeURIComponent(response.fileName) : 'image.png',
						showPic: 'img'
					}]
				}, {imageUrl: response.uri}];//本地图片路径
				let tempmessageBody = this.state.backPage == 'Group' ? {
					"id": newMsgId,
					"type": 2,
					"otherFlag": true,
					"basic": {
						"userId": this.state.basic.jidNode,
						"userName": this.state.basic.trueName,
						"head": '',
						"sendTime": new Date().getTime(),
						"groupId": this.state.room.roomJid,
						"groupName": this.state.room.roomName,
						"type": 'groupChat'
					},

					"content": {
						"text": '',
						"interceptText": '',
						"file": files,
					},
					"atMembers": [],
					"occupant": {
						"state": '',
						"effect": '',
						"active": ''
					}
				} : {
					"id": newMsgIdSigle,
					"type": 2,
					"otherFlag": true,
					"basic": {
						"toId": this.state.friendDetail.jidNode,
						"type": "privateChat",
						"fromId": this.state.basic.jidNode,
						"userId": this.state.basic.userId,
						"photoId": this.state.basic.photoId,
						"userName": this.state.basic.trueName
					},
					"keyId": "privateSend00",
					"content": {
						"file": files,
						"text": "",
						"interceptText": '',
						"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
						"imageFiles": []
					},
					"showTime": true
				};
				let tempItemObjNotTrue = {
					body: JSON.stringify(tempmessageBody),
					sendType: 'to',
					position: this.state.data.length
				};
				let tempArr = [];
				tempArr.push(tempItemObjNotTrue);
				this.setState({
					data: this.state.data.concat(tempArr),//拼接本地图片
				}, () => {
					//执行上传
					//发送post上传请求
					let formData = new FormData();
					let file = {
						uri: response.uri,
						type: 'multipart/form-data',
						name: response.fileName ? encodeURIComponent(response.fileName) : 'image.png'
					};
					formData.append("file", file);
					let stype = this.state.backPage == 'Group' ? 'groupchat' : 'sglc';
					let to = this.state.backPage == 'Group' ? this.state.room.roomJid : this.state.friendDetail.jidNode;
					let url = Path.uploadImage + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&stype=' + stype + '&to=' + to + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;

					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'multipart/form-data',
						},
						body: formData,
					})
						.then((response) => response.json())
						.then((responseData) => {

							if (responseData.code.toString() == '200') {

								responseData.data.map((item, index) => {

									let body = JSON.parse(item);

									if (body.code + '' == '200') {
										let data = body.data;
										let fileBody = JSON.parse(data);
										let files = [];
										let obj = new Object();
										let obj1 = new Object();
										obj.status = "success";
										obj.listFileInfo = fileBody.listFileInfo;
										obj1.imageUrl = '/file/downloadThumbnail?fileInfoId=' + fileBody.listFileInfo[0].id,
											files.push(obj);
										files.push(obj1);

										let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
										let newMsgIdSigle = UUIDUtil.getUUID().replace(/\-/g, '');
										this.setState({
											sendMsgId: this.state.backPage == 'Group' ? newMsgId : newMsgIdSigle,
											messageBody: this.state.backPage == 'Group' ? {
												"id": newMsgId,
												"type": 2,
												"messageType": 'image',
												"basic": {
													"userId": this.state.basic.jidNode,
													"userName": this.state.basic.trueName,
													"head": '',
													"sendTime": new Date().getTime(),
													"groupId": this.state.room.roomJid,
													"type": 'groupChat'
												},

												"content": {
													"text": '',
													"interceptText": '',
													"file": files,
												},
												"atMembers": [],
												"occupant": {
													"state": '',
													"effect": '',
													"active": ''
												}
											} : {
												"id": newMsgIdSigle,
												"type": 2,
												"messageType": 'image',
												"basic": {
													"toId": this.state.friendDetail.jidNode,
													"type": "privateChat",
													"fromId": this.state.basic.jidNode,
													"userId": this.state.basic.userId,
													"photoId": this.state.basic.photoId,
													"userName": this.state.basic.trueName
												},
												"keyId": "privateSend00",
												"content": {
													"file": files,
													"text": "",
													"interceptText": '',
													"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
													"imageFiles": []
												},
												"showTime": true
											},
										})

										if (Platform.OS == 'ios') {
											if (this.state.backPage == 'Group') {

												if (this.state.room.mute == '1') {
													this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

												} else {
													if (this.state.messageBody.content.file.length > 0) {
														XMPP.XMPPSendGroupMessage({
																'message': this.state.messageBody,
																'jid': this.state.room.roomJid,
																'uuid': newMsgId
															},
															(error, event) => {
																if (error) {
																	this.refs.toast.show(error, DURATION.LENGTH_SHORT);

																} else {
																	//this.refs.toast.show(event, DURATION.LENGTH_SHORT);

																	this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'image', this.state.basic.trueName);

																	PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':[图片]', this.state.room.roomName, this.props.navigation);

																	// let mesbody = {};
																	// mesbody['body'] = this.state.messageBody;
																	// messagesBody.push(mesbody);
																	// this.setState({
																	//     data: messagesBody
																	// })
																}
															})
													}
												}

											} else {
												//单聊
												if (this.state.messageBody.content.file.length > 0) {
													XMPP.XMPPSendMessage({
														'message': this.state.messageBody,
														'friendJid': this.state.friendDetail.jid,
														'messageId': newMsgIdSigle
													});
													this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'image', '', newMsgIdSigle);//入库当前朋友信息

													PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, '[图片]', this.state.basic.trueName, this.props.navigation);
												}
											}
										} else {

											let tempItemObj = {};
											//android
											if (this.state.backPage == 'Group') {

												if (this.state.room.mute == '1') {
													this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

												} else {
													tempItemObj.body = this.state.messageBody;
													let tempArr = [];
													tempArr.push(tempItemObj);
													let tempData = JSON.parse(JSON.stringify(this.state.data));
													tempData.splice(tempItemObjNotTrue.position, 1, tempItemObj);
													this.setState({
														data: tempData,
														isNotPC: true
													});

													if (this.state.messageBody.content.file.length > 0) {
														let sendGroupMsg = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgId);
														XMPP.sendStanza(sendGroupMsg);

														PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':[图片]', this.state.room.roomName, this.props.navigation);
													}
													// this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'image', this.state.basic.trueName);
												}

											} else {
												tempItemObj.body = JSON.stringify(this.state.messageBody);
												tempItemObj.sendType = 'to';
												let tempArr = [];
												tempArr.push(tempItemObj);
												let tempData = JSON.parse(JSON.stringify(this.state.data));
												tempData.splice(tempItemObjNotTrue.position, 1, tempItemObj);
												this.setState({
													data: tempData,
												});
												//单聊
												if (this.state.messageBody.content.file.length > 0) {
													// XMPP.message(JSON.stringify(this.state.messageBody), this.state.friendDetail.jid);
													let sendSigleMsg = XmlUtil.sendGroup('chat', this.state.friendDetail.jid, JSON.stringify(this.state.messageBody), newMsgIdSigle);
													XMPP.sendStanza(sendSigleMsg);

													PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, '[图片]', this.state.basic.trueName, this.props.navigation);

													this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'image', '', newMsgIdSigle);//入库当前朋友信息
												}
											}
										}
										let imgArr = [];
										let tempBody = this.state.messageBody;
										let content = JSON.parse(body.data);
										imgArr.push({
											url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + content.listFileInfo[0].id + '&imageId=' + content.listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
											// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + tempBody.content.file[0].listFileInfo[0].id + '&fileName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&type=image' + '&userId=' + this.state.basic.userId,
										})
										keyCode[tempBody.content.file[0].listFileInfo[0].id] = this.state.msgImgList.length;
										this.setState({
											msgImgList: this.state.msgImgList.concat(imgArr)
										})
									} else {
										this.setState({
											isShowIcon: true,
											isFailPosition: tempItemObjNotTrue.position
										})
									}

								})
							} else {
								Alert.alert(
									'提醒',
									'系统异常,请退出重试',
									[
										{
											text: '确定',
											onPress: () => {
												//更新redis
												RedisUtil.update(uuid, this.props.navigation, {
													ticket: this.state.ticket,
													userId: this.state.basic.userId,
													uuId: uuid
												}, 'lineStatus', 'back', () => {
													//设备当前为“后台”状态
													BackHandler.exitApp();
												});
											},
										}
									]
								)
							}
						}, () => {
							//alert('success')
							this.setState({
								isShowIcon: true,
								isFailPosition: tempItemObjNotTrue.position
							})
						})
						.catch((error) => {
							// console.error('error', error)
							this.setState({
								isShowIcon: true,
								isFailPosition: tempItemObjNotTrue.position
							})
						});
				});

			}
		});
	}
//播放/暂停语音播放
	playVoiceMessage = (audioPath, soundTime, item) => {
		if (s) {
			s.stop(() => s.release());
			this.setState({
				playAnimation: false
			})
		}
		if (Platform.OS == "android") {
			let localFile = '/storage/emulated/0/Android/data/com.instantmessage/files/im/' + this.state.basic.userId + '/files/' + audioPath;
			RNFS.exists(localFile).then((res) => {
				if (res) {
					flagAni = 0;
					this.startLeft(soundTime, item);
					s = new Sound(localFile, null, (e) => {
						if (e) {
							return;
						}
						if (this.state.isPlay) {
							s.stop(() => s.release());
						} else {
							if (s._duration > 0) {
								s.play(() => {
									s.release();
								});
							} else {
								this.refs.toast.show('消息读取失败，请稍后再试', DURATION.LENGTH_SHORT);
							}
						}
					});
				} else {
					this._downloadAac(audioPath, (url) => {
						flagAni = 0;
						this.startLeft(soundTime, item);
						s = new Sound(url, null, (e) => {
							if (e) {
								return;
							}
							if (this.state.isPlay) {
								s.stop(() => s.release());
							} else {
								if (s._duration > 0) {
									s.play(() => {
										s.release();
									});
								} else {
									this.refs.toast.show('消息读取失败，请稍后再试', DURATION.LENGTH_SHORT);
								}
							}
						});
					})
				}
			});
		} else {
			let url = Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + audioPath + '&type=sound' + '&userId=' + this.state.basic.userId;
			flagAni = 0;
			this.startLeft(soundTime, item);
			s = new Sound(url, null, (e) => {
				if (e) {
					return;
				}
				if (this.state.isPlay) {
					s.stop(() => s.release());
				} else {
					if (s._duration > 0) {
						s.play(() => {
							s.release();
						});
					} else {
						this.refs.toast.show('消息读取失败，请稍后再试', DURATION.LENGTH_SHORT);
					}
				}
			});
		}
	}
	//下载语音文件到本地
	_downloadAac = (fileId, callback) => {
		let url = Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + fileId + '&fileName=' + fileId + '&type=file' + '&userId=' + this.state.basic.userId;
		let downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/im/' + this.state.basic.userId + '/files';
		RNFS.existsAssets(downloadDest).then((res) => {
			if (!res) {
				RNFS.mkdir(downloadDest)
			}
			const options = {
				fromUrl: url,
				toFile: downloadDest + '/' + fileId,
				background: false,
			};
			try {
				const ret = RNFS.downloadFile(options);
				ret.promise.then(res => {
					if (res.statusCode == 200) {
						callback(downloadDest + '/' + fileId);
					}
				}).catch(err => {
				});
			}
			catch (e) {
			}
		})
	};
	recordStart = () => {
		AudioRecorder.prepareRecordingAtPath(audioPath, {
			SampleRate: 22050,
			Channels: 1,
			AudioQuality: "Low",
			AudioEncoding: "aac"
		});
		this.startHeight();//开启动画
	}

//录制语音消息
	recardVoiceMessage = () => {
		XmppUtil.xmppIsConnect(() => {
			beginTime = new Date().getTime();
			recordStatus = true;
			if (Platform.OS == 'ios') {

				XMPP.getIOSPermission({'permissionType': 'microphone'},
					(error, event) => {
						if (event == 'true') {
							this.recordStart();
						}
					});

			} else if (Platform.Version < 23) {
				this.recordStart();
			} else {
				// this.requestRecordAudioPermission(true);
				// this._checkPermission(true, 'audio');
				PermissionUtil.requestAndroidPermission(
					PermissionsUtil.Permissions.audio, (value) => {
						if (typeof value == "boolean" && value) {
							this.recordStart();
						} else if (typeof value == "boolean" && !value) {
							Alert.alert(
								'提醒',
								'使用语音功能前，请先开启录音权限！',
								[
									{
										text: '确定',
									}
								]
							)
						}
					}
				);
			}
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
	}

	startHeight = () => {
		this.state.voiceHeight.setValue(100);
		Animated.timing(this.state.voiceHeight, {
			toValue: 20,
			duration: 1000,
			// useNativeDriver: true//启用原生驱动
		}).start(() => {
			if (this.state.isAudioBoxShow) {
				this.startHeight()
			}
		});
	}

	//发送语音
	_sendSound = () => {

		endTime = new Date().getTime();
		recordStatus = false;

		if (this.state.isAudioBoxShow) {
			this.setState({
				isAudioBoxShow: false,
			}, () => {
				AudioRecorder.stopRecording();
			})

		}
	};

//上传声音文件
	upLoadVoiceFile() {

		let formData = new FormData();       //因为需要上传多张图片,所以需要遍历数组,把图片的路径数组放入formData中
		let file = {
			uri: Platform.OS == 'android' ? 'file://' + audioPath : audioPath,
			type: 'multipart/form-data',
			name: 'test.aac'
		};   //这里的key(uri和type和name)不能改变,
		formData.append("files", file);

		let stype = this.state.backPage == 'Group' ? 'voice' : 'voice';//'groupchat' : 'sglc';
		let to = this.state.backPage == 'Group' ? this.state.room.roomJid : this.state.friendDetail.jidNode;
		let url = Path.uploadImage + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&stype=' + stype + '&to=' + to + '&jidNode=voice_' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
		let options = {};
		options.body = formData;
		options.headers = {"Content-Type": "multipart/form-data;charset=UTF-8"};
		options.method = 'POST';
		fetch(url, options)
			.then((response) => response.json())
			.then((responseData) => {

				if (responseData.code.toString() == '200') {
					responseData.data.map((item, index) => {

						let body = JSON.parse(item);

						if (body.code + '' == '200') {
							let data = body.data;
							let fileBody = JSON.parse(data);
							let files = [];
							let obj = new Object();
							let obj1 = new Object();
							obj.status = "success";
							obj.listFileInfo = fileBody.listFileInfo;
							obj1.imageUrl = 'images/' + fileBody.listFileInfo[0].showPic + '.png';
							files.push(obj);
							files.push(obj1);

							let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
							let newMsgIdSigle = UUIDUtil.getUUID().replace(/\-/g, '');

							let messageBody = this.state.backPage == 'Group' ? {
								"id": newMsgId,
								"type": 2,
								"messageType": 'voice',
								"soundTime": (endTime - beginTime) / 1000 < 1 ? 1 : Math.floor((endTime - beginTime) / 1000),
								"basic": {
									"userId": this.state.basic.jidNode,
									"userName": this.state.basic.trueName,
									"head": '',
									"sendTime": new Date().getTime(),
									"groupId": this.state.room.roomJid,
									"groupName": this.state.room.roomName,
									"type": 'groupChat'
								},
								"content": {
									"text": '',
									"interceptText": '',
									"file": files,
								},
								"atMembers": [],
								"occupant": {
									"state": '',
									"effect": '',
									"active": ''
								}
							} : {
								"id": newMsgIdSigle,
								"type": 2,
								"messageType": 'voice',
								"soundTime": (endTime - beginTime) / 1000 < 1 ? 1 : Math.floor((endTime - beginTime) / 1000),
								"basic": {
									"toId": this.state.friendDetail.jidNode,
									"type": "privateChat",
									"fromId": this.state.basic.jidNode,
									"userId": this.state.basic.userId,
									"photoId": this.state.basic.photoId,
									"userName": this.state.basic.trueName
								},
								"keyId": "privateSend00",
								"content": {
									"file": files,
									"text": "",
									"sendTime": FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime()),
									"imageFiles": []
								},
								"showTime": true
							}


							this.setState({
								sendMsgId: this.state.backPage == 'Group' ? newMsgId : newMsgIdSigle,
							})

							if (Platform.OS == 'ios') {
								if (this.state.backPage == 'Group') {

									if (this.state.room.mute == '1') {
										this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

									} else {
										XMPP.XMPPSendGroupMessage({
												'message': messageBody,
												'jid': this.state.room.roomJid,
												'uuid': newMsgId
											},
											(error, event) => {
												if (error) {
													this.refs.toast.show(error, DURATION.LENGTH_SHORT);

												} else {
													// this.refs.toast.show('发送成功', DURATION.LENGTH_SHORT);
													//
													this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'voice', this.state.basic.trueName, newMsgId);

												}
											})
									}

								} else {
									//单聊
									XMPP.XMPPSendMessage({
										'message': messageBody,
										'friendJid': this.state.friendDetail.jid,
										'messageId': newMsgIdSigle//this.state.messageBody.id
									})
									// this.refs.toast.show('发送成功', DURATION.LENGTH_SHORT);
									//
									this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'voice', '', newMsgIdSigle);//入库当前朋友信息
								}
							} else {
								let tempItemObj = {};
								//android
								if (this.state.backPage == 'Group') {
									if (this.state.room.mute == '1') {
										this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

									} else {
										tempItemObj.body = messageBody;
										let tempArr = [];
										tempArr.push(tempItemObj);
										this.setState({
											data: this.state.data.concat(tempArr),
											isNotPC: true
										});
										let sendGroupMsg = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(messageBody), newMsgId);
										XMPP.sendStanza(sendGroupMsg);

										// this._saveToDB(2, '', '', '', this.state.room.roomJid, this.state.room.roomName, this.state.room.photoId, 'voice', this.state.basic.trueName, newMsgId);
									}

								} else {
									tempItemObj.body = JSON.stringify(messageBody);
									tempItemObj.sendType = 'to';
									let tempArr = [];
									tempArr.push(tempItemObj);
									this.setState({
										data: this.state.data.concat(tempArr),
									});
									//单聊
									// XMPP.message(JSON.stringify(this.state.messageBody), this.state.friendDetail.jid);
									let sendSigleMsg = XmlUtil.sendGroup('chat', this.state.friendDetail.jid, JSON.stringify(messageBody), newMsgIdSigle);
									XMPP.sendStanza(sendSigleMsg);
									this._saveToDB(1, this.state.friendDetail.jidNode, this.state.friendDetail.trueName, this.state.friendDetail.photoId, '', '', '', 'voice', '', newMsgIdSigle);//入库当前朋友信息

								}
							}

						} else {
							this.setState({
								isShowIcon: true,
								isFailPosition: tempItemObjNotTrue.position
							})
						}
						RNFS.unlink(audioPath).then((value) => {
						}).catch((err) => {
						});
					});
					if (this.state.backPage == 'Group') {
						PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, this.state.basic.trueName + ':[语音]', this.state.room.roomName, this.props.navigation);
					} else {
						PushUtil.pushSingleNotification(this.state.basic, this.state.ticket, this.state.friendDetail.jidNode, this.state.uuid, this.state.friendDetail.userId, '[语音]', this.state.basic.trueName, this.props.navigation);
					}
				} else if (responseData.code.toString() == '-32') {
				    Alert.alert(
                        '提醒',
                        '请确认是否开启录音权限！',
                        [
                            {
                                text: '确定',
                            }
                        ]
                    )

				} else {
					Alert.alert(
						'提醒',
						'系统异常,请退出重试',
						[
							{
								text: '确定',
								onPress: () => {
									//更新redis
									RedisUtil.update(uuid, this.props.navigation, {
										ticket: this.state.ticket,
										userId: this.state.basic.userId,
										uuId: uuid
									}, 'lineStatus', 'back', () => {
										//设备当前为“后台”状态
										BackHandler.exitApp();
									});
								},
							}
						]
					)
				}

			}, (error) => {
			})
			.catch((error) => {
				console.error('error', error)
			});

	}

//上传附件文件
	uploadFiles = () => {
		if (this.state.room.mute == '1') {
			this.refs.toast.show('您已被禁言，请联系管理员', DURATION.LENGTH_SHORT);

		} else {
			if (Platform.Version < 23 || Platform.OS == 'ios') {
				cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
				this.openFilePicker();
			} else {
				// this.requestReadExternalStoragePermission(true);
				// this._checkPermission(true, 'file');
				PermissionUtil.requestAndroidPermission(
					[PermissionsUtil.Permissions.read, PermissionsUtil.Permissions.write, PermissionsUtil.Permissions.camera], (value) => {
						if (typeof value == "boolean" && value) {
							this.openFilePicker();
						} else if (typeof value == "boolean" && !value) {

							this.setState({
                                showAlert: true,//alert框
                                tipMsg: '使用文件功能前，请先开启存储和相机权限！'//alert提示信息
                            });
						} else if (typeof value == "object") {
							let status = true;
							for (let key in value) {
								if (!value[key]) {
									status = false;
								}
							}
							if (status) {
								this.openFilePicker();
							} else {
								this.setState({
                                    showAlert: true,//alert框
                                    tipMsg: '使用文件功能前，请先开启存储和相机权限！'//alert提示信息
                                });

							}
						} else {
						}
					}
				);
			}
		}

	}

	_saveToDB = (type, friendJidNode, friendTrueName, friendPhotoId, roomJid, roomName, roomHead, msgType, sendName, msgId) => {
		if (type == 1) {
			//单聊 （判断是否第一次聊天）
			if (this.state.selectFlag) {
				Sqlite.saveTalker(
					this.state.basic.userId,
					1,
					friendJidNode + '@' + Path.xmppDomain,//this.state.friendDetail.jid,
					friendJidNode,//this.state.friendDetail.jidNode,
					friendTrueName,//this.state.friendDetail.trueName,
					friendPhotoId,//this.state.friendDetail.photoId,
					false,
					false,
					false,
					() => {
						Sqlite.saveMessage(this.state.basic.userId, friendJidNode, msgType, this.state.messageBody.content.interceptText, sendName, msgId, null, (data) => {
							this.setState({
								selectFlag: false
							}, () => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							})
						});
					}
				);
			} else {
				//更新
				Sqlite.saveMessage(this.state.basic.userId, friendJidNode, msgType, this.state.messageBody.content.interceptText, sendName, msgId, null, (data) => {
					DeviceEventEmitter.emit('refreshPage', 'refresh');
				});
			}
		} else {
			if (this.state.selectFlag) {
				Sqlite.saveTalker(
					this.state.basic.userId,
					2,
					'',
					roomJid,
					roomName,
					roomHead,
					false,
					false,
					false,
					() => {
						Sqlite.saveMessage(
							this.state.basic.userId,
							roomJid,
							msgType,
							this.state.messageBody.content.interceptText,
							sendName,
							msgId, null,
							(data) => {
								this.setState({
									selectFlag: false
								}, () => {
									Sqlite.updateTalkerIsAnted(this.state.basic.userId, roomJid, null, () => {
										DeviceEventEmitter.emit('refreshPage', 'refresh');
									});
								})
							}
						);
					}
				);
			} else {
				//更新
				Sqlite.saveMessage(this.state.basic.userId, roomJid, msgType, this.state.messageBody.content.interceptText, sendName, msgId, null, (data) => {
					Sqlite.updateTalkerIsAnted(this.state.basic.userId, roomJid, null, () => {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
					});
				});
			}
		}

	};

	_downloadFile = (file) => {
		DeviceEventEmitter.emit('changeLoading', 'true');
		let url = Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)) + '&type=file' + '&userId=' + this.state.basic.userId;
		let downloadDest = '';
		if (Platform.OS == 'android') {
			downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/' + file.fileName;
		} else {
			downloadDest = '/storage/emulated/0/Android/data/com.egt_rn/files/' + file.name;
		}
		const options = {
			fromUrl: url,
			toFile: downloadDest,
			background: false,
		};
		try {
			const ret = RNFS.downloadFile(options);
			ret.promise.then(res => {
				if (res.statusCode == 200) {
					DeviceEventEmitter.emit('changeLoading', 'false');
					if (Platform.OS == 'android') {
						Alert.alert(
							'下载成功，文件保存路径为：',
							downloadDest.substring(downloadDest.indexOf('0/') + 1, downloadDest.length),
							[
								{
									text: '确定', onPress: () => {
										this.refs.bottomMenu._changeMenuShow(false);
										this.refs.bottomMenu._changeFirMenuShow(false);
										this.refs.bottomMenu._changeSecMenuShow(false);
									}
								}
							]
						)

					}
				}
			}).catch(err => {
			});
		}
		catch (e) {
		}
	};

//确认下载弹框 没有使用---------------------
	showAlert(file) {
		Alert.alert('确认下载', file.fileName,
			[
				{
					text: "取消", onPress: () => {
						this.setState({showConfirm: false})
					}
				},
				{text: "确认", onPress: this._downloadFile.bind(this, file)},
			]
		);
	}

//消息撤回
	_refuseMsg = (msgId, item, type) => {

		let url = this.state.backPage == 'Message' ? Path.refuseSingleMsg : Path.refuseMucMsg;
		let reqBody = 'uuId=' + uuid
			+ '&ticket=' + this.state.ticket
			+ '&msgId=' + msgId
			+ `&toContent=您撤回了一条消息&userId=${this.state.basic.userId}`;
		if (this.state.backPage == 'Message') {
			reqBody += `&fromContent=${this.state.basic.trueName}撤回了一条消息`;
		}

		FetchUtil.sendPost(url, reqBody, this.props.navigation, (res) => {

			let sqlContent = `${this.state.basic.trueName}撤回了一条消息`;
			if (res.code.toString() == '200') {

				if ((JSON.parse(res.data).deleted > 0 && this.state.backPage == 'Group') || (res.data >= 1 && this.state.backPage == 'Message')) {

					if (Platform.OS == 'android') {

						let tempMsg = '';
						if (this.state.backPage == 'Message') {
							tempMsg = XmlUtil.refuseSingleMsg(this.state.friendDetail.jidNode, this.state.basic.jidNode, msgId, sqlContent, '');
						} else {
							tempMsg = XmlUtil.refuseMucMsg(this.state.room.roomJid, msgId, this.state.basic.trueName);
						}

						XMPP.sendStanza(tempMsg);//这里单聊群聊都发普通报文
					} else {

						XMPP.XMPPRecallMessage({
							backPage: this.state.backPage,
							friendJidNode: this.state.friendDetail.jidNode,
							userJidNode: this.state.basic.jidNode,
							messageId: msgId,
							tip: `${this.state.basic.trueName}撤回了一条消息`,
							roomJid: this.state.room.roomJid,
							uuid: UUIDUtil.getUUID().replace(/\-/g, ''),
							trueName: this.state.basic.trueName
						})

					}

					// Sqlite.update

					Sqlite.updateMessage(this.state.basic.userId, msgId, this.state.backPage == 'Message' ? '' : this.state.basic.trueName, 'text', '您撤回了一条消息', () => {
						DeviceEventEmitter.emit('refreshPage', 'refresh');
						this.setState({
							TranspondMemberType: false,
							isTextShowID: '',
							isTextShow: false,
							TranspondMemberItem: {},//content
							tempMsgType: 0,
						}, () => {
							let tempArr = JSON.parse(JSON.stringify(this.state.data));
							let msgImagesList = this.state.msgImgList;

							tempArr.map((item, index) => {
								if (item.body && item.body.id == msgId) {
									if (item.body.messageType == 'image') {
										let keyNum = keyCode[item.body.content.file[0].listFileInfo[0].id];
										msgImagesList.splice(keyNum, 1);
									}
									item.body.messageType = 'text';
									item.body.type = 3;
									item.body.content.file = [];
									item.body.content.text = '您撤回了一条消息';
									item.body.content.interceptText = '您撤回了一条消息';
								}
							});

							if (this.state.backPage == 'Message') {
								chatMessagesBody = tempArr
							} else {
								messagesBody = tempArr
							}

							this.setState({
								data: tempArr,
								msgImgList: msgImagesList,
							}, () => {
								DeviceEventEmitter.emit('refreshPage', 'refresh');
							});
						});
					})
				} else {
					this.refs.toast.show('消息撤回失败', DURATION.LENGTH_SHORT);
				}
			}
		})
	}
//render处理 start
	timeView = (index, showTime) => {
		//聊天区域的时间显示
		return (
			<View key={index} style={{
				height: 30,
				justifyContent: 'center',
				alignItems: 'center'
			}}>
				<Text style={{
					backgroundColor: '#c5c5c5',
					borderRadius: 4,
					paddingLeft: 5,
					paddingRight: 5,
					textAlign: 'center',
					color: '#fff',
					fontSize: 10
				}}>{FormatDate.formatTimeStmpTypeShow(Number(showTime))}</Text>
			</View>
		)
	};
//自己发送的消息处理 start
//文本消息
	myselfText = (type, content, oid, item, msgId) => {
		let tempContent = content;//.substring(1, content.length - 1);
		let trueText = '';
		let textArr = [];
		let isEmoji = false;
		let contentText = HtmlUtil.htmlDecodeByRegExp(tempContent.interceptText);
		let tempView = null;
		let messageTime;
		let tempSendTime = 0;
		//表情处理
		if (tempContent.interceptText) {
			tempContent.interceptText = HtmlUtil.htmlDecodeByRegExp(tempContent.interceptText);
			let r = /\[(.+?)\]/g;
			let arr = tempContent.interceptText.match(r);
			if (arr && arr.length > 0) {
				isEmoji = true;
				let preText = "";
				let backText = "";
				for (let i = 0; i < arr.length; i++) {
					let index = contentText.indexOf(arr[i]);
					if (index != -1) {
						preText = contentText.substring(0, index);
						backText = contentText.substring(index + arr[i].length);
						preText += arr[i].substring(0, arr[i].lastIndexOf('['));
						arr[i] = arr[i].substring(arr[i].lastIndexOf('['), arr[i].length);
						let markEmoji = EmojiUtil.getEmojiName(arr[i].substring(1, arr[i].length - 1));
						if (markEmoji == 'isNotExit') {
							preText += arr[i];
							textArr.push(
								<Text key={i} style={{color: type == 'self' ? '#FFFFFF' : '#000000'}}>
									{preText}
								</Text>
							)
						} else {
							textArr.push(
								<Text key={i} style={{color: type == 'self' ? '#FFFFFF' : '#000000'}}>
									{preText}
									<ShowEmoji name={markEmoji} style={{flex: 1, fontSize: 22, color: 'yellow'}}/>
								</Text>
							)
						}
						contentText = backText;
					}
				}
				textArr.push(
					<Text key={new Date().getTime()} style={{color: type == 'self' ? '#FFFFFF' : '#000000'}}>
						{contentText}
					</Text>
				)
			} else {
				isEmoji = false;
				trueText = HtmlUtil.htmlDecodeByRegExp(tempContent.interceptText);
			}
		}
		let emojiView = null;
		if (isEmoji) {
			emojiView = <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>{textArr}</View>
		} else {
			emojiView =
				<Text style={{color: type == 'self' ? '#fff' : '#000', lineHeight: 20}}
					  selectable={false}>{trueText}</Text>
		}

		//时间处理+悬浮选项处理
		if (this.state.backPage == 'Message') {
			if (Platform.OS == 'ios' && typeof content.sendTime == "string" && content.sendTime.indexOf('-') != -1) {
				messageTime = content.sendTime.replace(/-/g, '/');
			} else if (Platform.OS == 'android' && typeof content.sendTime == "string" && content.sendTime.indexOf('-') != -1) {
				messageTime = ToolUtil.strToStemp(content.sendTime);
			} else {
				messageTime = content.sendTime;
			}

			//单聊消息
			tempSendTime = ToolUtil.calculateDiffTime(new Date(messageTime).getTime() / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.fromId == this.state.basic.jidNode) {
				//两分钟内
				// tempView = this.optionPopView(item,sendType == 'to'?'self':'other',item.body.id,true,true,true);
				tempView = this.optionPopView(item, 0, item.body.id, true, true, true);
			} else {
				//发送时间大于两分钟
				// tempView = this.optionPopView(item,sendType == 'to'?'self':'other',item.body.id,false,true,true);
				tempView = this.optionPopView(item, 0, item.body.id, false, true, true);
			}
		} else {
			messageTime = item.body.basic.sendTime;
			//群聊消息
			tempSendTime = ToolUtil.calculateDiffTime(new Date(messageTime).getTime() / 1000, new Date().getTime() / 1000);
			if (tempSendTime <= 2 && item.body.basic.userId == this.state.basic.jidNode) {
				//两分钟内
				// tempView = this.optionPopView(item,this.state.basic.jidNode == item.body.basic.userId?'self':'other',item.body.id,true,true,true);
				tempView = this.optionPopView(item, 0, item.body.id, item.body.occupant.state ? false : true, true, true);
			} else {
				//发送时间大于两分钟
				// tempView = this.optionPopView(item,this.state.basic.jidNode == item.body.basic.userId?'self':'other',item.body.id,false,true,true);
				tempView = this.optionPopView(item, 0, item.body.id, false, true, true);
			}
		}

		return (
			<View style={{justifyContent: 'center'}}>
				<View style={[{position: 'relative'}, type == 'self' ? {paddingRight: 3} : {paddingLeft: 3}]}>
					<PopoverController>
						{({openPopover, closePopover, popoverVisible, setPopoverAnchor, popoverAnchorRect}) => (
							<React.Fragment>
								<View ref={setPopoverAnchor}
									  style={[styles.sendTextView, {
										  flexDirection: isEmoji ? 'row' : 'column',
										  backgroundColor: type == 'self' ? '#549dff' : '#fff',
										  borderColor: type == 'self' ? '#549dff' : '#d0d0d0',
										  // justifyContent: 'space-around'
									  }]}
									  onStartShouldSetResponder={(evt) => {
										  pressInTime = new Date().getTime();
										  return true;
									  }}
									  onResponderRelease={(evt) => {
										  pressOutTime = (new Date().getTime() - pressInTime) / 1000;
										  if (pressOutTime > 0.5) {
											  this.setState({
												  choosedItem: item,
											  }, () => {
												  this.popObj = closePopover;
												  openPopover()
											  });
										  }
									  }}
								>
									{emojiView}
								</View>
								<View transform={[{rotate: '45deg'}]}
									  style={[styles.sendTextIcon, type == 'self' ? styles.sendTextIconSelf : styles.sendTextIconOther]}/>
								<Popover
									contentStyle={styles.content}
									arrowStyle={styles.arrow}
									backgroundStyle={styles.background}
									useNativeDriver={true}
									visible={popoverVisible}
									placement={'top'}
									onClose={closePopover}
									onDismiss={closePopover}
									fromRect={popoverAnchorRect}
									supportedOrientations={['portrait', 'landscape']}
								>
									{tempView}
								</Popover>
							</React.Fragment>
						)}
					</PopoverController>

				</View>
				{/*{this.state.isTextShow && this.state.isTextShowID == oid ? tempView : null}*/}
			</View>
		)
	};
//撤回消息
	revocationText = (type, name) => {
		return <View style={[{position: 'relative'}, type == 'self' ? {paddingRight: 3} : {paddingLeft: 3}]}>
			<View
				style={[styles.sendTextView, {
					backgroundColor: type == 'self' ? '#549dff' : '#fff',
					borderColor: type == 'self' ? '#549dff' : '#d0d0d0',
				}]}
			>
				<Text style={{color: type == 'self' ? '#fff' : '#000', lineHeight: 20}}
					  selectable={false}>{type == 'other' ? name : '您'}撤回了一条消息</Text>
			</View>
			<View transform={[{rotate: '45deg'}]}
				  style={[styles.sendTextIcon, type == 'self' ? styles.sendTextIconSelf : styles.sendTextIconOther]}/>
		</View>
	}
//语音消息
	myselfAudio = (type, fileId, soundTime, oid, content, item) => {
		// delete item.isPlay;
		if (item.isPlay) {
			item.isPlay.setValue(0);
		} else {
			item['isPlay'] = new Animated.Value(0);
			item.isPlay.setValue(0);
		}
		let tempSendTime = 0;
		let tempView;
		let messageTime;
		if (this.state.backPage == 'Message') {
			if (Platform.OS == 'ios' && typeof content.sendTime == "string" && content.sendTime.indexOf('-') != -1) {
				messageTime = content.sendTime.replace(/-/g, '/');
			} else if (Platform.OS == 'android' && typeof content.sendTime == "string" && content.sendTime.indexOf('-') != -1) {
				messageTime = ToolUtil.strToStemp(content.sendTime);
			} else {
				messageTime = content.sendTime;
			}
			//单聊消息
			tempSendTime = ToolUtil.calculateDiffTime(new Date(messageTime).getTime() / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.fromId == this.state.basic.jidNode) {
				//两分钟内
				tempView = this.optionPopView(item, 2, item.body.id, true, false, false);
			} else {
				//发送时间大于两分钟
				tempView = null;
			}
		} else {
			messageTime = item.body.basic.sendTime;
			//群聊消息
			tempSendTime = ToolUtil.calculateDiffTime(messageTime / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.userId == this.state.basic.jidNode) {
				//两分钟内
				tempView = this.optionPopView(item, 2, item.body.id, item.body.occupant.state ? false : true, false, false);
			} else {
				//发送时间大于两分钟
				tempView = null;
			}
		}
		return (
			<View style={{justifyContent: 'center'}}>
				<View style={[{position: 'relative'}, type == 'self' ? {paddingRight: 3} : {paddingLeft: 3}]}>
					<PopoverController>
						{({openPopover, closePopover, popoverVisible, setPopoverAnchor, popoverAnchorRect}) => (
							<React.Fragment>
								<View ref={setPopoverAnchor}
									  style={[styles.sendTextView, styles.soundWidth, {
										  backgroundColor: type == 'self' ? '#549dff' : '#ffffff',
										  width: soundTime + 70,
										  flexDirection: 'row',
										  borderColor: type == 'self' ? '#549dff' : '#d0d0d0'
									  }]}
									  onStartShouldSetResponder={(evt) => {
										  pressInTime = new Date().getTime();
										  return true;
									  }}
									  onResponderRelease={(evt) => {
										  pressOutTime = (new Date().getTime() - pressInTime) / 1000;

										  if (pressOutTime > 0.5) {
											  this.setState({
												  choosedItem: item
											  }, () => {
												  this.popObj = closePopover;
												  openPopover()
											  });
										  } else {
											  this.playVoiceMessage(fileId, soundTime, item);
										  }
									  }}
								>
									{
										type == 'other' ? (
											<View style={{flexDirection: 'row'}}>
												<Image source={require('../../images/chat_sound_b.png')}
													   style={styles.chatSound}/>
												<Animated.View style={{
													backgroundColor: '#FFFFFF',
													zIndex: 999,
													height: 15,
													right: 12,
													opacity: item.isPlay
												}}><Text style={{color: 'transparent'}}>{'1'}</Text></Animated.View>
											</View>
										) : null
									}
									<Text style={{
										flex: 1,
										color: type == 'self' ? '#fff' : '#000',
										textAlign: type == 'self' ? 'left' : 'right'
									}}>{soundTime}"</Text>
									{
										type == 'self' ? (
											<View style={{flexDirection: 'row'}}>
												<Animated.View style={{
													backgroundColor: '#549dff',
													zIndex: 999,
													height: 15,
													left: 12,
													opacity: item.isPlay
												}}><Text style={{color: 'transparent'}}>{'1'}</Text></Animated.View>
												<Image source={require('../../images/chat_sound_m.png')}
													   style={styles.chatSound}/>
											</View>) : null
									}
								</View>
								<View transform={[{rotate: '45deg'}]}
									  style={[styles.sendTextIcon, type == 'self' ? styles.sendTextIconSelf : styles.sendTextIconOther]}/>
								<Popover
									contentStyle={styles.content}
									arrowStyle={styles.arrow}
									backgroundStyle={styles.background}
									useNativeDriver={true}
									visible={popoverVisible}
									placement={'top'}
									onClose={closePopover}
									fromRect={popoverAnchorRect}
									supportedOrientations={['portrait', 'landscape']}
								>
									{tempView}
								</Popover>
							</React.Fragment>
						)}
					</PopoverController>
				</View>
			</View>
		)
	};
	startLeft = (soundTime, item) => {
		this.setState({
			playAnimation: true
		}, () => {
			flagAni++;
			item.isPlay.setValue(0);
			this.playVoice = Animated.timing(item.isPlay, {
				toValue: 0.5,
				duration: 1000,
				useNativeDriver: true//启用原生驱动
			}).start(() => {
				if (soundTime && soundTime != flagAni && this.state.playAnimation) {
					this.startLeft(soundTime, item);
				} else {
					flagAni = 0;
					item.isPlay.setValue(0);
				}
			});
		})
	}
//图片消息
	myselfImage = (type, fileId, fileName, oid, item, content, msgId, index) => {
		let messageTime;
		let tempSendTime = 0;
		let tempView;
		if (this.state.backPage == 'Message') {
			if (Platform.OS == 'ios' && typeof content.sendTime == "string" && content.sendTime.indexOf('-') != -1) {
				messageTime = content.sendTime.replace(/-/g, '/');
			} else if (Platform.OS == 'android' && typeof content.sendTime == "string" && content.sendTime.indexOf('-') != -1) {
				messageTime = ToolUtil.strToStemp(content.sendTime);
			} else {
				messageTime = content.sendTime;
			}
			//单聊消息
			tempSendTime = ToolUtil.calculateDiffTime(new Date(messageTime).getTime() / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.fromId == this.state.basic.jidNode) {
				//两分钟内
				tempView = this.optionPopView(item, 2, item.body.id, true, false, true);
			} else {
				//发送时间大于两分钟
				tempView = this.optionPopView(item, 2, item.body.id, false, false, true);
			}
		} else {
			messageTime = item.body.basic.sendTime;
			//群聊消息
			tempSendTime = ToolUtil.calculateDiffTime(messageTime / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.userId == this.state.basic.jidNode) {
				//两分钟内
				tempView = this.optionPopView(item, 2, item.body.id, item.body.occupant.state ? false : true, false, true);
			} else {
				//发送时间大于两分钟
				tempView = this.optionPopView(item, 2, item.body.id, false, false, true);
			}
		}
		return (
			<View style={{justifyContent: 'center'}}>
				<PopoverController>
					{({openPopover, closePopover, popoverVisible, setPopoverAnchor, popoverAnchorRect}) => (
						<React.Fragment>
							{item.body.otherFlag ? (
								<Image
									ref={setPopoverAnchor}
									source={{uri: content.file[1].imageUrl}}
									style={styles.image}
								/>
							) : (
								<Image
									ref={setPopoverAnchor}
									source={{
										// uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + fileId + '&imageId=' + fileId+ '&sourceType=chatImage&jidNode='
										uri: Path.groupHeadImg + '?type=groupChat' + '&uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileInfoId=' + fileId + '&userId=' + this.state.basic.userId
									}}
									style={styles.image}
									onStartShouldSetResponder={(evt) => {
										pressInTime = new Date().getTime();
										return true;
									}}
									onResponderRelease={(evt) => {
										pressOutTime = (new Date().getTime() - pressInTime) / 1000;

										if (pressOutTime > 0.5) {
											this.setState({
												isImageShow: true,//type == 'self' ? true : false,
												isImageShowID: oid,//type == 'self' ? oid : '',
												chooseImg: Path.baseImageUrl + 'uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + fileId + '&fileName=' + fileName + '&userId=' + this.state.basic.userId
											}, () => {
												this.popObj = closePopover;
												openPopover()
											})
										} else {
											this.setState({
												// showImageUrl: Path.baseImageUrl +'?uuid=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName,
												imgModalVisible: true,
												chooseImgId: keyCode[fileId],
												isImageShow: false,
												isImageShowID: ''
												//msgImgList:this.state.msgImgList.push({uri:Path.baseImageUrl +'?uuid=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + body.content.file[0].listFileInfo[0].id + '&fileName=' + body.content.file[0].listFileInfo[0].fileName})
											})
										}
									}}
								/>
							)}
							{this.state.isShowIcon && index == this.state.isFailPosition ? (
								<View style={{
									height: 100,
									width: 100,
									backgroundColor: 'rgba(0,0,0,0.6)',
									position: 'absolute',
									justifyContent: 'center',
									alignItems: 'center',
									left: 4,
									borderRadius: 4
								}}>
									<SimpleLineIcons name={'exclamation'} size={22} color={'#eb4d4b'}/>
									<Text style={{color: '#eb4d4b', marginTop: 5}}>{'发送失败'}</Text>
								</View>
							) : item.body.otherFlag ? (
								<View style={{
									height: 100,
									width: 100,
									backgroundColor: 'rgba(0,0,0,0.6)',
									position: 'absolute',
									justifyContent: 'center',
									left: 4,
									borderRadius: 4
								}}>
									<ActivityIndicator
										animating={true}
										style={[styles.centering, {height: 44}]}
										size="small"
										color='#d4d4d4'
									/>
								</View>
							) : null
							}
							{/*{this.state.isImageShow && this.state.isImageShowID == oid ? tempView : null}*/}
							<Popover
								contentStyle={styles.content}
								arrowStyle={styles.arrow}
								backgroundStyle={styles.background}
								useNativeDriver={true}
								visible={popoverVisible}
								placement={'top'}
								onClose={closePopover}
								fromRect={popoverAnchorRect}
								supportedOrientations={['portrait', 'landscape']}
							>
								{tempView}
							</Popover>
						</React.Fragment>
					)}
				</PopoverController>
			</View>
		)
	};
//文件预览
	viewfile = (file) => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
		this.setState({
			viewFile: file
		}, () => {
			this.setState({fileAnimating: true}, () => {
				if (Platform.OS == 'ios') {
					this.refs.bottomMenu._changeMenuShow(true);
					this.refs.bottomMenu._changeFirMenuShow(true);
					this.refs.bottomMenu._changeSecMenuShow(false);
				} else {
					//Android
					let showFileType = fileTypeReturn.getOtherFileType(file.fileName);
					if (showFileType != 'file') {
						//其他类型直接弹出第三方打开
						// this._useOtherOpenFile(file);
						this.refs.bottomMenu._changeMenuShow(true);
						this.refs.bottomMenu._changeFirMenuShow(false);
						this.refs.bottomMenu._changeSecMenuShow(true);
					} else {
						this.refs.bottomMenu._changeMenuShow(true);
						this.refs.bottomMenu._changeFirMenuShow(true);
						this.refs.bottomMenu._changeSecMenuShow(true);
					}
				}
				this.setState({fileAnimating: false});
			});
		});
	};

	_useLocalOpenFile = (file) => {
		if (Platform.OS == 'ios') {
			// DeviceEventEmitter.emit('changeLoading', 'true');
			OpenFile.openDocBinaryinUrl([{
				url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)) + '&type=file' + '&userId=' + this.state.basic.userId,
				fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				fileType: file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length)
			}], (error, url) => {
				//DeviceEventEmitter.emit('changeLoading', 'false');
			})
		} else {
			this.setState({
				pdfInsideModalVisible: true,
				source: {
					uri: Path.viewFile + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&suffix=' + file.fileName,
					cache: false
				}//pdf
			}, () => {
				this.setState({
					pdfModalVisible: true,
					tempViewFileSize: file.filesize,
				}, () => {
					this.refs.bottomMenu._changeMenuShow(false);
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(false);
				})
			})
		}

	}
	//调起选择其他程序
	_useOtherOpenFile = (file) => {
		if (Platform.OS == 'ios') {
			XMPP.openFileToOtherApp({
				'fileUrl': Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)),
				'fileName': file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				'fileType': file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length),
			}, (event, error) => {
				alert(event)
			})
		} else {
			OpenFile.openDocBinaryinUrl([{
				url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)),
				fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				fileType: file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length),
				cache: true
			}], (error, url) => {
				if (error) {
					this.setState({animating: false}, () => {
						this.refs.bottomMenu._changeMenuShow(false);
						this.refs.bottomMenu._changeFirMenuShow(false);
						this.refs.bottomMenu._changeSecMenuShow(false);
					});
				} else {
					this.setState({animating: false}, () => {
						this.refs.bottomMenu._changeMenuShow(false);
						this.refs.bottomMenu._changeFirMenuShow(false);
						this.refs.bottomMenu._changeSecMenuShow(false);
					});
				}
			})
		}
	}
//文件消息
	myselfFile = (type, file, item, oid, msgId) => {
		let tempSendTime = 0;
		let tempView;
		let messageTime;

		if (this.state.backPage == 'Message') {
			if (Platform.OS == 'ios' && typeof item.body.content.sendTime == "string" && item.body.content.sendTime.indexOf('-') != -1) {
				messageTime = item.body.content.sendTime.replace(/-/g, '/');
			} else if (Platform.OS == 'android' && typeof item.body.content.sendTime == "string" && item.body.content.sendTime.indexOf('-') != -1) {
				messageTime = ToolUtil.strToStemp(item.body.content.sendTime);
			} else {
				messageTime = item.body.content.sendTime;
			}
			//单聊消息
			tempSendTime = ToolUtil.calculateDiffTime(new Date(messageTime).getTime() / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.fromId == this.state.basic.jidNode) {
				//两分钟内
				tempView = this.optionPopView(item, 2, item.body.id, true, false, true);
			} else {
				//发送时间大于两分钟
				tempView = this.optionPopView(item, 2, item.body.id, false, false, true);
			}
		} else {
			messageTime = item.body.basic.sendTime;
			//群聊消息
			tempSendTime = ToolUtil.calculateDiffTime(messageTime / 1000, new Date().getTime() / 1000);
			if (tempSendTime < 2 && item.body.basic.userId == this.state.basic.jidNode) {
				//两分钟内
				tempView = this.optionPopView(item, 2, item.body.id, item.body.occupant.state ? false : true, false, true);
			} else {
				//发送时间大于两分钟
				tempView = this.optionPopView(item, 2, item.body.id, false, false, true);
			}
		}
		return (
			<View style={{justifyContent: 'center'}}>
				<PopoverController>
					{({openPopover, closePopover, popoverVisible, setPopoverAnchor, popoverAnchorRect}) => (
						<React.Fragment>
							<View ref={setPopoverAnchor} style={styles.fileView}
								  onStartShouldSetResponder={(evt) => {
									  pressInTime = new Date().getTime();
									  return true;
								  }}
								  onResponderRelease={(evt) => {
									  pressOutTime = (new Date().getTime() - pressInTime) / 1000;

									  if (pressOutTime > 0.5) {
										  this.setState({
											  choosedItem: item
										  }, () => {
											  this.popObj = closePopover;
											  openPopover()
										  });
									  } else {
										  //文件预览方法
										  // if (Platform.OS == 'ios') {
										  this.viewfile(file);
										  // }
									  }
								  }}
							>
								<View style={{
									marginRight: 10,
									justifyContent: 'center',
									alignItems: 'center'
								}}>{fileTypeReturn.fileTypeSelect(file.fileName)}</View>
								<View style={{flex: 1, justifyContent: 'center'}}>
									<Text numberOfLines={1}
										  style={{
											  fontSize: 15,
											  color: '#333',
											  textAlign: 'left',
											  marginBottom: 3
										  }}>{file.fileName}</Text>
									<Text style={{
										fontSize: 10,
										color: '#777',
										textAlign: 'left'
									}}>{ToolUtil.getFileSize(file.filesize)}</Text>
								</View>
							</View>
							{/*{this.state.isFileShowID == oid && this.state.isFileShow ? tempView : null}*/}
							<Popover
								contentStyle={styles.content}
								arrowStyle={styles.arrow}
								backgroundStyle={styles.background}
								useNativeDriver={true}
								visible={popoverVisible}
								placement={'top'}
								onClose={closePopover}
								fromRect={popoverAnchorRect}
								supportedOrientations={['portrait', 'landscape']}
							>
								{tempView}
							</Popover>
						</React.Fragment>
					)}
				</PopoverController>
			</View>
		)
	};

	/** 验证四中类型消息*/
	checkingAnnounce = (body) => {
		let url = Path.checkingAnnounce + '?bodyId=' + body.id + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&jidNode=' + this.state.basic.jidNode;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {

			if (responseJson == 'tip') {
				this.refs.toast.show('网络错误，获取公告失败');
			} else if (responseJson.data != null && responseJson.data != 'null') {
				this.props.navigation.navigate('GroupNotice', {
					noticeId: body.id,
					ticket: this.state.ticket,
					uuid: this.state.uuid,
					room: this.state.room,
					basic: this.state.basic,
					chatComeNotice: true
				});
			} else {
				this.refs.toast.show('该公告已被删除', DURATION.LENGTH_SHORT);
			}
		})
	}

	checkingActivity = (body) => {
		let url = Path.checkingActivity + '?activeId=' + body.activityId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&jidNode=' + this.state.basic.jidNode;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {

			if (responseJson == 'tip') {
				this.refs.toast.show('网络错误，获取活动失败');
			} else if (responseJson.data.status == 'Success') {
				this.props.navigation.navigate('ActivityDetails', {
					activityId: body.activityId,
					ticket: this.state.ticket,
					uuid: this.state.uuid,
					room: this.state.room,
					basic: this.state.basic,
				});
			} else {
				this.refs.toast.show('该活动已被删除', DURATION.LENGTH_SHORT);
			}
		})
	}

	checkingVote = (body) => {
		let url = Path.checkingVote;
		let bodyObj = {
			'voteId': body.voteId,
			'jidNode': this.state.basic.jidNode
		};
		FetchUtil.netUtil(url, bodyObj, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, (responseJson) => {

			if (responseJson == 'tip') {
				this.refs.toast.show('网络错误，获取投票失败');
			} else if (responseJson.data.status == 'Success') {
				let params = {
					roomJid: this.state.room.roomJid,
					occupantJid: Global.loginUserInfo.jidNode,
					ticket: Global.basicParam.ticket,
					uuId: Global.basicParam.uuId,
					userId: Global.basicParam.userId,
				};
				FetchUtil.netUtil(Path.getAffiliation + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (res) => {
					if (res.code.toString() == '200') {
						this.props.navigation.navigate('VoteDetail', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
							voteId: body.voteId,
							affiliation: res.data.affiliation
						});
					}
				});
			} else {
				this.refs.toast.show('该投票已被删除', DURATION.LENGTH_SHORT);
			}
		})
	}

	checkingTopic = (body) => {
		let url = Path.checkingTopic + '?topicId=' + body.topicId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {

			if (responseJson == 'tip') {
				this.refs.toast.show('网络错误，获取话题失败');
			} else if (responseJson.data.status == 'Success') {
				this.props.navigation.navigate('TopicDetail', {
					ticket: this.state.ticket,
					uuid: this.state.uuid,
					room: this.state.room,
					basic: this.state.basic,
					topicId: body.topicId
				});
			} else {
				this.refs.toast.show('该话题已被删除', DURATION.LENGTH_SHORT);
			}
		})
	}

//公告消息
	myselfAnnounce = (body) => {
		let title = body.content.title;
		return (
			<TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.checkingAnnounce(body)
					}
				)
			}} style={[styles.fileView, styles.chatFileView]}>
				<View style={styles.chatFileViewTop}>
					<Image source={require('../../images/chat_type/notice.png')}
						   style={styles.chatFileViewImg}/>
					<Text numberOfLines={1} style={styles.chatFileViewText}>{title}</Text>
				</View>
				<View style={styles.chatFileViewBottom}>
					<Text style={styles.chatFileViewTypeTxt}>公告</Text>
				</View>
			</TouchableOpacity>
		)
	};
//活动消息
	myselfActivity = (body) => {
		let title = body.content.title;
		return (
			<TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.checkingActivity(body)
					}
				)
			}} style={[styles.fileView, styles.chatFileView]}>
				<View style={styles.chatFileViewTop}>
					<Image source={require('../../images/chat_type/activity.png')}
						   style={styles.chatFileViewImg}/>
					<Text numberOfLines={1} style={styles.chatFileViewText}>{title}</Text>
				</View>
				<View style={styles.chatFileViewBottom}>
					<Text style={styles.chatFileViewTypeTxt}>活动</Text>
				</View>
			</TouchableOpacity>
		)
	};
//投票消息
	myselfVote = (body) => {
		let title = body.content.title;
		return (
			<TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.checkingVote(body)
					}
				)
			}} style={[styles.fileView, styles.chatFileView]}>
				<View style={styles.chatFileViewTop}>
					<Image source={require('../../images/chat_type/vote.png')}
						   style={styles.chatFileViewImg}/>
					<Text numberOfLines={1} style={styles.chatFileViewText}>{title}</Text>
				</View>
				<View style={styles.chatFileViewBottom}>
					<Text style={styles.chatFileViewTypeTxt}>投票</Text>
				</View>
			</TouchableOpacity>
		)
	};
//话题样式
	myselfTopic = (body) => {

		let title = body.content.title;
		return (
			<TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.checkingTopic(body)
					}
				)
			}} style={[styles.fileView, styles.chatFileView]}>
				<View style={styles.chatFileViewTop}>
					<Image source={require('../../images/chat_type/discuss.png')}
						   style={styles.chatFileViewImg}/>
					<Text numberOfLines={1} style={styles.chatFileViewText}>{title}</Text>
				</View>
				<View style={styles.chatFileViewBottom}>
					<Text style={styles.chatFileViewTypeTxt}>话题</Text>
				</View>
			</TouchableOpacity>
		)
	};

//消息样式
	myselfView(type, body, index, item) {
		let tempViewBox;
		let tempUserId = '';
		/**
		 *  头像判断
		 */
		if (this.state.backPage == 'Message') {
			if (Global.personnel_photoId[body.basic.fromId]) {
				tempUserId = '&imageName=' + Global.personnel_photoId[body.basic.fromId] + '&imageId=' + Global.personnel_photoId[body.basic.fromId] + '&sourceType=singleImage&jidNode='
			} else {
				tempUserId = '&imageName=' + this.state.friendDetail.photoId + '&imageId=' + this.state.friendDetail.photoId + '&sourceType=singleImage&jidNode='
			}
		} else {
			// ('群聊头像');
			if (Global.personnel_photoId[body.basic.userId]) {
				tempUserId = '&imageName=' + Global.personnel_photoId[body.basic.userId] + '&imageId=' + Global.personnel_photoId[body.basic.userId] + '&sourceType=singleImage&jidNode='
			} else {
				tempUserId = '&imageName=' + '' + '&imageId=' + '' + '&sourceType=singleImage&jidNode=' + body.basic.userId + '&headPhotoNum=' + Global.headPhotoNum
			}
		}
		/**
		 *  页面类型判断
		 */
		let childView = null;
		// if (typeof body.type == 'string' || typeof body.type == 'number') {
		// 	body.type = body.type.toString();
		if (!body.basic.type || (body.basic.type && body.basic.type == 'groupChat') || (body.basic.type && body.basic.type == 'privateChat')) {
			if ((body.type + '') == '0' || (body.type + '') == '3') {
				//文本+撤回
				childView = this.myselfText(type, body.content, body.id, item, item.body.id);
			} else if (body.type == '2') {
				let tempShowPic = FileType.getfileType(body.content.file[0].listFileInfo[0].fileName);
				//文件类型
				switch (tempShowPic) {
					case 'img': {
						//图片
						childView = this.myselfImage(type, body.content.file[0].listFileInfo[0].id, body.content.file[0].listFileInfo[0].fileName, body.id, item, body.content, item.body.id, index);
						break;
					}
					case 'audio': {
						//语音
						childView = this.myselfAudio(type, body.content.file[0].listFileInfo[0].id, body.soundTime, body.id, body.content, item);
						break;
					}
					default: {
						//附件
						childView = this.myselfFile(type, body.content.file[0].listFileInfo[0], item, body.id, item.body.id);
					}
				}
			}
		} else if (body.basic.type) {
			if (body.basic.type == 'announcement') {
				//公告
				childView = this.myselfAnnounce(body);
			} else if (body.basic.type == 'vote') {
				//投票
				childView = this.myselfVote(body);
			} else if (body.basic.type == 'topic') {
				//话题
				childView = this.myselfTopic(body);
			} else if (body.basic.type == 'activity') {
				//活动
				childView = this.myselfActivity(body);
			} else {
				this.myselfText(type, JSON.stringify(body.content.text), body.id)
			}
		}
		// }
		/**
		 *  页面布局
		 */
		tempViewBox = (
			<View key={index} style={[styles.sendTypeView, {
				justifyContent: type == 'self' ? 'flex-end' : 'flex-start',
			}]}>
				{
					type == 'other' ?
						<TouchableWithoutFeedback style={{width: 37, justifyContent: 'flex-start'}} onPress={() => {
							HandlerOnceTap(
								() => {
									this.props.navigation.navigate('FriendDetail', {
										'ticket': this.state.ticket,
										'basic': this.state.basic,
										'uuid': this.state.uuid,
										'friendJidNode': this.state.backPage == 'Message' ? this.state.friendDetail.jidNode : body.basic.userId,
										'tigRosterStatus': 'both',
										'stepType': 'back'
									})
								}
							)
						}}>
							<Image
								cache='reload'
								source={{
									uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + tempUserId
								}}
								style={styles.headTop}/>
						</TouchableWithoutFeedback>
						: null
				}
				<View
					style={[
						(type == 'other' ? {alignItems: 'flex-start',} : {//paddingRight: 110
							alignItems: 'flex-end',
							//paddingLeft: 110
						}),
						{width: width * 0.75}
					]}
				>
					<Text style={{fontSize: 12, color: '#666', marginBottom: 4}}>
						{body.basic.userName}
					</Text>
					{childView}
				</View>
				{
					type == 'self' ?
						<View>
							<Image
								source={{
									uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + ('&imageName=' + this.state.basic.photoId + '&imageId=' + this.state.basic.photoId + '&sourceType=singleImage&jidNode=' + this.state.basic.jidNode + '&platform=' + Platform.OS)
								}}
								style={styles.headTop}/>
						</View>
						: null
				}
			</View>
		)
		return tempViewBox;
	};

//悬浮选项样式
	optionPopView = (item, type, msgId, showRefBtn, showCopyBtn, showForwardBtn) => {
		let popView = (
			<View style={{flexDirection: 'row'}}>
				{showRefBtn ? (
					<TouchableOpacity
						onPress={() => {
							HandlerOnceTap(
								() => {
									this.setState({
										TranspondMemberType: false,
										TranspondMemberItem: item,//content
										tempMsgType: type
									}, () => {
										this.popObj();
										if (item.body.type != 3) {
											this._refuseMsg(msgId, item, type);
										} else {
											this.setState({
												showAlert: true,//alert框
												tipMsg: '无法再次撤回'//alert提示信息
											});
											// this.refs.toast.show('无法再次撤回', DURATION.LENGTH_SHORT);
										}
									})
								}
							)
						}} style={{flex: 1}}>
						<Text style={styles.fileListText}>撤回</Text>
					</TouchableOpacity>
				) : null}
				{showCopyBtn ? (
					<TouchableOpacity
						onPress={() => {
							HandlerOnceTap(
								() => {
									this.setState({
										TranspondMemberType: false,
										TranspondMemberItem: item,//content
										tempMsgType: type,
										text: item.body.content.interceptText
									}, () => {
										this.popObj();
										this.textInputBox.onFocusText();
									})
								}
							)
						}}
						style={[{flex: 1, justifyContent: 'center'}, showRefBtn ? {
							borderLeftWidth: 1,
							borderLeftColor: '#fff'
						} : null]}>
						<Text style={styles.fileListText}>复制</Text>
					</TouchableOpacity>
				) : null}
				{showForwardBtn ? (
					<TouchableOpacity
						onPress={() => {
							HandlerOnceTap(
								() => {
									this.setState({
										TranspondMemberType: true,
										TranspondMemberItem: item,//content
										tempMsgType: type
									}, () => {
										this.popObj();
									})
								}
							)
						}}
						style={[{flex: 1, justifyContent: 'center'}, showCopyBtn || showRefBtn ? {
							borderLeftWidth: 1,
							borderLeftColor: '#fff'
						} : null]}>
						<Text style={styles.fileListText}>转发</Text>
					</TouchableOpacity>
				) : null}
			</View>
		);
		return popView;
	}

//获取光标位置
	_getSelection = (event) => {
		currentSelectPostion = event.nativeEvent.selection.start;
	};

	/**
	 * 页面渲染
	 *
	 * */
	_renderItemsforScrollView = ({item, index}) => {
		let resultView = null;
		let bodyId = '';
		let body = typeof item.body == 'string' ? JSON.parse(item.body) : item.body;
		item.body = body;
		if (item.time) {
			resultView = this.timeView(new Date().getTime(), item.time);
		} else {
			// let sendType = '';
			// if (body.basic.fromId == this.state.basic.jidNode) {
			// 	sendType = 'to';
			// } else {
			// 	sendType = item.sendType;
			// }
			if (this.state.backPage == 'Message') {
				//判断消息是不是自己发的
				if (body.basic.fromId == this.state.basic.jidNode) {
					resultView = this.myselfView('self', body, index, item);
				} else {
					resultView = this.myselfView('other', body, index, item);
				}
			} else {
				//群聊
				if (this.state.basic.jidNode == item.body.basic.userId) {
					resultView = this.myselfView('self', body, index, item);
				} else {
					resultView = this.myselfView('other', body, index, item);
				}
			}
		}
		return (
			<TouchableWithoutFeedback key={index} onPress={() => {
				this.setState({
					panelMark: false,
					emojiMark: false
				})
			}}>
				{resultView}
			</TouchableWithoutFeedback>
		)
	};
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

//render处理 end
	render() {
		const {showAlert, tipMsg} = this.state;
		tempTime = 0;
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
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Modal
					visible={this.state.imgModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'none'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						this.setState({imgModalVisible: false, animatingOther: false})
					}}
				>
					<View style={{flex: 1}}>
						<ImageViewer
							style={{width: width, height: height}}
							imageUrls={this.state.msgImgList} // 照片路径this.state.msgImgList
							enableImageZoom={true} // 是否开启手势缩放
							index={this.state.chooseImgId} // 初始显示第几张this.state.msgImgList.length
							flipThreshold={10}
							maxOverflow={0}
							onClick={() => { // 图片单击事件
								this.setState({imgModalVisible: false, animatingOther: false})
							}}
							enablePreload={true}//开启预加载
							loadingRender={() => <View
								style={{width: width, height: height, justifyContent: 'center', alignItems: 'center'}}>
								<Image source={require('../../images/loading.png')}/>
							</View>}
							onLongPress={null}
							backgroundColor={'#000'}
						/>
					</View>
				</Modal>
				<Modal
					visible={this.state.pdfModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'none'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						this.setState({pdfModalVisible: false})
					}}
				>
					<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'}}>
						{Platform.OS == 'android' ? <Pdf
							source={this.state.source}
							onLoadComplete={(numberOfPages, filePath) => {
								this.setState({
									pdfInsideModalVisible: false
								})
							}}
							onPageChanged={(page, numberOfPages) => {
							}}
							onError={(error) => {
								this.setState({pdfInsideModalVisible: false, showAlert: true, tipMsg: '文件预览失败'});
							}}
							enablePaging={false}
							onPageSingleTap={() => {
								this.setState({pdfModalVisible: false})
							}}
							activityIndicator={() => {
								return null;
							}}
							style={{flex: 1}}/> : null}

					</View>
				</Modal>
				<Modal
					visible={this.state.pdfInsideModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'none'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						// this.setState({pdfModalVisible: false})
					}}
				>
					<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
						<ActivityIndicator
							animating={this.state.animating}
							size="large"
							color='rgba(76,122,238,1)'
						/>
					</View>
				</Modal>
				<BottomMenu
					ref={'bottomMenu'}
					isShow={this.state.chooseShowModalVisible}
					menuTitle={'请选择打开方式'}
					firstMenuFunc={
						() => {
							HandlerOnceTap(this._useLocalOpenFile(this.state.viewFile))
						}}
					firstTitle={'应用内部打开'}
					secondMenuFunc={
						() => {
							HandlerOnceTap(this._useOtherOpenFile(this.state.viewFile))
						}}
					secondTitle={'第三方应用打开'}
					downloadFunc={() => {
						this._downloadFile(this.state.viewFile)
					}}
				/>
				<Header
					ref={'chatHeader'}
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					headRightFlag={true}
					rightItemImage={require('../../images/icon_pathMenu_more_normal.png')}
					onPressRightBtn={() => {
						HandlerOnceTap(this.moreDetail)
					}}
					title={this.state.backPage == 'Group' ? this.state.room.roomName : this.state.friendDetail.trueName}
					number={this.state.backPage == 'Group' ? (this.state.memberNumber > 99 ? '99+' : this.state.memberNumber) : null}
				/>

				{/* imui 部分 start */}
				<MessageListView style={this.state.messageListLayout}
								 ref="MessageList"
								 isAllowPullToRefresh={true}
								 isShowDisplayName={true}
								 onAvatarClick={this.onAvatarClick}
								 onMsgClick={this.onMsgClick}
								 onStatusViewClick={this.onStatusViewClick}
								 onTouchMsgList={this.onTouchMsgList}
								 onTapMessageCell={this.onTapMessageCell}
								 onBeginDragMessageList={this.onBeginDragMessageList}
								 onPullToRefresh={this.onPullToRefresh}
								 avatarSize={{width: 40, height: 40}}
								 avatarCornerRadius={40}
								 messageListBackgroundColor={"#f9f9f9"}
								 sendBubbleTextSize={15}
								 sendBubbleTextColor={"#333333"}
								 sendBubblePadding={{left: 10, top: 10, right: 15, bottom: 10}}
								 datePadding={{left: 5, top: 3, right: 5, bottom: 3}}
								 dateBackgroundColor={"#dfe4ea"}
								 photoMessageRadius={5}
								 maxBubbleWidth={0.7}
								 videoDurationTextColor={"#ffffff"}
				/>
				<InputView style={this.state.inputViewLayout}
						   ref="ChatInput"
						   onSendText={this.onSendText}
						   onTakePicture={this.onTakePicture}
						   onStartRecordVoice={this.onStartRecordVoice}
						   onFinishRecordVoice={this.onFinishRecordVoice}
						   onCancelRecordVoice={this.onCancelRecordVoice}
						   onStartRecordVideo={this.onStartRecordVideo}
						   onFinishRecordVideo={this.onFinishRecordVideo}
						   onSendGalleryFiles={this.onSendGalleryFiles}
						   onSwitchToEmojiMode={this.onSwitchToEmojiMode}
						   onSwitchToMicrophoneMode={this.onSwitchToMicrophoneMode}
						   onSwitchToGalleryMode={this.onSwitchToGalleryMode}
						   onSwitchToCameraMode={this.onSwitchToCameraMode}
						   onShowKeyboard={this.onShowKeyboard}
						   onTouchEditText={this.onTouchEditText}
						   onFullScreen={this.onFullScreen}
						   onRecoverScreen={this.onRecoverScreen}
						   onSizeChange={this.onInputViewSizeChange}
						   closeCamera={this.onCloseCamera}
						   switchCameraMode={this.switchCameraMode}
						   showSelectAlbumBtn={true}
						   showRecordVideoBtn={false}
						   onClickSelectAlbum={this.onClickSelectAlbum}
						   inputPadding={{left: 30, top: 10, right: 10, bottom: 10}}
						   galleryScale={0.6}//default = 0.5
						   compressionQuality={0.6}
						   cameraQuality={0.7}//default = 0.5
						   customLayoutItems={{
							   left: [],
							   right: ['send'],
							   bottom: ['voice', 'gallery', 'emoji', 'camera']
						   }}
				/>
				{/* imui 部分 end */}

				{/*<FlatList
					style={{backgroundColor: '#F9F9F9'}}
					ref={(flatList) => {
						this._scrollView = flatList;
					}}
					keyExtractor={(item, index) => String(index)}
					data={this.state.data}
					renderItem={this._renderItemsforScrollView}
					ListHeaderComponent={() => {
						if ((this.state.nowPageNum == this.state.totalPage) && this.state.data.length > 0) {
							return (<View style={styles.footer}>
								<Text style={styles.footerText}>
									{'没有更多了'}
								</Text>
							</View>)
						} else {
							return null;
						}
					}}
					ItemSeparatorComponent={() => <View style={styles.separator}></View>}
					automaticallyAdjustContentInsets={true}
					refreshControl={
						<RefreshControl
							refreshing={this.state.isRefreshing}
							enabled={this.state.refreshFlag}
							onRefresh={() => {
								this._onRefresh()
							}}
							colors={['#278EEE']}
							progressBackgroundColor="#ffffff"
						/>
					}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					onContentSizeChange={(contentWidth, contentHeight) => {
						if (this.state.isNewMsg || this.state.nowPageNum == 1) {
							this._scrollView.scrollToEnd({animated: true})
						}
						// else {
						// 	let size = this.state.backPage == 'Message' ? Path.pageSize : Path.pageSizeNew;
						// 	this._scrollView.scrollToOffset({animated: true, offset: 0});//contentHeight - scrollViewHeight - (height / size)
						// }
						// scrollViewHeight = contentHeight;
					}}
					onScrollBeginDrag={() => {
						this.popObj()
					}}
				/>*/}
				{
					this.state.isAudioBoxShow ? <View style={styles.audioStartBox}>
						<Image
							source={require('../../images/icon_voices1.png')}
							style={styles.audioStartImg}
						/>
						<ImageBackground source={require('../../images/icon_voices2.png')}
										 style={{flex: 1, height: 120}}>
							<Animated.View
								style={{backgroundColor: '#747d8c', height: this.state.voiceHeight}}></Animated.View>
						</ImageBackground>
					</View> : null
				}
				<this.renderOptionPanel/>
				<this.renderEmojiPanel/>
				{
					this.state.AtMemberType && this.state.backPage == 'Group' ? <AtMember
						cencalAtMember={() => {
							this.setState({
								AtMemberType: false
							});
						}}
						stateText={(txt, jidArr) => this.stateText(txt, jidArr)}
						uuid={uuid}
						ticket={this.state.ticket}
						basic={this.state.basic}
						room={this.state.room}
					/> : null
				}
				{
					this.state.TranspondMemberType ? <TranspondMember
						cencalTranspondMember={() => {
							this.setState({
								TranspondMemberType: false
							});
						}}
						getFriendNowID={(info, item) => this.getFriendNowID(info, item)}
						uuid={uuid}
						ticket={this.state.ticket}
						friendDetail={this.state.friendDetail}
						basic={this.state.basic}
						TranspondMemberItem={this.state.TranspondMemberItem}
						msgType={this.state.tempMsgType}
					/> : null
				}
			</View>
		)
	};

	renderOptionPanel = () => {
		if (this.state.panelMark) {
			// this._scrollView.scrollToIndex({animated:true,index:this.state.data.length-1,viewPosition: 0});
			return (
				<Vieww
					style={{marginBottom: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 34 : 0) : 0}}><BottomPanel
					style={{height: 300}} imageDidClick={this.uploadImages}
					cameraDidClick={() => {
						if (Platform.OS == 'android') {
							this.cameraUploadImage();
						} else {
							this.cameraUploadImage();
						}
					}}
					fileDidClick={this.uploadFiles}/></Vieww>
			)
		} else {
			return null;
		}
	}
	renderEmojiPanel = () => {
		if (this.state.emojiMark) {
			// this._scrollView.scrollToIndex({animated:true,index:this.state.data.length-1,viewPosition: 0});
			return (
				<View style={{
					justifyContent: 'center',
					alignItems: 'center',
					height: 200,
					marginBottom: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 34 : 0) : 0
				}}>
					<GridView
						itemDimension={width / 11}
						spacing={11}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						items={[
							'grin', 'joy', 'smiley', 'smile', 'sweat_smile', 'laughing', 'innocent', 'smiling_imp',
							'wink', 'grinning', 'blush', 'yum', 'relieved', 'heart_eyes', 'sunglasses', 'smirk',
							'neutral_face', 'expressionless', 'unamused', 'sweat', 'pensive', 'confused', 'confounded', 'sleeping',
							'kissing_heart', 'kissing_smiling_eyes', 'stuck_out_tongue', 'stuck_out_tongue_winking_eye', 'stuck_out_tongue_closed_eyes', 'disappointed', 'worried', 'angry',
							'rage', 'cry', 'triumph', 'disappointed_relieved', 'grimacing', 'sob', 'scream', 'astonished',
							'flushed', 'mask', 'slightly_smiling_face', 'slightly_frowning_face', 'face_with_rolling_eyes', 'relaxed', 'fist', 'v',
							'ok_hand', '+1', '-1', 'clap', 'sunny', 'cloud', 'chicken', 'beetle'
						]}
						style={{backgroundColor: '#FFFFFF', opacity: 1}}
						renderItem={(data, i) => {
							return (
								<TouchableWithoutFeedback onPress={() => {
									let tempMsg = JSON.parse(JSON.stringify(this.state.messageBody));
									tempMsg.id = UUIDUtil.getUUID();
									if (this.state.text != '') {
										let tempTextPre = this.state.text.substring(0, currentSelectPostion);
										let tempTextLas = this.state.text.substring(currentSelectPostion, this.state.text.length);
										tempMsg.content.text = tempTextPre + `[${EmojiUtil.getEmojiCN(data)}]` + tempTextLas;
										tempMsg.content.interceptText = tempTextPre + `[${EmojiUtil.getEmojiCN(data)}]` + tempTextLas;
										this._setText(tempTextPre + `[${EmojiUtil.getEmojiCN(data)}]` + tempTextLas);

										currentSelectPostion = currentSelectPostion + 4;//中文匹配必须是4个字符
									} else {
										tempMsg.content.text = `[${EmojiUtil.getEmojiCN(data)}]`;
										tempMsg.content.interceptText = `[${EmojiUtil.getEmojiCN(data)}]`;
										this._setText(`[${EmojiUtil.getEmojiCN(data)}]`);

										currentSelectPostion = currentSelectPostion + 4;//中文匹配必须是4个字符

									}
								}}>
									<View style={{
										justifyContent: 'center',
										alignItems: 'center',
										opacity: 1,
										height: 30
									}}>
										<ShowEmoji name={data} style={{fontSize: 22, color: 'yellow'}}/>
									</View>
								</TouchableWithoutFeedback>
							)
						}}
					/>
				</View>
			)
		} else {
			return null;
		}
	}

	stateText = (val, atItems) => {

		this.setState({
			atItems: atItems
		})

		let firstText = this.state.secText;
		let allText = this.state.text;
		let lastText = allText.substr(firstText.length);
		const value = `${firstText}${val}${lastText}`;

		this._setText(value);
		this.setState({
			AtMemberType: false,
		});
	}

	getFriendNowID = (info, item) => {
		this.setState({
			TranspondMemberType: false,
		});
		let tempitem = JSON.parse(JSON.stringify(item));
		let tempBody = typeof tempitem.body == 'string' ? JSON.parse(tempitem.body) : tempitem.body;
		let tempContent = typeof tempitem.body == 'string' ? JSON.parse(tempitem.body).content : tempitem.body.content;
		delete tempContent.sendTime;
		let reqBody = {
			stype: info.ttype == 1 ? 'sglc' : 'groupchat',//转发类型
			to: info.jid_node,//转发人jidNode
			jidNode: this.state.basic.jidNode//当前人jidNode
		};

		if (info.ttype == 1) {
			tempContent.sendTime = FormatDate.formatTimeStmpToFullTimeForSave(new Date().getTime());
		}
		let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
		let newMsgIdSingle = UUIDUtil.getUUID().replace(/\-/g, '');
		let tempMsgBody = {
			"id": info.ttype == 1 ? newMsgIdSingle : newMsgId,
			"type": this.state.tempMsgType,
			"basic": info.ttype == 1 ? {
				"toId": info.jid_node,
				"type": "privateChat",
				"fromId": this.state.basic.jidNode,
				"userId": this.state.basic.userId,
				"photoId": this.state.basic.photoId,
				"userName": this.state.basic.trueName
			} : {
				"userId": this.state.basic.jidNode,
				"userName": this.state.basic.trueName,
				"head": info.image_name,
				"sendTime": new Date().getTime(),
				"groupId": info.jid_node,
				"groupName": info.trueName,
				"type": 'groupChat'
			},
			"keyId": "privateSend00",
			"content": tempContent,
			"showTime": true,
			"occupant": {
				"state": '',
				"effect": '',
				"active": ''
			}
		};

		if (this.state.tempMsgType == 2) {
			reqBody['fileInfoId'] = tempContent.file[0].listFileInfo[0].id;//旧文件id
			FetchUtil.netUtil(Path.redirectMsg, reqBody, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				userId: this.state.basic.userId,
				ticket: this.state.ticket
			}, (res) => {
				if (res == 'tip') {
					this.refs.toast.show('网络错误，文件转发失败');
				} else if (res.code.toString() == '200' && res.status) {
					let newInfo = typeof res.data == 'string' ? JSON.parse(res.data).listFileInfo : res.data.listFileInfo;
					tempContent.file[0].listFileInfo = newInfo;//将复制后的文件对象赋值给messageBody
					this.setState({
						// backPage: info.ttype == 1 ? 'Message' : 'Group',
						messageBody: JSON.parse(JSON.stringify(tempMsgBody)),
						isNotPC: true
					}, () => {
						if (Platform.OS == 'android') {
							if (info.ttype == 1) {
								//单聊
								// XMPP.message(JSON.stringify(tempMsgBody), info.jid_node + '@'+Path.xmppDomain);
								let sendSigleMsg = XmlUtil.sendGroup('chat', info.jid_node + '@' + Path.xmppDomain, JSON.stringify(tempMsgBody), newMsgIdSingle);
								XMPP.sendStanza(sendSigleMsg);

								this._saveToDB(info.ttype, info.jid_node, info.trueName, info.image_name, '', '', '', this.state.tempMsgType == 2 ? 'file' : 'text', '', newMsgIdSingle);
							} else {
								let sendGroupMsg = XmlUtil.sendGroup('groupchat', info.jid_node + Path.xmppGroupDomain, JSON.stringify(tempMsgBody), newMsgId);
								XMPP.sendStanza(sendGroupMsg);
							}
							this.refs.toast.show('转发成功', DURATION.LENGTH_SHORT);

						} else {
							if (info.ttype == 1) {
								//单聊
								XMPP.XMPPSendMessage({
									'message': tempMsgBody,
									'friendJid': info.jid_node + '@' + Path.xmppDomain,
									'messageId': newMsgIdSingle

								})
								this.refs.toast.show('转发成功', DURATION.LENGTH_SHORT);
								this._saveToDB(info.ttype, info.jid_node, info.trueName, info.image_name, '', '', '', this.state.tempMsgType == 2 ? 'file' : 'text', '', newMsgIdSingle);

							} else {
								//ios群聊转发
								XMPP.XMPPSendGroupMessage({
										'message': tempMsgBody,
										'jid': info.jid_node,
										'uuid': newMsgId
									},
									(error, event) => {
										if (error) {
											this.setState({showAlert: true, tipMsg: error});
											// this.refs.toast.show(error, DURATION.LENGTH_SHORT);

										} else {
											this.refs.toast.show('转发成功', DURATION.LENGTH_SHORT);

										}
									}
								)
							}
						}
						if (info.ttype == 1) {
							//单聊
							this._saveToDB(info.ttype, info.jid_node, info.trueName, info.image_name, '', '', '', this.state.tempMsgType == 2 ? 'file' : 'text', '', newMsgIdSingle);

							//判断是否需要拼接页面
							if (info.jid_node == this.state.friendDetail.jidNode) {
								let tempItemObj = {
									body: JSON.stringify(this.state.messageBody),
									sendType: 'to',
									position: this.state.data.length
								};
								let tempArr = [];
								tempArr.push(tempItemObj);
								this.setState({
									data: this.state.data.concat(tempArr),
									sendMsgId: this.state.messageBody.id,
									isNewMsg: true,
									isNotPC: true
								});

								if (this.state.tempMsgType == 2 && tempContent.file[0].listFileInfo[0].showPic == 'img') {
									let imgArr = [];
									let tempBody = this.state.messageBody;
									imgArr.push({
										url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&imageId=' + tempBody.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
										// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + tempBody.content.file[0].listFileInfo[0].id + '&fileName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&type=image&userId=' + this.state.basic.userId,
									})
									keyCode[tempBody.content.file[0].listFileInfo[0].id] = this.state.msgImgList.length;
									this.setState({
										msgImgList: this.state.msgImgList.concat(imgArr)
									})
								}
							}
						}
						else {
							// this._saveToDB(info.ttype, '', '', '', info.jid_node, info.trueName, info.image_name, tempBody.messageType, this.state.basic.trueName, newMsgId);

							//判断是否需要拼接页面
							if (info.jid_node == this.state.room.roomJid) {
								let tempItemObj = {
									body: JSON.stringify(tempMsgBody),
									sendType: 'to',
									position: this.state.data.length
								};
								let tempArr = [];
								tempArr.push(tempItemObj);
								this.setState({
									data: this.state.data.concat(tempArr),
									sendMsgId: this.state.messageBody.id,
									isNewMsg: true,
									isNotPC: true
								});
								if (this.state.tempMsgType == 2 && tempContent.file[0].listFileInfo[0].showPic == 'img') {
									let imgArr = [];
									let tempBody = tempMsgBody;
									imgArr.push({
										url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&imageId=' + tempBody.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
										// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + tempBody.content.file[0].listFileInfo[0].id + '&fileName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&type=image&userId=' + this.state.basic.userId,
									})
									keyCode[tempBody.content.file[0].listFileInfo[0].id] = this.state.msgImgList.length;
									this.setState({
										msgImgList: this.state.msgImgList.concat(imgArr)
									})
								}
							}
						}
					});
				} else {
					this.setState({showAlert: true, tipMsg: '转发失败,请重试'});
				}
			})
		} else {
			this.setState({
				// backPage: info.ttype == 1 ? 'Message' : 'Group',
				messageBody: JSON.parse(JSON.stringify(tempMsgBody)),
				isNotPC: true
			}, () => {
				if (Platform.OS == 'android') {
					if (info.ttype == 1) {
						//单聊
						// XMPP.message(JSON.stringify(tempMsgBody), info.jid_node + '@'+Path.xmppDomain);
						let sendSigleMsg = XmlUtil.sendGroup('chat', info.jid_node + '@' + Path.xmppDomain, JSON.stringify(tempMsgBody), newMsgIdSingle);
						XMPP.sendStanza(sendSigleMsg);

						this._saveToDB(info.ttype, info.jid_node, info.trueName, info.image_name, '', '', '', this.state.tempMsgType == 2 ? 'file' : 'text', '', newMsgIdSingle);
					} else {
						let sendGroupMsg = XmlUtil.sendGroup('groupchat', info.jid_node + Path.xmppGroupDomain, JSON.stringify(tempMsgBody), newMsgId);
						XMPP.sendStanza(sendGroupMsg);
					}
					this.refs.toast.show('转发成功', DURATION.LENGTH_SHORT);

				} else {
					if (info.ttype == 1) {
						//单聊
						XMPP.XMPPSendMessage({
							'message': tempMsgBody,
							'friendJid': info.jid_node + '@' + Path.xmppDomain,
							'messageId': newMsgIdSingle

						})

						this._saveToDB(info.ttype, info.jid_node, info.trueName, info.image_name, '', '', '', this.state.tempMsgType == 2 ? 'file' : 'text', '', newMsgIdSingle);

					} else {
						//ios群聊转发
						XMPP.XMPPSendGroupMessage({
								'message': tempMsgBody,
								'jid': info.jid_node,
								'uuid': newMsgId
							},
							(error, event) => {
								if (error) {
									this.setState({showAlert: true, tipMsg: error});
									// this.refs.toast.show(error, DURATION.LENGTH_SHORT);

								} else {
									this.refs.toast.show('转发成功', DURATION.LENGTH_SHORT);

								}
							}
						)
					}
				}
				if (info.ttype == 1) {
					//单聊
					this._saveToDB(info.ttype, info.jid_node, info.trueName, info.image_name, '', '', '', this.state.tempMsgType == 2 ? 'file' : 'text', '', newMsgIdSingle);

					//判断是否需要拼接页面
					if (info.jid_node == this.state.friendDetail.jidNode) {
						let tempItemObj = {
							body: JSON.stringify(this.state.messageBody),
							sendType: 'to',
							position: this.state.data.length
						};
						let tempArr = [];
						tempArr.push(tempItemObj);
						this.setState({
							data: this.state.data.concat(tempArr),
							sendMsgId: this.state.messageBody.id,
							isNewMsg: true,
							isNotPC: true
						});

						if (this.state.tempMsgType == 2 && tempContent.file[0].listFileInfo[0].showPic == 'img') {
							let imgArr = [];
							let tempBody = this.state.messageBody;
							imgArr.push({
								url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&imageId=' + tempBody.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
								// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + tempBody.content.file[0].listFileInfo[0].id + '&fileName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&type=image&userId=' + this.state.basic.userId,
							})
							keyCode[tempBody.content.file[0].listFileInfo[0].id] = this.state.msgImgList.length;
							this.setState({
								msgImgList: this.state.msgImgList.concat(imgArr)
							})
						}
					}

				} else {
					// this._saveToDB(info.ttype, '', '', '', info.jid_node, info.trueName, info.image_name, tempBody.messageType, this.state.basic.trueName, newMsgId);

					//判断是否需要拼接页面
					if (info.jid_node == this.state.room.roomJid) {
						let tempItemObj = {
							body: JSON.stringify(tempMsgBody),
							sendType: 'to',
							position: this.state.data.length
						};
						let tempArr = [];
						tempArr.push(tempItemObj);
						this.setState({
							data: this.state.data.concat(tempArr),
							sendMsgId: this.state.messageBody.id,
							isNewMsg: true,
							isNotPC: true
						});
						if (this.state.tempMsgType == 2 && tempContent.file[0].listFileInfo[0].showPic == 'img') {
							let imgArr = [];
							let tempBody = tempMsgBody;
							imgArr.push({
								url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&imageId=' + tempBody.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
								// url: Path.baseImageUrl + '?uuId=' + uuid + '&ticket=' + this.state.ticket + '&fileId=' + tempBody.content.file[0].listFileInfo[0].id + '&fileName=' + tempBody.content.file[0].listFileInfo[0].fileName + '&type=image&userId=' + this.state.basic.userId,
							})
							keyCode[tempBody.content.file[0].listFileInfo[0].id] = this.state.msgImgList.length;
							this.setState({
								msgImgList: this.state.msgImgList.concat(imgArr)
							})
						}
					}
				}
			});
		}
	}

}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	sendTypeView: {
		flex: 1,
		flexDirection: 'row',
		minHeight: 80,
		paddingTop: 5,
		paddingBottom: 5,
		// marginTop: 7,
		// marginBottom: 7,
		backgroundColor: 'transparent'
		// maxWidth: width * 0.7
	},
	headTop: {
		height: 37,
		width: 37,
		marginLeft: 8,
		marginRight: 8,
	},
	image: {
		height: 100,
		width: 100,
		borderRadius: 4,
		marginLeft: 4,
		marginRight: 4,
	},
	sendTextView: {
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 3,
		paddingLeft: 7,
		paddingRight: 7,
		borderWidth: 1,
		minHeight: 37,
	},
	sendTextIcon: {
		position: 'absolute',
		top: 13,
		width: 8,
		height: 8,
		borderWidth: 1,
	},
	sendTextIconSelf: { // 自己发送的气泡小三角
		borderLeftColor: 'transparent',
		borderBottomColor: 'transparent',
		borderTopColor: '#549dff',
		borderRightColor: '#549dff',
		backgroundColor: '#549dff',
		right: 0
	},
	sendTextIconOther: { // 对方发送的气泡小三角
		borderLeftColor: '#d0d0d0',
		borderBottomColor: '#d0d0d0',
		borderTopColor: 'transparent',
		borderRightColor: 'transparent',
		backgroundColor: '#FFFFFF',
		left: 0
	},
	fileShowBox: {
		// position: 'relative',//relative absolute
		height: 0,
		top: -100,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
	},
	fileShowList: {
		flexDirection: 'row',
		backgroundColor: '#333',
		borderRadius: 4,
	},
	fileListText: {
		color: '#fff',
		padding: 7,
	},
	fileListBorder: {
		borderLeftWidth: 1,
		borderLeftColor: '#fff',
		width: 40,
		justifyContent: 'center',
	},
	fileListTip: {
		position: 'relative',
		// top: 30,
		width: 1,
		height: 1,
		borderTopWidth: 6,
		borderLeftWidth: 4,
		borderRightWidth: 4,
		borderBottomWidth: 6,
		borderTopColor: '#333',
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderBottomColor: 'transparent',
		zIndex: 999
	},
	soundWidth: {
		minWidth: 70,
		maxWidth: 150,
	},
	chatSound: {
		width: 15,
		height: 15,
	},
	fileView: {
		backgroundColor: '#ffffff',
		borderRadius: 4,
		flexDirection: 'row',
		padding: 7,
		width: 200,
		justifyContent: 'center',
		borderColor: 'rgba(0,0,0,0.1)',
		borderWidth: 1,
	},
	audioStartBox: {
		flexDirection: 'row',
		position: 'absolute',
		width: 120,
		height: 120,
		left: (width / 2) - 65,
		top: (height / 2) - 70,
		backgroundColor: '#747d8c',
	},
	audioStartImg: {
		width: 70,
		height: 120,
	},
	announcementImage: {
		width: 30,
		height: 30,
		marginRight: 8,
	},
	chatFileView: {
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'flex-start',
		padding: 0
	},
	chatFileViewTop: {
		flexDirection: 'row',
		padding: 3,
		paddingLeft: 8,
		paddingRight: 8,
		justifyContent: 'center'
	},
	chatFileViewImg: {
		width: 27,
		height: 35,
		marginRight: 8
	},
	chatFileViewText: {
		flex: 1,
		fontSize: 16,
		color: '#333',
		lineHeight: 30,
	},
	chatFileViewBottom: {
		width: 200,
		borderTopWidth: 1,
		borderTopColor: '#e5e5e5',
		padding: 2,
		paddingLeft: 8,
		paddingRight: 8
	},
	chatFileViewTypeTxt: {
		fontSize: 12,
		color: '#999',
	},
	separator: {
		height: 8,
		backgroundColor: 'transparent'
		// borderBottomWidth: 1,
		// borderBottomColor: '#ccc'
	},
	footer: {
		flexDirection: 'row',
		height: 30,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	footerText: {
		fontSize: 14,
		color: '#999'
	},
	//---
	content: {
		padding: 0,
		height: 34,
		backgroundColor: '#333333',
		borderRadius: 4,
	},
	arrow: {
		height: 30,
		borderTopColor: '#333333',
	},
	background: {
		backgroundColor: 'transparent'
	},
});
