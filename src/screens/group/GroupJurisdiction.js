import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	TouchableOpacity,
	Platform,
	ScrollView,
	Modal,
	Dimensions,
	DeviceEventEmitter,
	NativeModules
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import UUIDUtil from '../../util/UUIDUtil'
import XmlUtil from "../../util/XmlUtil";
import ParamsDealUtil from '../../util/ParamsDealUtil';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import PCNoticeUtil from "../../util/PCNoticeUtil";
import Toast, {DURATION} from 'react-native-easy-toast';
import AwesomeAlert from "react-native-awesome-alerts";
import XmppUtil from "../../util/XmppUtil";
import Global from "../../util/Global";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
const WIDTH = Dimensions.get('window').width;

let noticeBody = {};
export default class GroupJurisdiction extends Component {
	constructor(props) {
		super(props);
		this.state = {
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			room: props.navigation.state.params.room,
			memberList: props.navigation.state.params.basicMemberList,
			nowAffiliation: props.navigation.state.params.nowAffiliation,
			groupOwner: props.navigation.state.params.groupOwner,//群主jidNode
			dataMemberList: [],
			modalVisible: false,
			muteJidNode: '',//禁言对象jidNode
			modeType: '',//创建节点三步骤，发布消息的mode类型
			muteName: '',
			adminJidNode: '',//管理员对象jidNode
			adminName: '',
			isSetAdmin: false,
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		};
		this.dealJidNode = '';
	}

	componentDidMount() {
		this.getMemberList();
	};

	componentWillUnmount() {

	}

	getMemberList = () => {
		let list = this.state.memberList,
			arrey = [];
		for (let i in list) {
			if (this.state.nowAffiliation == "owner") {
				if (list[i].affiliation != "owner") {
					arrey.push(list[i]);
				}
			} else {
				if (list[i].affiliation == "member") {
					arrey.push(list[i]);
				}
			}
		}
		this.setState({dataMemberList: arrey});
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

	_toast = (text) => {
		this.setState({
			modalVisible: false,//关闭禁言模态框
			showAlert: true,//alert框
			tipMsg: text//alert提示信息
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
					confirmText="返回详情"
					confirmButtonColor="#278EEE"
					//onCancelPressed={() => {
					//	this.hideAlert();
					//}}
					onConfirmPressed={() => {
						this.hideAlert();
						this.props.navigation.goBack();
					}}
				/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'修改权限'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					style={{flex: 1, paddingLeft: 8, paddingRight: 8}}>
					{
						this.state.dataMemberList.length > 0 ? (
							this.state.dataMemberList.map((item, index) => {
								let affiliationName = item.affiliation == 'member' ? "admin" : "member";
								let showName = item.trueName ? item.trueName : item.occupantTrueName;
								if (this.state.basic.jidNode != item.occupantJid) {
									return (
										<View
											style={[styles.itemContent, {borderTopColor: index == 0 ? 'transparent' : '#d7d7d7'}]}
											key={index}>
											<Image
												source={{
													uri:
														Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + (item.photoId ? item.photoId : item.occupantPhotoId) + '&imageId=' + (item.photoId ? item.photoId : item.occupantPhotoId) + '&sourceType=singleImage&jidNode=' + "" + '&platform=' + Platform.OS
													// Path.headImg + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&fileName=' + (item.photoId ? item.photoId : item.occupantPhotoId)
												}}
												style={styles.itemImage}/>
											<Text
												style={{flex: 1}}>{showName}</Text>
											{
												this.state.nowAffiliation == "owner" ? (
													<TouchableOpacity
														style={[styles.itemBtn, {backgroundColor: item.affiliation == 'member' ? '#549dff' : '#c1c1c1'}]}
														onPress={() => {
															HandlerOnceTap(
																() => {
																	this.setState({
																		isSetAdmin: true
																	})
																	this.getGroupAffiliation(item.occupantJid, affiliationName, showName);

																}
															)
														}}>
														<Text
															style={styles.itemBtnText}>{item.affiliation == 'member' ? '设为管理员' : '取消管理员'}</Text>
													</TouchableOpacity>
												) : null
											}
											{
												this.state.nowAffiliation == "owner" ? (
													<TouchableOpacity
														style={[styles.itemBtn, {backgroundColor: item.mute == 0 ? '#ff5728' : '#c1c1c1'}]}
														onPress={() => {
															HandlerOnceTap(
																() => {
																	this.dealJidNode = item.trueName;
																	if (item.mute == 0) {
																		this.setState({
																			modalVisible: true,
																			muteJidNode: item.occupantJid,
																			muteName: showName,
																			modeType: 'SETMUTE'
																		});
																	} else {
																		this.setState({
																			muteJidNode: item.occupantJid,
																			muteName: showName,
																			modeType: 'SETUNMUTE'
																		}, () => {
																			this.getGroupMute('unmute');
																		});
																	}
																}
															)
														}}>
														<Text style={styles.itemBtnText}>{item.mute == 0 ? '     禁言     ' : ' 取消禁言 '}</Text>
													</TouchableOpacity>
												) : (
													item.affiliation == 'member' ? (
														<TouchableOpacity
															style={[styles.itemBtn, {backgroundColor: item.mute == 0 ? 'red' : '#ccc'}]}
															onPress={() => {
																HandlerOnceTap(
																	() => {
																		this.dealJidNode = item.trueName;
																		if (item.mute == 0) {
																			this.setState({
																				modalVisible: true,
																				muteJidNode: item.occupantJid,
																				muteName: showName,
																				modeType: 'SETMUTE'
																			});
																		} else {
																			this.setState({
																				muteJidNode: item.occupantJid,
																				muteName: showName,
																				modeType: 'SETUNMUTE'
																			}, () => {
																				this.getGroupMute('unmute');
																			});
																		}
																	}
																)
															}}>
															<Text style={styles.itemBtnText}>{item.mute == 0 ? '     禁言     ' : ' 取消禁言 '}</Text>
														</TouchableOpacity>
													) : null
												)
											}
										</View>
									)
								}
							})
							) : (
							<View
								style={{
									height: 100,
									justifyContent: "center",
									alignItems: "center"
								}}
							>
								<Text style={{ fontSize: 16, color: "#999" }}>暂无数据</Text>
							</View>
						)
					}
				</ScrollView>
				<Modal//modal弹出禁言天数选择
					visible={this.state.modalVisible}
					animationType={"slide"}
					transparent={false}
					onRequestClose={() => this.setState({modalVisible: false})}>
					<View style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(0,0,0,0.2)'
					}}>
						<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
						<View style={{
							width: WIDTH * 0.7,
							height: 260,
							backgroundColor: 'white',
							justifyContent: 'center',
							alignItems: 'center',
							position: 'relative',
						}}>
							<TouchableOpacity style={styles.modalBtn} onPress={() => {
								HandlerOnceTap(
									() => {
										this.getGroupMute('mute', 3);
									}
								)
							}}>
								<Text>3天</Text>
							</TouchableOpacity>
							<View style={{backgroundColor: '#dadada', height: 1, width: WIDTH * 0.5, margin: 5}}/>
							<TouchableOpacity style={styles.modalBtn} onPress={() => {
								HandlerOnceTap(
									() => {
										this.getGroupMute('mute', 7);
									}
								)
							}}>
								<Text>7天</Text>
							</TouchableOpacity>
							<View style={{backgroundColor: '#dadada', height: 1, width: WIDTH * 0.5, margin: 5}}/>
							<TouchableOpacity style={styles.modalBtn} onPress={() => {
								HandlerOnceTap(
									() => {
										this.getGroupMute('mute', 365);
									}
								)
							}}>
								<Text>永久</Text>
							</TouchableOpacity>
							<View style={{backgroundColor: '#b2b2b2', height: 1, width: WIDTH * 0.5, margin: 20}}/>
							<TouchableOpacity style={styles.modalBtn} onPress={() => {
								HandlerOnceTap(
									() => {
										this.setState({modalVisible: false, muteJidNode: ''});
									}
								)
							}}>
								<Text>取消</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			</View>
		)
	}

	getGroupAffiliation = (id, type, name) => {
		XmppUtil.xmppIsConnect(() => {
			let params = {
				roomJid: this.state.room.roomJid,
				occupantJid: id,
				affiliation: type,
				operate: type == 'admin' ? 'SETADMIN' : 'SETMEMBER',
				currendFullJid: Global.loginUserInfo.jid + '/' + Global.loginResource
			};
			FetchUtil.netUtil(Path.newSaveOrUpdate, params, 'POST', this.props.navigation, Global.basicParam, (res) => {
                if (res == 'tip') {
                    this._toast(`     操作失败！     `);
                }else if (res.status) {
					let body = this.state.dataMemberList;
					for (let i in body) {
						if (body[i].occupantJid == id) {
							body[i].affiliation = type;
						}
					}
					this.setState({
						dataMemberList: body,
						adminJidNode: id,
						adminName: name,
						modeType: type == 'admin' ? 'SETADMIN' : 'SETMEMBER'
					}, () => {
						DeviceEventEmitter.emit('refreshGroupDetail');//修改角色广播详情
					})
				}
				else {
					DeviceEventEmitter.emit('refreshGroupDetail');//修改角色广播详情
					this._toast(res.msg);
				}
			});
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
	}

	getGroupMute = (type, num) => {
		XmppUtil.xmppIsConnect(() => {
			let params = {
				roomJid: this.state.room.roomJid,
				occupantJid: this.state.muteJidNode,
				mutenumber: num,
				type: type,
				currendFullJid: Global.loginUserInfo.jid + '/' + Global.loginResource
			};
			let url = type == 'mute' ? Path.newSetMute : Path.newCancelMute;
			FetchUtil.netUtil(url, params, 'POST', this.props.navigation, Global.basicParam, (res) => {
                if (res == 'tip') {
                    this._toast(`     操作失败！     `);
                }else if (res.status) {
					let body = this.state.dataMemberList;
					for (let i in body) {
						if (body[i].occupantJid == this.state.muteJidNode) {
							body[i].mute = type == "mute" ? 1 : 0;
							body[i].mutenumber = type == "mute" ? num : 0;
						}
					}
					this.setState({
						modalVisible: false,
						dataMemberList: body,
					}, () => {
						DeviceEventEmitter.emit('refreshGroupDetail');//修改禁言状态广播详情
					});
				}
				else {
					DeviceEventEmitter.emit('refreshGroupDetail');//修改角色广播详情
					this._toast(res.msg);
				}
				/*else if(res.data.isOwner){
					//当前用户是否为超级管理员
					// this._toast('您没有权限操作该用户');
				}else if(res.data.occupantIsOwner){
					//被操作人是否为群主
					this._toast('您没有权限禁言该用户！');
				}else if(res.data.occupantIsAdmin){
					//被操作人是否为管理员
					this._toast('您没有权限禁言该用户！');
				}else if(res.data.canBeOperate){
						//被操作人是否可以被操作
						this._toast('您没有权限禁言该用户！');
				}*/
			});
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				modalVisible: false,
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息，
			});
		});
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	itemContent: {
		flexDirection: 'row',
		height: 48,
		alignItems: 'center',
		borderTopWidth: 1,
	},
	itemImage: {
		width: 36,
		height: 36,
		marginRight: 8,
	},
	itemBtn: {
		paddingRight: 5,
		paddingLeft: 5,
		height: 28,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 6
	},
	itemBtnText: {
		fontSize: 12,
		color: 'white'
	},
	modalBtn: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 40,
		width: WIDTH * 0.5,
	},
});