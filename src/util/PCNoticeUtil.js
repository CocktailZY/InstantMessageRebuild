import FetchUtil from "./FetchUtil";
import Path from "../config/UrlConfig";
import {
	Platform,
} from 'react-native';

export default PCNoticeUtil = {
	pushPCNotification(roomJid, occupantJid, node, effect, active, message, obj, navigation, callback){

		FetchUtil.netUtil(Path.PCNotice, {
			roomJid: roomJid,
			occupantJid: occupantJid,
			node: node,
			effect: effect,
			active: active,
			message: message,
		}, 'POST', navigation, obj, (data) => {

			if (data.code.toString() == '200') {
				callback();
			}
		})
	}
}