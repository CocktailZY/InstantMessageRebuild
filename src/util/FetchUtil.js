import {Alert, DeviceEventEmitter, NativeModules, Platform,BackHandler} from 'react-native';
import RedisUtil from './RedisUtil';
import {StackActions, NavigationActions} from 'react-navigation';
import FileSystem from "react-native-filesystem";
import Sqlite from "./Sqlite";
import ListenerUtil from './ListenerUtil';
import Global from "./Global";

const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();
let isAlert = false;
const resetAction = StackActions.reset({
	index: 0,
	actions: [
		NavigationActions.navigate({routeName: 'Login'}),
	]
});

export default FetchUtil = {
	netUtil(url, data, type, nav, baseObj, callback, dealFlag) {
	// console.log('请求路径：'+url);
	// console.log('请求参数：');
	// console.log(data);
	// console.log('基本参数：');
	// console.log(baseObj);
		if (type == 'POST') {
			let postOptions = {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json;charset=UTF-8',
					// 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
				},
				body: JSON.stringify(data)
				// body:data
			};
			fetch(baseObj != '' ? url + dealPostParams(baseObj) : url, postOptions).then((response) => {
				return response.json();
			}).then((responseText) => {
				//  callback(JSON.parse(responseText));
				// console.log(responseText);
				// if(responseText.status == 'Success' || responseText.status){
					fetchSucFunc(dealFlag,responseText,nav,baseObj,callback);
				// }else{
				// 	//responseText.status == 'Fail'
				// 	callback('errorCode',responseText.code);
				// }
			}).catch(error => {
				// DeviceEventEmitter.emit('changeLoading', 'false');
				// alert('网络错误，请重试');
				// DeviceEventEmitter.emit('showFootAlert',{showFlag:true,msg:'网络错误，请重试'});
				callback('tip', '网络错误，请重试');
			});
		} else {
			let getOptions = {
				methd: 'GET',
			};

			let obj = {};

			obj.uuId = queryString(url, 'uuId');
			obj.ticket = queryString(url, 'ticket');
			obj.userId = queryString(url, 'userId');

			fetch(url, getOptions).then((response) => {
				return response.json();
			}).then((responseText) => {
				// console.log(responseText);
				// if(responseText.status == 'Success' || responseText.status){
					fetchGetSucFunc(dealFlag,responseText,nav,baseObj,obj,callback);
				// }else{
				// 	//responseText.status == 'Fail'
				// 	callback('errorCode',responseText.code);
				// }
				// console.log(responseText)
			}).catch(error => {
				// DeviceEventEmitter.emit('changeLoading', 'false');
				// alert('网络错误，请重试');
				// DeviceEventEmitter.emit('showFootAlert',{showFlag:true,msg:'网络错误，请重试'});
				callback('tip', '网络错误，请重试');
			});
		}

	},
	sendPost(url, body, nav, callback) {
		let postOptions = {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				// 'Content-Type': 'application/json;charset=UTF-8',
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			},
			body: body
			// body:data
		};

		let obj = {};

		obj.uuId = queryString(url, 'uuId');
		obj.ticket = queryString(url, 'ticket');
		obj.userId = queryString(url, 'userId');

		fetch(url, postOptions).then((response) => {
			return response.json();
		}).then((responseText) => {
			if (responseText.code.toString() == '-2') {
				//删除本地文件
				let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
				FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
					if (res) {
						FileSystem.delete('my-directory/my-file.txt', category);
					}
				});
				DeviceEventEmitter.emit('closeLoading');
				nav.dispatch(resetAction);
			} else if (responseText.code.toString() == '99') {
				Alert.alert(
					'提醒',
					'系统异常，请重新登录',
					[
						{
							text: '确定',
							onPress: () => {

								if (Platform.OS == 'android') {
									//更新redis
									RedisUtil.update(obj.uuId, nav, {
										ticket: obj.ticket,
										userId: obj.userId,
										uuId: obj.uuId
									}, 'lineStatus', 'back', () => {
										//设备当前为“后台”状态
										BackHandler.exitApp();
									});
								} else {
									XMPP.appExit();
								}
							}
						}
					],{ cancelable: false }
				)

			} else {
				callback(responseText);
			}
		}).catch(error => {
			// DeviceEventEmitter.emit('changeLoading', 'false');
			// alert('网络错误，请重试');
			// DeviceEventEmitter.emit('showFootAlert',{showFlag:true,msg:'网络错误，请重试'});
			callback('tip', '网络错误，请重试');
		});
	}
};

let dealPostParams = (baseObj) => {
	// console.log(baseObj);
	let temp = '';
	if (typeof baseObj == 'object') {
		temp += '?uuId=' + baseObj.uuId;
		temp += '&ticket=' + baseObj.ticket;
		temp += '&userId=' + baseObj.userId;
	}
	return temp;
};

let queryString = (url, val) => {
	let uri = decodeURI(url, "UTF-8");
	let re = new RegExp("" + val + "=([^&?]*)", "ig");
	return ((uri.match(re)) ? (uri.match(re)[0].substr(val.length + 1)) : null);
};

let fetchSucFunc = (dealFlag,responseText,nav,baseObj,callback) => {
	if (!dealFlag) {
		if (responseText.code.toString() == '-2') {
			//删除本地文件
			let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
			FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
				if (res) {
					FileSystem.delete('my-directory/my-file.txt', category);
				}
			});
			DeviceEventEmitter.emit('closeLoading');
			nav.dispatch(resetAction);
		}
		else if (responseText.code.toString() == '99' || responseText.code.toString() == '-12') {
			if (responseText.msg == 'passWordError') {
				//alert('用户名或密码错误');
				callback('tip', '用户名或密码错误');
			} else {
				DeviceEventEmitter.emit('closeLoading');
				Alert.alert(
					'提醒',
					'系统异常，请重新登录',
					[
						{
							text: '确定',
							onPress: () => {
								if (Platform.OS == 'android') {
									//更新redis
									RedisUtil.update(baseObj.uuId, nav, {
										ticket: baseObj.ticket,
										userId: baseObj.userId,
										uuId: baseObj.uuId
									}, 'lineStatus', 'back', () => {
										//设备当前为“后台”状态
										Global.updateFlag = null;
										Sqlite.close();
										BackHandler.exitApp();
									});
								} else {
									Global.updateFlag = null;
									Sqlite.close();
									XMPP.appExit();
								}
								//删除本地文件
								let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
								FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', category);
									}
								});

							}
						}
					],{ cancelable: false }
				)
			}
		}
		else if (responseText.code.toString() == '-9') {
			// console.log(isAlert);
			if (!isAlert) {
				isAlert = true;
				Alert.alert(
					'提醒',
					'设备被解绑',
					[
						{
							text: '确定',
							onPress: () => {
								if (Platform.OS == 'ios') {
									XMPP.XMPPDisConnect();
								} else {
									XMPP.removeListeners();
									XMPP.disconnect();
								}
								DeviceEventEmitter.emit('closeLoading');
								ListenerUtil.removeOut("",null,()=>{});
								Global.updateFlag = null;
								Sqlite.close();
								nav.dispatch(resetAction);
								let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
								FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
									// console.log('查到文件');
									// console.log(res);
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', category);
									}
								});
							}
						}
					],{ cancelable: false }
				)
			}
			setTimeout(() => {
				isAlert = false;
			}, 1000)
		}
		else if (responseText.code.toString() == '-13') {
			Alert.alert(
				'账号在其他设备登录',
				(nav.state.routeName == 'Login' || nav.state.routeName == 'Audit') ? '是否继续登录' : '请重新登录', (nav.state.routeName == 'Login' || nav.state.routeName == 'Audit') ?
					[
						{
							text: '取消', onPress: () => {
								DeviceEventEmitter.emit('closeLoading')
							}
						},
						{
							text: '确定', onPress: () => {
								XMPP.removeListeners();
								RedisUtil.update(baseObj.uuId, nav, baseObj, 'redis', 'front', () => {
									DeviceEventEmitter.emit('confirmLogin');
								});
							},
						}
					] : [
						{
							text: '确定', onPress: () => {
								ListenerUtil.removeOut("",null,()=>{});
								// console.log("post");
								let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
								FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
									// console.log('查到文件');
									// console.log(res);
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', category);
									}
								});
								DeviceEventEmitter.emit('closeLoading');
								Global.updateFlag = null;
								Sqlite.close();
								nav.dispatch(resetAction);
							},
						},
					],{ cancelable: false }
			)
		}
		else {
			callback(responseText);
		}
	} else {
		callback(responseText);
	};
};

let fetchGetSucFunc = (dealFlag,responseText,nav,baseObj,obj,callback) => {
	if (!dealFlag) {
		if (responseText.code.toString() == '-2') {
			//删除本地文件
			let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
			FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
				if (res) {
					FileSystem.delete('my-directory/my-file.txt', category);
				}
			});
			DeviceEventEmitter.emit('closeLoading');
			nav.dispatch(resetAction);
		}
		else if (responseText.code.toString() == '99' || responseText.code.toString() == '-12') {
			if (responseText.msg == 'passWordError') {
				//alert('用户名或密码错误');
				callback('tip', '用户名或密码错误');
			} else {
				DeviceEventEmitter.emit('closeLoading');
				//删除本地文件
				let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
				FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
					if (res) {
						FileSystem.delete('my-directory/my-file.txt', category);
					}
				});
				Alert.alert(
					'提醒',
					'系统异常，请重新登录',
					[
						{
							text: '确定',
							onPress: () => {
								if (Platform.OS == 'android') {
									//更新redis
									RedisUtil.update(baseObj.uuId, nav, {
										ticket: baseObj.ticket,
										userId: baseObj.userId,
										uuId: baseObj.uuId
									}, 'lineStatus', 'back', () => {
										//设备当前为“后台”状态
										BackHandler.exitApp();
									});
								} else {
									XMPP.appExit();
								}
							}
						}
					],{ cancelable: false }
				)
			}
		}
		else if (responseText.code.toString() == '-9' || responseText.code.toString() == '-10' || responseText.code.toString() == '-11') {
			if (!isAlert) {
				isAlert = true;
				Alert.alert(
					'提醒',
					'设备被解绑',
					[
						{
							text: '确定',
							onPress: () => {
								if (Platform.OS == 'ios') {
									XMPP.XMPPDisConnect();
								} else {
									XMPP.removeListeners();
									XMPP.disconnect();
								}
								// console.log("post")
								ListenerUtil.removeOut("",null,()=>{});
								let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
								FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', category);
									}
								});
								DeviceEventEmitter.emit('closeLoading');
								Global.updateFlag = null;
								Sqlite.close();
								nav.dispatch(resetAction);
							},
						}
					],{ cancelable: false }
				)
			}
			setTimeout(() => {
				isAlert = false;
			}, 1000)

		}
		else if (responseText.code.toString() == '-13') {
			Alert.alert(
				'账号在其他设备登录',
				(nav.state.routeName == 'Login' || nav.state.routeName == 'Audit') ? '是否继续登录' : '请重新登录', (nav.state.routeName == 'Login' || nav.state.routeName == 'Audit') ?
					[
						{
							text: '取消', onPress: () => {
								DeviceEventEmitter.emit('closeLoading');
							}
						},
						{
							text: '确定', onPress: () => {
								RedisUtil.update(baseObj.uuId, nav, baseObj, 'redis', 'front', () => {
									DeviceEventEmitter.emit('closeLoading');
									DeviceEventEmitter.emit('confirmLogin');
								});
							},
						}

					] : [
						{
							text: '确定', onPress: () => {
								ListenerUtil.removeOut("",null,()=>{});
								let category = Platform.OS == 'ios' ? FileSystem.storage.important : FileSystem.storage.temporary;
								FileSystem.fileExists('my-directory/my-file.txt', category).then((res) => {
									if (res) {
										FileSystem.delete('my-directory/my-file.txt', category);
									}
								});
								DeviceEventEmitter.emit('closeLoading');
								Global.updateFlag = null;
								Sqlite.close();
								nav.dispatch(resetAction);
							},
						},
					],{ cancelable: false }
			)
		}
		else {
			callback(responseText);
		}
	} else {
		callback(responseText);
	}
};
