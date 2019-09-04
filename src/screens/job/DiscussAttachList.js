import React, {Component} from 'react';
import {
	StyleSheet, Text, View,
	Platform, TouchableOpacity, Dimensions, Image, FlatList,
	ActivityIndicator, ToastAndroid, Modal, Alert, DeviceEventEmitter
} from 'react-native';
import Header from '../../component/common/Header';
import DeviceInfo from 'react-native-device-info';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import ParamsDealUtil from '../../util/ParamsDealUtil';
import fileTypeReturn from '../../util/FileType';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';
import OpenFile from "react-native-doc-viewer";
import cookie from "../../util/cookie";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Pdf from "react-native-pdf";
import BottomMenu from "../../component/common/BottomMenu";
import Toast, {DURATION} from 'react-native-easy-toast';

// const Pdf = Platform.select({
// 	ios: () => null,
// 	//android: () => require('react-native-pdf'),
// })();

const {width, height} = Dimensions.get('window');
const WIDTHSIZE = 50;

export default class DiscussAttachList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			uuid: props.navigation.state.params.uuid,
			basic: props.navigation.state.params.basic,
			ticket: props.navigation.state.params.ticket,
			inviteID: props.navigation.state.params.inviteID,
			searchAttachId: !props.navigation.state.params.searchAttachId ? '' : props.navigation.state.params.searchAttachId,//搜索对应附件名
			searchAttachName: '',//搜索对应附件名
			list: [],//附件列表
			lookImages: [],//图片附件
			lookChooseId: null,//显示图片id
			pageNum: 1,
			totalPage: 0,
			footLoading: false,
			isModalVisible: false,//预览图片modal
			animating: true,
			fileAnimating: false,//文件预览动画
			pdfModalVisible: false,//pdf预览Modal
			pdfInsideModalVisible: false,//pdf里面的Modal
			source: {uri: '', cache: true},//pdf
			chooseShowModalVisible: false,//文件预览Modal
			viewFile: {},//被预览文件对象
		}
	}

	componentDidMount() {
		this.getAttachList(1)
	};

	getAttachList = (pageNum) => {
		let params = {
			ticket: this.state.ticket,
			uuId: this.state.uuid,
			userId: this.state.basic.userId,
			jobInvitationId: this.state.inviteID,
			discussId: this.state.searchAttachId,
			pageNum: pageNum,
			pageSize: Path.pageSize
		};
		FetchUtil.netUtil(Path.getDiscussAttachList + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (data) => {
			if(data=="tip"){
                this.setState({
                    footLoading: false
				},()=>{
                    this.refs.toast.show('附件列表获取失败！', DURATION.LENGTH_SHORT);
				})
			}else if(data.code.toString() == '200') {
				let body = data.data.page,
					arrey = this.state.lookImages;
				for (let i in body.recordList) {//遍历数据将图片存入预览数组中
					if (fileTypeReturn.fileTypeSelect(body.recordList[i].fileName) == 'img') {
						arrey.push({url: Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&attId=' + body.recordList[i].id});
					}
				}
				this.setState({
					list: pageNum == 1 ? body.recordList : this.state.list.concat(body.recordList),
					lookImages: arrey,
					pageNum: body.currentPage,
					totalPage: body.totalPage,
					footLoading: false
				});
			}
		});
	};

	render() {
		return (
			<View style={styles.container}>
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
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'文件'}
				/>
                <Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
				<FlatList
					keyExtractor={(item, index) => String(index)}
					data={this.state.list}
					renderItem={this._renderItemList}
					ItemSeparatorComponent={() => <View style={styles.separator}/>}
                    ListEmptyComponent={() => (
                        <View
                            style={{
                                height: 100,
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                        >
                            <Text style={{ fontSize: 16, color: "#999" }}>暂无数据</Text>
                        </View>
                    )}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					ListFooterComponent={this._renderFooter.bind(this)}/>
				<Modal
					visible={this.state.isModalVisible}
					animationType={'none'}
					transparent={true}
					onRequestClose={() => {
						this.setState({isModalVisible: false, animating: false})
					}}
				>
					<View style={{flex: 1}}>
						<ImageViewer
							style={{width: width, height: height}}
							imageUrls={this.state.lookImages}
							enableImageZoom={true}
							index={this.state.lookChooseId}
							flipThreshold={10}
							maxOverflow={0}
							onClick={() => { // 图片单击事件
								this.setState({isModalVisible: false, animating: false})
							}}
							enablePreload={true}//开启预加载
							loadingRender={()=><View style={{width: width, height: height,justifyContent:'center',alignItems:'center'}}>
								<Image source={require('../../images/loading.png')}/>
							</View>}
							backgroundColor={'#000'}
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
			</View>
		)
	}

	_renderItemList = ({item, index}) => {//附件列表遍历

		let fType = fileTypeReturn.fileTypeSelect(item.fileName);
		return <TouchableOpacity key={index} style={{flexDirection: 'row', alignItems: 'center', padding: 5}}
		                         onPress={() => {
			                         HandlerOnceTap(
				                         () => {
					                         fType != 'img' ? this._viewFile(item) : this._LookingFile(item);
				                         }
			                         )
		                         }}>
			<View
				style={{marginRight: 10, justifyContent: 'center', alignItems: 'center', width: WIDTHSIZE, height: WIDTHSIZE}}>
				{
					fType == 'img' ? <Image
						source={{uri: Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&attId=' + item.id}}
						style={{width: WIDTHSIZE, height: WIDTHSIZE}}/> : fType
				}
			</View>
			<View style={{flex: 1, height: WIDTHSIZE, justifyContent: 'center'}}>
				<Text numberOfLines={1} style={{fontSize: 16, color: '#333', marginBottom: 5}}>{item.fileName}</Text>
				<Text numberOfLines={1} style={{fontSize: 12, color: '#999'}}>发布于{item.createTime}</Text>
			</View>
		</TouchableOpacity>
	}

	//文件预览
	_viewFile = (file) => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
        this.setState({
            viewFile: file
        },()=>{
            if (Platform.OS == 'ios') {
                this.refs.bottomMenu._changeMenuShow(true);
                this.refs.bottomMenu._changeFirMenuShow(true);
                this.refs.bottomMenu._changeSecMenuShow(false);
            } else {
                //Android
                let showFileType = fileTypeReturn.getOtherFileType(file.fileName);
                if (showFileType != 'file') {
                    //其他类型直接弹出第三方打开
                    // this._useOtherOpenFile(file);
                    this.refs.bottomMenu._changeMenuShow(true);
                    this.refs.bottomMenu._changeFirMenuShow(false);
                    this.refs.bottomMenu._changeSecMenuShow(true);
                }else{
                    this.refs.bottomMenu._changeMenuShow(true);
                    this.refs.bottomMenu._changeFirMenuShow(true);
                    this.refs.bottomMenu._changeSecMenuShow(true);
                }
            }
        });

	}

	_downloadFile = (file) => {
		DeviceEventEmitter.emit('changeLoading', 'true');
        let url = Path.baseImageUrl + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)) + '&type=file' + '&userId=' + this.state.basic.userId;
        let downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/' + file.fileName;
		const options = {
			fromUrl: url,
			toFile: downloadDest,
			background: true,
		};
		try {
			const ret = RNFS.downloadFile(options);
			ret.promise.then(res => {
				if (res.statusCode == 200) {
					if (Platform.OS == 'android') {
						DeviceEventEmitter.emit('changeLoading', 'false');
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
			});
		}
		catch (e) {
		}
	}

	_useLocalOpenFile = (file) => {
		if (Platform.OS == 'ios') {
			//this.refs.bottomMenu._changeMenuShow(false);
			OpenFile.openDocBinaryinUrl([{
				url: Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&attId=' + file.id + '&userId=' + this.state.basic.userId,
				fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				fileType: file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length)
			}], (error, url) => {
				this.setState({animating: false});
				DeviceEventEmitter.emit('changeLoading', 'false');
			})
		} else {
			this.setState({
				pdfInsideModalVisible: true,
				source: {
					uri: Path.previewAttachment + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&userId=' + this.state.basic.userId + '&attId=' + file.id + '&suffix=' + file.fileName,
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
	}
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
	}


	//图片预览
	_LookingFile = (item) => {

		let body = this.state.lookImages,
			chooseId = null;
		for (let i in body) {
			if (body[i].url.indexOf(item.id) > -1) {
				chooseId = parseInt(i);
			}
		}
		this.setState({
			lookChooseId: chooseId,
			isModalVisible: true,
		});
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
								this.getAttachList(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if (this.state.list.length > 0) {
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		position: 'relative'
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
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