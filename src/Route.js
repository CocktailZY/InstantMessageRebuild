import React from 'react';
import {createStackNavigator, createAppContainer} from 'react-navigation';
import {DeviceEventEmitter} from 'react-native';
import Login from './Login';//登录
import Foot from './Foot';//底部Tab导航
import Chat from './screens/chat/Chat';//聊天界面
import Address from './screens/friend/Address';//一级通讯录
import AddressSec from './screens/friend/AddressSec';//二级通讯录
import AddressSearch from './screens/friend/AddressSearch';//二级通讯录
import AddressLast from './screens/friend/AddressLast';//三级通讯录树
import GroupDetail from './screens/group/GroupDetail';//群详情
import GroupMember from './screens/group/GroupMember';//群成员
import GroupJoin from './screens/group/GroupJoin';//加入群
import FriendDetail from './screens/friend/FriendDetail';//好友详情
import FriendCreate from './screens/friend/FriendCreate';//新朋友
import FriendSearch from './screens/friend/FriendSearch';//搜索好友
import Welcome from "./Welcome";//欢迎页
import GroupCreate from './screens/group/GroupCreate';//创建群
import GroupAudit from './screens/group/GroupAudit';//群审核人员
import GroupCheck from './screens/message/GroupCheck';//消息页面群审核人员
import GroupNotice from "./screens/group/GroupNotice";//群公告
import History from './screens/chat/History';//聊天记录
import HistoryImages from './screens/chat/HistoryImages';//图片记录
import HistoryFiles from './screens/chat/HistoryFiles';//文件记录
import HistoryDate from './screens/chat/HistoryDate';//日期选择
import HistoryDateAll from './screens/chat/HistoryDateAll';//日期记录
import HistorySearch from './screens/chat/HistorySearch';//记录关键字搜索
import GroupAnnouncement from "./screens/group/GroupAnnouncement";//发布群公告
import Activity from './screens/group/Activity';//群活动
import ActivityDetails from './screens/group/ActivityDetails';//群活动详情
import ActivityPublish from './screens/group/ActivityPublish';//发布群活动
import ActivityHeadList from './screens/group/ActivityHeadList';//群活动成员列表
import Vote from './screens/group/Vote';//群投票
import VoteDetail from './screens/group/VoteDetail';//群投票详情
import VotePublish from './screens/group/VotePublish';//发布群投票
import DeviceLock from './screens/setting/DeviceLock';//设备锁
import HandLock from './screens/setting/HandLock';//手势锁
import Audit from './Audit';//审核绑定
import Job from './screens/job/Job';//工作台
import Invite from './screens/job/Invite';//工作列表
import InviteDetails from './screens/job/InviteDetails';//工作邀请详情
import InviteSub from './screens/job/InviteSub';//工作邀请详情附件
import InvitePublish from './screens/job/InvitePublish';//工作邀请发布
import QRScanner from './screens/group/QRCode';//二维码扫描页面
import GroupChange from './screens/group/GroupChange';//群移交
import QRGenrator from './screens/group/QRCodeGenrator';//群二维码
import Topic from './screens/group/Topic';//群话题列表
import TopicDetail from './screens/group/TopicDetail';//群话题详情
import TopicPublish from './screens/group/TopicPublish';//群话题详情
import DiscussAttachList from './screens/job/DiscussAttachList';//工作邀请评论附件
import GroupName from './screens/group/GroupName';//修改群名称
import GroupJurisdiction from './screens/group/GroupJurisdiction';//修改群权限
import CheckPassword from './screens/setting/CheckPassword';//修改手势锁
import AboutOurs from './screens/setting/AboutOurs';//关于系统

const RootStack = createStackNavigator({
	Home: { screen: Welcome },
	Login: { screen: Login },
	Audit: { screen: Audit },
	Index: { screen: Foot },
	Chat: { screen: Chat },
	Address: { screen: Address },
	AddressSec: { screen: AddressSec },
	AddressSearch: { screen: AddressSearch },
	AddressLast: { screen: AddressLast },
	GroupDetail: { screen: GroupDetail },
	GroupCreate: { screen: GroupCreate },
	GroupAudit: { screen: GroupAudit },
	GroupCheck: { screen: GroupCheck },
	GroupMember: { screen: GroupMember },
	GroupJoin: { screen: GroupJoin },
	GroupJurisdiction: { screen: GroupJurisdiction },
	GroupNotice: { screen: GroupNotice },
	GroupAnnouncement: { screen: GroupAnnouncement },
	FriendDetail: { screen: FriendDetail },
	FriendCreate: { screen: FriendCreate },
	FriendSearch: { screen: FriendSearch },
	History: { screen: History },
	HistoryImages: { screen: HistoryImages },
	HistoryFiles: { screen: HistoryFiles },
	HistoryDate: { screen: HistoryDate },
	HistoryDateAll: { screen: HistoryDateAll },
	HistorySearch: { screen: HistorySearch },
	Activity: { screen: Activity },
	ActivityDetails: { screen: ActivityDetails },
	ActivityPublish: { screen: ActivityPublish },
	ActivityHeadList: { screen: ActivityHeadList },
	Vote: { screen: Vote },
	VoteDetail: { screen: VoteDetail },
	VotePublish: { screen: VotePublish },
	DeviceLock: { screen: DeviceLock },
	HandLock: { screen: HandLock },
	Job: { screen: Job },
	Invite: { screen: Invite },
	InviteDetails: { screen: InviteDetails },
	InviteSub: { screen: InviteSub },
	InvitePublish: { screen: InvitePublish },
	DiscussAttachList: { screen: DiscussAttachList },
	QRScanner: { screen: QRScanner	},
	QRGenrator: { screen: QRGenrator	},
	Topic: { screen: Topic },
	TopicDetail: { screen: TopicDetail },
	TopicPublish: { screen: TopicPublish },
	GroupName: { screen: GroupName },
	CheckPassword: { screen: CheckPassword },
	AboutOurs: { screen: AboutOurs },
	GroupChange: { screen: GroupChange },
}, {
	initialRouteName: 'Home', // 默认显示界面
	defaultNavigationOptions: {  // 屏幕导航的默认选项, 也可以在组件内用 static navigationOptions 设置(会覆盖此处的设置)
		// title:'消息',
		header: null,
		gesturesEnabled: false,

	},
	mode: 'card',  // 页面切换模式, 左右是card(相当于iOS中的push效果), 上下是modal(相当于iOS中的modal效果)
	headerMode: 'none', // 导航栏的显示模式, screen: 有渐变透明效果, float: 无透明效果, none: 隐藏导航栏
	onTransitionStart: (transitionProps,prevTransitionProps) => {

	},
	onTransitionEnd: (transitionProps,prevTransitionProps) => {
		DeviceEventEmitter.emit('changeRoute', transitionProps.navigation.state.routes[transitionProps.navigation.state.routes.length - 1]);
	}
});

export default createAppContainer(RootStack);
