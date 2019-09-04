import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Platform,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Dimensions,
	Image,
	ScrollView,
	TextInput,
	TouchableHighlight,
	NativeModules,
	DeviceEventEmitter, Keyboard, PermissionsAndroid, Alert, BackHandler
} from 'react-native';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from 'react-native-modal-datetime-picker';
import cookie from '../../util/cookie';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import XmlUtil from '../../util/XmlUtil';
import UUIDUtil from '../../util/UUIDUtil';
import ToolUtil from '../../util/ToolUtil';
import ImagePickerManager from 'react-native-image-picker';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import RedisUtil from '../../util/RedisUtil';
import AwesomeAlert from "react-native-awesome-alerts";
import XmppUtil from "../../util/XmppUtil";
import PushUtil from "../../util/PushUtil";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

const width = Dimensions.get('window').width;
const inputComponents = [];
let posterWidth = width - 30, posterHeight = posterWidth / 2;
let onceSubmit;
export default class ActivityPublish extends Component {
	constructor(props) {
		super(props);
		this.state = {
			room: props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			type: props.navigation.state.params.type,
			activityBody: props.navigation.state.params.type ? props.navigation.state.params.activityBody : {//活动信息提交对象
				mid: props.navigation.state.params.room.roomJid,
				title: '',//活动主题
				poster: '',//活动海报
				startTime: '',//活动开始时间
				endTime: '',//活动结束时间
				address: '',//活动地点
				isPublic: 1,//是否开放
				cost: -1,//活动费用
				memberNum: 0,//活动人数
				phone: '',//发布人电话
				content: '',//详情
				createUser: props.navigation.state.params.basic.jidNode,
				nickName: props.navigation.state.params.basic.trueName,
				belongId: props.navigation.state.params.room.roomJid,
			},
			messageBody: {
				"id": UUIDUtil.getUUID(),
				"messageType": 'activity',
				"activityId": '',
				"basic": {
					"userId": props.navigation.state.params.basic.jidNode,
					"userName": props.navigation.state.params.basic.trueName,
					"head": props.navigation.state.params.room.head,
					"sendTime": new Date().getTime(),
					"groupId": props.navigation.state.params.room.roomJid,
					"groupName": props.navigation.state.params.room.roomName,
					"type": 'activity'
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
			isDateTimeVisible: false,
			maxTime: '',//最大时间
			modalType: 0,//打开日期选择判断是开始还是结束时间
			posterUrl: '',
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

	}


	_PostActivity = () => {

		//实时调取接口查询是否为群主或管理员
		// FetchUtil.netUtil(Path.isRoomAdmin+'?ticket='+this.state.ticket+'&uuId='+this.state.uuid+'&userId='+this.state.basic.userId+'&roomJid='+this.state.room.roomJid+'&jidNode='+this.state.basic.jidNode, {}, 'GET', this.props.navigation, '', (responseJson) => {
		// 	if (responseJson.code.toString() == '200') {
		// 		if (responseJson.data) {
		let body = this.state.activityBody;
		body['key'] = onceSubmit;
		let url = Path.getActivityPublish;
		let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
		if (body['title'].trim() == '') {
			this._toast('活动主题不能为空！');
		} else if(ToolUtil.isEmojiCharacterInString(body['title'])){
			this._toast('活动主题不能包含非法字符！');
		}else if(body['title'].length >= 32){
			this._toast('活动主题长度不得大于32！');
		}else if (body['startTime'] == '') {
			this._toast('请选择活动开始时间！');
		} else if (body['endTime'] == '') {
			this._toast('请选择活动结束时间！');
		} else if (body['address'].trim() == '') {
			this._toast('活动地点不能为空！');
		} else if(ToolUtil.isEmojiCharacterInString(body['address'])){
			this._toast('地点名称不能包含非法字符！');
		}else if(body['address'].length > 50){
			this._toast('地点名称不能超过50！');
		}else if (body['cost'] < 0) {
			this._toast('活动费用不得小于0！');
		}else if (body['memberNum'] <= 0 || (/\./g.test(body['memberNum']))) {
			this._toast('请输入正确的人数！');
		} else if(body['memberNum'].length > 7){
			this._toast('人数上限不得超过7位数！');
		}else if (/^[1][0-9][0-9]{9}$/g.test(body['phone']) == false) {
			this._toast('请输入活动发布方正确的11位手机号码！');
		} else if (body['content'].trim() == '') {
			this._toast('活动内容不能为空！');
		} else if(ToolUtil.isEmojiCharacterInString(body['content'])){
			this._toast('活动内容不能包含非法字符！');
		}else {
			let reg=/^(0|[1-9]\d{0,4})(\.\d{1,2})?$/;
			if(!reg.test(body['cost'])){
					this._toast('活动费用格式不正确！');
					return;
			}
			if (this.state.type == 'alter') {
				this.alterActive()
			}else {
                XmppUtil.xmppIsConnect(()=>{
                    DeviceEventEmitter.emit('changeLoading', 'true');
                    FetchUtil.netUtil(url, body, 'POST', this.props.navigation, {
                        uuId: this.state.uuid,
                        ticket: this.state.ticket,
                        userId: this.state.basic.userId
                    }, (responseJson) => {

                        if (responseJson == 'tip') {
                            this._toast(`活动发布失败！`);
                        }else if (responseJson.code.toString() == '200') {
                            this.state.messageBody.activityId = responseJson.data.activityInfo.id;
                            this.state.messageBody.content.title = body['title'];
                            this.state.messageBody.id = newMsgId;
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
                                            DeviceEventEmitter.emit('activityAddPage');
                                            // DeviceEventEmitter.emit('noticeChatPage', {
                                            // 	body: this.state.messageBody,
                                            // 	type: 'activity'
                                            // });
                                        }
                                    })
                            } else {
                                let sendActivity = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgId);
                                XMPP.sendStanza(sendActivity);
                                DeviceEventEmitter.emit('activityAddPage');
                                // DeviceEventEmitter.emit('noticeChatPage', {body: this.state.messageBody, type: 'activity'});
                            }
													PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, '', this.state.room.roomName, this.props.navigation);
                            // DeviceEventEmitter.emit('activityAddPage');
                            DeviceEventEmitter.emit('changeLoading', 'false');
                            this.props.navigation.goBack();
                        } else if (responseJson.code.toString() == '-33') {
                            DeviceEventEmitter.emit('changeLoading', 'false');
                            this._toast('请求已提交，请勿重复操作！');
                        }
                    })
                },(error)=>{
                    this.setState({
                        showAlert: true,//alert框
                        tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
                    });
                });
			}

		}
	};

	_inputActivity = (text, type) => {
		let body = this.state.activityBody;
		if(type == 'cost'){
			let tempBody = {
				value: text.toString()
			}
			body[type] = ToolUtil.moneyLimit(tempBody,5);
		}else{
			body[type] = text;
		}
		this.setState({activityBody: body});
	};

	_showDateTimePicker = (timeType) => this.setState({
		isDateTimeVisible: true,
		modalType: timeType
	});
	_hideDateTimePicker = () => this.setState({isDateTimeVisible: false});

	_selectActivityDay = (date) => {
		const timeType = this.state.modalType;
		let body = this.state.activityBody;
		const startTime = this.state.activityBody.startTime;
		let Y = date.getFullYear(),
			M = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1),
			D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate(),
			h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours(),
			m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
		// s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
		let day = `${Y}-${M}-${D} ${h}:${m}`;
		if (timeType == 1) {
			body.startTime = day;
		} else if (timeType == 2) {
			if (day > startTime) {
				body.endTime = day;
			} else {
				this._toast('结束时间不能小于开始时间！');
			}
		}
		this.setState({
			activityBody: body,
			isDateTimeVisible: false
		});
	};

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

	stopActivity = () => {

		let postNoticeStr = 'uuId=' + this.state.uuid
			+ '&ticket=' + this.state.ticket
			+ '&roomJid=' + this.state.room.roomJid
			+ '&jidNode=' + this.state.basic.jidNode
			+ '&activeId=' + this.state.activityBody.id
			+ '&userId=' + this.state.basic.userId;
		FetchUtil.sendPost(Path.stopActive, postNoticeStr, this.props.navigation, (data) => {
			if (data.code.toString() == '200' && data.data.status == 'Success') {
				DeviceEventEmitter.emit('activityHeadNot');
				DeviceEventEmitter.emit('activityAddPage');
				this.props.navigation.goBack();
			}
		});
	}

	/** 修改活动*/
	alterActive = () => {
		let itemBody = this.state.activityBody;
		FetchUtil.netUtil(Path.alterActive, itemBody, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, (responseJson) => {

			if (responseJson.code.toString() == '200' && responseJson.status) {
				DeviceEventEmitter.emit('activityHeadNot');
				DeviceEventEmitter.emit('activityAddPage');
				this.props.navigation.goBack();
			}
		});
	}


	//处理TextInput失焦聚焦问题 end

	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={2000}/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={this.state.type == 'alter' ? '修改活动' : '发布活动'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					keyboardShouldPersistTaps={'always'}>
					<View style={[styles.activityContainer, {marginTop: 0}]}>
						<View style={styles.activityGroup}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.activityTitle}>活动主题</Text>
							<TextInput style={styles.activityInput}
												 onLayout={this._inputOnLayout.bind(this)}
												 underlineColorAndroid={'transparent'}
												 placeholder='请输入活动主题'
												 value={this.state.activityBody.title ? this.state.activityBody.title : ''}
												 onChangeText={(text) => this._inputActivity(text, 'title')}
							/>
						</View>
						<View>
							<Text style={styles.activityTitle}>活动海报</Text>
							<TouchableWithoutFeedback onPress={() => {
								HandlerOnceTap(this.uploadImages)
							}}>
								{
									this.state.activityBody.poster != '' ? (
										<Image
											source={this.state.activityBody.poster != '' ? (this.state.isLoadLocalImg ? {uri: this.state.posterUrl} : {uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + this.state.activityBody.poster + '&imageId=' + this.state.activityBody.poster + '&sourceType=activityImage'} ) : require('../../images/default_poster.png')}
											style={{width: posterWidth, height: posterHeight}} resizeMode={'cover'}/>
									) : <View style={styles.activityPoster}>
										<Image source={require('../../images/activity/icon_add.png')}
													 style={{width: 20, height: 20}}/>
										<Text style={{fontSize: 14, color: '#ccc'}}>添加海报</Text>
									</View>
								}
							</TouchableWithoutFeedback>
						</View>
						<View style={styles.activityGroup}>
							<Text style={styles.activityTitle}>开始时间</Text>
							<TouchableOpacity style={styles.activityTouch} onPress={() => {
								HandlerOnceTap(() => this._showDateTimePicker(1))
							}}>
								<Text style={{
									flex: 1,
									textAlign: 'right',
									marginRight: 10
								}}>{this.state.activityBody.startTime}</Text>
								<Icons name={'ios-arrow-forward'} size={30} color={'#CCCCCC'}/>
							</TouchableOpacity>
						</View>
						<View style={styles.activityGroup}>
							<Text style={styles.activityTitle}>结束时间</Text>
							<TouchableOpacity style={styles.activityTouch} onPress={() => {
								HandlerOnceTap(
									() => {
										if (this.state.activityBody.startTime != '') {
											this._showDateTimePicker(2);
										} else {
											this._toast('请先选择开始时间！');
										}
									}
								)
							}}>
								<Text style={{
									flex: 1,
									textAlign: 'right',
									marginRight: 10
								}}>{this.state.activityBody.endTime}</Text>
								<Icons name={'ios-arrow-forward'} size={30} color={'#CCCCCC'}/>
							</TouchableOpacity>
						</View>
						<View style={[styles.activityGroup, {borderBottomColor: 'transparent'}]}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.activityTitle}>活动地点</Text>
							<TextInput style={styles.activityInput}
												 onLayout={this._inputOnLayout.bind(this)}
												 underlineColorAndroid={'transparent'}
												 placeholder='请输入活动地址'
							           maxLength={50}
												 value={this.state.activityBody.address ? this.state.activityBody.address : ''}
												 onChangeText={(text) => this._inputActivity(text, 'address')}
							/>
						</View>
					</View>
					<View style={styles.activityContainer}>
						<View style={styles.activityGroup}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.activityTitle}>活动费用</Text>
							<TextInput style={styles.activityInput}
												 onLayout={this._inputOnLayout.bind(this)}
												 underlineColorAndroid={'transparent'}
												 placeholder={'请输入费用，0代表免费,格式：99999.00或99999'}
												 value={this.state.activityBody.cost >= 0 ? this.state.activityBody.cost.toString() : ''}
												 // maxLength={this.state.activityBody.cost >= 0 && this.state.activityBody.cost.toString().indexOf('.') > 0 ? 6 : 5}
												 keyboardType={'numeric'}
												 onChangeText={(text) => this._inputActivity(text, 'cost')}

							/>
						</View>
						<View style={styles.activityGroup}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.activityTitle}>人数上限</Text>
							<TextInput style={styles.activityInput}
												 onLayout={this._inputOnLayout.bind(this)}
												 underlineColorAndroid={'transparent'}
												 placeholder='报名人数上限'
												 value={this.state.activityBody.memberNum ? this.state.activityBody.memberNum.toString() : ''}
												 maxLength={7}
												 keyboardType='numeric'
												 onChangeText={(text) => this._inputActivity(text, 'memberNum')}
							/>
						</View>
						<View style={[styles.activityGroup, {borderBottomColor: 'transparent'}]}
									onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
							<Text style={styles.activityTitle}>主办方联系方式</Text>
							<TextInput style={styles.activityInput}
												 onLayout={this._inputOnLayout.bind(this)}
												 underlineColorAndroid={'transparent'}
												 placeholder='请输入11位手机号码'
												 value={this.state.activityBody.phone ? this.state.activityBody.phone : ''}
												 maxLength={11}
												 keyboardType={'numeric'}
												 onChangeText={(text) => this._inputActivity(text, 'phone')}
							/>
						</View>
					</View>
					<View style={styles.activityContainer}>
						<View>
							<Text style={styles.activityTitle}>活动详情</Text>
							<TouchableHighlight
								activeOpacity={1}
								underlayColor={'#fff'}
								style={styles.activityDetails}
								onPress={() => {
									this.refs.textarea.focus()
								}}
								onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}
							>
								<TextInput ref='textarea'
													 onLayout={this._inputOnLayout.bind(this)}
													 multiline={true}
													 underlineColorAndroid={'transparent'}
													 value={this.state.activityBody.content}
													 placeholder='请填写具体内容'
													 onChangeText={(text) => this._inputActivity(text, 'content')}/>
							</TouchableHighlight>
						</View>
						<TouchableOpacity style={styles.btn} onPress={() => {
							HandlerOnceTap(this._PostActivity)
						}}>
							<Text style={{fontSize: 15, color: '#fff'}}>{this.state.type == 'alter' ? '确认修改' : '发表'}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.btn, {backgroundColor: '#b4b4b4'}]} onPress={() => {
							HandlerOnceTap(
								() => {

									this.state.type == 'alter' ? this.stopActivity() : this.props.navigation.goBack();

								}
							)
						}}>
							<Text style={{fontSize: 15, color: '#fff'}}>{this.state.type == 'alter' ? '停止活动' : '取消'}</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
				<DateTimePicker
					mode='datetime'
					date={new Date()}
					isVisible={this.state.isDateTimeVisible}
					titleIOS={'选择时间'}
					cancelTextIOS={'取消'}
					confirmTextIOS={'确认'}
					onConfirm={this._selectActivityDay}
					onCancel={this._hideDateTimePicker}
				/>
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

	uploadImages = () => {
		cookie.save('isUpload', 1);//用于判断是否为选择图片后台状态
		let photoOptions = {
			//底部弹出框选项
			title: '请选择',
			cancelButtonTitle: '取消',
			takePhotoButtonTitle: '拍照',
			chooseFromLibraryButtonTitle: '打开相册',
			cameraType: 'back',
			quality: 1,
			allowsEditing: false,
			noData: false,
			storageOptions: {
				skipBackup: true,
				path: 'file'
			}
		};
		if (Platform.OS == 'android') {
			this.requestCameraPermission();
			this.requestReadExternalStoragePermission();
		}

		//打开图像库：
		ImagePickerManager.showImagePicker(photoOptions, (imageResponse) => {
			cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
			if (imageResponse.didCancel) {
			} else if (imageResponse.error) {
				this._toast('请检查您的相册权限是否开启！');
			} else {
				let imageType;
				if (imageResponse.fileName && imageResponse.fileName.indexOf('HEIC') == -1) {
					imageType = imageResponse.fileName.substr(imageResponse.fileName.lastIndexOf('.') + 1);
				} else {
					imageType = imageResponse.uri.substr(imageResponse.uri.lastIndexOf('.') + 1);
				}

				const trueType = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'gif', 'GIF'];
				if (trueType.indexOf(imageType) > -1) {
					//与上一节中的代码相同！
					let formData = new FormData();
					let file = {
						uri: imageResponse.uri,
						type: 'multipart/form-data',
						name: imageResponse.fileName && imageResponse.fileName.indexOf('HEIC') == -1 ? encodeURIComponent(imageResponse.fileName) : 'image.png'
					};
					formData.append("file", file);
					posterHeight = (imageResponse.height / imageResponse.width) * posterWidth;
					this.refs.toast.show('海报加载中，请稍候...', DURATION.LENGTH_SHORT);
					let url = Path.getInviteFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId;
					fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'multipart/form-data',
						},
						body: formData,
					}).then((response) => response.json()).then((responseData) => {
						if (responseData.code.toString() == '200') {
                            let item = responseData.data[0]
                            let result = typeof item == 'object'  ? item : JSON.parse(item);
							if(result.status == 'Fail'){
								this.refs.toast.show('上传失败！', DURATION.LENGTH_SHORT);
							}else{
								let body = this.state.activityBody;
								body.poster = responseData.data[0].data;
								let bese64Image = 'data:image/*;base64,' + imageResponse.data;
								this.setState({topicBody: body, posterUrl: bese64Image,activityBody:body,isLoadLocalImg:true});
							}

						} else {
							this.refs.toast.show('上传失败！', DURATION.LENGTH_SHORT);
							/*Alert.alert(
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
												uuId: this.state.uuid
											}, 'lineStatus', 'back', () => {
												//设备当前为“后台”状态
												BackHandler.exitApp();
											});
										},
									}
								]
							)*/
						}
					}, () => {
						// alert('success')
					}).catch((error) => {
					});
				} else {
					this._toast('不支持当前格式的图片！');
				}
			}
		});
	};

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
		});
	};

	//动态获取相机权限
	async requestCameraPermission() {
		try {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.CAMERA
			)
			if (granted == PermissionsAndroid.RESULTS.GRANTED) {
			} else {
			}
		} catch (err) {
		}
	}

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
const ACT_HEIGHT = 38;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	activityContainer: {
		paddingLeft: 15,
		paddingRight: 15,
		marginTop: 10,
		backgroundColor: '#fff'
	},
	activityGroup: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
		alignItems: 'center',
		justifyContent: 'center',
	},
	activityTitle: {
		fontSize: 16,
		color: '#333',
		margin: 5,
		marginLeft: 0,
		marginRight: 10,
		height: ACT_HEIGHT,
		lineHeight: ACT_HEIGHT,
	},
	activityInput: {
		flex: 1,
		textAlign: 'right',
		fontSize: 16,
		padding: 0
	},
	activityPoster: {
		backgroundColor: '#e3e3e3',
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		minHeight: 60,
	},
	activityTouch: {
		flex: 1,
		height: ACT_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
	},
	activityDetails: {
		borderWidth: 1,
		borderColor: '#ccc',
		height: 100,
		marginBottom: 15,
	},
	btn: {
		height: 43,
		borderRadius: 4,
		backgroundColor: '#4e71ff',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 14,
	}
})
