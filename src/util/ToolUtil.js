import Path from "../config/UrlConfig";
import FetchUtil from "./FetchUtil";
import Global from "./Global";

/**
 * 表单提交正则校验
 * 只能是数字，字母，中文的组合
 */
export default (ToolUtil = {
    isCorrectName(name) {
    console.log("待校验---");
    console.log(name);
    let result = false;
    if (name) {
      name = name + "";
      if (name.match(/^[\u4E00-\u9FA5a-zA-Z0-9]+$/)) {
        result = true;
      }
    }
    return result;
    },
    //判断字符串是否包含emoji表情
    isEmojiCharacterInString(substring) {
        let emojiReg = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u203C-\u3299]\uFE0F|[\u0023-\u00AE]\uFE0F/g;
      // let emojiReg2 = /uD83C|uD83D|uD83E[u200D|uFE0F]|uD83C|uD83D|uD83E|[0-9|*|#]uFE0Fu20E3|[0-9|#]u20E3|[u203C-u3299]uFE0Fu200D|[u203C-u3299]uFE0F|[u2122-u2B55]|u303D|[A9|AE]u3030|uA9|uAE|u3030/ig;
      return emojiReg.test(substring);
    },


    moneyLimit(obj, intMax) {
    if(obj && obj.value){
      obj.value = obj.value.replace(/[^\d.]/g,"");
      obj.value = obj.value.replace(/\.{2,}/g,".");
      obj.value = obj.value.replace(".","$#$").replace(/\./g,"").replace("$#$",".");
      obj.value = obj.value.replace(/^(\-)*(\d+)\.(\d\d).*$/,'$1$2.$3');
      if(obj.value !=""){
          if(obj.value == "."){
              obj.value= "0.1";
          }else if(obj.value.indexOf(".") == 0){
              obj.value= "0"+obj.value;
          }
          if(intMax){
              obj.value = maxIntPart(obj.value,intMax,true);
          }
      }
    }
    return obj.value;
    },
    //比较时间戳
    calculateDiffTime(start_time, end_time) {
    var startTime = 0,
      endTime = 0;
    if (start_time < end_time) {
      startTime = start_time;
      endTime = end_time;
    } else {
      startTime = end_time;
      endTime = start_time;
    }

    // //计算天数
    // var timeDiff = endTime - startTime
    // var year = Math.floor(timeDiff / 86400 / 365);
    // timeDiff = timeDiff % (86400 * 365);
    // var month = Math.floor(timeDiff / 86400 / 30);
    // timeDiff = timeDiff % (86400 * 30);
    // var day = Math.floor(timeDiff / 86400);
    // timeDiff = timeDiff % 86400;
    // var hour = Math.floor(timeDiff / 3600);
    // timeDiff = timeDiff % 3600;
    // var minute = Math.floor(timeDiff / 60);
    // timeDiff = timeDiff % 60;
    // var second = timeDiff;
    // return [year, month, day, hour, minute, second]

    var timeDiff = endTime - startTime;
    var hour = Math.floor(timeDiff / 3600);
        var minute = Math.floor(timeDiff / 60);
    timeDiff = timeDiff % 3600;
    //var minute = Math.floor(timeDiff / 60);
    timeDiff = timeDiff % 60;
    var second = timeDiff;

    return minute;//[hour, minute, second];
    },
    //文件大小显示处理
    getFileSize(toFileSize) {
    let filesize;
    if(parseFloat(toFileSize) < 1024*1024){
      filesize = (parseFloat(toFileSize)/1024).toFixed(2) + 'K';
    }else if(parseFloat(toFileSize) < 1024*1024*1024){
      filesize = (parseFloat(toFileSize)/1024/1024).toFixed(2) + 'M';
    }else{
      filesize = (parseFloat(toFileSize)/1024/1024/1024).toFixed(2) + 'G';
    }
    return filesize;
    },
    /**
    *时间字符串时间戳字符串
    */
    strToStemp(time){
        time = time.replace(/-/g,':').replace(' ',':');
        time = time.split(':');
        return new Date(time[0],(time[1]-1),time[2],time[3],time[4],time[5]?time[5]:"00").getTime();
    },

    /**
     * 获取本地时间与服务器时间戳差值
     * 该方法已经计算时区
     * @returns {Date}
     */
    getServiceDateT(){
        let getOptions = {
            methd: 'GET',
        };
        fetch(Path.getResponseDate, getOptions).then((response) => {
            if(response && response.headers && response.headers.map && response.headers.map.date[0]){
                let serviceGMTDateStr = response.headers.map.date[0];
                Global.timeT = new Date(serviceGMTDateStr).getTime() - new Date().getTime();
                console.log(Global.timeT);
            }
        }).catch(error => {
            console.log(error);
        });
    },
    /**
     * 获取服务器当前时间戳
     * 根据本地时间计算
     * @returns {number}
     */
    getServiceTime(){
        return new Date().getTime() + Global.timeT;
    },
    /**
     * 将服务器时间转为本地时间，用于显示
     * @param serviceTime
     * @returns {number}
     */
    getLocalTime(serviceTime){
        return serviceTime - Global.timeT;
    },
});

    maxIntPart = (value, max, pointLast) => {
      var result = "";
        if(value){
            var point = value.indexOf(".");
            var intPart = "",decimal = "",hasPoint=true;
            if(point>0){
                intPart = value.substring(0,point);
                decimal = value.substring(point+1,value.length);
            }else if(point==0){
                //.开头
                intPart = "0";
                decimal = value.substring(1,value.length);
            }else{
                //没有.
                hasPoint=false;
                intPart = value;
            }
            result = intPart.substring(0,max);
            if(pointLast){
                if(hasPoint){
                    result += "."+decimal;
                }else{
                    if(decimal != ''){
                        result += "."+decimal;
                    }
                }
            }else{
                if(decimal != ''){
                    result += "."+decimal;
                }
            }
        }else{
            result = "0";
        }
        return result;

    };
