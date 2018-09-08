
const my_webservice = require("./webservice.js");
const my_config = require("../conf/lspgateway.js");

var Connection = require('tedious').Connection;
var TedRequest = require('tedious').Request;  
var TYPES = require('tedious').TYPES;

function executeStatement(obj, connection, target){ 
	console.log("executeStatement start"); 
	
	var results = [];
	var query = "SELECT " +
					"machine, logon_user, ip_address, mac_address, os_version, platform, "+
					"mr_version, cylance_version, update_date " + 
				"FROM "+
					"V_INVENTORIES " +
				"WHERE "+
					"ip_address = @ipaddr OR machine = @machine " +
				"ORDER BY "+
					"machine, logon_user DESC";

    var queryrequest = new TedRequest(query, function(err, rowCount, rows){
		if (err) {
			console.log("DBreq error:" + err.message);
		} else {
			console.log(rowCount + " row(s) found.");
			rows.forEach(function(row){
				results.push(row);
			});
		}
	});  
	
	queryrequest.addParameter('ipaddr', TYPES.NVarChar, target);
	queryrequest.addParameter('machine', TYPES.NVarChar, target);

    queryrequest.on('requestCompleted', function(rowCount, more){
		console.log('reqCompleted');
		console.log(results);
		
		connection.close();
		obj.MakeResponse(results);
    });

    connection.execSql(queryrequest);
}



function getInvInfo(obj, target)
{

	console.log("getInvInfo Start [" + target + "]");

	//CreateConnection
	var connection = new Connection(my_config.sqlserver);

	connection.on('connect', function(err) {  
		if(err){
			//Error
			console.log("conn failure." + err.message);
		} else {  
			console.log("Connected");
			executeStatement(obj, connection, target);
		}
	});

	connection.on('end', function(err){
		console.log("connection End");
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
		getInvInfo(obj, msgbody);
	}

	context.res = {
		status: 200,
		body: "req:[" + msgbody + "]"
	};

	context.done();
    
};
