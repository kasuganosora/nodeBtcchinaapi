nodeBtcchinaapi
===============

比特币中国API

安装
```
npm install btcc
```

初始化api对象
```
var Btcchina = require('btcc');
var client = new Btcchina("Access Key","Secret Key");
```

试用例子
```
client.getAccountInfo(function(ok,data){
	if(ok){
		console.log(data);
	}
});

```

其中的回调函数原型
```
function (success,data){}
```
如果 success 为 true的时候,代表调用成功 data 为服务器返回的信息
false 的时候为调用失败,data 为错误信息

API说明地址
http://btcchina.org/api-trade-documentation-zh#交易_api_v1
