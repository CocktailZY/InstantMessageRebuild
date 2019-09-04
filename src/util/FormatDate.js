import {Platform} from 'react-native';

/**
 * 时间戳格式化工具
 */
export default FormatDate = {
	formatTimeStmp(seconds) {
		if (seconds) {
			var d = new Date(seconds);
			var month = d.getMonth() + 1;
			var date = d.getDate();
			var day = d.getFullYear() + "-" + month + "-" + date;
			var nowDate = new Date();
			var nowDay = nowDate.getFullYear() + "-" + (nowDate.getMonth() + 1) + "-" + nowDate.getDate();
			if (day == nowDay) {
				day = "今天";
				var h = d.getHours();
				var m = d.getMinutes();
				var s = d.getSeconds();
				if (h < 10) {
					h = "0" + h;
				}
				if (m < 10) {
					m = "0" + m;
				}
				if (s < 10) {
					s = "0" + s;
				}
				day = day + " " + h + ":" + m + ":" + s;
			} else {
				if (month < 10) {
					month = '0' + month;
				}

				if (date < 10) {
					date = '0' + date;
				}
				day = d.getFullYear() + "-" + month + "-" + date;
			}
		}
		return day;
	},
	formatTimeStmpToFullTime(seconds) {
		if (seconds) {
			var d = new Date(seconds);
			var month = d.getMonth() + 1;
			var date = d.getDate();
			var day = d.getFullYear() + "-" + month + "-" + date;
			var nowDate = new Date();
			var nowDay = nowDate.getFullYear() + "-" + (nowDate.getMonth() + 1) + "-" + nowDate.getDate();
			var h = d.getHours();
			var m = d.getMinutes();
			var s = d.getSeconds();
			if (h < 10) {
				h = "0" + h;
			}
			if (m < 10) {
				m = "0" + m;
			}
			if (s < 10) {
				s = "0" + s;
			}
			if (day == nowDay) {
				day = "今天";
				day = h + ":" + m;
			} else {
				if (month < 10) {
					month = '0' + month;
				}

				if (date < 10) {
					date = '0' + date;
				}
				day = d.getFullYear() + "-" + month + "-" + date + " " + h + ":" + m;
			}
			return day;
		}
	},
	formatTimeStmpToFullTimeForSave(seconds) {
		if (seconds) {
			var d = new Date(seconds);
			var month = d.getMonth() + 1;
			var date = d.getDate();
			var day = d.getFullYear() + "-" + month + "-" + date;
			var nowDate = new Date();
			var nowDay = nowDate.getFullYear() + "-" + (nowDate.getMonth() + 1) + "-" + nowDate.getDate();
			var h = d.getHours();
			var m = d.getMinutes();
			var s = d.getSeconds();
			if (h < 10) {
				h = "0" + h;
			}
			if (m < 10) {
				m = "0" + m;
			}
			if (s < 10) {
				s = "0" + s;
			}
			if (month < 10) {
				month = '0' + month;
			}

			if (date < 10) {
				date = '0' + date;
			}
			// if (Platform.OS == 'ios') {
			// 	day = d.getFullYear() + "-" + month + "-" + date + " " + h + ":" + m + ":" + s;
			// } else {
				day = d.getFullYear() + "-" + month + "-" + date + " " + h + ":" + m + ":" + s;
			//}

			return day;
		}
	},
	formatTimeStmpTypeShow(time) {
		if (typeof(time) == 'number') {//确定传入的为数值类型
			let dateTime = new Date(time),//传入时间
				SY = dateTime.getFullYear(),
				SM = dateTime.getMonth() + 1,
				SD = dateTime.getDate(),
				Sh = dateTime.getHours(),
				Sm = dateTime.getMinutes(),
				SW = dateTime.getDay(),
				week = ['日', '一', '二', '三', '四', '五', '六'];//用以确定星期
			let nowDate = new Date(),//获取当前时间
				NY = nowDate.getFullYear(),
				NM = nowDate.getMonth() + 1,
				ND = nowDate.getDate();
			let oneDay = new Date(nowDate.getTime() - 24 * 3600 * 1000),//前一天
				TY = oneDay.getFullYear(),
				TM = oneDay.getMonth() + 1,
				TD = oneDay.getDate();
			let oneWeek = new Date(nowDate.getTime() - 7 * 24 * 3600 * 1000),//前一周
				oWY = oneWeek.getFullYear(),
				oWM = oneWeek.getMonth() + 1,
				oWD = oneWeek.getDate();
			let showTime = (Sh < 10 ? '0' + Sh : Sh) + ':' + (Sm < 10 ? '0' + Sm : Sm);//每种情况都需要的小时与分钟
			let day = '';//输出时间格式声明
			if (SY == NY && SM == NM && SD == ND) {//判断当天
				day = showTime;
			} else if (SD == TD && SM == TM && SY == TY) {//判断为昨天
				day = '昨天 ' + showTime;
			} else if ((SD >= oWD) || (SD < oWD && SM < oWM) || (SD < oWD && SM < oWM && SY < oWY)) {//判断为当前时间的前一周
				day = '星期' + week[SW] + ' ' + showTime;
			} else {//其他时间均显示年月日时分
				day = (SY < 10 ? '0' + SY : SY) + '-' + (SM < 10 ? '0' + SM : SM) + '-' + (SD < 10 ? '0' + SD : SD) + ' ' + showTime;
			}
			return day;
		}
	}
}