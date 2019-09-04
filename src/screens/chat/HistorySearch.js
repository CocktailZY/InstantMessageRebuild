import React, {Component} from 'react';
import {
	StyleSheet, Text, View, Image, TouchableOpacity, Platform,
	TextInput, FlatList, ActivityIndicator
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Icons from 'react-native-vector-icons/Ionicons';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import FormatDate from '../../util/FormatDate';
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import ToolUtil from "../../util/ToolUtil";
import AwesomeAlert from "react-native-awesome-alerts";

export default class HistorySearch extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sections: [],
			room: !props.navigation.state.params.room ? null : props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			// friendDetail : !props.navigation.state.params.friendDetail ? null : props.navigation.state.params.friendDetail,
			friendJidNode: !props.navigation.state.params.friendJidNode ? null : props.navigation.state.params.friendJidNode,
			searchText: '',
			searchResult: '请搜索想要查找的聊天记录',
			searchContent: '',//上一次搜索的内容
			pageNum: 1,
			totalPage: 0,
			footLoading: false,
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	}

	_searchUser = (pageNum) => {
        this._searchInputBox.blur();
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			text: encodeURI(this.state.searchText),
			pageNum: pageNum,
			pageSize: Path.pageSize,
			currentNum: 0,
		};
		let url = '';
		if (this.state.searchText.replace(/(^\s*)|(\s*$)/g, "") == '') {
			this.setState({
				showAlert: true,//alert框
				tipMsg:'搜索内容不能为空！'//alert提示信息
			});
			return false;
		}
		if(ToolUtil.isEmojiCharacterInString(this.state.searchText)){
			this.setState({
				showAlert: true,//alert框
				tipMsg:'搜索内容包含非法字符！'//alert提示信息
			});
			return false;
		}
		if (!this.state.friendJidNode) {
			params.roomName = this.state.room.roomJid + Path.xmppGroupDomain;
			url = Path.postGroupHistoryDate + ParamsDealUtil.toGetParams(params);
		} else {
			params.jidNode = this.state.basic.jidNode;
			params.buddyJidNode = this.state.friendJidNode;
			url = Path.postSelfHistoryDate + ParamsDealUtil.toGetParams(params);
		}
		if (this.state.searchText != this.state.searchContent){
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (data) => {
				if(data == 'tip'){
					this.refs.toast.show('网络错误，请检查网络');
				} else if (data.code == '200') {
					let body = !this.state.friendJidNode ? data.data : JSON.parse(data.data);
					let searchResult = this.state.searchResult;
					let num = 0;
					let type = false;
					if (body.recordList.length <= 0) {
						searchResult = '抱歉，没有查到相关记录！';
					}
					this.setState({
						sections: pageNum == 1 ? body.recordList : this.state.sections.concat(body.recordList),
						searchResult: searchResult,
						pageNum: pageNum,
						totalPage: body.totalPage,
						footLoading: false,
						searchContent:this.state.searchText,
					});
				}
			});
		}
	};

	_renderItem = ({item, index}) => {
		let body = !this.state.friendJidNode ? JSON.parse(item.body) : item.body;
		if (!!body) {
			let itemTime = !this.state.friendJidNode ? body.basic.sendTime : body.content.sendTime;
			if (itemTime.toString().indexOf('-') == -1) {
				itemTime = FormatDate.formatTimeStmpToFullTimeForSave(itemTime);
			}
			//返回内容字符串高亮操作
			let searchValue = this.state.searchText;
			let reg = new RegExp(searchValue, 'g');
			let itemText = '';
			if (body.content.interceptText) {
				itemText = body.content.interceptText.replace(reg, '※');
			} else {
				itemText = body.content.title;
			}
			let itemArrey = [];
			for (let key in itemText) {
				itemArrey.push(itemText[key]);
			}
			return <View key={index} style={{
				flexDirection: 'row',
				paddingTop: 10,
				paddingBottom: 10,
				borderTopWidth: 1,
				borderTopColor: index == 0 ? 'transparent' : '#dedede'
			}}>
				<Image
					source={{uri: Path.headImg + '?jidNode=' + (body.basic.type == 'groupChat' ? body.basic.userId : body.basic.fromId) + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId}}
					style={{width: 46, height: 46}}/>
				<View style={{
					flex: 1, marginLeft: 15,
				}}>
					<View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 3}}>
						<Text style={{
							flex: 1,
							fontSize: 16,
							color: '#333'
						}}>{body.basic.userName}</Text>
						<Text style={{fontSize: 12, color: '#777'}}>{itemTime}</Text>
					</View>
					<View style={{flexDirection: 'row', alignItems: 'center'}}>
						<Text style={{fontSize: 14, color: '#666', flex: 1}}>
							{
								itemArrey.map((item, index) => {
									return item == '※' ? <Text key={index} style={{color: '#5889ff',}}>{searchValue}</Text> :
										<Text key={index}>{item}</Text>
								})
							}
						</Text>
					</View>
				</View>
			</View>
		}
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
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'搜索'}
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
							placeholder={'请输入关键字搜索...'}
							underlineColorAndroid={'transparent'}
							multiline={false}
							returnKeyType={'search'}
							onSubmitEditing={() => this._searchUser(1)}
							onChangeText={(text) => this.setState({searchText: text}, () => {
								if (this.state.searchText == '') {
									this.setState({sections: []})
								}
							})}
							autoFocus={true}
							value={this.state.searchText}
						/>
						<TouchableOpacity style={{width: 25, height: 30, justifyContent: 'center'}}
															onPress={() => {
																HandlerOnceTap(
																	() => this._searchUser(1)
																)
															}}>
							<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
						</TouchableOpacity>
					</View>
				</View>
				<View style={{flex: 1, paddingLeft: 8, paddingRight: 8}}>
					<FlatList
						keyExtractor={(item, index) => String(index)}
						data={this.state.sections}
						renderItem={this._renderItem}
						ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
							<Text style={{color: '#999', fontSize: 16}}>{this.state.searchResult}</Text>
						</View>}
						ListFooterComponent={this._renderFooter.bind(this)}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
					/>
				</View>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
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
								this._searchUser(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if (this.state.sections.length > 0) {
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
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