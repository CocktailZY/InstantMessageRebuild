import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	FlatList,
	TouchableOpacity,
	Platform,
	ActivityIndicator,
	NativeModules,
	DeviceEventEmitter
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import ParamsDealUtil from "../../util/ParamsDealUtil";
import UUIDUtil from "../../util/UUIDUtil";
import XmlUtil from "../../util/XmlUtil";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import PCNoticeUtil from "../../util/PCNoticeUtil";
import AwesomeAlert from "react-native-awesome-alerts";
import XmppUtil from "../../util/XmppUtil";
import Global from "../../util/Global";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
let noticeBody = {};
export default class GroupAudit extends Component {
	constructor(props) {
		super(props);
		this.state = {
			room: props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			auditMember: [],
			showFoot: 0,
			applicat: {},
			modeType: '',
			pageNum: 1,//当前页数
			totalPage: 0,//总页数
			footLoading: true,//是否可刷新
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
		this.touchLock = true;
		this.createNodeStatue = false;
		this.createReadStatue = false;
		this.createPublishMessageStatue = false;
		// this.isPassStatus = true;

	}

	componentDidMount() {
		this.getAuditMember(1);

		if (Platform.OS == 'android') {

			this.groupIq = XMPP.on('iq', (iq) => this._XMPPdidReceiveIQ(iq));
		}

	};

	componentWillUnmount() {
		if (Platform.OS == 'android') {

			this.groupIq.remove();
		}
	}

	_XMPPdidReceiveIQ = (iq) => {

		if (iq.type == 'result' && this.createNodeStatue) {
			//发送订阅
			let sendMetuReadIqToGroup = XmlUtil.subscriptionToGroup(this.state.applicat.applicantJid + '@' + Path.xmppDomain, this.join);
			XMPP.sendStanza(sendMetuReadIqToGroup);
			this.createNodeStatue = false;
			this.createReadStatue = true;
		}

		if (iq.type == 'result' && this.createReadStatue && iq.pubsub && iq.pubsub.subscription) {
			//发布消息
			let sendMetuReadIqToGroup = XmlUtil.sendMessageGroup(this.state.room.roomJid, this.state.applicat.applicantJid, this.state.basic.jidNode, this.join, this.state.modeType);
			XMPP.sendStanza(sendMetuReadIqToGroup);
			this.createReadStatue = false;
			this.createPublishMessageStatue = true;
		}

		if (iq.type == 'result' && this.createPublishMessageStatue && iq.pubsub && iq.pubsub.publish) {

			if (this.isPassStatus) {
				//邀请入群
				let inviteToGroup = XmlUtil.inviteToGroup(this.state.applicat.applicantJid + '@' + Path.xmppDomain, this.state.room.roomJid + Path.xmppGroupDomain, this.state.basic.jid);
				XMPP.sendStanza(inviteToGroup);
				//设置角色
				let setRoleMsg = XmlUtil.setMember(this.state.room.roomJid + Path.xmppGroupDomain, this.state.applicat.applicantJid)
				XMPP.sendStanza(setRoleMsg);
			}

			PCNoticeUtil.pushPCNotification(this.state.room.roomJid,
				this.state.applicat.applicantJid,
				this.join,
				this.state.applicat.applicantJid,
				this.state.basic.jidNode,
				this.isPassStatus ? "JOINPASS" : "JOINNOTPASS",
				{
					uuId: this.state.uuid, ticket: this.state.ticket, userId: this.state.basic.userId
				}, this.props.navigation, () => {
					// let setMember = XmlUtil.setMember(this.state.room.roomJid + Path.xmppGroupDomain, noticeBody.occupantJid);
					// XMPP.sendStanza(setMember);
					let sendMessageToGroup = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(this.tempSigleBody), this.tempSigleBody.id);
					XMPP.sendStanza(sendMessageToGroup);

					// DeviceEventEmitter.emit('noticeChatPage', {body: this.tempSigleBody, type: 'text'});
					DeviceEventEmitter.emit('refreshGroupDetail');

					this.createPublishMessageStatue = false;
				})

		}


	};

	getAuditMember = (pageNum) => {
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			roomJid: this.state.room.roomJid,
			pageNum: pageNum,
			pageSize: Path.pageSize
		};
		FetchUtil.netUtil(Path.auditFriendsList + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (data) => {
            if (data == 'tip') {
                this.refs.toast.show("数据获取失败！", DURATION.LENGTH_SHORT);
            }else if (data.code == 200) {
				this.touchLock = true;
				this.setState({
					auditMember: pageNum == 1 ? data.data.recordList : this.state.auditMember.concat(data.data.recordList),
					pageNum: data.data.currentPage,
					totalPage: data.data.totalPage,
					footLoading: false
				});
			}
		});
	}

	_renderMemberItem = ({item, index}) => {
		let inviteText = !item.inviterName ? item.applicantName + '申请' : item.inviterName + '邀请' + item.applicantName;
		return (
			<View key={index} style={styles.auditBox}>
				<Image
					// source={{uri: Path.headImg + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&fileName=' + item.photoId}}
					source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.photoId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode=' + '' + '&platform=' + Platform.OS}}
					style={styles.auditImg}
				/>
				<View style={{flex: 1, justifyContent: 'center'}}>
					<Text numberOfLines={1} style={{fontSize: 16, color: '#333'}}>{item.applicantName}</Text>
					<Text numberOfLines={1}
								style={{fontSize: 12, color: '#777'}}>{inviteText + '加入群组'}</Text>
				</View>
				<TouchableOpacity style={[styles.auditBtn, {backgroundColor: '#549dff'}]}
													onPress={() => {
														HandlerOnceTap(() => this.auditOKOrNot(item, true))
													}}>
					<Text style={styles.auditBtnText}>同意</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.auditBtn, {backgroundColor: '#c1c1c1', marginLeft: 10}]}
													onPress={() => {
														HandlerOnceTap(() => this.auditOKOrNot(item, false))
													}}>
					<Text style={styles.auditBtnText}>拒绝</Text>
				</TouchableOpacity>
			</View>
		)
	}

	auditOKOrNot = (item, type) => {
        XmppUtil.xmppIsConnect(()=>{
            if (!this.touchLock) {
                return false;
            }
            this.touchLock = false;
			FetchUtil.netUtil(type ? Path.auditFriendsUpdata : Path.newAuditFriendsUpdata, {
				roomJid: this.state.room.roomJid,
				applicantJid: item.applicantJid,
				approverJid: item.approverJid,
				timestamp: item.timestamp,
				status: type ? '02' : '03',
				currendFullJid: Global.loginUserInfo.jid+'/'+Global.loginResource
			}, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, (data) => {
                if (data == 'tip') {
                    this._toast(`     操作失败！     `);
                }else if (data.status) {
					if (data.data == 'done') {
                        this.refs.toast.show("该数据已被其它人员操作！", DURATION.LENGTH_SHORT);
					} else {
						this.callbackAuditOKOrNot(item, type);
					}
				}else {
					this.refs.toast.show(data.msg, DURATION.LENGTH_SHORT);
				}
			});
        },(error)=>{
            this.setState({
                showAlert: true,//alert框
                tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
            });
        });
	}

	callbackAuditOKOrNot(item, state) {
		this.join = UUIDUtil.getUUID().replace(/\-/g, '');
		this.tempSigleBody = {
			"id": this.join + 'GroupMsg',
			"type": 0,
			"messageType": 'text',
			"basic": {
				"userId": this.state.basic.jidNode,
				"userName": this.state.basic.trueName,
				"head": this.state.room.head,
				"sendTime": new Date().getTime(),
				"groupId": this.state.room.roomJid,
				"type": "groupChat",
				"groupName": this.state.groupName
			},
			"content": {
				"text": `${this.state.basic.trueName} ${state ? '同意' : '拒绝'} ${item.applicantName} 加入群组`,
				"interceptText": `${this.state.basic.trueName} ${state ? '同意' : '拒绝'} ${item.applicantName} 加入群组`,
				"file": []
			},
			"atMembers": [],
			"occupant": {
				"state": state ? "JOINPASS" : "JOINNOTPASS",
				"effect": item.applicantName,
				'effectJid': item.applicantJid,
				"active": this.state.basic.trueName
			}
		};


		if (state) {
			let tempBody = 'uuId=' + this.state.uuid
				+ '&ticket=' + this.state.ticket
				+ '&roomJid=' + this.state.room.roomJid
				+ '&occupantJid=' + item.applicantJid + '&userId=' + this.state.basic.userId;
			FetchUtil.sendPost(Path.inviteFriends, tempBody, this.props.navigation, (memberData) => {
				noticeBody = {
					roomJid: this.state.room.roomJid,
					occupantJid: item.applicantJid,
					node: this.join,
					effect: item.applicantJid,
					active: this.state.basic.jidNode,
					message: "JOINPASS"
				};

                if (memberData == 'tip') {
                	this._toast(`     操作失败！     `);
                }else if (memberData.code + '' == '200') {
					if (Platform.OS == 'ios') {

						XMPP.agreeJoinTheGroup({
								'roomJid': this.state.room.roomJid,
								'userJid': this.state.basic.jidNode,
								'userName': this.state.basic.trueName,
								'uuid': this.join,
								'ticket': this.state.ticket,
								'userId': this.state.basic.userId,
								'friendJid': item.applicantJid
							},
							(error, event) => {
								if (error) {
									this._toast(error);
								} else {

									XMPP.XMPPCreateNode({
											'uuid': this.join,
											'userJid': this.state.basic.jidNode,
											'nodeUserJid': item.applicantJid,
											'roomJid': this.state.room.roomJid,
											'type': "JOINPASS",
											'userId': this.state.basic.userId
										},
										(error, event) => {
											if (error) {
												this._toast(error);
											} else if (event) {

												PCNoticeUtil.pushPCNotification(this.state.room.roomJid,
													item.applicantJid,
													this.join,
													item.applicantJid,
													this.state.basic.jidNode,
													"JOINPASS",
													{
														uuId: this.state.uuid, ticket: this.state.ticket, userId: this.state.basic.userId
													}, this.props.navigation, () => {
														XMPP.XMPPSetMember({'memberJid': item.applicantJid, 'roomJid': this.state.room.roomJid,'uuid':UUIDUtil.getUUID().replace(/\-/g, '')});
														XMPP.XMPPSendGroupMessage({
																'message': this.tempSigleBody,
																'jid': this.state.room.roomJid,
																'uuid': this.join
															},
															(error, event) => {
																if (error) {
																	this._toast(error);
																} else {
																	DeviceEventEmitter.emit('refreshGroupDetail');
																	this.setState({
																		auditMember: [],
																		pageNum: 1
																	}, () => {
																		this.getAuditMember(1);
																	});
																}
															})
													});

											}
										})
								}
							});


					} else {
						this.setState({
							applicat: item,
							modeType: "JOINPASS",
							auditMember: [],
							pageNum: 1
						})
						this.createNodeStatue = true;
						this.isPassStatus = true;
						let sendMetuIqToGroup = XmlUtil.createGroupNode(this.state.basic.jidNode, this.join);
						XMPP.sendStanza(sendMetuIqToGroup);

						this.getAuditMember(1);
						//获取通知数
                        this.getNotification();
					}
				}
			});
		} else {

				this.setState({
					applicat: item,
					modeType: "JOINNOTPASS"
				})
				// this.createNodeStatue = true;
				// this.isPassStatus = false;
				// let sendMetuIqToGroup = XmlUtil.createGroupNode(this.state.basic.jidNode, this.join);
				// XMPP.sendStanza(sendMetuIqToGroup);

				// DeviceEventEmitter.emit('noticeChatPage', {body: this.tempSigleBody, type: 'text'});
				// DeviceEventEmitter.emit('refreshGroupDetail');
				this.setState({
					auditMember: [],
					pageNum: 1
				}, () => {
					this.getAuditMember(1);
				});
                //获取通知数
                this.getNotification();

			}


	}

	//通知数量
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
                <Toast ref="toast" opacity={0.6} fadeOutDuration={3000}/>
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
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'待审核人员'}
				/>
				<FlatList
					data={this.state.auditMember}
					renderItem={this._renderMemberItem}
					keyExtractor={(item, index) => String(index)}
					ItemSeparatorComponent={() => <View style={styles.separator}></View>}
					ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{fontSize: 16, color: '#999'}}>暂无待审核人员</Text>
					</View>}
					// onEndReachedThreshold={0.1}
					// onEndReached={this._onEndReached}
					ListFooterComponent={() => this._renderFooter()}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}/>
			</View>
		)
	}

	_renderFooter() {
		let footView = null;
		if (this.state.pageNum < this.state.totalPage) {
			if (this.state.footLoading) {
				footView = (
					<View style={styles.footer}>
						<ActivityIndicator/>
						<Text style={styles.footerText}>正在加载更多数据...</Text>
					</View>
				)
			} else {
				footView = (
					<TouchableOpacity
						style={styles.footer}
						onPress={() => {
							let tempNowPage = this.state.pageNum + 1;
							this.setState({footLoading: true}, () => {
								//获取数据
								this.getAuditMember(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if (this.state.auditMember.length > 0) {
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	auditBox: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 8,
		paddingTop: 3,
		paddingBottom: 3,
	},
	auditImg: {
		width: 48,
		height: 48,
		marginRight: 10
	},
	auditBtn: {
		width: 50,
		height: 26,
		justifyContent: 'center',
		alignItems: 'center'
	},
	auditBtnText: {
		fontSize: 12,
		color: 'white'
	},
	separator: {
		borderTopColor: '#ccc',
		borderTopWidth: 1
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
	}
});
