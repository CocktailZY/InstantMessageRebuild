/**
 *  群组移交单选人员页面
 */
import React, {Component} from 'react';
import {
	StyleSheet, Text, View, Image, TouchableWithoutFeedback,
	Platform, NativeModules,
	DeviceEventEmitter, Alert, TouchableOpacity,
	FlatList, ActivityIndicator
} from 'react-native';

import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import XmlUtil from "../../util/XmlUtil";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Global from "../../util/Global";
import Icons from "react-native-vector-icons/MaterialCommunityIcons";
import UUIDUtil from "../../util/UUIDUtil";
import PCNoticeUtil from "../../util/PCNoticeUtil";
import AwesomeAlert from "react-native-awesome-alerts";
import XmppUtil from "../../util/XmppUtil";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
export default class GroupChange extends Component {
	constructor(props) {
		super(props);
		this.state = {
			roomJid: props.navigation.state.params.roomJid,//群Jid
			datas: [],//可移交成员列表
			chooseJidNode: '',//被选择人的jidNode
			chooseTrueName: '',//被选择人的trueName
			messageBody: {
				"id": UUIDUtil.getUUID().replace(/\-/g, ''),
				"type": 0,
				"messageType": 'text',
				"basic": {
					"userId": Global.loginUserInfo.jidNode,
					"userName": Global.loginUserInfo.trueName,
					"head": props.navigation.state.params.room.head,
					"sendTime": new Date().getTime(),
					"groupId": props.navigation.state.params.roomJid,
					"type": "groupChat",
					'groupName': props.navigation.state.params.room.roomName,
				},
				"content": {
					"text": '',
					"interceptText": '',
					"file": []
				},
				"atMembers": [],
				"occupant": {
					"state": '',
					"effect": '',
					"active": Global.loginUserInfo.trueName
				}
			},
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		};
		this.changeNodeStatue = false;//移交监听入口标记
		this.changeReadStatue = false;
		this.changePublishMessageStatue = false;
	}

	componentDidMount() {
		this._fetchMemberData();
	}

	_fetchMemberData = () => {
		let affiliations = ['admin', 'member'];
		let url = Path.getGroupMember;
		let params = {
			affiliations: JSON.stringify(affiliations),
			roomJid : this.state.roomJid,
			currentJidNode : Global.loginUserInfo.jidNode
		};
		FetchUtil.netUtil(url,params,'POST',this.props.navigation,Global.basicParam,(res) => {
            if (res == 'tip') {
                this.refs.toast.show("群成员获取失败！", DURATION.LENGTH_SHORT);
            }else if (res.code.toString() == '200') {
				res.data.map((item, index) => {
					item['checked'] = false;
				});
				this.setState({
					datas: res.data
				})
			}
			//处理添加选中状态
		});
	};
	_confirmChange = () => {
        XmppUtil.xmppIsConnect(()=>{
            this.ischange = UUIDUtil.getUUID().replace(/\-/g, '');
            let body = {
                roomJidLocal: this.state.roomJid,//房间jid
                occupantJidLocal: this.state.chooseJidNode,//被移交人jid
                currendFullJid: Global.loginUserInfo.jid+'/'+Global.loginResource //群的当前拥有者全jid带资源
            };
            FetchUtil.netUtil(Path.newChangeGroup, body, 'POST', this.props.navigation, Global.basicParam, (data) => {
                if (data == 'tip') {
                    this._toast(`  群组移交失败！ `);
                }else if (data.status) {
                    DeviceEventEmitter.emit('refreshGroupDetail');//修改禁言状态广播详情
                    this.props.navigation.goBack();
                }else{
                	this._toast(data.msg);
								}
            });
        },(error)=>{
            this.setState({
                showAlert: true,//alert框
                tipMsg:error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息
            });
        });
	};

	_selectedAdd = (jid, name) => {
		let tempArr = JSON.parse(JSON.stringify(this.state.datas));
		tempArr.map((obj, index) => {
			obj.checked = false;
			if (obj.occupantJid == jid) {
				obj.checked = true;
			}
		});
		this.setState({
			datas: tempArr,
			chooseJidNode: jid,
			chooseTrueName: name
		})
	};

	_renderItemList = ({item, index}) => {
		return (
			<TouchableWithoutFeedback
				style={{borderTopColor: index == 0 ? 'transparent' : '#D7D7D7'}}
				onPress={() => {
					this._selectedAdd(item.occupantJid, item.occupantTrueName);
				}}>
				<View style={styles.touchRow}>
					{item.checked ? (
						<Icons name={'checkbox-marked-circle-outline'} size={20} color={'#278EEE'} style={{marginRight: 8}}/>
					) : (
						<Icons name={'checkbox-blank-circle-outline'} size={20} color={'#CCCCCC'} style={{marginRight: 8}}/>
					)}
					<Image
						source={{
							uri: Path.headImgNew + '?imageName=' + item.occupantPhotoId + '&imageId=' + item.occupantPhotoId + '&sourceType=singleImage&jidNode=' + "" + '&platform=' + Platform.OS + Global.parseBasicParam
						}}
						style={styles.itemImage}/>
					<Text style={{
						fontSize: 14,
						color: '#777',
						flex: 1
					}}>{item.occupantTrueName}</Text>
				</View>
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

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
		});
	};
	render() {
		const {datas, chooseJidNode, showAlert, tipMsg} = this.state;
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
						DeviceEventEmitter.emit('refreshGroupDetail');//修改禁言状态广播详情
					}}
				/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						HandlerOnceTap(
							() => {
								this.props.navigation.goBack();
							}
						)
					}}
					backTitle={'返回'}
					title={'选择移交人员'}
				/>
				<FlatList
					keyExtractor={(item, index) => String(index)}
					data={datas}
					renderItem={this._renderItemList}
					ItemSeparatorComponent={() => <View style={styles.separator}/>}
					ListEmptyComponent={() => (
						<View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
							{datas ? (
								<Text>{'无可移交人员'}</Text>
							) : (
								<ActivityIndicator size={'large'} color={'#278EEE'}/>
							)}
						</View>
					)}
					// onEndReachedThreshold={0.1}
					// onEndReached={this._onEndReached}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					// ListFooterComponent={this._renderFooter.bind(this)}
				/>
				{chooseJidNode == '' ? null : (
					<TouchableOpacity onPress={() => {
						Alert.alert(
							'提醒',
							'是否移交群主权限',
							[
								{text: '取消'},
								{
									text: '确定',
									onPress: () => {
										this._confirmChange();
									},
								}
							]
						)
					}}
														style={[styles.delBtn, {backgroundColor: '#278eee'}]}>
						<Text style={{
							fontSize: 15,
							color: '#fff'
						}}>{'确认移交'}</Text>
					</TouchableOpacity>
				)}
			</View>
		)
	}

}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	touchRow: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		padding: 8,
	},
	delBtn: {
		height: 43,
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 14,
		marginBottom: 14,
		marginLeft: 12,
		marginRight: 12
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
	},
	itemImage: {
		width: 36,
		height: 36,
		marginRight: 8,
		borderRadius: 4
	},
})