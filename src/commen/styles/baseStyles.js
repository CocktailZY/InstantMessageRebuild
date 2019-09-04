import React from 'react';
import {
	StyleSheet
} from 'react-native';

let baseStyles = StyleSheet.create(
	{
		theme_main: {flex:1,backgroundColor:'#cecece'},
		flex_one: {flex: 1},
		flex_row: {flexDirection: 'row'},

		row_col_center: {justifyContent:'center',alignItems:'center'},
		row_center: {justifyContent:'center'},//沿主轴方向
		col_center: {alignItems:'center'},//垂直主轴方向

		color_black: {color:'#000000'},
		color_white: {color:'#FFFFFF'},
		bkcolor_black: {backgroundColor:'#000000'},
		bkcolor_white: {backgroundColor:'#FFFFFF'},

		text_center: {textAlign: 'center'}
	});

module.exports = baseStyles;