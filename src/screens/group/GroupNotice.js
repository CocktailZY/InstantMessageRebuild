import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	Platform,
	ScrollView,
	TouchableOpacity,
	NativeModules,
	WebView,
	DeviceEventEmitter, BackHandler, Alert,
	FlatList,
	ActivityIndicator, Dimensions
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import FormatDate from "../../util/FormatDate";
import AwesomeAlert from "react-native-awesome-alerts";
import MyWebView from "react-native-webview-autoheight";
const {height, width} = Dimensions.get('window');
const XMPP = Platform.select({
	ios: () => NativeModules.JCNativeRNBride,
	android: () => require('react-native-xmpp'),
})();

export default class GroupNotice extends Component {
	constructor(props) {
		super(props);
		this.state = {
			noticeJson: [],
			totalPage: 0,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			room: props.navigation.state.params.room,
			basic: props.navigation.state.params.basic,
			noticeId: props.navigation.state.params.noticeId != undefined ? props.navigation.state.params.noticeId : '',
			pageNum: 1,
			textNumID: null,
			tempText: '',
			noticeItem: {},
			noticeViewShow: false,
			// showFoot: 0,//0：隐藏footer，1：加载完成无更多数据，2：加载中,
			footLoading: false,
			chatComeNotice: !props.navigation.state.params.chatComeNotice ? false : props.navigation.state.params.chatComeNotice,
			affiliation: !props.navigation.state.params.affiliation ? false : props.navigation.state.params.affiliation,
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	componentDidMount() {
		this._getGroupNotice(1);

		if (Platform.OS == 'android') {
			this._noticeAddMes = XMPP.on('message', (message) => {
			});
		}

		this.noticeAddPage = DeviceEventEmitter.addListener('noticeAddPage', (params) => {
			this._getGroupNotice(1);
		});
	};

	componentWillMount() {
		this.groupNoticeBack = BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
	}

	componentWillUnmount() {
		if (Platform.OS == 'android') {
			this._noticeAddMes.remove();
			this.groupNoticeBack.remove();
		}
		this.noticeAddPage.remove();
	}

	onBackAndroid = () => {
		if (this.state.noticeViewShow && !this.state.chatComeNotice) {
			this.setState({
				noticeItem: {},
				noticeViewShow: false
			});
		} else {
			this.props.navigation.goBack();
		}
		return true;
	}

	_getGroupNotice = (pageNum) => {
		let postNoticeStr = 'uuId=' + this.state.uuid
			+ '&ticket=' + this.state.ticket
			+ '&roomJid=' + this.state.room.roomJid
			+ '&pageNum=' + pageNum
			+ '&pageSize=5&userId=' + this.state.basic.userId;//15条分页太长改为5条
		FetchUtil.sendPost(Path.postGroupNotice, postNoticeStr, this.props.navigation, (data) => {
			if (data.code.toString() == '200') {
				this.setState({
					noticeJson: pageNum == 1 ? data.data.recordList : this.state.noticeJson.concat(data.data.recordList),
					pageNum: data.data.currentPage,
					totalPage: data.data.totalPage,
					footLoading: false
				}, () => {
					let json = this.state.noticeJson;
					if (this.state.noticeId != '') {
						for (let i in json) {
							if (json[i].bodyId == this.state.noticeId) {
								this.setState({
									noticeItem: json[i],
									noticeViewShow: true,
								});
								break;
							}
						}
					}
				});
			}
		});
	};

	deleteNotice = (item) => {

		Alert.alert(
			'提示',
			'确认删除当前公告？',
			[
				{
					text: '取消'
				},
				{
					text: '确定', onPress: () => {
						let url = Path.checkingAnnounce + '?bodyId=' + item.bodyId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&jidNode=' + this.state.basic.jidNode;
						FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
							if (responseJson.data != null && responseJson.data != 'null') {
								let url = Path.deleteAnnouncement + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&id=' + item.id;
								FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
									if (responseJson.code.toString() == '200' && responseJson.status == true) {
										this._getGroupNotice(1);
									}
								});
							} else {
								this._toast('该公告已被删除');
								this._getGroupNotice(1);
							}
						})
					}
				}
			]
		)

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
								this._getGroupNotice(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if(this.state.noticeJson.length > 0){
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	};

	// _onEndReached = (info) => {
	// 	if (info.distanceFromEnd < 0) {
	// 		return;
	// 	} else {
	// 		let tempNowPage = this.state.pageNum + 1;
	//
	// 		// if (this.state.showFoot != 0) {
	// 		//   return;
	// 		// }
	// 		if (tempNowPage > this.state.totalPage) {
	// 			this.setState({showFoot: 1});
	// 			return;
	// 		} else {
	// 			if (this.state.isCanRefresh) {
	// 				this.setState({showFoot: 2, isCanRefresh: false}, () => {
	// 					//获取数据
	// 					this._getGroupNotice(tempNowPage);
	// 				});
	// 			}
	// 		}
	// 	}
	// }
	_renderItem = (rowData, index) => {
		let tempViwe = null;
		let item = rowData.item;
		tempViwe = (
			<View style={styles.noticeContainer} key={index}>
				<View style={styles.noticeTop}>
					<Image
						source={{
							uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.photoId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode='
							// uri: Path.headImg + '?fileName=' + item.photoId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId
						}}
						style={styles.noticePictrue}/>
					<View style={styles.noticeInfor}>
						<View style={styles.deleteView}>
							<View style={{flex: 1, alignItems: 'flex-start'}}>
								<Text style={styles.noticeInforName} numberOfLines={1}>{item.createName}</Text>
							</View>
							{ this.state.affiliation ? (
								<View style={{flex: 1, alignItems: 'flex-end'}}>
									<TouchableOpacity style={{paddingLeft: 10}} onPress={() => {
										//实时调取接口查询是否为群主或管理员
										FetchUtil.netUtil(Path.isRoomAdmin + '?ticket=' + this.state.ticket + '&uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&roomJid=' + this.state.room.roomJid + '&jidNode=' + this.state.basic.jidNode, {}, 'GET', this.props.navigation, '', (responseJson) => {
											if (responseJson == 'tip') {
												this._toast(`   公告删除失败   `);
											}else if (responseJson.code.toString() == '200') {
												if (responseJson.data) {
													this.deleteNotice(item)
												} else {
													this._toast('您没有权限删除公告');
												}
											}
										})
									}}>
										<Image
											source={require('../../images/icon_trush.png')}
											style={styles.icon}
										/>
									</TouchableOpacity>
								</View>
							) : null
							}
						</View>

						<Text
							style={styles.noticeInforTime}>{FormatDate.formatTimeStmpToFullTimeForSave(item.createdate)}</Text>
					</View>
				</View>
				<TouchableOpacity style={styles.noticeBottom} onPress={() => {
					this.setState({
						textNumID: this.state.textNumID == index ? null : index,
						noticeItem: item,
						noticeViewShow: true,
					})
				}}>
					<Text>{item.title}</Text>
					<View style={styles.detailsBtn}>
						<Text
							style={{color: '#d7d7d7'}}>{'详情'}</Text>
					</View>
				</TouchableOpacity>
			</View>
		);
		return tempViwe;
	};
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

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
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
				<Header
					headLeftFlag={true}
					headRightFlag={this.state.affiliation}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'群公告'}
					onPressRightBtn={() => {
						this.props.navigation.navigate('GroupAnnouncement', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
							affiliation: this.state.affiliation
						});
					}}
					rightItemImage={require('../../images/notice.png')}
				/>
				<FlatList
					data={this.state.noticeJson}
					renderItem={this._renderItem}
					keyExtractor={(item, index) => String(index)}
					ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{fontSize: 16, color: '#999'}}>暂无数据</Text>
					</View>}
					refreshing={false}
					onRefresh={() => {
						this._getGroupNotice(1)
					}}
					ListFooterComponent={()=>this._renderFooter()}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
				/>
				{
					this.state.noticeViewShow ? <NoticeView cancelBack={() => {
						this.onBackAndroid();
					}} item={this.state.noticeItem} infor={{
						basic: this.state.basic,
						ticket: this.state.ticket,
						uuid: this.state.uuid
					}}/> : null
				}
			</View>
		)
	}
}

class NoticeView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	getStaticHtml = (content) => {
		let lineHeight = 20;
		var html = '<!DOCTYPE html><html><head><meta http-equiv="content-type" content="text/html;">';
		html += '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no"><style>*{margin: 0 !important;padding: 5px !important;}p{line-height: ' + lineHeight + 'px;padding: 0 !important;margin: 0 !important;}</style></head>';
		html += '<body style="font-size: 14px;color: #333;">' + content + '</body></html>';
		return html;
	};
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

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg:text//alert提示信息
		});
	};

	render() {
		const {showAlert, tipMsg} = this.state;
		const item = this.props.item;
		const infor = this.props.infor;
		return <View style={[styles.container, styles.noticeViewContainer]}>
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
			<Header
				headLeftFlag={true}
				headRightFlag={false}
				onPressBackBtn={this.props.cancelBack}
				backTitleStyle={{
					width: 50,
					color: '#FFF',
					fontSize: 16,
					fontWeight: '200',
					marginTop: Platform.OS == 'ios' ? 15 : 0
				}}
				backTitle={'返回'}
				titleStyle={{
					flex: 1,
					color: '#FFF',
					fontSize: 18,
					fontWeight: '500',
					marginHorizontal: Platform.OS == 'ios' ? 0 : 16,
					textAlign: 'center',
				}}
				title={'公告详情'}
			/>
			<View ref={'noticeview'} style={[styles.noticeContainer, {flex: 1}]}>
				<View ref={'noticetop'} style={styles.noticeTop}>
					<Image
						source={{
							uri: Path.headImgNew + '?uuId=' + infor.uuid + '&ticket=' + infor.ticket + '&userId=' + infor.basic.userId + '&imageName=' + item.photoId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode='
							// uri: Path.headImg + '?fileName=' + item.photoId + '&userId=' + infor.basic.userId + '&uuId=' + infor.uuid + '&ticket=' + infor.ticket
						}}
						style={styles.noticePictrue}/>
					<View style={styles.noticeInfor}>
						<Text style={styles.noticeInforName}>{item.createName}</Text>
						<Text
							style={styles.noticeInforTime}>{(FormatDate.formatTimeStmpToFullTimeForSave(item.createdate)).replace(/^/g, '')}</Text>
					</View>
				</View>
				<View style={[styles.noticeBottom]}>
					<Text style={{textAlign: 'center', marginBottom: 20, fontSize: 18}}>{item.title}</Text>

							<MyWebView
								scrollEnabled={true}
								style={{width: width - 20, margin: 10}}
								startInLoadingState={true}
								scalesPageToFit={true}
								source={{html: this.getStaticHtml(item.content), baseUrl: ''}}/>

					{/*<WebView
						style={{
							backgroundColor: 'transparent',
							flex: 1,
						}}
						source={{html: this.getStaticHtml(item.content), baseUrl: ''}}
						scalesPageToFit={true}
					/>*/}
				</View>
			</View>
		</View>
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	noticeContainer: {
		margin: 10,
		backgroundColor: '#fff',
	},
	noticeTop: {
		flexDirection: 'row',
		padding:10,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
		justifyContent: 'center',
	},
	noticePictrue: {
		width: 38,
		height: 38,
		marginRight: 10,
	},
	noticeInfor: {
		flex: 1,
		height: 38,
	},
	deleteView: {
		flexDirection: 'row',
		flex: 1,
	},
	icon: {
		width: 24,
		height: 24,
		paddingRight: 12,
		alignItems: 'flex-end',
	},
	noticeInforName: {
		fontSize: 15,
		color: '#333',
	},
	noticeInforTime: {
		fontSize: 12,
		color: '#777',
	},
	noticeBottom: {
		flex:1,
		paddingTop: 10,
		paddingBottom: 10,
	},
	detailsBtn: {
		marginTop: 5,
		alignItems: 'flex-end'
	},
	noticeViewContainer: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		right: 0,
	},
	// separator: {
	// 	borderBottomWidth: 1,
	// 	borderBottomColor: '#ccc'
	// },
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