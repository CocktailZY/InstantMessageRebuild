import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	TouchableOpacity,
	Platform,
	ScrollView, Dimensions,BackHandler,
	TextInput, NativeModules
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

let lastPresTime = 1;
export default class GroupJoin extends Component {
	static navigationOptions = {
		header: null
	};

	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			searchText: '',
            isSearch:false,
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	}

	componentDidMount() {
		//this.fetchData();
        this.footBackKey = BackHandler.addEventListener("back", ()=>{
            let curTime = new Date().getTime();
            if (curTime - lastPresTime > 500) {
                lastPresTime = curTime;
                return false;
            }
            return true;
        });
	};
    componentWillUnmount(){
        this.footBackKey.remove();
    }
	fetchData = () => {
		FetchUtil.netUtil(Path.getGroups, {}, 'POST', this.props.navigation, Global.basicParam, (responseJson) => {
            if (responseJson == 'tip') {
                this.refs.toast.show("群组获取失败！", DURATION.LENGTH_SHORT);
            }else if (responseJson.code.toString() == '200') {
				this.setState({
					dataSource: responseJson.data
				});
			}
		})
	};

	_setSearchText = (text) => {
		this.setState({
			searchText: text
		});
	};
	_searchFriend = () => {
		this._searchInputBox.blur();
		if (this.state.searchText.length > 0){
			FetchUtil.netUtil(Path.getGroups, {roomName:this.state.searchText}, 'POST', this.props.navigation, Global.basicParam, (responseJson) => {

                if (responseJson == 'tip') {
                    this.refs.toast.show(" 搜索群组失败！ ", DURATION.LENGTH_SHORT);
                }else if (responseJson.code.toString() == '200') {
					if (responseJson.data.length > 0){
						this.setState({
							dataSource: responseJson.data
						});
					}else {
						this.setState({
							dataSource: [],
                            isSearch:true
						},() => {
                            this.refs.toast.show('抱歉,没有查到相关群！', DURATION.LENGTH_SHORT);
						});
					}
				}
			});
		}else {
			this._toast('搜索内容不能为空！');
		}
	};

	_renderFriendItem = () => {
		var itemView = [];
		this.state.dataSource.map((item, index) => {
			console.log(item);
			console.log(Path.groupHeadImg + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileName=' + item.photoId + '&type=groupImage' + '&userId=' + this.state.basic.userId);
			itemView.push(
				<View key={index} style={{height: 50, flexDirection: 'row', paddingLeft: 8, paddingRight: 8}}>
					<TouchableOpacity style={{
						flex: 1,
						flexDirection: 'row',
						alignItems: 'center',
						borderBottomWidth: 1,
						borderBottomColor: '#dddddd'
					}} onPress={()=>{HandlerOnceTap(
                        () => {
                            this.props.navigation.navigate('GroupDetail', {
                                'ticket': this.state.ticket,
                                'uuid': this.state.uuid,
                                'room': item,
                                'basic': this.state.basic,
                                'isQRCode': false
                            });
                        }
					)}}>
						<Image
							source={{uri: Path.groupHeadImg + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileInfoId=' + item.photoId + '&type=groupImage&userId=' + this.state.basic.userId}}
							style={{
								width: 36,
								height: 36,
								borderRadius: 4,
								marginLeft: 8
							}}/>
						<View style={{flex: 1, justifyContent: 'center'}}>
							<Text style={{fontSize: 15, marginLeft: 8}}>{item.roomName}</Text>
						</View>
					</TouchableOpacity>
				</View>
			)
		});
		return itemView;
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
                <Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'加入群'}
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
									height: 30,
									backgroundColor: '#FFFFFF',
									borderColor: 'transparent',
									borderLeftWidth: 1,
									borderTopLeftRadius: 6,
									borderBottomLeftRadius: 6,
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
						</View>
						<TouchableOpacity onPress={()=>{HandlerOnceTap(() => this._searchFriend())}}>
							<View style={{width: 25, height: 30, justifyContent: 'center'}}>
								<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
							</View>
						</TouchableOpacity>
					</View>
				</View>
				<View style={{flex: 1}}>
					{this.state.dataSource.length > 0 ? (
						<ScrollView
							ref={(scrollView) => {
								this._scrollView = scrollView;
							}}
							automaticallyAdjustContentInsets={true}
							scrollEventThrottle={200}
							onContentSizeChange={() => {
								// this._scrollView.scrollToEnd(true);
							}}
							showsVerticalScrollIndicator={false}
							showsHorizontalScrollIndicator={false}
						>
							{this._renderFriendItem()}
						</ScrollView>
					) : (<View style={{flex: 1, alignItems: 'center', paddingTop: 20}}><Text
						style={{color: '#e2e2e2'}}>{this.state.isSearch ? '抱歉,没有查到相关群' : '请搜索想要加入的群'}</Text></View>)}
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
});