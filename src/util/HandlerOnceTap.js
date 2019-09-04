let lastPressTime = 1;
let tapName;
/**
 * 重复点击拦截
 */
export default HandlerOnceTap = (callback,name) => {
    let curTime = new Date().getTime();
    if (tapName == name && curTime - lastPressTime > 1000) {
        lastPressTime = curTime;
        tapName = name;
        callback();
    }else if (tapName != name) {
        lastPressTime = curTime;
        tapName = name;
        callback();
    }
};