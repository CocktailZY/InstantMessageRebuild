import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	SectionList,
	Image, Platform, DeviceEventEmitter,
	ScrollView,
	RefreshControl,
	Keyboard,NetInfo,
	TouchableOpacity
} from 'react-native';

import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import FetchUtil from "../../util/FetchUtil";
import Path from "../../config/UrlConfig";
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Global from "../../util/Global";
import AwesomeAlert from "react-native-awesome-alerts";

const ITEM_HEIGHT = 48; //item的高度
const HEADER_HEIGHT = 20;  //分组头部的高度

export default class Friend extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			animating: true,
			searchText: '',
			sections: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			addressList: [],
			textVal: '',
			isShow: false,
			isRefreshing: false,
			refreshFlag: true,
			token: props.navigation.state.params.token,
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		};
		this.lastSelectedIndex = null;
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
		XmppUtil.xmppIsConnect(() => {
			this._fetchAddress();
		}, (error) => {
			this.setState({
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
		this.refreshFriendList = DeviceEventEmitter.addListener('refreshFriendList', () => {
			this._fetchAddress();
		});
		if (Platform.OS == 'ios') {
			this.presenceNotification = DeviceEventEmitter.addListener('presenceToRN', (messageBody) => {
				this.refs.toast.show(messageBody, DURATION.LENGTH_SHORT);
			});

		}
	};

	componentWillUnmount() {
		if (Platform.OS == 'ios') {
			this.presenceNotification.remove();
		}
		DeviceEventEmitter.removeListener('refreshFriendList');
		this.measureTimer && clearTimeout(this.measureTimer);
	}

	_toAddress = () => {
		this.props.navigation.navigate('Address', {
			ticket: this.state.ticket,
			uuid: this.state.uuid,
			jidNode: this.state.basic.jidNode,
			basic: this.state.basic
		});
	};
	_toFriendCreate = () => {
		this.props.navigation.navigate('FriendCreate', {
			ticket: this.state.ticket,
			uuid: this.state.uuid,
			basic: this.state.basic
		});
	};
	_toFriendSearch = () => {
		this.props.navigation.navigate('FriendSearch', {
			ticket: this.state.ticket,
			uuid: this.state.uuid,
			basic: this.state.basic
		});
	};

	_fetchAddress() {
		XmppUtil.xmppIsConnect(() => {
            //有网关闭提示框
            if(this.state.showAlert){
                this.setState({
                    showAlert:false
                });
            }
			FetchUtil.netUtil(Path.getContacts,{
				uid:this.state.basic.uid,
				uuId:this.state.uuid,
				ticket:this.state.ticket,
				userId:this.state.basic.userId,
				groupType:'1',
				groupId:''
			},'POST',this.props.navigation,Global.basicParam,(data) => {
				if(data == 'tip'){
					this.setState({
						isRefreshing: false,
						refreshFlag: false
					},() => {
						this.refs.toast.show('网络错误，获取常用联系人失败');
					})

				} else if (data.status == 'true') {
					this.setState({
						isRefreshing: false,
						refreshFlag: false
					});

					if (data.data.length > 0) {

						this.setState((preState) => {
							let tempThis = preState;
							tempThis.sections = data.data;
							return tempThis;
						}, () => {
							if (this.state.sections.length == 0) {
								this.refs.toast.show('您还没有联系人', DURATION.LENGTH_SHORT);
							}
							this.sortAddress();
						});
					} else {
						this.setState({
							sections:[],
							addressList:[],
							isRefreshing: false,
							refreshFlag: false
						},() => {
							this.refs.toast.show('您还没有联系人', DURATION.LENGTH_SHORT);
							// this.refs.toast.show('您还没有联系人', DURATION.LENGTH_SHORT);
						})

					}
				}else {
					this.refs.toast.show('操作失败！', DURATION.LENGTH_SHORT);
				}

			});

		}, (error) => {
			this.setState({
				isRefreshing: false,
				refreshFlag: false,
				showAlert: true,//alert框
				tipMsg: error == "xmppError" ? '服务器连接异常，请重新连接后再试！' : "请检查您的网络状态！"//alert提示信息
			});
		});
	}

	_sectionComp = (info) => {
		let txt = info.section.key;
		return (<Text style={{
			height: HEADER_HEIGHT,
			paddingLeft: 8,
			backgroundColor: '#f0f0f0',
			color: '#999',
			textAlignVertical: 'center',
			fontSize: 12,
		}}>{txt}</Text>)
	};
	_renderItem = (info) => {
		let txt = info.item.title;
		return (
			<TouchableOpacity onPress={()=>{HandlerOnceTap(
                () => {
                    this.props.navigation.navigate('FriendDetail', {
                        token:this.state.token,
                        ticket: this.state.ticket,
                        uuid: this.state.uuid,
                        friendJidNode: info.item.jidNode,
                        tigRosterStatus: 'both',
                        basic: this.state.basic
                    });
                }
			)}} style={[styles.friendList, {
				borderTopWidth: 1,
			}, info.index == 0 ? {borderTopColor: 'transparent'} : {borderTopColor: '#d0d0d0'}]}>
				<Image
					source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&imageName=' + info.item.photoId + '&userId=' + this.state.basic.userId+'&imageId=' + info.item.photoId+ '&sourceType=singleImage&jidNode='+info.item.jidNode+'&platform='+Platform.OS}}
					style={styles.headFriend}/>
				<View style={styles.textFriend}>
					<Text style={{color: '#333', fontSize: 15, textAlignVertical: 'center',}}>{txt + '(' + info.item.deptName + ')'}</Text>
				</View>
			</TouchableOpacity>
		)//5C5C5C
	};

	_onRefresh = () => {
		this._fetchAddress();
	};

	sortAddress() {
		let sectionsListSource = [];
		let tempList = this.state.sections,
			sectionsList = tempList;
		tempList.map((item) => {
			sectionsList.map((element, index) => {
				if (element.key == item.key) {
					let number = tempList[index].data.length;
					tempList.splice(index, 1, {...tempList[index], number: number});
				}
			});
		});
		tempList.map((item, index) => {
			let change = {};
			if (index == 0) {
				change = {...item, scrollHeight: (ITEM_HEIGHT)}
			} else {
				let {scrollHeight, number} = sectionsListSource[index - 1];
				change = {...item, scrollHeight: (ITEM_HEIGHT * number) + scrollHeight + HEADER_HEIGHT}
			}
			sectionsListSource.push(change);
		});
		this.setState({
			addressList: sectionsListSource
		}, () => {
			const scrollItem = this.refs.scrollItem0;
			this.measureTimer = setTimeout(() => {
				scrollItem.measure((x, y, width, height, pageX, pageY) => {
					this.measure = {
						y: pageY,
						height
					};
				})
			}, 0);
		})
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
				<Header
					ref={'friendHeader'}
					title={'常用联系人'}
				/>
				<View style={{
					backgroundColor: '#f0f0f0',
					height: 48,
				}}>

					<TouchableOpacity style={{
						flex: 1,
						flexDirection: 'row',
						margin: 8,
						backgroundColor: '#FFFFFF',
						borderWidth: 1,
						borderRadius: 6,
						borderColor: '#CCCCCC'
					}} onPress={()=>{HandlerOnceTap(() => this._toFriendSearch())}}>

						<View style={{
							flex: 1,
							height: 30,
							flexDirection: 'row',
							backgroundColor: '#FFFFFF',
							borderColor: 'transparent',
							borderWidth: 1,
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 6,
							paddingTop: 0,
							paddingBottom: 0,

						}}>
							<Text style={{color: '#CCCCCC', fontSize: 15, lineHeight: 30, paddingRight: 10}}>{'搜索'}</Text>
							<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
						</View>
					</TouchableOpacity>
				</View>
					<ScrollView
						ref='scroll'
						style={{flex:1,backgroundColor:'#f0f0f0'}}
						// 下拉刷新
						refreshControl={
							<RefreshControl
								// 是否刷新
								refreshing={this.state.isRefreshing}
								onRefresh={this._onRefresh}
							/>
						}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
					>
						<View style={{
							backgroundColor: '#FFFFFF',
						}}>
							<TouchableOpacity onPress={()=>{HandlerOnceTap(this._toAddress,"address_1")}} style={styles.friendList}>
								<Image source={require('../../images/icon_addr.png')} style={styles.headFriend}/>
								<View style={styles.textFriend}>
									<Text style={{color: '#333', fontSize: 15, textAlignVertical: 'center',}}>{'公司通讯录'}</Text>
								</View>
							</TouchableOpacity>
						</View>
						<SectionList
							style={{flex:1,backgroundColor:'#FFFFFF',marginBottom: Platform.OS == 'ios' ? 49 : null}}
							ref='list'
							keyExtractor={(item, index) => String(index)}
							renderSectionHeader={this._sectionComp}
							renderItem={this._renderItem}
							sections={this.state.sections}
							// refreshing={this.state.isRefreshing}
							// onRefresh={this._onRefresh}
							ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center',backgroundColor:'#f0f0f0'}}>
								<Text style={{fontSize: 16, color: '#999'}}>暂无常用联系人</Text>
							</View>}
						/>
					</ScrollView>
					{
						this.state.isShow ? <View style={styles.modelView}>
							<View style={styles.viewShow}>
								<Text style={styles.textShow}>{this.state.textVal}</Text>
							</View>
						</View> : null
					}
					<View style={styles.sectionScroll}
								ref="view"
								onStartShouldSetResponder={(evt) => {
									return true
								}}
								onResponderStart={(event) => this.onResponderTouchPlay(event)}
								onResponderMove={(event) => this.onResponderTouchPlay(event)}
								onResponderRelease={(evt) => this.viewTouchEnd(evt)}
					>
						{
							this.state.addressList.map((item, index) => {
								let {key, number, scrollHeight} = item;
								return (number !== 0 &&
									<TouchableOpacity
										ref={'scrollItem' + index}
										onPressIn={() => {
											this.setState({textVal: key, isShow: true});
											this.refs.scroll.scrollTo({y: scrollHeight, animated: true})
										}}
										onPressOut={() => {
											this.setState({isShow: false})
										}}
										key={index}
									>
										<View style={{justifyContent: 'center', alignItems: 'center'}}>
											<Text style={{fontSize: 12, color: '#333'}}>{key}</Text>
										</View>
									</TouchableOpacity>
								)
							})
						}
					</View>
				</View>
		)
	}

	onResponderTouchPlay(e) {
		let ev = e.nativeEvent.touches[0];
		this.refs.view.setNativeProps({
			style: {
				backgroundColor: 'rgba(0,0,0,0.3)'
			}
		});
		let targetY = ev.pageY;
		const {y, height} = this.measure;
		if (!y || targetY < y) {
			return;
		}
		let index = Math.floor((targetY - y) / height);
		index = Math.min(index, this.state.addressList.length - 1);
		if (this.lastSelectedIndex !== index && index < this.state.addressList.length) {
			this.lastSelectedIndex = index;
			this.setState({textVal: this.state.addressList[index].key, isShow: true});
			this.refs.scroll.scrollTo({y: this.state.addressList[index].scrollHeight, animated: true});
		}
	}

	viewTouchEnd() {
		this.refs.view.setNativeProps({
			style: {
				backgroundColor: 'transparent'
			}
		});
		this.setState({isShow: false});
		this.lastSelectedIndex = null;
	}

}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	friendList: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 10,
		height: ITEM_HEIGHT,
	},
	sectionScroll: {
		position: 'absolute',
		width: 15,
		right: 0,
		top: 0,
		bottom: 0,
		backgroundColor: 'transparent',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headFriend: {
		width: 32,
		height: 32,
		//borderWidth: .5,
		borderRadius: 4,
		marginRight: 11,
	},
	textFriend: {
		flex: 1,
		height: 34,
		justifyContent: 'center',
		position: 'relative',
	},
	modelView: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
		position: 'absolute',
		backgroundColor: 'transparent',
		right: 0,
		top: 0,
		bottom: 0,
		left: 0
	},
	viewShow: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#666',
		width: 80,
		height: 80,
		borderRadius: 3
	},
	textShow: {
		fontSize: 50,
		color: '#fff',
	},
});