var myutil = require('./util.js');
//require("request");

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

class CWebServiceChatwork extends CWebServiceAz {
    constructor (req) {
        super(req);
        var orgmsgbody = req.body.webhook_event.body;
        this.msgbody = orgmsgbody.replace(TO_REG, '');
        this.returnurl = "https://api.chatwork.com/v2/rooms/" + req.body.webhook_event.room_id + "/messages";
        
        this.roomid = req.body.webhook_event.room_id;
        this.fromid = req.body.webhook_event.account_id;
        this.msgid = req.body.webhook_event.message_id;
        this.token = myutil.get_config("chatwork", "token");
    }
    
    GetReplyMsg(results) {
        msg = "[rp aid=" + this.fromid + " to=" + this.roomid + "-" + this.msgid +"]" + "\r\n" +
            myutil.format_msg(results);

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
