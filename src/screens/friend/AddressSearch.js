import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	TouchableOpacity,
	ScrollView,
	TextInput
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Icons from 'react-native-vector-icons/Ionicons';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Global from "../../util/Global";
import AwesomeAlert from "react-native-awesome-alerts";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";

const ITEM_HEIGHT = 48; //item的高度
export default class AddressSearch extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sections: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			searchText: '',
			searchContent: '',//上一次搜索的内容记录
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	}

	_setSearchText = (text) => {
		this.setState({
			searchText: text
		});
	};

	_searchUser = () => {
		this._searchInputBox.blur();
		if (this.state.searchText.replace(/(^\s*)|(\s*$)/g, "") == '') {
			this.setState({
				showAlert: true,//alert框
				tipMsg: '搜索内容不能为空！'//alert提示信息
			});
			return false;
		}
		if (this.state.searchText != this.state.searchContent) {
			FetchUtil.netUtil(Path.getUserList, {
				realId: this.state.basic.jidNode,
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId,
				trueNameLike: this.state.searchText,
			}, 'POST', this.props.navigation, Global.basicParam, (data) => {
				if (data == 'tip') {
					this.refs.toast.show('网络错误，搜索联系人失败');
				} else if (data.status == 'true') {
					if (data.data.user.length > 0) {
						this.setState({
							isOpen: true,
							sections: data.data.user,
							isSearch: this.state.searchText == '' ? false : true
						});
					} else {
						this.setState({
							isOpen: true,
							sections: [],
							isSearch: this.state.searchText == '' ? false : true,
							searchContent: this.state.searchText
						}, () => {
							this.refs.toast.show('抱歉,没有查到相关人员！', DURATION.LENGTH_SHORT);
						});
					}
				} else {
					this.refs.toast.show('操作失败！', DURATION.LENGTH_SHORT);
				}

			});
		}
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
						<View style={{flex: 1}}>
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
								onChangeText={(text) => this._setSearchText(text)}
								autoFocus={true}
								returnKeyType={'search'}
								onSubmitEditing={this._searchUser}
								value={this.state.searchText}
							/>
						</View>
						<TouchableOpacity onPress={() => {
							HandlerOnceTap(() => this._searchUser())
						}}>
							<View style={{width: 25, height: 30, justifyContent: 'center'}}>
								<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
							</View>
						</TouchableOpacity>
					</View>
				</View>
				<View style={{flex: 1}}>
					{this.state.sections.length > 0 ? (
						<ScrollView
							ref={(scrollView) => {
								this._scrollView = scrollView;
							}}
							automaticallyAdjustContentInsets={true}
							scrollEventThrottle={200}
							showsVerticalScrollIndicator={false}
							showsHorizontalScrollIndicator={false}
							style={{paddingLeft: 8, paddingRight: 8}}
						>
							{this.state.sections.map((item, index) => {
								return (
									<TouchableOpacity key={index} onPress={() => {
										HandlerOnceTap(
											() => {
												this.props.navigation.navigate('FriendDetail', {
													ticket: this.state.ticket,
													uuid: this.state.uuid,
													friendJidNode: item.jidNode,
													tigRosterStatus: 'both',
													basic: this.state.basic
												});
											}, "FriendDetail"
										)
									}}>
										<View style={{
											height: 50,
											flexDirection: 'row',
											alignItems: 'center',
											borderBottomWidth: 1,
											borderBottomColor: '#c3c3c3'
										}}>
											<View style={{justifyContent: 'center', alignItems: 'center'}}>
												<Image
													source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&imageName=' + item.photoId + '&userId=' + this.state.basic.userId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode=' + item.jid_node}}
													//source={{uri: Path.headImg + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileName=' + item.photoId + '&userId=' + this.state.basic.userId}}
													style={{width: 36, height: 36, borderRadius: 4}}/>
											</View>
											<View style={{marginLeft: 8}}><Text>{`${item.trueName}(${item.branchName})`}</Text></View>
										</View>
									</TouchableOpacity>
								)
							})}
						</ScrollView>
					) : (<View style={{flex: 1, alignItems: 'center', paddingTop: 20}}><Text
						style={{color: '#e2e2e2'}}>{this.state.isSearch ? '抱歉，没有查到相关人员' : '请搜索想要查找的人员'}</Text></View>)}
				</View>
			</View>
		)
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
	}
});