import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Platform,
	TouchableOpacity,
	Dimensions,
	Image,
	ScrollView,
	FlatList,
	TextInput,
	ActivityIndicator,
	DeviceEventEmitter, ART,
	Keyboard
} from 'react-native';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import MyWebView from 'react-native-webview-autoheight';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Toast, {DURATION} from 'react-native-easy-toast';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import ToolUtil from '../../util/ToolUtil';
import AwesomeAlert from "react-native-awesome-alerts";

const {height, width} = Dimensions.get('window');
const numColumns = 6;
const HEADWIDTH = (width - 20 - (numColumns - 1) * 10) / numColumns;
let commentPage = 1;

export default class ActivityDetails extends Component {
	static navigationOptions = {
		header: null
	};

	constructor(props) {
		super(props);
		this.state = {
			activityId: props.navigation.state.params.activityId,
			room: props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			activityInfor: {},
			headList: [],//活动总报名列表
			headShowList: [],//活动详情显示报名列表
			commentList: [],//活动总评论列表
			commentShowList: [],//活动详情显示评论列表
			commentContent: '',//评论内容
			replyContent: '',//回复内容
			commentShowFoot: 0,//评论底部显示
			commentPid: null,
			replyCommentType: false,
			placeholder: '请输入回复内容',
			showAlert: false,//alert框
			tipMsg: '',//alert提示信息
			pageNum: 1,
			footLoading:false,
			totalPage:0,
		}
	};

	componentDidMount() {
		this._getActivityDetails();
		this.activityHeadNot = DeviceEventEmitter.addListener('activityHeadNot', (params) => {
			this._getActivityDetails();
		});
		this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			this.setState({
				commentPid: null,
				// commentContent: '',
				placeholder: '请输入评论内容'
			}, () => {
				if (this.refs.commentInput) {
					this.refs.commentInput.blur();
				}
			});
		});
	};

	componentWillUnmount() {
		this.activityHeadNot.remove();
		this.keyboardDidHideListener.remove();
		commentPage = 1;
	}

	_getActivityDetails = () => {
		let url = Path.getActivityDetails + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&userId=' + this.state.basic.userId + '&activeId=' + this.state.activityId;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
			if (responseJson == 'tip') {
				this.refs.toast.show("活动详情获取失败！", DURATION.LENGTH_SHORT);
			} else if (responseJson.code.toString() == '200') {
				this.setState({
					activityInfor: responseJson.data.activityInfo,
					headList: responseJson.data.activityActivistList,
				}, () => {
					this.getActivityDisscussList(this.state.pageNum);
					this._headListMap(this.state.headList);

					if (this.state.basic.jidNode == this.state.activityInfor.createUser && this.state.activityInfor.status == '0' && ToolUtil.strToStemp(this.state.activityInfor.endTime) > new Date().getTime()) {
						this.refs.activityDetailHeader._changeHeadRightFlag(true);
					} else {
						this.refs.activityDetailHeader._changeHeadRightFlag(false);
					}
				});

			}
		})
	}

	getActivityDisscussList = (pageNum) => {
		this.setState({
			footLoading: true
		},() => {
			let bodyObj = {
				'activeId': this.state.activityInfor.id,
				'pageNum': pageNum,
				'pageSize': 5,
				'ticket': this.state.ticket
			};
			FetchUtil.netUtil(Path.getActivityDisscussList, bodyObj, 'POST', this.props.navigation, {
				uuId: this.state.uuid,
				ticket: this.state.ticket,
				userId: this.state.basic.userId
			}, (responseJson) => {
				if (responseJson == 'tip') {
					this.refs.toast.show("活动评论列表获取失败！", DURATION.LENGTH_SHORT);
				} else if (responseJson.status) {
					if (responseJson.data.recordList && responseJson.data.recordList.length > 0) {
						this.setState({
							commentList: pageNum == 1 ? responseJson.data.recordList : this.state.commentList.concat(responseJson.data.recordList),
							footLoading: false,
							totalPage: responseJson.data.totalPage,
							totalResult: responseJson.data.totalResult
						})
					}
				}
			})
		})

	}


	_headListMap = (str) => {
		let arr = new Array();
		let num = numColumns - 1;
		for (let i in str) {
			if (str[i].status == 0) {
				arr.push(str[i]);
			}
		}
		let headArr = [];
		if (arr.length > 0) {
			if (arr.length > num) {
				headArr = arr.slice(0, num).concat({onHeadMore: 'more'});
			} else {
				headArr = arr.concat({onHeadMore: 'more'});
			}
		} else {
			headArr = [];
		}
		this.setState({
			headShowList: headArr
		});
	}

	_headRenderItem = ({item, index}) => {
		let _headStr;
		if (item.onHeadMore == 'more') {
			_headStr = <TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('ActivityHeadList', {
							activityId: this.state.activityId,
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
							headList: this.state.headList,
							activityInfor: this.state.activityInfor
						});
					}
				)
			}} style={[styles.actHeadList, {
				justifyContent: 'center',
				alignItems: 'center',
				borderWidth: 1,
				borderColor: '#ccc',
				marginLeft: 10,
			}]}>
				<Icons name={'ios-more'} size={30} color={'#CCCCCC'}/>
			</TouchableOpacity>
		} else {
			_headStr = <TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('FriendDetail', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							friendJidNode: item.activistUser,
							tigRosterStatus: 'both',
							basic: this.state.basic
						});
					}
				)
			}} style={{position: 'relative', marginLeft: index == 0 ? 0 : 10,}}>
				<Image
					source={{
						uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.photo + '&imageId=' + item.photo + '&sourceType=singleImage&jidNode='
						// uri: Path.headImg + '?fileName=' + item.photo + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + item.id
					}}
					style={styles.actHeadList}/>
				{
					item.isPay == 1 ? <View style={styles.headListIcon}>
						<Text style={{color: 'white', fontSize: 12}}>已付</Text>
					</View> : null
				}
			</TouchableOpacity>
		}
		return _headStr
	}

	_commentListFor = (str) => {
		let arr1 = str,
			arr2 = str,
			box = [];
		arr1.map((item) => {
			let replyArr = [];
			for (let i in arr2) {
				if (item.id == arr2[i].pid) {
					replyArr.push(arr2[i]);
				}
			}
			if (item.pid == '0') {
				item.replyArr = replyArr;
				box.push(item)
			}
		});
		this.setState({
			commentList: box
		}, () => {
			this._commentListMap(this.state.commentList)
		});
	}


	_activityComment = () => {
		this.refs.commentInput.blur();
		let pid = this.state.commentPid;
		let content = this.state.commentContent;
		let placeholder = this.state.placeholder;
		if (content == '' || placeholder == content) {
			this._toast('评论内容不能为空');
		} else if (ToolUtil.isEmojiCharacterInString(content)) {
			this._toast('评论内容不能包含非法字符');
		} else {
			let url = Path.getActivityComment + '?ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&activeId=' + this.state.activityId + '&pid=' + pid + '&content=' + content + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid;
			FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
				if (responseJson == 'tip') {
					this._toast("活动评论失败！");
				} else if (responseJson.code.toString() == '200') {
					if (responseJson.data.status == 'Fail') {
						this._toast(responseJson.data.msg);
					} else {
						this.setState({
							commentContent: '',
							replyContent: '',
							commentPid: null,
							replyCommentType: false,
						});
					}
					this._getActivityDetails();
				}
			})
		}
	};

	_toast = (text) => {
		this.setState({
			showAlert: true,//alert框
			tipMsg: text//alert提示信息
		});
	};

	_activityApply = () => {

		// if(new Date(this.state.activityInfor.endTime.replace(/-/g, '/')).getTime() < new Date().getTime()) {
		// 	this._toast('活动已结束');
		// }else {
		let url = Path.getActivityAttend + '?ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&activeId=' + this.state.activityId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
			if (responseJson == 'tip') {
				this._toast("活动报名失败！");
			} else if (responseJson.code.toString() == '200') {
				DeviceEventEmitter.emit('activityAddPage');
				this._getActivityDetails();
				if (responseJson.data.status != 'Success') {
					switch (responseJson.data.code) {
						case '00':
							this._toast('活动已结束，不能进行操作！');
							break;
						case '01':
							this._toast('活动参与者已经达到上限！');
							break;
						case '11':
							this._toast('您已参加了该活动！');
							break;
						default:
							this._toast('操作失败！');
					}
				}
			}
		})
		// }
	};

	_scrollActivity = (e) => {
		let offsetY = e.nativeEvent.contentOffset.y;
		let contentSizeHeight = e.nativeEvent.contentSize.height;
		let oriageScrollHeight = e.nativeEvent.layoutMeasurement.height;
		if (Math.floor(offsetY + oriageScrollHeight) >= Math.floor(contentSizeHeight)) {
			this.setState({commentShowFoot: 3});
			let box = this.state.commentList,
				arr = box.slice(0, commentPage * 10);
			if (box.length > commentPage * 10) {
				commentPage++;
			}
			let num = box.length > commentPage * 10 ? 2 : 1;
			this.setState({
				commentShowList: arr,
				commentShowFoot: num
			});
		}
	};
	_exitActivity = () => {
		let url = Path.exitActivity + '?ticket=' + this.state.ticket + '&jidNode=' + this.state.basic.jidNode + '&activeId=' + this.state.activityId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid;
		FetchUtil.netUtil(url, {}, 'GET', this.props.navigation, '', (responseJson) => {
			if (responseJson == 'tip') {
				this._toast("退出活动失败！");
			} else if (responseJson.code.toString() == '200') {
				DeviceEventEmitter.emit('activityAddPage');
				this._getActivityDetails();
			}
		})
	};

	/** 修改活动详情*/
	alterActive = () => {

		this.props.navigation.navigate('ActivityPublish', {
			ticket: this.state.ticket,
			uuid: this.state.uuid,
			room: this.state.room,
			basic: this.state.basic,
			type: 'alter',
			activityBody: {//活动信息提交对象
				id: this.state.activityInfor.id,
				mid: this.state.room.roomJid,
				title: this.state.activityInfor.title,//活动主题
				poster: this.state.activityInfor.poster,//活动海报
				startTime: this.state.activityInfor.createTime,//活动开始时间
				endTime: this.state.activityInfor.endTime,//活动结束时间
				address: this.state.activityInfor.address,//活动地点
				isPublic: this.state.activityInfor.isPublic,//是否开放
				cost: this.state.activityInfor.cost,//活动费用
				memberNum: this.state.activityInfor.memberNum,//活动人数
				phone: this.state.activityInfor.phone,//发布人电话
				content: this.state.activityInfor.content,//详情
				createUser: this.state.basic.jidNode,
				nickName: this.state.basic.trueName,
				belongId: this.state.room.roomJid,
			},
		});
	}

	render() {
		const {showAlert, tipMsg} = this.state;
		let start = this.state.activityInfor.startTime ? this.state.activityInfor.startTime : "";// ? this.state.activityInfor.startTime.substring(0, this.state.activityInfor.startTime.lastIndexOf(':')) : '';
		let end = this.state.activityInfor.endTime ? this.state.activityInfor.endTime : "";// ? this.state.activityInfor.endTime.substring(0, this.state.activityInfor.endTime.lastIndexOf(':')) : '';
		return (
			<View style={styles.container}>
				<Header
					ref={'activityDetailHeader'}
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					headRightFlag={false}//this.state.basic.jidNode == this.state.activityInfor.createUser && this.state.activityInfor.status == '0' && ToolUtil.strToStemp(this.state.activityInfor.endTime) > new Date().getTime() ? true :
					backTitle={'返回'}
					//rightText={'编辑'}
					isText={true}
					// onPressRightBtn={() => {
					// 	this.alterActive();
					// }}
					title={'活动详情'}
				/>
				<ScrollView
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					keyboardDismissMode={'on-drag'}
					onScroll={this._scrollActivity}>
					<View style={styles.actTop}>
						<Image
							source={this.state.activityInfor.poster != undefined ? {uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + this.state.activityInfor.poster + '&imageId=' + this.state.activityInfor.poster + '&sourceType=activityImage'} : require('../../images/default_poster.png')}
							style={styles.actTopHead} resizeMode={'cover'}/>
						<Text numberOfLines={1} style={styles.actTopText}>{this.state.activityInfor.title}</Text>
					</View>
					<View style={styles.actPadLR}>
						<View style={styles.actInforTop}>
							<View style={styles.actInforText}>
								<Image source={require('../../images/activity/icon_time.png')} style={styles.actIcon}/>
								<Text
									style={styles.actTxt}>{` ${start} 至 ${end}`}</Text>
								<Text style={styles.actCost}>{this.state.activityInfor.cost ?'￥':''}<Text
									style={{fontSize: 18}}>{this.state.activityInfor.cost == '0' ? "免费": this.state.activityInfor.cost }</Text></Text>
							</View>
							<View style={styles.actInforText}>
								<Image source={require('../../images/activity/icon_address.png')}
											 style={styles.actIcon}/>
								<Text
									style={styles.actTxt}>{` ${this.state.activityInfor.address ? this.state.activityInfor.address : " "}`}</Text>
							</View>
							<View style={styles.actInforText}>
								<Image source={require('../../images/activity/icon_single.png')}
											 style={styles.actIcon}/>
								<Text
									style={styles.actTxt}>{` 由 ${this.state.activityInfor.nickName ? this.state.activityInfor.nickName : " "} 发起`}</Text>
							</View>
							<View style={styles.actInforText}>
								<Image source={require('../../images/activity/icon_people.png')}
											 style={styles.actIcon}/>
								<Text style={styles.actTxt}>{` 已有`}<Text
									style={{
										fontSize: 16,
										color: '#ffda33'
									}}>{this.state.headList.length}</Text>人报名（限{this.state.activityInfor.memberNum ? this.state.activityInfor.memberNum : " "}人报名）</Text>
							</View>
							<View style={styles.actInforText}>
								<Image source={require('../../images/activity/icon_tel.png')} style={styles.actIcon}/>
								<Text
									style={styles.actTxt}>{` ${this.state.activityInfor.phone ? this.state.activityInfor.phone : ""}`}</Text>
							</View>
							{this.state.activityInfor.status == '0' && ToolUtil.strToStemp(this.state.activityInfor.endTime) > new Date().getTime() ? (

								(this.state.activityInfor.isActive.toString() == '1' ? (
										<TouchableOpacity style={styles.actRegBtn} onPress={() => {
											HandlerOnceTap(
												() => {
													if (this.state.activityInfor.isActive == '0') {
														this._activityApply();
													} else if (this.state.activityInfor.isActive == '1') {
														this._exitActivity();
													}
												}
											)
										}}>
											<Text
												style={styles.actRegBtnText}>{'退出活动'}</Text>
										</TouchableOpacity>) : (

										(this.state.activityInfor.isActive == '0' && this.state.headList.length < this.state.activityInfor.memberNum) ? (
											<TouchableOpacity style={styles.actRegBtn} onPress={() => {
												HandlerOnceTap(
													() => {
														if (this.state.activityInfor.isActive == '0') {
															this._activityApply();
														} else if (this.state.activityInfor.isActive == '1') {
															this._exitActivity();
														}
													}
												)
											}}>
												<Text
													style={styles.actRegBtnText}>{'我要报名'}</Text>
											</TouchableOpacity>) : (
											this.state.activityInfor.isActive == '-1' && this.state.headList.length < this.state.activityInfor.memberNum ? (
												<View style={styles.actLabel}>
													<Text
														style={styles.actRegBtnText}>{'被拒绝'}</Text></View>) : (<View style={styles.actLabel}>
												<Text
													style={styles.actRegBtnText}>{'人数已达上限'}</Text></View>)))

								)


							) : (
								<View style={styles.actRegCloseBtn}>
									<Text style={styles.actRegCloseBtnText}>{'已结束'}</Text>
								</View>
							)}

						</View>
						<View style={styles.actInforBottom}>
							{
								this.state.headList.length <= 0 ? <Text style={{
									fontSize: 15,
									color: '#999',
									textAlign: 'center',
								}}>还未有人报名参与活动</Text> : <FlatList
									keyExtractor={(item, index) => String(index)}
									horizontal={true}
									data={this.state.headShowList}
									renderItem={this._headRenderItem}
									scrollEnabled={false}/>
							}
						</View>
					</View>
					<View style={[styles.actPadLR, {backgroundColor: '#f0f0f0'}]}>
						<Text style={styles.actTitle}>{` 活动详情`}</Text>
					</View>
					{
						this.state.activityInfor.content && this.state.activityInfor.content.indexOf('<') > -1 && this.state.activityInfor.content.indexOf('>') > -1 ?
							<MyWebView
								style={{width: width - 20, margin: 10,}}
								startInLoadingState={true}
								source={{html: this.getStaticHtml(this.state.activityInfor.content), baseUrl: ''}}/>
							: <Text style={{margin: 10, fontSize: 14, color: '#333'}}>{this.state.activityInfor.content}</Text>
					}
					<View style={[styles.actPadLR, {backgroundColor: '#f0f0f0'}]}>
						<Text style={styles.actTitle}>{` 用户讨论`}</Text>
					</View>
					<View style={styles.actPadLR}>
						<View style={{flex: 1}}>
							{
								this.state.commentList.length > 0 ?
									(this.state.commentList.map((item, index) => {
									return <View key={index} style={styles.commentListGroup}>
										<Image
											source={{
												uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&imageName=' + item.photoId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode='
												// uri: Path.headImg + '?fileName=' + item.fromUser + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId
											}}
											style={styles.actHeadList}/>
										<View style={{flex: 1}}>
											<View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
												<Text style={{
													fontSize: 15,
													color: '#333',
													flex: 1
												}}>{item.toUserName ? `${item.fromUserName} 评论 ${item.toUserName}` : `${item.fromUserName} 发表于`}</Text>
												<Text style={{fontSize: 12, color: '#aaaaaa'}}>{item.createTime}</Text>
											</View>
											<Text style={{fontSize: 13, color: '#999'}}>{item.content}</Text>
											{this.state.activityInfor.isActive == 1 ? (
												<TouchableOpacity onPress={() => {
													HandlerOnceTap(
														() => {
															this.setState({
																commentPid: item.id,
																// commentContent: '',
																placeholder: '回复' + item.fromUserName + '：'
															}, () => {
																this.refs.commentInput.focus();
															});
														}
													)
												}}>
													<Text style={{
														fontSize: 13,
														color: '#6173ff',
														textAlign: 'right'
													}}>回复</Text>
												</TouchableOpacity>
											) : null}
										</View>
									</View>
								})):null
							}
						</View>
						{this._commentFooter()}
					</View>
				</ScrollView>
				{this.state.activityInfor.isActive == 1 ? (
					<View style={styles.commentBox}>
						<TextInput
							ref={'commentInput'}
							style={styles.commentInput}
							multiline={true}
							value={this.state.commentContent}
							onChangeText={(text) => this.setState({
								commentContent: text
							})}
							onBlur={() => {
								this.setState({
									commentPid: null,
									// commentContent: '',
									placeholder: '请输入评论内容'
								})
							}}
							placeholder={this.state.placeholder}
							underlineColorAndroid={'transparent'}/>
						<TouchableOpacity style={styles.commentReplyBtn} onPress={() => {
							HandlerOnceTap(this._activityComment)
						}}>
							<Text style={{fontSize: 14, color: '#fff'}}>评论</Text>
						</TouchableOpacity>
					</View>
				) : null}
				<Toast ref="toast" opacity={0.6} fadeOutDuration={2000}/>
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

	_commentFooter() {
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
							this.setState({footLoading: true,pageNum : tempNowPage}, () => {
								//获取数据
								this.getActivityDisscussList(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if (this.state.commentList.length > 0) {
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}

	getStaticHtml = (content) => {
		var html = '<!DOCTYPE html><html><head><meta http-equiv="content-type" content="text/html;">';
		html += '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no"><style>*{margin: 0;padding: 0;}p{line-height: 20px;}</style></head>';
		html += '<body style="font-size: 14px;color: #333;">' + content + '</body></html>';
		return html;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		position: 'relative'
	},
	actTop: {
		position: 'relative',
	},
	actTopHead: {
		width: width,
		height: width / 2,
	},
	actTopText: {
		position: 'absolute',
		left: 0,
		bottom: 0,
		right: 0,
		padding: 5,
		paddingLeft: 15,
		backgroundColor: 'rgba(0,0,0,0.6)',
		color: '#fff',
		fontSize: 15,
	},
	actPadLR: {
		paddingLeft: 10,
		paddingRight: 10,
	},
	actInforTop: {
		borderBottomColor: '#ccc',
		borderBottomWidth: 1,
		position: 'relative',
		paddingTop: 10,
	},
	actInforText: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	actIcon: {
		width: 20,
		height: 20,
	},
	actTxt: {
		flex: 1,
		fontSize: 12,
		color: '#959595',
	},
	actCost: {
		fontSize: 13,
		color: '#ff9226'
	},
	actRegBtn: {
		position: 'absolute',
		right: 0,
		bottom: 10,
		borderWidth: 1,
		borderColor: '#6173ff',
		borderRadius: 4,
		paddingLeft: 5,
		paddingRight: 5,
	},

	actLabel: {
		position: 'absolute',
		right: 0,
		bottom: 10,
		paddingLeft: 5,
		paddingRight: 5,
	},

	actRegBtnText: {
		fontSize: 15,
		color: '#6173ff',
		margin: 3,
	},
	actRegCloseBtn: {
		position: 'absolute',
		right: 0,
		bottom: 10,
		borderWidth: 1,
		borderColor: '#ff9226',
		borderRadius: 4,
		paddingLeft: 5,
		paddingRight: 5,
	},
	actRegCloseBtnText: {
		fontSize: 15,
		color: '#ff9226',
		margin: 3,
	},
	actInforBottom: {
		paddingTop: 10,
		paddingBottom: 10,
	},
	actHeadList: {
		width: HEADWIDTH,
		height: HEADWIDTH,
		borderRadius: 4,
		marginRight: 10,
	},
	headListIcon: {
		position: 'absolute',
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.4)',
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
	},
	actTitle: {
		color: '#333',
		fontSize: 16,
		borderLeftColor: '#ff9226',
		borderLeftWidth: 5,
		paddingLeft: 6,
		marginTop: 8,
		marginBottom: 8,
	},
	commentStyle: {
		padding: 10,
		marginBottom: 5,
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
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
	},
	commentBox: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 5,
		paddingLeft: 15,
		paddingRight: 15,
		borderTopColor: '#d7d7d7',
		borderTopWidth: 1,
	},
	replyComment: {
		height: 50,
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		paddingLeft: 10,
		paddingRight: 10,
		borderTopWidth: 1,
		borderTopColor: '#dedede',
		marginBottom: 0,
	},
	commentInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#e1e1e1',
		borderRadius: 4,
		backgroundColor: '#f0f0f0',
		padding: 2,
		paddingLeft: 8,
		paddingRight: 8,
		lineHeight: 24,
	},
	commentReplyBtn: {
		padding: 5,
		paddingLeft: 8,
		paddingRight: 8,
		backgroundColor: '#0100de',
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10,
	},
	commentListGroup: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		paddingTop: 10,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
	},
})
