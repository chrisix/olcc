<?php
  $userfile = $_FILES['attach_file']['name'];
  $tmpfile = $_FILES['attach_file']['tmp_name'];
  $error = $_FILES['attach_file']['error'];
  
  $dest_dir = "attach";
  if( !is_dir( $dest_dir ) ) {
    mkdir( $dest_dir );
  }
  $dest = basename( $userfile );
  $ext = substr($dest, strrpos($dest, ".")+1);
  if ($ext == "php" || $ext == "html") {
     $dest = $dest. ".txt";
  }
  $new_file_name = date("YmdHis") . "_" . $dest;
  $new_file = $dest_dir . "/" . $new_file_name;
  if( file_exists( $new_file ) ) { unlink( $new_file ); }
  move_uploaded_file($tmpfile, $new_file );

  $sname = $_SERVER['SERVER_NAME'];
  $uri = $_SERVER['REQUEST_URI'];
  $folder = substr($uri, 0, strrpos($uri, "/"));

  $fileurl = "http://$sname$folder/$dest_dir/".urlencode($new_file_name);

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Attach file</title>
</head>
<body>
<?php
  if( $error ) {
?>
    <img style="float:right" src="img/cancel.png" alt="[Fermer]" title="Fermer" onclick="parent.closePanel('attach')" />
    <h3>Échec du téléchargement</h3>
    <p><tt>Erreur&nbsp;: <?php echo( $error ); ?></tt></p>
<?php
  } else {
?>
    <script type="text/javascript"><!--
      parent.postFile("<?php echo($dest); ?>", "<?php echo($fileurl); ?>");
    // -->
    </script>
<?php
  }
?>
</body>

</html>

