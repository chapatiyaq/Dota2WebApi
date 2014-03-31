<?php
/**
 * Internationalisation for dota2webapi
 *
 * @file
 * @ingroup Extensions
 */
$messages = array();
 
/** English
 * @author Chapatiyaq
 */
$messages[ 'en' ] = array(
	'dota2webapi' => "Dota 2 Web API",
	'dota2webapi-desc' => "Dota 2 Web API Wrapper - Pulls data from the official Dota 2 Web API and formats it with Liquipedia templates",
	'dota2webapi-api-description' => 'Get data of a match from the Dota 2 Web API.',
	'dota2webapi-api-matchid-description' => 'The ID of the match of which you want to pull data from the Dota 2 Web API',
	'dota2webapi-api-data-description' => "Which data to get.",
	'dota2webapi-error-non-strictly-positive-match-id' => "You must select a numeric match ID > 0",
	'dota2webapi-error-retrieving-local-data' => "Error while retrieving local data",
	'dota2webapi-error-missing-api-key' => "Dota 2 Web API key is missing",
	'dota2webapi-error-no-valve-api-data' => "No data retrieved from Valve API",
	'dota2webapi-error-message-from-valve-api' => "Error message from Valve API:",
	'dota2webapi-detected-matchid-number' => '{{PLURAL:$1|One match ID has|$1 match IDs have}} been detected.'
); 
 
/** Message documentation
 * @author Chapatiyaq
 */
$messages[ 'qqq' ] = array(
	'dota2webapi-desc' => "{{desc}}",
);