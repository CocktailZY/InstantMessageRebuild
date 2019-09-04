import React, {Component} from 'react';
import {
	Platform, StyleSheet, BackHandler,
	View, Dimensions, Alert, TouchableOpacity, Text, DeviceEventEmitter
} from 'react-native';
import Header from '../../component/common/Header';
import Path from "../../config/UrlConfig";
import FetchUtil from "../../util/FetchUtil";
import TouchID from 'react-native-touch-id';
import Icons from 'react-native-vector-icons/Ionicons';
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import cookie from '../../util/cookie';

let lastPresTime = 1;
export default class DeviceLock extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			ticket: props.navigation.state.params.ticket,
			basic: props.navigation.state.params.basic,
			handLocker: Path.handLock,//手势是否开启
			touchLocker: Path.touchId,//指纹是否开启
			isSupportedTouchId: false,
			lockInfor: {},//设备锁信息
		}
		this.num = 0;
	};


	componentDidMount() {

		//获取是否支持指纹锁功能
		this.isSupportedTouchId();
		this._getDeviceLock();
		this._handLockWin = DeviceEventEmitter.addListener('handLockWin', (params) => {
			this._getDeviceLock();
		});
		this.footBackKey = BackHandler.addEventListener("back", () => {
			let curTime = new Date().getTime();
			if (curTime - lastPresTime > 500) {
				lastPresTime = curTime;
				return false;
			}
			return true;
		});
	};

	_getDeviceLock = () => {
		let url = Path.getLockInfo + '?userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (data) => {

			if(data == 'tip'){
				this.refs.toast.show('网络错误，获取设备信息失败');
			} else if (data.code.toString() == '200') {
				this.num = !data.data.errorCount ? 0 : data.data.errorCount;
				let touchLock = false,
					handLock = false;
				if (data.data.isStart == 1) {
					if (data.data.lockType == 0) {
						touchLock = true;
					} else if (data.data.lockType == 1) {
						handLock = true;
					} else if (data.data.lockType == 2) {
						touchLock = true;
						handLock = true;
					}
				}
				cookie.save('modelInfor', data.data);
				this.setState({
					handLocker: handLock,
					touchLocker: touchLock,
					lockInfor: data.data
				})
			}
		});
	}

	componentWillUnmount() {
		this.footBackKey.remove();
		this._handLockWin.remove();
	}

	isSupportedTouchId = () => {
		TouchID.isSupported()
			.then(biometryType => {
				// Success code
				if (biometryType) {
					this.setState({
						isSupportedTouchId: true
					})
				}
			})
			.catch(error => {
				this.setState({
					isSupportedTouchId: false
				})
			});
	}

	_isTouchId = () => {
		let optionalConfigObject = {
			title: '验证指纹密码',
			color: '#e00606',
			fallbackLabel: '指纹密码'
		}

		TouchID.authenticate('touch id', optionalConfigObject).then(success => {
			let lockOpen = this.state.handLocker ? 2 : 0;
			FetchUtil.netUtil(Path.postLockUpdate, {
				isStart: 1,
				lockType: lockOpen
			}, 'POST', this.props.navigation, {
				userId: this.state.basic.userId,
				uuId: this.state.uuid,
				ticket: this.state.ticket
			}, (data) => {
				if (data.code.toString() == '200') {
					this._getDeviceLock();
				}
			})
		}).catch(error => {
			if (error.indexOf('LAErrorSystemCancel') != -1) {
				this.refs.toast.show('系统未开启或不支持指纹', DURATION.LENGTH_SHORT);
			}

		})

	}

	render() {
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'设备锁'}
				/>
				<View style={{backgroundColor: '#fff', marginTop: 10}}>
					{
						Path.handLock && !this.state.basic.demoAccount ? <TouchableOpacity
							style={[styles.menuTouch, {borderTopColor: 'transparent'}]}
							onPress={() => {
								HandlerOnceTap(
									() => {

										this.props.navigation.navigate('CheckPassword', {
											uuid: this.state.uuid,
											ticket: this.state.ticket,
											basic: this.state.basic,
											setting: this.state.handLocker,
											lockInfor:this.state.lockInfor,
											type: 'open'
										});
									}, 'CheckPassword'
								)
							}}>
							<Text style={styles.settingTouch}>手势锁</Text>
							<Text style={styles.settingTouchText}>{this.state.handLocker ? '已开启' : '已关闭'}</Text>
							<Icons name={'ios-arrow-forward'} size={25} color={'#CCCCCC'}/>
						</TouchableOpacity> : null
					}
					{
						Path.touchId && !this.state.basic.demoAccount && this.state.isSupportedTouchId ? <TouchableOpacity
							style={styles.menuTouch}
							onPress={() => {
								HandlerOnceTap(this._isTouchId)
							}}>
							<Text style={styles.settingTouch}>指纹锁</Text>
							<Text style={styles.settingTouchText}>{this.state.touchLocker ? '已开启' : '已关闭'}</Text>
							<Icons name={'ios-arrow-forward'} size={25} color={'#CCCCCC'}/>
						</TouchableOpacity> : null
					}
					{this.state.handLocker || this.state.touchLocker ?
					<TouchableOpacity
						style={styles.menuTouch}
						onPress={() => {
							HandlerOnceTap(
								() => {
									this.props.navigation.navigate('CheckPassword', {
										uuid: this.state.uuid,
										ticket: this.state.ticket,
										basic: this.state.basic,
										setting: this.state.handLocker,
										lockInfor:this.state.lockInfor,
										type: 'close'
									});
								}, 'CheckPassword')
						}}>
						<Text style={[styles.settingTouch, {flex: 1}]}>关闭设备锁</Text>
						<Icons name={'ios-arrow-forward'} size={25} color={'#CCCCCC'}/>
					</TouchableOpacity> : null}
				</View>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
			</View>
		)
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	menuTouch: {
		paddingLeft: 15,
		paddingRight: 15,
		borderTopColor: '#cecece',
		borderTopWidth: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		height: 48,
	},
	settingTouch: {
		width: 80,
		marginRight: 15,
		lineHeight: 48,
		color: '#333',
		fontSize: 14,
	},
	settingTouchText: {
		flex: 1,
		textAlign: 'right',
		marginRight: 5,
		fontSize: 14,
		color: '#ccc'
	}
});