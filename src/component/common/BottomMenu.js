import React, {Component} from 'react';
import {View,Text,Modal,TouchableOpacity,Platform} from 'react-native';
import HandlerOnceTap from '../../util/HandlerOnceTap';

export default class BottomMenu extends Component{
  constructor(props) {
    super(props);
    this.state = {
      isShow: false,
	    firShow: false,
	    secShow: false,
    }
  }
  _changeMenuShow = (isShow) => {
    this.setState({
      isShow: isShow
    })
  }
  _changeFirMenuShow = (isShow) => {
	  this.setState({
		  firShow: isShow
	  })
  }
	_changeSecMenuShow = (isShow) => {
		this.setState({
			secShow: isShow
		})
	}
  render(){
    return (
      <Modal
					visible={this.state.isShow}//
					//显示是的动画默认none
					//从下面向上滑动slide
					//慢慢显示fade
					animationType={'fade'}
					//是否透明默认是不透明 false
					transparent={true}
					//关闭时调用
					onRequestClose={() => {
						this.setState({isShow: false})
					}}
				>
					<View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)'}}>
						<TouchableOpacity style={{flex:3}} onPress={()=>{
							this.setState({isShow: false})
						}}>
						</TouchableOpacity>
						<View style={{flex:1,backgroundColor:'#FFFFFF'}}>
							<View style={{flex:1,paddingLeft:5,paddingRight:5,borderBottomColor:'#d4d4d4',borderBottomWidth:1,justifyContent:'center',alignItems:'center'}}>
								<Text style={{color:'#777777',fontSize:16}}>{this.props.menuTitle}</Text>
							</View>
							{this.state.firShow ? (
								<TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}} onPress={()=>{
									HandlerOnceTap(this.props.firstMenuFunc)
								}}>
									<Text style={{color:'#777777',fontSize:16}}>{this.props.firstTitle}</Text>
								</TouchableOpacity>
							) : null}
							{/* {this.state.secShow ? (
								<TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}} onPress={()=>{
									HandlerOnceTap(this.props.secondMenuFunc)
								}}>
									<Text style={{color:'#777777',fontSize:16}}>{this.props.secondTitle}</Text>
								</TouchableOpacity>
							) : null} */}
							{Platform.OS == 'android' ? (
								<TouchableOpacity style={{flex:1,justifyContent:'center',alignItems:'center'}} onPress={()=>{
								HandlerOnceTap(this.props.downloadFunc)
							}}>
								<Text style={{color:'#777777',fontSize:16}}>{'下载'}</Text>
							</TouchableOpacity>
							) : null}
							<TouchableOpacity style={{flex:1,borderTopColor:'#d4d4d4',borderTopWidth:1,justifyContent:'center',alignItems:'center'}} onPress={()=>{
								this.setState({isShow: false})
							}}>
								<Text style={{color:'tomato',fontSize:16}}>取消</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
    )
  }
}