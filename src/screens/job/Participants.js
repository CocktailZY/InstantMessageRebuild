import React, {Component} from 'react';
import {
    StyleSheet, Text, View, FlatList, TextInput,
    TouchableOpacity, Alert,
    ActivityIndicator
} from 'react-native';
import Header from '../../component/common/Header';
import DeviceInfo from 'react-native-device-info';
import FetchUtil from '../../util/FetchUtil';
import Path from "../../config/UrlConfig";
import Icons from 'react-native-vector-icons/Ionicons';
import ParamsDealUtil from '../../util/ParamsDealUtil';
import HandlerOnceTap from '../../util/HandlerOnceTap';
import Toast, {DURATION} from 'react-native-easy-toast';
const ITEMHEIGHT = 48;
let pageGo = 1, totalPage = 0;
export default class Participants extends Component {
    constructor(props) {
        super(props);
        this.state = {
            peopleArrey: [],//人员列表
            peopleShowArrey: [],//静态分页人员显示列表
            selectedArr: props.infor.selectedParticipants,//选择列表
            searchVal: '',
            showFoot: 0,
            endStop: false,
        }
    }

    componentDidMount() {
        let params = {
            userId: this.props.infor.basic.userId,
            uuId: this.props.infor.uuid,
            ticket: this.props.infor.ticket,
            realId: this.props.infor.basic.jidNode,
            trueNameLike: null
        }
        FetchUtil.netUtil(Path.getUserList + ParamsDealUtil.toGetParams(params), {}, 'GET', this.props.navigation, '', (data) => {
            if(data =="tip"){
                // this._toast('设置完成失败！');
                this.refs.toast.show('获取联系人失败！', DURATION.LENGTH_SHORT);
            }else if (data.code.toString() == '200') {
                totalPage = Math.ceil(data.data.user.length / 10);
                this.setState({
                    peopleArrey: data.data.user
                }, () => {
                    this.peopleShow(pageGo);
                });
            }
        });
    };

    peopleShow = (pageNum) => {
        let temp_arr = this.state.peopleArrey,
            arr = [],
            num = 0;
        for (let i = 0; i < (pageNum * 10); i++) {
            if (!!temp_arr[i]) {
                arr.push(temp_arr[i]);
            }
        }
        if (pageNum >= totalPage) {
            num = 1;
        }
        this.setState({
            peopleShowArrey: arr,
            showFoot: num,
        });
    }

    _renderItemPeople = ({item, index}) => {
        return <TouchableOpacity key={index} style={styles.peopleList} onPress={() => {
            let arr = this.state.selectedArr;
            for (let i in arr) {
                if (arr[i].jidNode == item.jidNode) {
                    Alert.alert(
                        '提示',
                        '无法选择已选中人员',
                        [{text: '确定'}]
                    )
                    return false;
                }
            }
            arr.push(item);
            this.setState({
                selectedArr: arr
            });
        }}>
            <Text style={styles.peopleText}>{item.trueName}（{item.branchName}）</Text>
        </TouchableOpacity>
    }

    _searchPeople = () => {
        let body = this.state.peopleArrey,
            searchVal = this.state.searchVal,
            arr = [];
        pageGo = 1;
        if (searchVal != '') {
            for (let i in body) {
                if (body[i].trueName.indexOf(searchVal) != -1) {
                    arr.push(body[i])
                } else {
                    if (body[i].branchName.indexOf(searchVal) != -1) {
                        arr.push(body[i])
                    }
                }
            }
            this.setState({
                peopleShowArrey: arr,
                showFoot: 0,
                endStop: true
            });
        } else {
            this.setState({
                endStop: false
            }, () => {
                this.peopleShow(pageGo);
            });
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <Toast ref="toast" opacity={0.6} fadeOutDuration={1500}/>
                <Header
                    headLeftFlag={true}
                    onPressBackBtn={this.props.cancelParticipants}
                    backTitle={'返回'}
                    title={'请选择参与人员'}
                />
                <View style={{flexDirection: 'row', padding: 5, paddingLeft: 15, paddingRight: 15}}>
                    <TextInput
                        style={{
                            flex: 1,
                            padding: 3,
                            borderWidth: 1,
                            borderColor: '#d7d7d7',
                            borderRadius: 4,
                            paddingLeft: 8,
                            paddingRight: 8
                        }}
                        placeholder={'搜索...'}
                        underlineColorAndroid={'transparent'}
                        value={this.state.searchVal}
                        returnKeyType={'search'}
                        onSubmitEditing={this._searchPeople}
                        onChangeText={(text) => {
                            this.setState({searchVal: text});
                        }}/>
                    <TouchableOpacity style={{
                        backgroundColor: '#3d66ff',
                        paddingLeft: 8,
                        paddingRight: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                        borderRadius: 4
                    }} onPress={()=>{HandlerOnceTap(this._searchPeople)}}>
                        <Text style={{fontSize: 14, color: 'white'}}>搜索</Text>
                    </TouchableOpacity>
                </View>
                <View style={{
                    borderColor: '#d7d7d7',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    paddingLeft: 10,
                    paddingRight: 10,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                }}>
                    {
                        this.state.selectedArr.map((item, index) => {
                            return <View key={index} style={{
                                backgroundColor: '#666',
                                borderRadius: 4,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                margin: 5,
                                padding: 4,
                            }}>
                                <Text style={{fontSize: 12, color: 'white', marginRight: 3}}>{item.trueName}</Text>
                                <TouchableOpacity onPress={() => {
                                    let arr = this.state.selectedArr;
                                    arr.splice(index, 1);
                                    this.setState({
                                        selectedArr: arr
                                    });
                                }}>
                                    <Icons name={'ios-close'} size={20} color={'#000'}/>
                                </TouchableOpacity>
                            </View>
                        })
                    }
                </View>
                <View style={{flex: 1}}>
                    <FlatList
                        keyExtractor={(item, index) => String(index)}
                        data={this.state.peopleShowArrey}
                        renderItem={this._renderItemPeople}
                        ItemSeparatorComponent={() => <View style={styles.separator}/>}
                        ListEmptyComponent={() => <View style={{
                            height: 100,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}><ActivityIndicator/></View>}
                        onEndReachedThreshold={0.1}
                        onEndReached={this._onEndReached}
                        ListFooterComponent={this._renderFooter.bind(this)}
                    />
                </View>
                <TouchableOpacity style={styles.getPeople}
                                  onPress={() => this.props.selectedParticipants(this.state.selectedArr)}>
                    <Text style={{fontSize: 16, color: 'white'}}>确定</Text>
                </TouchableOpacity>
            </View>
        )
    }

    _onEndReached = (info) => {
        if (this.state.showFoot != 0) {
            return;
        }
        if (pageGo >= totalPage) {
            return;
        } else {
            pageGo++;
        }
        if (!this.state.endStop) {
            this.setState({showFoot: 2});
            //获取数据
            this.peopleShow(pageGo);
        }
    }

    _renderFooter() {
        if (this.state.showFoot == 0) {
            return <View></View>
        } else if (this.state.showFoot == 1) {
            return <View style={styles.footer}>
                <Text style={styles.footerText}>没有更多数据了</Text>
            </View>
        } else if (this.state.showFoot == 2) {
            return <View style={styles.footer}>
                <ActivityIndicator/>
                <Text style={styles.footerText}>正在加载更多数据...</Text>
            </View>
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginLeft: 15,
        marginRight: 15
    },
    peopleList: {
        height: ITEMHEIGHT,
        justifyContent: 'center',
        marginLeft: 15,
        marginRight: 15
    },
    peopleText: {
        fontSize: 14,
        color: '#333',
    },
    getPeople: {
        padding: 15,
        backgroundColor: '#3d66ff',
        justifyContent: 'center',
        alignItems: 'center'
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