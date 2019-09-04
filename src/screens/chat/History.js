import React, {Component} from 'react';
import {
    StyleSheet, Text, View, Platform, TextInput,
    TouchableOpacity, Dimensions, Image
} from 'react-native';
import Header from '../../component/common/Header';
import GridView from 'react-native-super-grid';
import DeviceInfo from 'react-native-device-info';
import Icons from 'react-native-vector-icons/Ionicons';
import HandlerOnceTap from '../../util/HandlerOnceTap';

const {height, width} = Dimensions.get('window');
const historyList = [
    {url: require('../../images/history/icon_img.png'), text: '图片', type: 'img'},
    {url: require('../../images/history/icon_file.png'), text: '文件', type: 'file'},
    {url: require('../../images/history/icon_date.png'), text: '日期', type: 'date'}
];
export default class History extends Component {
    constructor(props) {
        super(props);
        this.state = {
            room: !props.navigation.state.params.room ? null : props.navigation.state.params.room,
            ticket: props.navigation.state.params.ticket,
            uuid: props.navigation.state.params.uuid,
            basic: props.navigation.state.params.basic,
						friendDetail : !props.navigation.state.params.friendDetail ? null : props.navigation.state.params.friendDetail,
            friendJidNode: !props.navigation.state.params.friendJidNode ? null : props.navigation.state.params.friendJidNode,
        }
    };

    _listItem = (data, i) => {
        const historyGo = () => {
            if (data.type == 'img') {
                return 'HistoryImages';
            } else if (data.type == 'file') {
                return 'HistoryFiles';
            } else if (data.type == 'date') {
                return 'HistoryDate';
            }
        }
        return <TouchableOpacity key={i} style={styles.itemBox} onPress={()=>{HandlerOnceTap(
            () => {
                this.props.navigation.navigate(historyGo(), {
                    ticket: this.state.ticket,
                    basic: this.state.basic,
                    room: this.state.room,
                    uuid: this.state.uuid,
										friendDetail: this.state.friendDetail,
                    friendJidNode: this.state.friendJidNode
                })
            }
        )}}>
            <Image source={data.url} style={styles.itemIcon}/>
            <Text style={styles.itemText}>{data.text}</Text>
        </TouchableOpacity>
    }

    render() {
        return (
            <View style={styles.container}>
                <Header
                    headLeftFlag={true}
                    onPressBackBtn={() => {
                        this.props.navigation.goBack();
                    }}
                    backTitle={'返回'}
                    title={'聊天内容'}
                />
                <View style={{backgroundColor: '#f0f0f0', height: 48}}>
									{Platform.OS == 'ios' ? (<TouchableOpacity style={{
										flex: 1,
										flexDirection: 'row',
										margin: 8,
										backgroundColor: '#FFFFFF',
										borderWidth: 1,
										borderRadius: 6,
										borderColor: '#CCCCCC'
									}} onPress={()=>{HandlerOnceTap(
										() => {
											this.props.navigation.navigate('HistorySearch', {
												ticket: this.state.ticket,
												basic: this.state.basic,
												room: this.state.room,
												uuid: this.state.uuid,
												friendDetail: this.state.friendDetail,
												friendJidNode: this.state.friendJidNode
											});
										}
									)}}>

                      <View style={{
												flex: 1,
												height: 30,
												flexDirection: 'row',
												backgroundColor: '#FFFFFF',
												borderColor: 'transparent',
												borderWidth: 1,
												alignItems: 'center',
												justifyContent: 'center',
												borderRadius: 6,
												paddingTop: 0,
												paddingBottom: 0,

											}}>
                          <Text style={{color: '#CCCCCC', fontSize: 15, lineHeight: 30, paddingRight: 10}}>{'搜索'}</Text>
                          <Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
                      </View>
                  </TouchableOpacity>) : (<TouchableOpacity style={{
										flex: 1,
										flexDirection: 'row',
										margin: 8,
										backgroundColor: '#FFFFFF',
										borderWidth: 1,
										borderRadius: 6,
										borderColor: '#CCCCCC'
									}} onPress={()=>{HandlerOnceTap(
										() => {
											this.props.navigation.navigate('HistorySearch', {
												ticket: this.state.ticket,
												basic: this.state.basic,
												room: this.state.room,
												uuid: this.state.uuid,
												friendDetail: this.state.friendDetail,
												friendJidNode: this.state.friendJidNode
											});
										}
									)}}>
                      <TextInput
                        style={{
													flex: 1,
													height: 30,
													backgroundColor: '#FFFFFF',
													borderColor: 'transparent',
													borderWidth: 1,
													borderRadius: 6,
													paddingTop: 0,
													paddingBottom: 0,
													paddingLeft: 8,
													paddingRight: 8
												}}
                        placeholderTextColor={'#CCCCCC'}
                        placeholder={'搜索...'}
                        underlineColorAndroid={'transparent'}
                        editable={false}
                      />
                      <View style={{width: 25, height: 30, justifyContent: 'center'}}>
                          <Icons name={'ios-search-outline'} size={25} color={'#CCCCCC'}/>
                      </View>
                  </TouchableOpacity>)}

                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.historyTitle}>按以下条件查找</Text>
                    <GridView
                        style={styles.item}
                        itemDimension={(width - 64) / 3}
                        items={historyList}
                        renderItem={this._listItem}
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
        backgroundColor: '#F0F0F0',//f0f0f0
    },
    historyTitle: {
        fontSize: 14,
        color: '#777',
        backgroundColor: '#d7d7d7',
        lineHeight: 32,
        paddingLeft: 10,
    },
    item: {
        flex: 1,
	    backgroundColor: '#FFFFFF',//f0f0f0
    },
    itemBox: {
        flex: 1,
        alignItems: 'center'
    },
    itemIcon: {
        width: 40,
        height: 40,
        marginBottom: 10,
        marginTop: 30,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
    }
});