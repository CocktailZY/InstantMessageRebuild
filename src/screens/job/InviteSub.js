/**
 * 工作邀请详情附件上传和完成
 * InviteSub
 * cocktailZy
 * 2018/12/28 9:15
 */

import React, {Component} from 'react';
import {
	Text, View, StyleSheet,
	Platform, Switch, TouchableOpacity, Alert,
	BackHandler, FlatList, DeviceEventEmitter
} from 'react-native';

/**
 * 基础样式组件
 */
import baseStyles from '../../commen/styles/baseStyles';

/**
 * 导入第三方组件
 */
import OpenFile from "react-native-doc-viewer";
import cookie from "../../util/cookie";
import Icons from "react-native-vector-icons/Ionicons";
import FeatherIcons from "react-native-vector-icons/Feather";

const StatusBarAndroid = Platform.select({
	ios: () => null,
	android: () => require('react-native-android-statusbar'),
})();
const FilePickerManager = Platform.select({
	ios: () => null,
	android: () => require('react-native-file-picker'),//android
})();
/**
 * 导入自定义组件
 */
import Header from "../../component/common/Header";
import Global from "../../util/Global";
import HandlerOnceTap from "../../util/HandlerOnceTap";
import PermissionUtil from "../../util/PermissionUtil";
import fileTypeReturn from "../../util/FileType";
import Path from "../../config/UrlConfig";
import CustomBtn from "../../component/common/CommitBtn";
import RNFS from "react-native-fs";
import AwesomeAlert from "react-native-awesome-alerts";

if (Platform.OS == 'android') {
	StatusBarAndroid.setHexColor('#549dff');
}

export default class InviteSub extends Component {
	constructor(props) {
		super(props);
		this.state = {
			jobInvitation: props.navigation.state.params.jobInvitation,//工作邀请详情对象
			fileName: '',//上传附件名字
			updateFileShowList: props.navigation.state.params.updateFileShowList,//上传附件列表
			isComplate: props.navigation.state.params.isComplate, //switch是否可变
			isComplateValue: props.navigation.state.params.isComplateValue, //switch的值
            showAlert: false,//alert框
            tipMsg: ''//alert提示信息
		}
	}

	componentDidMount() {

	}

	componentWillUnmount() {

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

    _toast = (text) => {
        this.setState({
            showAlert: true,//alert框
            tipMsg: text//alert提示信息
        });
    };
	//上传文件
	_updateFile = () => {
		if (Platform.OS == 'android') {
			PermissionUtil.requestAndroidPermission(
				[PermissionsUtil.Permissions.read, PermissionsUtil.Permissions.write, PermissionsUtil.Permissions.camera], (value) => {
					if (typeof value == "boolean" && value) {
						this.openFilePicker();
					} else if (typeof value == "boolean" && !value) {
						Alert.alert(
							'提醒',
							'使用文件功能前，请先开启存储和相机权限！',
							[
								{
									text: '确定',
								}
							]
						)
					} else if (typeof value == "object") {
						let status = true;
						for (let key in value) {
							if (!value[key]) {
								status = false;
							}
						}
						if (status) {
							this.openFilePicker();
						} else {
							Alert.alert(
								'提醒',
								'使用文件功能前，请先开启存储和相机权限！',
								[
									{
										text: '确定',
									}
								]
							)
						}
					} else {
					}
				}
			);
		} else {
			this.openFilePicker();
		}
	};
	//打开文件管理器
	openFilePicker = () => {
		cookie.save('isUpload', 1);
		FilePickerManager.showFilePicker(null, (response) => {
			if (response.didCancel) {
			} else if (response.error) {
			} else {
				//开启转圈
				DeviceEventEmitter.emit('changeLoading', 'true');
				response.fileName = response.path.substring(response.path.lastIndexOf('/') + 1, response.path.length);
				let formData = new FormData();
				let file = {uri: response.uri, type: 'multipart/form-data', name: encodeURIComponent(response.fileName)};
				formData.append("file", file);
				let url = Path.getInviteFile + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&jidNode=' + Global.loginUserInfo.jidNode + '&userId=' + Global.loginUserInfo.userId + '&jobInvitationId=' + this.state.jobInvitation.id;
				fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					body: formData,
				}).then((response) => response.json()).then((responseData) => {
					if(responseData.code.toString() == '200') {
						let fileName = response.fileName.replace(/&/g, '').replace(/\?/g, '') + '|$|' + responseData.data[0].data + '@';
						// if(response.fileName.indexOf('&'))
						// Base64Util.encode(response.fileName.substring(0,response.fileName.indexOf('.')))+response.fileName.substring(response.fileName.indexOf('.'),response.fileName.length) + '|$|' + responseData.data[0].data + '@';
						let arrey = this.state.updateFileShowList;
						arrey.push({
							name: response.fileName.replace(/&/g, ''),//Base64Util.encode(response.fileName.substring(0,response.fileName.indexOf('.')))+response.fileName.substring(response.fileName.indexOf('.'),response.fileName.length),
							path: responseData.data[0].data
						});
						this.setState({
							fileName: this.state.fileName + fileName,
							updateFileShowList: arrey
						},()=>{
							DeviceEventEmitter.emit('changeLoading', 'false');
						});
					} else {
                        this._toast(`    上传失败！    `);
					}
				}, () => {
                    DeviceEventEmitter.emit('changeLoading', 'false');
                    this._toast(`    上传失败！    `);
				}).catch((error) => {
                    DeviceEventEmitter.emit('changeLoading', 'false');
                    this._toast('上传失败！');
					console.error('error', error);
				});
			}
		});
	};
	//文件下载
	_downloadFile = (file) => {
		DeviceEventEmitter.emit('changeLoading', 'true');
		let url = Path.getDownLoadAttachList + '?uuId=' + this.state.uuid + '&ticket=' + this.state.ticket + '&attId=' + file.id + '&userId=' + this.state.basic.userId;
		let downloadDest = '';
		if (Platform.OS == 'android') {
			downloadDest = '/storage/emulated/0/Android/data/com.instantmessage/files/' + file.fileName;
		} else {
			downloadDest = '/storage/emulated/0/Android/data/com.egt_rn/files/' + file.name;
		}
		const options = {
			fromUrl: url,
			toFile: downloadDest,
			background: true,
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
			});
		}
		catch (e) {
		}
	}
	//图片预览
	_LookingImage = (id) => {
		let body = this.state.lookImages,
			chooseId = null;
		for (let i in body) {
			if (body[i].url.indexOf(id) > -1) {
				chooseId = parseInt(i);
			}
		}
		this.setState({
			lookChooseId: chooseId,
			isModalVisible: true,
		});
	};
	//文件预览
	_LookingFile = (file) => {
		cookie.save('isUpload', 1);//用于判断是否为选择文件后台状态
		this.setState({
			viewFile: file
		}, () => {
			this.setState({fileAnimating: true}, () => {
				if (Platform.OS == 'android') {
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
				} else {
					this.refs.bottomMenu._changeMenuShow(true);
					this.refs.bottomMenu._changeFirMenuShow(true);
					this.refs.bottomMenu._changeSecMenuShow(false);

				}
				this.setState({fileAnimating: false});
			});
		});

	};
	//调起本地预览
	_useLocalOpenFile = (file) => {
		if (Platform.OS == 'android') {
			this.setState({
				pdfInsideModalVisible: true,
				source: {
					uri: Path.previewAttachment + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&userId=' + Global.loginUserInfo.userId + '&attId=' + file.id + '&suffix=' + file.fileName,
					cache: 'reload'
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
		} else {
			let fileType = file.fileName.substr(file.fileName.lastIndexOf('.') + 1, file.fileName.length);
			let parame = {
				url: Path.getDownLoadAttachList + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&attId=' + file.id + '&userId=' + Global.loginUserInfo.userId,
				fileName: file.fileName.substr(0, file.fileName.lastIndexOf('.')),
				fileType: fileType
			};
			OpenFile.openDocBinaryinUrl([parame], (error, url) => {})
		}
	};
	//调起选择其他程序
	_useOtherOpenFile = (file) => {
		OpenFile.openDocBinaryinUrl([{
			url: Path.baseImageUrl + '?uuId=' + Global.basicParam.uuId + '&ticket=' + Global.basicParam.ticket + '&userId=' + Global.loginUserInfo.userId + '&fileId=' + file.id + '&fileName=' + encodeURI(encodeURI(file.fileName)),
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
	//渲染附件列表
	_renderUpdateFiles = ({item, index}) => {
		return (
			<View key={index} style={{
				flexDirection: 'row',
				alignItems: 'center',
				paddingLeft: 15,
				paddingRight: 15,
				height:44
			}}>
				<Text numberOfLines={1} style={{fontSize: 14, color: '#333', flex: 1}}>{item.name}</Text>
				<TouchableOpacity style={{marginLeft:8}} onPress={() => {
					HandlerOnceTap(
						() => {
							let box = this.state.updateFileShowList,
								newFile = '';
							for (let i in box) {
								if (box[i].path == item.path) {
									box.splice(i, 1);
								}
							}
							box.map((item) => {
								newFile += item.name + '|$|' + item.path + '@';
							});
							this.setState({
								updateFileShowList: box,
								fileName: newFile
							});
						}
					)
				}}>
					<Icons name={'ios-close'} size={30} color={'tomato'}/>
				</TouchableOpacity>
			</View>
		)
	};
	//传回参数
	_commitStatus = () => {
		this.props.navigation.navigate('InviteDetails', {
			jobInvitation: this.state.jobInvitation,
			isComplateValue: this.state.isComplateValue,
			fileName: this.state.fileName,
			updateFileShowList: this.state.updateFileShowList
		});
	}

	render() {
		const {jobInvitation, isComplate, isComplateValue, fileName, updateFileShowList,showAlert, tipMsg} = this.state;
		return (
			<View style={baseStyles.theme_main}>
				<Header
					headLeftFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'评论编辑'}
				/>
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
				{Global.loginUserInfo.jidNode != jobInvitation.createUser ? (
					<View style={[baseStyles.bkcolor_white,baseStyles.flex_row, {height: 44, marginTop: 10, marginBottom: 10}]}>
						<View style={[baseStyles.row_center, {flex: 2, paddingLeft: 12}]}>
							<Text>{'标记完成'}</Text>
						</View>
						<View style={[baseStyles.row_col_center, {flex: 1}]}>
							<Switch	disabled={isComplate ? true : false}
											onValueChange={(value) => {
												this.setState({
													isComplateValue: value
												})
											}}
											thumbTintColor={'#3498db'}
											onTintColor={'#3498db'}
											value={isComplateValue}/>
						</View>
					</View>
				) : null}
				{Platform.OS == 'ios' ? null : (
					<View style={[baseStyles.bkcolor_white,baseStyles.flex_row, {height: 44, marginBottom: 10}]}>
						<View style={[baseStyles.row_center, {flex: 2, paddingLeft: 12}]}>
							<Text>{'附件上传'}</Text>
						</View>
						<View style={[baseStyles.row_col_center, {flex: 1}]}>
							<TouchableOpacity style={[baseStyles.row_col_center,baseStyles.flex_row]} onPress={() => {
								HandlerOnceTap(this._updateFile)
							}}>
								<View style={[baseStyles.row_col_center,{flex:2}]}>
									<FeatherIcons name={'upload'} size={24} color={'#3498db'} />
								</View>
								{updateFileShowList.length > 0 ? (
									<View style={[baseStyles.row_col_center,{flex:1}]}>
										<Text style={{fontSize: 14, color:'#3498db'}}>{updateFileShowList.length}</Text>
									</View>
								) : null}
							</TouchableOpacity>
						</View>
					</View>
				)}
				<View style={[baseStyles.bkcolor_white,baseStyles.flex_one, {marginBottom: 10}]}>
					<FlatList
						keyExtractor={(item, index) => String(index)}
						data={updateFileShowList}
						renderItem={this._renderUpdateFiles}
						ItemSeparatorComponent={() => <View style={styles.separator}></View>}
						ListEmptyComponent={() => <Text style={{textAlign: 'center', margin: 10}}>无上传附件</Text>}/>
				</View>
				<CustomBtn
					onBtnPressCallback={this._commitStatus}
					btnText={'确认'}
					btnStyle={styles.commitBtn}
				/>
			</View>
		)
	}
}
const styles = StyleSheet.create({
	commitBtn: {
		height: 43,
		borderRadius: 4,
		backgroundColor: '#549dff',
		justifyContent: 'center',
		alignItems: 'center',
		margin: 14,
		marginLeft: 12,
		marginRight: 12
	},
	separator: {
		borderBottomWidth: 1,
		borderBottomColor: '#ccc'
	},
});