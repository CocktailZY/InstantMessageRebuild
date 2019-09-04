import React, {Component} from 'react';
import {
	View, Text, Animated,
	Platform,
	TouchableOpacity, Image
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';
import Path from "../../config/UrlConfig";
import HandlerOnceTap from '../../util/HandlerOnceTap';

export default class TreeView extends Component {

	constructor(props) {
		super(props);
		this.state = {
			collapsed: {},
			toggleClickNum: 0,
			ticket: props.ticket,
			uuid: props.uuid,
			basic: props.basic
		}
	}

	_toggleState(type, i, node) {
		const {collapsed} = this.state;
		const {onItemClicked} = this.props;
		if (node.hasOwnProperty('data')) {
			collapsed[node.id] = !collapsed[node.id];
		}
		this.setState({
			collapsed: collapsed,
		});
		if (type == 'root') {
			this.setState({
				toggleClickNum: i
			});
		}
		if (onItemClicked)
			onItemClicked(type, i, node);
		if (node.type == 'user') {
			this.props.mynavigate.navigate('FriendDetail', {
				ticket: this.state.ticket,
				uuid: this.state.uuid,
				// friendUserId: node.id,
				friendJidNode: node.jidNode,
				tigRosterStatus: 'both',
				basic: this.state.basic
			});
		}
	}

	_getStyle(type, tag) {
		return [styles[tag], styles[type + tag]]
	}

	_getNodeView(type, i, node) {
		const {collapsed} = this.state;
		const iconSize = type == 'root' ? 25 : 23;
		const hasChildren = !!node.data.length;
		const icon = node.icon ? node.icon : (collapsed[node.id] ? 'keyboard-arrow-down' : 'chevron-right');
		const n = type == 'root' ? i : this.state.toggleClickNum,
			num = (Math.floor((n / 5) * 10) % 10) / 2;
		return (
			<View style={[styles.flexRow, this._getStyle(type, 'item')]}>
				{/*<View style={[styles.tipsText, styles[`bgColor${num}`]]}>
                    <Text style={{color: '#fff'}}>{node.text.replace(/(^\s*)|(\s*$)/g, "").substr(0, 1)}</Text>
                </View>*/}
				<View style={styles.tipsText}>
					<Image
						source={{
							// uri: Path.headImg + '?fileName=' + node.photoId + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket
							uri: Path.headImgNew + '?imageName=&imageId=&sourceType=singleImage&jidNode=' + node.jidNode + '&userId=' + this.state.basic.userId + '&uuId=' + this.state.uuid + '&ticket=' + this.state.ticket
						}}
						style={{
							width: 36,
							height: 36
						}}/>
				</View>
				<View style={[{
					flexDirection: 'row',
					alignItems: 'center',
					flex: 1,
					height: 44,
				}, type == 'root' ? {
					borderBottomColor: '#cccccc',
					borderBottomWidth: .5,
				} : null]}>
					<Text style={[this._getStyle(type, 'text'), {flex: 1,}]}> {node.text} <Text
						style={styles.lenText}>{!node.data.length ? null : `(${node.data.length})`}</Text> </Text>
					{
						!hasChildren && !node.icon ? null :
							<Icon style={[styles.iconRight, this._getStyle(type, 'icon')]} size={iconSize} name={icon}/>
					}
				</View>
			</View>
		)
	}

	_getNode(type, i, node) {
		const {collapsed} = this.state;
		const {renderItem} = this.props;
		const hasChildren = !!node.data;
		return (
			<View key={i} style={this._getStyle(type, 'node')}>
				<TouchableOpacity

					onPress={() => {
						this._toggleState.bind(this)(type, i, node)
					}}>

					{renderItem ? renderItem(type, i, node) : this._getNodeView(type, i, node)}
				</TouchableOpacity>
				{this.props.isSearch ? (<View style={styles.children}>
					{
						collapsed[node.id] ? null : this.getTree('children', node.data || [])
					}
				</View>) : (<View style={styles.children}>
					{
						!collapsed[node.id] ? null : this.getTree('children', node.data || [])
					}
				</View>)}
			</View>
		)
	}

	getTree(type, data) {
		const nodes = [];
		if (data == null) {
			nodes.push(<View key={new Date().getTime()} style={{flex: 1, alignItems: 'center', paddingTop: 30}}><Text
				style={{color: '#e2e2e2', fontSize: 18}}>{'温馨提示'}</Text><Text
				style={{color: '#e2e2e2', marginTop: 5}}>{'首次加载时间较长，请耐心等待或稍后查看'}</Text></View>)
		} else if (data && data.length > 0) {
			for (let i = 0; i < data.length; i++) {
				nodes.push(this._getNode(type, i, data[i]))
			}
		} else if (data === "") {
			nodes.push(<View key={new Date().getTime()} style={{flex: 1, alignItems: 'center', paddingTop: 30}}><Text
				style={{color: '#e2e2e2'}}>{'没有查到相关人员信息'}</Text></View>)
		}
		return nodes
	}

	render() {
		const {data} = this.props;
		//console.log('树组件里：' + data);
		return (
			<View style={styles.tree}>
				{this.getTree('root', data)}
			</View>
		)
	}
}

const styles = {
	tree: {},
	rootnode: {
		/*paddingBottom: 10,*/
	},
	node: {
		/*paddingTop: 10,*/
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		// height: 50,
	},
	children: {
		paddingLeft: 25
	},
	icon: {
		paddingRight: 5,
		// color: '#FFFFF',
		alignSelf: 'center'
	},
	roottext: {
		fontSize: 15,
		color: '#333'
	},
	flexRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	tipsText: {
		// borderRadius: Platform.OS == 'android' ? 22 : 11,
		borderRadius: 4,
		width: 36,//22,
		height: 36,//22,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
		// marginLeft: 10,
		overflow: 'hidden',
	},
	bgColor0: {
		backgroundColor: '#f7aa00',
	},
	bgColor1: {
		backgroundColor: '#f2644b',
	},
	bgColor2: {
		backgroundColor: '#f4a900',
	},
	bgColor3: {
		backgroundColor: '#00ce94',
	},
	bgColor4: {
		backgroundColor: '#4da9fb',
	},
	lenText: {
		marginLeft: 13,
		fontSize: 12,
		color: '#999'
	}
};