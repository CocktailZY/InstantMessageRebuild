import React, {Component} from 'react';
import {
	Text,
	View,
	ScrollView,
	Image,
	Platform,
	TouchableOpacity
} from 'react-native';
import HandlerOnceTap from '../../util/HandlerOnceTap';

export default class BottomPanel extends Component {
	render() {
		return (
			<ScrollView
				ref={(scrollView) => {
					this._scrollView = scrollView;
				}}
				automaticallyAdjustContentInsets={false}
				scrollEventThrottle={200}
			>
				<View style={{
					flexDirection: 'row',
					backgroundColor: '#F9F9F9',
					justifyContent: 'space-around',
					paddingTop: 10,
					paddingBottom: 10
				}}>
					<TouchableOpacity
						onPress={()=>{HandlerOnceTap(this.props.imageDidClick)}}
					>
						<View style={{alignItems: 'center', justifyContent: 'center', padding: 5,}}>
							{/*<View style={{backgroundColor:'#FFF', borderRadius:8, padding:5,width:50,height:50,justifyContent:'center',*/}
							{/*alignItems:'center',marginBottom:5}}>*/}
							{/*<Icons name="md-images" size={40} color={'rgba(76,122,238,1)'} />*/}
							{/*</View>*/}
							<Image source={require('../../images/icon_img.png')} style={{
								width: 50,
								height: 50,
								marginBottom: 5
							}}/>
							<Text style={{color: 'rgba(76,122,238,1)', fontSize: 10}}>{'相册'}</Text>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={()=>{HandlerOnceTap(this.props.cameraDidClick)}}
					>
						<View style={{alignItems: 'center', justifyContent: 'center', padding: 5,}}>
							{/*<View style={{backgroundColor:'#FFF', borderRadius:8, padding:5,width:50,height:50,justifyContent:'center',*/}
							{/*alignItems:'center',marginBottom:5}}>*/}
							{/*<Icons name="md-images" size={40} color={'rgba(76,122,238,1)'} />*/}
							{/*</View>*/}
							<Image source={require('../../images/icon_photo.png')} style={{
								width: 50,
								height: 50,
								marginBottom: 5
							}}/>
							<Text style={{color: 'rgba(76,122,238,1)', fontSize: 10}}>{'拍摄'}</Text>
						</View>
					</TouchableOpacity>
					{Platform.OS == 'android' ? (<TouchableOpacity
						onPress={()=>{HandlerOnceTap(this.props.fileDidClick)}}
					>
						<View style={{alignItems: 'center', justifyContent: 'center', padding: 5,}}>
							{/*<View style={{backgroundColor:'#FFF', borderRadius:8, padding:5, width:50,height:50,justifyContent:'center',*/}
							{/*alignItems:'center',marginBottom:5*/}
							{/*}}>*/}
							{/*<Icons name="ios-folder-outline" size={40} color={'rgba(76,122,238,1)'}/>*/}
							{/*</View>*/}
							<Image source={require('../../images/icon_file.png')} style={{
								width: 50,
								height: 50,
								marginBottom: 5
							}}/>
							<Text style={{color: 'rgba(76,122,238,1)', fontSize: 10}}>{'文件'}</Text>
						</View>
					</TouchableOpacity>) : null}

				</View>
			</ScrollView>
		)
	}
}
