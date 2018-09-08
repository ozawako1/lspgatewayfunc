
const my_config = require("../conf/lspgateway.js");
const my_crypto = require('crypto');
/* FORMAT of conf/lspgateway.js 
var config = {};
config.chatwork = {
    "token": "xxxxx"
};
config.sqlserver = {
    "userName": "xxx",
    "password": "xxx",
    "server": "xxx.database.windows.net",
    "options":{
		"useColumnNames": true,
        "rowCollectionOnRequestCompletion": true,
        "encrpyt": true,
        "database": "xxx"
    }
};
module.exports = config;
*/

const TO_REG = /\[To:[0-9]*\].*\n/;
const ME_ID = 2642322;

function format_msg(jdata) 
{
    var msg = "";

    if (jdata.length == 0) {
        msg += "Sorry, i could not find it ...\r\n";
    } else {
		msg += 'Hi, did you mean ... ?  (nod)';
		jdata.forEach(function(obj){
			msg += "[info]";
			msg += "コンピューター名: "  + obj["machine"].value + "\r\n";
			msg += "ログオンユーザー名: "    + obj["logon_user"].value + "\r\n";
			msg += "IPアドレス: "    + obj["ip_address"].value + "\r\n";
			msg += "MACアドレス: "   + obj["mac_address"].value + "\r\n";

			msg += "OS Version: "    + obj["os_version"].value + "\r\n";
			msg += "32bit/64bit: "   + obj["platform"].value + "\r\n";
			msg += "MR Version: "    + obj["mr_version"].value + "\r\n";
			msg += "Cylance Version: "    + obj["cylance_version"].value + "\r\n";
			msg += "最終更新日時: "  + obj["update_date"].value + "\r\n";
			msg += "[/info]";
		});
    }
    msg += "Running On Azure Functions.";
    return msg;
};


class CWebServiceChatwork {
    constructor (req) {

		this.request = req;
		this.httpclient = require("request");;
		
		this.orgmsgbody = req.body.webhook_event.body; 
        this.msgbody = this.orgmsgbody.replace(TO_REG, '');
        this.returnurl = "https://api.chatwork.com/v2/rooms/" + req.body.webhook_event.room_id + "/messages";
        
        this.roomid = req.body.webhook_event.room_id;
        this.fromid = req.body.webhook_event.account_id;
		this.msgid = req.body.webhook_event.message_id;
		
	}
	
	is_to_me(){
		var ret = false;
		if (this.orgmsgbody.indexOf("[To:" + ME_ID + "]", 0) == 0) {
			ret = true;
		}
		return ret;
	}

	is_from_chatwork(){
		var ret = false;

		if (my_config.env.runningon != "Local") {

			var signature = this.request.headers["x-chatworkwebhooksignature"];
			var webhooktoken = my_config.chatwork.webhookToken;
			var rawbody = this.request.rawbody;

			var secretKey = new Buffer(webhooktoken, 'base64');
			var hmac = my_crypto.createHmac('sha256', secretKey);	
			var hash = hmac.update(rawbody).digest('base64');
			
			if (hash == signature) {
				ret = true;
			}
		} else {
			// Maybe Local Debug, No check.
			ret = true;
		}
	
		return ret;
	}

	GetMsgBody() {
		return this.msgbody;
	}
    
    MakeResponse(results){
        
        var msg = "[rp aid=" + this.fromid + " to=" + this.roomid + "-" + this.msgid +"]" + "\r\n" +
            format_msg(results);

        var response = {
            headers: {
                'X-ChatWorkToken': my_config.chatwork.postToken
            },
            form: {
                body: msg
            } 
        };
             
        this.httpclient.post(this.returnurl, response, function (err, res, body) { 
            if (!err && res.statusCode == 200) {
              console.log(body);
            } else {
              console.log(body);
            }   
        });

    }
}

module.exports.CWebServiceChatwork = CWebServiceChatwork
