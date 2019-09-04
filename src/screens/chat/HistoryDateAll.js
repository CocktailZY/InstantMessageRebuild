import React, {Component} from 'react';
import {
	StyleSheet,
	View,
	Platform,
	ActivityIndicator,
	Text,
	Image,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Modal, ScrollView,
	Dimensions, Alert, Animated,
	DeviceEventEmitter
} from 'react-native';
import Header from '../../component/common/Header';
import BottomMenu from '../../component/common/BottomMenu';
import FetchUtil from "../../util/FetchUtil";
import Path from "../../config/UrlConfig";
import Sound from "react-native-sound";
import ImageViewer from 'react-native-image-zoom-viewer';
import fileTypeReturn from '../../util/FileType';
import FormatDate from '../../util/FormatDate';
import EmojiUtil from '../../util/EmojiDeal';
import ShowEmoji from 'react-native-emoji';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import OpenFile from 'react-native-doc-viewer';
import RNFS from 'react-native-fs';
import Toast, {DURATION} from 'react-native-easy-toast';
import cookie from "../../util/cookie";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import HtmlUtil from '../../util/HtmlUtil';
import ToolUtil from '../../util/ToolUtil';
import Global from "../../util/Global";
import AwesomeAlert from "react-native-awesome-alerts";

import Pdf from 'react-native-pdf';

// const Pdf = Platform.select({
// 	ios: () => null,
// 	//android: () => require('react-native-pdf'),//android
// })();


let pageGo = 1, totalPage = 0, audioMic;
const {height, width} = Dimensions.get('window');
let imageKey = {};
let pressInTime, pressOutTime;
let flagAni = 0;//是否循环动画
let s;
export default class HistoryDateAll extends Component {

	constructor(props) {
		super(props);
		this.state = {
			room: !props.navigation.state.params.room ? null : props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			friendDetail : !props.navigation.state.params.friendDetail ? null : props.navigation.state.params.friendDetail,
			friendJidNode: !props.navigation.state.params.friendJidNode ? null : props.navigation.state.params.friendJidNode,//true是单聊
			day: props.navigation.state.params.day,
			dateBody: [],
			showFooter: 0,
			isAudioPlay: false,
			isModal: false,
			animating: true,
			hisImgList: [],
			hisChooseImgId: '',
			isFileShowID: '',
			isFileShow: false,
			pageGo: 1,
			fileAnimating: false,//文件预览动画
			pdfModalVisible: false,//pdf预览Modal
			pdfInsideModalVisible: false,//pdf里面的Modal
			source: {uri: '', cache: true},//pdf
			chooseShowModalVisible: false,//文件预览Modal
			viewFile: {},//被预览文件对象
			playAnimation:true,//动画状态
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	componentDidMount() {
		this._getDayHistory(this.state.pageGo);
	};

	componentWillUnmount() {
		pageGo = 1;
		if (s) {
			s.stop(() => s.release());
		}
	}

	_getDayHistory = (pageNum) => {
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			startTime: this.state.day,
			pageNum: pageNum,
			pageSize: Path.pageSize,
			// currentNum: pageNum == 1 ? 0 : (Path.pageSize * (pageNum - 1)),
			startRecently: false
		};
		let url = '';
		if (!this.state.friendJidNode) {
			params.roomName = this.state.room.roomJid + Path.xmppGroupDomain;
			url = Path.postGroupHistoryDate + ParamsDealUtil.toGetParams(params);
		} else {
			params.jidNode = this.state.basic.jidNode;
			params.buddyJidNode = this.state.friendJidNode;
			params.startTime = this.state.day + encodeURIComponent(' 00:00:00');
			params.endTime = this.state.day + encodeURIComponent(' 23:59:59');
			url = Path.postSelfHistoryDate + ParamsDealUtil.toGetParams(params);
		}
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseData) => {
			if(responseData == 'tip'){
				this.refs.toast.show('网络错误，获取历史聊天记录失败');
			} else if (responseData.code.toString() == '200') {
				let data = !this.state.friendJidNode ? responseData.data : JSON.parse(responseData.data);
				let arr = this.state.dateBody;
				totalPage = data.totalPage;
				let num = 0;
				if (pageNum >= totalPage) {
					num = 1;
				}
				this.setState({
					dateBody: arr.concat(data.recordList),
					showFooter: num
				}, () => {
					this._ImagesMap(data.recordList);
				});
			}
		});
	}

	_onEndReached = (e) => {
		let offsetY = e.nativeEvent.contentOffset.y;
		let contentSizeHeight = e.nativeEvent.contentSize.height;
		let oriageScrollHeight = e.nativeEvent.layoutMeasurement.height;
		if (Math.floor(offsetY + oriageScrollHeight) >= Math.floor(contentSizeHeight - 50)) {
			if (this.state.showFooter != 0) {
				return;
			}
			let num = this.state.pageGo;
			if (num >= totalPage) {
				return;
			} else {
				num++;
			}
			this.setState({showFooter: 2});
			//获取数据
			this.setState({pageGo: num}, () => {
				this._getDayHistory(this.state.pageGo);
			});
		}
	}

	_ImagesMap = (str) => {
		let box = this.state.hisImgList,
			imgNum = box.length;
		str.map((item) => {
			let body = !this.state.friendJidNode ? JSON.parse(item.body) : item.body;
			if (body != undefined) {
				if (body.type != undefined && body.type == 2) {
					if (body.content.file[0].listFileInfo[0].showPic == 'img') {
						imageKey[body.content.file[0].listFileInfo[0].id] = imgNum;
						imgNum++;
						box.push({
							url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + body.content.file[0].listFileInfo[0].id + '&imageId=' + body.content.file[0].listFileInfo[0].id + '&sourceType=chatImage&jidNode='
						});
					}
				}
			}
		});
		this.setState({hisImgList: box});
	}
	//文本消息
	_renderText = (type, body, item) => {
		let tempContent = body.content;//.substring(1, content.length - 1);
		let trueText = '';
		let textArr = [];
		let isEmoji = false;
		let contentText = HtmlUtil.htmlDecodeByRegExp(tempContent.interceptText);

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
									<ShowEmoji name={markEmoji} style={{fontSize: 22, color: 'yellow'}}/>
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
		return (
			<View style={{position: 'relative', justifyContent: 'center'}}>
				<View style={[{position: 'relative'}, type == 'me' ? {paddingRight: 3} : {paddingLeft: 3}]}>
					<View
						style={[styles.sendTextView, {
							flexDirection: isEmoji ? 'row' : 'column',
							backgroundColor: type == 'me' ? '#549dff' : '#fff',
							borderColor: type == 'me' ? '#549dff' : '#d0d0d0',
						}]}
					>
						{isEmoji ? (
							<Text>{textArr}</Text>
						) : (
							<Text style={{color: type == 'me' ? '#fff' : '#000', lineHeight: 20}}
							      selectable={false}>{trueText}</Text>
						)}
					</View>
					<View transform={[{rotate: '45deg'}]}
					      style={[styles.sendTextIcon, type == 'me' ? styles.sendTextIconSelf : styles.sendTextIconOther]}/>
				</View>
			</View>
		)
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
								this.setState({
									showAlert: true,//alert框
									tipMsg:'消息读取失败，请稍后再试'//alert提示信息
								});
								// this.refs.toast.show('消息读取失败，请稍后再试', DURATION.LENGTH_SHORT);
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
									this.setState({
										showAlert: true,//alert框
										tipMsg:'消息读取失败，请稍后再试'//alert提示信息
									});
									// this.refs.toast.show('消息读取失败，请稍后再试', DURATION.LENGTH_SHORT);
								}
							}
						});
					})
				}
			});
		} else {
			let url = Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileId=' + audioPath + '&type=sound' + '&userId=' + this.state.basic.userId;
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
						this.setState({
							showAlert: true,//alert框
							tipMsg:'消息读取失败，请稍后再试'//alert提示信息
						});
						// this.refs.toast.show('消息读取失败，请稍后再试', DURATION.LENGTH_SHORT);
					}
				}
			});
		}
	}
	//下载语音文件到本地
	_downloadAac = (fileId, callback) => {
		let url = Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileId=' + fileId + '&fileName=' + fileId + '&type=file' + '&userId=' + this.state.basic.userId;
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
	//语音消息
	_renderAudio = (type, value, time, item) => {
		if (item.isPlay) {
			item.isPlay.setValue(0);
		} else {
			item['isPlay'] = new Animated.Value(0);
			item.isPlay.setValue(0);
		}
		return (
			<View style={{
				position: 'relative',
				justifyContent: 'center'
			}}>
				<View style={[{position: 'relative'}, type == 'me' ? {paddingRight: 3} : {paddingLeft: 3}]}>
					<TouchableOpacity
						style={[styles.sendTextView, styles.soundWidth, {
							backgroundColor: type == 'me' ? '#549dff' : '#ffffff',
							width: time + 70,
							flexDirection: 'row',
							borderColor: type == 'me' ? '#549dff' : '#d0d0d0'
						}]}
						onPress={() => {
							this.playVoiceMessage(value, time, item);
						}}
					>
						{
							type == 'her' ? (
								<View style={{flexDirection: 'row'}}>
									<Image source={require('../../images/chat_sound_b.png')} style={styles.chatSound}/>
									<Animated.View style={{
										backgroundColor: '#FFFFFF', zIndex: 999, height: 15, right: 12, opacity: item.isPlay.interpolate({
											inputRange: [0, 0.2],
											outputRange: [0, 0.5]
										})
									}}><Text style={{color: 'transparent'}}>{'1'}</Text></Animated.View>
								</View>
							) : null
						}
						<Text style={{
							flex: 1,
							color: type == 'me' ? '#fff' : '#000',
							textAlign: type == 'me' ? 'left' : 'right'
						}}>{time}"</Text>
						{
							type == 'me' ? (
								<View style={{flexDirection: 'row'}}>
									<Animated.View style={{
										backgroundColor: '#549dff', zIndex: 999, height: 15, left: 12, opacity: item.isPlay.interpolate({
											inputRange: [0, 0.2],
											outputRange: [0, 0.5]
										})
									}}><Text style={{color: 'transparent'}}>{'1'}</Text></Animated.View>
									<Image source={require('../../images/chat_sound_m.png')} style={styles.chatSound}/>
								</View>) : null
						}
					</TouchableOpacity>
					<View transform={[{rotate: '45deg'}]}
					      style={[styles.sendTextIcon, type == 'me' ? styles.sendTextIconSelf : styles.sendTextIconOther]}/>
				</View>
			</View>
		)
	};
	startLeft = (soundTime, item) => {
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
	}
	//图片消息
	_renderImage = (type, images) => {
		return (
			<TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.setState({
							hisChooseImgId: imageKey[images.id],
							isModal: true,
						})
					}
				)
			}}>
				<Image style={styles.bodyImage}
				       source={{uri: Path.groupHeadImg + '?type=groupChat' + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileInfoId=' + images.id + '&userId=' + this.state.basic.userId}}
				/>
			</TouchableOpacity>
		)
	}
	//文件消息
	_renderFile = (type, files) => {
		return (
			<View style={{
				position: 'relative',
				justifyContent: 'center'
			}}>
				<TouchableOpacity
					style={styles.bodyFile}
					onPress={() => {
						this.viewfile(files);
					}}>
					<View style={{
						marginRight: 10,
						justifyContent: 'center',
						alignItems: 'center'
					}}>{fileTypeReturn.fileTypeSelect(files.fileName)}</View>
					<View style={styles.fileInfor}>
						<Text numberOfLines={1}
						      style={{fontSize: 15, color: '#333', textAlign: 'left', marginBottom: 3}}>{files.fileName}</Text>
						<Text style={{fontSize: 10, color: '#777', textAlign: 'left'}}>{ToolUtil.getFileSize(files.filesize)}</Text>
					</View>
				</TouchableOpacity>
			</View>
		)
	}
	//公告消息
	_renderAnnouncement = (type, title, id) => {
		return (
			<TouchableOpacity style={[styles.bodyFile, styles.historyBody]} onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('GroupNotice', {
							noticeId: id,
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}
				)
			}}>
				<View style={styles.historyBodyTop}>
					<Image source={require('../../images/chat_type/notice.png')}
					       style={styles.bodyTypeIcon}/>
					<Text numberOfLines={1} style={styles.historyBodyTopText}>{title}</Text>
				</View>
				<View style={styles.historyBodyBottom}>
					<Text style={styles.historyBodyBottomText}>公告</Text>
				</View>
			</TouchableOpacity>
		)
	}
	//活动消息
	_renderActivity = (type, title, id) => {
		return (
			<TouchableOpacity style={[styles.bodyFile, styles.historyBody]} onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('ActivityDetails', {
							activityId: id,
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}
				)
			}}>
				<View style={styles.historyBodyTop}>
					<Image source={require('../../images/chat_type/activity.png')}
					       style={styles.bodyTypeIcon}/>
					<Text numberOfLines={1} style={styles.historyBodyTopText}>{title}</Text>
				</View>
				<View style={styles.historyBodyBottom}>
					<Text style={styles.historyBodyBottomText}>活动</Text>
				</View>
			</TouchableOpacity>
		)
	}
	//投票消息
	_renderVote = (type, title, id) => {
		return (
			<TouchableOpacity style={[styles.bodyFile, styles.historyBody]} onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('VoteDetail', {
							voteId: id,
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}
				)
			}}>
				<View style={styles.historyBodyTop}>
					<Image source={require('../../images/chat_type/vote.png')}
					       style={styles.bodyTypeIcon}/>
					<Text numberOfLines={1} style={styles.historyBodyTopText}>{title}</Text>
				</View>
				<View style={styles.historyBodyBottom}>
					<Text style={styles.historyBodyBottomText}>投票</Text>
				</View>
			</TouchableOpacity>
		)
	}
	//话题消息
	_renderTopic = (type, title, id) => {
		return (
			<TouchableOpacity style={[styles.bodyFile, styles.historyBody]} onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('TopicDetail', {
							topicId: id,
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}
				)
			}}>
				<View style={styles.historyBodyTop}>
					<Image source={require('../../images/chat_type/discuss.png')}
					       style={styles.bodyTypeIcon}/>
					<Text numberOfLines={1} style={styles.historyBodyTopText}>{title}</Text>
				</View>
				<View style={styles.historyBodyBottom}>
					<Text style={styles.historyBodyBottomText}>话题</Text>
				</View>
			</TouchableOpacity>
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
						<Pdf
							source={this.state.source}
							onLoadComplete={(numberOfPages, filePath) => {
								this.setState({
									pdfInsideModalVisible: false
								})
							}}
							onPageChanged={(page, numberOfPages) => {
							}}
							onError={(error) => {
								this.setState({pdfInsideModalVisible: false})
							}}
							enablePaging={false}
							activityIndicator={() => {
								return null;
							}}
							onPageSingleTap={() => {
								this.setState({pdfModalVisible: false})
							}}
							style={{flex: 1}}/>
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
						// this.setState({pdfInsideModalVisible: false})
					}}
				>
					<View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
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
					secondMenuFunc={() => {
						HandlerOnceTap(this._useOtherOpenFile(this.state.viewFile))
					}}
					secondTitle={'第三方应用打开'}
					downloadFunc={() => {
						this._downloadFile(this.state.viewFile)
					}}
				/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						pageGo = 1;
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'聊天记录'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					style={{flex: 1}}
					onScroll={this._onEndReached}
				>
					<TouchableWithoutFeedback onPress={() => {
						HandlerOnceTap(
							() => {
								this.setState({
									isFileShow: false,
									isFileShowID: '',
								})
							}
						)
					}}>
						<View>
							{
								this.state.dateBody.map((item, index) => {
									let body = !this.state.friendJidNode ? JSON.parse(item.body) : item.body;
									if (body != undefined) {
										let itemTime = '';
										let meId = this.state.basic.jidNode;
										let type = 'her';
										let tempUserId = '';
										if (!this.state.friendJidNode) {
											//群聊
											type = meId == body.basic.userId ? 'me' : 'her';//是否本人
											if (Global.personnel_photoId[body.basic.userId]) {
												tempUserId = '&imageName=' + Global.personnel_photoId[body.basic.userId] + '&imageId=' + Global.personnel_photoId[body.basic.userId] + '&sourceType=singleImage&jidNode='
											} else {
												tempUserId = '&imageName=' + '' + '&imageId=' + '' + '&sourceType=singleImage&jidNode=' + body.basic.userId + '&headPhotoNum=' + Global.headPhotoNum
											}
											let sendTimeStr = body.basic.sendTime.toString();

											if (sendTimeStr.indexOf('-') > -1) {
												sendTimeStr = body.basic.sendTime;

											} else {
												sendTimeStr = FormatDate.formatTimeStmpToFullTimeForSave(body.basic.sendTime).replace(/\^/g, ' ');
											}

											itemTime = sendTimeStr.split(' ')[1].substring(0, 5);

										} else {
											//单聊
											type = meId == body.basic.fromId ? 'me' : 'her';//是否本人
											if (Global.personnel_photoId[body.basic.fromId]) {
												tempUserId = '&imageName=' + Global.personnel_photoId[body.basic.fromId] + '&imageId=' + Global.personnel_photoId[body.basic.fromId] + '&sourceType=singleImage&jidNode='
											} else {
												tempUserId = '&imageName=' + this.state.friendDetail.photoId + '&imageId=' + this.state.friendDetail.photoId + '&sourceType=singleImage&jidNode='
											}
										}
										return (
											<View key={index}
											      style={[styles.bodyContainer, {
												      justifyContent: type == 'her' ? 'flex-start' : 'flex-end',
												      marginLeft: type == 'me' ? 150 : 0,
												      marginRight: type == 'her' ? 150 : 0,
											      }]}>
												{
													type == 'her' ? <TouchableWithoutFeedback onPress={() => {
														HandlerOnceTap(
															() => {
																this.props.navigation.navigate('FriendDetail', {
																	'ticket': this.state.ticket,
																	'basic': this.state.basic,
																	'uuid': this.state.uuid,
																	'friendJidNode': (body.basic.type == 'groupChat' ? body.basic.userId : body.basic.fromId),
																	'tigRosterStatus': 'both',//之后不一定是好友
																	'stepType': 'back'
																})
															}
														)
													}}>
														<Image
															cache='reload'
															source={{
																uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + tempUserId
																// uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + '' + '&imageId=' + '' + '&sourceType=singleImage&jidNode=' + (body.basic.type == 'groupChat' ? body.basic.userId + '&headPhotoNum=' + Global.headPhotoNum : body.basic.fromId)
																// uri: Path.headImg + '?jidNode=' + (body.basic.type == 'groupChat' ? body.basic.userId : body.basic.fromId) + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId
															}}
															style={[styles.bodyHead, {marginRight: 10}]}/>
													</TouchableWithoutFeedback> : null
												}
												<View
													style={{alignItems: type == 'her' ? 'flex-start' : 'flex-end'}}>
													<Text style={styles.bodyInforName}>{body.basic.userName}</Text>
													{
														body.type != undefined ?
															body.type == 0 || body.type == 3 ?
																body.basic.type == 'announcement' ? (this._renderAnnouncement(type, body.content.title, body.id)) : this._renderText(type, body, item)//文本
																: body.type == 2 && body.content.file[0].listFileInfo[0].showPic == 'audio' ?
																this._renderAudio(type, body.content.file[0].listFileInfo[0].id, body.soundTime != undefined ? body.soundTime : 1, item)//语音
																: body.content.file[0].listFileInfo[0].showPic == 'img' ?
																	this._renderImage(type, body.content.file[0].listFileInfo[0])//图片
																	: this._renderFile(type, body.content.file[0].listFileInfo[0])//文件
															: body.basic.type == 'announcement' ?
															this._renderAnnouncement(type, body.content.title, body.id)//公告
															: body.basic.type == 'activity' ?
																this._renderActivity(type, body.content.title, body.activityId)//活动
																: body.basic.type == 'vote' ?
																	this._renderVote(type, body.content.title, body.voteId)//投票
																	: body.basic.type == 'topic' ?
																		this._renderTopic(type, body.content.title, body.topicId)//话题
																		: null
													}
													{
														!this.state.friendJidNode ?
															<Text style={styles.bodyInforTime}>{itemTime}</Text> : null
													}
												</View>
												{
													type == 'me' ?
														<Image
															source={{
																uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + ('&imageName=' + this.state.basic.photoId + '&imageId=' + this.state.basic.photoId + '&sourceType=singleImage&jidNode=' + this.state.basic.jidNode + '&platform=' + Platform.OS)
																// uri: Path.headImg + '?jidNode=' + meId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId
															}}
															style={styles.bodyHead}/> : null
												}
											</View>
										)
									} else {
										return (
											<View key={index}
											      style={{height: 30, justifyContent: 'center', alignItems: 'center'}}>
												<Text style={{
													backgroundColor: '#c5c5c5',
													borderRadius: 4,
													paddingLeft: 2,
													paddingRight: 2,
													textAlign: 'center',
													color: '#fff',
													fontSize: 10
												}}>{FormatDate.formatTimeStmpToFullTimeForSave(item.time)}</Text>
											</View>
										)
									}
								})
							}
						</View>
					</TouchableWithoutFeedback>
					{this._renderFooter()}
				</ScrollView>
				<Modal
					visible={this.state.isModal}
					animationType={'none'}
					transparent={true}
					onRequestClose={() => {
						this.setState({isModal: false, animating: false})
					}}>
					<View style={{flex: 1}}>
						<ImageViewer
							style={{width: width, height: height}}
							imageUrls={this.state.hisImgList}
							enableImageZoom={true}
							index={this.state.hisChooseImgId}
							flipThreshold={460}
							maxOverflow={400}
							onClick={() => { // 图片单击事件
								this.setState({isModal: false, animating: false})
							}}
							enablePreload={true}//开启预加载
							loadingRender={()=><View style={{width: width, height: height,justifyContent:'center',alignItems:'center'}}>
								<Image source={require('../../images/loading.png')}/>
							</View>}
							backgroundColor={'#000'}
						/>
					</View>
				</Modal>
			</View>
		)
	}

	//文件预览
	viewfile = (file) => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
		this.setState({
			viewFile: file
		}, () => {

		});
		this.setState({fileAnimating: true}, () => {
			if (Platform.OS == 'ios') {
				this.refs.bottomMenu._changeMenuShow(true);
				this.refs.bottomMenu._changeFirMenuShow(true);
				this.refs.bottomMenu._changeSecMenuShow(false);
			} else {
				//Android
				let showFileType = fileTypeReturn.getOtherFileType(file.fileName);
				if (showFileType == 'file') {
					this.refs.bottomMenu._changeMenuShow(true);
					this.refs.bottomMenu._changeFirMenuShow(true);
					this.refs.bottomMenu._changeSecMenuShow(true);
				} else {
					//其他类型直接弹出第三方打开
					// this._useOtherOpenFile(file);
					this.refs.bottomMenu._changeMenuShow(true);
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(true);
				}
			}
			this.setState({fileAnimating: false});
		});
	};
	_useLocalOpenFile = (file) => {
		if (Platform.OS == 'ios') {
			OpenFile.openDocBinaryinUrl([{
				url: Path.viewFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&suffix=' + file.fileName,
				fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				fileType: file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length)
			}], (error, url) => {
				if (error) {
					DeviceEventEmitter.emit('changeLoading', 'false');
				} else {
					DeviceEventEmitter.emit('changeLoading', 'false');
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(false);
				}
			})
		} else {
			this.setState({
				pdfInsideModalVisible: true,
				source: {
					uri: Path.viewFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&suffix=' + file.fileName,
					cache: true
				}//pdf
			}, () => {
				this.setState({
					pdfModalVisible: true,
					tempViewFileSize: file.filesize
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
		OpenFile.openDocBinaryinUrl([{
			url: Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)),
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
	//文件下载
	_downloadFile = (file) => {
		DeviceEventEmitter.emit('changeLoading', 'true');
		let url = Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileId=' + file.id + '&fileName=' + file.fileName + '&type=file' + '&userId=' + this.state.basic.userId;
		let downloadDest = '';
		if (Platform.OS == 'android') {
			downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/' + file.fileName;
		} else {
			downloadDest = '/storage/emulated/0/Android/data/com.egt_rn/files/' + file.name;
		}
		const options = {
			fromUrl: url,
			toFile: downloadDest,
			background: true,
		};
		try {
			const ret = RNFS.downloadFile(options);
			ret.promise.then(res => {
				if (res.statusCode == 200) {
					DeviceEventEmitter.emit('changeLoading', 'false');
					if (Platform.OS == 'android') {
						Alert.alert(
							'文件保存路径',
							downloadDest.substring(downloadDest.indexOf('0') + 1, downloadDest.length),
							[
								{
									text: '确定',
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

	_renderFooter() {
		if (this.state.showFooter == 0) {
			return <View></View>
		} else if (this.state.showFooter == 1) {
			return <View style={styles.footer}>
				<Text style={styles.footerText}>没有更多数据了</Text>
			</View>
		} else if (this.state.showFooter == 2) {
			return <View style={styles.footer}>
				<ActivityIndicator/>
				<Text style={styles.footerText}>正在加载更多数据...</Text>
			</View>
		}
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	bodyContainer: {
		flex: 1,
		flexDirection: 'row',
		marginTop: 7,
		marginBottom: 7,
	},
	bodyHead: {
		height: 37,
		width: 37,
		marginLeft: 8,
		marginRight: 8,
	},
	bodyInforName: {
		fontSize: 12,
		color: '#666',
		marginBottom: 4,
		marginTop: -2
	},
	bodyInforTime: {
		fontSize: 10,
		color: '#bcbcbc',
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
	soundWidth: {
		minWidth: 70,
		maxWidth: 150,
	},
	chatSound: {
		width: 15,
		height: 15,
	},
	bodyImage: {
		height: 100,
		width: 100,
		borderRadius: 4,
	},
	bodyFile: {
		flexDirection: 'row',
		borderRadius: 4,
		backgroundColor: 'white',
		padding: 10,
		width: 200,
	},
	historyBody: {
		padding: 0,
		flexDirection: 'column',
	},
	historyBodyTop: {
		flexDirection: 'row',
		padding: 3,
		paddingLeft: 8,
		paddingRight: 8,
		justifyContent: 'center'
	},
	historyBodyTopText: {
		flex: 1,
		fontSize: 16,
		color: '#333',
		lineHeight: 30,
	},
	historyBodyBottom: {
		width: 200,
		borderTopWidth: 1,
		borderTopColor: '#e5e5e5',
		padding: 2,
		paddingLeft: 8,
		paddingRight: 8
	},
	historyBodyBottomText: {
		fontSize: 12,
		color: '#999',
	},
	fileLogo: {
		width: 33,
		height: 42,
		marginRight: 10,
	},
	fileInfor: {
		flex: 1,
		// height: 42,
		justifyContent: 'center',
	},
	bodyTypeIcon: {
		width: 27,
		height: 35,
		marginRight: 8
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
	fileShowBox: {
		position: 'absolute',//relative
		height: 50,
		top: -40,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999
	},
	fileShowList: {
		flexDirection: 'row',
		backgroundColor: '#333',
		borderRadius: 4,
	},
	fileListText: {
		color: '#fff',
		fontSize: 12,
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
});