import React, {Component} from 'react';
import {
	Platform,
	StyleSheet,
	View,
	Image,
	Dimensions,
	Alert,
	Text,
	TouchableWithoutFeedback,
	BackHandler,
	DeviceEventEmitter,
	NativeModules
} from 'react-native';
import {StackActions, NavigationActions} from 'react-navigation';
import Path from "../../config/UrlConfig";
import FetchUtil from "../../util/FetchUtil";
import PasswordGesture from 'react-native-gesture-password';
import cookie from '../../util/cookie';
import Header from '../../component/common/Header';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import FileSystem from "react-native-filesystem";
import ListenerUtil from '../../util/ListenerUtil';
import Sqlite from "../../util/Sqlite";
import RedisUtil from '../../util/RedisUtil';

const XMPP = Platform.select({
    ios: () => NativeModules.JCNativeRNBride,
    android: () => require('react-native-xmpp'),
})();
let handLocker = '';
let lastPresTime = 1;
export default class HandLock extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			ticket: props.navigation.state.params.ticket,
			basic: props.navigation.state.params.basic,
			setting: props.navigation.state.params.setting == undefined ? false : props.navigation.state.params.setting,
			lockInfor: props.navigation.state.params.lockInfor,
			headerVisable: props.navigation.state.params.headerVisable == undefined ? true : props.navigation.state.params.headerVisable,
			status: 'normal',
			lockType: props.navigation.state.params.lockType,
			message: '',
			isBackGroundRecall: props.navigation.state.params.isBackGroundRecall
		}
	};

	componentDidMount() {
		this.IDDidVerifySuccess = DeviceEventEmitter.addListener('IDDidVerifySuccess', (params) => {
            this.props.navigation.goBack();
		});
		if (this.handLockBackKey) {
			this.handLockBackKey.remove()
		};
		this.handLockBackKey = BackHandler.addEventListener("back", () => {
			let curTime = new Date().getTime();
			if (curTime - lastPresTime > 500) {
				lastPresTime = curTime;
				return false;
			}
			return true;
		});
		let info = this.state.lockInfor,
			msg = '';
		if (!this.state.setting) {//判断是否为验证手势锁

			if (!info.picturePassword) {
				msg = '请设置手势锁';
			} else {
				msg = '请先验证手势锁';
				if (this.handLockBackKey) {
					this.handLockBackKey.remove()
				};
				this.handLockBackKey = BackHandler.addEventListener("back", () => {
					return true;
				});
			}
		} else {
			msg = '请输入原手势密码'
		}
		this.setState({
			status: 'normal',
			message: msg
		})
	};

	onStart = () => {//手势输入开始回调
		this.setState({
			status: 'normal',
			message: ''
		})
	}

	componentWillUnmount() {
        cookie.delete('isUpload');
		this.IDDidVerifySuccess.remove();
		this.handLockBackKey.remove();
	}

	onEnd = (password) => {//手势输入结束回调

		let info = this.state.lockInfor;
		if (this.state.setting && info.picturePassword) {
			//，如果已经打开并且设置过手势密码的话先验证手势所
			if (password == info.picturePassword) {//验证通过后
				info.picturePassword = '';
				this.setState({
					message: '验证通过',
					lockInfor: info
				}, () => {
					setTimeout(() => {
						this.setState({message: '请设置新的手势密码'});
					}, 500);
				});
			} else {
				this._inputErrorMax();
			}

		} else {//设置手势锁
			if (!info.picturePassword) {//信息中没有密码为未设置状态
				this._settingHandLock(password);
			}

		}

		if (this.state.isBackGroundRecall) {
			this._loginPassLock(password);
		}

	}

	_settingHandLock = (pwd) => {//设置手势锁
		let sta = 'normal', text = '';
		if (pwd.length >= 4) {//手势锁需大于等于4位
			if (handLocker == '') {
				handLocker = pwd;//首次正确输入后存入变量中
				text = '再输入一次手势密码';
			} else {
				if (pwd == handLocker) {//两次手势密码相同请求服务器设置成功
					sta = 'right';
					handLocker = '';
					text = '设置成功';
				} else {//两次密码不一致清除已存入密码并需从新输入
					sta = 'wrong';
					text = '两次密码不一致，重新输入';
					handLocker = '';
				}
			}
		} else {
			sta = 'wrong';
			text = '手势密码最少四位';
		}

		this.setState({
			status: sta,
			message: text
		}, () => {
			if (sta == 'right') {//以当前输入状态确定是否需要请求
				let str = 'isStart=1,lockType=1,picturePassword=' + pwd;//设置成功需要请求的参数以字符串传入
				this._lockUpdate(str);
			}
		});
	}

	_lockUpdate = (str) => {//更新手势锁状态
		let info = this.state.lockInfor;//当前手势锁信息
		let obj = {};
		let arr = str.split(',');
		for (let i in arr) {
			let name = arr[i].split('=')[0],
				key = arr[i].split('=')[1];
			obj[name] = key;
		}
		//请求更新手势锁接口
		FetchUtil.netUtil(Path.postLockUpdate, obj, 'POST', this.props.navigation, {
			userId: this.state.basic.userId,
			uuId: this.state.uuid,
			ticket: this.state.ticket
		}, (data) => {
			if (data.code.toString() == '200') {
				if (data.data && !obj.errorCount) {
					info.picturePassword = obj.picturePassword;//将更改后的手势密码替换信息中已有密码
					cookie.save('modelInfor', info);//将更改后的信息存入cookie
					this.setState({
						lockInfor: info
					}, () => {
						DeviceEventEmitter.emit('handLockWin');
						this.props.navigation.goBack();
					})
				}
			}
		})
	}

	_loginPassLock = (pwd) => {//验证手势密码
		let info = this.state.lockInfor;
		if (pwd == info.picturePassword) {
			this.setState({
				status: 'right',
				message: '密码正确'
			}, () => {
				this.handLockBackKey.remove();
				this.props.navigation.goBack();
			})
		} else {
			this._inputErrorMax();
		}
	}

	_inputErrorMax = () => {//手势密码输入错误
		let info = this.state.lockInfor;

		let tempNum = !info.errorCount || info.errorCount <= 0 ? 0 : parseInt(info.errorCount);
		// let tempNum = num;
		// num++;//全局变量加1
		if(tempNum < (Path.handLockErrorNum-1)){
            info.errorCount = tempNum+1;//将增加的错误次数存入信息中
        }else{
            tempNum = Path.handLockErrorNum-1;
		}
		this.setState({
			status: 'wrong',
			message: '密码错误，还剩' + (Path.handLockErrorNum - tempNum -1) + '次机会',
			lockInfor: info
		}, () => {
			let str = 'errorCount=' + (tempNum+1);//输入错误请求参数
			this._lockUpdate(str);
			if ((2 - tempNum) <= 0) {
                FileSystem.fileExists('my-directory/my-file.txt', FileSystem.storage.temporary).then((res) => {
                    if (res) {
                        this.deleteFile();
                    }
                })
				Alert.alert(
					'提示',
					'你已输错'+Path.handLockErrorNum+'次，请重新登录',
					[
						{
							text: '确定', onPress: () => {

							// 	this.props.navigation.navigate('Login');
							//this._lockUpdate('errorCount=0');
							this._logout();
							//cookie.delete('isUpload');
							}
						}
					],{ cancelable: false }
				)
			}
		})
	}
	//退出登录
    _logout = () => {
        if (Platform.OS == 'ios') {
            let url = Path.loginOut + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;

            FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
                if (responseJson.code.toString() == '200') {

                    RedisUtil.update(-1, this.props.navigation, {
                        uuId: this.state.uuid,
                        ticket: this.state.ticket,
                        userId: this.state.basic.userId
                    }, 'redis', 'front', () => {

                        XMPP.XMPPDisConnect();
                        FileSystem.fileExists('my-directory/my-file.txt', FileSystem.storage.temporary).then((res) => {
                            if (res) {
                                this.deleteFile();
                            }
                        })

                        Sqlite.close();
                        this.timer = setTimeout(
                            () => {
                                this.props.navigation.dispatch(StackActions.reset({
                                    index: 0,
                                    actions: [
                                        NavigationActions.navigate({routeName: 'Login'}),
                                    ]
                                }))
                            }, 300);

                    });
                    //this.props.navigation.pop()//跳转登录页
                } else {
                    // alert('退出登录失败')
                    this.refs.toast.show('退出登录失败', DURATION.LENGTH_SHORT);
                }
            })


        } else {
            XMPP.sendStanza('<presence xmlns=\'jabber:client\' from=\'' + this.state.basic.jid + '/' + this.state.basic.userId + '\' type=\'unavailable\'><status>在线</status></presence>');
            // XMPP.sendStanza('<close xmlns=\'urn:ietf:params:xml:ns:xmpp-framing\'/>');
            XMPP.removeListeners();
            XMPP.disconnect();
            ListenerUtil.removeOut("");
            let url = Path.loginOut + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
            FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
                if (responseJson.code.toString() == '200') {
                    FileSystem.fileExists('my-directory/my-file.txt', FileSystem.storage.temporary).then((res) => {
                        if (res) {
                            this.deleteFile();
                        }
                    })
                    Sqlite.close();
                    RedisUtil.update(-1, this.props.navigation, {
                        uuId: this.state.uuid,
                        ticket: this.state.ticket,
                        userId: this.state.basic.userId
                    }, 'redis', 'front', () => {
                    });
                    this.props.navigation.dispatch(StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({routeName: 'Login'}),
                        ]
                    }))//跳转登录页
                } else {
                    this.refs.toast.show('退出登录失败', DURATION.LENGTH_SHORT);
                }
            })
        }
    };

    async deleteFile() {
        await FileSystem.delete('my-directory/my-file.txt', FileSystem.storage.temporary);
    };
	getTouchIdLock = () => {
		this.props.navigation.navigate('TouchIdLock', {
			uuid: this.state.uuid,
			ticket: this.state.ticket,
			basic: this.state.basic,
			headerVisable: true
		});
	}

	render() {
		return (
			<View style={styles.container}>
				{
					!this.state.isBackGroundRecall ? <Header
						headLeftFlag={this.state.headerVisable}
						onPressBackBtn={() => {
							this.props.navigation.goBack();
						}}
						backTitle={'返回'}
						title={'手势锁'}
					/> : <Header
						//headLeftFlag={false}
						title={'请绘制解锁图案'}
					/>
				}
				<PasswordGesture
					ref='pg'
					style={{
						alignItems: 'center',
						backgroundColor: '#e7e7e7',
					}}
					normalColor='#7C7C7C'
					status={this.state.status}
					message={this.state.message}
					textStyle={{top: 50}}
					interval={2}
					onStart={() => this.onStart()}
					onEnd={(password) => this.onEnd(password)}
					children={<Image
						source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + this.state.basic.photoId  + '&imageId=' + this.state.basic.photoId  + '&sourceType=singleImage&jidNode='}}
						style={styles.headImage}/>}
				/>
				{this.state.lockType == '2' ? (<TouchableWithoutFeedback

					onPress={() => {
						HandlerOnceTap(this.getTouchIdLock)
					}}><View
					style={{height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7e7e7'}}>
					<Text style={{fontSize: 15, color: '#549dff'}}>{'使用指纹解锁'}</Text>
				</View></TouchableWithoutFeedback>) : null}
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	headImage: {
		width: 50,
		height: 50,
		marginTop: 20
	},
});
