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
	Text,
	DeviceEventEmitter
} from 'react-native';
import TreeView from '../../component/common/TreeView'
import Icons from 'react-native-vector-icons/Ionicons';
import Header from '../../component/common/Header';
import Sqlite from "../../util/Sqlite";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import AwesomeAlert from "react-native-awesome-alerts";

let flage = false;//查询本地库数据为空的标记 true表示为空
export default class Address extends Component {
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
			parentDeptId: props.navigation.state.params.parentDeptId,
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	}

	componentDidMount() {
		flage = false;
		this._fetchAddress();
		this.updateAddressListener = DeviceEventEmitter.addListener('refAddressThirdList', (params) => {
			if (this.state.parentDeptId == params.deptId && params.tree) {
				this.setState({
					treeData: params.tree.tree.length > 0 ? params.tree.tree : ""
				});
			}
			if (this.state.parentDeptId == params.deptId && ((flage && !params.tree) || (params.tree && params.tree.tree.length == 0))) {
				this.setState({
					showAlert: true,//alert框
					tipMsg: '抱歉,没有查到相关数据！'//alert提示信息
				});
			}
		});
	};

	componentWillUnmount() {
		this.updateAddressListener.remove();
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

	componentDidUpdate() {
	}

	_fetchAddress = () => {
		Sqlite.selectValueByKey(this.state.basic.userId, 'userList_' + this.state.parentDeptId, (version) => {
			if (!version) {
				this.setState({
					treeData: null
				});
			}
			let params = {};
			params.uuid = this.state.uuid;
			params.ticket = this.state.ticket;
			params.version = version ? version.value : '';
			params.userId = this.state.basic.userId;
			params.realId = this.state.jidNode;
			params.deptId = this.state.parentDeptId;


			DeviceEventEmitter.emit('userLastListListener', params);
		});
		Sqlite.selectValueByKey(this.state.basic.userId, 'tree_' + this.state.parentDeptId, (res) => {
			if (res) {
				let tdata = JSON.parse(res.value).tree;
				if (tdata.length > 0) {
					flage = false;
					this.setState({
						treeData: tdata
					});
				} else {
					flage = true;
					this.setState({
						treeData: ""
					});
				}
			} else {
				flage = true;
			}
		});
	};

	_onBlurText = () => {
		this._searchInputBox.blur()
	};

	_onFocusText = () => {
		this._searchInputBox.focus();
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
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={this.props.navigation.state.params.parentDeptName}
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
					<TreeView data={this.state.treeData} isSearch={this.state.isSearch} ticket={this.state.ticket}
										uuid={this.state.uuid} mynavigate={this.props.navigation} basic={this.state.basic}/>
				</ScrollView>
			</View>
		);
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF'
	},
});