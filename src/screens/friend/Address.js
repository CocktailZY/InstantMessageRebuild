/**
 * 底部导航器
 * 导入原生组件
 */
import React, {Component} from 'react';
import {
	Platform,
	View,
	StyleSheet,
	ScrollView,
	TextInput,
	TouchableOpacity,
	Text, BackHandler,
	DeviceEventEmitter, TouchableWithoutFeedback,
	Image
} from 'react-native';
import Icons from 'react-native-vector-icons/Ionicons';
import Header from '../../component/common/Header';
import Sqlite from "../../util/Sqlite";
import HandlerOnceTap from '../../util/HandlerOnceTap';

let lastPresTime = 1;
export default class Address extends Component {
	static navigationOptions = {
		header: null
	};

	constructor(props) {
		super(props);
		this.state = {
			treeData: [],
			isOpen: true,
			searchText: '',
			isSearch: false,
			selectedKeys: [],
			expandedKeys: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			jidNode: props.navigation.state.params.jidNode,
			basic: props.navigation.state.params.basic,
			isLoading: true
		}
	}

	componentDidMount() {
		this._fetchAddress();
		this.updateAddressListener = DeviceEventEmitter.addListener('updateAddress', (params) => {
			//请求本地数据库
			Sqlite.selectDepartment(this.state.basic.userId, "0", (res) => {
				this.setState({
					treeData: res,

				});
			})
		});
		this.footBackKey = BackHandler.addEventListener("back", () => {
			let curTime = new Date().getTime();
			if (curTime - lastPresTime > 500) {
				lastPresTime = curTime;
				return false;
			}
			return true;
		});
	};

	componentWillUnmount() {
		this.updateAddressListener.remove();
		this.footBackKey.remove();
	}

	componentDidUpdate() {
		DeviceEventEmitter.emit('changeLoading','false');
	}

	_setSearchText = (text) => {
		this.setState({
			searchText: text,
		});
	};
	_searchAddress = () => {
		this.props.navigation.navigate('AddressSearch', {
			ticket: this.state.ticket,
			uuid: this.state.uuid,
			basic: this.state.basic
		});
	};

	_fetchAddress = () => {
		DeviceEventEmitter.emit('changeLoading','true');
		Sqlite.selectValueByKey(this.state.basic.userId, 'userList_0', (version) => {
			let params = {};
			params.uuid = this.state.uuid;
			params.ticket = this.state.ticket;
			params.version = version ? version.value : '';
			params.userId = this.state.basic.userId;
			params.realId = this.state.jidNode;
			params.deptId = '0';

			DeviceEventEmitter.emit('userListListener', params);
			// DeviceEventEmitter.emit('changeLoading','false');
			//NativeModules.IMModule.request("userList",this.state.ticket,this.state.uuid,this.state.jidNode,this.state.basic.userId,"0",version ? version.value : '');
		});
		Sqlite.selectDepartment(this.state.basic.userId, '0', (res) => {
			this.setState({
				treeData: res
			});
		});
	};

	_onBlurText = () => {
		this._searchInputBox.blur()
	};

	_onFocusText = () => {
		this._searchInputBox.focus();
	};


	render() {
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'通讯录'}
				/>
				<View style={{
					backgroundColor: '#f0f0f0',
					height: 48,
				}}>
					{Platform.OS == 'ios' ? (<TouchableOpacity style={{
						flex: 1,
						flexDirection: 'row',
						margin: 8,
						backgroundColor: '#FFFFFF',
						borderWidth: 1,
						borderRadius: 6,
						borderColor: '#CCCCCC'
					}} onPress={() => {
						HandlerOnceTap(() => this._searchAddress())
					}}>

						<View style={{
							flex: 1,
							height: 30,
							flexDirection: 'row',
							backgroundColor: '#FFFFFF',
							borderColor: 'transparent',
							borderWidth: 1,
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 6,
							paddingTop: 0,
							paddingBottom: 0,

						}}>
							<Text style={{color: '#CCCCCC', fontSize: 15, lineHeight: 30, paddingRight: 10}}>{'搜索'}</Text>
							<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
						</View>
					</TouchableOpacity>) : (<TouchableOpacity style={{
						flex: 1,
						flexDirection: 'row',
						margin: 8,
						backgroundColor: '#FFFFFF',
						borderWidth: 1,
						borderRadius: 6,
						borderColor: '#CCCCCC'
					}} onPress={() => {
						HandlerOnceTap(() => this._searchAddress())
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
							editable={false}
						/>
						<View style={{width: 25, height: 30, justifyContent: 'center'}}>
							<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
						</View>
					</TouchableOpacity>)}
				</View>
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
					{this.state.treeData.map((item, index) => {
						return (
							<TouchableOpacity key={index} onPress={() => {
								HandlerOnceTap(
									() => {
										this.props.navigation.navigate('AddressSec', {
											ticket: this.state.ticket,
											uuid: this.state.uuid,
											jidNode: this.state.basic.jidNode,
											basic: this.state.basic,
											parentDeptName: item.department_name,
											parentDeptId: item.department_id
										});
									}, "address_2"
								)
							}}>
								<View style={{
									height: 50,
									flexDirection: 'row',
									alignItems: 'center',
									borderBottomWidth: 1,
									borderBottomColor: '#c3c3c3'
								}}>
									<View style={{
										width: 36,
										height: 36,
										borderRadius: 4,
										backgroundColor: '#278eee',
										justifyContent: 'center',
										alignItems: 'center'
									}}>
										<Image source={require('../../images/department.png')} style={{width: 24, height: 24}}/>
									</View>
									<View style={{marginLeft: 8}}><Text>{item.department_name}</Text></View>
								</View>
							</TouchableOpacity>
						)
					})}
					{/* <TreeView data={this.state.treeData} isSearch={this.state.isSearch} ticket={this.state.ticket}
                              uuid={this.state.uuid} mynavigate={this.props.navigation} basic={this.state.basic}/>*/}
				</ScrollView>
			</View>
		);
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		// justifyContent: 'center',
		// alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
});