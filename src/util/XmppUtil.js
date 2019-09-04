import {Platform, NativeModules, NetInfo} from 'react-native';
import Global from "./Global";
const XMPP = Platform.select({
	  ios: () => NativeModules.JCNativeRNBride,
    android: () => require('react-native-xmpp')
})();
export default XmppUtil = {
	xmppIsConnect (successCallBack,errorCallBack) {
        NetInfo.isConnected.fetch().done((isConnected) => {
        	if(isConnected){
        		if((Platform.OS == 'android' && XMPP.isConnected) || (Platform.OS == 'ios' && Global.iosXmppIsConnect )){
                    successCallBack("true");
				}else if((Platform.OS == 'android' && !XMPP.isConnected) || Platform.OS == 'ios'&& !Global.iosXmppIsConnect ){
                    errorCallBack("xmppError");
                }
			}else{
                errorCallBack("netInfoError");
			}
        });
	}
}