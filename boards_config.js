/************************************************************
 * OnlineCoinCoin, by Chrisix (chrisix@gmail.com)
 * Définition des tribunes préconfigurées
 ************************************************************/

var dlfp = new Board('dlfp', false);
dlfp.getUrl = 'http://linuxfr.org/board/index.xml';
dlfp.postUrl = 'http://linuxfr.org/board';
dlfp.postData = "board[message]=%m";
dlfp.alias = "linuxfr,beyrouth,passite,dapassite";
dlfp.cookie = 'linuxfr.org_session=';
GlobalBoards['dlfp'] = dlfp;

var batavie = new Board('batavie', false);
batavie.getUrl = 'http://batavie.leguyader.eu/remote.xml';
batavie.postUrl = 'http://batavie.leguyader.eu/index.php/add';
batavie.color = '#ffccaa';
batavie.alias = "llg";
batavie.slip = SLIP_TAGS_RAW;
GlobalBoards['batavie'] = batavie;

var euro = new Board('euromussels', false);
euro.getUrl = 'http://faab.euromussels.eu/data/backend.xml';
euro.postUrl = 'http://faab.euromussels.eu/add.php';
euro.color = '#d0d0ff';
euro.alias = "euro,euroxers,eurofaab";
euro.slip = SLIP_TAGS_RAW;
GlobalBoards['euromussels'] = euro;

// var oldeuro = new Board('oldeuro', false);
// oldeuro.getUrl = 'http://euromussels.eu/?q=tribune.xml';
// oldeuro.postUrl = 'http://euromussels.eu/?q=tribune/post';
// oldeuro.color = '#e02fa0';
// GlobalBoards['oldeuro'] = oldeuro;

var see = new Board('see', false);
see.getUrl = 'http://tout.essaye.sauf.ca/tribune.xml';
see.postUrl = 'http://tout.essaye.sauf.ca/tribune/post';
see.color = '#ffd0d0';
see.slip = SLIP_TAGS_RAW;
see.alias = "schee,seeschloss";
GlobalBoards['see'] = see;

var moules = new Board('moules', false);
moules.getUrl = 'http://moules.org/board/backend/xml';
moules.postUrl = 'http://moules.org/board/add.php';
moules.color = '#ffe3c9';
moules.slip = SLIP_TAGS_RAW;
GlobalBoards['moules'] = moules;

var bouchot = new Board('bouchot', false);
bouchot.getUrl = 'http://bouchot.org/tribune/remote?last=%i';
bouchot.postUrl = 'http://bouchot.org/tribune/post_coincoin';
bouchot.postData = "missive=%m";
bouchot.color = '#e9e9e9';
GlobalBoards['bouchot'] = bouchot;

var finss = new Board('finss', false);
finss.getUrl = 'http://finss.fr/drupal/node/95/xml';
finss.postUrl = 'http://finss.fr/drupal/node/95/post';
finss.color = '#d0ffd0';
finss.slip = SLIP_TAGS_RAW;
GlobalBoards['finss'] = finss;

var shoop = new Board('shoop', false);
shoop.getUrl = 'http://sveetch.net/tribune/remote/xml/'; // ?last=%i inopérant pour le moment
shoop.postUrl = 'http://sveetch.net/tribune/post/xml/';
shoop.postData = "content=%m";
shoop.alias = "sveetch,dax";
shoop.color = '#EDEDDB';
shoop.slip = SLIP_TAGS_RAW;
GlobalBoards['shoop'] = shoop;

var devnewton = new Board('devnewton', false);
devnewton.getUrl = 'https://b3.bci.im/legacy/xml';
devnewton.postUrl = 'https://b3.bci.im/legacy/post';
devnewton.color = '#F5D6CC';
GlobalBoards['devnewton'] = devnewton;

var tif = new Board('tifauv', false);
tif.getUrl = 'http://tribune.tifauv.homeip.net/tribune/remote?last=%i';
tif.postUrl = 'http://tribune.tifauv.homeip.net/tribune/post_coincoin';
tif.postData = "missive=%m";
tif.alias = "tif";
tif.color = '#a9f9b9';
GlobalBoards['tifauv'] = tif;

var olo = new Board('olo', false);
olo.getUrl = 'http://board.olivierl.org/remote.xml';
olo.postUrl = 'http://board.olivierl.org/add.php';
olo.color = '#80dafc';
olo.alias = "olivierl,breizh";
olo.slip = SLIP_TAGS_RAW;
GlobalBoards['olo'] = olo;

var ygllo = new Board('ygllo', false);
ygllo.getUrl = 'http://ygllo.com/?q=tribune.xml';
ygllo.postUrl = 'http://ygllo.com/?q=tribune/post';
ygllo.color = '#eee887';
ygllo.alias = "yg,llo,fdg";
GlobalBoards['ygllo'] = ygllo;

var kad = new Board('kadreg', false);
kad.getUrl = 'http://kadreg.org/board/backend.php';
kad.postUrl = 'http://kadreg.org/board/add.php';
kad.color = '#dae6e6';
kad.alias = "kad,rincevent";
kad.slip = SLIP_TAGS_RAW;
GlobalBoards['kadreg'] = kad;

var dae = new Board('darkside', false);
dae.getUrl = 'http://quadaemon.free.fr/remote.xml';
dae.postUrl = 'http://quadaemon.free.fr/add.php';
dae.color = '#daedae';
dae.alias = "dae,daemon";
dae.slip = SLIP_TAGS_RAW; // Protection temporaire
GlobalBoards['darkside'] = dae;

var axel = new Board('hadoken', false);
axel.getUrl = 'http://hadoken.free.fr/board/remote.php';
axel.postUrl = 'http://hadoken.free.fr/board/post.php';
axel.color = '#77AADD';
axel.alias = "axel,waf";
GlobalBoards['hadoken'] = axel;

var lo = new Board('comptoir', false);
lo.getUrl = 'http://lordoric.free.fr/daBoard/remote.xml';
lo.postUrl = 'http://lordoric.free.fr/daBoard/add.php';
lo.color = '#dedede';
lo.alias = "lo,lordoric";
lo.slip = SLIP_TAGS_RAW; // Protection temporaire
GlobalBoards['comptoir'] = lo;

var gabu = new Board('gabuzomeu', false);
gabu.getUrl = 'http://gabuzomeu.fr/tribune.xml';
gabu.postUrl = 'http://gabuzomeu.fr/tribune/post';
gabu.color = '#aaffbb';
gabu.slip = SLIP_TAGS_RAW;
GlobalBoards['gabuzomeu'] = gabu;
