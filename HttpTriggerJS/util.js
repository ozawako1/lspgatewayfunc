var fs = require('fs');

const CONFIG = "../conf/lspgateway.ini";



function _get_config(section, key)
{
    //console.log(process.cwd());
    var json = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
    return json[section][key];
};

exports.get_config = function(section, key) 
{
    return _get_config(section, key);    
};

exports.get_dbconn_config = function()
{

    var hash = {};
    hash['userName'] = _get_config("sqlserver", "id");
    hash['password'] = _get_config("sqlserver", "password");
    hash['server'] = _get_config("sqlserver", "host");
    hash['options'] = {};
    hash['options']['encrypt'] = true;
    hash['options']['database'] = _get_config("sqlserver", "database");

    return hash;
    
    /*
    var config = {  
        userName: 'SqlServerAdmin',  
        password: 'xxxx',  
        server: '127.0.0.1',   
        options: {
          encrypt:  true, 
          database: 'xxxx'
        }  
    };
    */
};

exports.format_msg = function(jdata) {
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
            msg += "最終更新日時: "  + jdata["InvInfoUpdateTime"] + "\r\n";
            msg += "MR Version: "    + jdata["MRVersion"] + "\r\n";
        }

        msg += "[/info]";
    }
    msg += "Running On Azure Functions.";
    return msg;
};

