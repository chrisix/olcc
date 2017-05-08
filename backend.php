<?php /* vim: set ts=4 sw=4 noet ai : */

        error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT & ~E_DEPRECATED);

	/* If $bDebug is true, append a line in the log file
	to debug If-Modified-Since/Last-Modified handling. Do not
	use in production environment. */

	$bDebug   = false ;
	$sVersion = '0.3.8' ;
	$aHeaders = array( 'Accept: text/xml', 'Cache-Control: no-cache, must-revalidate' );


        /* if (strpos($_REQUEST['url'], "bombefourchette")) die('[:kiki]'); */

	/* Previous received "Last-Modified" HTTP response header
	 * returned by the server is sent back in a "If-Modified-Since"
	 * HTTP request header. */

	if( isset( $_REQUEST['lastModified'] ) )
	{
		$aHeaders[] = 'If-Modified-Since: ' . $_REQUEST['lastModified'] ;
	}

	$rCurl = curl_init(
		str_replace(
			array( '{question}', '{amp}' ),
			array(          '?',     '&' ),
			$_REQUEST['url']
		)
	);
	if( $rCurl === false ) 
	{
		die( 'Error: Unable to initialize cURL' );
	}
	
	curl_setopt( $rCurl, CURLOPT_RETURNTRANSFER, true );
	curl_setopt( $rCurl, CURLOPT_HEADER,         true );
	curl_setopt( $rCurl, CURLOPT_HTTPHEADER,     $aHeaders );
	curl_setopt( $rCurl, CURLOPT_USERAGENT,      "onlineCoinCoin/" . $sVersion );
	curl_setopt( $rCurl, CURLOPT_CONNECTTIMEOUT, 5 );
	curl_setopt( $rCurl, CURLOPT_TIMEOUT,        8 );

	if( isset( $_REQUEST['cookie'] ) )
	{
		curl_setopt($rCurl, CURLOPT_COOKIE, $_REQUEST['cookie']);
	}

	$sMessage = curl_exec( $rCurl );
	if ($sMessage === false)
	{
		die( 'Error: ' . curl_error( $rCurl ) );
	}

	header( 'HTTP/1.0 ' . curl_getinfo( $rCurl, CURLINFO_HTTP_CODE ) );
	header( 'Content-type: text/xml');

	$sLastModified = null ;
	$iHeaderLen = curl_getinfo( $rCurl, CURLINFO_HEADER_SIZE);
	$aHeaders   = explode( "\r\n", substr( $sMessage, 0, $iHeaderLen ) );
	foreach( $aHeaders as $sHeader )
	{
		list( $sName, $sValue ) = explode( ":", $sHeader, 2 );
		if( isset($sName) && isset($sValue) )
		{
			if( strtolower(trim($sName)) == 'last-modified' )
			{
				$sLastModified = trim( $sValue );
			}
			header( 'X-Olcc-' . trim($sName) . ':' . trim($sValue) );
		}
	}

	$sBody = substr( $sMessage, $iHeaderLen );
	$iPos  = strpos( $sBody, '<' );
	if(( ! empty( $sBody) )&&( $iPos === false ))
	{
		echo 'Error: ' . $sBody ;
	}
	else
	{
		echo preg_replace( '/<!DOCTYPE[^>]*>/', '', substr( $sBody, $iPos ), 1 );
	}

	if( $bDebug )
	{
		error_log( 
			  'OLCC - '
			. $_REQUEST['url']
			. ' : '
			. 'If-Modified-Since: '	. ( isset( $_REQUEST['lastModified'] ) ? $_REQUEST['lastModified'] : "NULL" ) . ' ; '
			. 'Last-Modified: '     . ( isset( $sLastModified )            ? $sLastModified            : "NULL" ) . ' ; '
			. 'Status: '            . curl_getinfo( $rCurl, CURLINFO_HTTP_CODE )
		);
	}
?>
