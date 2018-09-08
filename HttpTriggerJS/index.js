
const my_webservice = require("./webservice.js");
const my_config = require("../conf/lspgateway.js");

var Connection = require('tedious').Connection;
var TedRequest = require('tedious').Request;  
var TYPES = require('tedious').TYPES;

var Promise = require('promise');

function db_execquery(connection, target){ 
	console.log("db_execquery."); 
	
	var results = [];
	var query =	"SELECT machine, "	+
						"logon_user, "	+
						"ip_address, "	+
						"mac_address, "	+
						"os_version, "	+
						"platform, "	+
						"mr_version, "	+
						"cylance_version, "	+
						"update_date "	+ 
				"FROM V_INVENTORIES " 	+
				"WHERE ip_address = @ipaddr "	+
						"OR machine = @machine "	+
				"ORDER BY machine, "+
						"logon_user DESC";

	return new Promise((resolve, reject) => {

		var queryrequest = new TedRequest(query, function(err, rowCount, rows){
			if (err) {
				console.log("db_execquery error:" + err.message);
				reject(err);
			} else {
				console.log(rowCount + " row(s) found.");
				rows.forEach(function(row){
					results.push(row);
				});
			}
		});  
		
		queryrequest.addParameter('ipaddr', TYPES.NVarChar, target);
		queryrequest.addParameter('machine', TYPES.NVarChar, target);

		queryrequest.on('requestCompleted', function(){
			console.log('request complete');
			console.log(results);
			
			connection.close();
			resolve(results);
		});

		connection.execSql(queryrequest);
	});
}

function db_conn()
{
	console.log("db_conn");

	return new Promise((resolve, reject) => {
		//CreateConnection
		var connection = new Connection(my_config.sqlserver);
		connection.on('connect', function(err) {  
			if(err){
				//Error
				console.log("db_conn failure." + err.message);
				reject(err);
			} else {  
				console.log("db_conn success.");
				resolve(connection);
			}
		});
	});
}

function post_response(obj, results)
{
	return new Promise(() => {
		obj.MakeResponse(results);
	});
}


module.exports = function (context, req) 
{
	context.log('JavaScript HTTP trigger function processed a request.');
	context.log.info(req);

	var obj = null;
	var msgbody = "";

	var obj = new my_webservice.CWebServiceChatwork(req);

	if (obj.is_to_me() && obj.is_from_chatwork()){
		msgbody = obj.GetMsgBody();

		db_conn()
			.then(conn => db_execquery(conn, msgbody))
			.then(results => post_response(obj,results))
			.catch(function(err) {
				context.log("ERROR:" + err.message);
			});
	}

	context.res = {
		status: 200,
		body: "req:[" + msgbody + "]"
	};

	context.done();
    
};
