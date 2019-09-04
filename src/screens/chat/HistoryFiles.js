import React, {Component} from 'react';
import {
	StyleSheet, Text, View,
	Platform, TouchableOpacity, SectionList,
	Image, ActivityIndicator, Alert,
	DeviceEventEmitter, Modal
} from 'react-native';
import Header from '../../component/common/Header';
import BottomMenu from '../../component/common/BottomMenu';
import FetchUtil from "../../util/FetchUtil";
import Path from "../../config/UrlConfig";
import fileTypeReturn from '../../util/FileType';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import OpenFile from 'react-native-doc-viewer';
import RNFS from 'react-native-fs';
import Toast, {DURATION} from 'react-native-easy-toast';
import cookie from "../../util/cookie";
import ToolUtil from '../../util/ToolUtil';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import DeviceInfo from 'react-native-device-info';
import Pdf from 'react-native-pdf';
import AwesomeAlert from "react-native-awesome-alerts";

// const Pdf = Platform.select({
// 	ios: () => null,
// 	//android: () => require('react-native-pdf'),//android
// })();

let totalPage;
let pageGo = 1;
const uuid = DeviceInfo.getUniqueID().replace(/\-/g, '');
export default class HistoryFiles extends Component {
	constructor(props) {
		super(props);
		this.state = {
			filesList: [],
			room: !props.navigation.state.params.room ? null : props.navigation.state.params.room,
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			friendJidNode: !props.navigation.state.params.friendJidNode ? null : props.navigation.state.params.friendJidNode,//true是单聊
			pageNum: 1,
			totalPage: 0,
			footLoading: false,
			animating: true,
			fileAnimating: false,//文件预览动画
			pdfModalVisible: false,//pdf预览Modal
			pdfInsideModalVisible: false,//pdf里面的Modal
			source: {uri: '', cache: true},//pdf
			chooseShowModalVisible: false,//文件预览Modal
			viewFile: {},//被预览文件对象
			showAlert: false,//alert框
			tipMsg:''//alert提示信息
		}
	};

	componentDidMount() {
		this.fetchFileData(1);
	};

	componentWillUnmount() {
	}

	fetchFileData = (pageNum) => {
		let params = {
			isNotShowPic: 'img',
			pageSize: 6,//由于样式原因，本列表一页显示6条数据
			pageNum: pageNum,
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId
		};
		if (!this.state.friendJidNode) {
			params.roomJidNode = this.state.room.roomJid;
			params.stype = 'groupchat';
		} else {
			params.stype = 'sglc';
			params.sendJidNode = this.state.basic.jidNode;
			params.toJidNode = this.state.friendJidNode;
		}
		FetchUtil.netUtil(Path.getGroupHistoryImage + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (responseData) => {
			if(responseData == 'tip'){
				this.refs.toast.show('网络错误，获取文件失败');
			} else if (responseData.code.toString() == '200') {
				let fileArr = [];
				if(responseData.picList){
					responseData.picList.map((item) => {
						let fileData = {
							time: item.time,
							data: item.dayList
						};
						if (fileArr.length > 0) {
							let fileType = -1;
							for (let i in fileArr) {
								if (fileArr[i].time == item.time) {
									fileType = i;
									break;
								}
							}
							if (fileType >= 0) {
								fileArr[fileType].data = fileArr[fileType].data.concat(item.dayList);
							} else {
								fileArr.push(fileData);
							}
						} else {
							fileArr.push(fileData);
						}
					});
					this.setState({
						filesList: fileArr,
						pageNum: pageNum,
						totalPage: responseData.totalPage,
						footLoading: false
					});
				}
			}
		})
	};


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
								this.fetchFileData(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if(this.state.filesList.length > 0){
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}

	_renderListItem = ({item, index}) => {
		const start = item.fileName.lastIndexOf('\.') + 1;
		const nowType = item.fileName.substr(start);
		const timeStart = item.createTime.lastIndexOf(' ');
		const time = item.createTime.substr(0, timeStart);
		return (
			<View style={styles.historyContent} key={index}>
				<View style={[styles.fileBox, index == 0 ? {borderTopColor: 'transparent'} : null]}>
					<View style={styles.fileTop}>
						<Image
							source={{uri: Path.headImgNew + '?userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&imageName=' + item.photoId + '&imageId=' + item.photoId + '&sourceType=singleImage&jidNode='}}
							style={styles.fileHead}/>
						<Text style={styles.addresserName}>{item.nickName}</Text>
						<Text style={styles.releaseTime}>{time}</Text>
					</View>
					<View style={styles.fileBottom}>
						<View style={{
							marginRight: 10,
							justifyContent: 'center',
							alignItems: 'center'
						}}>{fileTypeReturn.fileTypeSelect(item.fileName)}</View>
						<TouchableOpacity style={styles.fileInfor} onPress={() => {
							HandlerOnceTap(
								() => {
									this.viewfile(item);
								}
							)
						}}>
								<Text style={[styles.fileName]} numberOfLines={2}>{item.fileName}</Text>
								<Text style={[styles.fileSize]}>{nowType + '  (' + ToolUtil.getFileSize(item.filesize) + ')'}</Text>
						</TouchableOpacity>
					</View>
				</View>
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
				<Modal
					visible={this.state.pdfModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'none'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						this.setState({pdfModalVisible: false})
					}}
				>
					<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'}}>
						<Pdf
							source={this.state.source}
							onLoadComplete={(numberOfPages, filePath) => {
								this.setState({
									pdfInsideModalVisible: false
								})
							}}
							onPageChanged={(page, numberOfPages) => {
							}}
							onError={(error) => {
								this.setState({pdfInsideModalVisible: false})
							}}
							enablePaging={false}
							onPageSingleTap={() => {
								this.setState({pdfModalVisible: false})
							}}
							activityIndicator={()=>{return null;}}
							style={{flex: 1}}/>
					</View>
				</Modal>
				<Modal
					visible={this.state.pdfInsideModalVisible}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'none'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						// this.setState({pdfInsideModalVisible: false})
					}}
				>
					<View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
						<ActivityIndicator
							animating={this.state.animating}
							size="large"
							color='rgba(76,122,238,1)'
						/>
					</View>
				</Modal>
				<BottomMenu
					ref={'bottomMenu'}
					isShow={this.state.chooseShowModalVisible}
					menuTitle={'请选择打开方式'}
					firstMenuFunc={
						() => {
							HandlerOnceTap(this._useLocalOpenFile(this.state.viewFile))
						}}
					firstTitle={'应用内部打开'}
					secondMenuFunc={() => {
						HandlerOnceTap(this._useOtherOpenFile(this.state.viewFile))
					}}
					secondTitle={'第三方应用打开'}
					downloadFunc={() => {
						this._downloadFile(this.state.viewFile)
					}}
				/>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'文件'}
				/>
				<View style={{flex: 1}}>
					<SectionList
						keyExtractor={(item, index) => String(index)}
						sections={this.state.filesList}
						renderSectionHeader={({section}) => {
							return <Text style={styles.historyTitle}>{section.time}</Text>
						}}
						renderItem={this._renderListItem}
						ListEmptyComponent={() => <View
							style={{height: 100, justifyContent: 'center', alignItems: 'center'}}><Text
							style={{color: '#999', fontSize: 16}}>暂无文件记录</Text></View>}
						// onEndReachedThreshold={0.1}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						// onEndReached={this._onEndReached}
						ListFooterComponent={this._renderFooter.bind(this)}
					/>
				</View>
			</View>
		)
	}

	//文件预览
	viewfile = (file) => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
		// let url = Path.viewFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&suffix=' + file.fileName;
		this.setState({
			viewFile: file
		}, () => {
			this.setState({fileAnimating: true}, () => {
				if (Platform.OS == 'ios') {
					this.refs.bottomMenu._changeMenuShow(true);
					this.refs.bottomMenu._changeFirMenuShow(true);
					this.refs.bottomMenu._changeSecMenuShow(false);
				} else {
					//Android
					let showFileType = fileTypeReturn.getOtherFileType(file.fileName);
					if (showFileType == 'file') {
						this.refs.bottomMenu._changeMenuShow(true);
						this.refs.bottomMenu._changeFirMenuShow(true);
						this.refs.bottomMenu._changeSecMenuShow(true);
					} else {
						//其他类型直接弹出第三方打开
						// this._useOtherOpenFile(file);
						this.refs.bottomMenu._changeMenuShow(true);
						this.refs.bottomMenu._changeFirMenuShow(false);
						this.refs.bottomMenu._changeSecMenuShow(true);
					}
				}
				this.setState({fileAnimating: false});
			});
		});
	};
	_useLocalOpenFile = (file) => {
		if (Platform.OS == 'ios') {
			let url = Path.viewFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&suffix=' + file.fileName;
			OpenFile.openDocBinaryinUrl([{
				url: url,
				fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				fileType: file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length)
			}], (error, url) => {
				DeviceEventEmitter.emit('changeLoading', 'false');
			})
		} else {
			this.setState({
				pdfInsideModalVisible: true,
				source: {
					uri: Path.viewFile + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&suffix=' + file.fileName,
					cache: true
				}//pdf
			}, () => {
				this.setState({
					pdfModalVisible: true,
					tempViewFileSize: file.filesize
				}, () => {
					this.refs.bottomMenu._changeMenuShow(false);
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(false);
				})
			})
		}

	};
	//调起选择其他程序
	_useOtherOpenFile = (file) => {
		OpenFile.openDocBinaryinUrl([{
			url: Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)),
			fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
			fileType: file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length),
			cache: true
		}], (error, url) => {
			if (error) {
				this.setState({animating: false}, () => {
					this.refs.bottomMenu._changeMenuShow(false);
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(false);
				});
				console.error(error);
			} else {
				this.setState({animating: false}, () => {
					this.refs.bottomMenu._changeMenuShow(false);
					this.refs.bottomMenu._changeFirMenuShow(false);
					this.refs.bottomMenu._changeSecMenuShow(false);
				});
			}
		})
	};
	_downloadFile = (file) => {
		DeviceEventEmitter.emit('changeLoading', 'true');
		let url = Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)) + '&type=file' + '&userId=' + this.state.basic.userId;
		let downloadDest = '';
		if (Platform.OS == 'android') {
			downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/' + file.fileName;
		} else {
			downloadDest = '/storage/emulated/0/Android/data/com.egt_rn/files/' + file.name;
		}
		const options = {
			fromUrl: url,
			toFile: downloadDest,
			background: false,
		};
		try {
			const ret = RNFS.downloadFile(options);
			ret.promise.then(res => {
				if (res.statusCode == 200) {
					DeviceEventEmitter.emit('changeLoading', 'false');
					if (Platform.OS == 'android') {
						Alert.alert(
							'文件保存路径',
							downloadDest.substring(downloadDest.indexOf('0') + 1, downloadDest.length),
							[
								{
									text: '确定', onPress: () => {
										this.refs.bottomMenu._changeMenuShow(false);
										this.refs.bottomMenu._changeFirMenuShow(false);
										this.refs.bottomMenu._changeSecMenuShow(false);
									}
								}
							]
						)

					}
				}
			}).catch(err => {
				this.setState({
					showAlert: true,//alert框
					tipMsg:'保存失败'//alert提示信息
				});
				// this.refs.toast.show('保存失败', DURATION.LENGTH_SHORT);

			});
		}
		catch (e) {
			this.setState({
				showAlert: true,//alert框
				tipMsg:'保存失败'//alert提示信息
			});
			// this.refs.toast.show('保存失败', DURATION.LENGTH_SHORT);
		}
	};
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	historyTitle: {
		fontSize: 14,
		color: '#666',
		backgroundColor: '#d7d7d7',
		lineHeight: 32,
		paddingLeft: 10,
	},
	historyContent: {
		flex: 1,
		paddingLeft: 10,
		paddingRight: 10,
		backgroundColor: '#fff',
	},
	fileBox: {
		borderTopColor: '#d1d1d1',
		borderTopWidth: 1,
		paddingTop: 10,
		paddingBottom: 10,
	},
	fileTop: {
		marginBottom: 10,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	fileHead: {
		width: 20,
		height: 20,
		marginRight: 10,
	},
	addresserName: {
		fontSize: 14,
		color: '#999',
		flex: 1,
	},
	releaseTime: {
		fontSize: 10,
		color: '#999',
		width: 80,
		textAlign: 'right'
	},
	fileBottom: {
		backgroundColor: '#f6f5f5',
		padding: 8,
		flexDirection: 'row'
	},
	fileTypeIcon: {
		width: 33,
		height: 42,
		marginRight: 13,
	},
	fileInfor: {
		flex: 1,
		// height: 42,
		justifyContent: 'space-between'
	},
	fileName: {
		fontSize: 14,
		color: '#333',
	},
	fileSize: {
		fontSize: 10,
		color: '#999',
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