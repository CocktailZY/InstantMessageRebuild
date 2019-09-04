import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Platform,
	TouchableOpacity,
	Dimensions,
	Image,
	FlatList,
	DeviceEventEmitter,
	ActivityIndicator
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import AwesomeAlert from "react-native-awesome-alerts";

const HEADWIDTH = 60;
let pageGo = 1, totalPage = 0;

export default class ActivityHeadList extends Component {

	constructor(props) {
		super(props);
		this.state = {
			activityId: props.navigation.state.params.activityId,
			room: props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			headList: props.navigation.state.params.headList,
			activityHeadList: [],
			activityInfor: props.navigation.state.params.activityInfor,//活动详情
			showFooter: 0,
			isCanRefresh: true,//是否可刷新
            showAlert: false,
		}
	};

	componentDidMount() {
		this._getHeadList(pageGo);
	};

	_getHeadList = (pageNum) => {
		let max = this.state.headList;
		totalPage = Math.ceil(max.length / 10);
		let box = max.slice(0, pageNum * 10);
		let num = 0;
		if (pageNum > totalPage) {
			num = 1;
		}
		this.setState({
			activityHeadList: box,
			showFooter: num,
			isCanRefresh: true
		})
	}

	_onEndReached = (info) => {
		if (this.state.showFooter != 0) {
			return;
		}
		if (pageGo >= totalPage) {
			return;
		} else {
			pageGo++;
		}
		this.setState({showFooter: 2});
		//获取数据
		this._getHeadList(pageGo);
	}

	_renderFooter() {
		if (this.state.showFooter == 0) {
			return <View></View>
		} else if (this.state.showFooter == 1) {
			return <View style={styles.footer}>
				<Text style={styles.footerText}>没有更多数据了</Text>
			</View>
		} else if (this.state.showFooter == 2) {
			return <View style={styles.footer}>
				<ActivityIndicator/>
				<Text style={styles.footerText}>正在加载更多数据...</Text>
			</View>
		}
	}

	_getActivityNot = (id) => {
		let url = Path.getActivityRefuse + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId + '&activeId=' + this.state.activityId + '&activityActivistId=' + id;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
            if (responseJson == 'tip') {
                this._toast(`      操作失败！      `);
            }else if (responseJson.code.toString() == '200') {
				let box = this.state.activityHeadList;
				for (let i in box) {
					if (box[i].id == id) {
						box[i].status = 1;
					}
				}
				this.setState({
					activityHeadList: box
				}, () => {
					DeviceEventEmitter.emit('activityHeadNot');
				})
			}
		})
	}

    _toast = (text) => {
        this.setState({
            showAlert: true,//alert框
            tipMsg:text//alert提示信息
        });
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
	_renderItem = ({item, index}) => {

		return (
			<View key={index} style={styles.listWarpper}>
				<Image
					source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&imageName=' + item.photo + '&imageId=' + item.photo + '&sourceType=singleImage&jidNode='}}
					style={styles.listPic}/>
				<View style={styles.listInfor}>
					<Text numberOfLines={1} style={{fontSize: 15, color: '#333'}}>{item.nickName}</Text>
					<Text numberOfLines={1} style={{fontSize: 12, color: '#999'}}>{item.createTime}</Text>
					<Text numberOfLines={1}
					      style={{fontSize: 12, color: '#999'}}>{item.isPay == 0 ? '未支付' : '已支付'}</Text>
				</View>
				{
					(item.activistUser == this.state.basic.jidNode) || (this.state.activityInfor.createUser != this.state.basic.jidNode) ? null : (
						<TouchableOpacity
							style={[styles.headListBtn, item.status == 0 ? {backgroundColor: '#1e90ff'} : {backgroundColor: '#ff4757'}]}
							onPress={() => {
								HandlerOnceTap(
									() => {
										item.status == 0 ? this._getActivityNot(item.id) : null
									}
								)
							}}>
							<Text style={{fontSize: 14, color: '#fff'}}>{item.status == 0 ? '拒绝' : '已拒绝'}</Text>
						</TouchableOpacity>
					)
				}
			</View>
		)
	}

	render() {
        const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						pageGo = 1;
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'报名列表'}
				/>
				<View style={styles.listBox}>
					<FlatList
						data={this.state.activityHeadList}
						renderItem={this._renderItem}
						keyExtractor={(item, index) => String(index)}
						ItemSeparatorComponent={() => <View style={styles.separator}></View>}
						onEndReachedThreshold={0.1}
						onEndReached={this._onEndReached}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						ListFooterComponent={this._renderFooter.bind(this)}
					/>
				</View>
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
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	listBox: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingBottom: 10,
	},
	listWarpper: {
		paddingTop: 10,
		paddingBottom: 10,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
	},
	listPic: {
		width: HEADWIDTH,
		height: HEADWIDTH,
		marginRight: 15,
	},
	listInfor: {
		flex: 1,
		height: HEADWIDTH,
	},
	headListBtn: {
		padding: 3,
		paddingLeft: 5,
		paddingRight: 5,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
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
})
