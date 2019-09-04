import React, {Component} from 'react'
import {
	Dimensions,
	Platform,
	StyleSheet,
	Image,
	Text,
	View,
	DeviceEventEmitter
} from 'react-native';

import QRCode from 'react-native-qrcode';
import Header from '../../component/common/Header';
import Path from "../../config/UrlConfig";

const {height, width} = Dimensions.get('window');

export default class QRCodeGenrator extends Component {
	constructor(props) {
		super(props);
		this.state = {
			groupName: props.navigation.state.params.groupName,
			content: props.navigation.state.params.qrParams,//roomJid
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			room: props.navigation.state.params.room,
			basic: props.navigation.state.params.basic,
			isUseQR: props.navigation.state.params.isUseQR
		}
	}


	componentDidMount() {

		this.refreshQR = DeviceEventEmitter.addListener('refreshQR', (params) => {
			this.setState({
				isUseQR: params.isUseQR
			});
		});
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
					title={'群二维码'}
				/>
				<View style={styles.content}>
					<View style={styles.card}>
						<View style={{
							justifyContent: 'center',
							alignItems: 'center',
							flexDirection: 'row',
							padding: 10
						}}>
							<Image
								source={{uri: Path.groupHeadImg + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&fileInfoId=' + this.state.room.photoId + '&type=groupImage'}}
								style={styles.headList}/>
								<View style={{flex:1}}>
								    <Text
                                    	 style={{color: 'black', fontWeight: 'bold'}}>{'   ' + this.state.room.roomName}</Text>
								</View>

						</View>
						<View style={{alignItems: 'center', paddingTop: 15}}>
							{!this.state.isUseQR ? (<QRCode
								value={this.state.content}
								size={width * 0.65}
								bgColor='black'
								fgColor='white'/>) : (<View
								style={{width: width * 0.65, height: width * 0.65, alignItems: 'center', justifyContent: 'center'}}>
								<Text style={{fontSize: 18, color: '#ccc', fontWeight: 'bold'}}>该群已开启进群验证</Text>
								<Text style={{fontSize: 18, color: '#ccc', fontWeight: 'bold'}}>只可通过邀请进群</Text>
							</View>)}

						</View>
						<View style={{alignItems: 'center', paddingTop: 20}}>
							<Text numberOfLines={1}
							      style={{fontSize: 14, color: '#ccc', fontWeight: 'bold'}}>{'扫描二维码加入群聊'}</Text>
						</View>
					</View>
				</View>
			</View>
		);
	};
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(150,150,150,1)',
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	card: {
		backgroundColor: 'white',
		width: width * 0.9,
		height: height * 0.7,
	},
	headList: {
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#dbdbdb',
		width: 48,
		height: 48,
		borderRadius: 4
	},

});