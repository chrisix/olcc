/************************************************************
 * OnlineCoinCoin, by Chrisix (chrisix@gmail.com)
 * Un coincoin en ligne, majoritairement écrit en Javascript et fortement inspiré des tribunes en ligne modernes.
 * Merci notamment à  :
 *   - Axel, NedFlanders et grid pour le script EnhancedBoard (http://pqcc.free.fr/)
 *   - SeeSchloss pour son module Tribune pour Drupal (http://tout.essaye.sauf.ca/)
 *   - et toutes les moules< qui ont utilisé, bug-reporté voire même patché ces projets ainsi que toutes les tribunes web 2.0+
 * Ce fichier contient les fonctions "coeur" du programme.
 ************************************************************/

var GlobalBoards = {};
var GlobalBoardTabs = {};
var GlobalMyPosts = new Array();
var GlobalXPosts = new Array();
var GlobalCurTrib = '';
var GlobalPinni = null;
var GlobalPopup = null;
// var GlobalConsole = null;
var GlobalProcessing = false;
var GlobalWindowFocus = true;
var GlobalFilters = new Array();

window.notified = function (notif) {
    if (GlobalWindowFocus) return;
    var titre = document.title.substr(0,1);
    switch (notif) {
      case NOTIF_NEW_POST:
        if (titre != "#" && titre != "@" && titre != "<") {
            favicon.change("img/ico_new.png", "* " + settings.value('window_title'));
        }
        break;
      case NOTIF_ANSWER:
        favicon.change("img/ico_reply.png", "# " + settings.value('window_title'));
        if (settings.value('sound_enabled')) {
            // alert("coin");
            sound_play("sound/"+settings.value('sound_reply'));
        }
        break;
      case NOTIF_BIGORNO_ALL:
        if (titre != "@") {
          favicon.change("img/ico_bigoall.png", "< " + settings.value('window_title'));
        }
        if (settings.value('sound_enabled')) {
            // alert("meuh");
            sound_play("sound/"+settings.value('sound_bigorno'));
        }
        break;
      case NOTIF_BIGORNO:
        favicon.change("img/ico_bigorno.png", "@< " + settings.value('window_title'));
        if (settings.value('sound_enabled')) {
            // alert("meuh");
            sound_play("sound/"+settings.value('sound_bigorno'));
        }
        break;
    }
}

function applyGlobalCSS() {
    if (document.location.href.match(/iphone.html/)) { return ; } // pas de changement de style pour iphone
    var css = settings.value('style');
    changeStyle(css);
    if (document.styleSheets.length < 2) { // pour webkit qui ne connait que la stylesheet active
        for (name in GlobalBoards) {
            GlobalBoards[name].updateCSS();
        }
    }
    dispAll();
}

function toPinniBottom() {
    var test1 = GlobalPinni.scrollHeight;
    if (test1 > 0) {
      GlobalPinni.scrollTop = GlobalPinni.scrollHeight;
    }
    else {
      GlobalPinni.scrollTop = GlobalPinni.offsetHeight;
    }
}

function formatLogin(login, info) {
    var einfo = info.replace(/</g, "&lt;");
    einfo = einfo.replace(/>/g, "&gt;");
    einfo = einfo.replace(/"/g, "&quot;");
    if (!einfo) einfo = "&nbsp;";
    if (login == '' || login == 'Anonyme') {
      return '<span class="ua" title="' + einfo + '">' + einfo + '</span>'
    }
    else {
      return '<span class="login" title="' + einfo + '">' + login + '</span>'
    }
}

function writeDuck(message, board, post, postid) {
    var tete = '([o0ô°øòó@]|(&ocirc;)|(&deg;)|(&oslash;)|(&ograve;)|(&oacute;))'
    var exp1 = new RegExp('(\\\\_' + tete + '&lt;)', 'gi');
    var exp2 = new RegExp('(&gt;' + tete + '_\\/)', 'gi');
    var exp3 = new RegExp('(coin ?! ?coin ?!)', 'gi');
    var exp4 = new RegExp('((flap ?flap)|(table[ _]volante))', 'gi');
    var newMessage = message.replace(exp1, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp2, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp3, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp4, '<span class="canard table">$1</span>');
    if ((settings.value('balltrap_mode') == BALLTRAP_AUTO)
      && (newMessage.indexOf('<span class="canard') != -1)) {
        addClass(post, "canard");
        launchDuck(postid, (newMessage.indexOf('<span class="canard table') != -1));
    }
    return newMessage;
}

function writePlonk(message, board, post, login, info) {
    if (login && settings.value('plonk').split(",").contains(login)) {
        addClass(post, "plonk");
    }
    else {
        addClass(post, "pasplonk");
    }
    return message;
}

function writeBigorno(message, board, postid, post) {
    var login_exp = (board.login) ? board.login : settings.value('default_login');
    if (login_exp) {
      var re = new RegExp("(("+login_exp+")&lt;)", "gi");
      var newmessage = message.replace(re, '<span class="bigorno">$1</span>');
      if (newmessage.indexOf('<span class="bigorno">')!=-1) {
          addClass(post, "bigorno");
          board.notify(NOTIF_BIGORNO, postid);
          return newmessage;
      }
    }
    var re = new RegExp("(moules&lt;)", "g");
    var newmessage = message.replace(re, '<span class="bigorno">$1</span>');
    if (newmessage.indexOf('<span class="bigorno">')!=-1) {
        addClass(post, "bigorno");
        board.notify(NOTIF_BIGORNO_ALL, postid);
    }
    return newmessage;
}

function writeTotoz(message) {
    var exp = /\[\:([^\t\)\]]+)\]/g;
//    if (settings.value('default_login').match(/[Ss]ingle/)) {
//        return message.replace(exp, '<img title="[:$1]" style="vertical-align:top" src="http://claudex.be/ttz/$1.gif" />');
//    }
    if (settings.value('totoz_mode') != TOTOZ_INLINE) {
        return message.replace(exp, '<span class="totoz" id="$1">[:$1]</span>');
    } else {
        return message.replace(exp, '<img title="[:$1]" src="' + settings.value('totoz_server') + '/img/$1" />');
    }
}

function writeLecon(message)
{
  var index1 = message.indexOf("<a ",0);
  var exp = new RegExp('([lL]e([cç]|&ccedil;|&Ccedil;)on[ ]*([0-9]+))', 'gi');
  if ( exp.test(message) )
  {
    if (index1 != -1)
    {
      var _message = message.substring(0,index1).replace(exp, '<a href="http://lecons.ssz.fr/lecon/$3/">$1</a>');
      var index2 = message.indexOf("</a>",index1);
      if (index2 != -1)
      {
        _message = _message + message.substring(index1,index2+4);
        _message = _message + writeLecon(message.substring(index2+4,message.length));
        return _message;
      }
    }
    else
    {
      return message.replace(exp, '<a href="http://lecons.ssz.fr/lecon/$3/">$1</a>');
    }
  }
  else
  {
    return message;
  }        
}

var norloge_exp = new RegExp("((?:1[0-2]|0[1-9])/(?:3[0-1]|[1-2][0-9]|0[1-9])#|[0-9]{4}-[0-9][0-9]-[0-9][0-9]T)?((?:2[0-3]|[0-1][0-9])):([0-5][0-9])(:[0-5][0-9])?([¹²³]|[:\^][1-9]|[:\^][1-9][0-9])?(@[A-Za-z0-9_]+)?", "");
function writeClocks(message, board, postid, post) {
    var offset = 0;
    var indexes = new Array();
    
    // On recherche les indices des horloges
    var h = norloge_exp.exec(message);
    while(h && h.length > 0) {
        
        // Construction de la référence au format MMDDhhmmssii@board
        var ref = 'ref'
        var refclass = "clockref";
        if (h[1]) {
            if (h[1].substr(-1) == "T") {
              // Norloges iso à la devnewton<
              ref += h[1].substr(5,2)+h[1].substr(8,2);
            }
            else {
              // Norloges avec date type MM/DD#
              ref += h[1].substr(0,2)+h[1].substr(3,2);
            }
        }
        else {
            if (h[2]+h[3]+"00" > postid.substr(4,6)) { // NB: probablement bugué : on compare sans tenir compte des secondes
                // Une horloge IPoT sans date a toutes les chances de pointer
                // en fait vers un post du jour précédent
                var theday = new Date(); // jour du post courant, pour comparer relativement aux norloges-références
                theday.setDate(parseInt(postid.substr(2,2),10));
                theday.setMonth(parseInt(postid.substr(0,2),10)-1);
                var yesterday = theday.getTime() - 24*60*60*1000;
                theday.setTime(yesterday);
                ref += pad0(theday.getMonth()+1) + pad0(theday.getDate());
            }
            else {
                ref += postid.substr(0,4);
            }
        }
        ref += h[2] + h[3];
        if (h[4]) { ref += h[4].substr(1,2); } else { ref += "--"; }
        if (h[5]) {
            switch (h[5].substr(0,1)) {
              case '¹':
                ref += "01";
                break;
              case '²':
                ref += "02";
                break;
              case '³':
                ref += "03";
                break;
              default:
                ref += pad0(parseInt(h[5].substr(1,2),10));
            }
        }
        else { ref += "--"; }
        if (h[6]) {
            var refboard = getBoardFromAlias(h[6].substr(1));
            if (refboard) {
                ref += '@'+refboard;
            }
            else {
                ref += h[6];
                refclass = "unknown";
            }
        }
        else {
            ref += postid.substr(12);
        }
        
        // Préparation des balises à insérer autour de l'horloge, aux bons indexes dans la chaîne
        if (refclass != "unknown") {
            if (pointsToMyPost(ref)) {
                refclass += " mypost";
                addClass(post, "answer");
                board.notify(NOTIF_ANSWER, postid);
            }
        }
        var hpos = offset + h.index;
        if (h[1] && ref.substr(3,4) == postid.substr(0,4) ) {
          // date inutile car la ref est à la même date que le post : on la bazarde
          indexes.push([hpos, '<span class="'+refclass+'" id="'+ref+'"><span style="display:none">']);
          indexes.push([hpos+h[1].length, '</span>']);
        }
        else {
          indexes.push([hpos, '<span class="'+refclass+'" id="'+ref+'">']);
        }
        offset = hpos + h[0].length
        indexes.push([offset, '</span>']);
        
        // Recherche de la prochaine occurrence de norloge
        h = norloge_exp.exec(message.substr(offset));
    }
    
    // Insertion des balises
    for (var i=indexes.length-1; i>=0; i--) {
        var pos_str = indexes[i];
        message = message.substr(0, pos_str[0])+pos_str[1]+message.substr(pos_str[0]);
    }
    return message;
}


function seemsToBePostedByMe(board, login, info, realId) {
    if (GlobalXPosts.contains(realId+'@'+board.name)) {
        return true;
    }
    if (login && (login != 'Anonyme')) {
        if ((board.login && login.match(new RegExp("^("+board.login+")$")))
         || (!board.login && login.match(new RegExp("^("+settings.value('default_login')+")$")))) {
            return true;
        }
    }
    else if (info && (info == board.ua || info == settings.value('default_ua'))) {
        return true;
    }
    return false;
}

var url_exp = new RegExp('(ht|f)tps?:\/\/([^\/?#]+)(?:[/?#]|$)(.*)');
function urlMini(proto, domain, url) {
    if ( proto == "f" ) {
        return "[ftp]";
    }
    if ( /\.(png|jpg|jpeg|gif|webp)$/i.test(url) ) {
        return "[img]";
    }
    if ( /\.(mpg|mpeg|mp4|webm|ogv|mkv|avi)$/i.test(url) ) {
        return "[video]";
    }
    if ( /\.(mp3|ogg|aac|wav|flac)$/i.test(url) ) {
        return "[audio]";
    }
    if ( /\.pdf$/i.test(url) ) {
        return "[pdf]";
    }
    var dispdom = domain;
    if ( /\.[^.0-9]+$/.test(domain) ) {
      dispdom = domain.substr(0, domain.lastIndexOf('.'));
    }
    if (dispdom.substr(0,4) == "www.") {
      dispdom = dispdom.substr(4);
    }
    return "["+dispdom+"]";
}

function insertToPinni(post, postId, board, clock, login, info, message, realId) {
    var allposts = GlobalPinni.getElementsByTagName("div") || [];
    var curDiv = null;
    var curId = null;
    for (var i=allposts.length; i--;) {
        curDiv = allposts[i];
        curId = curDiv.getAttribute("id");
        if ((curId != "") && (curId < postId)) break;
        curId = null;
    }
    if (curId == null) {
        GlobalPinni.insertBefore(post, GlobalPinni.firstChild); //appendChild(post);
    }
    else {
        var next = curDiv.nextSibling;
        if (next) {
            GlobalPinni.insertBefore(post, next);
        }
        else {
            GlobalPinni.appendChild(post);
        }
    }
    var ind = 0;
    var prevPost = post.previousSibling;
    if (prevPost && (prevPost.nodeName.toLowerCase() == "div")) {
        var prevId = prevPost.getAttribute("id");
        if ((prevId.substr(0,10) == postId.substr(0,10)) &&
            (prevId.substr(13) == postId.substr(13))) {
            ind = parseInt(prevId.substr(10,2),10) + 1;
            if (ind == 1) {
                // L'indice est 1, ce qui signifie qu'un post de même horloge et
                // d'indice 0 existe juste avant, il faut donc mettre l'indice de
                // ce post à 1 et incrémenter à 2 l'indice du post courant
                var newPrevId = prevId.substr(0,10)+"01"+prevId.substr(12);
                prevPost.setAttribute("id", newPrevId);
                ind++;
                if (GlobalMyPosts.contains(prevId)) {
                    GlobalMyPosts.remove(prevId)
                    GlobalMyPosts.push(newPrevId);
                }
            }
        }
    }
    var newId = postId.substr(0,10) + pad0(ind) + postId.substr(12);
    post.setAttribute("id", newId);
    var fmessage = message;
    [writeClocks, writeBigorno, writeTotoz, writeLecon].each(function(f){fmessage = f(fmessage, board, newId, post);});
    fmessage = writePlonk(fmessage, board, post, login, info);
    if (settings.value('balltrap')) {
        fmessage = writeDuck(fmessage, board, post, newId);
    }
    var cclass = "clock";
    if (seemsToBePostedByMe(board, login, info, realId)) {
        cclass += " mypost";
        GlobalMyPosts.push(newId);
        addClass(post, "mypost");
    }
    post.innerHTML = '\n<div class="post"><span class="'+cclass+'" title="'+realId+' ['+board.name+']">' + clock + '</span> '
                   + formatLogin(login, info) + ' <span class="message">' + fmessage + '</span></div>\n';
    if (GlobalFilters.length > 0) {
        var pclass = post.className; // getAttribute('class');
        post.style.display = 'none';
        for (var i=GlobalFilters.length; i--;) {
            if (pclass.indexOf(GlobalFilters[i]) != -1) {
                post.style.display = '';
                break;
            }
        }
    }
    // Formatage des urls
    var urls = post.getElementsByTagName('a');
    for (i=0; i<urls.length;i++) {
        // Toujours ouvrir les urls dans un autre onglet
        urls[i].setAttribute('target','_blank');
        var href = urls[i].getAttribute('href');
        if (href && /\[(url|https?)\]/.test(urls[i].innerHTML.strip()) ) {
            var m = url_exp.exec(href);
            if (m) {
              urls[i].innerHTML = urlMini(m[1], m[2], m[3]);
            }
        }
    }
    board.notify(NOTIF_NEW_POST, postId, post);
    // Effacement des posts en cas de dépassement de la taille maxi du pinnipède
    if (allposts.length > (2 * settings.value('pinni_size'))) {
        var i=0;
        if (settings.value('pinni_keep')) {
          // On n'efface pas les posts importants pour l'user
          while (i<allposts.length && allposts[i].className.match(/(mypost|answer|bigorno)/)) i += 2;
        }
        GlobalPinni.removeChild(allposts[i]);
    }
}

function pointsToMyPost(ref) {
    for (var i=GlobalMyPosts.length; i--;) {
        if (pointsTo(GlobalMyPosts[i], ref)) {
            return true;
        }
    }
    return false;
}

function pointsTo(postid, ref) {
    if (postid.substr(13) != ref.substr(16)) return false;
    if (postid.substr(0,8) != ref.substr(3,8)) return false;
    var postsec = postid.substr(8,2);
    var refsec = ref.substr(11,2);
    if (refsec == "--") return true;
    if (postsec != refsec) return false;
    var posti = postid.substr(10,2);
    var refi = ref.substr(13,2);
    if (refi == "--" || (refi == "01" && posti == "00")) return true;
    if (posti != refi) return false;
    return true;
}

function getBoardFromAlias(alias) {
    var name = null;
    for (name in GlobalBoards) {
        if (alias.toLowerCase() == name) return name;
        if (GlobalBoards[name].alias.split(",").contains(alias.toLowerCase())) return name;
    }
    return null;
}

function hilight(node) {
    addClass(node, 'hilight');
}

function unhilight(node) {
    removeClass(node, 'hilight');
}

function hilightRef(ref) {
    if (is_ie || no_xpath) {
        var allposts = new Array();
        var boardposts = IE_selectNodes(["pinni-"+ref.substr(16)]);
        var refbeg = ref.substr(3,8);
        for (var i=boardposts.length; i--;) {
            var curpost = boardposts[i];
            if (curpost.getAttribute('id').substr(0,8) == refbeg) {
                allposts.push(curpost);
            }
        }
    }
    else {
        var query = "//div[contains(@class,'pinni-"+ref.substr(16)+"') and starts-with(@id,'"+ref.substr(3,8)+"')]";
        var allposts = evalexp(query);
    }
    var curDiv = null;
    var curId = null;
    for (var i=0, l=getLength(allposts); i<l; i++) {
        curDiv = getItem(allposts, i);
        curId = curDiv.getAttribute("id");
        if (curId.substr(0,8) != ref.substr(3,8)) break;
        if (pointsTo(curId, ref)) {
            hilightPost(curId, curDiv);
        }
    }
}

function hilightPost(postid, post) {
    hilight(post);
    var clone = post.cloneNode(true);
    clone.style.display = 'block'; // le highlight toujours affiché
    GlobalPopup.appendChild(clone);
    removeClass(clone, "hilight");
    if (GlobalPopup.style.display != 'block') {
        GlobalPopup.style.display = 'block';
    }
    hilightClocksPointingTo(postid);
}

function hilightClocksPointingTo(postid) {
    var allrefs = new Array();
    allrefs.push("ref"+postid);
    allrefs.push("ref"+postid.substr(0,10)+"--"+postid.substr(12));
    allrefs.push("ref"+postid.substr(0,8)+"----"+postid.substr(12));
    if (postid.substr(10,2) == "00") {
        allrefs.push("ref"+postid.substr(0,10)+"01"+postid.substr(12));
    }
    for (var i=allrefs.length; i--;) {
        if (is_ie || no_xpath) {
            var allClocks = new Array();
            var all = GlobalPinni.getElementsByTagName('span') || [];
            for (var j=all.length; j--;) {
                var cur = all[j];
                if (cur.className.indexOf('clockref') != -1 && cur.getAttribute('id') == allrefs[i]) {
                    allClocks.push(cur);
                }
            }
        }
        else {
            var query = "//span[contains(@class,'clockref') and contains(@id,'"+allrefs[i]+"')]";
            var allClocks = evalexp(query);
        }
        for (var j=getLength(allClocks); j--;) {
            hilight(getItem(allClocks, j));
        }
    }
}

function onMouseOver(event) {
    // Enlève le hilight 
    if (is_ie || no_xpath) {
        var allhi = IE_selectNodes(['hilight']);
        var allspans = document.getElementsByTagName('span') || [];
        for (var i=allspans.length; i--;) {
            if (allspans[i].className.indexOf('hilight') != -1) {
                allhi.push(allspans[i]);
            }
        }
    }
    else {
        var allhi = evalexp("//*[contains(@class,'hilight')]");
    }
    for (var i=getLength(allhi); i--;) {
        unhilight(getItem(allhi, i));
    }
    GlobalPopup.style.display = 'none';
    GlobalPopup.innerHTML = '';
    
    var target = event.target || event.srcElement;
    // var name = target.nodeName.toLowerCase();
    var targetClass = target.className; // getAttribute('class');
    var targetId = target.getAttribute('id');
    if (!targetClass) return;
    if (targetClass.indexOf('clockref') != -1) {
        hilightRef(targetId);
    }
    else if (targetClass.indexOf('clock') != -1) {
        hilightPost(target.parentNode.parentNode.getAttribute('id'), target.parentNode.parentNode);
    }
    else if (targetClass.indexOf('totoz') != -1) {
        if (settings.value('totoz_mode') != TOTOZ_INLINE) {
            var totoz = getTotoz(targetId);
            showTotoz(totoz, event.clientX, event.clientY);
        }
    }
}

function getTotoz(totoz) {
    var img = document.getElementById('totozImg[' + totoz + ']');
    if (!img) {
        img = document.createElement('img');
        img.style.display = 'none';
        img.setAttribute('src', settings.value('totoz_server') + '/img/' + totoz);
        img.className = 'totoz'; // setAttribute('class','totoz');
        img.setAttribute('id','totozImg[' + totoz + ']');
        document.getElementsByTagName('body')[0].appendChild(img);
    }
    return img;
}

function showTotoz(element, x, y) {
    element.style.top = (y + 10 + document.documentElement.scrollTop) + 'px';
    element.style.left = x + 'px';
    element.style.visibility = 'hidden';
    element.style.display = '';
    var final_y = y + 10 + element.clientHeight;
    if (final_y > window.innerHeight) {
        element.style.top = y + document.documentElement.scrollTop - 10 - element.clientHeight + 'px';
    }
    element.style.visibility = '';
}

function onClick(event) {
    var target = event.target || event.srcElement;
    var nodeClass = target.className;
    
    // Enlève la marque de notification
    GlobalWindowFocus = true;
    // document.title = settings.value('window_title');
    favicon.change(settings.value('favicon'), settings.value('window_title'));
    
    // Enlève le style newpost sur les DIVs
    if (is_ie || no_xpath) {
        var allDivs = IE_selectNodes(['newpost']);
    }
    else {
        var allDivs = evalexp("//div[contains(@class,'newpost')]");
    }
    for (var i=getLength(allDivs); i--;) {
        var curdiv = getItem(allDivs, i);
        var dclass = getStyleClass('pinni-'+curdiv.getAttribute('id').split("@")[1]);
        if (curdiv.style.display != 'none' && (dclass && dclass.style.display != 'none')) {
            removeClass(curdiv, 'newpost');
        }
    }
    
    // Click sur un canard
    if (nodeClass.indexOf('canard') != -1) {
        var root = target.parentNode;
        while (root && root.nodeName.toLowerCase() != 'div') root = root.parentNode;
        // alert(root.getAttribute('id') + "\n" + root.parentNode.getAttribute('id'));
        // alert(settings.value('balltrap_mode'));
        switch (settings.value('balltrap_mode')) {
          case BALLTRAP_ONCLICK:
            // alert(root.parentNode.getAttribute('id'));
            launchDuck(root.parentNode.getAttribute('id'), (nodeClass.indexOf('table') != -1));
            break;
          case BALLTRAP_KILL:
            balltrap_kill(root.parentNode.getAttribute('id'));
            break;
        }
    }

    // Click sur un login
    else if (nodeClass.indexOf('login') != -1) {
        if (event.ctrlKey) { // ctrl-click : on copie l'UA
          insertInPalmi('user-agent: "'+target.getAttribute("title").strip()+'"');
        }
        else {
          insertInPalmi(target.innerHTML.strip()+"< ");
        }
    }

    // Click sur un UA
    else if (nodeClass.indexOf('ua') != -1) {
        if (event.ctrlKey) { // ctrl-click : on copie l'UA
          insertInPalmi('user-agent: "'+target.getAttribute("title").strip()+'"');
        }
        else {
          insertInPalmi(target.getAttribute("title").split(" ")[0]+"< ");
        }
    }
    
    // Click sur une norloge-référence
    else if (nodeClass.indexOf('clockref') != -1) {
        var ref = target.getAttribute('id');
        if (is_ie || no_xpath) {
            var allposts = new Array();
            var boardposts = IE_selectNodes(["pinni-"+ref.substr(16)]);
            var refbeg = ref.substr(3,8);
            for (var i=boardposts.length; i--;) {
                var curpost = boardposts[i];
                if (curpost.getAttribute('id').substr(0,8) == refbeg) {
                    allposts.push(curpost);
                }
            }
        }
        else {
            var query = "//div[contains(@class,'pinni-"+ref.substr(16)+"') and starts-with(@id,'"+ref.substr(3,8)+"')]";
            var allposts = evalexp(query);
        }
        var curDiv = null;
        var curId = null;
        for (var i=getLength(allposts); i--;) {
            curDiv = getItem(allposts, i);
            curId = curDiv.getAttribute("id");
            if (pointsTo(curId, ref)) {
                GlobalPinni.scrollTop = document.getElementById(curId).offsetTop-event.clientY+GlobalPinni.offsetTop+6;
                flash(document.getElementById(curId));
                break;
            }
        }
    }

    // Click sur la norloge d'un post
    else if (nodeClass.indexOf('clock') != -1) {
        if (event.ctrlKey) { // ctrl-click : on copie l'id du post
          insertInPalmi("post-id: "+target.getAttribute("title").split(" ")[0]);
        }
        else {
          var nodeId = target.parentNode.parentNode.getAttribute('id');
          setPalmiTrib(nodeId.substr(13));
          insertInPalmi(getCtxtClock(nodeId)+' ');
        }
    }
}

function flash(element) {
    addClass(element, "flash");
    window.setTimeout(function () { removeClass(element, "flash"); }, 1000);
}

function getCtxtClock(postid) {
    var month = parseInt(postid.substr(0,2),10);
    var day = parseInt(postid.substr(2,2),10);
    var today = new Date();
    var res = "";
    if (month != (today.getMonth()+1) || day != today.getDate()) {
        res = pad0(month)+"/"+pad0(day)+"#";
    }
    res += postid.substr(4,2)+":"+postid.substr(6,2)+":"+postid.substr(8,2);
    var i = parseInt(postid.substr(10,2),10);
    switch (i) {
      case 0:
        break;
      case 1:
        res += String.fromCharCode(185);
        break;
      case 2:
      case 3:
        res += String.fromCharCode(176+i);
        break;
      default:
        res += "^"+i;
        break;
    }
    var dest = document.getElementById('palmi-list').value;
    var trib = postid.substr(13, postid.length);
    if (dest != trib) {
        res += "@"+trib;
    }
    return res;
}

function setPalmiTrib(trib) {
    var list = document.getElementById('palmi-list');
    if (trib == list.value) return;
    for (var i=list.options.length; i--;) {
        if (trib == list.options[i].value) {
            list.selectedIndex = i;
            onChangeTrib();
            break;
        }
    }
}

function onChangeTrib() {
    var trib = document.getElementById('palmi-list').value;
    var palmi = document.getElementById('palmi-message');
    palmi.style.background = GlobalBoards[trib].color;
    // update des @tribune des horloges dans le palmi
    var message = palmi.value;
    var offset = 0;
    var indexes = new Array();
    // On recherche les indices des horloges
    var h = norloge_exp.exec(message);
    while(h && h.length > 0) {
        offset += h.index + h[0].length;
        if (h[6]) {
            var refboard = getBoardFromAlias(h[6].substr(1));
            if (refboard == trib) {
                indexes.push([offset, h[6].length]);
            }
        }
        else {
            if (trib != GlobalCurTrib) {
                indexes.push([offset, "@"+GlobalCurTrib]);
            }
        }
        // Recherche de la prochaine occurrence de norloge
        h = norloge_exp.exec(message.substr(offset));
    }
    // MAJ des references @tribune
    for (var i=indexes.length-1; i>=0; i--) {
        var pos_str = indexes[i];
        if (typeof(pos_str[1]) == 'number') {
            // effacement d'un @tribune devenu inutile
            message = message.substr(0, pos_str[0]-pos_str[1])+message.substr(pos_str[0]);
        }
        else {
            // ajout d'un @tribune
            message = message.substr(0, pos_str[0])+pos_str[1]+message.substr(pos_str[0]);
        }
    }
    palmi.value = message;
    // Mémorisation de la tribune courante
    GlobalCurTrib = trib;
}

function insertInPalmi(text, pos) {
    var palmi = document.getElementById('palmi-message');
    if (pos) {
        insertTextAtCursor(palmi, text, pos); 
    }
    else {
        insertTextAtCursor(palmi, text, text.length); 
    }
}

function insertTextAtCursor(element, text, pos) {
    if (!pos) {
        pos = text.length;
    }
    if (is_ie) {
        element.focus();
        var textRange = document.selection.createRange();
        textRange.text = text;
        textRange.moveStart("character", +pos);
        textRange.moveEnd("character", +pos);
    }
    else {
        var selectionEnd = element.selectionStart + pos;
        element.value = element.value.substring(0, element.selectionStart) + text +
                        element.value.substr(element.selectionEnd);
        element.focus();
        element.setSelectionRange(selectionEnd, selectionEnd);
    }
}

function onMouseOut(event) {
    var target = event.target || event.srcElement;
    var targetClass = target.className; // getAttribute('class');
    var targetId = target.getAttribute('id');
    if (!targetClass) return;
    if (targetClass.indexOf('totoz') != -1) {
        document.getElementById('totozImg[' + targetId + ']').style.display = 'none';
    }
}

function onBlur(event) {
    var target = event.target || event.srcElement;
    if (target == window || target == document) {
        GlobalWindowFocus = false;
    }
}
addEvent(window, 'blur', onBlur, false);

function clickBoard(boardName, event) {
    if (event.ctrlKey) {
        GlobalBoardTabs[boardName].toggle();
    }
    else {
        for (var name in GlobalBoards) {
            var board = GlobalBoards[name];
            if (board.state != STATE_LOADED) {
                if (name == boardName) {
                    GlobalBoardTabs[name].display();
                    setPalmiTrib(name);
                }
                else {
                    GlobalBoardTabs[name].hide();
                }
            }
        }
    }
    toPinniBottom();
}

function filterPosts(classes) {
    if (is_ie || no_xpath) {
        var allposts = IE_selectNodes(['pinni-'], classes);
    }
    else {
        var condition = classes.map(function(i){return "not(contains(@class, '"+i+"'))"}).join(" and ");
        var allposts = evalexp("//div[contains(@class, 'pinni-') and "+condition+"]");
    }
    for (var i=getLength(allposts); i--;) {
        getItem(allposts, i).style.display = 'none';
    }
    toPinniBottom();
}

function resetFilter() {
    var allposts = GlobalPinni.getElementsByTagName("div") || [];
    for (var i=allposts.length; i--;) {
        allposts[i].style.display = '';
    }
}

function cancelFilter() {
    resetFilter();
    GlobalFilters = [];
    var allDiv = document.getElementById('tabs-filters').getElementsByTagName("div");
    for (var i=allDiv.length; i--;) {
        if (allDiv[i].className.indexOf("filter-active") != -1) {
            removeClass(allDiv[i], "filter-active");
        }
    }
    toPinniBottom();
}

function dispAll() {
    for (var name in GlobalBoardTabs) {
        var boardTab = GlobalBoardTabs[name];
        if (boardTab.board.state != STATE_LOADED) {
            boardTab.display();
        }
    }
    toPinniBottom();
}

function refreshAll() {
    for (var name in GlobalBoards) {
        var board = GlobalBoards[name];
        board.refresh();
    }
}

function stopAll() {
    for (var name in GlobalBoards) {
        var board = GlobalBoards[name];
        board.stop();
    }
}

function sendPost() {
    var dest = document.getElementById('palmi-list').value;
    var palmi = document.getElementById('palmi-message');
    GlobalBoards[dest].post(palmi.value);
    palmi.value = '';
}

function initPage() {
    // Numéro de version
    document.getElementById('version').innerHTML = VERSION;
    GlobalPinni = document.getElementById("pinnipede");
    GlobalPopup = document.getElementById("popup");
    var boards = settings.value('active_boards');
    for (var i=boards.length; i--;) {
        var name = boards[i];
        if (!GlobalBoards[name]) {
            var board = new Board(name, true);
            board.loadConfig();
            GlobalBoards[name] = board;
        }
        addTabToPinni(name);
    }
    // Ajout des onglets spéciaux
    var filters = {
        'mypost': "mes posts",
        'answer': "réponses",
        'bigorno': "bigorno&lt;",
        'newpost': "nouveaux",
        'pasplonk': "plonk"
    };
    var filter = null;
    for (var f in filters) {
        filter = document.createElement("div");
        filter.setAttribute('id', "filter-"+f);
        filter.className = "filter";
        filter.innerHTML = filters[f];
        document.getElementById("tabs-filters").appendChild(filter);
        addEvent(filter, "click", function(e){var z=e.target || e.srcElement; toggleFilter(z.getAttribute('id').substr(7));}, false);
    }
    // Ajout de la fenêtre d'aide au premier lancement
    var help = document.getElementById('help');
    if (boards.length <= 0) {
        help.style.display = 'block';
        dispConfig();
    }
    else {
        help.style.display = 'none';
        onChangeTrib();
    }
}

function toggleFilter(filter) {
    resetFilter();
    var fbut = document.getElementById("filter-"+filter);
    if (GlobalFilters.contains(filter)) {
        removeClass(fbut, "filter-active");
        GlobalFilters.remove(filter);
    }
    else {
        addClass(fbut, "filter-active");
        GlobalFilters.push(filter);
    }
    filterPosts(GlobalFilters);
}

function onLoad() {
    getSoundList();
    settings.setDefault();
    settings.load();
    addEvent(document.getElementById('palmi-list'), "change", onChangeTrib, false);
    initPage();
    applyGlobalCSS();
    favicon.change(settings.value('favicon'), settings.value('window_title'));
    addEvent(GlobalPinni, 'mouseover', onMouseOver, false);
    addEvent(GlobalPinni, 'mouseout', onMouseOut, false);
    addEvent(GlobalPinni, 'click', onClick, false);
    addEvent(document, 'keydown', onKeyDown, false);
    addEvent(document.getElementById('post-form'), 'submit', onSubmit, false);
    addEvent(document.getElementById('totoz-form'), 'submit', onSubmit, false);
    balltrap_init();
    // window.onresize = balltrap_init;
    addEvent(window, 'resize', balltrap_init, false);
    /* for (var name in GlobalBoards) {
        var board = GlobalBoards[name];
        (board.initstate == STATE_STOP) ? board.stop() : board.refresh();
    } */
}
addEvent(window, 'load', onLoad, false);

function onUnload() {
    var boards = new Array();
    for (var name in GlobalBoards) {
        board = GlobalBoards[name];
        //if (board.tmpcookie) {
        //    board.cookie = '';
        //}
        if (board.state != STATE_LOADED) {
            boards.push(name);
            board.saveConfig();
        }
    }
    settings.set('active_boards', boards);
    settings.save();
}
addEvent(window, 'unload', onUnload, false);

function onSubmit(event) {
    var target = event.target || event.srcElement;
    if (is_ie) {
        event.cancelBubble = true;
        event.returnValue = false;
    }
    else {
        event.stopPropagation();
        event.preventDefault();
    }
    var dest = target.getAttribute('id');
    // alert("target submit: "+dest);
    if (dest == 'palmi-message' || dest == 'post-form') {
        sendPost();
    }
    else if (dest == 'totoz-search' || dest == 'totoz-form') {
        searchTotoz();
    }
    return false;
}

function onKeyDown(event) {
    var target = event.target || event.srcElement;
    if (event.keyCode == 27) {
        bossMode();
    }
    else if (target.id == 'palmi-message') {
        if (event.altKey) {
            var keychar = String.fromCharCode(event.keyCode).toLowerCase();
            switch(keychar) {
              case 'o':
                insertInPalmi('_o/* <b>BLAM</b>! ');
                break;
              case 'm':
                insertInPalmi('====> <b>Moment ' + getSelectedText() +'</b> <====', 16);
                break;
              case 'f':
                insertInPalmi('#fortune ');
                break;
              case 'b':
                insertInPalmi('<b>' + getSelectedText()+'</b>', 3);
                break;
              case 'i':
                insertInPalmi('<i>' + getSelectedText()+'</i>', 3);
                break;
              case 'u':
                insertInPalmi('<u>' + getSelectedText()+'</u>', 3);
                break;
              case 's':
                insertInPalmi('<s>' + getSelectedText()+'</s>', 3);
                break;
              case 't':
                insertInPalmi('<tt>' + getSelectedText()+'</tt>', 4);
                break;
              case 'p':
                insertInPalmi('_o/* <b>paf!</b> ');
                break;
              case 'c':
                insertInPalmi('<code>'+ getSelectedText()+'</code>', 6);
                break;
              case 'a':
                insertInPalmi('\u266A <i>'+ getSelectedText()+'</i> \u266A', 5);
                break;
              case 'l':
                insertInPalmi('[:' + getSelectedText() + ']', 2);
                break;
              case 'n':
                insertInPalmi('ounet');
                break;
              case 'g':
                insertInPalmi('Ta gueule pwet');
                break;
              case 'z':
                insertInPalmi('Daubian is dying');
                break;
            }
            switch(keychar) {
              case 'o':
              case 'm':
              case 'f':
              case 'b':
              case 'i':
              case 'u':
              case 's':
              case 't':
              case 'p':
              case 'c':
              case 'a':
              case 'n':
              case 'g':
              case 'l':
              case 'z':
                if (is_ie) {
                    event.cancelBubble = true;
                    event.returnValue = false;
                }
                else {
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }
    }
}

function getSelectedText(){
    base = document.getElementById("palmi-message");
    if (is_ie) {
        base.focus();
        return document.selection.createRange().text;
    }
    else {
        return base.value.substring(base.selectionStart, base.selectionEnd);
    }
}

function newBoard() {
    var panel = document.getElementById('newboard');
    var list = document.getElementById('newbord-list');
    list.innerHTML = '';
    var notrib = true;
    for (name in GlobalBoards) {
        var board = GlobalBoards[name];
        if (board.state == STATE_LOADED) {
            var curtrib = document.createElement('li');
            curtrib.innerHTML = name;
            curtrib.setAttribute("id", "fadd-"+name);
            addEvent(curtrib, "click", function(e){var target=e.target||e.srcElement;addAndActivate(target.getAttribute('id').substr(5));});
            list.appendChild(curtrib);
            notrib = false;
        }
    }
    if (notrib) {
        panel.innerHTML += "Toutes les tribunes disponibles sont déjà actives !";
    }
    panel.style.display = 'block';
}

function addAndActivate(name) {
    addTabToPinni(name);
    closePanel('newboard');
}

function addNewBoard() {
    var triblist = document.getElementById("availableboards");
    var board = addTabToPinni(triblist.value);
    var subpanel = document.getElementById("boardsZone");
    addConfigLine(board, subpanel);
    for (var i=triblist.childNodes.length; i--;) {
       var node = triblist.childNodes[i];
       if (node.value) {
           if (node.value == board.name) {
               triblist.removeChild(node);
               break;
           }
       }
    }
}

function addTabToPinni(name) {
    var board = GlobalBoards[name];
    if (!board.getUrl) {
        alert("board "+name+" n'a pas d'url définie");
        return;
    }
    var tab = new BoardTab(board);
    GlobalBoardTabs[board.name] = tab;
    tab.addTab();
    (board.initstate == STATE_STOP) ? board.stop() : board.refresh();
    return board;
}

function attachFile() {
  var file_frame = document.getElementById('attach');
  file_frame.src = "attach.html";
  file_frame.style.display = 'block';
}

function postFile(file_name, file_url) {
  insertInPalmi(" " + file_url + " ");
  closePanel('attach');
}

function searchTotoz() {
    var totoz = document.getElementById('totoz-search').value;
    if (!totoz) { return; }
    document.getElementById('totoz-status').src = "img/wait.gif";
    var url = settings.value('totoz_server') + "search.xml{question}terms=" + escape(totoz); // + "{amp}xml=true";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'backend.php?url='+url, true);
    xhr.onreadystatechange = function() {
        switch (xhr.readyState) {
          case 4:
            displayTotoz(xhr);
            break;
          default:
            // inprogress(xhr);
            break;
        }
      };
    try {
        xhr.send(null);
    }
    catch(err) {
        document.getElementById('totoz-status').src = "img/error.png";
    }
}

function displayTotoz(xhr) {
    try {
        var status = xhr.status;
    }
    catch(err) {
        document.getElementById('totoz-status').src = "img/error.png";
        return;
    }
    if (status == 200) {
        totozPanel = document.getElementById('totozpanel');
        totozPanel.style.display = 'block';
        document.getElementById('totoz-status').src = "img/blank.gif";
        var res = xhr.responseText;
        var totozfound = loadXML(res);
        var totozNodes = totozfound.getElementsByTagName("name") || [];
        var totozList = document.getElementById('totoz-list');
        totozList.innerHTML = '';
        totozwrap = document.createElement('table');
        totozTable = document.createElement('tbody');
        totozwrap.appendChild(totozTable);
        totozTable.setAttribute('cellspacing', "0");
        totozList.appendChild(totozwrap);
        var server = settings.value('totoz_server');
        for (var i=totozNodes.length; i--;) {
            var curtotoz = getNodeText(totozNodes[i]); //.textContent.strip();
            var totoz = "[:"+curtotoz+"]";
            var tr = document.createElement('tr');
            tr.setAttribute('onclick', 'insertInPalmi("'+totoz+" "+'")');
            var td = document.createElement('td');
            td.innerHTML = '<img src="'+server+'/img/'+curtotoz+'" alt="'+totoz+'" />';
            tr.appendChild(td);
            td = document.createElement('td');
            td.innerHTML = '<span class="totoz">'+totoz+'</span>';
            tr.appendChild(td);
            totozTable.appendChild(tr);
        }
    }
}

function closePanel(panel) {
    document.getElementById(panel).style.display = 'none';
}

function togglePanel(name) {
    var target = event.target || event.srcElement;
    var panel = document.getElementById(name);
    if (panel.style.display != 'none') {
        panel.style.display = 'none';
        removeClass(target, 'activeButton');
    }
    else {
        addClass(target, 'activeButton');
        panel.style.display = 'block';
    }
}

// Gestion des canards volants
var _x=300, _y=300, v=9, b=v*2, GlobalNumDucks=0, r=100, f=10, cx, cy;
function balltrapIcon() {
    if (GlobalNumDucks) {
        var divs = document.getElementsByTagName('div');
        for (var i=divs.length; i--;) {
            var curDiv = divs[i];
            if (curDiv.getAttribute('id') && curDiv.getAttribute('id').substr(0,5) == "duck-") {
                curDiv.a = 16;
                balltrap_tombe(curDiv);
                GlobalNumDucks--;
            }
            if (!GlobalNumDucks) break;
        }
        GlobalNumDucks = 0;
    }
    else {
        launchDuck('', false);
    }
}
function launchDuck(postid, is_table) {
    // alert("duck at: "+postid);
    if (GlobalNumDucks++ > (settings.value('max_ducks')-1)) return;
    var K = document.getElementById("balltrap");
    var d = K.cloneNode(true);
    d.setAttribute('id', 'duck-'+postid);
    if (is_table) { d.firstChild.src = "img/flapflap.gif"; }
    addEvent(d, "mousedown", function (){balltrap_touche(d);}, false);
    // d.onmousedown = balltrap_touche;
    d.x = ((Math.random()*(_x-(32+(2*b))))|0)+b;
    d.style.left = d.x+"px";
    d.y = (Math.random()*(_y-(32+(2*b))))+b;
    d.style.top = d.y+"px";
    d.dx = (((Math.random()*4)&1)*2)-1;
    balltrap_dir(d);
    d.c = 7;
    d.firstChild.style.right = (d.c*32)+"px";
    d.t = setInterval(function(){balltrap_move(d)},80+(Math.random()*30));
    K.parentNode.insertBefore(d,K);
}

function balltrap_move(d) {
    if ((d.dx!=1) && (d.x<b)) {
        d.dx = 1;
        d.c = 4;
        balltrap_dir(d);
    }
    else if ((d.dx==1) && ((d.x+32+b)>_x)) {
        d.dx = -1;
        d.c = 9;
        balltrap_dir(d);
    }
    if (((d.dy<0) && ((d.y<b) || ((d.dy<cy) && (cy<r)))) || ((d.dy>0) && ((d.y+32+b>_y) || ((d.y+32>cy) && (cy+r>_y))))) {
        d.dy=-d.dy;
    }
    d.c += d.dx;
    if (d.c>12) {
        d.c = 9;
        balltrap_dir(d);
    }
    else {
        if (d.c<=0) {
            d.c = 4;
            balltrap_dir(d);
        }
    }
    d.firstChild.style.right = (d.c*32)+"px";
    if ((d.c<5) || (d.c>8)) {
        d.x += d.dx*v;
        d.style.left = d.x+"px";
        d.y += d.dy;
        d.style.top = (d.y|0)+"px";
    }
}
function balltrap_tombe(d) {
    if (d.a++>15) {
        clearInterval(d.t);
        d.parentNode.removeChild(d);
    }
    else {
        d.x += d.dx*v;
        d.style.left = d.x+"px";
        d.y += 3*d.a;
        d.style.top = d.y+"px";
    }
}
function balltrap_touche(d) {
    GlobalNumDucks--;
    // alert(d);
    // ev = ev || window.event;
    // ev.stopPropagation();
    // ev.preventDefault();
    // var a = this;
    clearInterval(d.t); // clearInterval(this.t);
    // this.onmousedown = null;
    d.a = 0; // this.a = 0;
    s = d.firstChild.style; // s = this.firstChild.style;
    s.right = "416px";
    if (d.dx<0) { // if (this.dx<0) {
        s.right="0px";
    }
    var nodeId = d.getAttribute('id'); // var nodeId = this.getAttribute('id');
    balltrap_kill(nodeId.substr(5));
    d.t = setInterval(function(){balltrap_tombe(d);},80); // this.t = setInterval(function(){balltrap_tombe(a);},80);
}
function balltrap_kill(nodeId) {
    if (!nodeId || settings.value('balltrap_silent')) return;
    var board = nodeId.substr(13);
    setPalmiTrib(board);
    var d = document.getElementById(nodeId);
    // alert(nodeId + "\n"+d.innerHTML);
    var pan = '';
    if (d && d.innerHTML.toLowerCase().indexOf('<span class="canard table') != -1) {
        pan = " *tronçonneuse*";
    }
    else {
        pan = " pan ! pan !";
    }
    // insertInPalmi(getCtxtClock(nodeId)+pan);
    GlobalBoards[board].post(getCtxtClock(nodeId)+pan);
}
function balltrap_dst(a, b, c) {
    a -= b;
    if (a<0) a = -a;
    return a<c;
}
function balltrap_dir(d) {
    if ((balltrap_dst(d.x, cx, 2*r)) && (balltrap_dst(d.y, cy, r))) {
        if (d.y>cy) d.dy = 5;
        else d.dy = -5;
    }
    else d.dy = 3*(1-(Math.random()*2));
}
function balltrap_mv(ev) {
    ev = ev || window.event;
    cx = ev.pageX || ev.clientX;
    cy = ev.pageY || ev.clientY;
    return false;
}
function balltrap_init() {
    addEvent(document, "mousemove", balltrap_mv, false);
    d = window;
    if (typeof(d.innerWidth) == 'number') {
        _x = d.innerWidth;
        _y = d.innerHeight;
    }
    else if ((d = document.documentElement) && d.clientWidth) {
        _x = d.clientWidth;
        _y = d.clientHeight;
    }
    else if ((d = document.body) && d.clientWidth) {
        _x = d.clientWidth;
        _y = d.clientHeight;
    }
}

function bossMode() {
    var bossframe = document.getElementById("bossframe");
    var mode = settings.value('boss_mode');
    if (mode == BOSSMODE_RANDOM) {
        mode = [BOSSMODE_PTRAMO, BOSSMODE_KERVIEL, BOSSMODE_PBPG, BOSSMODE_DECIDEUR][Math.floor(Math.random()*4)];
    }
    bossframe.innerHTML = '';
    bossframe.onclick = function () { bossframe.style.display = 'none'; };
    switch (mode) {
      case BOSSMODE_PTRAMO:
        bossframe.innerHTML = '<h1>500 Servlet Exception</h1> \n' +
'<pre>com.ibm.ws.exception.ConfigurationError: Runtime Error, open failure \n' +
'        at com.ibm.ws.runtime.component.DeployedModuleImpl.initialize(DeployedModuleImpl.java:280) \n' +
'        at com.ibm.ws.runtime.component.DeployedApplicationImpl.initializeModule(DeployedApplicationImpl.java:700) \n' +
'        at com.ibm.ws.runtime.component.DeployedApplicationImpl.initialize(DeployedApplicationImpl.java:402) \n' +
'        at com.ibm.ws.runtime.component.ApplicationMgrImpl.initializeApplication(ApplicationMgrImpl.java:135) \n' +
'        at com.ibm.ws.runtime.component.ApplicationMgrImpl.start(ApplicationMgrImpl.java:203) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.startComponents(ContainerImpl.java:343) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.start(ContainerImpl.java:234) \n' +
'        at com.ibm.ws.runtime.component.ApplicationServerImpl.start(ApplicationServerImpl.java:117) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.startComponents(ContainerImpl.java:343) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.start(ContainerImpl.java:234) \n' +
'        at com.ibm.ws.runtime.component.ServerImpl.start(ServerImpl.java:182) \n' +
'        at com.ibm.ws.runtime.WsServer.start(WsServer.java:135) \n' +
'        at com.ibm.ws.runtime.WsServer.main(WsServer.java:232) \n' +
'        at java.lang.reflect.Method.invoke(Native Method) \n' +
'        at com.ibm.ws.bootstrap.WSLauncher.main(WSLauncher.java:94) \n' +
'        at com.ibm.etools.websphere.tools.runner.api.ServerRunnerV5$1.run(ServerRunnerV5.java:105) \n' +
'-- Begin nested stack trace -- \n' +
'org.xml.sax.SAXParseException: The content of element type "ejb-jar" is incomplete, it must match "(description?,display-name?,small-icon?,large-icon?,enterprise-beans,relationships?,assembly-descriptor?,ejb-client-jar?)". \n' +
'        at org.apache.xerces.parsers.DOMParser.parse(DOMParser.java:235) \n' +
'        at org.apache.xerces.jaxp.DocumentBuilderImpl.parse(DocumentBuilderImpl.java:209) \n' +
'        at com.ibm.etools.j2ee.xml.bridge.GeneralXmlDocumentReader.parse(GeneralXmlDocumentReader.java:198) \n' +
'        at com.ibm.etools.j2ee.xml.bridge.GeneralXmlDocumentReader.parseDocument(GeneralXmlDocumentReader.java:221) \n' +
'        at com.ibm.etools.j2ee.xml.DeploymentDescriptorImportExport.primImportFrom(DeploymentDescriptorImportExport.java:250) \n' +
'        at com.ibm.etools.j2ee.xml.DeploymentDescriptorImportExport.primImportFrom(DeploymentDescriptorImportExport.java:239) \n' +
'        at com.ibm.etools.j2ee.xml.EjbJarDeploymentDescriptorImportExport.importFrom(EjbJarDeploymentDescriptorImportExport.java:54) \n' +
'        at com.ibm.etools.ejb.impl.EJBJarResourceFactory.importXML(EJBJarResourceFactory.java:30) \n' +
'        at com.ibm.etools.j2ee.common.impl.XMLResourceFactory.load(XMLResourceFactory.java:68) \n' +
'        at com.ibm.etools.j2ee.common.impl.XMLResourceFactory.load(XMLResourceFactory.java:84) \n' +
'        at com.ibm.etools.emf.resource.impl.ResourceFactoryImpl.load(ResourceFactoryImpl.java:77) \n' +
'        at com.ibm.etools.emf.resource.impl.ResourceSetImpl.load(ResourceSetImpl.java:289) \n' +
'        at com.ibm.etools.archive.impl.LoadStrategyImpl.getMofResource(LoadStrategyImpl.java:222) \n' +
'        at com.ibm.etools.commonarchive.impl.ArchiveImpl.getMofResource(ArchiveImpl.java:528) \n' +
'        at com.ibm.etools.commonarchive.impl.ModuleFileImpl.getDeploymentDescriptorResource(ModuleFileImpl.java:65) \n' +
'        at com.ibm.etools.archive.impl.XmlBasedImportStrategyImpl.primLoadDeploymentDescriptor(XmlBasedImportStrategyImpl.java:35) \n' +
'        at com.ibm.etools.archive.impl.EjbJar11ImportStrategyImpl.loadDeploymentDescriptor(EjbJar11ImportStrategyImpl.java:73) \n' +
'        at com.ibm.etools.archive.impl.EjbJar11ImportStrategyImpl.importMetaData(EjbJar11ImportStrategyImpl.java:68) \n' +
'        at com.ibm.etools.commonarchive.impl.EJBJarFileImpl.getDeploymentDescriptor(EJBJarFileImpl.java:152) \n' +
'        at com.ibm.etools.commonarchive.impl.EJBJarFileImpl.getStandardDeploymentDescriptor(EJBJarFileImpl.java:212) \n' +
'        at com.ibm.etools.commonarchive.impl.EARFileImpl.getDeploymentDescriptor(EARFileImpl.java:446) \n' +
'        at com.ibm.etools.commonarchive.impl.ModuleRefImpl.getDeploymentDescriptor(ModuleRefImpl.java:525) \n' +
'        at com.ibm.ws.runtime.component.DeployedModuleImpl.open(DeployedModuleImpl.java:113) \n' +
'        at com.ibm.ws.runtime.component.DeployedModuleImpl.initialize(DeployedModuleImpl.java:277) \n' +
'        at com.ibm.ws.runtime.component.DeployedApplicationImpl.initializeModule(DeployedApplicationImpl.java:700) \n' +
'        at com.ibm.ws.runtime.component.DeployedApplicationImpl.initialize(DeployedApplicationImpl.java:402) \n' +
'        at com.ibm.ws.runtime.component.ApplicationMgrImpl.initializeApplication(ApplicationMgrImpl.java:135) \n' +
'        at com.ibm.ws.runtime.component.ApplicationMgrImpl.start(ApplicationMgrImpl.java:203) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.startComponents(ContainerImpl.java:343) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.start(ContainerImpl.java:234) \n' +
'        at com.ibm.ws.runtime.component.ApplicationServerImpl.start(ApplicationServerImpl.java:117) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.startComponents(ContainerImpl.java:343) \n' +
'        at com.ibm.ws.runtime.component.ContainerImpl.start(ContainerImpl.java:234) \n' +
'        at com.ibm.ws.runtime.component.ServerImpl.start(ServerImpl.java:182) \n' +
'        at com.ibm.ws.runtime.WsServer.start(WsServer.java:135) \n' +
'        at com.ibm.ws.runtime.WsServer.main(WsServer.java:232) \n' +
'        at java.lang.reflect.Method.invoke(Native Method) \n' +
'        at com.ibm.ws.bootstrap.WSLauncher.main(WSLauncher.java:94) \n' +
'        at com.ibm.etools.websphere.tools.runner.api.ServerRunnerV5$1.run(ServerRunnerV5.java:105) \n' +
'</pre>';
        bossframe.style.backgroundColor = '#ffffff';
        bossframe.style.backgroundImage = 'none';
        break;
      case BOSSMODE_KERVIEL:
        bossframe.style.backgroundColor = '#ffffff';
        bossframe.style.backgroundImage = 'url("courssco.png")';
        break;
      case BOSSMODE_DECIDEUR:
        bossframe.style.backgroundColor = '#c0c0c0';
        bossframe.style.backgroundImage = 'url("excel.png")';
        break;
      case BOSSMODE_PBPG:
        bossframe.innerHTML = '<table width="410" cellpadding="3" cellspacing="5"><tr><td align="left" valign="middle" width="360"><h1 style="COLOR:000000; FONT: 13pt/15pt verdana">The page cannot be found</h1></td></tr><tr><td width="400" colspan="2"><font style="COLOR:000000; FONT: 8pt/11pt verdana">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</font></td></tr><tr><td width="400" colspan="2"><font style="COLOR:000000; FONT: 8pt/11pt verdana"><hr color="#C0C0C0" noshade><p>Please try the following:</p><ul><li>If you typed the page address in the Address bar, make sure that it is spelled correctly.<br></li>'+
'<li>Open the <a href="http://www.voyages-sncf.com/">www.voyages-sncf.com</a> home page, and then look for links to the information you want.</li><li>Click the <a href="javascript:history.back(1)">Back</a> button to try another link.</li></ul><h2 style="font:8pt/11pt verdana; color:000000">HTTP 404 - File not found<br>Internet Information Services<BR></h2><hr color="#C0C0C0" noshade><p>Technical Information (for support personnel)</p><ul><li>More information:<br><a href="http://www.microsoft.com/ContentRedirect.asp?prd=iis&sbp=&pver=5.0&pid=&ID=404&cat=web&os=&over=&hrd=&Opt1=&Opt2=&Opt3=" target="_blank">Microsoft Support</a></li></ul></font></td></tr></table>';
        bossframe.style.backgroundColor = '#ffffff';
        bossframe.style.backgroundImage = 'none';
        break;
    }
    bossframe.style.display = 'block';
}


