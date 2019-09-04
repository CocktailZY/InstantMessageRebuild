/*
* header props type
* headLeftFlag: boolean => 左侧按钮是否显示 默认false
* onPressBackBtn: fun => 左侧按钮function
* backTitleStyle: style => 左侧按钮自定义样式
* backTitle: string => 左侧按钮显示的文字
*	headRightFlag: boolean => 右侧按钮是否显示 默认false
*	onPressRightBtn: fun => 右侧按钮function
*	isText: boolean => 右侧按钮是否显示文字 默认false
*	rightTextStyle: style => 右侧按钮自定义样式
*	rightText: string => 右侧按钮显示文字
*	rightItemImage: image url => 右侧按钮显示图片
*	title: string => header标题内容
*	titleStyle: style => header标题自定义样式
*	number: number => header标题显示的右侧数字
* */
import React, {Component} from 'react';
import {
	StyleSheet, Text, Platform, View, TouchableWithoutFeedback, Dimensions, Image, TouchableOpacity
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icons from 'react-native-vector-icons/Ionicons';
import HandlerOnceTap from '../../util/HandlerOnceTap';

let ScreenWidth = Dimensions.get('window').width;

export default class Header extends Component {
	constructor(props) {
		super(props);
		this.state = {
			headLeftFlag: !props.headLeftFlag ? false : props.headLeftFlag,
			headRightFlag: !props.headRightFlag ? false : props.headRightFlag,
			isText: !props.isText ? false : props.isText,
			title: props.title ? props.title : ''
		}
	}
	_changeHeadLeftFlag = (flag) => {
		this.setState({
			headLeftFlag: flag
		})
	}
    _changeHeadRightFlag = (flag) => {
        this.setState({
            headRightFlag: flag
        })
    }
	_changeHeaderTitle = (newName) => {
		this.setState({
			title: newName
		})
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={[styles.itemWidth, {justifyContent: 'flex-start', paddingLeft: 8}]}>
					{
						this.state.headLeftFlag ? <TouchableOpacity
							activeOpacity={1}
							style={styles.btnContent}
							onPress={this.props.onPressBackBtn}>
							<View style={{marginTop: Platform.OS == 'ios' ? 3 : 0}}>
								<Icons name={'ios-arrow-back'} size={30} color={'#FFFFFF'}/>
							</View>
							<Text
								style={[styles.headerBtn, {marginLeft: 5}, this.props.backTitleStyle]}>{Platform.OS == 'ios' ? '' : this.props.backTitle}</Text>
						</TouchableOpacity> : null
					}
				</View>
				<View style={styles.title}>
					<Text style={[styles.titleFont, this.props.titleStyle]} numberOfLines={1}>{this.state.title}</Text>
					<Text style={styles.titleFont}>{this.props.number ? '(' + this.props.number + ')' : ''}</Text>
				</View>
				<View style={[styles.itemWidth, {alignItems: 'flex-end', paddingRight: 8}]}>
					{
						this.state.headRightFlag ? <TouchableOpacity
							activeOpacity={1}
							style={styles.btnContent}
							onPress={this.props.onPressRightBtn}>
							{
								this.state.isText ? (
									<Text style={[{
										color: '#FFF',
										fontSize: 16,
									}, this.props.rightTextStyle]}>{this.props.rightText}</Text>
								) : (
									<Image source={this.props.rightItemImage} style={{width: 25, height: 25}}/>
								)
							}
						</TouchableOpacity> : null
					}
				</View>
			</View>

		)
	}
}
const HEIGHT = Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 88 : 60) : 40;
const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		// backgroundColor: 'rgba(84,157,255,1)',
		backgroundColor: '#549dff',
		height: HEIGHT,
		paddingTop: Platform.OS == 'ios' ? (DeviceInfo.getModel() == 'iPhone X' ? 44 : 20) : 0
	},
	title: {
		flex: 1,
		height: 40,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleFont: {
		color: '#FFF',
		fontSize: 18,
		fontWeight: '500',
	},
	itemWidth: {
		width: 80,
		height: 40,
		justifyContent: 'center',
	},
	headerBtn: {
		flex: 1,
		alignItems: 'center',
		color: '#FFF',
		fontSize: 16,
		fontWeight: '200',
	},
	btnContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	}
});