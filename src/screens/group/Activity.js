import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	Dimensions,
	Image,
	FlatList,
	ActivityIndicator,
	DeviceEventEmitter
} from 'react-native';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Toast, {DURATION} from 'react-native-easy-toast';
const {height, width} = Dimensions.get('window');
const ACT_HEIGHT = 70;

export default class Activity extends Component {
	constructor(props) {
		super(props);
		this.state = {
			activityList: [],
			room: props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			showFoot: 0,//0：隐藏footer，1：加载完成无更多数据，2：加载中,
			pageNum: 1,//当前页数
			totalPage: 0,//总页数
			footLoading: true,//是否可刷新
		}
	};

	componentDidMount() {
		this._getActivity(1);
		this._activityAddPage = DeviceEventEmitter.addListener('activityAddPage', (params) => {
			this._getActivity(1);
		});
	};

	componentWillUnmount() {
		this._activityAddPage.remove();
	}

	_getActivity = (pageNum) => {
		let url = Path.getActivity + '?mid=' + this.state.room.roomJid + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&activistUser=' + this.state.basic.jidNode + '&pageNum=' + pageNum + '&pageSize=8&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
            if (responseJson == 'tip') {
                this.refs.toast.show("活动列表获取失败！", DURATION.LENGTH_SHORT);
            }else if (responseJson.code.toString() == '200') {
                this.state.totalPage = responseJson.data.page.totalPage;
				this.setState({
					activityList: pageNum == 1 ? responseJson.data.page.recordList : this.state.activityList.concat(responseJson.data.page.recordList),
					pageNum: responseJson.data.page.currentPage,
					totalPage: responseJson.data.page.totalPage,
					footLoading: false
				})
			}
		})
	}

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
								this._getActivity(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if(this.state.activityList.length > 0){
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}

	_renderItem = ({item, index}) => {
		return (
			<View style={styles.listItem}>
				<Text style={{
					position: 'absolute',
					right: 0,
					top: 0,
					padding: 2,
					paddingLeft: 8,
					paddingRight: 8,
					backgroundColor: item.status == 0 && ToolUtil.strToStemp(item.endTime) > new Date().getTime() ? '#549dff' : '#c7c7c7',
					color: '#fff',
					fontSize: 12,
				}}>{item.status == 0 && ToolUtil.strToStemp(item.endTime) > new Date().getTime() ? '进行中' : '已结束'}</Text>
				<TouchableOpacity key={index} style={styles.listWarpper} onPress={()=>{HandlerOnceTap(
                    () => {
                        this.props.navigation.navigate('ActivityDetails', {
                            activityId: item.id,
                            ticket: this.state.ticket,
                            uuid: this.state.uuid,
                            room: this.state.room,
                            basic: this.state.basic,
                        });
                    }
				)}}>
					{item.poster && item.poster != '' ? (
						<Image
							resizeMode={'cover'}
							source={{
								uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.poster + '&imageId=' + item.poster + '&sourceType=activityImage'
								// uri: Path.getReloadPoster + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileName=' + item.poster
							}}
							style={styles.listPic}/>
					) : (
						<Image
							resizeMode={'cover'}
							source={require('../../images/default_poster.png')}
							style={styles.listPic}/>
					)}
					<View style={styles.listInfor}>
						<View style={[styles.listInforBox, {marginLeft: 5,width:width*0.5,marginBottom:8}]}>
							<Text numberOfLines={1}
										style={{color: '#333', flex: 1}}>{item.title}</Text>
						</View>
						<View style={[styles.listInforBox, {marginTop: 5}]}>
							<View style={{flex: 1, marginLeft: 5,justifyContent:'center'}}>
								<Text style={{color:'rgba(0,0,0,0.8)',fontSize: 12}} numberOfLines={1}>{item.nickName}</Text>
								<Text style={{
									fontSize: 12,
									color: 'rgba(0,0,0,0.6)'
								}}>
									{'发起于 ' + item.createTime}
								</Text>
							</View>
							<View style={[styles.activitylabel, {justifyContent: 'flex-end'}]}>
								<Text numberOfLines={1}
											style={{color: 'rgba(0,0,0,0.6)', fontSize: 12}}>{item.isActive == 0 ? '未参与' : item.isActive == 1 ? '已参与' : '被拒绝'}</Text>
							</View>
						</View>
						<View style={[styles.listInforBox, {marginLeft: 5,marginTop: 5}]}>
							<View style={{flex:1,flexDirection:'row'}}>
								<Icons name={'ios-pin-outline'} size={16} color={'#549dff'}/>
								<Text numberOfLines={1}
											style={{fontSize: 12, color: 'rgba(0,0,0,0.6)', marginLeft: 3}}>{item.address}</Text>
							</View>
							<View style={{flex:1,justifyContent:'center',alignItems:'flex-end'}}>
								<View style={styles.costView}>
									<Text style={{color: '#ffc826', fontSize: 10}}>{item.cost == '0' ? '免费' : `￥${item.cost.toString().indexOf('.') != -1 ? item.cost : item.cost+'.00'}`}</Text>
								</View>
							</View>
						</View>
					</View>
				</TouchableOpacity>
			</View>
		)
	}

	render() {
		return (
			<View style={styles.container}>
                <Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={true}
					headRightFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'活动列表'}
					onPressRightBtn={() => {
						this.props.navigation.navigate('ActivityPublish', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}}
					rightItemImage={require('../../images/add-member.png')}
				/>
				<FlatList
					data={this.state.activityList}
					renderItem={this._renderItem}
					keyExtractor={(item, index) => String(index)}
					ItemSeparatorComponent={() => <View style={styles.separator}></View>}
					ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
						<Text style={{fontSize: 16, color: '#999'}}>暂无数据</Text>
					</View>}
					refreshing={false}
					onRefresh={()=>{this._getActivity(1)}}
					// onEndReachedThreshold={0.1}
					// onEndReached={(info)=>{this._onEndReached(info)}}
					ListFooterComponent={this._renderFooter.bind(this)}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
				/>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	listItem: {
		flex: 1,
		paddingTop: 8,
		paddingBottom: 8
	},
	listWarpper: {
		flexDirection: 'row',
	},
	listPic: {
		marginLeft: 5,
		width: 100,
		height: ACT_HEIGHT,
	},
	listInfor: {
		flex: 1,
		height: ACT_HEIGHT,
	},
	listInforBox: {
		flex:1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	listCost: {
		width: 60,
		height: ACT_HEIGHT,
		justifyContent: 'center',
		alignItems: 'flex-end',
	},
	costView: {
		// borderRadius: 2,
		// borderWidth: 1,
		// borderColor: '#ffc826',
		// width: 50,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
	},
	activitylabel: {
		paddingLeft: 2,
		paddingRight: 2,
		// borderWidth: 1,
		// borderColor: '#1d1eff',
		// backgroundColor: '#4146ff',
		justifyContent: 'center',
		alignItems: 'center'
	},
	activityCloselabel: {
		paddingLeft: 2,
		paddingRight: 2,
		borderWidth: 1,
		borderColor: '#ff2120',
		backgroundColor: '#ff3b2d',
		width: 50,
		justifyContent: 'center',
		alignItems: 'center'
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