import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
    DeviceEventEmitter,
	TouchableWithoutFeedback,TouchableOpacity, Platform, Dimensions
} from 'react-native';
import Header from '../../component/common/Header';
import Icons from 'react-native-vector-icons/Ionicons';
import FetchUtil from '../../util/FetchUtil';
import GridView from 'react-native-super-grid';
import Path from "../../config/UrlConfig";
import HandlerOnceTap from '../../util/HandlerOnceTap';

const {height, width} = Dimensions.get('window');
export default class Group extends Component {
	constructor(props) {
		super(props);
		this.state = {
			memberData: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			roomJid: props.navigation.state.params.roomJid,
			room: props.navigation.state.params.room,
			groupOwner: props.navigation.state.params.groupOwner,
			basic: props.navigation.state.params.basic,
		}
	};

	//组件渲染完毕时调用此方法
	componentDidMount() {
		this._fetchMember();
		this.refreshData = DeviceEventEmitter.addListener('refreshMemberData',()=>{
			this._fetchMember();
		})
	};

	componentWillUnmount(){
		this.refreshData.remove();
	}

	_fetchMember = () => {
		let url = Path.getGroupMember;
		let params = {
			occupantNick : this.state.searchText,
			roomJid : this.state.roomJid,
			uuId : this.state.uuid,
			ticket : this.state.ticket,
			currentJidNode : this.state.basic.jidNode,
			userId : this.state.basic.userId
		};
		FetchUtil.netUtil(url,params,'POST',this.props.navigation,Global.basicParam,(responseJson) => {
            if (responseJson == 'tip') {
                this._toast(`     操作失败！     `);
            }else if(responseJson.code.toString() == '200'){
                this.listLength = responseJson.data.length;
                let groupUser = this.state.groupOwner,usersArr,nowUser = this.state.basic.jidNode;
                let flag = false;
                groupUser.map((item,index)=>{
                    if(item.occupantJid == nowUser){
                        flag = true;
                    }
                })
                if(flag){
                    usersArr = responseJson.data.concat([{occupantNickName: 'add'}, {occupantNickName: 'cut'}]);
                }else{
                    usersArr = responseJson.data.concat([{occupantNickName: 'add'}]);
                }
                // usersArr = groupUser == nowUser ? responseJson.data.concat([{occupantNickName: 'add'}, {occupantNickName: 'cut'}]) : responseJson.data.concat([{occupantNickName: 'add'}]);
                this.setState({
                    memberData: usersArr
                });
			}
		});
	};

	_renderItem = (data, i) => {
		var tempView;
		if (this.state.room.banRoom.toString() == '0' && data.occupantNickName == 'add') {
			tempView = (
				<View style={[{backgroundColor: '#FFFFFF'}, styles.item]} key={i}>
					<TouchableOpacity onPress={() => {
						HandlerOnceTap(
							() => {
								this.props.navigation.navigate('GroupCreate', {
									'ticket': this.state.ticket,
									'basic': this.state.basic,
									'room': this.state.room,
									'pageType': 'add',
									'uuid': this.state.uuid
								})
							}
						)
					}}>
						<View style={{alignItems: 'center', paddingTop: 5}}>
							<View style={styles.headList}>
								<Icons name={'ios-add-outline'} size={50} color={'#dbdbdb'}/>
							</View>
						</View>
					</TouchableOpacity>
					<View style={styles.nickNameText}>
						<Text style={{fontSize: 12, color: '#333'}}>{'邀请'}</Text>
					</View>
				</View>
			);
		} else if (this.state.room.banRoom.toString() == '0' && data.occupantNickName == 'cut') {
			tempView = (
				<View style={[{backgroundColor: '#FFFFFF'}, styles.item]} key={i}>
					<TouchableOpacity onPress={() => {
						HandlerOnceTap(
							() => {
								this.props.navigation.navigate('GroupCreate', {
									'ticket': this.state.ticket,
									'basic': this.state.basic,
									'room': this.state.room,
									'pageType': 'cut',
									'uuid': this.state.uuid
								})
							}
						)
					}}>
						<View style={{alignItems: 'center', paddingTop: 5}}>
							<View style={styles.headList}>
								<Icons name={'ios-remove-outline'} size={50} color={'#dbdbdb'}/>
							</View>
						</View>
					</TouchableOpacity>
					<View style={styles.nickNameText}>
						<Text style={{fontSize: 12, color: '#333'}}>{'移除'}</Text>
					</View>
				</View>
			)
		} else if(data.occupantTrueName) {
			tempView = (
				<View style={[{backgroundColor: '#FFFFFF'}, styles.item]} key={i}>
					<TouchableWithoutFeedback onPress={() => {
						HandlerOnceTap(
							() => {
								this.props.navigation.navigate('FriendDetail', {
									'ticket': this.state.ticket,
									'basic': this.state.basic,
									'uuid': this.state.uuid,
									'friendJidNode': data.occupantJid,
									'tigRosterStatus': 'both',
									// 'backPage': 'Group',
									// 'room': this.state.room
								})
							}
						)
					}}>
						<View style={{justifyContent: 'center', alignItems: 'center', paddingTop: 5}}>
							<Image
								source={{uri: Path.headImgNew + '?uuId=' + this.state.uuid + '&userId=' + this.state.basic.userId + '&ticket=' + this.state.ticket + '&imageName=' + data.occupantPhotoId+'&imageId='+ data.occupantPhotoId + '&sourceType=singleImage&jidNode='}}
								style={styles.headList}/>
						</View>
					</TouchableWithoutFeedback>
					<View style={styles.nickNameText}>
						<Text numberOfLines={1} style={{fontSize: 12, color: '#333'}}>{data.occupantNickName}</Text>
					</View>
				</View>
			)
		}
		return tempView;
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
					title={'群成员'}
					number={!this.listLength ? 0 : this.listLength}
				/>
				<View style={{flex: 1, backgroundColor: '#FFFFFF', paddingTop: 5, paddingBottom: 5}}>
					<GridView
						style={styles.item}
						itemDimension={(width - 64) / 5}
						renderItem={this._renderItem}
						items={this.state.memberData}
						spacing={5}
					/>
				</View>
			</View>
		)
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		// justifyContent: 'center',
		// alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
	item: {
		flex: 1,
	},
	nickNameText: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 9,
		paddingLeft: 2,
		paddingRight: 2,
	},
	headList: {
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#dbdbdb',
		width: 48,
		height: 48,
		borderRadius: Platform.OS == 'ios' ? 24 : 48
	},
});