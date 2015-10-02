<?php
# Alert the user that this is not a valid entry point to MediaWiki if they try to access the special pages file directly.
if (!defined('MEDIAWIKI')) {
  echo <<<EOT
To install the Dota 2 Web API Wrapper, put the following line in LocalSettings.php:
require_once( "$IP/extensions/Dota2WebApi/Dota2WebApi.php" );
EOT;
  exit( 1 );
}

global $wgApiDota2WebApiFiles, $wgExtensionAssetsPath;

$wgExtensionCredits['specialpage'][] = array(
	'path' => __FILE__,
	'name' => 'Dota2WebApi',
	'author' => '[http://wiki.teamliquid.net/starcraft2/User:ChapatiyaqPTSM Chapatiyaq] ',
	'url' => 'http://wiki.teamliquid.net/starcraft2/',
	'descriptionmsg' => 'dota2webapi-desc',
	'version' => '0.2.0',
);

$dir = dirname(__FILE__) . '/';

$wgExtensionMessagesFiles['Dota2WebApi'] = $dir . 'Dota2WebApi.i18n.php';
$wgExtensionMessagesFiles['Dota2WebApiAlias'] = $dir . 'Dota2WebApi.alias.php';

$wgAutoloadClasses += array(
	'SpecialDota2WebApi' => $dir . 'SpecialDota2WebApi.php',
	'Dota2WebApiResult' => $dir . 'Dota2WebApiResult.class.php',
	'Dota2WebApiPlayer' => $dir . 'Dota2WebApiPlayer.class.php'
);

$wgSpecialPages['Dota2WebApi'] = 'SpecialDota2WebApi';
$wgSpecialPageGroups['Dota2WebApi'] = 'other';

$dota2WebApiTpl = array(
    'localBasePath' => dirname( __FILE__ ) . '/modules',
    'remoteExtPath' => 'Dota2WebApi/modules',
    'group' => 'ext.dota2WebApi'
);

$wgHooks['EditPage::showEditForm:initial'][] = 'Dota2WebApiAddButtons';

$wgResourceModules += array(
	'ext.dota2WebApi.toolbar' => $dota2WebApiTpl + array(
		'scripts' => 'ext.dota2WebApi.toolbar.js',
		'styles' => 'ext.dota2WebApi.toolbar.css',
		'dependencies' => array(
			'ext.wikiEditor.toolbar',
			'jquery.ui.dialog'
		),
		'messages' => array(
			'dota2webapi-detected-matchid-number',
			'dota2webapi-heroes.json',
			'dota2webapi-items.json'
		)
	)
);

// API ***

// Map class name to filename for autoloading
$wgAutoloadClasses['ApiDota2WebApi'] = $dir . 'ApiDota2WebApi.php';
 
// Map module name to class name
$wgAPIModules['dota2webapi'] = 'ApiDota2WebApi';

$extensionPath = (!isset($wgExtensionAssetsPath) || $wgExtensionAssetsPath === false) ? $wgScriptPath . '/extensions' : $wgExtensionAssetsPath;
$wgDota2WebApiImagePath = $extensionPath . '/Dota2WebApi/modules/images/';

class Dota2WebApiHooks {
	/**
	 * @param $vars array
	 * @return bool
	 */
	public static function makeGlobalVariablesScript( &$vars ) {
		global $wgDota2WebApiImagePath;

		$vars['wgDota2WebApiImagePath'] = $wgDota2WebApiImagePath;
		return true;
	}
}

$wgHooks['MakeGlobalVariablesScript'][] = 'Dota2WebApiHooks::makeGlobalVariablesScript';

function Dota2WebApiAddButtons() {
	global $wgOut;
	$wgOut->addModules('ext.dota2WebApi.toolbar');

	return true;
}

// Return true so that MediaWiki continues to load extensions.
return true;
