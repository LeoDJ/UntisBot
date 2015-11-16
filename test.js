var https = require('https');
var cookie = require('cookie');




var cookies = "";

function init(callback)
{
	var options = {
		host: "melpomene.webuntis.com",
		path: "/WebUntis/?school=WMS-Heilbronn",
		method: 'GET'
	};
	doReq(options, "");
	callback();
}
init(getData);


/*var data = {"id":"ID","method":"getKlassen","params": {},"jsonrpc":"2.0"};
data = JSON.stringify(data);*/
function getData()
{
	var data = "ajaxCommand=getWeeklyTimetable&elementType=1&elementId=1971&date=20151026&filter.klasseId=-1&filter.restypeId=-1&filter.buildingId=-1&filter.roomGroupId=-1&filter.departmentId=-1&formatId=6";

	var options = {
		host: "melpomene.webuntis.com",
		path: "/WebUntis/Timetable.do?request.preventCache=1447063261",
		method: 'POST',
		headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Referer': 'https://melpomene.webuntis.com/WebUntis/?school=WMS-Heilbronn',
		'Cookie' :  cookies
		}
	};

	doReq(options, data);
}


function doReq(options, data, callback)
{
	var req = https.request(options, function(response){
		if(response.headers["set-cookie"])
	    {
	    	cookies = response.headers["set-cookie"][0].split(';')[0];
	    	cookies += "; " + response.headers["set-cookie"][1].split(';')[0];
	    }
	    //cks = cookie.parse(response.headers["set-cookie"]);
	    console.log("COOKIES::::",cookies);
	    logResponse(response, function(data) {});
	});

	req.on('error', function(e) {
	    console.log('problem with request: ' + e.message);
	});

	req.write(data);
	req.end();
}


function logResponse(response, callback)
{
	console.log(response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));

    //console.log('COOKIES: ' + response.headers["set-cookie"]);
    response.setEncoding('utf8');

	var data = "";
    response.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
		data += chunk;
    });
    response.on('end', function() {
		callback(data);
	});
}