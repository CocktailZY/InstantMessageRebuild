/*
* 工作邀请列表页
* */
import React, {Component} from 'react';
import {
	StyleSheet, Text, View,
	ScrollView,
	TouchableWithoutFeedback, BackHandler,
	ImageBackground, NetInfo
} from 'react-native';
import Header from '../../component/common/Header';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Path from "../../config/UrlConfig";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";

let lastPresTime = 1;
export default class Job extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket
		}
	}

	componentDidMount() {
		if (this.jobBackKey) {
			this.jobBackKey.remove();
		};
		this.jobBackKey = BackHandler.addEventListener("back", () => {
			let curTime = new Date().getTime();
			if (curTime - lastPresTime > 500) {
				lastPresTime = curTime;
				return false;
			}
			return true;
		});
		// NetInfo.isConnected.fetch().done((isConnected) => {
		// 	if (isConnected) {
		// 		this.refs.jobHeader._changeHeaderTitle('工作台');
		// 	} else {
		// 		this.refs.jobHeader._changeHeaderTitle('工作台(无连接)');
		// 		this.refs.toast.show('请检查当前网络状态', DURATION.LENGTH_SHORT);
		//
		// 	}
		// });
	}

	componentWillUnmount() {
		this.jobBackKey.remove();
	}

	_jobNavigite = (key) => {
		this.props.navigation.navigate(key, {
			'ticket': this.state.ticket,
			'uuid': this.state.uuid,
			'basic': this.state.basic,
		});
	}

	render() {
		return (
			<View style={styles.container}>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					ref={'jobHeader'}
					title={'工作台'}
				/>
				<ImageBackground style={{flex: 1, padding: 10}} source={require('../../images/job_bg.jpg')}
												 resizeModal={'contain'}>
					<ScrollView
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}>
						<TouchableWithoutFeedback style={{flex: 1, marginTop: 10}}
																			onPress={() => {
																				HandlerOnceTap(() => this._jobNavigite('Invite'))
																			}}>
							<View style={[styles.jobBtn, {
								flex: 1,
								justifyContent: 'center',
								alignItems: 'center',
								backgroundColor: '#f0932b'
							}]}>
								<FontAwesome name={'handshake-o'} color={'#FFFFFF'} size={30}/>
								<Text style={styles.jobBtnText}>工作邀请</Text>
							</View>
						</TouchableWithoutFeedback>
						{
							Path.elecTable ? (
								<TouchableWithoutFeedback style={{flex: 1}} onPress={() => {
									HandlerOnceTap(() => this._jobNavigite('Invite'))
								}}>
									<View style={[styles.jobBtn, {
										flex: 1,
										justifyContent: 'center',
										alignItems: 'center',
										marginTop: 10,
										backgroundColor: '#f0932b'
									}]}>
										<FontAwesome name={'table'} color={'#FFFFFF'} size={30}/>
										<Text style={styles.jobBtnText}>电子表格</Text>
									</View>
								</TouchableWithoutFeedback>
							) : null
						}
						{
							Path.netDisk ? (
								<TouchableWithoutFeedback style={{flex: 1, marginTop: 10}}
																					onPress={() => {
																						HandlerOnceTap(() => this._jobNavigite('Invite'))
																					}}>
									<View style={[styles.jobBtn, {
										flex: 1,
										justifyContent: 'center',
										alignItems: 'center',
										marginTop: 10,
										backgroundColor: '#f0932b'
									}]}>
										<FontAwesome name={'magnet'} color={'#FFFFFF'} size={30}/>
										<Text style={styles.jobBtnText}>网盘</Text>
									</View>
								</TouchableWithoutFeedback>
							) : null
						}
					</ScrollView>
				</ImageBackground>
			</View>
		)
	}

}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	jobBtn: {
		height: 120,
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.8
	},
	jobBtnText: {
		fontSize: 16,
		color: 'white'
	}
});
