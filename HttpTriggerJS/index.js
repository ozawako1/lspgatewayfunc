
var webservice = require("./webserviceaz.js");
//
var myutil = require('./util.js');
//
var Connection = require('tedious').Connection;
var TedRequest = require('tedious').Request;  
var TYPES = require('tedious').TYPES;
//
const PCName_ext = /[^a-zA-Z0-9!-/:-@･[-`{-~]/g;
const IPAddr_check = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
const IPAddr_ext = /\b((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b/;

const JOSYSBOT_ROOM = 82461612;
const JOSYSBOT_ID = 2642322;

function get_ipaddr_from_msg(msg){

    var ret = "";
  
    var IPreg = new RegExp(IPAddr_check);
    if (IPreg.test(msg)) {
        //IP
        ret = msg.match(IPAddr_ext)[0];
    }
  
    return ret;
  
  }
  
  function get_machinename_from_msg(msg){
  
    var ret = "";
  
    var IPreg = new RegExp(IPAddr_check);
    if (IPreg.test(msg) == false) {
        //no IP
        ret = msg.replace(PCName_ext, "");
    }
  
    return ret;
  
  }

function getInvInfo(ip, host, obj){

    console.log("getInvInfo Start IP="+ip+" Host="+host);
  
    var resultjson = {};
    var config = myutil.get_dbconn_config();

    var query = "SELECT machine, logon_user, ip_address, mac_address, os_version, "
    + "CASE WHEN platform = 0 THEN '32' ELSE (CASE WHEN platform = 1 THEN '64' ELSE platform END) END platform, "
    + "CASE WHEN update_date IS NULL THEN receive_date ELSE (CASE WHEN receive_date IS NULL THEN update_date ELSE (CASE WHEN receive_date > update_date THEN receive_date ELSE update_date END) END) END update_date, "
    + "mr_version " 
    + "FROM VINVENTORIES "
    if(ip){
      query += "WHERE ip_address = '"+ip+"' ";
    } else {
      query += "WHERE machine = '"+host+"' ";
    }
    query += "order by machine, logon_user DESC;";

    //CreateConnection
    var connection = new Connection(config);
        
    connection.on('connect', function(err) {  
      if(err){
        //Error Handling
      } else {  
        // If no error, then good to proceed.
        console.log("Connected");
        console.log("getInvInfo Query="+query);
        resultjson = executeStatement(query, obj);
      }
    });
    
    connection.on('end', function(err){
      console.log("connection End");
    });
  
    function executeStatement(query)
    { 
      console.log("executeStatement start"); 
      queryrequest = new TedRequest(query, function(err){
        if (err) {
          console.log(err);
        }
      });  
  
      var result = "";
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
            results["InvInfoUpdateTime"]= val;  
            break;
          case 7:
            results["MRVersion"]= val;  
            break;
          } 
          count++;  
        });
      });
      
      queryrequest.on('requestCompleted', function(rowCount, more){
        console.log('reqCompleted');
        connection.close();
        obj.MakeResponse(results);       
      });
      
      connection.execSql(queryrequest);
      
      console.log("executeStatement end");
      return JSON.stringify(results);
    }
  }
  
  //////

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    var obj = null;
    var msgbody = "";
    var ipaddr = "";
    var pcname = "";

    // 通信相手（user_agent）を見て、switch
    var ua = req.headers["user-agent"]; 
    if (ua.indexOf("ChatWork-Webhook/", 0) === 0) {
        //Chatwork
        console.log("access from chatwork.");
        // 情シスbot宛かの確認。
        if ( req.body.webhook_event.body.indexOf("[To:" + JOSYSBOT_ID + "]", 0) === 0) {
          obj = new webservice.CWebServiceChatwork(req);
        }
      } else {
        // それ以外
        console.log("access from others.");
        obj = new webservice.CWebServiceAz(req);
    }

    if ( obj != null) {
      msgbody = obj.GetMsgBody();
      ipaddr = get_ipaddr_from_msg(msgbody);
      pcname = get_machinename_from_msg(msgbody);      
      // in this method, reply message has been sent. update is needed.
      getInvInfo(ipaddr, pcname, obj);
    }

    context.res = {
      status: 200,
      body: "Hello, i have checked about [" + msgbody + "]"
    };
    context.done();
    
};
