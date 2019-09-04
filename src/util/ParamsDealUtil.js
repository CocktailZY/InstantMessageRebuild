export default ParamsDealUtil = {
    toGetParams(jsonObj) {
        let resultStr = '';
        for (let key in jsonObj) {
            resultStr += '&' + key + '=' + jsonObj[key];
        }
        resultStr = resultStr.replace(/&/i, '?');
        return resultStr;
    }
}