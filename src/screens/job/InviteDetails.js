/*
* 工作邀请详情页
* */
import React, {Component} from 'react';
import {
	StyleSheet, Text, View, Modal,
	Platform, TouchableOpacity, Dimensions, Image, ScrollView, FlatList, Alert, TextInput,
	ActivityIndicator, ART, BackHandler, DeviceEventEmitter, TouchableWithoutFeedback, NativeModules
} from 'react-native';
import Header from '../../component/common/Header';
import BottomMenu from '../../component/common/BottomMenu';
import Icons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Material from 'react-native-vector-icons/MaterialCommunityIcons';
import MyWebView from 'react-native-webview-autoheight';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import ParticipantsList from './ParticipantsList';
import cookie from '../../util/cookie';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import fileTypeReturn from '../../util/FileType';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';
import Toast, {DURATION} from 'react-native-easy-toast';
import OpenFile from 'react-native-doc-viewer';
import UUIDUtil from "../../util/UUIDUtil";
import XmlUtil from "../../util/XmlUtil";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import ToolUtil from "../../util/ToolUtil";
import AwesomeAlert from "react-native-awesome-alerts";
//import Pdf from 'react-native-pdf';
import PermissionUtil from "../../util/PermissionUtil";
import Global from "../../util/Global";
/*const Pdf = Platform.select({
	ios: () => null,
	//android: () => require('react-native-pdf'),
})();*/
import Pdf from 'react-native-pdf';

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

const {height, width} = Dimensions.get('window');
const {Surface, Shape} = ART;
const path = ART.Path().moveTo(1, 1).lineTo(width - 20, 1);
const SCREEN = width < 600 ? 8 : 10;
const MARGIN = (SCREEN - 2) * 20;
const headSize = (width - MARGIN) / SCREEN;
let commentPage = 1;

export default class InviteDetails extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			inviteID: props.navigation.state.params.inviteID,
			inviteHead: [],//参与人员详情显示列表
			updateFiles: [],//上传文件列表
			commentList: [],//评论列表
			pageNum:1,//评论当前页数
			totalPage:0,//评论总页数
			selectedParticipants: [],//参与人员列表
			jobInvitation: {},//详情信息
			fileName: props.navigation.state.params.fileName ? props.navigation.state.params.fileName : '',
			commentUserID: '',//评论id记录
			replyUserID: '',//回复对应id记录
			inviteContent: '',//评论内容
			inviteReplyContent: '',//回复内容
			placeholder: '',//评论框占位文字
			commentPid: 0,//评论回复对应id
			replyCommentType: false,//是否为回复
			isParticipants: false,//是否显示选人页面
			isAttachment: false,//是否有评论附件
			updateFileShowList: props.navigation.state.params.updateFileShowList ? props.navigation.state.params.updateFileShowList : [],
			lookImages: [],//图片附件
			lookChooseId: null,//显示图片id
			isModalVisible: false,//预览图片modal
			animating: true,
			notSelect: [],
			isComplate: false,//switch是否可变
			isComplateValue: props.navigation.state.params.isComplateValue ? props.navigation.state.params.isComplateValue : false,//switch的值,
			rejuectReason: '',//拒绝工作邀请的理由
			rejuectBoxModal: false,//拒绝原因输入框Modal显示
			jobParticipants: [],//邀请的人员数组
			fileAnimating: false,//文件预览动画
			pdfModalVisible: false,//pdf预览Modal
			pdfInsideModalVisible: false,//pdf里面的Modal
			source: {uri: '', cache: true},//pdf
			currentPersonJobdetail: {},//当前登录人的工作邀请详情
			chooseShowModalVisible: false,//文件预览Modal
			viewFile: {},//被预览文件对象
			flagBtn: true,//是否显示可点击按钮
			showAlert: false,//alert框
			tipMsg: '',//alert提示信息
			footLoading: true,//是否可刷新
			jobInviteState:'true',//工作邀请同意拒绝,拒绝不显示评论
		}
	}

	componentDidMount() {
		this._getInviteDetails();

		if (Platform.OS == 'android') {

//			this.groupIq = XMPP.on('iq', (iq) => this._XMPPdidReceiveIQ(iq));
		}

		DeviceEventEmitter.addListener('jobState', (param) => {
            this.setState({
                jobInviteState: param == 'true' ? true : false
            })
        });

	};

	_XMPPdidReceiveIQ = (iq) => {

		if (iq.type == 'result' && this.invitePeopleNodeStatue) {

			this.state.jobParticipants.map((id) => {
				//发送订阅
				let sendReadIqToGroup = XmlUtil.subscriptionToGroup(id + '@' + Path.xmppDomain, this.join);
				XMPP.sendStanza(sendReadIqToGroup);
			});

			this.invitePeopleNodeStatue = false;
			this.invitePeopleReadStatue = true;
		}

		if (iq.type == 'result' && this.invitePeopleReadStatue) {

			this.state.jobParticipants.map((id) => {
				//发布消息
				let sendGroup = XmlUtil.sendMessageInviteWorkGroup(id, this.state.basic.jid, this.join, 'WORKINVITATION');
				XMPP.sendStanza(sendGroup);
			});
			this.invitePeopleReadStatue = false;
		}

		if (iq.type == 'result' && this.commentNodeStatue) {

			this.commentUserIds.map((id) => {
				//发送订阅
				let sendReadIqToGroup = XmlUtil.subscriptionToGroup(id + '@' + Path.xmppDomain, this.join);
				XMPP.sendStanza(sendReadIqToGroup);
			});

			this.commentNodeStatue = false;
			this.commentReadStatue = true;
		}

		if (iq.type == 'result' && this.commentReadStatue) {

			this.commentUserIds.map((id) => {
				//发布消息
				let sendGroup = XmlUtil.sendMessageInviteWorkGroup(id, this.state.basic.jid, this.join, 'WORKINVITATION');
				XMPP.sendStanza(sendGroup);
			});
			this.commentUserIds = [];
			this.commentReadStatue = false;
		}


		if (iq.type == 'result' && this.agreeInviteNodeStatue) {

			this.inviteIDs.map((id) => {
				//发送订阅
				let sendReadIqToGroup = XmlUtil.subscriptionToGroup(id + '@' + Path.xmppDomain, this.join);
				XMPP.sendStanza(sendReadIqToGroup);
			});

			this.agreeInviteNodeStatue = false;
			this.agreeInvitePeopleReadStatue = true;
		}

		if (iq.type == 'result' && this.agreeInvitePeopleReadStatue) {

			this.inviteIDs.map((id) => {
				//发布消息
				let sendGroup = XmlUtil.sendMessageInviteWorkGroup(id, this.state.basic.jid, this.join, 'WORKINVITATION');
				XMPP.sendStanza(sendGroup);
			});
			this.commentUserIds = [];
			this.agreeInvitePeopleReadStatue = false;
		}
	};


	componentWillUnmount() {
		commentPage = 1;
	}

	onBackAndroid = () => {
		if (this.state.isParticipants) {
			this.setState({isParticipants: false});
		} else {
			this.jobBack.remove();
			this.props.navigation.goBack();
		}
		return true;
	}

	_getInviteDetails = () => {
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			jidNode: this.state.basic.jidNode,
			jobInvitationId: this.state.inviteID
		}
		FetchUtil.netUtil(Path.getInviteDetails + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, (data) => {

			if (data == "tip") {
				this.refs.toast.show('详情获取失败！', DURATION.LENGTH_SHORT);
			} else if (data.code.toString() == '200') {
			    DeviceEventEmitter.emit('inviteAddPage');
				let res = data.data.detail,
					arrey = [];

                //待接收  已拒绝不显示评论
				if(res.jobInvitation.invitation=="2"||res.jobInvitation.invitation=="0"){
                    DeviceEventEmitter.emit('jobState', 'false');
                }else{
                    DeviceEventEmitter.emit('jobState', 'true');
                }

				for (let i in res.listTopicAttachment) {
					if (fileTypeReturn.fileTypeSelect(res.listTopicAttachment[i].fileName) == 'img') {
						arrey.push({url: Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&attId=' + res.listTopicAttachment[i].id});
					}
				}
				let memberlist = res.listJobParticipants;
				for (let i in memberlist) {
					memberlist[i].trueName = memberlist[i].nickName;
					memberlist[i].jidNode = memberlist[i].createUser;
				}

				if (this.state.basic.jidNode == res.jobInvitation.createUser) {
					memberlist.push({more: true});
				}

				let tempCompelate = '0';
				res.listJobParticipants.map((item) => {
					if (item.jidNode == this.state.basic.jidNode) {
						tempCompelate = item.complete;
					}
				});

				this.setState({
					jobInvitation: res.jobInvitation,
					commentUserID: res.jobInvitation.createUser,
					inviteHead: memberlist,
					updateFiles: res.listTopicAttachment,
					lookImages: arrey,
					notSelect: memberlist,
					currentPersonJobdetail: data.data.detail.jobParticipants,
					flagComplate: tempCompelate == '1' ? true : false,
					isComplate: tempCompelate == '1' ? true : this.props.navigation.state.params.isComplate ? props.navigation.state.params.isComplate : false,
					isComplateValue: tempCompelate == '1' ? true : this.props.navigation.state.params.isComplateValue ? props.navigation.state.params.isComplateValue : false
				}, () => {
					this._getCommentList(1);
				});
			}
		});
	};

	//获取工作邀请评论列表
	_getCommentList = (pageNum) => {
		let params = {
			jobInvitationId:this.state.inviteID,
			pageNum: pageNum,
			pageSize: 5,
			ticket: Global.basicParam.ticket,
			uuId: Global.basicParam.uuId,
			userId: Global.basicParam.userId
		};
		FetchUtil.netUtil(Path.getInviteDiscussList + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (res) => {
			if (res == "tip") {
				this.refs.toast.show('评论获取失败！', DURATION.LENGTH_SHORT);
			} else if (res.code.toString() == '200') {
				if(res.data.page.recordList.length > 0 ){
					let type = false;
					for (let i in res.data.page.recordList) {
						let item = res.data.page.recordList[i];
						if (item.listTopicAttachment.length > 0) {
							type = true;
							break;
						}
					}
					this.setState({
						commentList: pageNum == 1 ? res.data.page.recordList : this.state.commentList.concat(res.data.page.recordList),
						pageNum: res.data.page.currentPage,
						totalPage: res.data.page.totalPage,
						isAttachment: type,
						footLoading: false,//是否可刷新
					});
				}
			}
		})
	};

//处理评论样式
	_renderCommentList = ({item, index}) => {
		const { jobInvitation } = this.state;
		return (
			<View key={index}
						style={[styles.inviteGroup, index == 0 ? {borderTopColor: 'transparent'} : null]}>
				<TouchableOpacity onPress={() => {
					HandlerOnceTap(
						() => {
							this.props.navigation.navigate('FriendDetail', {
								ticket: this.state.ticket,
								uuid: this.state.uuid,
								friendJidNode: item.fromUser,
								tigRosterStatus: 'both',
								basic: this.state.basic
							});
						}
					)
				}}>
					<Image
						source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.photoId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode='}}
						style={styles.inviteHeadImg}/>
				</TouchableOpacity>
				<View style={{flex: 1, marginLeft: 10}}>
					<View style={{flexDirection: 'row'}}>
						<Text style={{
							fontSize: 15,
							color: '#333',
							flex: 2
						}}>{item.toUserName != '' ? `${item.fromUserName} 评论 ${item.toUserName}` : `${item.fromUserName} 发表`}</Text>
						{
							item.listTopicAttachment.length > 0 ? <TouchableOpacity
								onPress={() => {
									HandlerOnceTap(
										() => {
											BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
											this.props.navigation.navigate('DiscussAttachList', {
												ticket: this.state.ticket,
												uuid: this.state.uuid,
												basic: this.state.basic,
												inviteID: jobInvitation.id,
												searchAttachId: item.id
											});
										}
									)
								}} style={{marginBottom: 5, flex: 1, alignItems: 'flex-end'}}>
								<Feather name={'paperclip'} size={20} color={'#a7a7a7'}/>
							</TouchableOpacity> : null
						}
						{item.complete == '1' ? (
							<View
								style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
								<Text style={{fontSize: 10, marginRight: 5}}>{'设置为完成'}</Text>
								{this.state.basic.jidNode == jobInvitation.createUser ? (
									<TouchableOpacity onPress={() => {
										HandlerOnceTap(
											() => {
												this._restartJob(item.id);
											}
										)
									}}>
										{new Date(jobInvitation.id && jobInvitation.endTime.replace(/-/g, '/')).getTime() - new Date().getTime() > 0 ? (
											<Material name={'restart'} size={16} color={'#3498db'}/>) : null}
									</TouchableOpacity>
								) : null}
							</View>
						) : null}
					</View>
					{(jobInvitation.invitation == '1' || jobInvitation.invitation == '') && new Date(jobInvitation.id && jobInvitation.endTime.replace(/-/g, '/')).getTime() - new Date().getTime() > 0 && jobInvitation.complete == 0 ? (
						<TouchableWithoutFeedback onPress={() => {
							HandlerOnceTap(
								() => {
									this.setState({
										replyUserID: item.fromUser,
										commentPid: item.id,
										replyCommentType: true,
										// inviteContent: ''
									}, () => {
										this.refs.commentInput.focus();
									});
								}
							)
						}}>
							<View>
								<View style={{flex: 1, marginTop: 3, marginBottom: 3}}>
									<Text style={{fontSize: 15}}>{item.content}</Text>
								</View>
								<View
									style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
									<Text style={{
										flex: 1,
										textAlign: 'right',
										color: '#bdc3c7',
										fontSize: 10,
										marginRight: 5
									}}>{item.createTime}</Text>
									<Text style={{fontSize: 13, color: '#3498db'}}>回复</Text>
								</View>
							</View>
						</TouchableWithoutFeedback>
					) : (
						<View>
							<Text style={{fontSize: 15}}>{item.content}</Text>
							<Text style={{
								flex: 1,
								textAlign: 'right',
								color: '#bdc3c7',
								fontSize: 13
							}}>{item.createTime}</Text>
						</View>
					)}
				</View>
			</View>
		)
	};

	submitJobComplete = (jobInvitationId) => {

		let url = Path.completeJob;// + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {jobInvitationId: jobInvitationId}, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, (responseJson) => {
			this._getInviteDetails();
			DeviceEventEmitter.emit('inviteAddPage');
			if (responseJson == "tip") {
				this._toast('设置完成失败！');
				// this.refs.toast.show('详情获取失败！', DURATION.LENGTH_SHORT);
			} else if (responseJson.data.status != 'Success') {
				switch (responseJson.data.code) {
					case '00':
						this._toast('该工作已确认完成，不能进行操作！');
						break;
					case '01':
						this._toast('该工作已超时，不能进行操作！');
						break;
					default:
						this._toast('错误码没有定义！');
				}
			}
		})
	};

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
								this._getCommentList(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if(this.state.commentList.length > 0){
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
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
			rejuectBoxModal: false,
			showAlert: true,//alert框
			tipMsg: text//alert提示信息
		});
	};

	render() {
		const {jobInvitation, showAlert, tipMsg, commentList} = this.state;
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
						// this._getInviteDetails();
						// DeviceEventEmitter.emit('inviteAddPage');
					}}
				/>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
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
							onError={(error) => {
								this.setState({pdfInsideModalVisible: false})
							}}
							enablePaging={false}
							onPageSingleTap={() => {
								this.setState({pdfModalVisible: false})
							}}
							activityIndicator={() => {
								return null;
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
				{jobInvitation ? (
					<View style={{flex: 1}}>
						<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
						<Header
							headLeftFlag={true}
							onPressBackBtn={() => {
								this.props.navigation.goBack();
							}}
							backTitle={'返回'}
							title={'邀请详情'}
						/>
						{jobInvitation.nickName ? (
						    <ScrollView
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                                style={{flex: 1}}>
                                <View style={styles.inviteInfor}>
                                    <Text style={styles.inforTitle}>{jobInvitation.title ? jobInvitation.title : ''}</Text>
                                    <MyWebView
                                        style={{width: width - 20, marginTop: 10, marginBottom: 10, backgroundColor: '#f0f0f0',minHeight:200}}
                                        startInLoadingState={true}
                                        source={{html: this.getStaticHtml(jobInvitation.content), baseUrl: ''}}/>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Image
                                            source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + jobInvitation.photo + '&imageId=' + jobInvitation.photo + '&sourceType=singleImage&jidNode='}}
                                            style={{width: 30, height: 30, marginRight: 10}}/>
                                        <View style={{flex: 1}}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#999'
                                                }}>{jobInvitation.nickName ? jobInvitation.nickName : ''}发起</Text>
                                            <Text style={{
                                                flex: 1,
                                                color: '#999',
                                                fontSize: 12,
                                            }}>需在 <Text
                                                style={{color: '#ff3b2d'}}>{jobInvitation.endTime ? jobInvitation.endTime : ''}</Text> 前完成</Text>
                                        </View>
                                        {jobInvitation.createUser == this.state.basic.jidNode && new Date(jobInvitation.endTime.replace(/-/g, '/')).getTime() - new Date().getTime() > 0 ? (
                                            <TouchableOpacity
                                                style={[styles.btn, {justifyContent: 'flex-end'}, jobInvitation.complete == 1 ? {backgroundColor: '#ccc'} : null]}
                                                onPress={() => {
                                                    HandlerOnceTap(
                                                        () => {
                                                            if (jobInvitation.complete == 0) {
                                                                this.submitJobComplete(jobInvitation.id)
                                                            }
                                                        }
                                                    )
                                                }}>
                                                <Text style={{
                                                    fontSize: 14,
                                                    color: '#fff'
                                                }}>{'完成'}</Text>
                                            </TouchableOpacity>) : null}
                                    </View>
                                </View>
                                <View style={styles.inviteBox}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <View style={{flex: 1}}>
                                            <FlatList
                                                keyExtractor={(item, index) => String(index)}
                                                numColumns={(SCREEN - 1)}
                                                data={this.state.inviteHead}
                                                renderItem={this._inviteHeadItem}
                                                scrollEnabled={false}/>
                                        </View>
                                        <View style={{justifyContent: 'center'}}>
                                            <Text style={{
                                                fontSize: 12,
                                                color: '#717171'
                                            }}>{this.state.inviteHead.length == 0 ? 0 : (this.state.basic.jidNode == jobInvitation.createUser ? this.state.inviteHead.length - 1 : this.state.inviteHead.length)}人参与</Text>
                                        </View>
                                    </View>
                                    <View style={styles.separator}/>
                                    <FlatList
                                        keyExtractor={(item, index) => String(index)}
                                        data={this.state.updateFiles}
                                        renderItem={this._updateFilesItem}
                                        ItemSeparatorComponent={() => <View style={styles.separator}/>}
                                        ListEmptyComponent={() => <Text style={{textAlign: 'center', margin: 10}}>无上传附件</Text>}
                                        scrollEnabled={false}/>
                                </View>
                                <View
                                    style={[styles.inviteBox, {backgroundColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center'}]}>
                                    <Text style={[styles.inviteTitle, {flex: 1}]}>用户讨论</Text>
                                    {
                                        this.state.isAttachment ? <TouchableOpacity
                                            onPress={() => {
                                                HandlerOnceTap(
                                                    () => {
                                                        BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
                                                        this.props.navigation.navigate('DiscussAttachList', {
                                                            ticket: this.state.ticket,
                                                            uuid: this.state.uuid,
                                                            basic: this.state.basic,
                                                            inviteID: jobInvitation.id
                                                        });
                                                    }
                                                )
                                            }}>
                                            <Text style={{fontSize: 14, color: '#717171'}}>全部附件</Text>
                                        </TouchableOpacity> : null
                                    }
                                </View>
                                    {this.state.jobInviteState == true? <View style={[styles.inviteBox, {flex: 1}]}>
                                         <FlatList
                                             data={commentList}
                                             renderItem={this._renderCommentList}
                                             keyExtractor={(item, index) => String(index)}
                                             extraData={this.state}
                                             showsVerticalScrollIndicator={false}
                                             showsHorizontalScrollIndicator={false}
                                             ListFooterComponent={()=>this._renderFooter()}
                                             ListEmptyComponent={() => <Text style={{textAlign: 'center', margin: 10}}>还没有评论</Text>}
                                         />
                                         </View>:null}
                            </ScrollView>
						): null}

						{(jobInvitation.invitation == '1' || jobInvitation.invitation == '') && ToolUtil.strToStemp(jobInvitation.endTime) - new Date().getTime() > 0 && jobInvitation.complete == 0 ? (
							<View>
								<View style={styles.inviteComment}>
									<TextInput
										ref={'commentInput'}
										style={styles.inviteCommentInput}
										multiline={true}
										value={this.state.inviteContent}
										onChangeText={(text) => {
											if (ToolUtil.strToStemp(jobInvitation.endTime) - new Date().getTime() > 0) {
												this.setState({
													inviteContent: text
												})
											} else {
												this._getInviteDetails();
												DeviceEventEmitter.emit('inviteAddPage');
												this._toast('工作邀请已过期');
											}
										}
										}
										onBlur={() => {
											this.setState({
												// inviteContent: '',
												// inviteReplyContent: '',
												commentPid: 0,
												replyCommentType: false,
											})
										}}
										placeholder={'请输入评论内容'}
										underlineColorAndroid={'transparent'}
									/>
									<TouchableOpacity style={styles.btn} onPress={() => {
										HandlerOnceTap(this._inviteComment)
									}}>
										<Text style={{fontSize: 14, color: '#fff'}}>发送</Text>
									</TouchableOpacity>
									<TouchableOpacity style={[styles.btn, {position: 'relative', overflow: 'visible'}]} onPress={() => {
										this.props.navigation.navigate('InviteSub', {
											jobInvitation: this.state.jobInvitation,
											updateFileShowList: this.state.updateFileShowList,//上传附件列表
											isComplate: this.state.isComplate, //switch是否可变
											isComplateValue: this.props.navigation.state.params.isComplateValue ? this.props.navigation.state.params.isComplateValue : this.state.isComplateValue, //switch的值
										});
									}}>
										{
											this.state.updateFileShowList.length > 0 ? <Text style={{
												position: 'absolute',
												right: 0,
												top: 0,
												borderRadius: 10,
												width: 10,
												height: 10,
												backgroundColor: 'tomato',
												color: 'white',
												textAlign: 'center',
												lineHeight: 10,
												fontSize: 8,
											}}>{this.state.updateFileShowList.length}</Text> : null
										}

										<Text style={{fontSize: 14, color: '#fff'}}>编辑</Text>
									</TouchableOpacity>
								</View>
							</View>
						) : new Date(jobInvitation.id && jobInvitation.endTime.replace(/-/g, '/')).getTime() - new Date().getTime() > 0 && jobInvitation.invitation == '0' && jobInvitation.complete == 0 ? (
							<View style={{
								flexDirection: 'row',
								padding: 2,
								justifyContent: 'space-around',
								height: 50,
								alignItems: 'center'
							}}>
								{this.state.flagBtn ? (
									<TouchableOpacity style={{
										width: 100,
										height: 35,
										backgroundColor: '#2ecc71',
										borderRadius: 4,
										justifyContent: 'center',
										alignItems: 'center'
									}} onPress={() => {
										HandlerOnceTap(this._judgeJob.bind(this, true));
										DeviceEventEmitter.emit('jobState', 'true');

									}}>
										<Text style={{fontSize: 14, color: '#fff'}}>同意</Text>
									</TouchableOpacity>
								) : (
									<View style={{
										width: 100,
										height: 35,
										backgroundColor: '#ced6e0',
										borderRadius: 4,
										justifyContent: 'center',
										alignItems: 'center'
									}}>
										<Text style={{fontSize: 14, color: '#fff'}}>同意</Text>
									</View>
								)}
								{this.state.flagBtn ? (
									<TouchableOpacity style={{
										width: 100,
										height: 35,
										backgroundColor: '#e74c3c',
										borderRadius: 4,
										justifyContent: 'center',
										alignItems: 'center'
									}} onPress={() => {
										HandlerOnceTap(
											() => {
												DeviceEventEmitter.emit('workNew', 'false');
												this.setState({
													rejuectBoxModal: true
												})

											}
										)
									}}>
										<Text style={{fontSize: 14, color: '#fff'}}>拒绝</Text>
									</TouchableOpacity>
								) : (
									<View style={{
										width: 100,
										height: 35,
										backgroundColor: '#ced6e0',
										borderRadius: 4,
										justifyContent: 'center',
										alignItems: 'center'
									}}>
										<Text style={{fontSize: 14, color: '#fff'}}>拒绝</Text>
									</View>
								)}
							</View>
						) : null}
						{
							this.state.isParticipants ? <ParticipantsList
								infor={{
									uuid: this.state.uuid,
									basic: this.state.basic,
									ticket: this.state.ticket,
									selectedParticipants: this.state.selectedParticipants,
									selectedNot: this.state.notSelect,
									type: ''
								}}
								cancelParticipants={() => {
									this.setState({isParticipants: false});
								}}
								selectedParticipants={this._postPeople}
								title="添加参与人员"
							/> : null
						}
					</View>
				) : null}
				<Modal
					visible={this.state.isModalVisible}
					animationType={'none'}
					transparent={true}
					onRequestClose={() => {
						this.setState({isModalVisible: false, animating: false})
					}}
				>
					<View style={{flex: 1}}>
						<ImageViewer
							style={{width: width, height: height}}
							imageUrls={this.state.lookImages}
							enableImageZoom={true}
							index={this.state.lookChooseId}
							flipThreshold={10}
							maxOverflow={0}
							onClick={() => { // 图片单击事件
								this.setState({isModalVisible: false, animating: false})
							}}
							enablePreload={true}//开启预加载
							loadingRender={() => <View
								style={{width: width, height: height, justifyContent: 'center', alignItems: 'center'}}>
								<Image source={require('../../images/loading.png')}/>
							</View>}
							backgroundColor={'#000'}
						/>
					</View>
				</Modal>
				<Modal
					visible={this.state.rejuectBoxModal}
					animationType={'slide'}
					transparent={true}
					onRequestClose={() => {
						this.setState({rejuectBoxModal: false})
					}}
				>
					<View style={Platform.OS ? styles.modal1 : styles.modal2}>
						<View style={{
							padding: 8,
							backgroundColor: '#FFF',
							borderRadius: 4,
							width: width * 0.8,
							height: height / 3,
							justifyContent: 'center',
						}}>
							<TextInput ref="textArea"
												 style={{
													 flex: 1,
													 paddingTop: 2,
													 paddingBottom: 2,
													 minHeight: 35,
													 borderRadius: 4,
													 borderWidth: 1,
													 borderColor: '#bdc3c7',
													 textAlignVertical: 'top'
												 }}
												 numberOfLines={3}
												 multiline={true}
												 underlineColorAndroid={'transparent'}
												 placeholder='请输入拒绝原因'
												 maxLength={100}
												 onChangeText={(text) => {
													 this.setState({
														 rejuectReason: text
													 })
												 }}
												 value={this.state.rejuectReason}
							/>
							<View style={{
								flexDirection: 'row',
								padding: 2,
								justifyContent: 'space-around',
								height: 50,
								alignItems: 'center'
							}}>
								<TouchableOpacity style={{
									width: 80,
									height: 35,
									backgroundColor: '#bdc3c7',
									borderRadius: 4,
									justifyContent: 'center',
									alignItems: 'center'
								}} onPress={() => {
									HandlerOnceTap(
										() => {
											this.setState({
												rejuectBoxModal: false,
												flagBtn: true
											});
										}
									)
								}}>
									<Text style={{fontSize: 14, color: '#fff'}}>取消</Text>
								</TouchableOpacity>
								<TouchableOpacity style={{
									width: 80,
									height: 35,
									backgroundColor: '#3498db',
									borderRadius: 4,
									justifyContent: 'center',
									alignItems: 'center'
								}} onPress={() => {
									HandlerOnceTap(
										() => {
											this.refs.textArea.blur();
											this._judgeJob(false);
											DeviceEventEmitter.emit('jobState', 'false');
										}
										,
										'refuseJob'
									)
								}}>
									<Text style={{fontSize: 14, color: '#fff'}}>确定</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		)
	}

	//添加参与人员
	_postPeople = (info) => {
		let arr = [];
		for (let i in info) {
			arr.push(info[i].jidNode);
		}

		this.setState({
			jobParticipants: arr
		});

		let body = {
			jidNode: this.state.basic.jidNode,
			participants: arr,
			jobInvitationId: this.state.jobInvitation.id,
			currentUid: Global.loginUserInfo.uid,
			pushContent: '您有一条新的工作邀请'
		};

		FetchUtil.netUtil(Path.postInviteAddParticipants, body, 'POST', this.props.navigation, Global.basicParam, (responseJson) => {
			this._getInviteDetails();
			DeviceEventEmitter.emit('inviteAddPage');
			if (responseJson == "tip") {
				this._toast('邀请人员失败！');
				// this.refs.toast.show('详情获取失败！', DURATION.LENGTH_SHORT);
			} else if (responseJson.code.toString() == '200') {
				if (responseJson.data.status == 'Success') {
					// if (Platform.OS == 'ios') {
					// 	XMPP.XMPPInviteWorkNode({
					// 			'uuid': UUIDUtil.getUUID().replace(/\-/g, ''),
					// 			'userJid': this.state.basic.jidNode,
					// 			'inviteJids': arr,
					// 			'type': 'WORKINVITATION',
					// 			'userId': this.state.basic.userId
					// 		},
					// 		(error, event) => {
					// 			if (error) {
					// 				this._toast(error);
					// 			}
					// 		})
					//
					// } else {
					// 	this.join = UUIDUtil.getUUID().replace(/\-/g, '');
					// 	this.invitePeopleNodeStatue = true;
					//
					// 	/*let sendMetuIqToGroup = XmlUtil.createGroupNode(this.state.basic.jidNode, this.join);
					// 	XMPP.sendStanza(sendMetuIqToGroup);*/
					// }

					this.setState({
						isParticipants: false
					});
				} else {
					switch (responseJson.data.code) {
						case '00':
							this._toast('该工作已确认完成，不能进行操作！');
							break;
						case '01':
							this._toast('该工作已超时，不能进行操作！');
							break;
						case '11':
							this._toast('该工作已被重启！');
							break;
						default:
							this._toast('错误码没有定义！');
					}
				}
			}
		});
	}
	//提交评论或回复
	_inviteComment = () => {//提交评论 有pid是回复
		let pid = this.state.commentPid;
		let content = this.state.inviteContent;
		let id = this.state.replyCommentType ? this.state.replyUserID : this.state.commentUserID;
		this.refs.commentInput.blur();
		let body = {
			jidNode: this.state.basic.jidNode,
			jobInvitationId: this.state.jobInvitation.id,
			pid: pid,
			content: content,
			complete: this.state.flagComplate ? '0' : (this.props.navigation.state.params.isComplateValue ? '1' : '0'),
			replayUserJidNode: id,
			fileName: this.props.navigation.state.params.fileName
		};

		if (content.trim() == '' && this.state.updateFileShowList.length == 0) {
			this._toast('发送内容不可为空');
		} else if (content.length > 100) {
			this._toast('评论内容不能超过100个字');
		} else if (ToolUtil.isEmojiCharacterInString(content)) {
			this._toast('评论内容不得含有非法字符');
		} else {
			FetchUtil.netUtil(Path.getInviteComment, body, 'POST', this.props.navigation, {
				ticket: this.state.ticket,
				userId: this.state.basic.userId,
				uuId: this.state.uuid
			}, (responseJson) => {
				this._getInviteDetails();
				DeviceEventEmitter.emit('inviteAddPage');
				if (responseJson == "tip") {
					this._toast('评论失败！');
					// this.refs.toast.show('详情获取失败！', DURATION.LENGTH_SHORT);
				} else if (responseJson.code.toString() == '200') {
					if (responseJson.data.status == 'Success') {
						this.commentUserIds = [];
						this.commentUserIds.push(id);

						// if (Platform.OS == 'ios') {
						//
						// 	XMPP.XMPPInviteWorkNode({
						// 			'uuid': UUIDUtil.getUUID().replace(/\-/g, ''),
						// 			'userJid': this.state.basic.jidNode,
						// 			'inviteJids': this.commentUserIds,
						// 			'type': 'WORKINVITATION',
						// 			'userId': this.state.basic.userId
						// 		},
						// 		(error, event) => {
						// 			if (error) {
						// 				this._toast(error);
						// 			} else if (event) {
						// 				this.commentUserIds = [];
						// 			}
						// 		})
						//
						// } else {
						// 	this.join = UUIDUtil.getUUID().replace(/\-/g, '');
						// 	this.commentNodeStatue = true;
						//
						// 	/*let sendMetuIqToGroup = XmlUtil.createGroupNode(this.state.basic.jidNode, this.join);
						// 	XMPP.sendStanza(sendMetuIqToGroup);*/
						// }

						this.setState({
							inviteContent: '',
							inviteReplyContent: '',
							commentPid: 0,
							replyCommentType: false,
							fileName: '',
							updateFileShowList: []
						});
					} else {
						switch (responseJson.data.code) {
							case '00':
								this._toast('该工作已确认完成，不能进行操作！');
								break;
							case '01':
								this._toast('该工作已超时，不能进行操作！');
								break;
							case '02':
								this._toast('该工作已设置为完成，请重新提交评论！');
								break;
							default:
								this._toast('错误码没有定义！');
						}
					}
				}
			})
		}
	}
	//遍历选中的参与人员方便
	_selectedParticipantsMap = () => {
		this.jobBack = BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
		if(ToolUtil.strToStemp(this.state.jobInvitation.endTime) - new Date().getTime() > 0){
			this.setState({
				selectedParticipants: [],
				isParticipants: true
			});
		}else{
			this._getInviteDetails();
			DeviceEventEmitter.emit('inviteAddPage');
			this._toast('工作邀请已失效');
		}

	}
	//邀请人员遍历
	_inviteHeadItem = ({item, index}) => {
		if (item.more) {
			const path = new ART.Path().moveTo(0, 0).lineTo(0, headSize).lineTo(headSize, headSize).lineTo(headSize, 0).close();
			if (ToolUtil.strToStemp(this.state.jobInvitation.endTime) - new Date().getTime() > 0 && this.state.jobInvitation.complete == '0' && (this.state.jobInvitation.invitation == '1' || this.state.jobInvitation.invitation == '')) {
				return <TouchableOpacity key={index} style={{position: 'relative', marginBottom: 10}}
																 onPress={() => {
																	 HandlerOnceTap(this._selectedParticipantsMap)
																 }}>
					<ART.Surface width={headSize} height={headSize}>
						<ART.Shape d={path} stroke="#999" strokeWidth={2} strokeDash={[10, 10]}/>
					</ART.Surface>
					<View style={styles.headMoreBtn}>
						<Icons name={'ios-add'} size={40} color={'#999'}/>
					</View>
				</TouchableOpacity>
			} else {
				return null;
			}
		} else {
			return <TouchableOpacity
				key={index}
				onPress={() => {
					HandlerOnceTap(
						() => {
							this.props.navigation.navigate('FriendDetail', {
								ticket: this.state.ticket,
								uuid: this.state.uuid,
								friendJidNode: item.createUser,
								tigRosterStatus: 'both',
								basic: this.state.basic
							});
						}
					)
				}}
				style={[styles.inviteHeadImg, index % (SCREEN - 1) < (SCREEN - 2) ? {marginRight: 10} : null]}>
				<Image
					source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.photo + '&imageId=' + item.photo + '&sourceType=singleImage&jidNode='}}
					style={{width: headSize, height: headSize}}/>
			</TouchableOpacity>
		}
	}

	getStaticHtml = (content) => {
		var html = '<!DOCTYPE html><html><head><meta http-equiv="content-type" content="text/html;">';
		html += '<meta name="viewport" content="user-scalable=no"><style>*{margin: 0;padding: 3px 0 3px 0;}p{line-height: 40px;}</style></head>';
		html += '<body style="font-size: 16px;color: #333;">' + content + '</body></html>';
		return html;
	}

	_commentFooter() {
		let foot;
		if (this.state.commentShowFoot == 0) {
			foot = <TouchableOpacity style={styles.footer} onPress={() => {
			}}>
				<Text style={styles.footerText}>还没有评论</Text>
			</TouchableOpacity>
		} else if (this.state.commentShowFoot == 1) {
			foot = <View style={styles.footer}>
				<Text style={styles.footerText}>没有更多评论了</Text>
			</View>
		} else if (this.state.commentShowFoot == 2) {
			foot = <View style={styles.footer}>
				<Text style={styles.footerText}>上拉加载更多</Text>
			</View>
		} else if (this.state.commentShowFoot == 3) {
			foot = <View style={styles.footer}>
				<ActivityIndicator/>
				<Text style={styles.footerText}>正在加载更多...</Text>
			</View>
		} else {
			foot = null;
		}
		return foot;
	}

	//同意或拒绝工作邀请，true同意，false拒绝
	_judgeJob = (judge) => {

		if (this.state.rejuectReason.length <= 0 && !judge) {
			this.setState({
				rejuectBoxModal: false
			}, () => {
				this._toast('拒绝原因不能为空！');
				return;
			});

		} else {
			this.setState({
				flagBtn: false
			}, () => {
				if (judge || !ToolUtil.isEmojiCharacterInString(this.state.rejuectReason)) {
					let reqbody = {
						jobInvitationId: this.state.inviteID,
						type: judge ? '1' : '2',
						reason: this.state.rejuectReason,
						currentUserId: this.state.basic.userId,
						jidNode: this.state.basic.jidNode
					}
					FetchUtil.netUtil(Path.judgeJob, reqbody, 'POST', this.props.navigation, {
						uuId: this.state.uuid,
						userId: this.state.basic.userId,
						ticket: this.state.ticket
					}, (responseJson) => {
						this._getInviteDetails();
						DeviceEventEmitter.emit('inviteAddPage');
						if (responseJson == "tip") {
							this._toast('同意或拒绝失败！');
							// this.refs.toast.show('详情获取失败！', DURATION.LENGTH_SHORT);
						} else if (responseJson.code.toString() == '200') {
							DeviceEventEmitter.emit('getNoticeNum');//重新查询通知+工作邀请数量
							if (responseJson.data.status == 'Success') {
								//关闭拒绝模态框
								this.setState({
									rejuectBoxModal: false
								});
								this.inviteIDs = [];
								this.inviteIDs.push(this.state.inviteID);

								// if (Platform.OS == 'ios') {
								//
								// 	XMPP.XMPPInviteWorkNode({
								// 			'uuid': UUIDUtil.getUUID().replace(/\-/g, ''),
								// 			'userJid': this.state.basic.jidNode,
								// 			'inviteJids': this.inviteIDs,
								// 			'type': 'WORKINVITATION',
								// 			'userId': this.state.basic.userId
								// 		},
								// 		(error, event) => {
								// 			if (error) {
								// 				this._toast(error);
								// 			} else if (event) {
								// 				this.inviteIDs = [];
								// 				DeviceEventEmitter.emit('workNew', 'false');
								// 			}
								// 		})
								// } else {
								// 	this.join = UUIDUtil.getUUID().replace(/\-/g, '');
								// 	this.agreeInviteNodeStatue = true;
								//
								// 	/*let sendMetuIqToGroup = XmlUtil.createGroupNode(this.state.basic.jidNode, this.join);
								// 	XMPP.sendStanza(sendMetuIqToGroup);*/
								// }

							} else {
								switch (responseJson.data.code) {
									case '00':
										this._toast('该工作已确认完成，不能进行操作！');
										break;
									case '01':
										this._toast('该工作已超时，不能进行操作！');
										break;
									case '11':
										this._toast('该邀请已被处理！');
										break;
									default:
										this._toast('操作失败，请稍后重试！');
								}
							}
						}
					})
				} else {
					this.setState({
						rejuectBoxModal: false
					}, () => {
						this._toast('拒绝内容不能包含特殊字符！');
						return;
					});
				}
			})
		}
	};
	//重启工作邀请
	_restartJob = (disId) => {
		let reqBody = {
			jobInvitationId: this.state.inviteID,
			discussId: disId
		};
		FetchUtil.netUtil(Path.restartJob, reqBody, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			ticket: this.state.ticket
		}, (responseJson) => {
			this._getInviteDetails();
			DeviceEventEmitter.emit('inviteAddPage');
			if (responseJson == "tip") {
				this._toast('重起工作邀请失败！');
				// this.refs.toast.show('详情获取失败！', DURATION.LENGTH_SHORT);
			} else if (responseJson.data.status != 'Success') {
				switch (responseJson.data.code) {
					case '00':
						this._toast('该工作已确认完成，不能进行操作！');
						break;
					case '01':
						this._toast('该工作已超时，不能进行操作！');
						break;
					case '11':
						this._toast('该工作已被重启！');
						break;
					default:
						this._toast('错误码没有定义！');
				}
			}
		})
	};
	//上传附件遍历
	_updateFilesItem = ({item, index}) => {
		let fType = fileTypeReturn.fileTypeSelect(item.fileName);
		return <View key={index} style={{paddingTop: 10, paddingBottom: 10}}>
			<View style={{
				flexDirection: 'row',
				justifyContent: 'center',
				alignItems: 'center',
				marginBottom: 10
			}}>
				<Image
					//+ '&fileName=' + item.createUser
					source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + this.state.jobInvitation.photo + '&imageId=' + this.state.jobInvitation.photo + '&sourceType=singleImage&jidNode='}}
					style={{width: 30, height: 30, marginRight: 10}}/>
				<Text style={{fontSize: 12, color: '#333', flex: 1}}>{this.state.jobInvitation.nickName}</Text>
				<Text style={{fontSize: 10, color: '#333'}}>{this.state.jobInvitation.createTime}</Text>
			</View>
			<View style={{
				flexDirection: 'row',
				backgroundColor: '#f6f5f5',
				padding: 10,
				alignItems: 'center'
			}}>
				<TouchableOpacity style={{
					flexDirection: 'row',
					flex: 1
				}} onPress={() => {
					HandlerOnceTap(
						() => {
							fType != 'img' ? this._LookingFile(item) : this._LookingImage(item.id);
						}
					)
				}}>
					<View style={{
						marginRight: 10,
						justifyContent: 'center',
						alignItems: 'center'
					}}>
						{
							fType == 'img' ? <Image
								source={{uri: Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&attId=' + item.id}}
								style={styles.inviteFileIcon}/> : fType
						}
					</View>
					<View style={styles.inviteFileInfor}>
						<Text numberOfLines={1} style={{fontSize: 14, color: '#333', marginBottom: 3}}>{item.fileName}</Text>
						<Text style={{fontSize: 10, color: '#999'}}>{item.createTime}</Text>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	};
	//文件下载
	_downloadFile = (file) => {
		DeviceEventEmitter.emit('changeLoading', 'true');
		let url = Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&attId=' + file.id + '&userId=' + this.state.basic.userId;
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
	}
	//图片预览
	_LookingImage = (id) => {
		let body = this.state.lookImages,
			chooseId = null;
		for (let i in body) {
			if (body[i].url.indexOf(id) > -1) {
				chooseId = parseInt(i);
			}
		}
		this.setState({
			lookChooseId: chooseId,
			isModalVisible: true,
		});
	}
	//文件预览
	_LookingFile = (file) => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
		this.setState({
			viewFile: file
		}, () => {
			this.setState({fileAnimating: true}, () => {
				let tempType = 'file';
				if (Platform.OS == 'android') {
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
				} else {
					this.refs.bottomMenu._changeMenuShow(true);
					this.refs.bottomMenu._changeFirMenuShow(true);
					this.refs.bottomMenu._changeSecMenuShow(false);

				}
				this.setState({fileAnimating: false});
			});
		});

	};
	//调起本地预览
	_useLocalOpenFile = (file) => {
		if (Platform.OS == 'android') {
			this.setState({
				pdfInsideModalVisible: true,
				source: {
					uri: Path.previewAttachment + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&userId=' + Global.loginUserInfo.userId + '&attId=' + file.id + '&suffix=' + file.fileName,
					cache: 'reload'
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
		} else {
			//this.refs.bottomMenu._changeMenuShow(false);
				let fileType = file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length);
				let parame = {
					url: Path.getDownLoadAttachList + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&attId=' + file.id + '&userId=' + Global.loginUserInfo.userId,
					fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
					fileType: fileType
				};
				OpenFile.openDocBinaryinUrl([parame], (error, url) => {
					//this.refs.bottomMenu._changeMenuShow(false);
					//DeviceEventEmitter.emit('changeLoading', 'false');
				})
		}
	};
	//调起选择其他程序
	_useOtherOpenFile = (file) => {
		OpenFile.openDocBinaryinUrl([{
			url: Path.baseImageUrl + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&userId=' + Global.loginUserInfo.userId + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)),
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
				console.error(error);
			} else {
				this.setState({animating: false}, () => {
					this.refs.bottomMenu._changeMenuShow(false);
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(false);
				});
			}
		})
	};
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		position: 'relative'
	},
	inviteBox: {
		flex: 1,
		padding: 10,
		paddingLeft: 15,
		paddingRight: 15
	},
	inviteInfor: {
		padding: 10,
		paddingLeft: 15,
		paddingRight: 15,
		backgroundColor: '#f0f0f0',
	},
	inforTitle: {
		fontSize: 18,
		color: '#333',
		paddingBottom: 10,
		borderBottomColor: '#ccc',
		borderBottomWidth: 1,
	},
	btn: {
		padding: 3,
		paddingLeft: 8,
		paddingRight: 8,
		backgroundColor: '#3498db',
		borderRadius: 4,
		marginLeft: 10,
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
	},
	inviteHeadImg: {
		width: headSize,
		height: headSize,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10,
	},
	headMoreBtn: {
		width: headSize,
		height: headSize,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		left: 0,
		top: Platform.OS == 'ios' ? -4 : 0,
	},
	inviteTitle: {
		color: '#333',
		fontSize: 16,
		borderLeftColor: '#ff9226',
		borderLeftWidth: 5,
		paddingLeft: 8,
	},
	inviteComment: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 5,
		paddingLeft: 15,
		paddingRight: 15,
		borderTopColor: '#d7d7d7',
		borderTopWidth: 1,
	},
	inviteCommentInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#e1e1e1',
		borderRadius: 4,
		backgroundColor: '#f0f0f0',
		padding: 2,
		paddingLeft: 8,
		paddingRight: 8,
		//lineHeight: 24,
	},
	inviteGroup: {
		flexDirection: 'row',
		marginBottom: 10,
		borderTopWidth: 1,
		borderTopColor: '#ebebeb',
		paddingTop: 10,
	},
	inviteFileIcon: {
		width: 48,
		height: 48,
		marginRight: 10
	},
	inviteFileInfor: {
		flex: 1,
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
	modal1: {
		flex: 1,
		paddingTop: 180,
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.4)'
	},
	modal2: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.4)'
	}
});
