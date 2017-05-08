<?php

  function debug( $chaine ) {
    echo "<b>Debug:</b> " . htmlentities($chaine) . "<br />\n";
  }
  $req_uri = $_SERVER['SCRIPT_NAME'];
  $req_path = $_REQUEST['dir'];
  //if ($req_path[strlen($req_path)-1] != "/") {
  //  $req_path .= "/";
  //}
  $cur_path = dirname($_SERVER['SCRIPT_FILENAME']);
  $abs_path = realpath($cur_path . "/" . $req_path);
  // debug("req_path=".$req_path);
  // debug("cur_path=".$cur_path);
  // debug("abs_path=".$abs_path);
  $files = " ";
  if ($handle = opendir($abs_path)) {
    while (false !== ($file = readdir($handle))) {
      if ($file != "." && $file != "..") {
        $ext = substr(strrchr($file, "."), 1);
        //if ($ext == "wav" || $ext == "mp3") {
          $files .= '"'.$file.'",';
        //}
      }
    }
    closedir($handle);
  }
  echo('({"Files":["(aucun)",'.substr($files,0,-1).']})');

?>