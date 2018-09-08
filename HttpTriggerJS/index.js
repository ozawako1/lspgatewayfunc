
var webservice = require("./webserviceaz.js");
const my_config = require("../conf/lspgateway.js");
const my_crypto = require('crypto');
var Connection = require('tedious').Connection;
var TedRequest = require('tedious').Request;  
var TYPES = require('tedious').TYPES;

const JOSYSBOT_ID = 2642322;

function executeStatement(obj, connection, target){ 
	console.log("executeStatement start"); 
	
	var results = [];
    var query = "SELECT " +
		"machine, logon_user, ip_address, mac_address, "+
		"os_version, platform, "+
		"mr_version, cylance_version, update_date " + 
		"FROM V_INVENTORIES " +
		"WHERE ip_address = @ipaddr OR machine = @machine " +
		"ORDER BY machine, logon_user DESC";

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



function getInvInfo(target, obj)
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

function is_chatwork(rawbody, signature)
{
	var ret = false;

	if (my_config.env.runningon != "Local") {

		var secretKey = new Buffer(my_config.chatwork.webhookToken, 'base64');
		var hmac = my_crypto.createHmac('sha256', secretKey);

		var x = hmac.update(rawbody).digest('base64');
		var y = signature;

		if (x == y) {
		ret = true;
		}
	} else {
		// Maybe Local Debug, No check.
		ret = true;
	}

	return ret;
}
  
  //////

module.exports = function (context, req) 
{
	context.log('JavaScript HTTP trigger function processed a request.');
	context.log(req);

	var obj = null;
	var msgbody = "";

	var rawbody = req.rawBody;
	var signature = req.headers["x-chatworkwebhooksignature"];

	// ChatworkからのWebhookか確認
	if (is_chatwork(rawbody, signature) == false) {
		context.log("Not Chatwork.");
		httpret = 403;
	} else {
		// 情シスbot宛かの確認。
		if ( req.body.webhook_event.body.indexOf("[To:" + JOSYSBOT_ID + "]", 0) == 0) {
			obj = new webservice.CWebServiceChatwork(req);
			msgbody = obj.GetMsgBody();
			getInvInfo(msgbody, obj);
		}
		httpret = 200;
	}

	context.res = {
		status: httpret,
		body: "req:[" + msgbody + "]"
	};
	context.done();
    
};
