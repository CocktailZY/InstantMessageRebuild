import React, {
    AsyncStorage
}from 'react-native';

class CookieStorage {
    /**
     * 获取
     * @param key
     * @returns {Promise<T>|*|Promise.<TResult>}
     */

    static get(key) {
        return AsyncStorage.getItem(key).then((value) => {
            const jsonValue = JSON.parse(value);
            return jsonValue;
        });
    }

	static readData(key) {
		console.log('读取');
		return AsyncStorage.getItem(key, function (error, result) {
			if (error) {
				console.log('读取失败');
			}else {
				console.log(result);
				return result;
			}
		})
	}

    /**
     * 保存
     * @param key
     * @param value
     * @returns {*}
     */
    static save(key, value) {
        return AsyncStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * 更新
     * @param key
     * @param value
     * @returns {Promise<T>|Promise.<TResult>}
     */
    static update(key, value) {
        return DeviceStorage.get(key).then((item) => {
            value = typeof value == 'string' ? value : Object.assign({}, item, value);
            return AsyncStorage.setItem(key, JSON.stringify(value));
        });
    }

    /**
     * 更新
     * @param key
     * @returns {*}
     */
    static delete(key) {
        return AsyncStorage.removeItem(key);
    }
}

export default CookieStorage;
