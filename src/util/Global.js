export default Global = {
	loginResource:'',//XMPP登录资源
	basicParam: {
		ticket: '',
		uuId: '',
		userId: ''
	},//基础参数
	parseBasicParam:'',//拼接后的基础参数
	loginUserInfo:{},//登录人信息
	personnel_photoId: {},
	chat_detail: {},
	netWorkStatus_old: false,//历史网络状态
	netWorkStatus_new: false,//当前网络状态
	updateFlag: null,//更新单聊未读条数标记
	headPhotoNum:null,
	groupMute:{},//群组是否禁言列表
	iosXmppIsConnect:true,//iosXmpp连接状态
    isReconnectXMPP:false,//AndroidXMPP是否需要触发重新连接标记
	timeT : 0, //本地时间与服务器时间差 毫秒
	pushToken: '', //推送token
	groupDisable:{},//群组禁用列表
}