var https = require('https');
var cookie = require('cookie');
var util = require('util');

var school = "WMS-Heilbronn";
var classID = "1971";
var date = "20151116";


var cookies = "";

function init(callback)
{
	var options = {
		host: "melpomene.webuntis.com",
		path: "/WebUntis/?school=" + school,
		method: 'GET'
	};
	doReq(options, "", getData);
}
init(getData);


/*var data = {"id":"ID","method":"getKlassen","params": {},"jsonrpc":"2.0"};
data = JSON.stringify(data);*/
function getData()
{
	var data = "ajaxCommand=getWeeklyTimetable&elementType=1&elementId=" + classID + "&date=" + date + "&filter.klasseId=-1&filter.restypeId=-1&filter.buildingId=-1&filter.roomGroupId=-1&filter.departmentId=-1&formatId=6";

	var options = {
		host: "melpomene.webuntis.com",
		path: "/WebUntis/Timetable.do?request.preventCache=1447063269",
		method: 'POST',
		headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Referer': 'https://melpomene.webuntis.com/WebUntis/?school=WMS-Heilbronn',
		'Cookie' :  cookies
		}
	};

	doReq(options, data, process);
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
	    logResponse(response, callback);
	});

	req.on('error', function(e) {
	    console.log('problem with request: ' + e.message);
	});

	req.write(data);
	req.end();
}


function logResponse(response, callback)
{
	//console.log(response.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(response.headers));

    //console.log('COOKIES: ' + response.headers["set-cookie"]);
    response.setEncoding('utf8');

	var data = "";
    response.on('data', function (chunk) {
        data += chunk;
    });
    response.on('end', function() {
    	//if (data != "") console.log('BODY: ' + data);
		callback(data);
	});
}


function process(data)
{
	parsedData = {};
    data = JSON.parse(data);
    elementPeriods = data["result"]["data"]["elementPeriods"][classID];
    elements = data["result"]["data"]["elements"];
    

    elementPeriods.forEach(function(i){
    	var dDate = i["date"].toString();
    	var dTime = i["startTime"].toString() + "-" + i["endTime"].toString();
    	if(parsedData[dDate] == undefined)
    		parsedData[dDate] = {};
    	if(parsedData[dDate][dTime] == undefined)
    		parsedData[dDate][dTime] = [];
    	
    	
    	i.elements.forEach(function(e){ //parse those "elements"
    		if(i.data == undefined)
    			i.data = {};
    		if(i.data.classes == undefined)
    			i.data.classes = [];

    		var rData = resolve(elements, e.type, e.id);
    		switch(e.type)
    		{
    			case 1:
    				i.data.classes.push(rData.name);
    				break;
    			case 2:
    				i.data.teacher = rData.longName;
    			case 3:
    				i.data.shortSubjName = rData.name;
	    			i.data.longSubjName = rData.longName;
	    			i.data.backColor = rData.backColor;
	    			i.data.foreColor = rData.foreColor;
	    			break;
	    		case 4:
	    			i.data.room = rData.name;
	    			i.data.roomTeacher = rData.longName;
	    			break;
    		}
    	});

    	parsedData[dDate][dTime].push(i); 
    });
	
    //console.log(util.inspect(parsedData["20151116"], false, null));
    toText(parsedData, "20151117", elements);

}


function resolve(elements, type, id)
{
	var ret = {};
	elements.forEach(function(e){
		if(e.type==type && e.id==id)
			ret = e;
	});
	return ret;
}


function toText(parsedData, date, elements)
{
	parsedData = parsedData[date];
	parsedData
	
	rDate = date.substring(6,8) + "." + date.substring(4,6) + "." + date.substring(0,4);
	s = "";
	keys = Object.keys(parsedData);
	s += resolve(elements, 1, classID).name;
	s += ", " + rDate + ":\n";
	keys.forEach(function(time){
		s += time + ": ";
		var firstLes = true;
		parsedData[time].forEach(function(lesson){
			if (!firstLes)
				s += " | ";
			if(lesson.data.cellState == 'CANCEL')
				s += "[X] ";
			else if(lesson.data.cellState == 'ADDITIONAL')
				s += "[V] ";
			s += lesson.data.shortSubjName +", ";
			s += lesson.data.room;
			firstLes = false;
		});
		s += "\n";
	});
	console.log(s);
}