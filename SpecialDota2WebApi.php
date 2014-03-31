<?php

class SpecialDota2WebApi extends SpecialPage {

	function __construct() {
		parent::__construct( 'Dota2WebApi' );
	}

	function execute( $par ) {
		global $wgApiDota2WebApiFiles;

		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

		# Get request data from, e.g.
		$param = $request->getText( 'param' );

		# Do stuff
		# ...
		$wikitext = 'Hello world!';
		$output->addWikiText( $wikitext );
	}

	private function parseJSON($filename) {
		if (file_exists($filename)) {
			$contents = file_get_contents($filename);
			return json_decode($contents);
		}
		return array();
	}
}
