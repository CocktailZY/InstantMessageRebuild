import Path from "../config/UrlConfig";
import FetchUtil from "./FetchUtil";

export default RedisUtil = {
    update(uid, nav, obj, myType, appStatus, callback) {
        FetchUtil.netUtil(Path.postUpdateRedis, {
            value: myType == 'redis' ? uid : appStatus,
            type: myType
        }, 'POST', nav, obj, (data) => {
            // console.log(data);
            if (data.code.toString() == '200') {
                callback();
            }
        })
    },

	onceSubmit(key, nav, obj) {
		FetchUtil.netUtil(Path.submitUpdateRedis, {
			key: key,
		}, 'POST', nav, obj, (data) => {
		    // console.log('***********************************');
			  // console.log(data);
		})
	}
}