import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	TouchableWithoutFeedback,
	TouchableOpacity,
	Platform,
	ScrollView, Dimensions, ToastAndroid,
	TextInput, NativeModules, DeviceEventEmitter,
	Switch, BackHandler,
	Alert
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import CustomBtn from '../../component/common/CommitBtn';
import CheckBox from 'react-native-checkbox';
import Path from "../../config/UrlConfig";
import Icons from 'react-native-vector-icons/Ionicons';
import UUIDUtil from '../../util/UUIDUtil'
import XmlUtil from "../../util/XmlUtil";
import DeviceInfo from 'react-native-device-info';
import ParticipantsList from '../job/ParticipantsList';
import Toast, {DURATION} from 'react-native-easy-toast';
import AwesomeAlert from "react-native-awesome-alerts";
import ParamsDealUtil from "../../util/ParamsDealUtil";
import PCNoticeUtil from "../../util/PCNoticeUtil";
import NetworkStateUtil from "../../util/NetworkStateUtil";
import ToolUtil from "../../util/ToolUtil";
import HtmlUtil from "../../util/HtmlUtil";
import Global from "../../util/Global";
import XmppUtil from "../../util/XmppUtil";
import fileTypeReturn from "../../util/FileType";
import RedisUtil from "../../util/RedisUtil";

const uuid = DeviceInfo.getUniqueID().replace(/\-/g, '');
const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

let _newGroupId = '';
let adminArrey = [];
let isAdmin;
let tempSigleBody;
let tempBody;
let noticeBody = {};

export default class GroupCreate extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],//常用联系人数组
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			pageType: props.navigation.state.params.pageType,
			basic: props.navigation.state.params.basic,
			room: props.navigation.state.params.room ? props.navigation.state.params.room : '',
			roomJidNode: props.navigation.state.params.room ? props.navigation.state.params.room.roomJid : '',
			checkedFlag: false,
			checkedList: [],
			searchText: '',
			exist: '',
			isModalVisible: false,//modal是否显示，否
			isNeed: false,//是否开启审核，否
			groupName: props.navigation.state.params.room ? props.navigation.state.params.room.roomName : '',//输入的群名称
			groupContent: '',//输入群简介
			isJoin: props.navigation.state.params.isJoin,
			isParticipants: false,
			selectedParticipants: [],
			basicMemberList: props.navigation.state.params.basicMemberList ? props.navigation.state.params.basicMemberList : [],
			isCollapsed: false,
			nowAffiliation: props.navigation.state.params.nowAffiliation ? props.navigation.state.params.nowAffiliation : '',
			token: props.navigation.state.params.token,
			commitBtnFlag: true,//提交按钮置灰状态
			isSearch: false,//搜索状态
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		};
		this.sendMsgToGroupType = true;
		//初始化监听标记---------------------------------------------
		this.creatInviteNodeStatue = false;
		this.creatInviteReadStatue = false;
		this.creatInvitePublishMessageStatue = false;
		this.removeNodeStatue = false;
		this.removeReadStatue = false;
		this.removePublishMessageStatue = false;
		this.inviteGroupXmpp = false;
		this.inviteGroupXmppType = false;
		this.createGroupInviteNode = false;
		this.sendCreateGroupMsg = false;
		this.notifyPCMsg = false;
		//初始化监听标记结束---------------------------------------------
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
		//弹出框
		this.showFootAlert = DeviceEventEmitter.addListener('showFootAlert',(param) => {
			DeviceEventEmitter.emit('changeLoading', 'false');
			this._toast(param.msg);
		});
		if (Platform.OS == 'android') {
			this.createBack = BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
			// this.groupIq = XMPP.on('iq', (message) => this._inviteGroupXmpp(message));
		}
		this.fetchData();
	};

	componentWillUnmount() {
		if (Platform.OS == 'android') {
			this.createBack.remove();
		}
		this.showFootAlert.remove();
	}

	onBackAndroid = () => {
		if (this.state.isParticipants) {
			this.setState({isParticipants: false});
		} else {
			this.props.navigation.goBack();
		}
		return true;
	}

	_compareNumStep = (resultFlag, total, peopleName, effectJid) => {
		peopleName = peopleName.substring(0, peopleName.lastIndexOf(','));
		this.join = UUIDUtil.getUUID().replace(/\-/g, '');

		if (resultFlag == total) {
			let newId = UUIDUtil.getUUID().replace(/\-/g, '');
			tempBody = {
				"id": newId,
				"type": 0,
				"messageType": 'text',
				"basic": {
					"userId": this.state.basic.jidNode,
					"userName": this.state.basic.trueName,
					"head": this.state.room.head,
					"sendTime": new Date().getTime(),
					"groupId": Platform.OS == 'android' ? _newGroupId.substring(0, _newGroupId.indexOf('@')) : (this.state.pageType == 'create' ? this.state.roomJidNode : this.state.room.roomJid),
					"type": "groupChat",
					"groupName": this.state.groupName
				},
				"content": {
					"text": `${this.state.basic.trueName} 邀请 ${peopleName} 加入群组`,
					"interceptText": `${this.state.basic.trueName} 邀请 ${peopleName} 加入群组`,
					"file": []
				},
				"atMembers": [],
				"occupant": {
					"state": "INVITEJOINROOM",
					"effect": peopleName,
					'effectJids': effectJid.substring(0, effectJid.length - 1),
					"active": this.state.basic.trueName
				}
			};

			if (Platform.OS == 'ios') {

				let nodeUserJids = [];
				this.state.checkedList.map((item) => {
					nodeUserJids.push(item.peopleId);
				});

				XMPP.XMPPCreateNode({
						'uuid': this.join,
						'userJid': this.state.basic.jidNode,
						'nodeUserJids': nodeUserJids,
						'roomJid': this.state.pageType == 'create' ? this.state.roomJidNode : this.state.room.roomJid,
						'type': "INVITEJOINROOM",
						'userId': this.state.basic.userId
					},
					(error, event) => {
						if (error) {
							this._toast(error);
						} else if (event) {
							this.state.checkedList.map((item) => {
								XMPP.XMPPSetMember({
									memberJid: item.peopleId,
									roomJid: this.state.pageType == 'create' ? this.state.roomJidNode : this.state.room.roomJid,
									uuid:UUIDUtil.getUUID().replace(/\-/g, '')
								});

								PCNoticeUtil.pushPCNotification(this.state.pageType == 'create' ? this.state.roomJidNode : this.state.room.roomJid,
									item.peopleId,
									this.join,
									item.peopleId,
									this.state.basic.jidNode,
									"INVITEJOINROOM",
									{
										uuId: this.state.uuid, ticket: this.state.ticket, userId: this.state.basic.userId
									}, this.props.navigation, () => {

									});
							});

							this.timer = setTimeout(
								() => {
									XMPP.XMPPSendGroupMessage({
											'message': tempBody,
											'jid': this.state.pageType == 'create' ? this.state.roomJidNode : this.state.room.roomJid,
											'uuid': uuid
										},
										(error, event) => {
											if (error) {
												this._toast(error);
											} else if (event) {
												DeviceEventEmitter.emit('refreshGroupDetail');
												this.props.navigation.goBack();
											}
										})
								},
								2000
							);

						}
					})
				// DeviceEventEmitter.emit('noticeChatPage', {body: tempBody, type: 'text'});
			} else {

				let sendMsgToGroup = XmlUtil.sendGroup('groupchat', _newGroupId, JSON.stringify(tempBody), newId);
				XMPP.sendStanza(sendMsgToGroup);
			}
			// DeviceEventEmitter.emit('noticeChatPage', {body: tempBody, type: 'text'});
			DeviceEventEmitter.emit('refreshGroupList');
			DeviceEventEmitter.emit('changeChatHead');
			DeviceEventEmitter.emit('changeLoading', 'false');
			DeviceEventEmitter.emit('refreshPage', 'refresh');

			this.setState({
				commitBtnFlag: true
			}, () => {
				this.props.navigation.goBack();
			})

		}
	};

	//获取被邀请的成员的名字
	getCheckMembersName = (type) => {
		let resultFlag = 0;
		let total = this.state.checkedList.length;
		//循环邀请人入群
		let peopleName = '';
		let effectJid = '';
		this.state.checkedList.map((item, index) => {
			peopleName += item.uname + ',';
			effectJid += item.peopleId + ','
			resultFlag++;
		})
		if (type == 'invite') {
			this._compareNumStep(resultFlag, total, peopleName, effectJid);
		} else {
			this._removeFriendStep(resultFlag, total, peopleName);
		}
	};

	fetchData = () => {
		let url = Path.creatRoomGetFriends;
		FetchUtil.netUtil(url,{
			uid : this.state.basic.uid,
			groupId : '',
			groupType : '1',
			type : this.state.pageType,
			roomJid : this.state.room.roomJid,
			uuId : this.state.uuid,
			ticket : this.state.ticket,
			jidNode : this.state.basic.jidNode,
			userId : this.state.basic.userId
		},'POST',this.props.navigation,Global.basicParam,(responseJson) => {
            if (responseJson == 'tip') {
                this.refs.toast.show("人员获取失败！", DURATION.LENGTH_SHORT);
            }else
                this.setState({
				dataSource: JSON.parse(responseJson.data).datas
			});

		});

	};

	_onChecked = (id) => {
		this._searchFriendInputBox.blur();
		if (this.state.pageType == 'create') {
			this._createGroupInputBox.blur();
		}

		this.state.dataSource.map((item, index) => {

			if ((item.jidNode ? item.jidNode : item.occupantJid) == id) {
				item.checked = !item.checked;
				if (item.checked) {
					// if (this.state.pageType != 'cut') {
					this.state.selectedParticipants.push(item);
					// }
					this.state.checkedList.push({
						peopleId: item.jidNode ? item.jidNode : item.occupantJid,
						uname: item.trueName ? item.trueName : item.occupantTrueName
					});
				} else {
					// if (this.state.pageType != 'cut') {
					this.state.selectedParticipants.map((sel, inx) => {
						if (sel.jidNode == id) {
							this.state.selectedParticipants.splice(inx, 1);
						}
					});
					this.state.checkedList.map((res, inx) => {
						if (res.peopleId == id) {
							this.state.checkedList.splice(inx, 1);
						}
					})
					// }

				}
			}
		});
		this.setState({
			dataSource: this.state.dataSource
		});
	}

	_setSearchText = (text) => {
		this.setState({
			searchText: text
		});
	};
	_searchFriend = () => {
		this._searchFriendInputBox.blur();
		let params = {};
		let url = '';
		if (this.state.pageType != 'cut') {
			url = Path.creatRoomGetFriends;
			params = {
				trueNameLike : this.state.searchText,
				groupId : this.state.basic.groupId,
				type : this.state.pageType,
				roomJid : this.state.room.roomJid,
				uuId : this.state.uuid,
				ticket : this.state.ticket,
				jidNode : this.state.basic.jidNode,
				userId : this.state.basic.userId
			};

		} else {
			url = Path.getGroupMember;
			params = {
				occupantNick : this.state.searchText,
				roomJid : this.state.room.roomJid,
				uuId : this.state.uuid,
				ticket : this.state.ticket,
				currentJidNode : this.state.basic.jidNode,
				userId : this.state.basic.userId
			};
		}
		FetchUtil.netUtil(url,params,'POST',this.props.navigation,Global.basicParam,(data) => {

            if (data == 'tip') {
                this.refs.toast.show("人员获取失败！", DURATION.LENGTH_SHORT);
            }else if (data.code.toString() == '200') {
				let reset = this.state.pageType != 'cut' ? JSON.parse(data.data).datas : data.data;
				if (reset.length > 0) {
					let tempArr = [];
					reset.map((item) => {
						this.state.checkedList.map((res) => {
							if ((item.jidNode ? item.jidNode : item.occupantJid) == res.peopleId) {
								item.checked = true;
							}
						});
						if (this.state.pageType == 'cut') {
							item.exist = true;
						}
						tempArr.push(item);
					});
					this.setState({
						dataSource: tempArr,
						isSearch: false,
					});
				} else {
					this.setState({
						dataSource: [],
						isSearch: true,
					});

				}
			}
		});
	};

	_renderFriendItem = () => {
		let itemView = [];
		let dataArrey = [];
		let dataBody = this.state.dataSource;
		if (this.state.pageType == 'cut') {
			for (let i in dataBody) {
				if (dataBody[i].exist) {
					if (this.state.nowAffiliation == "owner") {
						if (dataBody[i].affiliation != "owner") {
							dataArrey.push(dataBody[i]);
						}
					} else {
						if (dataBody[i].affiliation == "member") {
							dataArrey.push(dataBody[i]);
						}
					}
				}
			}
		} else {
			dataArrey = dataBody;
		}
		dataArrey.map((item, index) => {
			if (this.state.basic.jidNode != item.occupantJid) {
				itemView.push(
					<TouchableWithoutFeedback disabled={this.state.pageType != 'cut' ? item.exist : false} key={index}
																		onPress={
																			this._onChecked.bind(this, item.jidNode ? item.jidNode : item.occupantJid)
																		}>
						<View style={{height: 50, flexDirection: 'row', paddingLeft: 8, paddingRight: 8}}>
							<View style={{width: 30, height: 50, justifyContent: 'center', alignItems: 'center'}}>
								<CheckBox
									label={null}
									checked={this.state.pageType != 'cut' && item.exist ? item.exist : item.checked}
									onChange={
										(this.state.pageType != 'cut') && item.exist ? null :
											this._onChecked.bind(this, item.jidNode ? item.jidNode : item.occupantJid)
									}
									containerStyle={{marginBottom: 0}}
									checkedImage={require('../../images/check-circle.png')}
									uncheckedImage={require('../../images/check.png')}
								/>
							</View>
							<View style={{
								flex: 1,
								flexDirection: 'row',
								alignItems: 'center',
								borderBottomWidth: 1,
								borderBottomColor: '#dddddd'
							}}>
								<Image
									source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&jidNode=' + item.jidNode + '&sourceType=singleImage' + '&imageName=' + (item.photoId ? item.photoId : item.occupantPhotoId) + '&imageId=' + (item.photoId ? item.photoId : item.occupantPhotoId)}}
									style={{
										width: 36,
										height: 36,
										borderRadius: Platform.OS == 'ios' ? 18 : 36,
										marginLeft: 8
									}}/>
								<View style={{justifyContent: 'center'}}>
									<Text style={{
										fontSize: 15,
										marginLeft: 8
									}}>{(item.trueName ? item.trueName : item.occupantTrueName) + '(' + item.deptName + ')'}</Text>
								</View>
							</View>
						</View>
					</TouchableWithoutFeedback>
				)
			}
		});
		return itemView;
	};
	_toggleModal = () => {
		this.setState({
			isModalVisible: !this.state.isModalVisible
		})
	};
	_setGroupName = (text) => {
		this.setState({
			groupName: text
		})
	};
	_setGroupContent = (text) => {
		this.setState({
			groupContent: text
		})
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
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
		});
	};
	_createGroup = () => {
		this._searchFriendInputBox.blur();
		this._createGroupInputBox.blur();

		if (this.state.pageType == 'create') {
			// this.setState({isModalVisible: true, commitBtnFlag: false},()=>{DeviceEventEmitter.emit('changeLoading','true');});
			let publicRoom = this.state.isNeed ? '1' : '0';
			let trueGroupName = this.state.groupName.trim();
			if (trueGroupName || trueGroupName != '') {

				let roomJid = UUIDUtil.getUUID().replace(/\-/g, '');
				let url = Path.newCreateGroup;
				let chooses = [];
				this.state.checkedList.map((item)=>{
					chooses.push(item.peopleId);
				});
				let tempBody = {
					roomJid: roomJid,
					userJid: this.state.basic.jidNode,
					roomName: trueGroupName,
					roomDesc: '',
					jidNodes: chooses.length > 0 ? JSON.stringify(chooses) : chooses,//.replace('[','').replace(']',''),
					publicRoom: publicRoom,
					resource: Global.loginResource//XMPP登录人资源
				};
				if (1 <= trueGroupName.length && trueGroupName.length <= 16) {
					if (!ToolUtil.isEmojiCharacterInString(trueGroupName)) {
                        XmppUtil.xmppIsConnect(()=>{
                            if (this.state.checkedList.length > 0) {
                                DeviceEventEmitter.emit('changeLoading', 'true');
                                FetchUtil.netUtil(url, tempBody, 'POST', this.props.navigation, Global.basicParam, (responseJson) => {
                                    if (responseJson == 'tip') {
                                        DeviceEventEmitter.emit('changeLoading', 'false');
                                    	this._toast(" 群组创建失败！ ");
                                    }else if (responseJson.status && responseJson.code.toString() == '200') {
                                    	if (Platform.OS == 'android'){
																				// XMPP.sendStanza(XmlUtil.enterGroup(roomJid + Path.xmppGroupDomain + '/'+this.state.basic.jidNode));//创建群之前的presence
																				XMPP.joinRoom(roomJid + Path.xmppGroupDomain, this.state.basic.jidNode, 1);
																			}else {
																				XMPP.XMPPMapgroupes(
																					{
																						roomJid: roomJid,
																						account: this.state.basic.jidNode,
																						maxstanzas:'1'
																					},
																					(error, event) => {
																						if (error) {
																							this._toast(error);
																						}
																					}
																				);
																			}
                                        this.setState({
                                            commitBtnFlag: true
                                        }, () => {
											DeviceEventEmitter.emit('changeLoading', 'false');
                                            DeviceEventEmitter.emit('refreshGroupList');
																						//DeviceEventEmitter.emit('changeChatHead');
                                            this.refs.toast.show('操作成功', DURATION.LENGTH_SHORT);
                                            this.props.navigation.goBack();
                                        })
                                    }
                                    // }
                                })
                            } else {
                                // DeviceEventEmitter.emit('changeLoading','false');
                                Alert.alert('提示', '没有邀请成员，是否创建群组?',
                                    [
                                        {
                                            text: "取消", onPress: () => {
                                                this.setState({
                                                    commitBtnFlag: true
                                                })
                                            }
                                        },
                                        {
                                            text: "确认", onPress: () => {
                                                DeviceEventEmitter.emit('changeLoading', 'true');
                                                FetchUtil.netUtil(url, tempBody, 'POST', this.props.navigation, Global.basicParam, (responseJson) => {
                                                    if (responseJson == 'tip') {
                                                        DeviceEventEmitter.emit('changeLoading', 'false');
                                                        this._toast(" 群组创建失败！ ");
                                                    }else if (responseJson.status && responseJson.code.toString() == '200') {
                                                    	if (Platform.OS == 'android'){
																												// XMPP.sendStanza(XmlUtil.enterGroup(roomJid + Path.xmppGroupDomain + '/'+this.state.basic.jidNode));//创建群之前的presence
																												XMPP.joinRoom(roomJid + Path.xmppGroupDomain, this.state.basic.jidNode, 1);
																											}
                                                        this.setState({
                                                            commitBtnFlag: true
                                                        }, () => {
                                                            DeviceEventEmitter.emit('refreshGroupList');
                                                            DeviceEventEmitter.emit('changeChatHead');
                                                            DeviceEventEmitter.emit('changeLoading', 'false');
                                                            this.refs.toast.show('操作成功', DURATION.LENGTH_SHORT);
                                                            this.props.navigation.goBack();
                                                        })
                                                    }
                                                    // }
                                                })
                                            }
                                        },
                                    ]
                                );
                            }
                        },(error)=>{
                            this.setState({
                                showAlert: true,//alert框
                                tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
                            });
                        });
					} else {
						this.setState({
							commitBtnFlag: true
						}, () => {
							this._toast('群名称含有非法字符');
						})
					}
				} else {
					this.setState({
						commitBtnFlag: true
					}, () => {
						this._toast('请输入1-16个字符');
					})
				}
			} else {
				this.setState({
					commitBtnFlag: true
				}, () => {
					this._toast('群名称不能为空');
				})
			}
		}

	}
	/**
	 * 确认邀请
	 * @returns {boolean}
	 * @private
	 */
	_inviteGroup = () => {
		if (this.state.selectedParticipants.length <= 0) {
			this._toast(` 请选择人员! `);
			return false;
		}
        XmppUtil.xmppIsConnect(()=>{
            this.setState({
                commitBtnFlag: false
            }, () => {
                DeviceEventEmitter.emit('changeLoading', 'true');
                let chooses = [];
                this.state.checkedList.map((item)=>{
                    chooses.push(item.peopleId);
                });
                let prams = {
                    userFullJid: Global.loginUserInfo.jid+'/'+Global.loginResource,
                    roomJidLocal: this.state.roomJidNode,
                    invitors: JSON.stringify(chooses)
                };
                FetchUtil.netUtil(Path.newInviteFriends,prams,'POST',this.props.navigation,Global.basicParam,(res)=>{
                    if (res == 'tip') {
                        DeviceEventEmitter.emit('changeLoading', 'false');
                        this._toast(" 邀请人员失败！ ");
                    }else if (res.code.toString() == '200') {
                        DeviceEventEmitter.emit('changeLoading', 'false');
                        this.setState({
                            commitBtnFlag: true
                        });
                        DeviceEventEmitter.emit('refreshGroupList');
                        DeviceEventEmitter.emit('refreshGroupDetail');
                        DeviceEventEmitter.emit('changeChatHead');
                        DeviceEventEmitter.emit('changeLoading',false);
                        DeviceEventEmitter.emit('refreshPage', 'refresh');
                        DeviceEventEmitter.emit('refreshMemberData');
                        this.refs.toast.show('操作成功', DURATION.LENGTH_SHORT);
                        // DeviceEventEmitter.emit('noticeChatPage', {body: tempSigleBody, type: 'text'});
                        this.props.navigation.goBack();
                    }
                })
            })
        },(error)=>{
            this.setState({
                showAlert: true,//alert框
                tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
            });
        });
	};

	_inviteGroupChecked = () => {
		let resultFlag = 0;
		let total = this.state.checkedList.length;
		let peopleName = '';
		let effectJid = '';
		let node = UUIDUtil.getUUID().replace(/\-/g, '');
		if (Platform.OS == 'ios') {

			let basicMemberList = this.state.basicMemberList;
			adminArrey = [];
			for (let key in basicMemberList) {
				if (basicMemberList[key].affiliation != 'member') {
					adminArrey.push(basicMemberList[key]);
				}
			}

			for (let index in adminArrey) {
				isAdmin = 'NO';
				if (adminArrey[index].occupantJid == this.state.basic.jidNode) {
					isAdmin = 'Yes';
					break;
				}

			}

			XMPP.inviteFriend(
				{
					'ticket': this.state.ticket,
					'roomJid': this.state.room.roomJid,
					'userJid': this.state.basic.jidNode,
					'members': this.state.checkedList,
					'uuid': node,
					'deviceUuid': this.state.uuid,
					'userId': this.state.basic.userId,
					'isAdmin': isAdmin,
					'admins': adminArrey,
					'isPublicRoom': this.state.room.publicRoom,
					'type': isAdmin == 'Yes' ? 'INVITEJOINROOM' : 'join'
				},
				(error, event) => {
					if (error) {
						this._toast(error);
					} else if (event) {
						if (this.state.room.publicRoom == '1') {
							if (isAdmin == 'Yes') {
								this.getCheckMembersName('invite');
							} else {
								let checkArr = [];
								this.state.checkedList.map((item) => {
									checkArr.push(item.peopleId);
								});
								FetchUtil.netUtil(Path.auditFriends, {
									applicantJids: checkArr,
									roomJid: this.state.room.roomJid,
									inviterJid: this.state.basic.jidNode,
									node: 'join' + node
								}, 'POST', this.props.navigation, {
									uuId: this.state.uuid,
									ticket: this.state.ticket,
									userId: this.state.basic.userId
								}, (responseJson) => {
                                    if (responseJson == 'tip') {
                                        DeviceEventEmitter.emit('changeLoading', 'false');
                                        this._toast(" 操作失败！ ");
                                    }else if (responseJson.code.toString() == '200') {
										this._auditGroupChecked();
										DeviceEventEmitter.emit('refreshGroupList');
										DeviceEventEmitter.emit('changeChatHead');
										DeviceEventEmitter.emit('changeLoading', 'false');
										DeviceEventEmitter.emit('refreshPage', 'refresh');
										this.props.navigation.goBack();
									}
								});
							}
						} else {
							this.getCheckMembersName('invite');
						}
					}
				}
			);

		} else {
			this.state.checkedList.map((item) => {
				if (this.state.nowAffiliation == "member" && this.state.room.publicRoom == '1') {
					//如果当前登录人是审核群的普通成员
					let sendMetuReadIqToGroup = XmlUtil.approvePublishSendMessageGroup(this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')), this.state.basic.jidNode, 'join', item.uname, this.joinId, this.state.basic.jidNode);
					XMPP.sendStanza(sendMetuReadIqToGroup);//发布节点消息
				} else {
					//如果当前登录人是审核/非审核群的群主或管理员
					// sendMetuReadIqToGroup = XmlUtil.sendMessageGroup(this.state.room.roomJid, item.peopleId, this.state.basic.jid, this.join, 'INVITEJOINROOM');
					let sendMetuReadIqToGroup = XmlUtil.notApproveSendMessageGroup(this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')), item.peopleId, 'INVITEJOINROOM', this.joinId, this.state.basic.jidNode);
					PCNoticeUtil.pushPCNotification(this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')),
						item.peopleId,
						this.joinId,
						item.peopleId,
						this.state.basic.jidNode,
						this.state.nowAffiliation == "member" && this.state.room.publicRoom == '1' ? 'join' : 'INVITEJOINROOM',
						{
							uuId: this.state.uuid, ticket: this.state.ticket, userId: this.state.basic.userId
						}, this.props.navigation, () => {
							XMPP.sendStanza(sendMetuReadIqToGroup);//发布节点消息
						});
				}

				peopleName += item.uname + ',';
				effectJid += item.peopleId + ','
				resultFlag++;
				this._inviteGroupCheckedStep(resultFlag, total, peopleName, (this.state.nowAffiliation == "member" && this.state.room.publicRoom == '1') ? true : false, effectJid);

			});
		}
	};

	_auditGroupChecked = () => {
		let resultFlag = 0;
		let total = this.state.checkedList.length;
		let peopleName = '';
		let effectJid = '';
		if (Platform.OS == 'android') {
			this.state.checkedList.map((item) => {
				if (this.state.nowAffiliation == "member" && this.state.room.publicRoom == '1') {
					//如果当前登录人是审核群的普通成员
					let sendMetuReadIqToGroup = XmlUtil.approvePublishSendMessageGroup(this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')), this.state.basic.jidNode, 'join', item.uname, this.joinId, this.state.basic.jidNode);
					XMPP.sendStanza(sendMetuReadIqToGroup);
				} else {
					//如果当前登录人是审核/非审核群的群主或管理员
					let sendMetuReadIqToGroup = XmlUtil.notApproveSendMessageGroup(this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')), item.peopleId, 'INVITEJOINROOM', this.joinId, this.state.basic.jidNode);
					PCNoticeUtil.pushPCNotification(this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')),
						item.peopleId,
						this.joinId,
						item.peopleId,
						this.state.basic.jidNode,
						'INVITEJOINROOM',//this.state.nowAffiliation == "member" && this.state.room.publicRoom == '1' ? 'join' : 'INVITEJOINROOM',
						{
							uuId: this.state.uuid, ticket: this.state.ticket, userId: this.state.basic.userId
						}, this.props.navigation, () => {
							XMPP.sendStanza(sendMetuReadIqToGroup);
						});
				}
				peopleName += item.uname + ',';
				effectJid += item.peopleId + ',';
				resultFlag++;
				this._inviteGroupCheckedStep(resultFlag, total, peopleName, true, effectJid);

			});
		} else {

			this.state.checkedList.map((item) => {

				peopleName += item.uname + ',';
				effectJid += item.peopleId + ',';
				resultFlag++;
				this._inviteGroupCheckedStep(resultFlag, total, peopleName, true, effectJid);
			});

		}
	}

	_inviteGroupCheckedStep = (resultFlag, total, peopleName, type, effectJid) => {
		/**
		 * 这里需要先判断type是不是为审核群的邀请
		 * 是 需要调接口判断当前邀请人是不是已经被其他管理员处理
		 * 否 再发送xmpp报文等一些列操作
		 */
		peopleName = peopleName.substring(0, peopleName.lastIndexOf(','));
		if (resultFlag == total) {

			let newMsgId = UUIDUtil.getUUID().replace(/\-/g, '');
			let tempSigleBody = {
				"id": newMsgId,
				"type": 0,
				"messageType": 'text',
				"basic": {
					"userId": this.state.basic.jidNode,
					"userName": this.state.basic.trueName,
					"head": this.state.room.roomJid ? this.state.room.head : '',
					"sendTime": new Date().getTime(),
					"groupId": this.state.room.roomJid ? this.state.room.roomJid : Platform.OS == 'android' ? _newGroupId.substring(0, _newGroupId.indexOf('@')) : this.state.roomJidNode,
					"type": "groupChat",
					"groupName": this.state.groupName
				},
				"content": {
					"text": `${this.state.basic.trueName} 邀请 ${peopleName} 加入群组${type && this.state.nowAffiliation == 'member' ? ' 等待审核...' : ''}`,
					"interceptText": `${this.state.basic.trueName} 邀请 ${peopleName} 加入群组${type && this.state.nowAffiliation == 'member' ? ' 等待审核...' : ''}`,
					"file": []
				},
				"atMembers": [],
				"occupant": {
					"state": type && this.state.nowAffiliation == 'member' ? "INVITEJOINAUDITROON" : "INVITEJOINROOM",
					"effect": peopleName,
					"effectJids": effectJid.substring(0, effectJid.length - 1),
					"active": this.state.basic.trueName
				}
			};
			if (Platform.OS == 'ios') {

				XMPP.XMPPSendGroupMessage({
						'message': tempSigleBody,
						'jid': this.state.room.roomJid,
						'uuid': UUIDUtil.getUUID().replace(/\-/g, '')
					},
					(error, event) => {
						if (error) {
							this._toast(error);
						} else {
							DeviceEventEmitter.emit('refreshGroupList');
							DeviceEventEmitter.emit('changeLoading', 'false');
							DeviceEventEmitter.emit('refreshPage', 'refresh');
							DeviceEventEmitter.emit('changeChatHead');
							this.refs.toast.show('操作成功', DURATION.LENGTH_SHORT);
							//DeviceEventEmitter.emit('noticeChatPage', {body: tempSigleBody, type: 'text'});
						}
					})


			} else {
				// let tempRoomJid = this.state.room.roomJid ? this.state.room.roomJid + Path.xmppGroupDomain : _newGroupId;
				// let sendMsgToGroup = XmlUtil.sendGroup('groupchat', tempRoomJid, JSON.stringify(tempSigleBody), newMsgId);
				// XMPP.sendStanza(sendMsgToGroup);

				// this.inviteGroupXmpp = false;
				// this.creatInviteNodeStatue = false;
				let checkArr = [];
				this.state.checkedList.map((item) => {
					checkArr.push(item.peopleId);
				});

				if (this.state.nowAffiliation == 'member' && this.state.room.publicRoom == '1') {
					FetchUtil.netUtil(Path.auditFriends, {
						applicantJids: checkArr,
						roomJid: this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')),
						inviterJid: this.state.basic.jidNode,
						node: 'join' + this.joinId
					}, 'POST', this.props.navigation, {
						uuId: this.state.uuid,
						ticket: this.state.ticket,
						userId: this.state.basic.userId
					}, (responseJson) => {

                        if (responseJson == 'tip') {
                            DeviceEventEmitter.emit('changeLoading', 'false');
                            this._toast(" 操作失败！ ");
                        }else if (responseJson.code.toString() == '200') {
							this.setState({
								commitBtnFlag: true
							});
							DeviceEventEmitter.emit('refreshGroupList');
							DeviceEventEmitter.emit('refreshGroupDetail');
							DeviceEventEmitter.emit('changeChatHead');
							DeviceEventEmitter.emit('changeLoading',false);
							DeviceEventEmitter.emit('refreshPage', 'refresh');
							DeviceEventEmitter.emit('refreshMemberData');
							this.refs.toast.show('操作成功', DURATION.LENGTH_SHORT);
							// DeviceEventEmitter.emit('noticeChatPage', {body: tempSigleBody, type: 'text'});
							this.props.navigation.goBack();
						}
					});
				} else {
					let refreshFlag = 0;
					this.state.checkedList.map((item) => {
						let params = {
							uuId: this.state.uuid,
							ticket: this.state.ticket,
							roomJid: this.state.room.roomJid ? this.state.room.roomJid : _newGroupId.substring(0, _newGroupId.indexOf('@')),
							occupantJid: item.peopleId,
							userId: this.state.basic.userId
						};
						FetchUtil.netUtil(Path.inviteFriends + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (responseJson) => {
							refreshFlag++;

                            if (responseJson == 'tip') {
                                DeviceEventEmitter.emit('changeLoading', 'false');
                                this._toast(" 邀请人员失败！ ");
                            }else if (JSON.stringify(responseJson.status) == 'true' && JSON.stringify(responseJson.code) == '200' && refreshFlag == this.state.checkedList.length) {
								DeviceEventEmitter.emit('refreshGroupList');
								DeviceEventEmitter.emit('refreshGroupDetail');
								DeviceEventEmitter.emit('changeChatHead');
								DeviceEventEmitter.emit('refreshMemberData');
								this.refs.toast.show('操作成功', DURATION.LENGTH_SHORT);
								// DeviceEventEmitter.emit('refreshPage', 'refresh');
								this.setState({
									commitBtnFlag: true
								});
								DeviceEventEmitter.emit('changeLoading', 'false');
								this.props.navigation.goBack();
							}
						});
					});
					// DeviceEventEmitter.emit('noticeChatPage', {body: tempSigleBody, type: 'text'});
				}

			}

		}

	}

	_compareNum = (resultFlag, total) => {
		if (resultFlag == total) {
			this.props.navigation.goBack();
			DeviceEventEmitter.emit('refreshGroupDetail');
		}
	};

	_removeFriend = () => {
		if(this.state.checkedList.length > 0){
            XmppUtil.xmppIsConnect(()=>{
                DeviceEventEmitter.emit('changeLoading', 'true');
                let chooses = [];
                this.state.checkedList.map((item)=>{
                    chooses.push(item.peopleId);
                });
                let params = {
                    roomJid: this.state.room.roomJid,
                    occupantJids: JSON.stringify(chooses),//.replace('[','').replace(']','').replace(/"/g,''),
                    currendFullJid: Global.loginUserInfo.jid+'/'+Global.loginResource
                };
                FetchUtil.netUtil(Path.newRemoveMembers,params,'POST',this.props.navigation,Global.basicParam,(res)=>{
                    if (res == 'tip') {
                        DeviceEventEmitter.emit('changeLoading', 'false');
                        this._toast(" 移除人员失败！ ");
                    }else if (res.code.toString() == '200') {
                        DeviceEventEmitter.emit('changeLoading', 'false');
                        // DeviceEventEmitter.emit('noticeChatPage', {body: tempSigleBody, type: 'text'});
                        DeviceEventEmitter.emit('refreshGroupDetail');
                        DeviceEventEmitter.emit('refreshGroupList');
                        DeviceEventEmitter.emit('changeChatHead');
                        DeviceEventEmitter.emit('refreshPage', 'refresh');
                        DeviceEventEmitter.emit('refreshMemberData');
                        this.props.navigation.goBack();
                    }
                });
            },(error)=>{
                this.setState({
                    showAlert: true,//alert框
                    tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
                });
            });
		}else{
			this._toast('请选择被移除成员!');
		}
	};

	_menuClick = () => {
		this._searchFriendInputBox.blur();
		if (this.state.pageType == 'create') {
			this._createGroupInputBox.blur();
		}

		this.setState({isCollapsed: !this.state.isCollapsed});
	}

	render() {
		const isCollapsedCOLOR = '#898989';
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={this.state.pageType == 'create' ? '创建群聊' : this.state.pageType == 'add' ? '邀请成员' : '移除成员'}
				/>
				<View style={{
					flexDirection: 'row',
					margin: 8,
					backgroundColor: '#FFFFFF',
					borderWidth: 1,
					borderRadius: 6,
					borderColor: '#CCCCCC'
				}}>
					<View style={{flex: 1}}>
						<TextInput
							ref={(TextInput) => this._searchFriendInputBox = TextInput}
							style={{
								height: 30,
								backgroundColor: '#FFFFFF',
								borderColor: 'transparent',
								borderWidth: 1,
								borderRadius: 6,
								paddingTop: 0,
								paddingBottom: 0,
								paddingLeft: 8,
								paddingRight: 8
							}}
							placeholderTextColor={'#CCCCCC'}
							placeholder={'搜索...'}
							underlineColorAndroid={'transparent'}
							multiline={false}
							returnKeyType={'search'}
							onSubmitEditing={this._searchFriend}
							onChangeText={(text) => this._setSearchText(text)}
							value={this.state.searchText}
						/>
					</View>
					<TouchableOpacity onPress={this._searchFriend}>
						<View style={{width: 25, height: 30, justifyContent: 'center'}}>
							<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
						</View>
					</TouchableOpacity>
				</View>
				<View style={{flex: 1}}>
					{
						this.state.pageType == 'create' ? (
							<View>
								<View style={{
									backgroundColor: '#e2e2e2',
									paddingLeft: 12,
									height: 30,
									justifyContent: 'center'
								}}><Text style={{color: '#919191'}}>{'填写信息'}</Text></View>
								<View style={{paddingLeft: 12, paddingRight: 12}}>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										borderBottomWidth: 1,
										borderBottomColor: '#DDDDDD',
										height: 50,
									}}>
										<Text style={{marginRight: 8}}>{'群名称'}</Text>
										<TextInput
											ref={(TextInput) => this._createGroupInputBox = TextInput}
											style={{
												flex: 1,
												height: 35,
												backgroundColor: '#FFFFFF',
												borderColor: 'transparent',
												borderWidth: 1,
												borderRadius: 4,
												paddingTop: 0,
												paddingBottom: 0,
												paddingLeft: 8,
												paddingRight: 8,
											}}
											maxLength={16}
											placeholderTextColor={'#CCCCCC'}
											placeholder={'请输入群名称'}
											underlineColorAndroid={'transparent'}
											multiline={false}
											onChangeText={(text) => this._setGroupName(text)}
											value={this.state.groupName}
										/>
									</View>
									<View style={{flexDirection: 'row', alignItems: 'center', height: 50}}>
										<Text style={{marginRight: 8}}>{'是否审核'}</Text>
										<View style={{flex: 1, height: 35, justifyContent: 'center'}}>
											<Switch
												value={this.state.isNeed}
												onValueChange={(value) => this.setState({isNeed: value})}
											/>
										</View>
									</View>
								</View>
							</View>
						) : null
					}
					{
						this.state.pageType != 'cut' ? <TouchableOpacity style={{
							height: 50, alignItems: 'center', paddingLeft: 8, paddingRight: 8, borderTopWidth: 1,
							borderTopColor: '#dddddd', flexDirection: 'row'
						}} onPress={() => {
							this._searchFriendInputBox.blur();

							if (this.state.pageType == 'create') {
								this._createGroupInputBox.blur();
							}

							const list = this.state.basicMemberList;
							for (let i in list) {
								list[i].jidNode = list[i].occupantJid;
								list[i].trueName = list[i].occupantTrueName;
							}
							this.setState({
								basicMemberList: list
							}, this.showParticipantsList);
						}}>
							<Image source={require('../../images/icon_addr.png')}
							       style={{width: 32, height: 32, marginRight: 10, borderRadius: 4}}/>
							<Text style={{fontSize: 15}}>通讯录</Text>
						</TouchableOpacity> : null
					}
					{
						this.state.pageType != 'cut' ? <TouchableOpacity style={styles.createMenu} onPress={this._menuClick}>
							<Text style={{color: '#919191', flex: 1}}>{'已选联系人'}</Text>
							<Text style={{
								fontSize: 12,
								color: '#9d9d9d',
								marginRight: 10
							}}>{this.state.selectedParticipants.length}</Text>
							{
								this.state.isCollapsed ? <Icons name={'ios-arrow-dropdown'} size={25} color={isCollapsedCOLOR}/> :
									<Icons name={'ios-arrow-dropright'} size={25} color={isCollapsedCOLOR}/>
							}
						</TouchableOpacity> : null
					}
					{
						this.state.isCollapsed ? <View style={{flex: 1}}>
							<ScrollView
								showsVerticalScrollIndicator={false}
								showsHorizontalScrollIndicator={false}
								style={{paddingLeft: 10, paddingRight: 10}}>
								{
									this.state.selectedParticipants.map((item, index) => {
										return <View key={index} style={{
											flexDirection: 'row',
											alignItems: 'center',
											borderTopColor: index == 0 ? 'transparent' : '#d7d7d7',
											borderTopWidth: 1
										}}>
											<Image
												source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&jidNode=' + item.jidNode + '&sourceType=singleImage' + '&imageName=' + (item.photoId ? item.photoId : item.occupantPhotoId) + '&imageId=' + (item.photoId ? item.photoId : item.occupantPhotoId)}}
												style={{
													width: 36,
													height: 36,
													borderRadius: Platform.OS == 'ios' ? 18 : 36,
													marginRight: 10
												}}/>
											<Text style={{
												flex: 1,
												fontSize: 15,
												color: '#333'
											}}>{item.trueName ? item.trueName : item.occupantTrueName}</Text>
											<TouchableOpacity style={{
												width: 50,
												height: 50,
												marginLeft: 10,
												marginRight: 6,
												alignItems: 'flex-end',
												justifyContent: 'center'
											}} onPress={() => {
												let selectedParticipants = this.state.selectedParticipants;
												for (let i in selectedParticipants) {
													if (item.jidNode == selectedParticipants[i].jidNode) {
														selectedParticipants.splice(i, 1);
													}
												}
												let checkedList = this.state.checkedList;
												for (let j in checkedList) {
													if (item.jidNode == checkedList[j].peopleId) {
														checkedList.splice(j, 1);
													}
												}
												this._onChecked(item.jidNode ? item.jidNode : item.occupantJid);
											}}>
												<Icons name={'ios-close'} size={32} color={'#f00'}/>
											</TouchableOpacity>
										</View>
									})
								}
							</ScrollView>
						</View> : null
					}
					<TouchableOpacity disabled={this.state.pageType == 'cut' ? true : false} style={styles.createMenu}
														onPress={this._menuClick}>
						<Text style={{color: '#919191', flex: 1}}>{this.state.pageType != 'cut' ? '常用联系人' : '群成员'}</Text>
						{
							this.state.pageType != 'cut' ? (
								!this.state.isCollapsed ? <Icons name={'ios-arrow-dropdown'} size={25} color={isCollapsedCOLOR}/> :
									<Icons name={'ios-arrow-dropright'} size={25} color={isCollapsedCOLOR}/>
							) : null
						}
					</TouchableOpacity>
					{
						!this.state.isSearch ?
							(!this.state.isCollapsed ? <View style={{flex: 1}}>
							<ScrollView
								ref={(scrollView) => {
									this._scrollView = scrollView;
								}}
								automaticallyAdjustContentInsets={true}
								scrollEventThrottle={200}
								onContentSizeChange={() => {
									// this._scrollView.scrollToEnd(true);
								}}
								// keyboardShouldPersistTaps={'always'}
								showsVerticalScrollIndicator={false}
								showsHorizontalScrollIndicator={false}
							>
								{this._renderFriendItem()}
							</ScrollView>
						</View> : null) : (<View style={{flex: 1, alignItems: 'center', paddingTop: 20}}><Text
								style={{color: '#aaaaaa'}}>{'暂无相关数据'}</Text></View>)
					}
				</View>
				{this.state.commitBtnFlag ? (
					<CustomBtn
						onBtnPressCallback={this.state.pageType == 'create' ? this._createGroup : this.state.pageType == 'add' ? this._inviteGroup : this._removeFriend}
						btnText={this.state.pageType == 'create' ? '立即创建' : this.state.pageType == 'add' ? '确认邀请' : '确认移除'}
						btnStyle={styles.commitBtn}
					/>
				) : (
					<View style={styles.commitBtn}>
						<Text
							style={{color: '#FFFFFF'}}>{this.state.pageType == 'create' ? '立即创建' : this.state.pageType == 'add' ? '确认邀请' : '确认移除'}</Text>
					</View>
				)}

				{
					this.state.isParticipants ? <ParticipantsList
						infor={{
							uuid: this.state.uuid,
							basic: this.state.basic,
							ticket: this.state.ticket,
							selectedParticipants: this.state.selectedParticipants,//传入当前选中的可操作人员
							selectedNot: this.state.basicMemberList,//传入不可进行操作人员，需在选择页面进行预览，没有时传入“[]”
							type: 'invite'//用于判断是否为邀请人
						}}
						cancelParticipants={() => {//返回执行
							this.setState({isParticipants: false});
						}}
						selectedParticipants={this._postPeople}//确定执行
						title="添加群成员"
					/> : null
				}
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
			</View>
		)
	}

	showParticipantsList = () => {
		this.setState({isParticipants: true});
	}

	_postPeople = (info) => {
		let checkList = this.state.checkedList;
		let dataBody = this.state.dataSource;
		info.map((item) => {
			for (let i in dataBody) {
				if (item.jidNode == dataBody[i].jidNode) {
					dataBody[i].checked = true;
				}
			}
			item.checked = true;
			let postPeopleType = true;
			for (let key in checkList) {
				if (checkList[key].peopleId == item.jidNode) {
					postPeopleType = false;
				}
			}
			if (postPeopleType) {
				checkList.push({
					peopleId: item.jidNode,
					uname: item.trueName
				});
			}
		});
		this.setState({
			isParticipants: false,
			selectedParticipants: info,
			checkedList: checkList,
			dataSource: dataBody
		});
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	createMenu: {
		backgroundColor: '#e2e2e2',
		paddingLeft: 12,
		paddingRight: 12,
		height: 40,
		alignItems: 'center',
		flexDirection: 'row',
		marginBottom: 1
	},
	commitBtn: {
		height: 43,
		borderRadius: 4,
		backgroundColor: '#549dff',
		justifyContent: 'center',
		alignItems: 'center',
		margin: 14,
		marginLeft: 12,
		marginRight: 12
	}
});
