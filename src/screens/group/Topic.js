/*
 * 话题列表
 * 页面元素 默认图标 标题 发起人 回应数 最后回应时间
 *
 */
import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	ActivityIndicator,
	TouchableHighlight,
	DeviceEventEmitter,
	TouchableOpacity, FlatList, Dimensions
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import Path from "../../config/UrlConfig";
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SwipeListView, SwipeRow} from 'react-native-swipe-list-view';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import AwesomeAlert from "react-native-awesome-alerts";

const {width, height} = Dimensions.get('window');

class Topic extends Component {
	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			room: props.navigation.state.params.room,
			basic: props.navigation.state.params.basic,
			affiliation: props.navigation.state.params.affiliation,
			pageNum: 1,//当前页数
			totalPage: 0,//总页数
			footLoading: false,//是否可刷新
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	};

	componentDidMount() {
		this.fetchTopic(1);
		this._topicAddPage = DeviceEventEmitter.addListener('topicAddPage', (params) => {
			this.fetchTopic(1);
		});
	};

	componentWillUnmount() {
		this._topicAddPage.remove();
	};

	//获取话题列表数据
	fetchTopic = (pageNum) => {
		let url = Path.getTopicList;
		let params = {
			mid: this.state.room.roomJid,
			jidNode: this.state.basic.jidNode,
			pageNum: pageNum,
			pageSize: Path.pageSize,
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId,
			type: 1,
		};
		FetchUtil.netUtil(url + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', this.topicListCallBack);
	};
	//获取投票列表数据回调
	topicListCallBack = (res) => {
		if (res.code.toString() == '200') {
			let dataArr = [];
			if (res.data.page.currentPage <= 1) {
				dataArr = res.data.page.recordList;
			} else {
				dataArr = this.state.dataSource.concat(res.data.page.recordList);
			}

			let topArr = [];
			let arr = [];
			dataArr.map((item, index) => {
				if (item.isTop == '1') {
					topArr.push(item);
				} else {
					arr.push(item)
				}
			});

			this.setState({
				dataSource: topArr.concat(arr),
				pageNum: res.data.page.currentPage,
				totalPage: res.data.page.totalPage,
				footLoading: false,//是否可刷新
			})
		}
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
								this.fetchTopic(tempNowPage);
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

	/** 验证话题是否存在*/
	checkingTopic = (body) => {

		let url = Path.checkingTopic + '?topicId=' + body.id + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {

			if (responseJson == 'tip') {
				this._toast('网络错误，获取话题失败');
			} else if (responseJson.data.status == 'Success') {
				this.props.navigation.navigate('TopicDetail', {
					ticket: this.state.ticket,
					uuid: this.state.uuid,
					room: this.state.room,
					basic: this.state.basic,
					topicId: body.id
				});
			} else {
				this._toast('该话题已被删除');
				this.fetchTopic(1);
			}
		})
	}


	_renderListItem = ({item, index}) => {
		return (
			<TouchableHighlight
				activeOpacity={1}
				underlayColor='#FFFFFF'
				style={{backgroundColor: '#FFFFFF'}}
				onPress={() => {
					HandlerOnceTap(
						() => {
							this.checkingTopic(item)
						}
					)
				}}>
				<View style={[styles.flex1, {padding: 8}]}>
					<View style={styles.itemTitleView}>
						<Image source={require('../../images/icon_talk.png')} style={{width: 30, height: 30}}/>
						<Text style={styles.itemTitleText} numberOfLines={1}>{item.title}</Text>
					</View>
					<View style={styles.bottomSeparator}></View>
					<View style={{flexDirection: 'row'}}>
						<View style={{width: 80}}>
							<Text style={styles.itemBottomText} numberOfLines={1}>{`${item.nickName}发起`}</Text>
						</View>
						<View style={{width: 80}}>
							<Text style={styles.itemBottomText} numberOfLines={1}>{`回应：${item.respondNum}`}</Text>
						</View>
						<View style={{flex: 1, alignItems: 'flex-end'}}>
							<Text style={styles.itemBottomText} numberOfLines={1}>{`最后回应：${item.lastRespondTime}`}</Text>
						</View>
					</View>
				</View>
			</TouchableHighlight>
		)
	};
	//删除话题
	_delTopic = (item) => {
		let url = Path.topicDelete + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;

		let body = {
			topicId: item.id,
			jidNode: this.state.basic.jidNode
		}

		FetchUtil.netUtil(url, body, 'POST', this.props.navigation, '', (responseJson) => {

			if (responseJson.code.toString() == '200' && responseJson.status) {
				if (responseJson.data.status == 'Success'){
					this.fetchTopic(1);
				}else {
					this._toast(responseJson.data.msg);
					this.fetchTopic(1);
				}
			}else {
				this._toast('网络错误，请重试');
			}
		})
	};
	//话题置顶/取消置顶
	_toTopTopic = (item) => {
		let url = Path.topicTop + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;

		let body = {
			topicId: item.id,
			isTop: item.isTop == '1' ? '0' : '1',
			jidNode: this.state.basic.jidNode
		}

		FetchUtil.netUtil(url, body, 'POST', this.props.navigation, '', (responseJson) => {

			if (responseJson.code.toString() == '200' && responseJson.status) {
				if (responseJson.data.status == 'Success'){
					this.fetchTopic(1);
				}else {
					this._toast(responseJson.data.msg);
				}
			}else {
				this._toast('网络错误，请重试');
			}
		})

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
			tipMsg: text//alert提示信息
		});
	};

	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					headRightFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'话题列表'}
					onPressRightBtn={() => {
						this.props.navigation.navigate('TopicPublish', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}}
					rightItemImage={require('../../images/add-member.png')}
				/>
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
				<SwipeListView
					useFlatList={true}
					keyExtractor={(item, index) => String(index)}
					extraData={this.state}
					data={this.state.dataSource}
					renderItem={this._renderListItem}
					ItemSeparatorComponent={() => <View style={styles.separator}></View>}
					ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{fontSize: 16, color: '#999'}}>暂无数据</Text>
					</View>}
					renderHiddenItem={(rowData, rowMap) => {
						return (
							<View style={{flex: 1}}>
								<TouchableOpacity style={[styles.topicBackRightBtn, styles.topicDelBtnRight]}
																	onPress={() => {
																		HandlerOnceTap(() => {
																		    rowMap[rowData.index].closeRow();
																			//实时调取接口查询是否为群主或管理员
																			this._delTopic(rowData.item);

																		});
																	}}>
									<FontAwesomeIcon size={24} name="trash-o" color="#FFFFFF"/>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.topicBackRightBtn, styles.topicTopBtnRight]}
																	onPress={() => {
																		HandlerOnceTap(
																			() => {
																				//实时调取接口查询是否为群主或管理员
																				FetchUtil.netUtil(Path.isRoomAdmin + '?ticket=' + this.state.ticket + '&uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&roomJid=' + this.state.room.roomJid + '&jidNode=' + this.state.basic.jidNode, {}, 'GET', this.props.navigation, '', (responseJson) => {
																					if (responseJson.code.toString() == '200') {
																						if (responseJson.data) {
																							rowMap[rowData.index].closeRow();
																							this._toTopTopic(rowData.item)
																						} else {
																							this._toast('您没有置顶权限');
																						}
																					}
																				});
																			}
																		)
																	}}>
									<MaterialCommunityIcon size={24}
																				 name={rowData.item.isTop == '1' ? "format-vertical-align-bottom" : "format-vertical-align-top"}
																				 color="#FFFFFF"/>
								</TouchableOpacity>
							</View>
						)
					}}
					closeOnRowPress={true}
					refreshing={false}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					onRefresh={() => {
						this.fetchTopic(1)
					}}
					// onEndReachedThreshold={0.1}
					// onEndReached={(info) => {
					// 	this._onEndReached(info)
					// }}
					ListFooterComponent={() => this._renderFooter()}
					disableRightSwipe={true}
					rightOpenValue={-150}
					stopRightSwipe={-150}
					swipeToClosePercent={5}
					previewOpenValue={0}
				/>
			</View>
		)
	}
}

export default Topic;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	flex1: {flex: 1},
	bottomSeparator: {
		height: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#dfdfdf',
		marginBottom: 8
	},
	separator: {
		height: 10,
		backgroundColor: '#f0f0f0'
	},
	topicBackRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
	},
	topicDelBtnRight: {
		backgroundColor: '#f90000',
		right: 75,
	},
	topicTopBtnRight: {
		backgroundColor: '#f77516',
		right: 0,
	},
	itemTitleView: {flex: 1, flexDirection: 'row', alignItems: 'center'},
	itemTitleText: {fontSize: 18, fontWeight: 'bold', marginLeft: 5, width: (width - 30) * 0.9},
	itemBottomText: {fontSize: 11, color: '#b5b5b5'},
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