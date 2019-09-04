import React, {Component} from 'react';
import {
	DeviceEventEmitter,
	Platform,
	StyleSheet,
	TextInput,
	NativeModules,
	View
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Sqlite from "../../util/Sqlite";
import AwesomeAlert from "react-native-awesome-alerts";
import UUIDUtil from '../../util/UUIDUtil';
import XmlUtil from '../../util/XmlUtil';
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";
import HandlerOnceTap from '../../util/HandlerOnceTap';

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

export default class GroupName extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			room: props.navigation.state.params.room,
			text: props.navigation.state.params.room.roomName,
			body: {},
			isTop: props.navigation.state.params.isTop,
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
	};

	submitNewName = () => {

		let messageBody = {
			"type": 0,
			"basic": {
				"userId": this.state.basic.jidNode,
				"userName": this.state.basic.trueName,
				"head": this.state.room.photoId,
				"sendTime":  new Date().getTime(),
				"groupId": this.state.room.roomJid,
				"groupName":this.state.body.roomName,
				"type": "groupChat"
			},
			"content": {
				"text": `${this.state.basic.trueName} 将群组名称修改为 ${this.state.body.roomName} `,
				"interceptText": `${this.state.basic.trueName} 将 ${this.state.room.roomName} 修改为 ${this.state.body.roomName} `,
				"file": []
			},
			"atMembers": [],
			"occupant": {
				"state": "UPDATENAME",
				"effect": "",
				"active": this.state.basic.trueName
			}
		};

		if (this.state.text.length < 0) {
			this._toast('群名称不得为空');
		} else {
		    if(JSON.stringify(this.state.body)=="{}"){
		        this._toast("群名称没有进行修改！");
		    }else{
		        FetchUtil.netUtil(Path.roomNameUpdate, this.state.body, 'POST', this.props.navigation, {
                    uuId: this.state.uuid,
                    ticket: this.state.ticket,
                    userId: this.state.basic.userId
                }, (responseJson) => {
                    if (responseJson == 'tip') {
                        this._toast("修改群名称失败！");
                    }else if (responseJson.code.toString() == '200') {

                        let messageId = UUIDUtil.getUUID().replace(/\-/g, '');
                        if (Platform.OS == 'ios'){
                            XMPP.XMPPSendGroupMessage({
                                    'message': messageBody,
                                    'jid': this.state.room.roomJid,
                                    'uuid': messageId
                                },
                                (error, event) => {
                                    if (error) {
                                        this._toast(error);
                                    } else {
                                        XMPP.XMPPUpdateGroupHeadImage({
                                            'jid': this.state.room.roomJid,
                                            'uuid': UUIDUtil.getUUID().replace(/\-/g, '')
                                        })
                                        DeviceEventEmitter.emit('refreshGroupDetail');
                                        DeviceEventEmitter.emit('refreshGroupName', this.state.body.roomName);
                                        Sqlite.updateTalkerName(this.state.basic.userId, 2, this.state.room.roomJid + Path.xmppGroupDomain, this.state.room.roomJid, this.state.body.roomName, this.state.room.photoId, this.state.isTop, false, false, () => {
                                            DeviceEventEmitter.emit('refreshPage');
                                        });
                                        this.props.navigation.goBack();
                                    }
                                })
                        }else {
                            let sendMsgToGroup = XmlUtil.sendGroup('groupchat', this.state.room.roomJid + Path.xmppGroupDomain, JSON.stringify(messageBody), messageId);
                            XMPP.sendStanza(sendMsgToGroup);
                            DeviceEventEmitter.emit('refreshGroupDetail');
                            DeviceEventEmitter.emit('refreshGroupName', this.state.body.roomName);
                            // DeviceEventEmitter.emit('noticeChatPage', {body: messageBody, type: 'text'});
                            Sqlite.updateTalkerName(this.state.basic.userId, 2, this.state.room.roomJid + Path.xmppGroupDomain, this.state.room.roomJid, this.state.body.roomName, this.state.room.photoId, this.state.isTop, false, false, () => {
                                XMPP.sendStanza(XmlUtil.changeGroupInfo(this.state.room.roomJid + Path.xmppGroupDomain));//发送修改群信息报文
                                // XMPP.sendRoomMessage('<changeinfo/>',this.state.room.roomJid + Path.xmppGroupDomain);
                                DeviceEventEmitter.emit('refreshPage');
                            });
                            this.props.navigation.goBack();
                        }

                    }
                });
		    }
		}
	}

	setNewName = (text) => {
		this.setState({
			text: text,
			body: {
				roomJid: this.state.room.roomJid,
				roomName: text,
				roomDesc: this.state.room.roomDesc,
				publicRoom: this.state.room.publicRoom,
				banRoom: this.state.room.banRoom,
				photoId: this.state.room.photoId
			}
		});
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
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					headRightFlag={true}
					isText={this.state.text.length > 0 ? true : false}
					rightText={'完成'}
					rightTextStyle={{
						fontWeight: '500',
					}}
					onPressRightBtn={()=>{HandlerOnceTap(this.submitNewName)}}
					title={'修改群名称'}
				/>
				<View style={styles.textInput}>
					<TextInput
					    maxLength={16}
						style={{flex: 1, color: 'black', padding: 0, marginLeft: 12}}
						placeholder={'请输入要修改的名称'}
						placeholderTextColor={'#ccc'}
						underlineColorAndroid="transparent"
						onChangeText={(text) => this.setNewName(text)}
						value={this.state.text}
					/>
				</View>
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
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(240,240,240,1)'
	},
	textInput: {
		backgroundColor: 'white',
		height: 40,
		marginTop: 20
	}
});