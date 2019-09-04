import React, {Component} from 'react';
import {
	StyleSheet, Text, View, TextInput, Image,
	TouchableOpacity, ScrollView,
} from 'react-native';
import Toast, {DURATION} from 'react-native-easy-toast';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import Path from "../../config/UrlConfig";
import Sqlite from "../../util/Sqlite";
import HandlerOnceTap from '../../util/HandlerOnceTap';

const ITEM_HEIGHT = 46; //item的高度

export default class TranspondMember extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchText: '',
			uuid: props.uuid,
			ticket: props.ticket,
			basic: props.basic,
			friendDetail: props.friendDetail,
			dataSource: [],
			textVal: '',
			isShow: false,
			fileItem: props.TranspondMemberItem
		}
	};

	_getFriendId = (info) => {
		this.props.getFriendNowID(info, this.state.fileItem);
	};
	_renderItem = () => {
		let tempArr = [];
		this.state.dataSource.map((item, index) => {
			let txt = item.trueName;
			tempArr.push(
				<TouchableOpacity
					key={index}
					onPress={()=>{HandlerOnceTap(this._getFriendId.bind(this, item))}}
					style={[styles.friendList, {
						borderTopWidth: 1,
					}, index == 0 ? {borderTopColor: 'transparent'} : {borderTopColor: '#d0d0d0'}]}
				>
					<Image
						source={{uri: Path.headImg + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&fileName=' + item.image_name}}
						style={styles.headFriend}/>
					<Text style={styles.textFriend}>{txt}</Text>
				</TouchableOpacity>
			)
		});
		return tempArr;
	};

	componentDidMount() {
		this.fetchData();
	}

	_setSearchText = (text) => {
		this.setState({
			searchText: text
		});
	};
	_searchFriend = () => {
		if (this.state.searchText.replace(/(^\s*)|(\s*$)/g, "") == '') {
			this.refs.toast.show('搜索内容不能为空', DURATION.LENGTH_SHORT);

			return false;
		}
		Sqlite.selectTalkersByTrueName(this.state.basic.userId, this.state.searchText, (data) => {
			this.setState({
				dataSource: data
			});
		})
	};

	fetchData = () => {
		Sqlite.selectTalkers(this.state.basic.userId, "", (data) => {
			this.setState({
				dataSource: data
			});
		})
	};


	render() {
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={this.props.cencalTranspondMember}
					backTitle={'取消'}
					title={'选择要发送的人'}
				/>
				<View style={{
					flex: 1,
					backgroundColor: '#FFFFFF',
					borderBottomWidth: 1,
					borderBottomColor: '#d0d0d0',
					position: 'relative'
				}}>
					<View style={{
						backgroundColor: '#f0f0f0',
						height: 48,
						borderBottomWidth: 1,
						borderBottomColor: '#e5e5e5'
					}}>
						<View style={{
							flex: 1,
							flexDirection: 'row',
							margin: 8,
							backgroundColor: '#FFFFFF',
							borderWidth: 1,
							borderRadius: 6,
							borderColor: '#CCCCCC'
						}}>
							<TextInput
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
								returnKeyType={'search'}
								onSubmitEditing={this._searchFriend}
								onChangeText={(text) => this._setSearchText(text)}
								value={this.state.searchText}
							/>
							<TouchableOpacity onPress={()=>{HandlerOnceTap(() => this._searchFriend())}}>
								<View style={{width: 25, height: 30, justifyContent: 'center'}}>
									<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
								</View>
							</TouchableOpacity>
						</View>
					</View>
					<ScrollView
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						ref='scroll'>
						{this._renderItem()}
					</ScrollView>
					{
						this.state.isShow ? <View style={styles.modelView}>
							<View style={styles.viewShow}>
								<Text style={styles.textShow}>{this.state.textVal}</Text>
							</View>
						</View> : null
					}
				</View>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
			</View>
		)
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
});