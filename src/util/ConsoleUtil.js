/**
 * 是否开启debug
 * @type {boolean}
 */
// let DEBUG = __DEV__;
let DEBUG = false;
export default ConsoleUtil = {
    console(param){//12345678
        DEBUG?console.log(param):"";//1222222
    }
}
