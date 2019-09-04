import FetchUtil from './FetchUtil';
import Path from "../config/UrlConfig";
import {
	Platform,
} from 'react-native';

export default PushUtil = {
	//增加标签
	pushNotificationRegister(roomJidNode, token, uuid, userId, ticket, basic, navigation) {
		let userInfo = basic;
		let operator_type = 1;

		FetchUtil.netUtil(Path.pushTagNotification, {
			operator_type: operator_type,
			tag_list: [roomJidNode],
			token_list: [token],
			platform: Platform.OS == 'ios' ? 'ios' : 'android'
		}, 'POST', navigation, {
			uuId: uuid,
			userId: userId,
			ticket: ticket
		}, (data) => {

			if (data.code.toString() == '200') {

			}
		})
	},

	//发群通知
	pushGroupNotification(basic, ticket, roomJidNode, uuId, content,title, navigation) {

		let body = {
			userId: '',
			roomJid: roomJidNode,
			currentJidNode: basic.jidNode,
			//currentUid: basic.uid,
			content: content ? content : '您收到一条新消息',
			title: title,
			clickType: Path.pushNotificationClickType
		};

		FetchUtil.netUtil(Path.pushNotificationNew, body, 'POST', navigation, {
			uuId: uuId,
			userId: basic.userId,
			ticket: ticket
		}, (data) => {
			console.log('-----------------------------------------');
			console.log(data);
		})
	},

	//发单聊通知
	pushSingleNotification(basic, ticket, friendJidNode, uuId, userId, content,title, navigation) {


		let body = {

			userId: userId != undefined ? userId : '',
			jidNode: friendJidNode != undefined ? friendJidNode : '',
			currentUid: basic.uid,
			content: content ? content : '您收到一条新消息',
			title: title,
			clickType: Path.pushNotificationClickType
		}


		FetchUtil.netUtil(Path.pushSingleNotificationNew, body, 'POST', navigation, {
			uuId: uuId,
			userId: basic.userId,
			ticket: ticket
		}, (data) => {
			console.log('-----------------------------------------');
			console.log(data);
		})
	}
}