
var webservice = require("./webserviceaz.js");
const my_config = require("../conf/lspgateway.js");
const my_crypto = require('crypto');

var Connection = require('tedious').Connection;
var TedRequest = require('tedious').Request;  
var TYPES = require('tedious').TYPES;

const JOSYSBOT_ID = 2642322;

function executeStatement(obj, connection, query){ 
  console.log("executeStatement start"); 
  queryrequest = new TedRequest(query, function(err){
    if (err) {
      console.log(err);
    }
  });  

  var results = {};
  var count = 0;  
  console.log("executeStatement request");

  queryrequest.on('row', function(columns) {  
    columns.forEach( function(column) {
      var val = '';
      if (column.value != null) {
        val = column.value;
      }
                
      switch (count) {
      case 0:
        results["PCName"] = val; 
        break;
      case 1:
        results["LogonUserName"] = val; 
        break;
      case 2:
        results["IPAddr"] = val; 
        break;
      case 3:
        results["MACAddr"]= val;  
        break;
      case 4:
        results["OSVersion"]= val;  
        break;
      case 5:
        results["Platform"]= val;  
        break;
      case 6:
        results["MRVersion"]= val;  
        break;
      case 7:
        results["CylanceVersion"]= val;  
        break;
      case 8:
        results["InvInfoUpdateTime"]= val;  
        break;
      } 
      count++;  
    });
  });

  queryrequest.on('requestCompleted', function(rowCount, more){
    console.log('reqCompleted');
    connection.close();
    obj.MakeResponse(results);
    console.log(results);
  });

  connection.execSql(queryrequest);

  console.log("executeStatement end");
  return JSON.stringify(results);
}



function getInvInfo(target, obj){

  console.log("getInvInfo Start [" + target + "]");

  var config = my_config.sqlserver;
  var query = "SELECT " +
    "machine, logon_user, ip_address, mac_address, "+
    "os_version, platform, "+
    "mr_version, cylance_version, update_date " + 
    "FROM V_INVENTORIES " +
    "WHERE ip_address = '"+target+"' OR machine = '"+target+"' " +
    "ORDER BY machine, logon_user DESC";

  //CreateConnection
  var connection = new Connection(config);

  connection.on('connect', function(err) {  
    if(err){
      //Error Handling
      console.log("conn failure." + err.message);
    } else {  
      // If no error, then good to proceed.
      console.log("Connected");
      console.log("getInvInfo Query="+query);
      resultjson = executeStatement(obj, connection, query);
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
    // No check.
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
