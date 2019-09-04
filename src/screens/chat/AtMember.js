import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	Image,
	TouchableOpacity,
	ScrollView, BackHandler, DeviceEventEmitter,
} from 'react-native';

import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import Path from "../../config/UrlConfig";
import FetchUtil from "../../util/FetchUtil";
import Toast, {DURATION} from 'react-native-easy-toast';
import baseStyles from '../../commen/styles/baseStyles';
import Global from "../../util/Global";
import AwesomeAlert from "react-native-awesome-alerts";

const ITEM_HEIGHT = 46; //item的高度
const HEADER_HEIGHT = 20;  //分组头部的高度
const SEPARATOR_HEIGHT = 0;  //分割线的高度
let atItems = [];
let lastPresTime = 1;
export default class AtMember extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchText: '',
			uuid: this.props.uuid,
			ticket: this.props.ticket,
			basic: this.props.basic,
			room: this.props.room,
			token: this.props.token,
			backPage: this.props.backPage,
			dataSource: [],
			addressList: [],
			textVal: '',
			isShow: false,
			isSearch: false,
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

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

	memberItemDidClick = (item) => {

		if (item.occupantTrueName == '全员') {
			this.state.dataSource.map((item, index) => {
				if (item.occupantJid) {
					atItems.push(item)
				}
			})
		} else {
			atItems.push(item)
		}

		this.props.stateText(`${item.occupantTrueName} `, atItems);
	}

	_renderItem = () => {
		let arrey = [];
		this.state.dataSource.map((item, index) => {
			if (item.occupantJid !== this.state.basic.jidNode) {
				arrey.push(
					<TouchableOpacity
						key={index}
						onPress={() => {
							this.memberItemDidClick(item);

						}}
						style={[styles.friendList, {
							borderTopWidth: 1,
						}, index == 0 ? {borderTopColor: 'transparent'} : {borderTopColor: '#d0d0d0'}]}
					>
						<Image
							source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&jidNode=' + item.jidNode + '&sourceType=singleImage' + '&imageName=' + item.occupantPhotoId + '&imageId=' + item.occupantPhotoId}}
							style={styles.headFriend}/>
						<Text style={styles.textFriend}>{item.occupantTrueName}</Text>
					</TouchableOpacity>
				)
			}
		})
		return arrey;
	};

	componentDidMount() {
		this.fetchData();
        if (this.chatBackKey) {this.chatBackKey.remove();}
        // this.chatBackKey = BackHandler.addEventListener("back", () => {
	      //   this.props.cencalAtMember;
        //     // let curTime = new Date().getTime();
        //     // if (curTime - lastPresTime > 500) {
	      //     //
        //     //     lastPresTime = curTime;
        //     //     return false;
        //     // }
        //     return true;
        // });
		this.atPageBack = BackHandler.addEventListener('hardwareBackPress', ()=>{
			DeviceEventEmitter.emit('changeAtMember',false);
			return true;
		});
	}
    componentWillUnmount() {
	    this.atPageBack.remove();
        // this.chatBackKey.remove();
    }
	_setSearchText = (text) => {
		if(text.replace(/(^\s*)|(\s*$)/g, "") == ''){
            this.fetchData();
		}
		this.setState({
			searchText: text
		});
	};

	_searchFriend = () => {
        this._searchInputBox.blur();
		if (this.state.searchText.replace(/(^\s*)|(\s*$)/g, "") == '') {
			this.setState({
				showAlert: true,//alert框
				tipMsg:'搜索内容不能为空'//alert提示信息
			});
			// this.refs.toast.show('搜索内容不能为空', DURATION.LENGTH_SHORT);
			return false;
		}
		let url = Path.getGroupMember;
		let params = {
			occupantNick : this.state.searchText,
			roomJid : this.state.room.roomJid,
			uuId : this.state.uuid,
			ticket : this.state.ticket,
			currentJidNode : this.state.basic.jidNode,
			userId : this.state.basic.userId
		};
	FetchUtil.netUtil(url,params,'POST',this.props.navigation,Global.basicParam,(data) => {

		if(data == 'tip'){
			this.refs.toast.show('群组成员获取失败！');
		} else if (data.code == '200') {
				if (data.data.length > 0) {
					// tempObj.data = data.list;
					this.setState((preState) => {
						var tempThis = preState;
						tempThis.sections = data.data;
						return tempThis;
					}, () => {
						if (this.state.sections.length == 0) {
							this.refs.toast.show('抱歉,没有查到相关数据！', DURATION.LENGTH_SHORT);

						}
					});

					this.setState({
						dataSource:data.data,
						isSearch: false,
					})

					// this.sortAddress();
				} else {
					//this.refs.toast.show('抱歉,没有查到相关数据！', DURATION.LENGTH_SHORT);
					this.setState({
						dataSource:[],
						isSearch: true,
					})
				}
			}else {
			this.refs.toast.show(data.msg);
		}

		});
	};

	fetchData = () => {
        this._searchInputBox.blur();
		let url = Path.getGroupMember;
		let params = {
			occupantNick : this.state.searchText,
			roomJid : this.state.room.roomJid,
			uuId : this.state.uuid,
			ticket : this.state.ticket,
			currentJidNode : this.state.basic.jidNode,
			userId : this.state.basic.userId
		};
		FetchUtil.netUtil(url,params,'POST',this.props.navigation,Global.basicParam,(data) => {
			if(data == 'tip'){
                this.refs.toast.show('群组成员获取失败！');
			} else if (data.code == '200') {
				this.setState({
					dataSource: this.prepend(data.data, {'occupantTrueName': '全员'})
				});
				// this.sortAddress();
			} else {
                // this.refs.toast.show('您还没有联系人');
				// this.refs.toast.show('您还没有联系人', DURATION.LENGTH_SHORT);
			}
		});
	}
    _toast = (text) => {
        this.setState({
            showAlert: true,//alert框
            tipMsg: text//alert提示信息
        });
    };
	prepend = (arr, item) => {
		return [item].concat(arr);

	}

	sortAddress() {
		let sectionsListSource = [];
		let tempList = this.state.dataSource,
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
				change = {...item, scrollHeight: (ITEM_HEIGHT * 2)}
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
					}
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
					onCancelPressed={() => {
						this.hideAlert();
					}}
					onConfirmPressed={() => {
						this.hideAlert();
					}}
				/>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={2000}/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={this.props.cencalAtMember}
					backTitle={'取消'}
					title={'选择提醒的人'}
				/>
				<View style={[baseStyles.flex_one,baseStyles.bkcolor_white,styles.atMemberFitsh]}>
					<View style={styles.atSecond}>
						<View style={[baseStyles.flex_one,baseStyles.flex_row,baseStyles.bkcolor_white,styles.searchTop]}>
							<TextInput
                                ref={(TextInput) => this._searchInputBox = TextInput}
								style={[baseStyles.flex_one,baseStyles.bkcolor_white,styles.searchTextInput]}
								placeholderTextColor={'#CCCCCC'}
								placeholder={'搜索...'}
								underlineColorAndroid={'transparent'}
								multiline={false}
								returnKeyType={'search'}
								onSubmitEditing={this._searchFriend}
								onChangeText={(text) => this._setSearchText(text)}
								value={this.state.searchText}
							/>
							<TouchableOpacity onPress={() => this._searchFriend()}>
								<View style={{width: 25, height: 30, justifyContent: 'center'}}>
									<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
								</View>
							</TouchableOpacity>
						</View>
					</View>

					{!this.state.isSearch ? <ScrollView
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						ref='scroll'>
						{this._renderItem()}
					</ScrollView> : <View style={{flex: 1, alignItems: 'center', paddingTop: 20}}><Text
						style={{color: '#aaaaaa'}}>{'暂无相关数据'}</Text></View>}

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
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		right: 0
	},
	friendList: {
		flexDirection: 'row',
		paddingTop: 7,
		paddingBottom: 6,
		marginLeft: 10,
		height: ITEM_HEIGHT,
	},
	headFriend: {
		width: 32,
		height: 32,
		marginRight: 11,
	},
	textFriend: {
		lineHeight: 32,
		flex: 1,
		height: 32,
		backgroundColor: "#FFFFFF",
		color: '#333',
		textAlignVertical: 'center',
		fontSize: 15,
	},
	sectionScroll: {
		position: 'absolute',
		width: 15,
		right: 0,
		top: 0,
		bottom: 0,
		backgroundColor: 'transparent',
		justifyContent: 'center',
		alignItems: 'center'
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
	atMemberFitsh: {borderBottomWidth: 1, borderBottomColor: '#d0d0d0', position: 'relative'},
	atSecond: {backgroundColor: '#f0f0f0',height: 48,borderBottomWidth: 1,borderBottomColor: '#e5e5e5'},
	searchTop :{
		margin: 8,
		borderWidth: 1,
		borderRadius: 6,
		borderColor: '#CCCCCC'
	},
	searchTextInput:{
		height: 30,
		borderColor: 'transparent',
		borderWidth: 1,
		borderRadius: 6,
		paddingTop: 0,
		paddingBottom: 0,
		paddingLeft: 8,
		paddingRight: 8
	}
});