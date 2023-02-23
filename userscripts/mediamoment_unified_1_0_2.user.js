// ==UserScript==
// @name          MediaMoment
// @namespace     http://stephenklancher.com
// @description   
// @include       http://*.imdb.com/*
// @exclude       http://*.imdb.com/images/*
// @include       http://*.jinni.com/movies/*
// @include       http://*.jinni.com/tv/*
// @include       http://*.rottentomatoes.com/m/*
// @include       http://*.southparkstudios.com/full-episodes/s*
// @include       http://*.netflix.com/*
// @include       http://*.google.com/movies*
// @include       http://*.rinkworks.com/checklist/**
// @include       http://movies.stephenklancher.com/extension.php
// ==/UserScript==

//ff GUID: de48be5f-00ec-4f33-a9a2-adf1b3bdc989
//crx GUID: ijlnhaekmljpefdggnhkoegcfgpmppob

//CLIENT OPTIONS
//iframe
//   if client is set to iframe, basic functionality of this script should still work in 
//   clients where userscripts do not have xhr permissions 
//   (used in chrome before extensions, not tested since)
//
//ff
//   works in greasemonkey or greasemonkey compiled xpi/addon
//
//crx
//   chrome extension
var client = 'iframe';

var sitename = 'Media Moment';
var baseUrl = 'http://movies.stephenklancher.com/';
var version = '1.0.2';
var debug = false;
//add the movie status/comment to the page
var add_movie_status = true;
//check all IDs on the page, subject to limit
var check_all_IDs = true;

//=========== CHANGE LOG ================
/*
1.0.1 - 2011-08-14
	Netflix streaming pages now properly show a link to search for the title on IMDb

1.0.0 - ?
	"Initial" release
*/

//=============== FUNCTIONS ==================
//====== Helpers ========
	function log(log_txt)
	{
		if (typeof window.console != 'undefined') {
			console.log(sitename+': '+log_txt);
		}
		
		//if console.log is out of scope because we're running in greasemonkey
		if (typeof unsafeWindow != 'undefined') {
			if (typeof unsafeWindow.console != 'undefined') {
				unsafeWindow.console.log(sitename+': '+log_txt);
			}
		}
	}

	function trim(stringToTrim) {
		return stringToTrim.replace(/^\s+|\s+$/g,"");
	}
	
	//find if an array contains something
	function contains(a, obj) {
		var i = a.length;
		while (i--) {
			if (a[i] === obj) {
				return true;
			}
		}
		return false;
	}

//=============== Find IDs====================
	//return array of imdb IDs found in content container
	function find_imdb_ids(content) {
		var regex = /(tt\d{7})/g;
		var matches = content.innerHTML.match(regex);
		return matches;
	}
	
	//first id on the page
	function first_imdb_id(content){
		var regex = /(tt\d{7})/;
		var altsyntax = /Title\?(\d{7})/;
		
		var match = null;
		var ID='';
		if(content){
			//alert(content.innerHTML);
			if ((match = regex.exec(content.innerHTML)) !== null)  
			{  
				ID=match[1]; 
			}
			
			//if we didnt' find an ID, try searching for old imdb syntax
			if(ID===''){
				if ((match = altsyntax.exec(content.innerHTML)) !== null)  
				{  
					ID='tt'+match[1]; 
				}
			}
			
			//alert('match:'+ match);
		}
		return ID;
	}
	
	
	
	
	function current_page_id(){
		var id;
		//alert('start id:'+id);
		//alert('start id site:'+site);
		switch(site){
			case 'imdb':
				id = address.substr(address.lastIndexOf('tt'),9);
			break;
			//case 'metacritic':
				//alert('mid body:'+document.body);
				//id=first_imdb_id(document.body);
				//alert('mid id:'+id);
			//break;
			case 'jinni':
				id=first_imdb_id(document.body);
			break;
			case 'rottentomatoes':
				id = address;
			break;
			case 'southpark':
				id = address;
			break;
			case 'netflix':
				//since netflix is inconsistant about specific format of the Link, find the movieid
				//http://movies.netflix.com/WiPlayer?movieid=70070295&trkid=1498838#EpisodeMovieId=70108658
				//http://www.netflix.com/Movie/30-Rock-Season-3/70103188?trkid=1466475&lnkce=mdp-mlink
				//http://www.netflix.com/Movie/30_Rock_Season_2_SeinfeldVision/70108657
				//http://movies.netflix.com/WiPlayer?movieid=70070295&trkid=1498838
				//http://movies.netflix.com/Movie/Taking-Lives/60033314?trkid=148368#height1801
				var regex = /.+?(?:\/|movieid=)(\d+)(?:(?:&trkid=\d+)|\/|\?|$)(?:#EpisodeMovieId=(\d+))?/;
				var match = null;
				if ((match = regex.exec(address)) !== null){
					//if EpisodeMovieId is set, use that
					if(match[2]){
						id=match[2];
					}else{
						id=match[1];
					}
				}
			break;
			case 'googlemovies':
				if(address.lastIndexOf('mid=')>0){
					//this page has one specific movie instead of list
					//id=first_imdb_id(document.body);
				}
			break;
		}
		
		log('Current page id: '+id);
		
		return id;
	}
	
	
//========= Page ============
	//find the spot where container will go on imdb pages
	var anchorafter=false;
	function find_anchor(){
		var anchor;
		switch(site){
			case 'imdb':
				//episode pages have an h2 above the h1 - if h2 is found earlier, use that
				if(document.body.innerHTML.indexOf('<h2')<document.body.innerHTML.indexOf('<h1')){
					anchor = document.getElementsByTagName('h2');
				}else{
					anchor = document.getElementsByTagName('h1');
				}
				
				anchor=anchor[0];
				break;
			/*
			case 'metacritic':
				anchor = document.getElementsByTagName('h1');
				alert(anchor.length);
				anchor=anchor[0];
				anchor=anchor.parentNode;
				break;
				*/
			case 'jinni':
				anchor = document.getElementsByTagName('h1');
				anchor=anchor[0];
				anchor=anchor.parentNode;
				break;
			case 'rottentomatoes':
				anchor = document.getElementsByTagName('h1');
				anchor=anchor[0];
				break;
			case 'southpark':
				//anchorafter=true;
				//anchor=document.getElementById('header');
				
				//anchor = document.getElementsByTagName('h2');
				//anchor=anchor[1];
				
				anchor=document.getElementById('content');
				anchor=anchor.parentNode;
				break;
			case 'netflix':
				//only try if we have an id
				if(id){
					anchor = document.getElementsByTagName('h2');
					
					//if h2 isn't found then it isn't a media page
					if(anchor.length==0){
						//alert('h2 not found');
						//might be a streaming page, try to insert before the top div
						anchor = document.getElementsByTagName('div');
						if(anchor.length>0){
							anchor=anchor[0];
						}else{
							return null;
						}
					}else{
						anchor=anchor[0];
						anchor=anchor.parentNode;
					}
				}
				break;
		}
		
		if(debug===true && anchor){
			anchor.style.backgroundColor="#CCCCCC"
		}
		
		if(anchor){
			log('Found anchor.');
		}else{
			log('Did not find anchor.');
		}
		
		return anchor;
	}
	
	
	//this positions and returns reference to container to fill with movie status
	function create_container(anchor){
		container=null;
		if(anchor){
			container = document.createElement('div');
			container.innerHTML = '...';
			if(anchorafter){
				anchor.parentNode.insertBefore(container, anchor.nextSibling);
			}else{
				anchor.parentNode.insertBefore(container, anchor);
			}
		}
		
		if(container){
			log('Created container.');
		}else{
			log('Did not create container.');
		}
		
		return container;
	}
	
	//narrow the content searched for IDs
	function imdb_content_area(){
		var content;
		content = document.body;
		return content;
		
		
		switch(site_section){
		case 'title':
			content = document.getElementById('tn15content');
			break;
		case 'name':
			content = document.getElementById('tn15content');
			break;
		case 'chart':
			content = document.getElementById('main');
			break;
		default:
			content = document.getElementById('pagecontent');
			if(content===null){
				content = document.body;
			}
		}
		return content;
	}
	
	
	function fill_movie_status(container){
		if(container){
			
			log('Filling movie status.');
			
			switch(client){
				case 'ff':
					GM_xmlhttpRequest({
						method: 'POST',
						url: baseUrl + 'extension_movie_status.php',
						headers: {
						'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
						'Accept': 'application/atom+xml,application/xml,text/xml',
						'Content-type': 'application/x-www-form-urlencoded'
						},
						'data': 'id=' + encodeURIComponent(id) +
							'&client=' + encodeURIComponent(client) +
							'&version=' + encodeURIComponent(version) +
							'&site=' + encodeURIComponent(site) +
							'&title=' + encodeURIComponent(title) +
							'&debug=' + encodeURIComponent(debug),
						onload: function(responseDetails) {
							container.innerHTML = responseDetails.responseText;
						}
						});
						//container.innerHTML = 'Request Sent!';
					break;
			
				case 'crx':
					chrome.extension.sendRequest({'action' : 'movieStatus', 'site' : site, 'id' : id, 'title' : title, 'version' : version},
												 function(data) {
													container.innerHTML = data;
												});
					break;
				case 'iframe':
					container.setAttribute('style', 'overflow:auto;');
					container.innerHTML = '<iframe src="' + baseUrl + 'extension_movie_status.php?id=' + id + 
						'&client=' + client + '&version=' + version + '&site=' + site + '&title=' + title + '&debug=' + debug + '" width="95%" height="200">WTB iframes support, PST!</iframe>';
					break;
			}
			
		}
	}
	
	//this will update the page with a media link after any imdb link
	function add_links_after_imdb_links(content, add_rt) {
		var regex = /tt(\d{7})(.+?)<\/a>/g;
		var replacement;
		if(add_rt===true){
			replacement='$& - <a href="http://www.rottentomatoes.com/alias?type=imdbid&s=$1">'
				+'Rotten Tomatoes</a> - <a href="'+baseUrl+'media.php?id=tt$1">'+sitename+'</a>';
		}else{
			replacement='$& - <a href="'+baseUrl+'media.php?id=$1">'+sitename+'</a>';
		}
		var newcontent = content.innerHTML.replace(regex,replacement);
		content.innerHTML = newcontent;
		
		return newcontent;
	}
	
	
	/*
	//find and color matching IDs - this turned out to be slower than the first way
	function compare_ids(response) {
		var gotwatchedIDs=new Date();
		//This gets us a list of IDs watched of what is on this page
		var IDs=JSON.parse(response);
		var watched=IDs.IDs;
		//alert(watched);
		
		var content=document.body.innerHTML;
		
		
		
		var show=true; //to limit what to show during debug
		for (ID in watched){
			var find = '\/title\/'+watched[ID]+'\/"';
			var regex = new RegExp(find,'g');
			var replacement = '$& style="background: #C0C0C0;"';
			//var matches = content.match(find);
			content=content.replace(regex,replacement);
			
		}
		
		document.body.innerHTML=content;
		
		
		if(debug==true){
			var IDsColored=new Date();
			
			var mmdebug=document.getElementById('mmdebug');
			var msg='<br>\n';
			if(gotwatchedIDs){msg=msg+'gotwatchedIDs: '+(gotwatchedIDs.getTime()-started)+'<br>\n';}
			if(IDsColored){msg=msg+'IDsColored: '+(IDsColored.getTime()-started)+'<br>\n';}
			
			mmdebug.innerHTML=mmdebug.innerHTML+msg;
			//mmdebug.innerHTML=mmdebug.innerHTML+address+'\nTotal:'+xIDs.snapshotLength+',\n MatchSeen:'+dbgLinkMatchSeen+',\n MatchNotSeen:'+dbgLinkMatchNotSeen+',\n NoMatch:'+dbgLinkNoMatch;
		}
	}
	*/
			
	
	
	
	//find and color matching IDs
	//The old way actually turned out to be faster than the newer way I tried, so it stays...
	function compare_ids_old(response) {
		log('Comparing watched to page IDs.');
		
		var gotwatchedIDs=new Date();
		
		//This gets us a list of IDs watched of what is on this page
		var IDs=JSON.parse(response);
		var watched=IDs.IDs;
		//alert(watched);
		
		/*
		don't match:
/rg/action-box-title/boards-link/title/tt0367271/board
/rg/action-box-title/pro-link/http://pro.imdb.com/title/tt0367272/
/rg/action-box-title/add-to-my-movies/mymovies/list?pending&amp;add=0367273
/rg/action-box-title/update-data/updates?auto=legacy/title/tt0367274/

match (with or without trailing slash:
http://www.imdb.com/title/tt0367275/
http://www.imdb.de/title/tt0367276/
http://us.imdb.com/title/tt0367277/
http://imdb.com/title/tt0367278/
/title/tt0367279/
/rg/tt-recs/link/title/tt0046438/

		*/
		//regex to test for imdb id
		
		//var regex = /^(?:http:\/\/(?:\w){0,3}\.{0,1}imdb\.(?:\w){2,3}){0,1}(?:\/rg\/tt-recs\/link){0,1}\/title\/(tt\d{7})\/{0,1}$/gm;
		var regex = /^(?:http:\/\/w{0,3}\.{0,1}imdb\.(?:\w){2,3}){0,1}(?:\/rg\/tt-recs\/link){0,1}\/title\/(tt\d{7})\/{0,1}$/gm;
		
		var match = null;
		
		var content=imdb_content_area();
		
		//find links and we will check against the watched list
		var xIDs = document.evaluate( '//a[@href]' ,content, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		//"contains" doesn't work moz?  Only reason i'm using it is I assume narrow results in dom is quicker than regex... might be wrong anyway
		//var xIDs = document.evaluate( '//a[contains(@href, "/title/tt")]' ,document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		//alert(xIDs.snapshotLength);
	
		var link = '';
		var linkID = '';
		
		var dbgLinkMatchSeen=0;
		var dbgLinkMatchNotSeen=0;
		var dbgLinkNoMatch=0;
		
		//look through the matches
		for (var i = 0; i < xIDs.snapshotLength; i++){
			link=xIDs.snapshotItem(i);
			LinkID=link.toString();
			if(i<5){
				//alert(LinkID)
			}
			
			//match against regex which limits to actual movie links, not other section links, etc
			match = regex.exec(LinkID);
			
			//alert(match.length )
			
			//continue if there is a match and there is an IMDb id in capture group 1
			if (match != null) { // && match.length > 1 && match[1] != '') {
				//if(i<15){
					//alert(match[1])
				//}
				if(contains(watched,match[1])===true) {
					link.style.fontWeight="bolder";
					link.style.backgroundColor="#C0C0C0";
					//alert('OK/Seen:"'+LinkID+'"');
					if(debug==true){dbgLinkMatchSeen++;}
				}else{
					//matched links not seen
					if(debug==true){
						link.style.backgroundColor="#FF0000";
						dbgLinkMatchNotSeen++;
					}
				}
			}else{
				//possible links from dom not matched by regex
				if(debug==true){
					link.style.backgroundColor="#00FF00";
					dbgLinkNoMatch++;
				}
			}
			
			
			//reset the index of the search
			//very important if not using match in a while loop where it will fail to match and auto reset
			regex.lastIndex=0;
		}
		
		
		
		if(debug==true){
			var IDsColored=new Date();
			
			var mmdebug=document.getElementById('mmdebug');
			var msg='<br>\n';
			if(gotwatchedIDs){msg=msg+'gotwatchedIDs: '+(gotwatchedIDs.getTime()-started)+'<br>\n';}
			if(IDsColored){msg=msg+'IDsColored: '+(IDsColored.getTime()-started)+'<br>\n';}
			
			mmdebug.innerHTML=mmdebug.innerHTML+msg;
			mmdebug.innerHTML=mmdebug.innerHTML+address+'\nTotal:'+xIDs.snapshotLength+',\n MatchSeen:'+dbgLinkMatchSeen+',\n MatchNotSeen:'+dbgLinkMatchNotSeen+',\n NoMatch:'+dbgLinkNoMatch;
		}
	}
			
			
	
//========= Data Collection
//sends urls to be associated with metacritic and jinni
function associate_id(id){
	if(site=='jinni' || site=='metacritic'){
		if(id){
			var params='id=' + encodeURIComponent(id) +
						'&client=' + encodeURIComponent(client) +
						'&version=' + encodeURIComponent(version) +
						'&site=' + encodeURIComponent(site) +
						'&link=' + encodeURIComponent(address);
			switch(client){
			case 'ff':
				//alert(id);
				GM_xmlhttpRequest({
					method: 'POST',
					url: baseUrl + 'extension_associate_id.php',
					headers: {
					'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
					'Accept': 'application/atom+xml,application/xml,text/xml',
					'Content-type': 'application/x-www-form-urlencoded'
					},
					'data': params
					});
				//onload: function(responseDetails) {
				//		alert(responseDetails.responseText);
				//	}
				//alert(address);
			break;
		
			case 'crx':
				
			case 'iframe':
				//zero area iframe just to create a GET with the params (ignoring cross site xhr issues)
				var container = create_container(find_anchor());
				container.setAttribute('style', 'overflow:auto;');
				container.innerHTML = '<iframe src="' + baseUrl + 'extension_associate_id.php?' + params + 
					'" width="0" height="0"></iframe>';
				break;
		}
		}
	}
}


function get_title(site)
{
	var element;
	switch(site){
		case 'netflix':
			var title_in_url;
			//when actually playing a movie, the title is in the t param (only in Chrome?)
			title_in_url=get_url_parameter('t');
			
			if(title_in_url){
				return unescape(title_in_url.replace(/\+/g, " "));
			}else{
				//otherwise it is in an h2 tag
				element=document.getElementsByTagName('h2');
			}
			
			break;
		case 'rottentomatoes':
			element=document.getElementsByTagName('h1');
			break;
		default:
			return '';
	}
	
	if(element){
		if(element.length>0){
			return element[0].textContent;
		}
	}
	
	return '';
}

//http://www.netlobo.com/url_query_string_javascript.html
function get_url_parameter( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}


var check_IDs_this_page=false;

function start(){
	//============ Script Start ===================
	
	
	
	if(address.indexOf('imdb.com')>0){
		site='imdb';
		check_IDs_this_page=true;
		if(address.indexOf('/name/nm')>0){
			site_section='name';
		}else if(address.indexOf('/title/tt')>0){
			site_section='title';
		}else if(address.indexOf('/chart/')>0){
			site_section='chart';
		}
	//}else if(address.indexOf('metacritic.com')>0){
	//	site='metacritic';
	}else if(address.indexOf('jinni.com')>0){
		site='jinni';
	}else if(address.indexOf('rottentomatoes.com')>0){
		site='rottentomatoes';
	}else if(address.indexOf('netflix.com')>0){
		site='netflix';
	}else if(address.indexOf('google.com/movies')>0){
		site='googlemovies';
	}else if(address.indexOf('southparkstudios.com/full-episodes/')>0){
		site='southpark';
	}else if(address.indexOf('stephenklancher.com')>0){
		site='mediamoment';
	}else{
		site='other';
		check_IDs_this_page=true;
	}
	
	log('Site: '+site + ':' + address);
	
	title=get_title(site);
	
	
	if(add_movie_status){
		//find the id of the movie on the current page
		id = current_page_id();
		
		//make sure it is an imdb id or are on a site where we use a different id type
		if(id && (isNaN(id.substr(2,7))==false || site=='rottentomatoes' || site=='netflix' || site=='southpark')){
			//create a container at an anchor point
			var container = create_container(find_anchor());
			
			//if we've found the spot for the iframe and we've actually found an id number
			if (container) {
				fill_movie_status(container,title);
			}
			
			//report the link back to the database to gather imdb=>jinni/metacritic info
			associate_id(id);
		}
	}
	
	
	
	//site specific code
	switch(site)
	{
		//============ IMDB =======================
		case 'imdb':
			
			
		break;
	
	
		//============ mediamoment =======================
		case 'mediamoment':
			var regex = /NO EXTENSION INSTALLED/;
			var replacement = version;
			document.body.innerHTML = document.body.innerHTML.replace(regex,replacement);
		break;
	
		//============ rottentomatoes =======================
		case 'rottentomatoes':
			
		break;
	
		//============ googlemovies =======================
		case 'googlemovies':
			//add link and rt link
			add_links_after_imdb_links(document.body,true);
		break;
	}
	
	
	if(check_IDs_this_page==true){
		//==== Check IMDB IDs  ========
		// though this could work for other sites urls it would be undependable
		// because they only might be in the db.  That makes it an unattractive option
		
		//narrow the area to look for links
		var content=imdb_content_area();
				
				
		
		
		if(content && check_all_IDs && client != 'iframe'){
			var IDs = new Array();
			IDs=find_imdb_ids(content);
			
			gotIDs=new Date();
			//IDs=IDs.slice(0,check_ID_limit);
			//alert(IDs);  
			
			log('Sending page IDs, requesting watched IDs.');
			
			//send IDs to get back matches, then find and color them on the page
			switch(client){
				case 'ff':
					//alert(id);
					GM_xmlhttpRequest({
					method: 'POST',
					url: baseUrl + 'extension_check_ids.php',
					headers: {
					'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
					'Accept': 'application/atom+xml,application/xml,text/xml',
					'Content-type': 'application/x-www-form-urlencoded'
					},
					'data': 'id=' + encodeURIComponent(id) +
						'&client=' + encodeURIComponent(client) +
						'&version=' + encodeURIComponent(version) +
						'&site=' + encodeURIComponent(site) +
						'&IDs=' + encodeURIComponent(JSON.stringify(IDs)),
					onload: function(responseDetails) {
						compare_ids_old(responseDetails.responseText);
					}
					});
				break;
			
				case 'crx':
					// Send a request to the background page to fetch data from server.
					// Specify that inList should be called with the result.  [{'id1':'tt0113189'}]
					chrome.extension.sendRequest({'action' : 'inList', 'user' : 'loggedIn', 'IDs' : IDs, 'version' : version}, compare_ids_old);
				case 'iframe':
					//this will not be implemented for iframe
					break;
			}
				
			
		}	
	}
	
	
	
	
	finished=new Date();
	
	if(debug==true){
		var msg='started:'+started.getTime()+'<br>\n';
		if(typeof gotIDs != 'undefined'){msg=msg+'gotIDs: '+(gotIDs.getTime()-started)+'<br>\n';}
		msg=msg+'finished: '+(finished.getTime()-started)+'<br><br>\n';
		
		//alert(msg);
		var mmdebug=document.getElementById('mmdebug');
		mmdebug.innerHTML=mmdebug.innerHTML+msg;
		//output debug info as the last element in body
		//var container = document.createElement('div');
		//container.id='mmdebug';
		//container.innerHTML = msg;
		//document.body.appendChild(container);
	}
}


function create_debug_container()
{
	if(debug==true){
		//output debug info as the last element in body
		var container = document.createElement('div');
		container.id='mmdebug';
		document.body.appendChild(container);
	}
}



//find out where we are:  imdb, metacritic, jinni, rottentomatoes, netflix
var address = window.location.toString();
var site = "unknown";
var site_section='unknown';
var id;
var title;

//timing for debug
var started=new Date();



//============ Browser specific  ===================
if(client=='crx'){
	//if chrome, wait for settings before starting
	var port = chrome.extension.connect({name: "mediamoment"});
	port.postMessage({action: "settings"});
	port.onMessage.addListener(function(settings) {
		log('Getting extension settings...');
		debug=settings.debug=="true";
		create_debug_container();
		start();
	});
}else{
	create_debug_container();
	start();
}