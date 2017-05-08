<?php

if(isset($_FILES['attachment']) && !empty($_FILES['attachment']['name']))
{
	if (is_uploaded_file($_FILES['attachment']['tmp_name']))
	{
		$filePointer = fopen($_FILES['attachment']['tmp_name'], "r");
		if ($filePointer!=false)
		{
			while (!feof($filePointer))
			{
				$fileLine = fgets($filePointer);
				$pos = strpos($fileLine, '=');
				if($pos == true)
				{
					$cookieName=substr($fileLine, 0, $pos);
					$cookieVal=substr($fileLine, $pos + 1);
					setcookie($cookieName, urldecode($cookieVal), time()+5000*24*60*60, '/');
				}
			}
			fclose($filePointer);
		}
	}
	header('Location: .');
        //echo $_COOKIES;
	return 0;
}
if(isset($_GET["setParam"]))
{
	echo "<html><body>";
	echo "<form enctype=\"multipart/form-data\" action=\"loadstore.php\" method=\"POST\"> Emplacement du fichier de parametres: ";
	echo "<input name=\"attachment\" type=\"file\" />";
	echo "<br/>";
	echo "<input type=\"submit\" value=\"Upload\" />";
	echo "</form>";
	echo "</body></html>";
	return 0;
}
else
{
	header("Content-type: text/plain");
	header("Content-disposition: attachment; filename=olcc_conf.txt");
	header("Content-Transfer-Encoding: binary");
	header("Pragma: no-cache");
	header("Expires: 0");

	while(list($nom, $valeur) = each($_COOKIE))
	{
		echo $nom . "=" . urlencode($valeur) . "\n";
	}
}
?>