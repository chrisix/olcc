<?php

  $VERSION = '0.3.8';
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $_REQUEST['posturl']);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HEADER, true);
  // curl_setopt($ch, CURLINFO_HEADER_OUT, true);
  if (isset($_REQUEST['ua'])) {
    $ua = $_REQUEST['ua'];
  }
  else {
    $ua = "onlineCoinCoin/" . $VERSION;
  }
  // $message = $_SERVER['QUERY_STRING'];
  // $message = substr($message, strpos($message, 'postdata=')+9);
  $message = $_REQUEST['postdata'];
  $message = str_replace(array('#{plus}#', '#{amp}#', '#{dcomma}#', '#{percent}#'), array(urlencode('+'), urlencode('&'), '%3B', '%25'), $message);
  $referer = $_REQUEST['posturl'];
  $referer = substr($referer, 0, strrpos($referer, '/')+1);
  curl_setopt($ch, CURLOPT_REFERER, $referer);
  $rheaders = array(
                     'Accept: text/xml',
                     'Cache-Control: no-cache, must-revalidate' //,
                     // 'Referer: ' + $referer
                   );
  curl_setopt($ch, CURLOPT_HTTPHEADER, $rheaders);
  curl_setopt($ch, CURLOPT_USERAGENT, $ua);
  if (get_magic_quotes_gpc()) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, stripslashes($message)); // stripslashes(utf8_encode($message)));
  }
  else {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $message);
  }
  if (isset($_REQUEST['cookie'])) {
    curl_setopt($ch, CURLOPT_COOKIE, $_REQUEST['cookie']);
  }
  $res = curl_exec($ch);
  // error_log( "[olcc] " . $res); // curl_getinfo($ch, CURLINFO_HEADER_OUT));
  // var_dump(curl_getinfo($ch));
  // echo "UA=$ua<br />referer=$referer<br />cookie=".$_REQUEST['cookie']."<br />Data=".stripslashes(utf8_encode($message))."<br />Query_string=".$_SERVER['QUERY_STRING']."<br />";
  echo('({');
  if ($res === false) {
    echo( "'error':'". curl_error($ch) ."'," );
  }
  else {
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = split("\n", substr($res, 0, $header_size));
    foreach ($headers as $header) {
      if (strpos($header, ':') > 0) {
        list($name, $val) = split(":", $header);
        $tval = trim($val);
        if (!empty($tval)) {
          echo( "'" . trim(str_replace("-", "", $name)) . "':'" . addslashes($tval) . "'," );
        }
      }
    }
    echo( "'referer':\"" . $referer . "\"," );
    echo( "'httpcode':" . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "," );
    //echo "UA=$ua<br />referer=$referer<br />cookie=".$_REQUEST['cookie']."<br />Data=".$message."<br />Query_string=".$_SERVER['QUERY_STRING']."<br />";
    // echo $res;
  }
  echo("'result':\"".str_replace("\n","\\n",addslashes(substr($res, $header_size, strlen($res))))."\"");
  echo('})');
?>
