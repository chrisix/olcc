/************************************************************
 * Olcc - helpers
 * Fonctions de transformation ou mise en forme des messages
 ************************************************************/

function writeDuck(message, board, post, postid) {
    var tete = '([o0ôö°øòó@]|&ocirc;|&ouml;|&deg;|&oslash;|&ograve;|&oacute;)'
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



