import SQLiteStorage from 'react-native-sqlite-storage';
import ConsoleUtil from "./ConsoleUtil";
import {Platform} from 'react-native';
import Global from './Global';
import ToolUtil from "./ToolUtil";

SQLiteStorage.DEBUG(false);
let userid = "";
let database_name = "";
let database_version = "";//版本号
let database_displayname = "";
let database_size = -1;//-1应该是表示无限制
let db;
let n = 0;
let updateFlag = null;
//sql列表
let sqllist = {
	//创建人员表
	create_user_table: 'create table if not exists user(\n' +
		'    id integer primary key autoincrement,\n' +
		'    jid_node varchar(32) not null unique,\n' +
		'    user_id varchar not null,\n' +
		'    department_id integer not null,\n' +
		'    true_name varchar not null,\n' +
		'    nick_name varchar,\n' +
		'    notes_name varchar,\n' +
		'    is_contacts integer not null,\n' +
		'    label varchar,\n' +
		'    phone varchar,\n' +
		'    email varchar,\n' +
		'    sex integer,\n' +
		'    head_photo_name varchar,\n' +
		'    notes_initial char(1),\n' +
		'    is_details integer not null\n' +
		')',
	//创建部门表
	create_department_table: 'create table if not exists department(\n' +
		'    id integer primary key autoincrement,\n' +
		'    department_id varchar not null unique,\n' +
		'    department_name varchar not null,\n' +
		'    previous_id integer not null\n' +
		')',
	//创建群组表
	create_groups_table: 'create table if not exists groups(\n' +
		'    id integer primary key autoincrement,\n' +
		'    jid_node varchar(32) not null,\n' +
		'    name varchar not null,\n' +
		'    notes varchar not null,\n' +
		'    picture_path varchar not null,\n' +
		'    picture_name varchar not null,\n' +
		'    role integer not null\n' +
		')',
	//创建聊天表
	create_talker_table: 'create table if not exists talker(\n' +
		'    id integer primary key autoincrement,\n' +
		'    type integer not null,\n' +
		'    user_groups_id integer,\n' +
		'    jid varchar,\n' +
		'    jid_node varchar not null unique,\n' +
		'    trueName varchar,\n' +
		'    image_name varchar,\n' +
		'    create_time timestamp default(datetime(\'now\',\'localtime\')) not null ,\n' +
		'    sequence_number Integer not null,\n' +
		'    unread_number integer not null,\n' +
		'    promote_priority Integer ,\n' +
		'    is_no_remind integer not null,\n' +
		'    is_anted integer not null\n' +
		')',
	//创建消息表
	create_message_table: 'create table if not exists message(\n' +
		'    id integer primary key autoincrement,\n' +
		'    jid_node varchar not null unique,\n' +
		'    true_name varchar,\n' +
		'    create_time timestamp default(datetime(\'now\',\'localtime\')) not null ,\n' +
		'    type varchar not null,\n' +
		'    content text,\n' +
		'    image_path varchar,\n' +
		'    file_url varchar,\n' +
		'    file_name varchar,\n' +
		'    msg_id varchar\n' +
		')',
	//创建群组成员关系表
	create_correlation_group_user_table: 'create table if not exists correlation_group_user(\n' +
		'    id integer primary key autoincrement,\n' +
		'    groups_id integer not null,\n' +
		'    user_id integer not null ,\n' +
		'    file_name varchar not null\n' +
		')',
	//创建权限表
	create_permission_table: 'create table if not exists permission(\n' +
		'    id integer primary key autoincrement,\n' +
		'    talker_id integer not null,\n' +
		'    type integer not null ,\n' +
		'    status integer not null\n' +
		')',
	//创建键值表
	create_key_value_table: 'create table if not exists key_value(\n' +
		'    key varchar not null,\n' +
		'    value  not null\n' +
		')',
	//创建离线时间表
	create_offline_table: 'create table if not exists offline_msg(\n' +
		'    id integer primary key autoincrement,\n' +
		'    room_jid varchar unique,\n' +
		'    last_time integer not null\n' +
		')'
}
// let userOjb={
//     jid_node:'',//人员jidNode
//     user_id:'',//人员userId
//     true_name:'',//真实姓名
//     nick_name:'',//昵称
//     notes_name:'',//备注名称
//     is_contacts:0,//是否为常用联系人 0-否 1-是
//     label:'',//分组
//     phone:'',//电话
//     email:'',//邮箱
//     sex:0,//性别 0-女，1-男
//     head_photo_name:'',//头像名称
//     notes_initial:'',//备注首字母
//     is_details:''//是否已经获取详情 0-未获取，1-已获取
// }
export default Sqlite = {
	initConstant(userId) {
		ConsoleUtil.console("Sqlite.js::::::::开始初始化数据库环境变量");
		userid = userId;
		database_name = Platform.OS == 'ios' ? "im_" + userId + ".db" : "/sdcard/Android/data/com.instantmessage/files/im/" + userId + "/sqlite/im_" + userId + ".db";//数据库文件
		database_version = "1.0";//版本号，当表结构发生变化时更新版本号
		database_displayname = "IMSQLite";
		database_size = -1;//-1应该是表示无限制
	},
	//打开数据库
	open() {
		if (!db) {
			ConsoleUtil.console("Sqlite.js::::::::正在打开数据库:" + database_name);
			db = SQLiteStorage.openDatabase(
				database_name,
				database_version,
				database_displayname,
				database_size,
				() => {
					ConsoleUtil.console("Sqlite.js::::::::打开数据库成功");
				},
				(err) => {
					ConsoleUtil.console("Sqlite.js::::::::打开数据库失败:" + err);
				});
		} else {
			ConsoleUtil.console("Sqlite.js::::::::数据库已经是打开状态");
		}
	},
	//初始化数据库表结构
	init(userId) {
		this.initConstant(userId);
		//开始初始化表结构
		ConsoleUtil.console("Sqlite.js::::::::开始初始化数据库");
		this.open();
		n = 0;
		for (let key in sqllist) {
			this.createTable(key, sqllist[key], Object.keys(sqllist).length, () => {
				n++;
			});
		}
	},
	//创建表（sql语句名称，建表sql）
	createTable(sqlName, sql, len, callback) {
		//创建用户表
		db.transaction((tx) => {
			tx.executeSql(sql, [], () => {
				// ConsoleUtil.console("Sqlite.js::::::::" + sqlName + "执行成功");
			}, (err) => {
				// ConsoleUtil.console("Sqlite.js::::::::" + sqlName + "执行失败" + writeObj(err));
			});
		}, (err) => {
			ConsoleUtil.console("Sqlite.js::::::::建表" + sqlName + "失败");
			ConsoleUtil.console("Sqlite.js::::::::错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::建表" + sqlName + "成功");
			callback();
		})
	},
	//查询部门下的人员列表
	selectUsers(userId, departId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "select * from user where department_id=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [departId], (tx, results) => {
					let users = [];
					for (let i = 0; i < results.rows.length; i++) {
						let user = results.rows.item(i);
						users.push(user);
					}
					callback(users);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {
			ConsoleUtil.console("Sqlite.js::::::::查询部门人员列表失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::查询部门人员列表成功");
		})
	},
	selectUser(userId, jid_node, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "select * from user where jid_node=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [jid_node], (tx, results) => {
					let user;
					for (let i = 0; i < results.rows.length; i++) {
						user = results.rows.item(i);
					}
					callback(user);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {
			ConsoleUtil.console("Sqlite.js::::::::查询人员失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::查询人员成功");
		})
	},
	//查询部门下的子部门列表
	selectDepartment(userId, departId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "select * from department where previous_id=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [departId], (tx, results) => {
					let departs = [];
					for (let i = 0; i < results.rows.length; i++) {
						let depart = results.rows.item(i);
						departs.push(depart);
					}
					callback(departs);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {
			ConsoleUtil.console("Sqlite.js::::::::查询部门下的子部门列表失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::查询部门下的子部门列表成功");
		})
	},
	//查询部门下的全部数据
	selectAllData(userId, departId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "select * from key_value where key='?'";
		db.transaction((tx) => {
			tx.executeSql(sql, [departId], (tx, results) => {
					let date = null;
					for (let i = 0; i < results.rows.length; i++) {
						date = results.rows.item(i);
					}
					callback(date);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {
			ConsoleUtil.console("Sqlite.js::::::::查询查询部门下的全部数据失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::查询查询部门下的全部数据成功");
		})
	},
	/**
	 * 保存人员信息
	 * @param userId
	 * @param userOjb 人员对象 userOjb[]
	 */
	saveUser(userId, userOjb, callback) {

		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		//ConsoleUtil.console(writeObj(userOjb));
		//ConsoleUtil.console(userOjb.jid_node);
		this.selectUser(userId, userOjb["jid_node"], (data) => {
			if (data && data.length > 0) {
				let sql = "update user set user_id=?,department_id=?,trueName=?,nick_name=?,notes_name=?,is_contacts=?,label=?,phone=?,email=?,sex=?,head_photo_name=?,notes_initial=?,is_details=? where jid_node=?";
				let str = [
					userOjb["user_id"], userOjb["department_id"], userOjb["trueName"],
					userOjb["nick_name"], userOjb["notes_name"], userOjb["is_contacts"], userOjb["label"],
					userOjb["phone"], userOjb["email"], userOjb["sex"], userOjb["head_photo_name"],
					userOjb["notes_initial"], userOjb["is_details"], userOjb["jid_node"]];
				db.transaction((tx) => {
					tx.executeSql(sql, str, (tx, results) => {
							let len = results.rows.length;
						}, (err) => {
							ConsoleUtil.console("updateUser:" + writeObj(err));
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("Sqlite.js::::::::保存失败，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("Sqlite.js::::::::保存成功");
					callback();
				})
			} else {
				let sql = "insert OR REPLACE into user(jid_node,user_id,department_id,true_name,nick_name,notes_name,is_contacts,label,phone,email,sex,head_photo_name,notes_initial,is_details) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
				let str = [
					userOjb["jid_node"], userOjb["user_id"], userOjb["department_id"], userOjb["true_name"],
					userOjb["nick_name"], userOjb["notes_name"], userOjb["is_contacts"], userOjb["label"],
					userOjb["phone"], userOjb["email"], userOjb["sex"], userOjb["head_photo_name"],
					userOjb["notes_initial"], userOjb["is_details"]];
				db.transaction((tx) => {
					tx.executeSql(sql, str, (tx, results) => {
							let len = results.rows.length;
						}, (err) => {
							ConsoleUtil.console("saveUser:" + writeObj(err));
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("Sqlite.js::::::::保存失败，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("Sqlite.js::::::::保存成功");
					callback();
				})
			}
		});
	},
	updateUser(userId, userOjb) {

		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}

		let sql = "update user set jid_node=?,user_id=?,department_id=?,trueName=?,nick_name=?,notes_name=?,is_contacts=?,label=?,phone=?,email=?,sex=?,head_photo_name=?,notes_initial=?,is_details=? where jid_node=?";
		let str = [
			userOjb["jid_node"], userOjb["user_id"], userOjb["department_id"], userOjb["trueName"],
			userOjb["nick_name"], userOjb["notes_name"], userOjb["is_contacts"], userOjb["label"],
			userOjb["phone"], userOjb["email"], userOjb["sex"], userOjb["head_photo_name"],
			userOjb["notes_initial"], userOjb["is_details"]];

		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					let len = results.rows.length;
				}, (err) => {
					ConsoleUtil.console("saveUser:" + writeObj(err));
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("Sqlite.js::::::::保存失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::保存成功");
			callback();
		})
	},
	/**
	 * 删除人员
	 * @param userId
	 * @param user_id 被删除人员userId
	 * @param callback
	 */
	deleteUser(userId, user_id, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "delete from user where user_id=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [user_id], (tx, results) => {
					ConsoleUtil.console("删除成功");
				}, (err) => {
					ConsoleUtil.console("deleteUser:" + writeObj(err));
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::删除人员失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::删除人员成功");
			callback();
		})
	},
	/**
	 * 保存部门
	 * userId：当前登陆人的userId
	 * deptId：部门id
	 * deptName：部门名称
	 * previousId：父部门id
	 */
	saveDepartment(userId, deptId, deptName, previousId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "insert OR REPLACE into department(department_id,department_name,previous_id) values(?,?,?)";
		let str = [deptId, deptName, previousId];
		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					//ConsoleUtil.console("部门入库：" + deptName + " 成功");
				}, (err) => {
					//ConsoleUtil.console("部门入库：" + deptName + " 失败" + writeObj(err));
					ConsoleUtil.console("saveDepartment:" + writeObj(err));
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("Sqlite.js::::::::保存部门失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::保存部门成功");
			callback();
		})
	},
	/**
	 * 更新部门
	 * @param userId 当前登录人userId
	 * @param deptId 部门ID
	 * @param deptName 部门名称
	 * @param previousId 父部门ID
	 */
	updateDepartment(userId, deptId, deptName, previousId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "update department set department_name=?,previous_id=? where department_id=?";
		let str = [deptName, previousId, deptId];
		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					ConsoleUtil.console("更新部门成功");
				}, (err) => {
					ConsoleUtil.console("updateDepartment:" + writeObj(err));
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("Sqlite.js::::::::更新部门失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::更新部门成功");
			callback();
		})
	},
	/**
	 * 删除部门
	 * @param userId 当前登录人ID
	 * @param deptId 部门ID
	 * @param callback
	 */
	deleteDepartment(userId, deptId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "delete from department where department_id=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [deptId], (tx, results) => {
					ConsoleUtil.console("删除成功");
				}, (err) => {
					ConsoleUtil.console("deleteDepartment:" + writeObj(err));
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::删除错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::删除成功");
			callback();
		})
	},
	//查询好友（未使用）
	selectFriend(userId, jid, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let u = null;
		let sql = "select * from user where jid_node=? ";
		db.transaction((tx) => {
			tx.executeSql(sql, [jid], (tx, results) => {
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						u = results.rows.item(i);
						ConsoleUtil.console("key：" + u.name);
					}
					callback(u);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {
			ConsoleUtil.console("查询错误，错误详情：" + writeObj(err));
			this.close();
		}, () => {
			ConsoleUtil.console("查询成功");
			this.close();
		})
	},
	//查询好友列表（未使用）
	selectFriends(userId, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let u = null;
		let sql = "select * from key_value where key='friendTree'";
		db.transaction((tx) => {
			tx.executeSql(sql, [], (tx, results) => {
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						u = results.rows.item(i);
						ConsoleUtil.console("key：" + u.key + " value：" + u.value);
					}
					callback(u);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("查询错误，错误详情：" + writeObj(err));
			this.close();
		}, () => {
			ConsoleUtil.console("查询成功");
			this.close();
		})
	},

	/**
	 * 保存最近聊天记录
	 * @param userId
	 * @param type
	 * @param jid
	 * @param jid_node
	 * @param trueName
	 * @param imageName
	 * @param isPromote
	 * @param isnoremind
	 * @param isanted
	 * @param callback
	 */
	saveTalker(userId, type, jid, jid_node, trueName, imageName, isPromote, isnoremind, isanted, callback) {

		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		//ConsoleUtil.console('saveTalker接到的jidNode==' + jid_node);
		//ConsoleUtil.console('saveTalker接到的trueName==' + trueName);
		let create_time = new Date().getTime();

		let sequence_number = 0;
		let unread_number = 0;
		// ConsoleUtil.console("Sqlite.js::::::::isPromote：" + isPromote);
		let promote_priority = (isPromote == true ? new Date().getTime() : 0);
		// ConsoleUtil.console("Sqlite.js::::::::保存talker的置顶优先级：" + promote_priority);

		let is_anted = (isanted == true) ? 1 : 0;
		let is_no_remind = (isnoremind == true) ? 1 : 0;
		let sql = "insert OR REPLACE into talker(type,user_groups_id,jid,jid_node,trueName,image_name,create_time,sequence_number,unread_number,promote_priority,is_no_remind,is_anted) values(?,?,?,?,?,?,?,?,?,?,?,?)";
		let str = [type, 0, jid, jid_node, trueName, imageName, create_time, sequence_number, unread_number, promote_priority, is_no_remind, is_anted];

		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					let len = results.rows.length;

				}, (err) => {
					// ConsoleUtil.console(err);
					//ConsoleUtil.console(writeObj(err))
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("Sqlite.js::::::::保存talker失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::保存talker成功");
			callback();
		})
	},
	/**
	 * 更新talker未读条数
	 * @param userId
	 * @param jid_node
	 * @param num 变化值 1/-1
	 * @param iszero 是否归零
	 * @param isanted 是否被@ true/false
	 * @param callback
	 */
	updateTalker(userId, jid_node, num, iszero, isanted, coverFlag, callbackSuccess, callbackError) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectTalkers(userId, jid_node, (talker) => {
			if (talker && talker.length > 0) {
				ConsoleUtil.console("Sqlite.js::::::::更新前的未读条数：" + talker[0].unread_number);
				let n = coverFlag ? num : ((iszero == true) ? 0 : talker[0].unread_number - (-num));
				n = n < 0 ? 0 : n;
				let str = [n, jid_node];
				let sql = "update talker set unread_number=? where jid_node=?";

				if (isanted == true) {
					str = [n, 1, jid_node];
					sql = "update talker set unread_number=?,is_anted=? where jid_node=?";
				} else if (isanted == false) {
					str = [n, 0, jid_node];
					sql = "update talker set unread_number=?,is_anted=? where jid_node=?";
				}

				ConsoleUtil.console("Sqlite.js::::::::更新后的未读条数：" + n);

				db.transaction((tx) => {
					tx.executeSql(sql, str, (tx, results) => {
							ConsoleUtil.console("results:" + results);
							//ConsoleUtil.console('updateTalker:' + n);
						}, (err) => {
							ConsoleUtil.console(err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("Sqlite.js::::::::未读条数更新错误，错误详情：" + writeObj(err));
					callbackError(writeObj(err));
				}, () => {
					ConsoleUtil.console("Sqlite.js::::::::未读条数更新成功：" + n);
					callbackSuccess("SUCCESS");
				})
			}
		});

	},
	/**
	 * 更新talker未读条数
	 * @param userId
	 * @param jid_node
	 * @param increase 是否递增，增量为1， true：递增，false：递减
	 * @param callbackSuccess
	 * @param callbackError
	 */
	updateTalkerNew(userId, jid_node, increase, callbackSuccess, callbackError) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let inc = increase ? "+1" : "-1";
		let str = [jid_node];
		let sql = "update talker set unread_number = unread_number" + inc + " where jid_node=?";
		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					ConsoleUtil.console("results:" + results);
					//ConsoleUtil.console('updateTalker:' + n);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {
			callbackError(writeObj(err));
		}, () => {
			callbackSuccess("SUCCESS");
		})
	},
	updateTalkerUnread(userId, jid_node, num, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectTalkers(userId, jid_node, (talker) => {
			let str = [num, jid_node];
			let sql = "update talker set unread_number=? where jid_node=?";
			db.transaction((tx) => {
				tx.executeSql(sql, str, (tx, results) => {
						//ConsoleUtil.console('updateTalkerUnread:' + n);
					}, (err) => {
						ConsoleUtil.console(err);
					}
				);
			}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
				ConsoleUtil.console("Sqlite.js::::::::未读条数更新错误，错误详情：" + writeObj(err));
			}, () => {
				ConsoleUtil.console("Sqlite.js::::::::未读条数更新成功：" + n);
				callback("updateUnreadSuccess");
			})
		});
	},
	/**
	 * 更新talker是否被@状态
	 * @param userId
	 * @param jid_node 联系人的jidNode
	 * @param isanted 是否被@ true/false
	 * @param callback
	 */
	updateTalkerIsAnted(userId, jid_node, isanted, callbackSuccess, callbackError) {
		//ConsoleUtil.console(jid_node);
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectTalkers(userId, jid_node, (talker) => {
			let sql = "update talker set is_anted=? where jid_node=?";
			let is_anted = (isanted == true) ? 1 : 0;
			db.transaction((tx) => {
				tx.executeSql(sql, [is_anted, jid_node], (tx, results) => {
						ConsoleUtil.console("results:" + writeObj(results));

					}, (err) => {
						ConsoleUtil.console(err);
					}
				);
			}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
				ConsoleUtil.console("Sqlite.js::::::::@状态更新错误，错误详情：" + writeObj(err));
				callbackError(writeObj(err));
			}, () => {
				ConsoleUtil.console("Sqlite.js::::::::@状态更新成功：" + n);
				callbackSuccess("SUCCESS");
			})
		});

	},
	/**
	 * 更新talker置顶优先级
	 * @param userId
	 * @param type
	 * @param jid
	 * @param jid_node 联系人或者群的
	 * @param trueName 真实姓名
	 * @param imageName 头像名称
	 * @param isPromote 是否置顶
	 * @param is_no_remind 是否免打扰
	 * @param is_anted 是否被@
	 * @param callback
	 */
	updateTalkerPromote(userId, type, jid, jid_node, trueName, imageName, isPromote, is_no_remind, is_anted, callback) {
		//ConsoleUtil.console(jid_node);
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectTalkers(userId, jid_node, (talker) => {
			let sql = "update talker set promote_priority=? where jid_node=?";
			let time = 0;
			if (isPromote == true) {
				time = ToolUtil.getServiceTime();
				// ConsoleUtil.console("Sqlite.js::::::::设置置顶：" + time);
				// ConsoleUtil.console("Sqlite.js::::::::设置置顶：" + time);
			} else {
				// ConsoleUtil.console("Sqlite.js::::::::取消置顶：" + time);
				// ConsoleUtil.console("Sqlite.js::::::::取消置顶：" + time);
			}
			if (talker && talker.length > 0) {
				db.transaction((tx) => {
					tx.executeSql(sql, [time, jid_node], (tx, results) => {
							ConsoleUtil.console("results:" + results);

						}, (err) => {
							ConsoleUtil.console(err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("Sqlite.js::::::::置顶优先级更新错误，错误详情：" + writeObj(err));
				}, () => {
					// ConsoleUtil.console("Sqlite.js::::::::置顶优先级更新成功");
					callback("updateSuccess");
				})
			} else {

				this.saveTalker(userId, type, jid, jid_node, trueName, imageName, isPromote, is_no_remind, is_anted, () => {

					ConsoleUtil.console("Sqlite.js::::::::第一次直接置顶");
					callback("saveSuccess");
				});
			}
		});

	},
	/**
	 * 更新群名称
	 * @param userId
	 * @param jid_node
	 * @param newName
	 * @param callback
	 */
	updateTalkerName(userId, type, jid, jid_node, trueName, imageName, isPromote, is_no_remind, is_anted, callback) {
		//ConsoleUtil.console(jid_node);
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectTalkers(userId, jid_node, (talker) => {
			let sql = "update talker set trueName=? , image_name=? where jid_node=?";
			let time = 0;

			if (talker && talker.length > 0) {
				db.transaction((tx) => {
					tx.executeSql(sql, [trueName, imageName, jid_node], (tx, results) => {
							ConsoleUtil.console("results:" + results);

						}, (err) => {
							ConsoleUtil.console(err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("Sqlite.js::::::::置顶优先级更新错误，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("Sqlite.js::::::::置顶优先级更新成功");
					callback("updateSuccess");
				})
			} else {

				/*this.saveTalker(userId, type, jid, jid_node, trueName, imageName, isPromote, is_no_remind, is_anted, () => {

					ConsoleUtil.console("Sqlite.js::::::::第一次直接置顶");
					callback("saveSuccess");
				});*/
			}
		});

	},
	/**
	 * 查询最近联系的人或者群
	 * @param userId
	 * @param jid_node 最近联系的人或者群的jidNode
	 * @param callback
	 */
	selectTalkers(userId, jid_node, callback) {
		// let a = new Date().getTime();
		if (userid == "") {
			this.initConstant(userId);
		}
		// let b = new Date().getTime();
		// ConsoleUtil.console(b-a);
		if (!db) {
			this.open();
		}
		// let c = new Date().getTime();
		// ConsoleUtil.console(c-b);
		let sql = "SELECT t.id,t.type ttype,t.user_groups_id,t.jid,t.jid_node,t.trueName,t.image_name,t.sequence_number,t.unread_number,t.promote_priority,t.create_time,t.is_no_remind,t.is_anted,mm.type mtype,mm.true_name sendUserName,mm.content content,mm.create_time newest_time from talker t left join (SELECT m.jid_node,m.true_name,m.type,m.content,max(m.create_time) create_time FROM message m group by m.jid_node) mm on t.jid_node=mm.jid_node ORDER BY t.promote_priority DESC,newest_time DESC";
		let str = [];
		if (jid_node && jid_node != "") {
			sql = "SELECT * FROM talker where jid_node=? ";
			str.push(jid_node);
		}
		// let d = new Date().getTime();
		// ConsoleUtil.console(d-c);
		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					// let e = new Date().getTime();
					// ConsoleUtil.console(e-d);
					let talkers = [];
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						let talker = results.rows.item(i);
						if (talker && !talker.newest_time) {
							talker.newest_time = talker.create_time;
						}
						talkers.push(talker);
					}
					//ConsoleUtil.console("selectTalker查询message列表结果：");
					//ConsoleUtil.console(talkers);
					// let f = new Date().getTime();
					// ConsoleUtil.console(f-e);
					callback(talkers);
				}, (err) => {
					ConsoleUtil.console(writeObj(err));
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::查询message列表错误，错误详情：" + writeObj(err));
		}, () => {
			// ConsoleUtil.console("qlite.js::::::::查询message列表成功");
		})
	},

	selectTalkerByType(userId, type, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "SELECT * FROM talker t where t.type=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [type], (tx, results) => {
					let talkers = [];
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						let talker = results.rows.item(i);
						if (talker && !talker.newest_time) {
							talker.newest_time = talker.create_time;
						}
						talkers.push(talker);
					}
					callback(talkers);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::根据类型获取message列表错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::根据类型获取message列表成功");
		})
	},
	/**
	 * 真实姓名搜索消息列表
	 * @param userId
	 * @param trueName
	 * @param callback
	 */
	selectTalkersByTrueName(userId, trueName, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}

		let sql = "SELECT t.jid_node,t.trueName,t.image_name,t.promote_priority from talker t where trueName like ? ORDER BY t.promote_priority DESC";

		db.transaction((tx) => {
			tx.executeSql(sql, ["%" + trueName + "%"], (tx, results) => {
					let talkers = [];
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						let talker = results.rows.item(i);
						talkers.push(talker);
					}
					callback(talkers);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::模糊查询错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::模糊查询成功");
		})
	},
	/**
	 * 查询未读条数
	 * @param userId 当前登陆人的userId
	 * @param callback
	 */
	selectUnreadMsgTatol(userId, callback) {
		// ConsoleUtil.console('----------------------------------')
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "SELECT sum(unread_number) unread_number from talker";
		let str = [];
		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					let num = 0;
					let len = results.rows.length;
					// ConsoleUtil.console('talker数量：'+len);
					for (let i = 0; i < len; i++) {
						// ConsoleUtil.console(results.rows.item(i).unread_number);
						num = results.rows.item(i).unread_number ? results.rows.item(i).unread_number : 0;
					}
					// ConsoleUtil.console("qlite.js::::::::未读总条数：" + num);
					callback(num);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::查询未读条数错误，错误详情：" + writeObj(err));
		}, () => {
			// ConsoleUtil.console("qlite.js::::::::查询未读条数成功");
		})
	},
	/**
	 * 删除最近联系人
	 * @param userId
	 * @param jid_node
	 * @param callback
	 */
	deleteTalker(userId, jid_node, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "delete from talker where jid_node=?";
		db.transaction((tx) => {
			tx.executeSql(sql, [jid_node], (tx, results) => {
					// ConsoleUtil.console("删除成功。。。。。。。");
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::删除talker错误，错误详情：" + writeObj(err));
		}, () => {
			// ConsoleUtil.console("qlite.js::::::::删除talker成功");
			callback();
		})
	},
	/**
	 * 保存（更新）最近一条消息
	 * @param userId
	 * @param jid 发送人的jid
	 * @param type 消息类型
	 * @param content 消息内容
	 * @param sendName 发送人名称
	 * @param callback 成功回调
	 */
	saveMessage(userId, jid, type, content, sendName, msgId, sendTime, callback) {
		// ConsoleUtil.console("进入saveMessage");
		//ConsoleUtil.console('saveMessage接到的jidNode==' + jid);
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}

		let ctState = content;//置顶传入的content
		this.selectMessage(ctState,userId, jid, (data) => {
			// let create_time = parseInt(new Date().getTime());
			let create_time = sendTime ? sendTime : parseInt(new Date().getTime());
			let image_path = "";
			let file_url = "";
			let file_name = "";
			// ConsoleUtil.console("---------1---------");
			if (data && data.length > 0) {
				// ConsoleUtil.console("Message查询成功"+msgId)
				ConsoleUtil.console("qlite.js::::::::查到消息记录" + data + "，进入更新");

                //置顶时传入的content为空不更新本地聊天记录的内容以及发送人姓名
				if(ctState==""){

                    let sql = "update message set create_time=?,type=?,image_path=?,file_url=?,file_name=?,msg_id=? where jid_node=?";
                    db.transaction((tx) => {
                        tx.executeSql(sql, [create_time, type, image_path, file_url, file_name, msgId, jid], (tx, results) => {
                                // ConsoleUtil.console("updateMessage成功")
                                callback("updateSuccess");
                            }, (err) => {
                                ConsoleUtil.console("qlite.js::::::::" + err);
                            }
                        );
                    }, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
                        ConsoleUtil.console("qlite.js::::::::更新错误，错误详情：" + writeObj(err));
                    }, () => {
                        // ConsoleUtil.console("qlite.js::::::::更新成功");
                    })
				}else{

                    let sql = "update message set true_name=?,create_time=?,type=?,content=?,image_path=?,file_url=?,file_name=?,msg_id=? where jid_node=?";

                    db.transaction((tx) => {
                        tx.executeSql(sql, [sendName, create_time, type, content, image_path, file_url, file_name, msgId, jid], (tx, results) => {
                                // ConsoleUtil.console("updateMessage成功")
                                callback("updateSuccess");
                            }, (err) => {
                                ConsoleUtil.console("qlite.js::::::::" + err);
                            }
                        );
                    }, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
                        ConsoleUtil.console("qlite.js::::::::更新错误，错误详情：" + writeObj(err));
                    }, () => {
                        // ConsoleUtil.console("qlite.js::::::::更新成功");
                    })
				}
			} else if (data) {
				ConsoleUtil.console("qlite.js::::::::没查到消息记录" + data + "，进入保存");

				let sql = "insert OR REPLACE into message(jid_node,true_name,create_time,type,content,image_path,file_url,file_name,msg_id) values(?,?,?,?,?,?,?,?,?)";
				db.transaction((tx) => {
					tx.executeSql(sql, [jid, sendName, create_time, type, content, image_path, file_url, file_name, msgId], (tx, results) => {
							let len = results.rows.length;
							for (let i = 0; i < len; i++) {
								//ConsoleUtil.console(results.rows.item(i));
							}
							//ConsoleUtil.console("saveMessage成功")
							callback("saveSuccess");
						}, (err) => {
							ConsoleUtil.console(err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("qlite.js::::::::保存错误，错误详情：" + writeObj(err));
				}, () => {
					// ConsoleUtil.console("qlite.js::::::::保存成功");
				})
			}
		});
	},
	updateMessage(userId, msgId, sendName, type, content, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectMessageByMsgId(userId, msgId, (data) => {
			let create_time = parseInt(new Date().getTime());
			ConsoleUtil.console("qlite.js::::::::查询成功，返回结果：" + data);
			if (data && data.length > 0) {
				ConsoleUtil.console("qlite.js::::::::查到消息记录，进入更新");
				let sql = "update message set true_name=?,create_time=?,type=?,content=? where msg_id=?";
				db.transaction((tx) => {
					tx.executeSql(sql, [sendName, create_time, type, content, msgId], (tx, results) => {
							callback("updateSuccess");
						}, (err) => {
							ConsoleUtil.console("qlite.js::::::::" + err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("qlite.js::::::::更新错误，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("qlite.js::::::::更新成功");
				})
			} else if (data) {
				ConsoleUtil.console("qlite.js::::::::没查到消息记录，无操作");
			}
		});
	},
	/**
	 * 根据jid查询聊天内容
	 * @param userId
	 * @param jid
	 * @param callback
	 */
	selectMessage(ctState,userId, jid, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "SELECT * FROM message where jid_node=? ";
		db.transaction((tx) => {
			tx.executeSql(sql, [jid], (tx, results) => {
					let messages = [];
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						let message = results.rows.item(i);
						messages.push(message);
					}
					callback(messages);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::查询最近一条消息错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::查询最近一条消息成功");
		})
	},
	/**
	 * 根据msg_id查询聊天记录
	 * @param userId
	 * @param msg_id
	 * @param callback
	 */
	selectMessageByMsgId(userId, msg_id, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "SELECT * FROM message where msg_id=? ";
		db.transaction((tx) => {
			tx.executeSql(sql, [msg_id], (tx, results) => {
					let messages = [];
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						let message = results.rows.item(i);
						messages.push(message);
					}
					callback(messages);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::查询最近一条消息错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::查询最近一条消息成功");
		})
	},
	/**
	 * 根据key查询value
	 * @param key
	 */
	selectValueByKey(userId, key, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "SELECT * FROM key_value where key=? ";
		db.transaction((tx) => {
			tx.executeSql(sql, [key], (tx, results) => {
					let value = null;
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						value = results.rows.item(i);
					}
					callback(value);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::查询" + key + "对应的value值错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::查询" + key + "对应的value值成功");
		})
	},
	/**
	 * 保存Value值
	 * @param userId
	 * @param key
	 * @param value
	 * @param callback
	 */
	saveValue(userId, key, value, callback) {
		this.selectValueByKey(userId, key, (data) => {
			if (data && data.length > 0) {
				let sql = "update key_value set value=? where key=?";
				db.transaction((tx) => {
					tx.executeSql(sql, [value, key], (tx, results) => {
							callback("updateSuccess");
						}, (err) => {
							ConsoleUtil.console("qlite.js::::::::" + err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("qlite.js::::::::更新错误，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("qlite.js::::::::更新成功");
				})
			} else {
				let sql = "insert into key_value(key,value) values(?,?)";
				db.transaction((tx) => {
					tx.executeSql(sql, [key, value], (tx, results) => {
							callback("saveSuccess");
						}, (err) => {
							ConsoleUtil.console(err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("qlite.js::::::::保存错误，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("qlite.js::::::::保存成功");
				})
			}
		})
	},
	saveOfflineTime(userId, roomJid, lastTime) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		// ConsoleUtil.console('saveTime接到的jidNode==' + roomJid);
		// ConsoleUtil.console('saveTime接到的lastTime==' + lastTime);
		if (!lastTime) {
			//ToolUtil.getServiceTime();
			lastTime = ToolUtil.getServiceTime();
		}
		let sql = "insert OR REPLACE into offline_msg(room_jid,last_time) values(?,?)";
		let str = [roomJid, lastTime];

		db.transaction((tx) => {
			tx.executeSql(sql, str, (tx, results) => {
					// let len = results.rows.length;
					// ConsoleUtil.console('saveTime成功');
				}, (err) => {
					// ConsoleUtil.console(err);
					// ConsoleUtil.console(writeObj(err))
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("Sqlite.js::::::::保存lastTime失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::保存lastTime成功");
			//ConsoleUtil.console('savelastTime成功');
			// callback();
		})
	},
	selectOfflineTime(userId, roomJid, callback) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "SELECT * FROM offline_msg where 1=1 ";
		let params = [];
		if (roomJid != '') {
			sql += 'and room_jid=?';
			params.push(roomJid);
		}
		db.transaction((tx) => {
			tx.executeSql(sql, params, (tx, results) => {
					let talkers = [];
					let len = results.rows.length;
					for (let i = 0; i < len; i++) {
						let talker = results.rows.item(i);
						// if (talker && !talker.newest_time) {
						// 	talker.newest_time = talker.create_time;
						// }
						talkers.push(talker);
					}
					//ConsoleUtil.console("selectTalker查询message列表结果：");
					//ConsoleUtil.console(talkers);
					callback(talkers);
				}, (err) => {
					ConsoleUtil.console(err);
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("qlite.js::::::::查询offline_msg错误，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("qlite.js::::::::查询offline_msg成功");
		})
	},
	updateOfflineTime(userId, roomJid, lastTime) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		this.selectOfflineTime(userId, roomJid, (data) => {
			ConsoleUtil.console("qlite.js::::::::查询成功，返回结果：" + data);
			if (data && data.length > 0) {
				ConsoleUtil.console("qlite.js::::::::查到消息记录，进入更新");
				let sql = "update offline_msg set last_time=? where room_jid=?";
				db.transaction((tx) => {
					tx.executeSql(sql, [lastTime, roomJid], (tx, results) => {
							//ConsoleUtil.console("update time updateSuccess");
						}, (err) => {
							ConsoleUtil.console("qlite.js::::::::" + err);
						}
					);
				}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
					ConsoleUtil.console("qlite.js::::::::更新错误，错误详情：" + writeObj(err));
				}, () => {
					ConsoleUtil.console("qlite.js::::::::更新成功");
				})
			} else if (data) {
				ConsoleUtil.console("qlite.js::::::::没查到消息记录，新增");
				this.saveOfflineTime(userId, roomJid, lastTime);
			}
		});
	},
	deleteOfflineTime(userId, roomJid) {
		if (userid == "") {
			this.initConstant(userId);
		}
		if (!db) {
			this.open();
		}
		let sql = "delete from offline_msg where room_jid = ?";
		db.transaction((tx) => {
			tx.executeSql(sql, [roomJid], (tx, results) => {
				}, (err) => {
				}
			);
		}, (err) => {//所有的 transaction都应该有错误的回调方法，在方法里面打印异常信息，不然你可能不会知道哪里出错了。
			ConsoleUtil.console("Sqlite.js::::::::删除lastTime失败，错误详情：" + writeObj(err));
		}, () => {
			ConsoleUtil.console("Sqlite.js::::::::删除lastTime成功");
		})
	},
	close() {
		if (db) {
			db.close();
			ConsoleUtil.console("qlite.js::::::::关闭数据库");
		} else {
			ConsoleUtil.console("qlite.js::::::::数据库没有打开");
		}
		db = null;
	}
}

//将object转为字符串输出打印
function writeObj(obj) {
	let description = "";
	for (let i in obj) {
		let property = obj[i];
		description += i + " = " + property + "\n";
	}
	return description;
}