import React, {Component} from 'react';
import {
	Platform,
	StyleSheet,
	View,
	Image,
	Dimensions,
	TouchableOpacity,
	Text,
	Alert,BackHandler,
	DeviceEventEmitter
} from 'react-native';
import Path from "../../config/UrlConfig";
import FetchUtil from "../../util/FetchUtil";
import PasswordGesture from 'react-native-gesture-password';
import cookie from '../../util/cookie';
import Header from '../../component/common/Header';
import DeviceInfo from 'react-native-device-info';
import TouchID from "react-native-touch-id";
import Icons from 'react-native-vector-icons/Ionicons';
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';

const width = Dimensions.get('window').width;
let handLocker = '', num;
let lastPresTime = 1;
export default class TouchIdLock extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			ticket: props.navigation.state.params.ticket,
			basic: props.navigation.state.params.basic,
			headerVisable: props.navigation.state.params.headerVisable
		}
	};
    componentDidMount(){
        this.getTouchIdLock();
        this.footBackKey = BackHandler.addEventListener("back", ()=>{
            let curTime = new Date().getTime();
            if (curTime - lastPresTime > 500) {
                lastPresTime = curTime;
                return false;
            }
            return true;
        });
    }
    componentWillUnmount(){
        this.footBackKey.remove();
    }

	getTouchIdLock = () => {
		let optionalConfigObject = {
			title: '验证指纹密码',
			color: '#e00606',
			fallbackLabel: '显示密码'
		}
		TouchID.authenticate('abc', optionalConfigObject).then(success => {

			DeviceEventEmitter.emit('IDDidVerifySuccess');
			this.props.navigation.goBack();
			//alert(success)
		}).catch(error => {

			if (error.indexOf('LAErrorSystemCancel') != -1) {
				// alert('验证失败，请重试')
				this.refs.toast.show('验证失败，请重试', DURATION.LENGTH_SHORT);
			}

			//this.handUnLock(json);
		})
	}


	render() {
		return (
			<View style={styles.container}>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={this.state.headerVisable}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'指纹锁'}
				/>

				<TouchableOpacity
					style={{
						//flex: 1,
						alignItems: 'center',
						paddingTop: width * 0.3,

					}}
					onPress={()=>{HandlerOnceTap(this.getTouchIdLock)}}>
					<View style={styles.touchImage}>
						<Icons name={'ios-finger-print'} size={60} color={'#CCCCCC'}/>
						<Text style={{fontSize: 15, color: '#CCCCCC', textAlign: 'center'}}>{'点击验证指纹'}</Text>
					</View>

				</TouchableOpacity>

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
	touchImage: {
		alignItems: 'center',
		justifyContent: 'center',
		width: width * 0.25,
		height: width * 0.25,


	}
});