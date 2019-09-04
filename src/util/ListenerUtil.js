import React, {Component} from 'react';
export default ListenerUtil ={
    Welcome:{

    },
    Login:{

    },
    Audit:{

    },
    Foot:{

    },
    /**
     * 移除参数外的所有监听，不传参数则移除所有监听
     * @param Listeners
     */
    removeOut(groupName,outListeners,callback){
        let listeners = this[groupName];
        if(groupName == ""){
            Object.keys(this).forEach((objKey) =>{
                if('remove'!= objKey && 'removeIn'!= objKey ){
                    Object.keys(this[objKey]).forEach((lisKey) =>{
                        // console.log('移除全部监听：'+lisKey);
                        if((!outListeners || outListeners.indexOf(lisKey)==-1)){
                            if(this[objKey][lisKey]){
                                this[objKey][lisKey].remove();
                            }
                            delete this[objKey][lisKey];
                        }
                    });
                }
            });
        }else{
            Object.keys(listeners).forEach((key) =>{
                if('remove'!= key && 'removeIn'!= key && (!outListeners || outListeners.indexOf(key)==-1)){
                    // console.log('移除监听：'+key);
                    if(this[groupName][key]){
                        this[groupName][key].remove();
                    }
                    delete this[groupName][key];
                }
            });
        }
        callback();
    },
    /**
     * 移除参数内的监听
     * @param Listeners
     */
    removeIn(Listeners){
        Object.keys(this).forEach((key) =>{
            if('remove'!= key && 'removeIn'!= key && Listeners && Listeners.indexOf(key)!=-1){
                // console.log('移除监听：'+key);
                this[key].remove();
                delete this[key];
            }
        });
    }
}