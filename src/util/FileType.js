/*
* 文件类型调用方法
* fileTypeReturn.fileTypeSelect(fileName);
* */
import React, {Component} from 'react';
import Icons from 'react-native-vector-icons/FontAwesome';

export default fileTypeReturn = {
	fileTypeSelect(fileName) {//传入文件名
		const start = fileName.lastIndexOf('\.') + 1,
			nowType = fileName.substr(start),//截取文件名后文件格式
			iconSize = 48;
		let typeUrl;
		if (nowType == 'txt') {//文件为txt文本
			typeUrl = <Icons name='file-text-o' size={iconSize} color={'#9f9f9f'}/>;
		} else if (nowType == 'ppt' || nowType == 'pptx') {//文件为ppt演示文稿
			typeUrl = <Icons name='file-powerpoint-o' size={iconSize} color={'#e58e2d'}/>;
		} else if (nowType == 'doc' || nowType == 'docx') {//文件为word文档
			typeUrl = <Icons name='file-word-o' size={iconSize} color={'#2549cc'}/>;
		} else if (nowType == 'xls' || nowType == 'xlsx') {//文件为excel表格
			typeUrl = <Icons name='file-excel-o' size={iconSize} color={'#3bc72b'}/>;
		} else if (nowType == 'pdf') {//文件为pdf文件
			typeUrl = <Icons name='file-pdf-o' size={iconSize} color={'#d9400a'}/>;
		} else if (nowType == 'jpg' || nowType == 'png' || nowType == 'jpeg' || nowType == 'gif' || nowType == 'JPG' || nowType == 'PNG' || nowType == 'JPEG' || nowType == 'GIF') {//文件为图片
			typeUrl = 'img';
		} else if (nowType == 'aac' || nowType == 'm4r') {//文件为语音
			typeUrl = <Icons name='file-audio-o' size={iconSize} color={'#1a99d6'}/>;
		} else {//其他文件类型
			typeUrl = <Icons name='file-o' size={iconSize} color={'#dedf0b'}/>;
		}
		return typeUrl;
	},
	getfileType(fileName) {//传入文件名
		const start = fileName.lastIndexOf('\.') + 1,
			nowType = fileName.substr(start);//截取文件名后文件格式
		let typeUrl;
		if (nowType == 'txt' || nowType == 'ppt' || nowType == 'pptx' || nowType == 'doc' || nowType == 'docx' || nowType == 'xls' || nowType == 'xlsx' || nowType == 'pdf') {//文件为txt文本
			typeUrl = 'file';
		} else if (nowType == 'jpg' || nowType == 'png' || nowType == 'jpeg' || nowType == 'gif' || nowType == 'JPG' || nowType == 'PNG' || nowType == 'JPEG' || nowType == 'GIF') {//文件为图片
			typeUrl = 'img';
		} else if (nowType == 'aac' || nowType == 'm4r') {//文件为语音
			typeUrl = 'audio';
		} else {//其他文件类型
			typeUrl = 'other';
		}
		return typeUrl;
	},
	getOtherFileType(fileName) {
		const start = fileName.lastIndexOf('\.') + 1,
			nowType = fileName.substr(start);//截取文件名后文件格式
		let typeUrl;
		if (nowType == 'doc' || nowType == 'docx' || nowType == 'xls' || nowType == 'xlsx' || nowType == 'pdf') {
			typeUrl = 'file';
		} else {//其他文件类型
			typeUrl = 'other';
		}
		return typeUrl;
	}
}