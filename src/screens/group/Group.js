import React, {Component} from 'react';
import {
	ActivityIndicator,
	DeviceEventEmitter,
	Dimensions,
	FlatList,
	Image,
	NativeModules,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	NetInfo,
	View, TextInput
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import DeviceInfo from 'react-native-device-info';
import GroupCreate from '../group/GroupCreate';
import GroupJoin from '../group/GroupJoin'
import Icons from 'react-native-vector-icons/Ionicons';
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Global from "../../util/Global";
import AwesomeAlert from "react-native-awesome-alerts";

export default class Group extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			animating: true,
			isPopShow: false,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			token: props.navigation.state.params.token,
			searchText: '',
			searchContent: '',//上一次搜索的内容记录
			pageNum: 1, //当前页数
			totalPage: 0, //总页数
			footLoading: true,//是否可刷新
			isCanRefresh: true,//是否可刷新
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
		this.fetchData(1);
		DeviceEventEmitter.addListener('refreshGroupList', (params) => {
			this.setState({
				searchText: ''
			}, () => {
				this.fetchData(1);
			})
		});
		this.isGetPopShow = DeviceEventEmitter.addListener('isGetPopShow', (params) => {
			this.setState({isPopShow: false});
		});
	};

	componentWillUnmount() {
		DeviceEventEmitter.removeListener('refreshGroupList');
		this.isGetPopShow.remove();
	}

	/**
	 * 当数据还没有请求回来时执行该静态方法
	 * @returns {XML}
	 */
	renderLoadingView() {
		return (
			<ActivityIndicator
				animating={this.state.animating}
				style={[styles.centering, {height: 44}]}
				size="large"
				color='rgba(76,122,238,1)'
			/>
		);
	};

	/**
	 * 数据成功请求回来后渲染页面
	 * @param rowData 请求响应的data，即在fetchData方法中set给state的lists
	 * @returns {XML}
	 */
	renderItem = ({item, index}) => {
		return (
			<TouchableOpacity
				onPress={() => {
					HandlerOnceTap(this._onPressItem.bind(this, index))
				}}
				underlayColor='rgba(24,36,35,0.1)'>
				<View style={styles.itemBody}>
					<View style={styles.itemLeft}>
						<Image source={{
							uri: Path.groupHeadImg + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileInfoId=' + item.photoId + '&type=groupImage&userId=' + this.state.basic.userId,
							cache: 'reload'
						}}
							   style={styles.groupHead}/>
					</View>
					<View style={styles.itemRight}>
						<Text style={{textAlign: 'left'}}>{item.roomName}</Text>
					</View>
				</View>
			</TouchableOpacity>
		)
	};

	/**
	 * 请求服务器获取list数据
	 */
	fetchData(pageNum) {
		XmppUtil.xmppIsConnect(() => {

            //判断有网状态，关闭提示框
            if(this.state.showAlert){
                this.setState({
                showAlert:false
                });
            }
			let peams = {
				roomName: this.state.searchText,
				occupantJid: this.state.basic.jidNode,
				pageSize: Path.pageSize + 5,
				pageNum: pageNum
			}
			this.refs.groupHeader._changeHeaderTitle('群组');
			if (this.state.searchContent.length <= 0 || this.state.searchText != this.state.searchContent) {
				FetchUtil.netUtil(Path.getAllGroupsPage, peams, 'POST', this.props.navigation, Global.basicParam, (responseJson) => {
					if (responseJson.code.toString() == '200') {
						this.setState({
							dataSource: pageNum == 1 ? responseJson.data.recordList : this.state.dataSource.concat(responseJson.data.recordList),
							animating: false,
							totalPage: responseJson.data.totalPage,
							pageNum: responseJson.data.currentPage,
							isCanRefresh: true,
							footLoading: false,
							searchContent: this.state.searchText
						}, () => {
							this.state.dataSource.map((item, index) => {
								Global.groupMute[item.roomJid] = item.mute;
							})
						});
					}
				});
			}
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
	};

	_renderFooter() {
		let footView = null;
		if (this.state.pageNum < this.state.totalPage) {
			if (this.state.footLoading) {
				footView = (
					<View style={styles.footer}>
						<ActivityIndicator/>
						<Text style={styles.footerText}>正在加载更多数据...</Text>
					</View>
				)
			} else {
				footView = (
					<TouchableOpacity
						style={styles.footer}
						onPress={() => {
							let tempNowPage = this.state.pageNum + 1;
							this.setState({footLoading: true}, () => {
								//获取数据
								this.fetchData(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if (this.state.dataSource.length > 0) {
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	};

	_onPressItem = (index) => {

		this.props.navigation.navigate('Chat', {
			'token': this.state.token,
			'ticket': this.state.ticket,
			'backPage': 'Group',
			'room': this.state.dataSource[index],
			'basic': this.state.basic,
			'selectFlag': true
		});
	};

	joinRoom = () => {
		/**
		 * 加入群聊时判断用户当前在群聊中的状态
		 * */
		this.setState({
			isPopShow: false
		});

		this.props.navigation.navigate('GroupJoin', {
			'ticket': this.props.navigation.state.params.ticket,
			'uuid': this.state.uuid,
			'basic': this.props.navigation.state.params.basic,
			'pageType': 'add'
		});

	};

	creatRoom = () => {

		this.setState({
			isPopShow: false
		}, () => {
			this.props.navigation.navigate('GroupCreate', {
				'ticket': this.props.navigation.state.params.ticket,
				'uuid': this.state.uuid,
				'basic': this.props.navigation.state.params.basic,
				'pageType': 'create',
				'token': this.state.token
			});
		});

	};

	_searchGroup = () => {
		this.fetchData(1);
	}

	showAlert = () => {
		this.setState({
			showAlert: true
		});
	};

	hideAlert = () => {
		this.setState({
			showAlert: false
		});
	};

	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Header
					ref={'groupHeader'}
					headRightFlag={true}
					title={'群组'}
					onPressRightBtn={() => {
						this.setState({isPopShow: !this.state.isPopShow})
					}}
					rightItemImage={require('../../images/add-member.png')}
				/>
				<View style={{backgroundColor: '#F5F5F5'}}>
					<View style={{
						flexDirection: 'row',
						margin: 8,
						backgroundColor: '#FFFFFF',
						borderWidth: 1,
						borderRadius: 6,
						borderColor: '#CCCCCC'
					}}>
						<TextInput
							ref={(TextInput) => this._searchInputBox = TextInput}
							style={{
								flex: 1,
								height: 30,
								backgroundColor: '#FFFFFF',
								borderColor: 'transparent',
								borderWidth: 1,
								borderRadius: 6,
								paddingTop: 0,
								paddingBottom: 0,
								paddingLeft: 8,
								paddingRight: 8
							}}
							placeholderTextColor={'#CCCCCC'}
							placeholder={'搜索...'}
							underlineColorAndroid={'transparent'}
							multiline={false}
							onChangeText={(text) => this.setState({searchText: text})}
							returnKeyType={'search'}
							onSubmitEditing={this._searchGroup}
							value={this.state.searchText}
						/>
						<TouchableOpacity onPress={() => {
							this.fetchData(1)
						}}>
							<View style={{width: 25, height: 30, justifyContent: 'center'}}>
								<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
							</View>
						</TouchableOpacity>
					</View>
				</View>
				<FlatList
					data={this.state.dataSource}
					renderItem={this.renderItem}
					keyExtractor={(item, index) => String(index)}
					extraData={this.state}
					refreshing={false}
					// getItemLayout={(data, index) => (
					// 	{length: 50, offset: (50 + 2) * index, index}
					// )}
					ItemSeparatorComponent={() => <View style={styles.separator}></View>}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					// ListHeaderComponent={this._customRefresh}
					// onEndReachedThreshold={0.1}
					// onEndReached={(info) => {
					// 	this._onEndReached(info)
					// }}
					ListFooterComponent={() => this._renderFooter()}
					onRefresh={() => {
						this.fetchData(1)
					}}
					ListEmptyComponent={() => <Text style={{textAlign: 'center', margin: 10}}>无符合群组</Text>}
				/>
				{this.state.isPopShow ? (
					<View style={styles.cover}>
						<TouchableOpacity style={{flex: 1}} onPress={() => {
							HandlerOnceTap(() => this.setState({isPopShow: false}))
						}}>
							<View style={{flex: 1, alignItems: 'flex-end', position: 'relative',}}>
								<View style={styles.popView}>
									{/*<Image source={require('../../images/popoverBackgroundRight.png')}*/}
									{/*style={styles.backgroundImage}/>*/}
									<View style={styles.popViewTip}/>
									<View style={styles.buttonView}>
										<TouchableOpacity style={styles.buttonViewBox} onPress={() => {
											HandlerOnceTap(this.joinRoom)
										}}>
											<View style={styles.buttonViewIcon}>
												<Icons name={'ios-add'} size={28} color={'#FFFFFF'}/>
											</View>
											<Text style={styles.buttonText}>加入群</Text>
										</TouchableOpacity>
										<View style={{width: 100, height: 1, backgroundColor: '#fff'}}/>
										<TouchableOpacity style={styles.buttonViewBox} onPress={() => {
											HandlerOnceTap(this.creatRoom)
										}}>
											<View style={styles.buttonViewIcon}>
												<Icons name={'ios-chatboxes-outline'} size={20} color={'#FFFFFF'}/>
											</View>
											<Text style={styles.buttonText}>创建群</Text>
										</TouchableOpacity>
										<View style={{width: 100, height: 1, backgroundColor: '#fff'}}/>
										<TouchableOpacity style={styles.buttonViewBox} onPress={() => {
											HandlerOnceTap(
												() => {
													this.setState({
														isPopShow: false
													}, () => {
														this.props.navigation.navigate('QRScanner', {
															uuid: this.state.uuid,
															ticket: this.state.ticket,
															basic: this.state.basic
														})
													});
												}
											)
										}}>
											<View style={styles.buttonViewIcon}>
												<Icons name={'ios-qr-scanner'} size={18} color={'#FFFFFF'}/>
											</View>
											<Text style={styles.buttonText}>扫一扫</Text>
										</TouchableOpacity>
									</View>
								</View>
							</View>
						</TouchableOpacity>
					</View>) : (<View></View>)}
				<AwesomeAlert
					show={showAlert}
					alertContainerStyle={{zIndex: 999999}}
					showProgress={false}
					title="提示"
					message={tipMsg}
					closeOnTouchOutside={false}
					closeOnHardwareBackPress={false}
					showCancelButton={false}
					showConfirmButton={true}
					// cancelText="No, cancel"
					confirmText="确定"
					confirmButtonColor="#278EEE"
					//onCancelPressed={() => {
					//	this.hideAlert();
					//}}
					onConfirmPressed={() => {
						this.hideAlert();
					}}
				/>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
			</View>
		)
		//判断数据是否渲染完成
	}
}
const popSize = 42;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		paddingBottom: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 34 : 0) : 0,
	},
	centering: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
	},
	itemBody: {
		flexDirection: 'row',
		marginLeft: 10,
		// marginRight: 16,
		alignItems: 'center',
		height: 48,
	},
	itemLeft: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		marginRight: 8,
	},
	itemRight: {
		flex: 1,
		justifyContent: 'center'
	},
	cover: {
		flex: 1,
		position: 'absolute',
		top: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 88 : 60) : 40,
		left: 0,
		bottom: 0,
		right: 0,
		backgroundColor: 'rgba(0,0,0,0.1)'
	},
	backgroundImage: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		width: null,
		//不加这句，就是按照屏幕高度自适应
		//加上这几，就是按照屏幕自适应
		resizeMode: Image.resizeMode.contain,
		//祛除内部元素的白色背景
		backgroundColor: 'rgba(0,0,0,0)',
	},
	popView: {
		width: (320 / 280) * 100,
		height: popSize * 3 + 12,
		justifyContent: 'center',
		alignItems: 'center'
	},
	buttonView: {
		flex: 1,
		marginTop: 10,
		backgroundColor: '#464646',
		// borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: 5,
		paddingRight: 5
	},
	buttonViewBox: {
		flexDirection: 'row',
		height: popSize,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonViewIcon: {
		width: 20,
		height: 20,
		marginRight: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		fontSize: 16,
		color: '#fff',
		textAlign: 'center',
	},
	groupHead: {
		width: 32,
		height: 32,
		// borderRadius: 4
	},
	popViewTip: {
		position: 'absolute',
		right: 15,
		top: -10,
		width: 1,
		height: 1,
		borderTopWidth: 10,
		borderLeftWidth: 5,
		borderRightWidth: 5,
		borderBottomWidth: 10,
		borderTopColor: 'transparent',
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderBottomColor: '#464646',
	},
	footer: {
		flexDirection: 'row',
		height: 30,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	footerText: {
		fontSize: 14,
		color: '#999'
	}
});
