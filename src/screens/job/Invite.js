/*
 * 工作邀请列表页
 * */
import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  DeviceEventEmitter
} from "react-native";
import Header from "../../component/common/Header";
import FetchUtil from "../../util/FetchUtil";
import Path from "../../config/UrlConfig";
import ParamsDealUtil from "../../util/ParamsDealUtil";
import HandlerOnceTap from "../../util/HandlerOnceTap";

const LISTHEIGHT = 40;
const COLOR = [
  "#16a085",
  "#27ae60",
  "#2980b9",
  "#f1c40f",
  "#e67e22",
  "#e74c3c"
];
export default class Invite extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uuid: props.navigation.state.params.uuid,
      basic: props.navigation.state.params.basic,
      ticket: props.navigation.state.params.ticket,
      inviteData: [],
      showFoot: 0,
      pageGo: 1, //当前页数
      totalPage: 0, //总页数
			footLoading: false,//底部是否正在刷新
    };
  }

  componentDidMount() {
    this._getInviteList(this.state.pageGo);
    this._inviteAddPage = DeviceEventEmitter.addListener(
      "inviteAddPage",
      params => {
        this._getInviteList(this.state.pageGo);
      }
    );
  }

  componentWillUnmount() {
    this._inviteAddPage.remove();
  }

  //获取工作列表
  _getInviteList = pageNum => {
    let params = {
      ticket: this.state.ticket,
      uuId: this.state.uuid,
      userId: this.state.basic.userId,
      pageNum: pageNum,
      pageSize: Path.pageSize,
      order: 0,
      name: null,
      jidNode: this.state.basic.jidNode
    };
    FetchUtil.netUtil(
      Path.getInvite + ParamsDealUtil.toGetParams(params),
      {},
      "GET",
      this.props.navigation,
      "",
      data => {
        if (data.code.toString() == "200") {
          this.setState({
            inviteData: pageNum == 1 ? data.data.page.recordList : this.state.inviteData.concat(data.data.page.recordList),
            pageGo: data.data.page.currentPage,
            totalPage: data.data.page.totalPage,
						footLoading: false
          },()=>{
						DeviceEventEmitter.emit('getNoticeNum');//重新查询通知+工作邀请数量
					});
        }
      }
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <Header
          headLeftFlag={true}
          headRightFlag={true}
          onPressBackBtn={() => {
            this.props.navigation.goBack();
          }}
          backTitle={"返回"}
          title={"工作列表"}
          onPressRightBtn={() => {
            this.props.navigation.navigate("InvitePublish", {
              ticket: this.state.ticket,
              uuid: this.state.uuid,
              basic: this.state.basic
            });
          }}
          rightItemImage={require("../../images/add-member.png")}
        />
          <FlatList
            data={this.state.inviteData}
            renderItem={this._inviteRenderItem}
            keyExtractor={(item, index) => String(index)}
            refreshing={false}
            onRefresh={this._getInviteList.bind(this, 1)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            // onEndReachedThreshold={0.1}
            // onEndReached={(info)=>{this._onEndReached(info)}}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            ListFooterComponent={this._renderFooter.bind(this)}
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
          />
      </View>
    );
  }

  _inviteRenderItem = ({ item, index }) => {
		let headColor = '';
		if(new Date(item.endTime.replace(/-/g, "/")).getTime() - new Date().getTime() <= 0){
			//已过期
			headColor = '#a4b0be';
		}else {
			//未过期，正常态
			if (item.complete == "1") {
				//已完成
				headColor = '#e67e22';
			}else{
				//执行中
				headColor = '#16a085';
				if (item.invitation == "2") {
					//已拒绝
					headColor = '#e74c3c';
				}
				if (item.invitation == "0") {
					//待接收
					headColor = '#3498db';
				}
			}
		}
    return (
      <TouchableOpacity
        key={index}
        style={styles.inviteList}
        onPress={() => {
          HandlerOnceTap(() => {
            this.props.navigation.navigate("InviteDetails", {
              ticket: this.state.ticket,
              uuid: this.state.uuid,
              basic: this.state.basic,
              inviteID: item.id
            });
          });
        }}
      >

      <View>
        <View
          style={[
            styles.inviteImg,
            { backgroundColor: headColor }
          ]}
        >
          <Image
            source={require("../../images/invite/icon_invite.png")}
            style={{ width: LISTHEIGHT / 1.6, height: LISTHEIGHT / 1.6 }}
          />
        </View>


        {item.invitation == "1" &&item.replyNum != 0?

                <View style={{
                    backgroundColor: 'red',
                    width: 18,
                    height: 18,
                    borderRadius: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    left:30,
                    top:-3,

                    }}>
                    <Text style={{color: '#FFFFFF', fontSize: 10}}>{
                            item.replyNum >99 ? "99+" : item.replyNum
                        }
                    </Text>
                </View>
        :null}



      </View>

        <View style={styles.inviteInfor}>
          <Text style={{ fontSize: 16, color: "#333", marginBottom: 3 }}>
            {item.title.length > 10
              ? item.title.substring(0, 9) + "..."
              : item.title}
          </Text>
          <Text style={{ fontSize: 12 }}>
            <Text style={{ color: "#4b4b4b" }}>{item.nickName} 发起于 </Text>
            <Text style={{ color: "#3498db" }}>{item.createTime}</Text>
          </Text>
        </View>

        <Text
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            padding: 2,
            paddingLeft: 8,
            paddingRight: 8,
            backgroundColor:
              new Date(item.endTime.replace(/-/g, "/")).getTime() -
                new Date().getTime() <=
              0
                ? "#a4b0be"
                : item.complete == "1"
                ? "#e67e22"
                : item.invitation == "2"
                ? "#e74c3c"
                : item.invitation == "0"
                ? "#3498db"
                : "#16a085",
            color: "#fff",
            fontSize: 12
          }}
        >
          {new Date(item.endTime.replace(/-/g, "/")).getTime() -
            new Date().getTime() <=
          0
            ? "已过期"
            : item.complete == "1"
            ? "已完成"
            : item.invitation == "2"
            ? "已拒绝"
            : item.invitation == "0"
            ? "待接收"
            : "执行中"}
        </Text>
      </TouchableOpacity>
    );
  };

  _renderFooter() {
		let footView = null;
		if (this.state.pageGo < this.state.totalPage) {
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
							let tempNowPage = this.state.pageGo + 1;
							this.setState({footLoading: true}, () => {
								//获取数据
								this._getInviteList(tempNowPage);
							});
						}}
					>
						<Text>{'点击加载更多数据'}</Text>
					</TouchableOpacity>
				)
			}
		} else {
			if(this.state.inviteData.length > 0){
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
    backgroundColor: "#f0f0f0"
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc"
  },
  footer: {
    flexDirection: "row",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
  },
  footerText: {
    fontSize: 14,
    color: "#999"
  },
  inviteList: {
    flexDirection: "row",
		justifyContent: "center",
		paddingLeft: 10,
    paddingTop: 8,
    paddingBottom: 8,
    position: "relative"
  },
  inviteImg: {
    width: LISTHEIGHT,
    height: LISTHEIGHT,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  inviteInfor: {
    flex: 1,
    height: LISTHEIGHT,
    justifyContent: "center"
  }
});
