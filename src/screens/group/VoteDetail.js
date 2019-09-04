/*
 * 投票详情页面
 * 投票状态 进行中 已结束
 * 包括两种页面表现
 * 发起人是否可以投票
 * 详情状态 已投票 未投票(显示投票按钮)
 *
 */
import React, {Component} from 'react';
import {
	StyleSheet, Text, View, Image, Platform,
	TouchableOpacity, TouchableWithoutFeedback,
	DeviceEventEmitter, Dimensions, ART, ScrollView
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import CheckBox from 'react-native-checkbox';
import * as MyProgress from 'react-native-progress';
import AwesomeAlert from "react-native-awesome-alerts";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Toast, {DURATION} from 'react-native-easy-toast';

const {height, width} = Dimensions.get('window');
const {Surface, Shape} = ART;
const path = ART.Path().moveTo(1, 1).lineTo(width - 20, 1);

class VoteDetail extends Component {
	constructor(props) {
		super(props);
		this.state = {
			detailInfo: {},//投票详情
			voteOptions: [],//投票选项
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			room: props.navigation.state.params.room,
			basic: props.navigation.state.params.basic,
			voteId: props.navigation.state.params.voteId,
			checkedList: [],//选定选项
			total: 0,//总投票数
			affiliation: props.navigation.state.params.affiliation == 'member' ? false : true,
			showAlert: false,//alert框
			tipMsg: ''//alert提示信息
		}
	};

	componentDidMount() {
		this.fetchVoteDetail();
	};

	//获取投票详情数据
	fetchVoteDetail = () => {
		let url = Path.getVoteDetail;
		let params = {
			voteId: this.state.voteId,
			jidNode: this.state.basic.jidNode
		};
		FetchUtil.netUtil(url, params, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, this.voteDetailCallBack);
	};
	//获取投票详情数据回调
	voteDetailCallBack = (res) => {
		if (res == "tip") {
			// this._toast('设置完成失败！');
			this.refs.toast.show('获取投票详情失败！', DURATION.LENGTH_SHORT);
		} else if (res.code.toString() == '200') {
			this.setState({
				detailInfo: res.data.voteInfo,
				voteOptions: res.data.listVoteOption,
				total: res.data.total
			})
		}
	};
	//渲染投票选项
	_renderOptions = () => {
		let renderOptionsArr = [];
		if (this.state.voteOptions.length > 0) {
			if (this.state.detailInfo.ballotType && this.state.detailInfo.ballotType == '1') {
				//单选
				this.state.voteOptions.map((item, index) => {
					renderOptionsArr.push(
						<TouchableWithoutFeedback key={index} onPress={() => {
							HandlerOnceTap(this._onChecked.bind(this, item.id))
						}}>
							<View>
								<View style={{flexDirection: 'row', alignItems: 'center'}}>
									<View
										style={{width: 30, height: 50, justifyContent: 'center', alignItems: 'center'}}>
										<CheckBox
											ref={`singleCheckBox${index}`}
											label={null}
											disabled={item.isBallot == '0' ? true : false}
											checked={item.isBallot == '0' ? false : true}
											onChange={this._onChecked.bind(this, item.id)}
											containerStyle={{marginBottom: 0}}
											checkedImage={require('../../images/check-circle.png')}
											uncheckedImage={require('../../images/check.png')}
										/>
									</View>
									{this.state.detailInfo.createUser == this.state.basic.jidNode ? (
										<View style={{
											flexDirection: 'row',
											marginBottom: 3,
											marginLeft: 8,
											justifyContent: 'center',
											alignItems: 'center',
											flex: 1
										}}>
											<Text style={{fontSize: 18, fontWeight: 'normal', flex: 1}}>{item.name}</Text>
											<Text style={{color: '#f77516', fontSize: 18, width: 50, textAlign: 'right'}}>{item.num}票</Text>
										</View>
									) : (
										<View style={{marginLeft: 8, flex: 1}}><Text>{item.name}</Text></View>
									)}
								</View>
								<Surface width={width} height={1}>
									<Shape d={path} stroke="#dfdfdf" strokeWidth={2} strokeDash={[10, 10]}/>
								</Surface>
							</View>
						</TouchableWithoutFeedback>
					);
				});
			} else {
				//多选
				this.state.voteOptions.map((item, index) => {
					renderOptionsArr.push(
						<TouchableWithoutFeedback key={index} onPress={() => {
							HandlerOnceTap(this._onChecked.bind(this, item.id))
						}}>
							<View>
								<View style={{flexDirection: 'row', alignItems: 'center'}}>
									<View
										style={{width: 30, height: 50, justifyContent: 'center', alignItems: 'center'}}>
										<CheckBox
											ref={`multiCheckBox${index}`}
											label={null}
											checked={item.isBallot == '0' ? false : true}
											onChange={this._onChecked.bind(this, item.id)}
											containerStyle={{marginBottom: 0}}
											checkedImage={require('../../images/check-circle.png')}
											uncheckedImage={require('../../images/check.png')}
										/>
									</View>
									{this.state.detailInfo.createUser == this.state.basic.jidNode ? (
										<View style={{
											flexDirection: 'row',
											marginBottom: 3,
											marginLeft: 8,
											justifyContent: 'center',
											alignItems: 'center',
											flex: 1
										}}>
											<Text style={{fontSize: 18, fontWeight: 'normal', flex: 1}}>{item.name}</Text>
											<Text style={{color: '#f77516', fontSize: 18, width: 50, textAlign: 'right'}}>{item.num}票</Text>
										</View>
									) : (
										<View style={{marginLeft: 8, flex: 1}}><Text>{item.name}</Text></View>
									)}
								</View>
								<Surface width={width} height={1}>
									<Shape d={path} stroke="#dfdfdf" strokeWidth={2} strokeDash={[10, 10]}/>
								</Surface>
							</View>
						</TouchableWithoutFeedback>
					);
				});
			}

		}
		return renderOptionsArr;
	};
	//渲染已投票选项
	_renderVoted = () => {
		let renderOptionsArr = [];
		if (this.state.voteOptions.length > 0) {
			this.state.voteOptions.map((item, index) => {
				let proccess = (parseInt(item.num) / parseInt(this.state.total)) * 100;
				renderOptionsArr.push(
					<View key={index}>
						<View style={{marginBottom: 8, marginTop: 8}}>
							<View style={{
								flexDirection: 'row',
								marginBottom: 3,
								justifyContent: 'center',
								alignItems: 'center'
							}}>
								<Text style={{fontSize: 18, fontWeight: 'normal', flex: 1}}>{item.name}</Text>
								<Text style={{color: '#f77516', fontSize: 18, width: 50, textAlign: 'right'}}>{item.num}票</Text>
							</View>

							<View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
								<View style={{flex: 1, justifyContent: 'center'}}>
									<MyProgress.Bar
										progress={this.state.total ? item.num / this.state.total : 0}//item.num/this.state.detailInfo.total
										width={width * 0.8}
										color={'#278EEE'}
										unfilledColor={'#CCCCCC'}
										useNativeDriver={true}
										animated={true}
									/>
								</View>
								<Text style={{
									color: '#278EEE',
									width: width * 0.2,
									textAlign: 'right',
									fontSize: 12,
								}}>{`${proccess ? proccess.toFixed(2) : 0}%`}</Text>
							</View>
						</View>
						<Surface width={width} height={1}>
							<Shape d={path} stroke="#dfdfdf" strokeWidth={2} strokeDash={[10, 10]}/>
						</Surface>
					</View>
				);
			});
		}

		return renderOptionsArr;
	};
	//放入选定选项
	_onChecked = (id) => {
		if (this.state.voteOptions.length > 0) {
			if (this.state.detailInfo.ballotType && this.state.detailInfo.ballotType == '1') {
				//单选
				this.state.voteOptions.map((item, index) => {
					if (item.id == id) {
						item.isBallot = item.isBallot == '0' ? '1' : '0';
						if (item.isBallot == '1') {
							this.state.checkedList[0] = item.id;
						} else {
							this.state.checkedList = [];
						}
					} else {
						item.isBallot = '0';
					}
				});
			} else {

				this.state.voteOptions.map((item, index) => {
					if (item.id == id) {//找到选项中被点击的一项
						item.isBallot = item.isBallot == '0' ? '1' : '0';
						if (item.isBallot == '1') {
							if (this.state.checkedList.length < this.state.detailInfo.maxChoice) {
								this.state.checkedList.push(item.id);
							} else {
								item.isBallot = '0';
							}
						} else {
							this.state.checkedList.map((item1, index1) => {
								if (item1 == id) {
									// this.state.checkedList.pop(item1);
									this.state.checkedList.splice(this.state.checkedList.indexOf(id), 1);
								}
							})
						}
					}
				});
			}
			this.setState({
				voteOptions: this.state.voteOptions
			});
		}
	};
	//提交投票
	_submitVote = () => {
		if (this.state.checkedList.length == 0) {
			this._toast('至少选择一个选项');
		} else if (new Date(this.state.detailInfo.endTime.replace(/-/g, '/')).getTime() < new Date().getTime()) {
			this._toast('投票已结束');
		} else {
			let bodyObj = {
				'voteId': this.state.detailInfo.id,
				'jidNode': this.state.basic.jidNode
			};
			FetchUtil.netUtil(Path.checkingVote, bodyObj, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, (responseJson) => {

				if(responseJson == 'tip'){
					this.refs.toast.show('网络错误，获取投票失败');
				} else if (responseJson.data.status == 'Success') {
					let params = {
						voteId: this.state.detailInfo.id,
						jidNode: this.state.basic.jidNode,
						options: this.state.checkedList
					};
					FetchUtil.netUtil(Path.saveVoteOptions, params, 'POST', this.props.navigation, {
						uuId: this.state.uuid,
						ticket: this.state.ticket,
						userId: this.state.basic.userId
					}, this.submitVoteCallBack);
				} else {
					DeviceEventEmitter.emit('voteAddPage');
					this._toast('该投票已被删除', DURATION.LENGTH_SHORT);
				}
			})
		}
	};
	//提交投票回调
	submitVoteCallBack = (res) => {
		if (res == "tip") {
			this._toast('投票失败！');
			// this.refs.toast.show('获取联系人失败！', DURATION.LENGTH_SHORT);
		} else if (res.code.toString() == '200') {
			DeviceEventEmitter.emit('voteAddPage');
			this.fetchVoteDetail();//刷新详情
			if (res.data.status != 'Success') {
				switch (res.data.code) {
					case '00':
						this._toast('该投票已停止');
						break;
					case '01':
						this._toast('该投票已被管理员删除');
						break;
					case '10':
						this._toast('该投票不存在');
						break;
					case '11':
						this._toast('已进行过投票');
						break;
					default:
						this._toast('错误码没有定义！');
				}
			}
		}
	};
	//停止投票
	_stopVote = () => {
		let url = Path.getVoteStop + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
		FetchUtil.netUtil(url, {
			jidNode: this.state.basic.jidNode,
			voteId: this.state.detailInfo.id,
			mid: this.state.room.roomJid
		}, 'POST', this.props.navigation, '', (data) => {
			if (data == "tip") {
				this._toast('停止投票失败！');
				// this.refs.toast.show('获取联系人失败！', DURATION.LENGTH_SHORT);
			} else if (data.code.toString() == '200') {
				DeviceEventEmitter.emit('voteAddPage');
				this.fetchVoteDetail();//刷新详情
			}
		});
	};
	//删除投票
	_delVote = () => {
		let bodyObj = {
			'voteId': this.state.detailInfo.id,
			'jidNode': this.state.basic.jidNode
		};
		FetchUtil.netUtil(Path.checkingVote, bodyObj, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, (responseJson) => {
			if(responseJson == 'tip'){
				this.refs.toast.show('网络错误，获取投票失败');
			} else if (responseJson.data.status == 'Success') {
				let url = Path.delVote + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId;
				FetchUtil.netUtil(url, {
					jidNode: this.state.basic.jidNode,
					voteId: this.state.detailInfo.id,
					mid: this.state.room.roomJid
				}, 'POST', this.props.navigation, '', (data) => {
					if (data == "tip") {
						this._toast('删除投票失败！');
						// this.refs.toast.show('获取联系人失败！', DURATION.LENGTH_SHORT);
					} else if (data.code.toString() == '200') {
						//this.fetchVoteDetail();//刷新详情
						DeviceEventEmitter.emit('voteAddPage');
						this.props.navigation.goBack();
					}
				});
			} else {
				DeviceEventEmitter.emit('voteAddPage');
				this._toast('该投票已被删除', DURATION.LENGTH_SHORT);
			}
		})
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
			tipMsg: text//alert提示信息
		});
	};

	render() {
		const {showAlert, tipMsg} = this.state;
		return (
			<View style={styles.container}>
				<Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'投票详情'}
				/>
				{this.state.detailInfo.status ? (
					<ScrollView
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						style={{backgroundColor: 'transparent'}}>
						<View style={{alignItems: 'flex-end'}}>
							<View style={styles.topStatus}>
								<Text style={{color: '#FFFFFF'}}>
									{this.state.detailInfo.status && this.state.detailInfo.status == '0' && new Date(this.state.detailInfo.endTime.replace(/-/g, '/')).getTime() > new Date().getTime() ? '进行中' : this.state.detailInfo.status && this.state.detailInfo.status == '1' ? '已停止' : '已结束'}
								</Text>
							</View>
						</View>
						<View style={{paddingLeft: 10, paddingRight: 10}}>
							<View style={styles.userInfoBar}>
								<Image
									source={{
										uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + this.state.detailInfo.photoId + '&imageId=' + this.state.detailInfo.photoId + '&sourceType=singleImage&jidNode='
										// uri: Path.headImg + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&jidNode=' + this.state.detailInfo.createUser
									}}
									style={{width: 20, height: 20}}/>
								<Text
									style={{
										fontSize: 14,
										color: '#c3c3c3'
									}}>{` ${this.state.detailInfo.nickName ? this.state.detailInfo.nickName : ''}发起 ${this.state.detailInfo.createTime ? this.state.detailInfo.createTime : ''}`}</Text>
							</View>
							<View style={{marginBottom: 10}}>
								<Text style={{
									fontSize: 18,
									fontWeight: 'normal'
								}}>{this.state.detailInfo.title ? this.state.detailInfo.title : ''}</Text>
							</View>
							<View style={{flexDirection: 'row', marginBottom: 10}}>
								<View style={{flex: 2}}>
									<Text style={{
										fontSize: 14,
										color: '#c3c3c3'
									}}>{`结束时间 ${this.state.detailInfo.endTime ? this.state.detailInfo.endTime : ''}`}</Text>
								</View>
								<View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>

									{(this.state.detailInfo.createUser && (this.state.detailInfo.createUser == this.state.basic.jidNode)) && new Date(this.state.detailInfo.endTime.replace(/-/g, '/')).getTime() > new Date().getTime() && this.state.detailInfo.status && this.state.detailInfo.status == '0' ? (
										<TouchableOpacity onPress={() => {
											HandlerOnceTap(this._stopVote)
										}}>
											<View style={styles.stopBtn}>
												<Text style={{color: '#FFFFFF'}}>{'停止'}</Text>
											</View>
										</TouchableOpacity>
									) : null}
									{this.state.affiliation ? (
										<TouchableOpacity onPress={() => {
											HandlerOnceTap(() => {
												//实时调取接口查询是否为群主或管理员
												FetchUtil.netUtil(Path.isRoomAdmin + '?ticket=' + this.state.ticket + '&uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&roomJid=' + this.state.room.roomJid + '&jidNode=' + this.state.basic.jidNode, {}, 'GET', this.props.navigation, '', (responseJson) => {
													if (responseJson.code.toString() == '200') {
														if (responseJson.data) {
															this._delVote();
														} else {
															this._toast('您没有删除权限');
														}
													}
												});
											})
										}}>
											<View style={styles.delBtn}>
												<Text style={{color: '#FFFFFF'}}>{'删除'}</Text>
											</View>
										</TouchableOpacity>
									) : null}
								</View>
							</View>

							<View style={styles.infoBottomSeparator}></View>

							<View style={{marginBottom: 10}}>
								<Text style={{
									fontSize: 14,
									color: '#c3c3c3'
								}}>{this.state.detailInfo.ballotType && this.state.detailInfo.ballotType == '1' ? '单选' : '多选'}</Text>
							</View>

							<View style={{marginBottom: 10}}>
								{new Date(this.state.detailInfo.endTime.replace(/-/g, '/')).getTime() > new Date().getTime() ? (
									(this.state.detailInfo.isBallot && this.state.detailInfo.isBallot == '0') && (this.state.detailInfo.status && this.state.detailInfo.status == '0') ? (
										//未投票
										this._renderOptions()
									) : (
										//已投票 显示进度条
										this._renderVoted()
									)
								) : (this._renderVoted())}
							</View>

							<View>
								{new Date(this.state.detailInfo.endTime.replace(/-/g, '/')).getTime() > new Date().getTime() ? (
									this.state.detailInfo.isBallot && this.state.detailInfo.isBallot == '0' && (this.state.detailInfo.status && this.state.detailInfo.status == '0') ? (
										//未投票
										<TouchableOpacity style={{width: 60}} onPress={() => {
											HandlerOnceTap(this._submitVote)
										}}>
											<View style={styles.submitBtn}>
												<Text style={{color: '#FFFFFF'}}>{'投票'}</Text>
											</View>
										</TouchableOpacity>
									) : (this.state.detailInfo.isBallot && this.state.detailInfo.isBallot == '1' ?
											//已投票
											<View style={styles.submitedBtn}>
												<Text style={{color: '#FFFFFF'}}>{'已投'}</Text>
											</View> : null
									)
								) : null}
							</View>

						</View>
					</ScrollView>
				) : null}
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
						// DeviceEventEmitter.emit('voteAddPage');
						// this.fetchVoteDetail();//刷新详情
					}}
				/>
			</View>
		)
	}
};
export default VoteDetail;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF'
	},
	infoBottomSeparator: {
		height: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#dfdfdf',
		marginBottom: 5
	},
	topStatus: {height: 20, width: 50, backgroundColor: '#36b9ee', justifyContent: 'center', alignItems: 'center'},
	userInfoBar: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
	stopBtn: {
		backgroundColor: '#e5a844',
		borderRadius: 2,
		justifyContent: 'center',
		alignItems: 'center',
		width: 44,
		padding: 2
	},
	stopedBtn: {
		backgroundColor: '#c3c3c3',
		borderRadius: 2,
		justifyContent: 'center',
		alignItems: 'center',
		width: 60,
		padding: 2
	},
	delBtn: {
		backgroundColor: '#d90000',
		borderRadius: 2,
		justifyContent: 'center',
		alignItems: 'center',
		width: 44,
		marginLeft: 8,
		padding: 2
	},
	submitBtn: {
		backgroundColor: '#4e71ff',
		borderRadius: 2,
		justifyContent: 'center',
		alignItems: 'center',
		width: 60,
		height: 30
	},
	submitedBtn: {
		backgroundColor: '#b5b5b5',
		borderRadius: 2,
		justifyContent: 'center',
		alignItems: 'center',
		width: 60,
		height: 30
	}
});
