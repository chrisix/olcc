/************************************************************
 * OnlineCoinCoin, by Chrisix (chrisix@gmail.com)
 * Fonctions de gestion des options de configuration utilisateur
 ************************************************************/

var TYPE_INT = "int";
var TYPE_STR = "string";
var TYPE_BOOL = "bool";
var TYPE_CHOICE = "choice";
var TYPE_MULTI_CHOICE = "multichoice";
var TYPE_SOUND = "sound";

/*
function Option(descr, value, type) {
    this.descr = descr;
    this.value = value;
    this.type = type;
} */

var settings = {
    options: {
        'active_boards': {
            descr: "Tribunes actives",
            type: TYPE_MULTI_CHOICE
        },
        'pinni_size': {
            descr: "Nombre max de posts",
            type: TYPE_INT
        },
        'pinni_keep': {
            descr: "Ne jamais effacer mes posts et leurs réponses",
            type: TYPE_BOOL
        },
        'default_ua': {
            descr: "User-agent",
            type: TYPE_STR
        },
        'totoz_server': {
            descr: "Serveur de totoz",
            type: TYPE_STR
        },
        'totoz_mode': {
            descr: "Affichage des totoz",
            type: TYPE_CHOICE
        },
        'default_login': {
            descr: "Login par défaut",
            type: TYPE_STR
        },
        'window_title': {
            descr: "Titre de la fenêtre",
            type: TYPE_STR
        },
        'favicon': {
            descr: "Icone de la fenêtre",
            type: TYPE_STR
        },
        'boss_mode': {
            descr: "Boss-mode",
            type: TYPE_CHOICE
        },
        'style': {
            descr: "Style",
            type: TYPE_CHOICE
        },
        'plonk': {
            descr: "Plonk-list",
            type: TYPE_STR
        },
        'balltrap': {
            descr: "Balltrap",
            type: TYPE_BOOL
        },
        'max_ducks': {
            descr: "Nombre max de canards",
            type: TYPE_INT
        },
        'balltrap_mode': {
            descr: "Mode de chasse",
            type: TYPE_CHOICE
        },
        'balltrap_silent': {
            descr: "Chasse silencieuse",
            type: TYPE_BOOL
        },
        'sound_enabled': {
            descr: "Sons activés",
            type: TYPE_BOOL
        },
        'sound_volume': {
            descr: "Volume (1-100)",
            type: TYPE_INT
        },
        'sound_new': {
            descr: "Arrivée de nouveaux posts",
            type: TYPE_SOUND
        },
        'sound_reply': {
            descr: "Réponse à un de mes posts",
            type: TYPE_SOUND
        },
        'sound_bigorno': {
            descr: "Bigornophone",
            type: TYPE_SOUND
        },
        'sound_zoo': {
            descr: "Zoodvinssen activé",
            type: TYPE_BOOL
        }
    },
    setDefault: function () {
        for (var opt in this.options) {
            this.options[opt].value = eval('DEFAULT_'+opt.toUpperCase());
        }
    },
    set: function(name, val) {
        this.options[name].value = val;
    },
    value: function (name) {
        return this.options[name].value;
    },
    save: function () {
        var tab = new Array();
        // alert("save");
        for (var opt in this.options) {
            var val = this.value(opt);
            if (this.options[opt].type == TYPE_MULTI_CHOICE) {
                val = val.join("|");
            }
            tab.push(opt+"="+val);
        }
        setCookie("settings", tab.join("\n"), 10000);
    },
    load: function () {
        var settings = getCookie("settings");
        // alert("load: "+settings);
        if (settings) {
            var pairs = settings.split("\n");
            // alert("pairs.length="+pairs.length+" ; pairs="+pairs);
            for (var i=pairs.length; i--;) {
                var opt_val = pairs[i];
                if (!opt_val) continue;
                var eqpos = opt_val.indexOf('=');
                var name = opt_val.substr(0, eqpos);
                var opt = this.options[name];
                var val = opt_val.substr(eqpos+1, opt_val.length);
                if (name == 'default_ua') { // MAJ du numéro de version dans l'UA
                    val = val.replace(/((?:ol|online)(?:cc|c²|coincoin))\/[0-9]+\.[0-9]+\.[0-9]+/i, '$1/'+VERSION);
                }
                // alert("name="+name+" ; val="+val);
                switch (opt.type) {
                  case TYPE_INT:
                  case TYPE_BOOL:
                    val = eval(val);
                    break;
                  case TYPE_MULTI_CHOICE:
                    val = (val) ? val.split("|") : [];
                    break;
                }
                opt.value = val;
            }
        }
    }
}

var GlobalBufStyle = '';

// Bascule affichage/fermeture du panneau de config
function toggleConfig() {
    if (document.getElementById("config").style.display != 'none') {
        closeConfig();
    }
    else {
        dispConfig();
    }
}

// affichage du panneau de config
function dispConfig() {
    var configPanel = document.getElementById("config");
    createConfigPanel(configPanel);
    configPanel.style.display = 'block';
}

// fermeture du panneau de config
function closeConfig() {
    var configPanel = document.getElementById("config");
    configPanel.style.display = 'none';
    // removage des vues
    for (var name in GlobalBoards) {
        var board = GlobalBoards[name];
        if (board.state != STATE_LOADED) {
            board.removeView(document.getElementById('config-'+board.name));
        }
    }
}

function saveConfig() {
    for (var opt in settings.options) {
        var cur_opt = settings.options[opt];
        var opt_elem = document.getElementById('config-'+opt);
        switch (cur_opt.type) {
          case TYPE_INT:
            cur_opt.value = eval(opt_elem.value);
            break;
          case TYPE_BOOL:
            cur_opt.value = opt_elem.checked;
            break;
          case TYPE_CHOICE:
            var tmpval = opt_elem.options[opt_elem.selectedIndex].value;
            if (tmpval) {  // Pour IE6 qui ne sait pas trouver les valeurs des combobox
              cur_opt.value = tmpval; 
            }
            break;
          case TYPE_STR:
          case TYPE_SOUND:
            cur_opt.value = opt_elem.value;
            if (opt == 'window_title') {
                document.title = cur_opt.value;
            }
            else if (opt == 'favicon') {
                favicon.change(cur_opt.value);
            }
            break;
          case TYPE_MULTI_CHOICE:
            if (opt == 'active_boards') {
                var res = new Array();
                for (var name in GlobalBoards) {
                    if (GlobalBoards[name].state != STATE_LOADED) {
                        res.push(name);
                    }
                }
                cur_opt.value = res;
            }
            break;
        }
    }
    settings.save();
    if (GlobalBufStyle != settings.value('style')) {
        applyGlobalCSS();
        GlobalBufStyle = settings.value('style');
    }
    closeConfig();
}


// Ajoute une ligne dans le tableau de configuration des tribunes actives
function addConfigLine(board, subpanel) {
    tr = document.createElement('tr');
    tr.setAttribute('id', 'config-'+board.name);
    tr.className = 'subpanel'; // setAttribute('class', "subpanel");
    // Cellule nom de la tribune
    td = document.createElement('td');
    td.className = 'panel-board tab-'+board.name; // setAttribute('class', 'panel-board');
    td.innerHTML = board.name;
    // td.style.background = board.color;
    tr.appendChild(td);
    // Cellule bouton start
    td = document.createElement('td');
    icon = (board.state == STATE_STOP) ? "start.png" : "greystart.png";
    td.innerHTML = '<img id="but-start-'+board.name+'" src="img/'+icon+'" alt="[Démarrer]" title="Démarrer" onclick="BoardStart(GlobalBoards['+"'"+board.name+"'"+'])" />';
    tr.appendChild(td);
    // Cellule bouton stop
    td = document.createElement('td');
    icon = (board.state == STATE_STOP) ? "greystop.png" : "stop.png";
    td.innerHTML = '<img id="but-stop-'+board.name+'" src="img/'+icon+'" alt="[Arrêter]" title="Arrêter" onclick="BoardStop(GlobalBoards['+"'"+board.name+"'"+'])" />';
    tr.appendChild(td);
    // Cellule bouton config
    td = document.createElement('td');
    td.innerHTML = '<img id="but-config-'+board.name+'" src="img/bconfig.png" alt="[Paramètres]" title="Paramètres" onclick="configBoard('+"'"+board.name+"'"+')" />';
    tr.appendChild(td);
    // Cellule bouton remove
    td = document.createElement('td');
    td.innerHTML = '<img id="but-remove-'+board.name+'" src="img/remove.png" alt="[Supprimer]" title="Supprimer" onclick="configRemove('+"'"+board.name+"'"+')" />';
    tr.appendChild(td);
    // Cellule nombre de posts
    td = document.createElement('td');
    td.setAttribute('id', "nbposts-"+board.name);
    td.className = 'cinfo';
    td.innerHTML = board.nbPosts + " posts";
    tr.appendChild(td);
    // Cellule état
    td = document.createElement('td');
    td.setAttribute('id', "cstate-"+board.name);
    td.className = 'cstate';
    td.innerHTML = "["+board.state+"]";
    tr.appendChild(td);
    // Ajout de la ligne
    subpanel.appendChild(tr);
    tr.notified = function (notif, state) {
        var name = this.getAttribute('id').substr(7);
        var board = GlobalBoards[name];
        switch (notif) {
          case NOTIF_STATE:
            document.getElementById("cstate-"+name).innerHTML = "["+board.state+"]";
            switch (state) {
              case STATE_LOADED:
                // self destruction
                break;
              case STATE_STOP:
                document.getElementById("but-start-"+name).src = "img/start.png";
                document.getElementById("but-stop-"+name).src = "img/greystop.png";
                break;
              default:
                document.getElementById("but-start-"+name).src = "img/greystart.png";
                document.getElementById("but-stop-"+name).src = "img/stop.png";
                break;
            }
            break;
          case NOTIF_NEW_POST:
            document.getElementById("nbposts-"+name).innerHTML = board.nbPosts + " posts";
            break;
        }
    };
    board.addView(tr);
}

var config_sections = [
    { name: "Général", descr: "Paramètres généraux", img: "application32.png" },
    { name: "Tribunes", descr: "Configuration des tribunes", img: "comments32.png" },
    { name: "Sons", descr: "Notifications sonores", img: "sound32.png" },
    { name: "Load/Store", descr: "chargement/déchargement des paramètres", img: "ls32.png" }
];

// Creation du panneau de config
// Onglets du panneau de config
function createConfigTabs(panel) {
    var head1 = document.createElement('div');
    head1.className = 'panel-header'; // setAttribute('class', "panel-header");
    head1.innerHTML = 'OnlineCoinCoin '+VERSION+' - Configuration';
    head1.innerHTML += ' <img src="img/closeok.png" alt="[Ok]" title="Enregistrer les changements et fermer" onclick="saveConfig()" />';
    head1.innerHTML += ' <img src="img/cancel.png" alt="[Annuler]" title="Annuler les changements et fermer" onclick="closeConfig()" />';
    panel.appendChild(head1);
    var tabbar = document.createElement('div');
    tabbar.className = "panel-tabs";
    panel.appendChild(tabbar);
    for (var i=0; i<config_sections.length; i++) {
        var subpanel = document.createElement('div');
        subpanel.className = "subpanel";
        subpanel.setAttribute('id', "config-tab-"+i);
        panel.appendChild(subpanel);
        var tab = document.createElement('div');
        tab.className = "panel-tab";
        tab.setAttribute('id', "config-tab-but-"+i);
        tab.innerHTML = '<img src="img/'+config_sections[i].img+'" alt="['+config_sections[i].name+']" title="'+config_sections[i].descr+'" /><br />'+config_sections[i].name;
        /* var coin = function() {alert(i);setConfigTab(i)}; */
        addEvent(tab, "click", coin(i), false);
        tabbar.appendChild(tab);
    }
}
function coin(t) {
  return function(){setConfigTab(t)};
}
function setConfigTab(t) {
    for (var i=0; i<config_sections.length; i++) {
        if (i==t) {
            document.getElementById('config-tab-'+i).style.display = 'block';
            addClass(document.getElementById('config-tab-but-'+i), 'tab-active');
        }
        else {
            document.getElementById('config-tab-'+i).style.display = 'none';
            removeClass(document.getElementById('config-tab-but-'+i), 'tab-active');
        }
    }
}

function addOptionLine(opt, subpanel) {
    var cur_opt = settings.options[opt];
    var size = -1;
    switch (cur_opt.type) {
      case TYPE_INT:
        size = 3;
      case TYPE_STR:
        subpanel.appendChild(TextBox('config-'+opt, cur_opt.descr, cur_opt.value, size));
        break;
      case TYPE_BOOL:
        subpanel.appendChild(CheckBox('config-'+opt, cur_opt.descr, cur_opt.value));
        break;
      case TYPE_CHOICE:
        var tab = null;
        switch (opt) {
          case 'totoz_mode':
            tab = [TOTOZ_POPUP, TOTOZ_INLINE];
            break;
          case 'boss_mode':
            tab = [BOSSMODE_RANDOM, BOSSMODE_PTRAMO, BOSSMODE_KERVIEL, BOSSMODE_PBPG, BOSSMODE_DECIDEUR]
            break;
          case 'style':
            tab = ['default', 'lefttabs', 'sfw', 'golcc', 'oldolcc'];
            break;
          case 'balltrap_mode':
            tab = [BALLTRAP_ONCLICK, BALLTRAP_AUTO, BALLTRAP_KILL];
            break;
        }
        if (tab) {
            subpanel.appendChild(SelectBox('config-'+opt, cur_opt.descr, tab, cur_opt.value, size));
        }
        break;
      case TYPE_SOUND:
        subpanel.appendChild(SoundBox('config-'+opt, cur_opt.descr, cur_opt.value, size));
        break;
    }
}

function createConfigPanel(cpanel) {
    cpanel.innerHTML = '';
    GlobalBufStyle = settings.value('style');
    createConfigTabs(cpanel);
    setConfigTab(0);
    
    // Section config générale
    var panel = document.getElementById('config-tab-0');
    var subpanelwrapper = document.createElement('table');
    subpanelwrapper.style.width = "100%";
    var subpanel = document.createElement('tbody');
    subpanelwrapper.appendChild(subpanel);
    subpanel.setAttribute('id', "configZone");
    subpanel.setAttribute('class', "subpanel");
    var opt = null;
    for (opt in settings.options) {
        if (opt.substr(0,5) != 'sound') {
            addOptionLine(opt, subpanel);
        }
    }
    panel.appendChild(subpanelwrapper);
    
    // Section tribunes
    var panel = document.getElementById('config-tab-1');
    var head2 = document.createElement('div');
    head2.className = 'panel-header'; // setAttribute('class', "panel-header");
    head2.innerHTML = 'Tribunes activées ';
    panel.appendChild(head2);
    // Liste des tribunes disponibles
    var triblist = document.createElement('select');
    triblist.setAttribute('id', "availableboards");
    var subpanelwrapper = document.createElement('table');
    // subpanelwrapper.style.width = "100%";
    var subpanel = document.createElement('tbody');
    subpanelwrapper.appendChild(subpanel);
    subpanel.setAttribute('id', "boardsZone");
    subpanel.setAttribute('class', "subpanel");
    for (name in GlobalBoards) {
        var board = GlobalBoards[name];
        if (board.state != STATE_LOADED) {
            addConfigLine(board, subpanel);
        }
        else {
            addAvailableBoard(triblist, name);
        }
    }
    panel.appendChild(subpanelwrapper);
    // Section tribunes disponibles
    var head3 = document.createElement('div');
    head3.className = 'panel-header'; // setAttribute('class', "panel-header");
    head3.innerHTML = 'Autres tribunes disponibles ';
    panel.appendChild(head3);
    subpanel = document.createElement('div');
    subpanel.appendChild(triblist);
    subpanel.innerHTML += '<img src="img/addboard.png" alt="[+]" title="Ajouter cette tribune" onclick="addNewBoard()" />';
    subpanel.innerHTML += '<p><a href="#" onclick="addPersoBoard()">Définir une nouvelle tribune perso</a></p>';
    panel.appendChild(subpanel);
    
    // Section notifications sonores
    var panel = document.getElementById('config-tab-2');
    var head4 = document.createElement('div');
    head4.className = 'panel-header'; // setAttribute('class', "panel-header");
    head4.innerHTML = '/!\\ Support du son expérimental /!\\';
    panel.appendChild(head4);
    var subpanelwrapper = document.createElement('table');
    // subpanelwrapper.style.width = "100%";
    var subpanel = document.createElement('tbody');
    subpanelwrapper.appendChild(subpanel);
    subpanel.setAttribute('id', "soundZone");
    subpanel.setAttribute('class', "subpanel");
    var opt = null;
    for (opt in settings.options) {
        if (opt.substr(0,5) == 'sound') {
            addOptionLine(opt, subpanel);
        }
    }
    panel.appendChild(subpanelwrapper);
    
    // Section load/store
    var panel = document.getElementById('config-tab-3');
    var head5 = document.createElement('div');
    var subpanelwrapper = document.createElement('table');
    // subpanelwrapper.style.width = "100%";
    var subpanel = document.createElement('tbody');
    subpanelwrapper.appendChild(subpanel);
    subpanel.setAttribute('id', "configZone");
    subpanel.setAttribute('class', "subpanel");
    subpanel.appendChild(ButtonBox('Sauvegarde', 'Télécharger', 'window.open(\'loadstore.php\',\'olcc_params\',\'width=0,height=0\')'), subpanel)
    subpanel.appendChild(FileBox('Chargement', 'Envoyer', 'loadstore.php', 'removeEvent(window, \'unload\', onUnload, false);'), subpanel)
    panel.appendChild(subpanelwrapper);
}

// Ajoute une entrée dans la liste des tribunes disponibles non actives
function addAvailableBoard(list, name) {
    var opt = document.createElement('option');
    opt.setAttribute('value', name);
    opt.innerHTML = name;
    list.appendChild(opt);
}

var GlobalIsDefiningPersoBoard = false;
// Méthode pour définir une nouvelle tribune perso
function addPersoBoard() {
    var name = prompt("Nom de la tribune :", "");
    if (!name) return;
    if (name.match(/[^a-z0-9_]/)) {
        alert("Le nom de tribune ne peut comporter que des\ncaractères alphanumériques en minuscules\net des underscores.");
        addPersoBoard();
        return;
    }
    if (GlobalBoards[name]) {
        alert("Le nom '"+name+"' est déjà utilisé.");
        addPersoBoard();
        return;
    }
    var board = new Board(name, true);
    GlobalBoards[name] = board;
    GlobalIsDefiningPersoBoard = true;
    configBoard(name);
}

// Affiche le panneau de configuration pour la tribune "name"
function configBoard(name) {
    var board = GlobalBoards[name];
    var panel = board.configPanel();
    board.tmpcookieback = board.cookie;
    document.getElementsByTagName("body")[0].appendChild(panel);
}

// Enlève une ligne dans le tableau de configuration des tribunes actives
function configRemove(name) {
    var board = GlobalBoards[name];
    var tab = GlobalBoardTabs[name];
    var line = document.getElementById('config-'+name);
    board.removeView(line);
    board.stop();
    document.getElementById('boardsZone').removeChild(line);
    tab.removeTab()
    addAvailableBoard(document.getElementById('availableboards'), name);
}

// Sauvegarde la configuration de la tribune "name" et ferme son panneau de config
function saveBoardConfig(name) {
    var board = GlobalBoards[name];
    board.color = document.getElementById('config-color').value;
    board.updateCSS(); // change couleur style de la board
    onChangeTrib(); // pour forcer la couleur du palmipède au cas où
    board.alias = document.getElementById('config-alias').value;
    board.login = document.getElementById('config-login').value;
    board.ua = document.getElementById('config-ua').value;
    board.cookie = document.getElementById('config-cookie').value;
    if (board.tmpcookieback != board.cookie) { board.tmpcookie = false; }
    // board.plonk = document.getElementById('config-plonk').value;
    board.delay = parseInt(document.getElementById('config-delay').value)*1000;
    if (board.perso) {
        board.getUrl = document.getElementById('config-getUrl').value;
        if (!board.getUrl) {
            alert("L'URL de backend ne doit pas être vide !");
            return;
        }
        board.postUrl = document.getElementById('config-postUrl').value;
        board.postData = document.getElementById('config-postData').value;
        board.slip = document.getElementById('config-slip').value;
    }
    board.saveConfig();
    if (GlobalIsDefiningPersoBoard) {
        addTabToPinni(name);
        var subpanel = document.getElementById("boardsZone");
        addConfigLine(board, subpanel);
        GlobalIsDefiningPersoBoard = false;
    }
    cancelBoardConfig(name);
}

// Ferme le panneau de config de la tribune "name"
function cancelBoardConfig(name) {
    if (GlobalIsDefiningPersoBoard) {
        delete GlobalBoards[name];
        GlobalIsDefiningPersoBoard = false;
    }
    var panel = document.getElementById("config-panel-"+name);
    if (panel) {
        document.getElementsByTagName("body")[0].removeChild(panel);
    }
}
