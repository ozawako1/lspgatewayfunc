
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

function format_msg(jdata) {
    /*
    {
        "PCName":"13P1-0905a",
        "LogonUserName":"",
        "IPAddr":"192.168.120.1",
        "MACAddr":"b8e8561206da",
        "OSVersion":"macOS 10.13.3 (17D102)",
        "Platform":"",
        "InvInfoUpdateTime":"2018-03-23T08:37:00.000Z",
        "MRVersion":"A9000"
    }
    */
    msg = "";

    var resultcount = Object.keys(jdata).length;

    if (resultcount === 0) {
        msg += "Sorry, i could not find it ...\r\n";
    } else {

        msg += 'Hi, did you mean ... ?  (nod)';
        msg += "[info]";
        if (jdata.length === 0) {
            msg += "not found.";
        } else {
            msg += "コンピューター名: "  + jdata["PCName"] + "\r\n";
            msg += "ログオンユーザー名: "    + jdata["LogonUserName"] + "\r\n";
            msg += "IPアドレス: "    + jdata["IPAddr"] + "\r\n";
            msg += "MACアドレス: "   + jdata["MACAddr"] + "\r\n";

            msg += "OS Version: "    + jdata["OSVersion"] + "\r\n";
            msg += "32bit/64bit: "   + jdata["Platform"] + "\r\n";
            msg += "MR Version: "    + jdata["MRVersion"] + "\r\n";
            msg += "Cylance Version: "    + jdata["CylanceVersion"] + "\r\n";
            msg += "最終更新日時: "  + jdata["InvInfoUpdateTime"] + "\r\n";
        }

        msg += "[/info]";
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
        msg = "[rp aid=" + this.fromid + " to=" + this.roomid + "-" + this.msgid +"]" + "\r\n" +
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
