const widgets = require("sdk/widget");
const tabs = require("sdk/tabs");
const {Cc,Ci} = require("chrome");
const data = require("sdk/self").data;
var Request = require('sdk/request').Request;
const ptn = /http:\/\/www\.dosug\.cz\/en\/[ed]\/girl/;
const ptnName = /<p.*class="girl_name_hdr".*>(\w+)<\/p>/;
const ptnAge = /age - (\d+)/;
const ptnEliteHeight = /height - (\d+)/;
const ptnHeight = /height - .*<span.*>(\d*)<\/span>/;
const ptnEliteBreast = /breast size - (\d+)/;
const ptnBreast = /breast size - .*<span.*>(\d*)<\/span>/;
const ptnElitePhotoes = /number of photos - (\d+)/i;
const ptnPhotoes = ptnElitePhotoes;//number of photos - <b>(\d+)<\/b>/i;
const ptnImages = /\[(".+\d+",?)+\]/ig;
const ptnDigit = /\d{5}\d+/;

const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var archs;
var index;

function replaceAll(str, source, target){
	while(str.indexOf(source)>=0){
		str = str.replace(source, target);
	}
	return str;
}

// 解析照片浏览界面
function parseAlbum(tab){
	// 获取当前window对象
	var mainWindow = wm.getMostRecentWindow("navigator:browser");
	// 获取选中tab对应的browser对象
	var currentBrowser = mainWindow.gBrowser.getBrowserForTab(mainWindow.gBrowser.tabContainer.children[tab.index]);
	if(currentBrowser.contentDocument.body.done)
		return;
	// 打印当前选中tab的html内容
	var doc = currentBrowser.contentDocument.documentElement;
	//console.log(doc.innerHTML);
	archs = doc.getElementsByClassName('image');
	console.log("all a tags is "+archs.length);
	for(index=0;index<archs.length;index++){
		var href = archs[index].children[0].getAttribute('href');
		//console.log("href = "+href);
		if(href.indexOf("girl?")==-1)
			continue;
		var isElite = href.indexOf('elite') > -1;
		//console.log("This Girl is Elite? " + isElite);
		var params = getUrlParams(href);
		var data = new Object();
		data.sid = params["sid"];
		data.gid = params["gid"];
		data.index = index;
		var matchGirlRequest = Request({
			url: "http://127.0.0.1:80/elitedosug/girls/havegirl",
			content: data,
			onComplete: function(response){
				var i = this.content.index;
				var arch = archs[i].children[0];
				var href = arch.getAttribute("href");
				var offset = href.indexOf("?");
				var res = response.text.split(',');
				if(res[0] == "False") {
					//console.log("This girl is not noticed. "+href.substring(offset+1)+".");
					if(arch.children.length > 0)
						arch.children[0].setAttribute("style","box-shadow: 0 14px 0 rgba(128,0,0,0.3);");
					else
						arch.setAttribute("style","box-shadow: 7px 4px 5px rgba(128,0,0,0.3);");
				}
				else {
					console.log("This girl has been noticed. "+href.substring(offset+1)+".");
					if(arch.children.length > 0) {
						arch.children[0].setAttribute("style","box-shadow: 0 14px 0 rgba(0,128,0,0.3);");
						arch.children[0].setAttribute("title",res[1]);
						var str = res[1];
						str = str.replace(":","<br/>");
						str = str.replace("|","<br/>").replace("|","<br/>").replace("|","<br/>").replace("|","<br/>");
						arch.innerHTML = str + arch.innerHTML;
						arch.setAttribute("style","font-size:12px;");
					} else {
						arch.setAttribute("style","box-shadow: 7px 4px 5px rgba(0,128,0,0.3);");
						arch.setAttribute("title",res[1]);
					}
				}
			}
		});
		matchGirlRequest.get();
	}
	currentBrowser.contentDocument.body.done=true;
}

// 解析个人信息界面
function parseGirl(tab){
	// 获取当前window对象
	var mainWindow = wm.getMostRecentWindow("navigator:browser");
	// 获取选中tab对应的browser对象
	var currentBrowser = mainWindow.gBrowser.getBrowserForTab(mainWindow.gBrowser.tabContainer.children[tab.index]);
	if(currentBrowser.contentDocument.body.done)
		return;
	// 打印当前选中tab的html内容
	var html = currentBrowser.contentDocument.body.innerHTML;
	//console.log(doc.innerHTML);
	var isElite = tab.url.indexOf('/e/') > -1;
	var params = getUrlParams(tab.url);
	var girl = new Object();
	if(isElite) {
		girl.sid=params["sid"];
		girl.gid=params["gid"];
		girl.name=html.match(ptnName)[1];
		if(ptnAge.test(html))
			girl.age = html.match(ptnAge)[1];
		if(ptnEliteHeight.test(html))
			girl.height=html.match(ptnEliteHeight)[1];
		if(ptnEliteBreast.test(html))
			girl.breast=html.match(ptnEliteBreast)[1];
		if(ptnElitePhotoes.test(html))
			girl.photoes=html.match(ptnElitePhotoes)[1];
		girl.url = tab.url;
	}
	else {
		girl.sid=params["sid"];
		girl.gid=params["gid"];
		girl.name=html.match(ptnName)[1];
		if(ptnAge.test(html))
			girl.age = html.match(ptnAge)[1];
		if(ptnHeight.test(html))
			girl.height=html.match(ptnHeight)[1];
		if(ptnBreast.test(html))
			girl.breast=html.match(ptnBreast)[1];
		if(ptnPhotoes.test(html))
			girl.photoes=html.match(ptnPhotoes)[1];
		girl.url = tab.url;
	}
	
	console.log(girl.name);
	console.log(girl.age);
	console.log(girl.height);
	console.log(girl.breast);
	console.log(girl.photoes);
	var matchGirlRequest = Request({
		url: "http://127.0.0.1:80/elitedosug/girls/savegirl",
		content: girl,
		onComplete: function (response) {
			//console.log(response.text);
			html = currentBrowser.contentDocument.body.innerHTML;
			if(response.text == "False") {
				console.log("This girl is Saved Fail. sid="+params["sid"]+"&gid="+params["gid"]+".");
				currentBrowser.contentDocument.body.innerHTML="<div style=\"color: #fcc; position: fixed; top: 0px; left: 10px;\">Save Fail.</div>"+html;
			}
			else {
				console.log("This girl has been Saved Success. sid="+params["sid"]+"&gid="+params["gid"]+".");
				currentBrowser.contentDocument.body.innerHTML="<div style=\"color: #cfc; position: fixed; top: 0px; left: 10px;\">Save Success.</div>"+html;
			}
		}
	});
	matchGirlRequest.post();
	/*if(response.text == "False") {
		console.log("This girl is Saved Fail. sid="+params["sid"]+"&gid="+params["gid"]+".");
		currentBrowser.contentDocument.body.innerHTML="<div style=\"color: #fcc; position: fixed; top: 0px; left: 10px;\">Save Fail.</div>"+html;
	}
	else {
		console.log("This girl has been Saved Success. sid="+params["sid"]+"&gid="+params["gid"]+".");
		currentBrowser.contentDocument.body.innerHTML="<div style=\"color: #cfc; position: fixed; top: 0px; left: 10px;\">Save Success.</div>"+html;
	}*/
	
	//var doc = currentBrowser.contentDocument.documentElement;
	var imgsJS = html.match(ptnImages)[0];
	imgsJS = imgsJS.replace('[','').replace(']','');
	imgsJS = replaceAll(imgsJS,'"','');
	console.log("test: " + imgsJS);
	var imgs = imgsJS.split(',');
	
	var girlimg;
	var imgcnt = 0;
	for(index=0;index<imgs.length;index++) {
		girlimg = new Object();
		girlimg.gid = girl.gid;
		girlimg.src = imgs[index];
		var girlImgRequest = Request({
			url: "http://127.0.0.1/elitedosug/girls/savegirlimg",
			content: girlimg,
			onComplete: function (response) {
				console.log(this.content.gid+","+this.content.src+","+response.text);
				if (response.text == "0") {
					var count = currentBrowser.contentDocument.getElementById("count");
					console.log(count);
					if (typeof(count) == "undefined") {
						currentBrowser.contentDocument.body.innerHTML = "<div style=\"color: #cfc; position: fixed; top: 23px; left: 10px;\"><em id=\"count\">" + imgcnt + "</em> image(s) added.</div>" + html;
						count = currentBrowser.contentDocument.getElementById("count");
					}
					imgcnt++;
					count.innerHTML = imgcnt;
				}
			}
		});
		girlImgRequest.get();
	}
	html = currentBrowser.contentDocument.body.innerHTML;
	currentBrowser.contentDocument.body.innerHTML = "<div style=\"color: #cfc; position: fixed; top: 23px; left: 10px;\"><em id=\"count\">" + imgcnt + "</em> image(s) added.</div>" + html;
	currentBrowser.contentDocument.body.done = true;
}

function getUrlParams(url){
	var idx = url.indexOf("?");
	var search = url.substr(++idx);
	var Params = new Array();
	var ps = search.split("&");
	
	for each(var p in ps){
		var tmp = p.split("=");
		Params[tmp[0]] = tmp[1];
		//console.log(tmp);
		//console.log(Params);
	}
	
	return Params;
}

function dosugMain(tab) {
	console.log("tab is ready");
	if(tab.url.indexOf("elitegirls.cz")<0 && tab.url.indexOf("dosug.cz")<0)
		return;
	
	if(ptn.test(tab.url))
		parseGirl(tab);
	else
		parseAlbum(tab);
}

tabs.removeListener("ready",dosugMain);
tabs.on("ready",dosugMain);

var widget = widgets.Widget({
	id: "elitedosug",
	label: "Elite Girls website",
	contentURL: data.url("Icon1.ico"),
	onClick: function() {
		tabs.open({
			url:"http://www.dosug.cz/en/e/",
			inBackground: true
		});
	}
});

console.log("The add-on is running.");
