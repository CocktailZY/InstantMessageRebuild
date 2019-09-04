import React, {Component} from 'react';
import {
	StyleSheet, Text, View, Platform, TouchableOpacity, Dimensions, Image, SectionList, FlatList, Modal, ActivityIndicator
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from "../../util/FetchUtil";
import Path from "../../config/UrlConfig";
import ParamsDealUtil from '../../util/ParamsDealUtil';
import DeviceInfo from 'react-native-device-info';
import ImageViewer from 'react-native-image-zoom-viewer';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Toast, {DURATION} from 'react-native-easy-toast';

const {height, width} = Dimensions.get('window');
const numColumns = 4;
const imgWidth = width / numColumns - 4;
let pageGo = 1;
let totalPage = 0;
let pageSize = (Math.ceil(height / imgWidth) + 2) * numColumns;

export default class HistoryImages extends Component {
	constructor(props) {
		super(props);
		this.state = {
			picList: [],
			room: !props.navigation.state.params.room ? null : props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			friendJidNode: !props.navigation.state.params.friendJidNode ? null : props.navigation.state.params.friendJidNode,//true是单聊
			historyImgModalVisible: false,
			animating: true,
			historyImgList: [],
			historychooseImgId: null,
			showFoot: 0,//0：隐藏footer，1：加载完成无更多数据，2：加载中
		}
	};

	componentDidMount() {
		this.fetchImageData(pageGo);
	};

	componentWillUnmount() {
		pageGo = 1;
	}

	fetchImageData = (pageNum) => {
		let params = {
			showPic: 'img',
			pageSize: pageSize,
			pageNum: pageNum,
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId
		};
		if (!this.state.friendJidNode) {
			params.roomJidNode = this.state.room.roomJid;
			params.stype = 'groupchat';
		} else {
			params.stype = 'sglc';
			params.sendJidNode = this.state.basic.jidNode;
			params.toJidNode = this.state.friendJidNode;
		}
		FetchUtil.netUtil(Path.getGroupHistoryImage + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (responseData) => {
			if(responseData == 'tip'){
				this.refs.toast.show('网络错误，获取图片失败');
			} else if (responseData.code.toString() == '200') {
				if(responseData.picList && responseData.picList.length > 0){
					totalPage = responseData.totalPage;
					let temp_arr = this.state.picList;
					responseData.picList.map((item) => {
						let dayArr = item.dayList,
							temp_len = -1,
							chooseNumId = -1,
							temp_obj = {
								key: '',
								data: []
							};
						if (temp_arr != '') {
							temp_len = temp_arr.length - 1;
							let temp_data = temp_arr[temp_len].data[0];
							chooseNumId = temp_data[temp_data.length - 1].chooseId;
						}
						for (let i in dayArr) {
							chooseNumId++;
							dayArr[i].chooseId = chooseNumId;
						}
						if (temp_arr != '') {
							if (temp_arr[temp_len].key == item.time) {
								let lenArr = temp_arr[temp_len].data[0];
								temp_arr[temp_len].data[0] = lenArr.concat(dayArr);
							} else {
								temp_obj.key = item.time;
								temp_obj.data[0] = dayArr;
								temp_arr.push(temp_obj);
							}
						} else {
							temp_obj.key = item.time;
							temp_obj.data[0] = dayArr;
							temp_arr.push(temp_obj);
						}
					});
					let num = 0;
					if (pageNum >= totalPage) {
						num = 1;
					}
					this._historyImgList(responseData.picList);
					this.setState({
						picList: temp_arr,
						showFoot: num
					});
				}else{
					this.refs.toast.show('没有查询到图片');
				}
			}
		})
	}

	_historyImgList(pictrue) {
		let arr = this.state.historyImgList;
		pictrue.map((item) => {

			const _item = item.dayList;

			for (let i in _item) {

				arr.push({
                    url: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + _item[i].fileName + '&imageId=' + _item[i].id + '&sourceType=chatImage&jidNode=' + '' + '&platform=' + Platform.OS
                    // url: Path.baseImageUrl + '?type=image&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileId=' + _item[i].id + '&userId=' + this.state.basic.userId
				});
			}

		});
		this.setState({
			historyImgList: arr
		})
	}

	_listItem = ({section}) => {
		return (
			<FlatList
				keyExtractor={(item, index) => String(index)}
				numColumns={numColumns}
				data={section.data[0]}
				renderItem={this._renderListItem}
				scrollEnabled={false}
			/>
		)
	}

	_renderListItem = ({item}) => {

		return (
			<TouchableOpacity key={item.index} onPress={()=>{HandlerOnceTap(
                () => {
                    this.setState({
                        historychooseImgId: item.chooseId,
                        historyImgModalVisible: true,
                    })
                }
			)}}>
				<Image
					source={{uri: Path.groupHeadImg + '?type=groupChat' + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileInfoId=' + item.id + '&userId=' + this.state.basic.userId}}
					style={styles.pictrue}/>
			</TouchableOpacity>
		)
	}

	_onEndReached = (info) => {
		if (this.state.showFoot != 0) {
			return;
		}
		if (pageGo >= totalPage) {
			return;
		} else {
			pageGo++;
		}
		this.setState({showFoot: 2});
		//获取数据
		this.fetchImageData(pageGo);
	}

	_renderFooter() {
		if (this.state.showFoot == 0) {
			return <View></View>
		} else if (this.state.showFoot == 1) {
			return <View style={styles.footer}>
				<Text style={styles.footerText}>没有更多数据了</Text>
			</View>
		} else if (this.state.showFoot == 2) {
			return <View style={styles.footer}>
				<ActivityIndicator/>
				<Text style={styles.footerText}>正在加载更多数据...</Text>
			</View>
		}
	}

	render() {
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						pageGo = 1;
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'图片'}
				/>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<View style={{flex: 1}}>
					<SectionList
						keyExtractor={(item, index) => String(index)}
						sections={this.state.picList}
						renderSectionHeader={({section}) => {
							return <Text style={styles.historyTitle}>{section.key}</Text>
						}}
						renderItem={this._listItem}
						ListEmptyComponent={() => <View
							style={{height: 100, justifyContent: 'center', alignItems: 'center'}}><Text
							style={{color: '#999', fontSize: 16}}>暂无图片记录</Text></View>}
						onEndReachedThreshold={0.1}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						onEndReached={this._onEndReached}
						ListFooterComponent={this._renderFooter.bind(this)}
					/>
				</View>

				<Modal
					visible={this.state.historyImgModalVisible}
					animationType={'none'}
					transparent={true}
					onRequestClose={() => {
						this.setState({historyImgModalVisible: false, animating: false})
					}}
				>
					<View style={{flex: 1}}>
						<ImageViewer
							style={{width: width, height: height}}
							imageUrls={this.state.historyImgList}
							enableImageZoom={true}
							index={this.state.historychooseImgId}
							flipThreshold={10}
							maxOverflow={0}
							onClick={() => { // 图片单击事件
								this.setState({historyImgModalVisible: false, animating: false})
							}}
							enablePreload={true}//开启预加载
							loadingRender={()=><View style={{width: width, height: height,justifyContent:'center',alignItems:'center'}}>
								<Image source={require('../../images/loading.png')}/>
							</View>}
							backgroundColor={'#000'}
						/>
					</View>
				</Modal>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	historyTitle: {
		fontSize: 14,
		color: '#777',
		backgroundColor: '#d7d7d7',
		height: 32,
		lineHeight: 32,
		paddingLeft: 10,
	},
	item: {
		flex: 1,
	},
	imageBox: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	pictrue: {
		width: imgWidth,
		height: imgWidth,
		margin: 2,
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