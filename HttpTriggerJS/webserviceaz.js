
const my_config = require("../conf/lspgateway.js");
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
        "encrpyt": true,
        "database": "xxx"
    }
};
module.exports = config;
*/

const TO_REG = /\[To:[0-9]*\].*\n/;

class CWebServiceAz {
    constructor ( req ) {
        this.request = req;
        this.useragent = req.headers["user-agent"];

        this.msgbody = req.body;
        this.returnurl = "";
        this.resmsg = "";

        this.httpclient = require("request");;
    }

    GetMsgBody() {
        return (this.msgbody === undefined ? "" : this.msgbody);
    }

    GetReplyUrl() {
        return this.returnurl;
    }

    GetReplyMsg(results) {
        return results;
    }

    GetReplyMsg(){
        return this.results;
    }
    
    GetReply() {
        return this.resmsg;
    }

    MakeResponse(results) {
        return results;
    }
}

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


class CWebServiceChatwork extends CWebServiceAz {
    constructor (req) {
        super(req);
        var orgmsgbody = req.body.webhook_event.body;
        this.msgbody = orgmsgbody.replace(TO_REG, '');
        this.returnurl = "https://api.chatwork.com/v2/rooms/" + req.body.webhook_event.room_id + "/messages";
        
        this.roomid = req.body.webhook_event.room_id;
        this.fromid = req.body.webhook_event.account_id;
        this.msgid = req.body.webhook_event.message_id;
        this.token = my_config.chatwork.postToken;
        this.webhooktoken = my_config.chatwork.webhookToken;
    }
    
    GetReplyMsg(results) {
        var msg = "[rp aid=" + this.fromid + " to=" + this.roomid + "-" + this.msgid +"]" + "\r\n" +
            format_msg(results);

        var response = {
            headers: {
                'X-ChatWorkToken': this.token
            },
            form: {
                body: msg
            } 
        };
        
        this.resmsg = response;

        return response;
    }

    MakeResponse(results){
        
        var response = this.GetReplyMsg(results);
     
        this.httpclient.post(this.returnurl, response, function (err, res, body) { 
            if (!err && res.statusCode == 200) {
              console.log(body);
            } else {
              console.log(body);
            }   
        });

    }
}

module.exports.CWebServiceAz = CWebServiceAz
module.exports.CWebServiceChatwork = CWebServiceChatwork
