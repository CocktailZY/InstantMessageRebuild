/**
 * 底部导航器
 * 导入原生组件
 */
import React, {Component} from 'react';
import {
	Platform,
	View,
	ToastAndroid, StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
	Text, NativeModules, DeviceEventEmitter
} from 'react-native';
import Path from "../../config/UrlConfig";
import FetchUtil from "../../util/FetchUtil";
import Header from '../../component/common/Header';
import XmlUtil from "../../util/XmlUtil";
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

export default class Address extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			pageNum: 1,
			isOpen: true,
			searchText: '',
			isSearch: false,
			selectedKeys: [],
			expandedKeys: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			tempOtherName: ''
		}
	}

	componentDidMount() {
		if (Platform.OS == 'android') {
			this.fc_presence = XMPP.on('presence', (message) => this._fcPresenceCallback(message));
		} else {
			//ios监听方法
			this.presenceNotification = DeviceEventEmitter.addListener('presenceToRN', (messageBody) => {
				this.refs.toast.show(messageBody, DURATION.LENGTH_SHORT);
			});
		}
		this._fetchRecordList();
	};

	componentWillUnmount() {
		if (Platform.OS == 'ios') {
			this.presenceNotification.remove();
		} else {
			this.fc_presence.remove();
		}

	}

	_fcPresenceCallback = (message) => {
		if (message.status == 'back') {
			this._fetchRecordList();
			DeviceEventEmitter.emit('refreshFriendList');
		}
	};

	_fetchRecordList = () => {
		let url = Path.getRecords + '?uuId=' + this.state.uuid
			+ '&ticket=' + this.state.ticket
			+ '&occupantJid=' + this.state.basic.jidNode
			+ '&pageNum=' + this.state.pageNum
			+ '&pageSize=50'
			+ '&onlyGroup=1'
			+ '&onlyReceive=2'
			+ '&orderType=true&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (data) => {
			if(data == 'tip'){
				this.refs.toast.show('网络错误，获取待审核列表失败');
			} else if (data.status == 'true') {
				//返回成功
				this.setState({
					dataSource: data.data.recordList
				})
			}else {
				this.refs.toast.show('操作失败！', DURATION.LENGTH_SHORT);
			}
		});
	};

	//待验证
	_getOtherInfo = (item) => {
		var status = item.status;
		var remark = JSON.parse(item.remark);
		return (
			<View style={{
				flex: 1,
				flexDirection: 'row',
				alignItems: 'center',
				borderBottomWidth: 1,
				borderBottomColor: '#DDDDDD'
			}}>
				<Image
					source={{uri: Path.headImg + '?fileName=' + remark.photoId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket}}
					style={{width: 36, height: 36, borderRadius: Platform.OS == 'ios' ? 18 : 50, marginLeft: 8}}/>
				<View style={{flex: 1, justifyContent: 'center'}}>
					<Text style={{fontSize: 15, marginLeft: 8}}>{remark.toTrueName}</Text>
					<Text style={{fontSize: 10, marginLeft: 8}}>{`已发送申请`}</Text>
				</View>
				<View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
					<Text style={{color: '#DDDDDD'}}>{'等待验证'}</Text>
				</View>
			</View>
		)
	};
	//验证
	_getInfo = (item) => {
		var remark = JSON.parse(item.remark);
		return (
			<View style={{
				flex: 1,
				flexDirection: 'row',
				alignItems: 'center',
				borderBottomWidth: 1,
				borderBottomColor: '#DDDDDD'
			}}>
				<Image
					source={{uri: Path.headImg + '?fileName=' + remark.photoId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket}}
					style={{width: 36, height: 36, borderRadius: Platform.OS == 'ios' ? 18 : 50, marginLeft: 8}}/>
				<View style={{flex: 1, justifyContent: 'center'}}>
					<Text style={{fontSize: 15, marginLeft: 8}}>{`${remark.trueName}`}</Text>
					<Text style={{fontSize: 10, marginLeft: 8}}>{`请求加为好友`}</Text>
				</View>
				<View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
					<TouchableOpacity onPress={()=>{HandlerOnceTap(() => this._joinToFriend(remark, item.active))}}>
						<View style={{
							width: 50,
							height: 30,
							justifyContent: 'center',
							backgroundColor: '#36b9ee',
							borderRadius: 2
						}}>
							<Text style={{textAlign: 'center', color: '#FFFFFF'}}>{'同意'}</Text>
						</View>
					</TouchableOpacity>
					<TouchableOpacity onPress={()=>{HandlerOnceTap(
                        () => this._rejectToFriend(remark.jid, item.active)
					)}}>
						<View style={{
							width: 50,
							height: 30,
							justifyContent: 'center',
							backgroundColor: '#36b9ee',
							borderRadius: 2,
							marginLeft: 5
						}}>
							<Text style={{textAlign: 'center', color: '#FFFFFF'}}>{'拒绝'}</Text>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		)
	}
	_getSuccessInfo = (item, type) => {
		var remark = JSON.parse(item.remark);
		return (
			<View style={{
				flex: 1,
				flexDirection: 'row',
				alignItems: 'center',
				borderBottomWidth: 1,
				borderBottomColor: '#DDDDDD'
			}}>
				<Image
					source={{uri: Path.headImg + '?fileName=' + remark.photoId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket}}
					style={{width: 36, height: 36, borderRadius: Platform.OS == 'ios' ? 18 : 50, marginLeft: 8}}/>
				<View style={{flex: 1, justifyContent: 'center'}}>
					<Text style={{fontSize: 15, marginLeft: 8}}>{type ? remark.toTrueName : remark.trueName}</Text>
					<Text style={{fontSize: 10, marginLeft: 8}}>{`添加成功`}</Text>
				</View>
				<View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
					<Text style={{color: '#DDDDDD'}}>{'已同意'}</Text>
				</View>
			</View>
		)
	}
	_getFailedInfo = (item, type) => {
		var remark = JSON.parse(item.remark);
		return (
			<View style={{
				flex: 1,
				flexDirection: 'row',
				alignItems: 'center',
				borderBottomWidth: 1,
				borderBottomColor: '#DDDDDD'
			}}>
				<Image
					source={{uri: Path.headImg + '?fileName=' + remark.photoId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket}}
					style={{width: 36, height: 36, borderRadius: Platform.OS == 'ios' ? 18 : 50, marginLeft: 8}}/>
				<View style={{flex: 1, justifyContent: 'center'}}>
					<Text style={{fontSize: 15, marginLeft: 8}}>{type ? remark.toTrueName : remark.trueName}</Text>
					<Text style={{fontSize: 10, marginLeft: 8}}>{`添加失败`}</Text>
				</View>
				<View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
					<Text style={{color: '#DDDDDD'}}>{'已拒绝'}</Text>
				</View>
			</View>
		)
	};

	_joinToFriend = (remark, friendJidNode) => {
		let url = Path.agreeAddFriend;
		FetchUtil.sendPost(url, 'uuId=' + this.state.uuid
			+ '&ticket=' + this.state.ticket
			+ '&selfJidNode=' + this.props.navigation.state.params.basic.jidNode
			+ '&buddyJidNode=' + friendJidNode
			+ '&buddyId=' + remark.uid + '&userId=' + this.state.basic.userId, this.props.navigation, (data) => {
			if (data.status == 'true') {
				if (Platform.OS == 'android') {
					let addFriend = XmlUtil.successFriend(remark.jid, remark.toTrueName, this.state.basic.jid);
					let sucBack = XmlUtil.successBack(remark.jid);
					XMPP.sendStanza(addFriend);
					XMPP.sendStanza(sucBack);
					this.refs.toast.show('添加成功', ToastAndroid.LONG);
					this._fetchRecordList();
				} else {
					XMPP.AgreeFriendAsk(
						{'friendJid': remark.jid, 'friendName': remark.toTrueName},
						(error, event) => {
							if (error) {
								this.refs.toast.show(error, DURATION.LENGTH_SHORT);
							} else {
								this.refs.toast.show(event, DURATION.LENGTH_SHORT);
							}
						}
					)

				}
				DeviceEventEmitter.emit('refreshFriendList');//刷新好友列表
			}else {
				his.refs.toast.show(data.msg, DURATION.LENGTH_SHORT);
			}
		});
	};
	_rejectToFriend = (remark, friendJidNode) => {
		let url = Path.refuseAddFriend;
		FetchUtil.sendPost(url, 'uuId=' + this.state.uuid
			+ '&ticket=' + this.state.ticket
			+ '&selfJidNode=' + this.state.basic.jidNode
			+ '&buddyJidNode=' + friendJidNode + '&userId=' + this.state.basic.userId, this.props.navigation, (data) => {
			if (data.status == 'true') {

				if (Platform.OS == 'android') {
					var refuseFriend = XmlUtil.sendRefuseFriend(this.state.basic.jid, remark.jid, this.state.basic.trueName);
					XMPP.sendStanza(refuseFriend);
					this._fetchRecordList();
					//this.refs.toast.show('拒绝' + remark.toTrueName + '的好友申请', ToastAndroid.LONG);
				} else {
					XMPP.rejectFriendAsk(
						{'friendJid': remark.jid, 'myName': this.state.basic.trueName, 'myJid': this.state.basic.jid},
						(error, event) => {
							if (error) {
								this.refs.toast.show(error, DURATION.LENGTH_SHORT);
							} else {
								this.refs.toast.show(event, DURATION.LENGTH_SHORT);
							}
						}
					)
				}
				DeviceEventEmitter.emit('refreshFriendList');//刷新好友列表
			}else {
				his.refs.toast.show(data.msg, DURATION.LENGTH_SHORT);
			}
		});
	};

	_renderRecordItem = () => {
		var itemView = [];
		this.state.dataSource.map((item, index) => {
			var tempView;
			if (item.active == this.state.basic.jidNode) {
				if (item.status == '01') {
					tempView = this._getOtherInfo(item);
				} else if (item.status == '02') {
					tempView = this._getSuccessInfo(item, true)
				} else {
					tempView = this._getFailedInfo(item, true);
				}
			} else {
				if (item.status == '01') {
					tempView = this._getInfo(item);
				} else if (item.status == '02') {
					tempView = this._getSuccessInfo(item, false);
				} else {
					tempView = this._getFailedInfo(item, false);
				}
			}
			itemView.push(
				<View key={index} style={{height: 50, flexDirection: 'row', paddingLeft: 8, paddingRight: 8}}>
					{tempView}
				</View>
			)
		});
		return itemView;
	};

	render() {
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'新的朋友'}
				/>
				<View style={{flex: 1}}>
					<ScrollView
						ref={(scrollView) => {
							this._scrollView = scrollView;
						}}
						automaticallyAdjustContentInsets={true}
						scrollEventThrottle={200}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
					>
						{this._renderRecordItem()}
					</ScrollView>
				</View>
			</View>

		)
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF'
	},
});