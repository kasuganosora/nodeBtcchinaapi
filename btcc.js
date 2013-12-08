// SionZeng 2013年12月07日
// Bitcoin China API

var m_request = require('request');
var crypto = require('crypto');



function Btcchina(accessKey,secretKey){
    this.accessKey = accessKey;
    this.secretKey = secretKey;
}


Btcchina.hash_hmac = function (str,key){
	var hash = crypto.createHmac('sha1',key);
	hash.update(str);
	return hash.digest("hex")
}

Btcchina.Error ={
    "-32000":   "内部错误",
    "-32003":   "人民币账户余额不足",
    "-32004":   "比特币账户余额不足",
    "-32005":   "挂单没有找到",
    "-32006":   "无效的用户",
    "-32007":   "无效的货币",
    "-32008":   "无效的金额",
    "-32009":   "无效的钱包地址",
    "-32010":   "没有找到提现记录",
    "-32011":   "没有找到充值记录",
    "-32017":   "无效的类型",
    "-32018":   "无效的价格",
    "-32019":   "无效的参数"
};

Btcchina.prototype.request = function request(httpMethod,btcc_method,params,callback){
     var accessKey = this.accessKey; 
     var secretKey = this.secretKey;

    httpMethod = "POST";//现在只支持POST
    var tonce = (new Date()).getTime() *1000; 
    var rpcID = parseInt(Math.random()*10000,10);  //(JSON-RPC 请求 id)
    //生成签名字符串
    var signStr = (function(){
    	var sObj = {
    		tonce: tonce,
    		accesskey: accessKey,
    		requestmethod: httpMethod.toLowerCase(),
    		id: rpcID,
    		method: btcc_method,
    		params: params.join(",")
    	};
    	var rawSignStr = "";

    	for (var key in sObj){
    		rawSignStr += key + "=" + sObj[key] + "&";
    	}
    	rawSignStr = rawSignStr.replace(/&$/,"")

    	return new Buffer(accessKey+":"+ Btcchina.hash_hmac(rawSignStr,secretKey)).toString('base64');
    })();


    var postDATA = JSON.stringify({
    	method: btcc_method,
    	params: params,
    	id: rpcID
    });

    var opt = {
    	url: 'https://api.btcchina.com/api_trade_v1.php',
    	method: httpMethod.toUpperCase(),
        followAllRedirects: true,

    	headers: {
    		"Authorization": "Basic " + signStr,
    		"Json-Rpc-Tonce": tonce,
    		'Content-Type': 'application/x-www-form-urlencoded',
    		'Content-Length': postDATA.length
    	},
        body: postDATA
    };

    //开始发起请求
    var req = m_request(opt,function(error, response, body){
        if(!error && response.statusCode == "200"){
            var data = JSON.parse(body);
            callback(true,data);
        }else{
            error.statusCode = response.statusCode ? response.statusCode : 0;
            callback(false,error);
        }
    });

}


// 下比特币买单。
// price    number  是   买 1 比特币所用人民币的价格，最多支持小数点后 5 位精度
// amount   number  是   要买的比特币数量，最多支持小数点后 8 位精度
// 返回
// result   boolean     如果下单成功，返回 true
Btcchina.prototype.buyOrder = function(price,amount,callback){
    this.request("POST","buyOrder",[price,amount],callback);
};




// cancelOrder
// 取消一个还未完全成交的挂单，其状态应该为“open”。
// 参数
// Name     类型     必选？     描述
// id      number      是   要取消的挂单的 ID
// 返回
// result   boolean     如果取消挂单成功，返回 true
Btcchina.prototype.cancelOrder = function(id,callback){
    this.request("POST","cancelOrder",[id],callback);
};


// requestWithdrawal
// 发起比特币提现请求。
// 参数
// 名称          类型      必选？     描述
// currency     string     是   货币代码。可能值：BTC 或 CNY
// amount       number     是   提现金额

// 返回
// 名称      类型          描述
// result   integer     返回提现 ID
Btcchina.prototype.requestWithdrawal = function(currency,amount,callback){
    this.request("POST","requestWithdrawal",[currency,amount],callback);
};


// sellOrder
// 下比特币卖单。
// 参数
// 名称      类型      必选？     描述
// price    number     是       卖 1 比特币所用人民币的价格，最多支持小数点后 5 位精度
// amount   number     是       要卖的比特币数量，最多支持小数点后 8 位精度
// 返回
// 名称      类型          描述
// result   boolean     如果下单成功，返回 true。
Btcchina.prototype.sellOrder = function(price,amount,callback){
    this.request("POST","sellOrder",[price,amount],callback);
};





//getAccountInfo
// 获取账户信息和余额
// 参数 无
// 返回
// result   object[]    包含如下对象：profile, balance, frozen
Btcchina.prototype.getAccountInfo = function(callback){
    this.request("POST","getAccountInfo",[],callback);
};




// getDeposits
// 获得用户全部充值记录。
// 参数
// 名称          类型      必选？     描述
// currency     string     是   目前仅支持“BTC”
// pendingonly  boolean    否   默认为“true”。如果为“true”，仅返回尚未入账的比特币充值

// 返回
// 名称   类型  描述
// result   object[]    包含对象：deposit
Btcchina.prototype.getDeposits = function(currency,pendingonly,callback){
    this.request("POST","getDeposits",[currency,pendingonly],callback);
};


// getMarketDepth2
// 获得完整的市场深度。返回全部尚未成交的买单和卖单。
// 参数
// 名称      类型      必选？     描述
// limit    integer     否   限制返回的买卖单数目。默认是买单卖单各10条。
// 返回
// 名称      类型      描述
// result   object  对象数组：market_depth
Btcchina.prototype.getMarketDepth2 = function(limit,callback){
    var params = [];
    if(limit){
        params.push(limit);
    }
    this.request("POST","getMarketDepth2",params,callback);
};



// getOrder
// 获得挂单状态。
// 参数
// 名称      类型      必选？     描述
// id      number      是       挂单 ID
// 名称      类型      描述
// result   object  返回对象：order
Btcchina.prototype.getOrder = function(id,callback){
    this.request("POST","getOrder",[id],callback);
};


// getOrders
// 获得全部挂单的状态。
// 参数
// 名称          类型        必选？     描述
// openonly     boolean     否   默认为“true”。如果为“true”，仅返回还未完全成交的挂单。
// 返回
// 名称      类型          描述
// result   object[]    对象数组：order
Btcchina.prototype.getOrders = function(openonly,callback){
    this.request("POST","getOrders",[openonly],callback);
};



// getTransactions
// 获取交易记录。
// 参数
// 名称      类型      必选？     描述
// type     string     否   按类型获取交易记录。默认为“all”（全部）。可用类型包括： 'all | fundbtc | withdrawbtc | fundmoney | withdrawmoney | refundmoney | buybtc | sellbtc | tradefee'
// limit    integer    否   限制返回的交易记录数，默认为 10。
// 返回
// 名称     类型           描述
// result   object[]   交易记录对象数组
Btcchina.prototype.getTransactions = function(type,limit,callback){
    this.request("POST","getTransactions",[type,limit],callback);
};


// getWithdrawal
// 获取提现状态。
// 参数
// 名称      类型      必选？     描述
// id      number      是       提现 ID
// 返回
// 名称      类型      描述
// result   object  返回对象：withdrawal
Btcchina.prototype.getWithdrawal = function(id,callback){
    this.request("POST","getWithdrawal",[id],callback);
};



// getWithdrawals
// 获取全部提现记录。
// 参数
// Name        类型          必选？     描述
// currency     string         是   目前仅支持“BTC”
// pendingonly  boolean        否   默认为“true”。如果为“true”，仅返回尚未处理的提现记录
// 返回
// 名称        类型        描述
// result   object[]    对象数组：withdrawal
Btcchina.prototype.getWithdrawals = function(currency,pendingonly,callback){
    this.request("POST","getWithdrawals",[currency,pendingonly],callback);
};


//导出到模块里
module.exports = Btcchina;


