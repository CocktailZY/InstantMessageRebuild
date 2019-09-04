import React, {Component} from 'react';
import {
	StyleSheet, Text, View, TextInput, Platform, TouchableOpacity, ScrollView, FlatList, TouchableWithoutFeedback
} from 'react-native';
import Header from '../../component/common/Header';
import DeviceInfo from 'react-native-device-info';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Icons from 'react-native-vector-icons/Ionicons';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import AwesomeAlert from "react-native-awesome-alerts";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Global from "../../util/Global";
import Toast, {DURATION} from 'react-native-easy-toast';

export default class ParticipantsList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			ticket: props.infor.ticket,
			uuid: props.infor.uuid,
			basic: props.infor.basic,
			//层级遍历数组
			participantsList: [
				{list: [], touch: false},
				{list: [], touch: false},
				{list: [], touch: false},
				{list: [], touch: false},
				{list: [], touch: false}
			],//各个部门数组
			selectedArrBox: [],//当前页面显示的已选中人员数组
			selectedArr: [],//当前选中人员数组
			selectedParticipants: props.infor.selectedParticipants,//传过来的可操作数组(常用联系人中当前选中的人员数组)
			selectNotArr: JSON.parse(JSON.stringify(props.infor.selectedNot)),//传过来的已选中人员数组（不可操作）
			type: props.infor.type ? props.infor.type : '',//用于判断是否移除最后一个成员，工作邀请不需要移除
			selectedDepts: [],//选中部门数组
			searchText: '',//搜索内容
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	}

	componentDidMount() {

		this.getParticipantsList();
		if (this.state.type.length == 0) {

			if (this.state.selectNotArr.length == this.props.infor.selectedNot.length) {
				this.state.selectNotArr.splice(-1, 1);
			}
		}
		this.state.selectNotArr.map((item) => {
			item.notTouch = true;
		});
		this.setState({
			selectedArrBox: this.state.selectedParticipants.concat(this.state.selectNotArr)
		});
	}

	getParticipantsList(body, number, type) {
		let pid = !body ? '0' : body.branchNo;
		let num = !number ? 0 : number;
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			realId: this.state.basic.jidNode,
			deptId: pid
		}
		let participantsList = this.state.participantsList;
		if (!!number) {//判断是否选择的是部门并判断是否更改显示状态
			let showNum = number - 1;
			let nowList = participantsList[showNum].list;
			for (let i in nowList) {
				if (nowList[i].branchNo == pid) {
					nowList[i].iconType = type ? true : !nowList[i].iconType;
				} else {
					nowList[i].iconType = false;
				}
			}
			if (!body.iconType && !type) {
				this.isVisibleSon(num);
				return false;
			}
		}
		FetchUtil.netUtil(Path.getParticipantsList + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (data) => {
			if (data == "tip") {
				// this._toast('设置完成失败！');
				this.refs.toast.show('查询参与人通讯录列表失败！', DURATION.LENGTH_SHORT);
			} else if (data.code.toString() == '200') {
				const box = data.data;
				let selectedArrBox = JSON.parse(JSON.stringify(this.state.selectedArrBox));
				for (let ij = 0 ; ij < selectedArrBox.length ; ij++){
					if (selectedArrBox[ij].isBlack) {
						// this.state.selectNotArr.splice(j, 1);
						selectedArrBox.splice(ij, 1);//去除空box
						ij--;
					}
				}
				let selectedArr = JSON.parse(JSON.stringify(this.state.selectedArr));
				let selectedParticipants = JSON.parse(JSON.stringify(this.state.selectedParticipants));
				let selectNotArr = JSON.parse(JSON.stringify(this.state.selectNotArr));
				let users = [];
				box.users.map((item) => {
					if (type) {//判断选中部门下属人员状态显示
						item.selectedType = true;
					}
					for (let j in selectedArrBox) {
						if (item.jidNode == selectedArrBox[j].jidNode) {
							item.selectedType = true;
						}
					}
					users.push(item);//当前需要显示的人员数组
				});
				if (type) {//如果为部门前加号选中人需将请求回的人员遍历添加进选中数组内
					users.map((item) => {
						let selectType = true;//是否需要加入的状态
						for (let i in selectedArr) {
							if (item.jidNode == selectedArr[i].jidNode || item.jidNode == this.state.basic.jidNode) {
								selectType = false;//选中数组中已有不应该再加入
							}
						}

						for (let j in selectedParticipants) {
							if (item.jidNode == selectedParticipants[j].jidNode || item.jidNode == this.state.basic.jidNode) {
								selectType = false;//选中数组中已有不应该再加入
							}
						}
						for (let j in selectNotArr) {
							if (item.jidNode == selectNotArr[j].jidNode || item.jidNode == this.state.basic.jidNode) {
								selectType = false;//选中数组中已有不应该再加入
							}
						}
						if (selectType) {
							selectedArr.push(item);
						}
					});
				}
				let arrey = box.subDepts.concat(users);
				for (let i = num; i < participantsList.length; i++) {//将当前需要显示的列表以外所有数组清空实现关闭状态
					participantsList[i].list = [];
				}
				participantsList[num].list = arrey;//显示的列表数组
				participantsList[num].touch = pid;//当前显示的部门id

				this.setState({
					participantsList: participantsList,
					selectedArr: selectedArr,
					selectedArrBox: this.state.selectedParticipants.concat(this.state.selectNotArr).concat(selectedArr)
				}, () => {
					let newArrBox = JSON.parse(JSON.stringify(this.state.selectedArrBox));
					let blackView = newArrBox.length % 5;
					if(blackView != 0){
						let tempView = {isBlack:true};
						switch (blackView) {
							case 1:
								newArrBox.push(tempView);
								newArrBox.push(tempView);
								newArrBox.push(tempView);
								newArrBox.push(tempView);
								break;
							case 2:
								newArrBox.push(tempView);
								newArrBox.push(tempView);
								newArrBox.push(tempView);
								break;
							case 3:
								newArrBox.push(tempView);
								newArrBox.push(tempView);
								break;
							case 4:
								newArrBox.push(tempView);
								break;
							default: //console.log('添加空view进入default');
						}
					}
					this.setState({
						selectedArrBox: newArrBox
					})
				});
			}
		});
	}

	//搜索人员
	_searchPeople = () => {
		let searchText = this.state.searchText.replace(/(^\s*)|(\s*$)/g, "");//清除搜索内容前后空格
		this._searchInputBox.blur();
		if (searchText == '') {//为空时执行进入页面的方法显示部门结构树
			this.getParticipantsList();
			return false;
		}
		let searchList = this.state.participantsList;
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			realId: this.state.basic.jidNode,
			trueNameLike: searchText,
		};
		FetchUtil.netUtil(Path.getUserList, params, 'POST', this.props.navigation, Global.basicParam, (data) => {
			if (data == "tip") {
				// this._toast('设置完成失败！');
				this.refs.toast.show('查询联系人列表！', DURATION.LENGTH_SHORT);
			} else if (data.status == 'true') {
				let users = data.data.user;
				let selectedArrBox = this.state.selectedArrBox;
				if (users.length > 0) {
					//将所有数组清空以单独显示搜索结果
					for (let i in searchList) {
						searchList[i].list = [];
					}
					//返回列表与选中人列表进行比对
					for (let i in users) {
						for (let j in selectedArrBox) {
							if (users[i].jidNode == selectedArrBox[j].jidNode) {
								users[i].selectedType = true;
							}
						}
					}
					searchList[0].list = users;
					this.setState({participantsList: searchList}, () => {
					})
				} else {
					this.getParticipantsList();
					this.setState({
						showAlert: true,//alert框
						tipMsg: '抱歉，没有查到相关人员！'//alert提示信息
					});
				}
			} else {
				this.refs.toast.show('操作失败！', DURATION.LENGTH_SHORT);
			}
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

	_renderHeadList = ({item, index}) => {
		if(item.isBlack){
			return (
				<TouchableOpacity disabled={true} key={index} style={{
					backgroundColor: 'transparent',
					borderRadius: 4,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					height: 24,
					paddingLeft:5,
					paddingRight:5,
				}} onPress={() => {
					// HandlerOnceTap(() => this.selectedAdd(item))
					// this.selectedAdd(item)
				}}>
					<Text style={{
						fontSize: 12,
						color: 'transparent',
						marginRight: 5,
					}}>{'张三'}</Text>
				</TouchableOpacity>
			)
		}else{
			return (
				<TouchableOpacity disabled={item.notTouch} key={index} style={{
					backgroundColor: '#404040',
					borderRadius: 4,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					height: 24,
					paddingLeft:5,
					paddingRight:5,
				}} onPress={() => {
					// HandlerOnceTap(() => this.selectedAdd(item))
					this.selectedAdd(item)
				}}>
					<Text style={{
						fontSize: 12,
						color: 'white',
						marginRight: 5,
					}}>{item.trueName}</Text>
					{
						!item.notTouch ? <Icons name={'ios-close'} size={20} color={'#000'}/> : null
					}
				</TouchableOpacity>
			)
		}
	};

	render() {
		const {participantsList, showAlert, tipMsg, selectedArrBox} = this.state;
		return (
			<View style={styles.container}>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={this.props.cancelParticipants}
					backTitle={'返回'}
					title={this.props.title}
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
							placeholder={'搜索人员...'}
							underlineColorAndroid={'transparent'}
							multiline={false}
							returnKeyType={'search'}
							onSubmitEditing={this._searchPeople}
							onChangeText={(text) => this.setState({searchText: text})}
							value={this.state.searchText}
						/>
						<TouchableOpacity style={{width: 25, height: 30, justifyContent: 'center'}}
															onPress={() => {
																HandlerOnceTap(this._searchPeople)
															}}>
							<Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
						</TouchableOpacity>
					</View>
				</View>
				{
					selectedArrBox.length > 0 ?
						<View style={{borderBottomColor: '#d7d7d7', borderBottomWidth: 1, maxHeight: 100}}>
							<FlatList
								ref={(flatList) => this._flatList = flatList}
								renderItem={this._renderHeadList}
								numColumns={5}
								columnWrapperStyle={{justifyContent:'space-between',margin:5}}
								//horizontal={true}
								data={selectedArrBox}>
							</FlatList>
							{/*<ScrollView
								ref={(scrollView) => {
									this._scrollView = scrollView;
								}}
								showsVerticalScrollIndicator={false}
								showsHorizontalScrollIndicator={false}
								onContentSizeChange={() => {
									this._scrollView.scrollToEnd({animated: true});
								}}>
								<View style={{flexDirection: 'row', flexWrap: 'wrap', paddingTop: 6}}>
									{
										this.state.selectedArrBox.map((item, index) => {

											return <TouchableOpacity disabled={item.notTouch} key={index} style={{
												backgroundColor: '#404040',
												borderRadius: 4,
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'center',
												margin: 6,
												marginTop: 0,
												height: 24,
												paddingLeft: 6,
												paddingRight: 6
											}} onPress={() => {
												// HandlerOnceTap(() => this.selectedAdd(item))
												this.selectedAdd(item)
											}}>
												<Text style={{
													fontSize: 12,
													color: 'white',
													marginRight: 8,
												}}>{item.trueName}</Text>
												{
													!item.notTouch ? <Icons name={'ios-close'} size={20} color={'#000'}/> : null
												}
											</TouchableOpacity>
										})
									}
								</View>
							</ScrollView>*/}
						</View> : null
				}
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					style={{paddingLeft: 10, flex: 1}}>
					{
						participantsList[0].list.map((item, index) => {
							return (
								<View key={index}>
									{this.listShowItem(item, 0, index)}
									{
										participantsList[1].touch == item.branchNo ?
											<ScrollView scrollEnabled={false} style={{marginLeft: 10}}>
												{
													participantsList[1].list.map((resA, inx) => {
														return (
															<View key={inx}>
																{this.listShowItem(resA, 1, index)}
																{
																	participantsList[2].touch == resA.branchNo ?
																		<ScrollView scrollEnabled={false}
																								style={{marginLeft: 10}}>
																			{
																				participantsList[2].list.map((resB, i) => {
																					return (
																						<View key={i}>
																							{this.listShowItem(resB, 2, index)}
																							{
																								participantsList[3].touch == resB.branchNo ?
																									<ScrollView
																										scrollEnabled={false}
																										style={{marginLeft: 10}}>
																										{
																											participantsList[3].list.map((resC, n) => {
																												return (
																													<View
																														key={n}>
																														{this.listShowItem(resC, 3, index)}
																														{
																															participantsList[4].touch == resC.branchNo ?
																																<ScrollView
																																	scrollEnabled={false}
																																	style={{marginLeft: 10}}>
																																	{
																																		participantsList[4].list.map((resD, a) => {
																																			return (
																																				<View
																																					key={a}>
																																					{this.listShowItem(resD, 4, index)}
																																				</View>
																																			)
																																		})
																																	}
																																</ScrollView> : null
																														}
																													</View>
																												)
																											})
																										}
																									</ScrollView> : null
																							}
																						</View>
																					)
																				})
																			}
																		</ScrollView> : null
																}
															</View>
														)
													})
												}
											</ScrollView> : null
									}
								</View>
							)
						})
					}
				</ScrollView>
				<TouchableOpacity
					style={{
						height: 43,
						borderRadius: 4,
						backgroundColor: '#549dff',
						justifyContent: 'center',
						alignItems: 'center',
						margin: 14,
						marginLeft: 12,
						marginRight: 12
					}}
					onPress={() => {
						HandlerOnceTap(
							() => this.props.selectedParticipants(this.state.selectedParticipants.concat(this.state.selectedArr))
						)
					}}>
					<Text style={{fontSize: 16, color: 'white'}}>确定</Text>
				</TouchableOpacity>
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

	//遍历结构列表
	listShowItem = (body, num, index) => {//body为传入信息；num为部门层级在遍历数组中的位置确定是否关闭；index当前遍历位置
		if (body.jidNode) {//人员
			if (body.jidNode != this.state.basic.jidNode) {
				let showType = false;
				for (let i in this.state.selectNotArr) {//遍历当前人员是否在可操作范围内
					if (body.jidNode == this.state.selectNotArr[i].jidNode) {
						showType = true;
					}
				}
				// if(showType){
				return <TouchableOpacity
					disabled={showType}
					style={[styles.touchRow, {borderTopColor: index == 0 ? 'transparent' : '#d7d7d7'}]}
					onPress={() => {
						this.selectedAdd(body);
					}}>
					<View style={styles.touchRowCheck}>
						{
							body.selectedType || showType ?
								<Icons name={'ios-checkmark-circle-outline'} size={20} color={showType ? '#9f9f9f' : '#549dff'}/>
								: <Icons name={'ios-radio-button-off-outline'} size={20} color={'#ccc'}/>
						}
					</View>
					<Text style={{
						fontSize: 14,
						color: '#777',
						flex: 1
					}}>{body.trueName + (body.branchName ? ('(' + body.branchName + ')') : '')}</Text>
				</TouchableOpacity>
			}
		} else {//部门
			return <View style={[styles.touchRow, {borderTopColor: index == 0 ? 'transparent' : '#d7d7d7'}]}>
				<TouchableOpacity
					style={{marginRight: 6, width: 28, height: 50, justifyContent: 'center'}}
					onPress={() => {
						// HandlerOnceTap(() => this.getParticipantsList(body, num + 1, true))
						this.getParticipantsList(body, num + 1, true)
					}}//需要选中当前点击部门下所有人员执行中加入true
				>
					<Icons name={'ios-add'} size={28} color={'#777'}/>
				</TouchableOpacity>
				<TouchableOpacity
					style={{flex: 1, flexDirection: 'row', alignItems: 'center', height: 50}}
					onPress={() => {
						// HandlerOnceTap(() => this.getParticipantsList(body, num + 1))
						this.getParticipantsList(body, num + 1)
					}}//当前点击部门展示无需添加true
				>
					<Text style={{fontSize: 15, color: '#333', flex: 1}}>{body.branchName}</Text>
					{
						body.iconType ?
							<Icons name={'ios-arrow-down'} size={24} color={'#CCCCCC'}/>
							: <Icons name={'ios-arrow-forward'} size={24} color={'#CCCCCC'}/>
					}
				</TouchableOpacity>
			</View>
		}
	}
	//部门遍历
	selectedDepts = (item, num) => {
		let depts = this.state.selectedDepts;
		let index = null;
		for (let i in depts) {
			if (depts[i].branchNo == item.branchNo) {
				index = i;
			}
		}
		if (!index) {
			item.number = num;
			depts.push(item);
		} else {
			depts.splice(index, 1);
		}
		this.setState({selectedDepts: depts}, () => {
			this.getParticipantsList(item, num + 1, true);
		});
	}
	//人员选中遍历
	selectedAdd = (item) => {
		let selectedArrBox = JSON.parse(JSON.stringify(this.state.selectedArrBox));
		for (let ij = 0 ; ij < selectedArrBox.length ; ij++){
			if (selectedArrBox[ij].isBlack) {
				// this.state.selectNotArr.splice(j, 1);
				selectedArrBox.splice(ij, 1);//去除空box
				ij--;
			}
		}
		let selectedArr = JSON.parse(JSON.stringify(this.state.selectedArr));
		let selectedParticipants = JSON.parse(JSON.stringify(this.state.selectedParticipants));

		let index = null;
		let inx = null;
		if (item.jidNode) {
			if (selectedArr.length > 0) {
				for (let i in selectedArr) {//选中人员数组
					if (item.jidNode == selectedArr[i].jidNode) {
						index = i;
					}
				}
			}

			if (selectedParticipants.length > 0) {
				for (let i in selectedParticipants) {
					if (selectedParticipants[i].jidNode == item.jidNode) {
						selectedParticipants.splice(i, 1);
					}
				}
			}

			for (let j in selectedArrBox) {//显示人员数组
				if (item.jidNode == selectedArrBox[j].jidNode) {
					inx = j;
				}
			}
			!index ? selectedArr.push(item) : selectedArr.splice(index, 1);
			!inx ? selectedArrBox.push(item) : selectedArrBox.splice(inx, 1);
		}
		this.state.participantsList.map((item) => {
			let list = item.list;
			for (let key in list) {
				list[key].selectedType = false;
				for (let j in selectedArrBox) {//遍历显示数组更改显示状态
					if (list[key].jidNode == selectedArrBox[j].jidNode) {
						list[key].selectedType = true;
					}
				}
			}
		});

		let selectedArrs = [];
		let selectedParticipantArr = [];
		for (let i in selectedArrBox) {
			for (let j in selectedArr) {//选中人员数组
				if (selectedArrBox[i].jidNode == selectedArr[j].jidNode) {
					selectedArrs.push(selectedArr[j]);
				}
			}

			for (let k in selectedParticipants) {//选中人员数组
				if (selectedArrBox[i].jidNode == selectedParticipants[k].jidNode) {
					selectedParticipantArr.push(selectedParticipants[k]);
				}
			}
		}

		selectedArr = selectedArrs;
		selectedParticipants = selectedParticipantArr;

		if (selectedParticipants.length > 0) {
			for (let i in selectedParticipants) {
				for (let j in selectedArr) {//选中人员数组
					if (selectedParticipants[i].jidNode == selectedArr[j].jidNode) {
						selectedParticipants.splice(i, 1);
					}
				}
			}
		}

		let blackView = selectedArrBox.length % 5;
		if(blackView != 0){
			let tempView = {isBlack:true};
			switch (blackView) {
				case 1:
					selectedArrBox.push(tempView);
					selectedArrBox.push(tempView);
					selectedArrBox.push(tempView);
					selectedArrBox.push(tempView);
					break;
				case 2:
					selectedArrBox.push(tempView);
					selectedArrBox.push(tempView);
					selectedArrBox.push(tempView);
					break;
				case 3:
					selectedArrBox.push(tempView);
					selectedArrBox.push(tempView);
					break;
				case 4:
					selectedArrBox.push(tempView);
					break;
				default: //console.log('添加空view进入default');
			}
		}
		this.setState({
			selectedArr: selectedArr,
			selectedArrBox: selectedArrBox,
			selectedParticipants: selectedParticipants
		});
	}
	//遍历清空无需显示数组
	isVisibleSon = (num) => {
		let participantsList = this.state.participantsList;
		for (let i = num; i < participantsList.length; i++) {
			participantsList[i].list = [];
		}
		this.setState({participantsList: participantsList});
	}

}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		right: 0
	},
	touchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 48,
		borderTopWidth: 1,
		paddingRight: 10
	},
	touchRowCheck: {
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
		height: 50
	}
});