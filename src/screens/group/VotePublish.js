/*
 * 投票发布页面
 * 页面元素 标题 投票选项(点击按钮动态添加，最多8个选项) 投票方式(单选，多选) 截止日期(日期选择框) 发布取消按钮
 *
 */
import React, {Component} from 'react';
import {
    StyleSheet, Text, View, Platform, TouchableOpacity, Dimensions, ScrollView, TextInput,
    NativeModules, DeviceEventEmitter, Modal, Keyboard, Alert, BackHandler,
} from 'react-native';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import XmlUtil from '../../util/XmlUtil';
import UUIDUtil from '../../util/UUIDUtil';
import ToolUtil from '../../util/ToolUtil';
import AwesomeAlert from "react-native-awesome-alerts";
import DateTimePicker from "react-native-modal-datetime-picker";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import RedisUtil from '../../util/RedisUtil';
import XmppUtil from "../../util/XmppUtil";
import fileTypeReturn from "../../util/FileType";
import {DURATION} from "react-native-easy-toast";
import PushUtil from "../../util/PushUtil";

LocaleConfig.locales['fr'] = {
	monthNames: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
	monthNamesShort: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
	dayNames: ['日', '一', '二', '三', '四', '五', '六'],
	dayNamesShort: ['日', '一', '二', '三', '四', '五', '六']
};
LocaleConfig.defaultLocale = 'fr';
const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

const {height, width} = Dimensions.get('window');
const inputComponents = [];
let onceSubmit;

export default class VotePublish extends Component {
	constructor(props) {
		super(props);
		this.state = {
			room: props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			voteBody: {//投票信息提交对象
				mid: props.navigation.state.params.room.roomJid,
				title: '',//投票主题
				option: ["", ""],//投票选项
				ballotType: 1,//是否单选 true多选
				maxChoice: 0,//最大可选数
				endTime: '',//投票结束时间
				jidNode: props.navigation.state.params.basic.jidNode,
				nickName: props.navigation.state.params.basic.trueName,
			},
			messageBody: {
				"id": UUIDUtil.getUUID().replace(/\-/g, ''),
				"messageType": 'vote',
				"voteId": '',
				"basic": {
					"userId": props.navigation.state.params.basic.jidNode,
					"userName": props.navigation.state.params.basic.trueName,
					"head": props.navigation.state.params.room.head,
					"sendTime": new Date().getTime(),
					"groupId": props.navigation.state.params.room.roomJid,
					"groupName": props.navigation.state.params.room.roomName,
					"type": 'vote'
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
			isModalVisible: false,//日期选择状态
			animating: true,
			optArr: [1, 2],
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	componentDidMount() {
		// this._onceSubmit();
	}

	_showDateTimePicker = () => this.setState({isModalVisible: true});
	_hideDateTimePicker = () => this.setState({isModalVisible: false});
	_onceSubmit = () =>{
        onceSubmit = this.state.basic.userId + new Date().getTime();
        RedisUtil.onceSubmit(onceSubmit, this.props.navigation,
            {
                ticket: this.state.ticket,
                uuId: this.state.uuid,
                userId: this.state.basic.userId
            });
	}
	_inputVote = (text, type) => {
		let body = this.state.voteBody;
		body[type] = type == 'maxChoice' ? parseInt(text) : text;
		this.setState({voteBody: body});
	};
    /**
	 * 投票发布
     * @returns {boolean}
     * @private
     */
	_PostVote = () => {
		Keyboard.dismiss();
		// FetchUtil.netUtil(Path.isRoomAdmin+'?ticket='+this.state.ticket+'&uuId='+this.state.uuid+'&userId='+this.state.basic.userId+'&roomJid='+this.state.room.roomJid+'&jidNode='+this.state.basic.jidNode, {}, 'GET', this.props.navigation, '', (responseJson) => {
		// 	if (responseJson.code.toString() == '200') {
		// 		if (responseJson.data) {
		let body = this.state.voteBody;
		body['key'] = onceSubmit;

		let optType = false;
		let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '') + 'GroupMsg';
		let temp = true;
		let tempcategory;
		// for (let i in body.option) {
		// 	temp = ToolUtil.isEmojiCharacterInString(body.option[i]);
		// 	if (temp) {
		// 		break;
		// 	}
		// }
		let flag = true;   //假设不重复
		body.option.map((item,index)=>{
			if(item.trim() == ''){
				temp = false;
			}
		});
		for (let i = 0; i < body.option.length - 1; i++) { //循环开始元素
			for (let j = i + 1; j < body.option.length; j++) { //循环后续所有元素
				if (ToolUtil.isEmojiCharacterInString(body.option[i])) {
					tempcategory = ToolUtil.isEmojiCharacterInString(body.option[i]);
					break;
				}

				//如果相等，则重复
				if (body.option[i] == body.option[j]) {
					flag = false; //设置标志变量为重复
					break;      //结束循环
				}
			}

		}
		if (body.title.trim() == '') {
			this._toast('投票标题不能为空！');
		} else if (body.title.length > 32) {
			this._toast('标题长度不得超过32位！');
		} else if (ToolUtil.isEmojiCharacterInString(body.title)) {
			this._toast('标题不得包含非法字符！');
		} else if (!temp) {
			this._toast('选项内容不能为空！');
		// } else if (temp.length > 20) {
		// 	this._toast('请输入有效投票选项,选项内容不得超过20个字符!');
		} else if (tempcategory) {
			this._toast('选项不能包含非法字符！');
		} else if (!flag) {
			this._toast('选项内容不可重复！');
		} else if (body.ballotType == 2 && body.maxChoice == 0) {
			this._toast('请输入最大可选数！');
		} else if (body.ballotType == 2 && (body.maxChoice > body.option.length)) {
			this._toast('最大可选数不得超过总项数！');
		} else if (body.ballotType == 2 && (body.maxChoice <= 1)) {
			this._toast('最大可选数不得小于2！');
		} else if (body.endTime == '') {
			this._toast('请选择投票截止时间！');
		} else {
            XmppUtil.xmppIsConnect(()=>{
                DeviceEventEmitter.emit('changeLoading', 'true');
                FetchUtil.netUtil(Path.getVotePublish, body, 'POST', this.props.navigation, {
                    uuId: this.state.uuid,
                    ticket: this.state.ticket,
                    userId: this.state.basic.userId
                }, (result) => {
                    DeviceEventEmitter.emit('changeLoading', 'false');
                    if(result =="tip"){
                        this._toast('发布投票失败！');
                        // this.refs.toast.show('获取联系人失败！', DURATION.LENGTH_SHORT);
                    }else if(result.code.toString() == '200') {
                        this.state.messageBody.content.title = body.title;
                        this.state.messageBody.id = newMsgId;
                        this.state.messageBody.voteId = result.data.voteInfo.id;
                        if (Platform.OS == 'ios') {
                            XMPP.XMPPSendGroupMessage({
                                'message': this.state.messageBody,
                                'jid': this.state.room.roomJid,
                                'uuid': newMsgId
                            }, (error, event) => {
                                if (error) {
                                    this._toast(error);
                                }
                                DeviceEventEmitter.emit('voteAddPage', '');
                                // DeviceEventEmitter.emit('noticeChatPage', {body: this.state.messageBody, type: 'vote'});
                            })
                        } else {
                            let sendVote = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.state.messageBody), newMsgId);
                            XMPP.sendStanza(sendVote);
                            DeviceEventEmitter.emit('voteAddPage', '');
                            // DeviceEventEmitter.emit('noticeChatPage', {body: this.state.messageBody, type: 'vote'});
                        }
											PushUtil.pushGroupNotification(this.state.basic, this.state.ticket, this.state.room.roomJid, this.state.uuid, '', this.state.room.roomName, this.props.navigation);
                        this.props.navigation.goBack();
                    }
                    // else if (result.code.toString() == '-33') {
                    //     this._toast('请求已提交，请勿重复操作！');
                    // }
                    else{
                        this._toast('抱歉，操作失败！');
                        this._onceSubmit();
                    }
                })
            },(error)=>{
                this.setState({
                    showAlert: true,//alert框
                    tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
                });
            });
		}
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

	//选择时间
	_selectVoteDay = (date) => {
		// const timeType = this.state.modalType;
		let body = this.state.voteBody;
		const startTime = new Date();//当前时间
		let Y = date.getFullYear(),
			M = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1),
			D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate(),
			h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours(),
			m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
			s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
		let day = `${Y}-${M}-${D} ${h}:${m}:${s}`;
		if (startTime < date) {
			body.endTime = day;
		} else {
			this._toast('结束时间需大于当前时间');
		}
		this.setState({
			voteBody: body,
			isModalVisible: false
		});
	};

	//处理TextInput失焦聚焦问题 end
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
					title={'发起投票'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					keyboardShouldPersistTaps={'always'}
					style={{flex: 1, backgroundColor: 'white', paddingLeft: 15, paddingRight: 15}}>
					<View style={[styles.voteGroup, {borderTopColor: 'transparent'}]}
								onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
						<Text style={styles.voteTitle}>投票标题</Text>
						<TextInput ref={'voteTitle'}
											 onLayout={this._inputOnLayout.bind(this)}
											 style={styles.voteInput}
											 value={this.state.voteBody.title}
											 maxLength={32}
											 underlineColorAndroid={'transparent'}
											 placeholder='请输入投票标题'
											 onChangeText={(text) => this._inputVote(text, 'title')}/>
					</View>
					<View style={[styles.voteGroup, {flexDirection: 'column'}]}
								onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture.bind(this)}>
						<Text style={styles.voteTitle}>投票选项</Text>
						{
							this.state.optArr.map((item, index) => {
								return <View key={index} style={styles.voteOptionBox} onStartShouldSetResponder={() => {
									this.refs['option' + item].focus()
								}}>
									<Text>{item}. </Text>
									<TextInput
										ref={'option' + item}
										onLayout={this._inputOnLayout.bind(this)}
										style={[styles.voteInput, styles.voteOption]}
										value={this.state.voteBody.option[index]}
										maxLength={20}
										underlineColorAndroid={'transparent'}
										placeholder={index == 0 ? '最多添加八个选项，空选项无效' : ''}
										onChangeText={(text) => {
											let body = this.state.voteBody;
											body.option[index] = text;
											this.setState({
												voteBody: body
											})
										}}
										onFocus={() => {

										}}/>
								</View>
							})
						}
						<TouchableOpacity style={{marginTop: 5, marginBottom: 15}} onPress={() => {
							HandlerOnceTap(
								() => {
									let body = this.state.voteBody,
										max = this.state.optArr,
										num = max[max.length - 1] + 1;
									if (num <= 8) {
										max.push(num);
										body.option.push('');
										this.setState({
											optArr: max,
											voteBody: body
										})
									}
								}
							)
						}}>
							<Text>+ 添加更多选项</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.voteGroup}>
						<Text style={styles.voteTitle}>投票方式</Text>
						<View style={{
							flex: 1,
							height: ACT_HEIGHT,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'flex-end'
						}}>
							<TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginRight: 15}}
																onPress={() => {
																	let body = this.state.voteBody;
																	body.ballotType = 1;
																	this.setState({voteBody: body});
																}}>
								<View
									style={[styles.checkIcon, this.state.voteBody.ballotType == 1 ? {backgroundColor: '#b1b1b1'} : {backgroundColor: '#e1e1e1'}]}/>
								<Text style={styles.checkText}>单选</Text>
							</TouchableOpacity>
							<TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}}
																onPress={() => {
																	let body = this.state.voteBody;
																	body.ballotType = 2;
																	this.setState({voteBody: body});
																}}>
								<View
									style={[styles.checkIcon, this.state.voteBody.ballotType == 2 ? {backgroundColor: '#b1b1b1'} : {backgroundColor: '#e1e1e1'}]}/>
								<Text style={styles.checkText}>多选</Text>
							</TouchableOpacity>
						</View>
					</View>
					{
						this.state.voteBody.ballotType == 2 ? <View style={styles.voteGroup}>
							<Text style={styles.voteTitle}>最大可选数</Text>
							<TextInput style={styles.voteInput}
												 value={this.state.voteBody.maxChoice}
												 underlineColorAndroid={'transparent'}
												 placeholder={'请输入最大可选数'}
												 keyboardType={'numeric'}
												 maxLength={1}
												 onChangeText={(text) => this._inputVote(text, 'maxChoice')}/>
						</View> : null
					}
					<View style={styles.voteGroup}>
						<Text style={styles.voteTitle}>截止日期</Text>
						<TouchableOpacity style={styles.voteTouch} onPress={() => {
							HandlerOnceTap(this._showDateTimePicker)
						}}>
							<Text style={{
								flex: 1,
								textAlign: 'right',
								marginRight: 10
							}}>{this.state.voteBody.endTime}</Text>
							<Icons name={'ios-arrow-forward'} size={30} color={'#CCCCCC'}/>
						</TouchableOpacity>
					</View>
					<TouchableOpacity style={[styles.btn, {marginTop: 10}]} onPress={() => {
						HandlerOnceTap(this._PostVote)
					}}>
						<Text style={{fontSize: 15, color: '#fff'}}>发起</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.btn, {backgroundColor: '#b4b4b4'}]} onPress={() => {
						HandlerOnceTap(
							() => {
								this.props.navigation.goBack();
							}
						)
					}}>
						<Text style={{fontSize: 15, color: '#fff'}}>取消</Text>
					</TouchableOpacity>
				</ScrollView>
				<DateTimePicker
					mode='datetime'
					date={new Date()}
					titleIOS={'选择时间'}
					cancelTextIOS={'取消'}
					confirmTextIOS={'确认'}
					isVisible={this.state.isModalVisible}
					onConfirm={this._selectVoteDay}
					onCancel={() => {
						this.setState({isModalVisible: false, animating: false})
					}}
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

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
		});
	};
}


const ACT_HEIGHT = 38;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	voteGroup: {
		flexDirection: 'row',
		borderTopColor: '#ccc',
		borderTopWidth: 1,
		justifyContent: 'center',
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
		height: ACT_HEIGHT,
		fontSize: 14,
		padding: 0,
	},
	voteTouch: {
		flex: 1,
		height: ACT_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
	},
	voteOptionBox: {
		borderBottomWidth: 1,
		borderBottomColor: '#dbdbdb',
		marginBottom: 3,
		flexDirection: 'row',
		alignItems: 'center',
	},
	voteOption: {
		textAlign: 'left',
		paddingLeft: 8,
		paddingRight: 8,
	},
	checkText: {
		fontSize: 15,
		color: '#333',
		marginLeft: 3,
	},
	checkIcon: {
		width: 16,
		height: 16,
		borderRadius: 16,
		borderWidth: 4,
		borderColor: '#e1e1e1',
	},
	btn: {
		height: 43,
		borderRadius: 4,
		backgroundColor: '#4e71ff',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 14,
	},
	viewLine: {
		marginTop: 10,
		height: 100,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: 'red',
		borderRadius: 10,
	}
})