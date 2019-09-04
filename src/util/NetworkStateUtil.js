import {Alert, DeviceEventEmitter, NativeModules, Platform} from 'react-native';
import RedisUtil from './RedisUtil';
import {StackActions, NavigationActions} from 'react-navigation';
import FileSystem from "react-native-filesystem";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

const resetAction = StackActions.reset({
	index: 0,
	actions: [
		NavigationActions.navigate({routeName: 'Login'}),
	]
});

export default NetworkStateUtil = {
	stateAlertShow(code, nav, baseObj, callback) {
		if (code.toString() == '99' || code.toString() == '-2' || code.toString() == '-12') {
			Alert.alert(
				'提醒',
				'请求参数错误，请重新登录',
				[
					{
						text: '确定',
						onPress: () => {
							if (Platform.OS == 'ios') {
								XMPP.XMPPDisConnect();
							}
							// nav.pop('Login');
							RedisUtil.update(baseObj.uuId, nav, baseObj, 'redis', 'front', () => {
								nav.dispatch(resetAction);
								FileSystem.fileExists('my-directory/my-file.txt', FileSystem.storage.temporary).then((res) => {
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', FileSystem.storage.temporary);
									}
								});
							});
						}
					}
				]
			)
		} else if (code.toString() == '-9') {
			Alert.alert(
				'提醒',
				'设备被解绑',
				[
					{
						text: '确定',
						onPress: () => {
							if (Platform.OS == 'ios') {
								XMPP.XMPPDisConnect();
							}
							// nav.pop('Login');
							RedisUtil.update(baseObj.uuId, nav, baseObj, 'redis', 'front', () => {
								nav.dispatch(resetAction);
								FileSystem.fileExists('my-directory/my-file.txt', FileSystem.storage.temporary).then((res) => {
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', FileSystem.storage.temporary);
									}
								});
							});
						}
					}
				]
			)
		} else if (code.toString() == '-13') {
			Alert.alert(
				'账号在其他设备登录',
				'请重新登录？', nav.state.routeName == 'Login' ?
					[
						{
							text: '取消', onPress: () => {
								DeviceEventEmitter.emit('closeLoading')
							}
						},
						{
							text: '确定', onPress: () => {

								RedisUtil.update(baseObj.uuId, nav, baseObj, 'redis', 'front', () => {

									DeviceEventEmitter.emit('confirmLogin');
								});
							},
						}
					] : [
						{
							text: '确定', onPress: () => {
								RedisUtil.update(baseObj.uuId, nav, baseObj, 'redis', 'front', () => {
									FileSystem.fileExists('my-directory/my-file.txt', FileSystem.storage.temporary).then((res) => {
										if (res) {
											FileSystem.delete('my-directory/my-file.txt', FileSystem.storage.temporary);
										}
									});
									nav.dispatch(resetAction);
								});
							},
						},
					]
			)
		} else if (code.toString() == '200') {
			callback('200');
		} else if (code.toString() == '-100') {
			callback('100')
		}
	}
}