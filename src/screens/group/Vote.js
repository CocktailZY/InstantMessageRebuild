/*
 * 投票列表
 * 页面元素 随机排列图标 投票标题 发起人 发起时间 投票状态(根据状态有两种表现：已投票，投票按钮跳详情页)
 *
 */
import React, {Component} from 'react';
import {
	StyleSheet,
	Text,
	View,
	Image,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	DeviceEventEmitter
} from 'react-native';
import Header from '../../component/common/Header';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import HandlerOnceTap from '../../util/HandlerOnceTap';
import ToolUtil from '../../util/ToolUtil';

class Vote extends Component {

	constructor(props) {
		super(props);
		this.state = {
			dataSource: [],
			ticket: props.navigation.state.params.ticket,
			uuid: props.navigation.state.params.uuid,
			room: props.navigation.state.params.room,
			basic: props.navigation.state.params.basic,
			affiliation: props.navigation.state.params.affiliation,
			pageNum: 1, //当前页数
			totalPage: 0, //总页数
			footLoading: false,
		}
	};

	componentDidMount() {
		this.fetchVote(1);
		this._voteAddPage = DeviceEventEmitter.addListener('voteAddPage', (params) => {
			this.fetchVote(1);
		});
	};

	componentWillUnmount() {
		this._voteAddPage.remove();
	}

	//获取投票列表数据
	fetchVote = (pageNum) => {
		let url = Path.getVoteList;
		let params = {
			mid: this.state.room.roomJid,
			jidNode: this.state.basic.jidNode,
			type: 'all',
			pageNum: pageNum,
			pageSize: Path.pageSize
		};
		FetchUtil.netUtil(url, params, 'POST', this.props.navigation, {
			uuId: this.state.uuid,
			ticket: this.state.ticket,
			userId: this.state.basic.userId
		}, this.voteListCallBack);
	};
	//获取投票列表数据回调
	voteListCallBack = (res) => {
		if (res.code.toString() == '200') {
			this.setState({
				dataSource: (res.data.currentPage == 1 || res.data.currentPage == 0) ? res.data.recordList : this.state.dataSource.concat(res.data.recordList),
				pageNum: res.data.currentPage,
				totalPage: res.data.totalPage,
				footLoading: false
			})
		}
	};
	_renderListItem = ({item, index}) => {

		let headColor = '';
		if (ToolUtil.strToStemp(item.endTime) >= new Date().getTime()) {
			if (item.status == '1') {
				//已停止
				headColor = '#b5b5b5';
			} else if (item.status == '2') {
				//已删除
				headColor = '#fa8231';
			} else {
				if (item.isBallot == '0') {
					//未投票
					headColor = '#2d92ff';
				} else {
					//已投票
					headColor = '#fa8231';
				}
			}
		} else {
			//已结束
			headColor = '#b5b5b5';
		}

		return (
			<TouchableOpacity onPress={() => {
				HandlerOnceTap(
					() => {
						this.props.navigation.navigate('VoteDetail', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
							voteId: item.id,//投票id
							affiliation: this.state.affiliation//角色
						});
					}
				)
			}}>
				<View style={styles.itemTop}>
					<View style={[styles.itemHead, {backgroundColor: headColor}]}>
						<Image source={require('../../images/icon_vote.png')} style={{width: 30, height: 27}}/>
					</View>
					<View style={styles.itemMiddleText}>
						<Text style={{fontSize: 16}} numberOfLines={1}>{item.title}</Text>
						<Text style={{fontSize: 12}}>{`${item.nickName}发起`}</Text>
					</View>
					<View style={styles.itemRight}>
						<Text style={{fontSize: 12, color: '#b5b5b5', marginBottom: 8}}>{item.createTime}</Text>
						{ToolUtil.strToStemp(item.endTime) >= new Date().getTime() ? (
							item.status == '1' ? (
								<Text style={{color: '#b5b5b5', fontSize: 13}}>{'已停止'}</Text>
							) : (
								item.status == '2' ? (
									<Text style={{color: '#b5b5b5', fontSize: 13}}>{'已删除'}</Text>
								) : (
									item.isBallot == '0' ? (
										<View style={styles.itemBtn}>
											<Text style={{color: '#FFFFFF', fontSize: 13}}>{'未投票'}</Text>
										</View>
									) : (
										<Text style={{color: '#fa8231', fontSize: 13}}>{'已投票'}</Text>
									)
								)
							)
						) : (
							<Text style={{color: '#b5b5b5', fontSize: 13}}>{'已结束'}</Text>
						)}
					</View>
				</View>
			</TouchableOpacity>
		)
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
								this.fetchVote(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if (this.state.dataSource.length > 0) {
				footView = (
					<View style={styles.footer}>
						<Text>{'没有更多数据了'}</Text>
					</View>
				)
			}
		}
		return footView;
	}

	render() {
		//this.props.navigation.state.params.affiliation
		return (
			<View style={styles.container}>
				<Header
					headLeftFlag={true}
					headRightFlag={true}
					onPressBackBtn={() => {
						this.props.navigation.goBack();
					}}
					backTitle={'返回'}
					title={'投票列表'}
					onPressRightBtn={() => {
						this.props.navigation.navigate('VotePublish', {
							ticket: this.state.ticket,
							uuid: this.state.uuid,
							room: this.state.room,
							basic: this.state.basic,
						});
					}}
					rightItemImage={require('../../images/icon_vote.png')}
					rightTextStyle={{fontSize: 16, color: '#FFFFFF'}}
				/>
				<View style={{flex: 1, paddingLeft: 8, paddingRight: 8}}>
					<FlatList
						keyExtractor={(item, index) => String(index)}
						data={this.state.dataSource}
						renderItem={this._renderListItem}
						ItemSeparatorComponent={() => <View style={styles.separator}></View>}
						ListEmptyComponent={() => <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
							<Text style={{fontSize: 16, color: '#999'}}>暂无数据</Text>
						</View>}
						refreshing={false}
						onRefresh={() => {
							this.fetchVote(1)
						}}
						/*onEndReachedThreshold={0.1}
						onEndReached={(info)=>{this._onEndReached(info)}}*/
						ListFooterComponent={() => this._renderFooter()}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
					/>
				</View>
			</View>
		)
	}
}

export default Vote;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0f0f0',
	},
	bottomSeparator: {
		height: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#dfdfdf'
	},
	flex1: {flex: 1},
	itemTop: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 8,
		paddingBottom: 8
	},
	itemHead: {
		width: 40,
		height: 40,
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center'
	},
	separator: {
		height: 1,
		backgroundColor: '#dfdfdf'
	},
	itemMiddleText: {flex: 1, paddingLeft: 8},
	itemRight: {justifyContent: 'center', alignItems: 'flex-end'},
	itemBtn: {backgroundColor: '#2d92ff', borderRadius: 2, justifyContent: 'center', alignItems: 'center', width: 46},
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