import React, {Component} from 'react';
import {
	Platform,
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	Linking,
	Alert,
	BackHandler,
	Image, Modal, Dimensions
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Toast, {DURATION} from 'react-native-easy-toast';
import deviceInfo from "react-native-device-info";
import Icons from 'react-native-vector-icons/Ionicons';
import RNFS from "react-native-fs";
import * as MyProgress from "react-native-progress";
import XmppUtil from  '../../util/XmppUtil';

const ApkInstaller = Platform.select({
    ios: () => null,
    android: () => require('react-native-apk-installer'),
})();

const {height, width} = Dimensions.get('window');
let lastPresTime=1;
export default class AboutOurs extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			prossesModalVisible: false,
			progress: 0,//进度条百分比
		}
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
        this.footBackKey = BackHandler.addEventListener("back", () => {
            let curTime = new Date().getTime();
            if (curTime - lastPresTime > 500) {
                lastPresTime = curTime;
                return false;
            }
            return true;
        });
	};
    componentWillUnmount() {
        this.footBackKey.remove();
    }

	checkAppVersion = () => {

		let url = Path.getSysVersion + '?systemId=' + Path.systemId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		// let tempObj = {key:capTail[i],data:[]};

		XmppUtil.xmppIsConnect(()=>{
			FetchUtil.netUtil(Platform.OS == 'ios' ? url + '&platformType=ios' : url + '&platformType=android', {}, 'GET', this.props.navigation, '', (data) => {
				let version = JSON.parse(data.data).version;

				if(data == 'tip'){
					this.refs.toast.show('网络错误，获取版本号失败');
				} else if (data.code.toString() == '200') {
					if (parseFloat(version) > parseFloat(deviceInfo.getVersion())) {
						this.showAlert(version);
					}else {
						this.refs.toast.show('当前已是最新版本', DURATION.LENGTH_SHORT);
					}
				}
			});
		},(error)=>{
			let errorMsg = error == "xmppError" ?'服务器连接异常，请重新连接后再试！': "请检查您的网络状态！"//alert提示信息;
			this.refs.toast.show(errorMsg, DURATION.LENGTH_SHORT);
		});


	};

	showAlert(version) {
		Alert.alert('新版本 v' + version, '更新测试',
			[
				{
					text: "取消", onPress: () => {
					this.setState({showConfirm: false, updateFlag: false})
				}
				},
				{
					text: "确认", onPress: () => {
						if (Platform.OS == 'android'){
							this.setState({prossesModalVisible: true}, () => {
								this._downloadFile();
							})
						}else {
							Linking.openURL(Path.downloadUrl).catch(err => console.error('网络错误，请重新打开', err));
						}

				}
				},
			]
		);
	};

	_downloadFile = () => {
		let url = Path.downloadApk + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		let downloadDest = '';
		if (Platform.OS == 'android') {
			downloadDest = RNFS.ExternalDirectoryPath + '/InstantMessage.apk';
		} else {
			//downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/InstantMessage.apk';
		}
		const options = {
			fromUrl: url + '&platformType=android',
			toFile: downloadDest,
			background: true,
			begin: (res) => {
			},
			progress: (res) => {
				let pro = res.bytesWritten / res.contentLength;
				this.setState({
					progress: pro,
				});
			},
			progressDivider: 1
		};
		try {
			const ret = RNFS.downloadFile(options);
			ret.promise.then(res => {
				if (res.statusCode == 200) {
					this.setState({
						prossesModalVisible: false//下载完成关闭modal框
					}, () => {
						if (Platform.OS == 'android') {
							// this.refs.toast.show('保存成功', DURATION.LENGTH_SHORT);
							// Install an app:自动安装
							ApkInstaller.install(downloadDest);
						}
					});
				}
			}).catch(err => {
			});
		}
		catch (e) {
		}
	};

	render() {
		//判断数据是否渲染完成
		return (
			<View style={styles.container}>
				<Modal
					visible={this.state.prossesModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'slide'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						this.setState({prossesModalVisible: false})
					}}
				>
					<View style={{flex: 1}}>
						<View style={{
							backgroundColor: 'rgba(0,0,0,0.5)',
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
							paddingLeft: 20,
							paddingRight: 20
						}}>
							<View style={{
								backgroundColor: 'white',
								width: width * 0.8,
								height: height * 0.25,
								borderRadius: 4,
								padding: 20
							}}>
								<View style={{flex: 2}}>
									<Text style={{flex: 1, fontSize: 18, fontWeight: 'bold'}}>{'正在更新'}</Text>
									<Text style={{flex: 1, fontSize: 15}}>{'请稍后...'}</Text>
								</View>
								<View style={{flex: 1}}>
									<MyProgress.Bar
										progress={this.state.progress}
										width={width * 0.8 - 40}
										color={'#278EEE'}
										unfilledColor={'#CCCCCC'}
										useNativeDriver={true}
									/>
									<Text style={{
										textAlign: 'right',
										fontSize: 12,
										color: '#CCCCCC'
									}}>{`${Math.floor(this.state.progress * 100).toFixed(0)}%`}</Text>
								</View>
							</View>
						</View>
					</View>
				</Modal>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'关于系统'}
				/>
				<View style={styles.imageView}>
					<Image source={require('../../images/logo_App.png')} style={styles.image}/>
					<Text style={styles.text}>{'当前版本：V' + deviceInfo.getVersion()}</Text>
				</View>
				<View style={{backgroundColor: '#fff', marginTop: 60}}>
					<TouchableOpacity
						style={[styles.menuList, styles.menuTouch, {borderTopColor: 'transparent'}]}
						onPress={this.checkAppVersion}>
						<Text style={[styles.settingText, {flex: 1}]}>检测新版本</Text>
						<View style={{flex: 1,flexDirection:'row',justifyContent:'flex-end'}}>
							<Icons name={'ios-arrow-forward'} size={25} style={{lineHeight: 48,}} color={'#CCCCCC'}/>
						</View>
					</TouchableOpacity>
				</View>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
			</View>
		)
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(240,240,240,1)'
	},
	imageView: {
		alignItems:'center',
		justifyContent:'center',
		marginTop: 60
	},
	image:{
		width:80,
		height:80,
		borderRadius:4,
	},
	text: {
		fontSize:15,
		paddingTop:12
	},
	settingText: {
		lineHeight: 48,
		color: '#333',
		fontSize: 14,
	},
	menuTouch: {
		paddingLeft: 15,
		paddingRight: 15,
		borderTopColor: '#cecece',
		borderTopWidth: 1,
	},
	menuList: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		height: 48,
	},
});