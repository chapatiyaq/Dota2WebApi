$(document).ready(function() {
	/* Check if view is in edit mode and that the required modules are available. Then, customize the toolbar . . . */
	if ( $.inArray( mw.config.get( 'wgAction' ), ['edit', 'submit'] ) !== -1 ) {
		mw.loader.using( 'user.options', function () {
			if ( mw.user.options.get('usebetatoolbar') ) {
				mw.loader.using( 'ext.wikiEditor.toolbar', function () {
					$(document).ready(function() {
						addToToolbarInsertFullMatchDetails()
						addToToolbarInsertBracketMatchDetails();
					});
				});
			}
		} );
	}

	$(document).on('click', '.dota2webapi-result .series-title .switch-teams', function() {
		var team1 = $(this).siblings('.team1').text(),
			team2 = $(this).siblings('.team2').text();
		$(this).siblings('.team1').text(team2);
		$(this).siblings('.team2').text(team1);
	});

	function addToToolbarInsertFullMatchDetails() {
		$( '#wpTextbox1' ).wikiEditor( 'addToToolbar', {
			'section': 'advanced',
			'groups': {
				'insert-match-details': {
					type: 'toolbar',
					label: 'Match details'
				}
			}
		} );
		$( '.wikiEditor-ui-toolbar .group-insert' ).css( 'border-right', 'solid 1px #DDDDDD' );
		$( '.wikiEditor-ui-toolbar .group-insert-match-details' ).css( 'border-right', 'none' );
		$( '#wpTextbox1' ).wikiEditor( 'addToToolbar', {
			'section': 'advanced',
			'group': 'insert-match-details',
			'tools': {
				'matchdetails-full': {
					label: 'Full match details', // or use labelMsg for a localized label, see above
					type: 'button',
					icon: mw.config.get('wgDota2WebApiImagePath') + 'Crystal_exec.png',
					action: {
						type: 'callback',
						execute: function(context) {
							insertFullMatchDetails(context);
						}
					}
				}
			}
		} );
	};

	function addToToolbarInsertBracketMatchDetails() {
		$( '#wpTextbox1' ).wikiEditor( 'addToToolbar', {
			'section': 'advanced',
			'group': 'insert-match-details',
			'tools': {
				'matchdetails-bracket': {
					label: 'Bracket match details', // or use labelMsg for a localized label, see above
					type: 'button',
					icon: mw.config.get('wgDota2WebApiImagePath') + 'Crystal_kbackgammon_engine.png',
					action: {
						type: 'callback',
						execute: function(context) {
							insertBracketMatchDetails(context);
						}
					}
				}
			}
		} );
	};

	function addInsertDialog(matchIDs, configuration) {
		$.extend(configuration, {
			width: '700px',
			modal: true,
			buttons: [
				{
					text: 'Insert',
					click: configuration.insertCallback
				},
				{
					text: 'Cancel',
					click: function() {
						$(this).dialog('close');
					}
				}
			]
		});

		createDialogElement(configuration.id);

		$('#' + configuration.id)
			.html(dialogHtml(matchIDs));
		$('#' + configuration.id).dialog(configuration);
		$('#' + configuration.id + ' .dota2webapi-result tr:even').addClass('even');
		$('#' + configuration.id + ' .dota2webapi-result tr:odd').addClass('odd');
	}

	function dialogHtml(matchIDs) {
		var h = mw.html,
			length = matchIDs.length,
			output = '';

		output += mw.message('dota2webapi-detected-matchid-number', length).text();
		if (length > 5) {
			output += ' Only the first 5 match IDs will be processed.';
			matchIDs = matchIDs.slice(0, 5);
		}

		output += '<table class="dota2webapi-result">';
		output += '<tr>\
			<th class="insert-selection"></th>\
			<th class="match-id">Match ID</th>\
			<th class="status">Status</th>\
			<th class="radiant-team">Radiant team</th>\
			<th class="dire-team">Dire team</th>\
			<th class="match-data">Match data</th>\
		</tr>';
		for ( var i = 0; i < matchIDs.length; i++ ) {
			output += h.element('tr', {class: 'match-' + parseInt(i)},
				new h.Raw(
					h.element('td', {class: 'insert-selection'},
						new h.Raw(h.element('input', {type: 'radio', name: 'insert-selection', class: 'match-radio', rel: i}))
					)
					+ h.element('td', {class: 'match-id'}, '' + matchIDs[i])
					+ h.element('td', {class: 'status'}, 'Waiting...')
					+ h.element('td', {class: 'radiant-team'}, '-')
					+ h.element('td', {class: 'dire-team'}, '-')
					+ h.element('td', {class: 'match-data'}, '')
				)
			);
		}
		output += '</table>';

		return output;
	}

	function createDialogElement(dialogId) {
		if ($('#' + dialogId).size() === 0) {
			$('<div />')
				.attr('id', dialogId)
				.appendTo($('body'));
		}
	}

	var insertFullMatchDetails = function(context) {
		var selection = context.$textarea.textSelection('getSelection').replace(/\s+$/, '').replace(/^\s+/, ''),
			matchIDs,
			vars;

		if (selection === '') {
			alert('No match ID selected');
			return;
		}

		matchIDs = selection.split(/\r\n|\n| /);

		addInsertDialog(matchIDs, {
			title: 'Insert full match details',
			id: 'insert-full-match-details-dialog',
			insertCallback: function(event, ui) {
				var wikitext, team1, team2,
					s, sStart = '', sEnd = '';
				$checked = $('#insert-full-match-details-dialog input[name="insert-selection"]:checked');
				if ($checked.size()) {
					$checked = $checked.first();
					wikitext = $checked.parent().siblings('.match-data').text();
					if ($checked.attr('class') == 'series-radio') {
						var matches = wikitext.split(','),
							date = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + matches[0] + ' .match-data').data('startTime'),
							team1Score = 0, team2Score = 0,
							winningFaction;

						team1 = $checked.parent().siblings('.series-title').find('.team1').text();
						team2 = $checked.parent().siblings('.series-title').find('.team2').text();

						for (var i = 0; i < matches.length; ++i) {
							var processedGame = processGameForFullDetails({
								team1: team1,
								team2: team2,
								matchIndex: i + 1,
								row: matches[i]
							});

							sEnd += '\n' + processedGame.text;

							if (processedGame.winningTeam == 1) {
								team1Score++;
							} else {
								team2Score++;
							}
						}
						
						sStart = '{{MatchSeries\n';
						sStart += '|Team1=' + team1 + ' |team1score=' + team1Score + '\n';
						sStart += '|Team2=' + team2 + ' |team2score=' + team2Score + '\n';
						sStart += '|Date=' + date + '\n';
						sEnd += '}}\n';
						
						s = sStart + sEnd;
					} else if ($checked.attr('class') == 'match-radio') {
						team1 = $checked.parent().siblings('.radiant-team').text();
						team2 = $checked.parent().siblings('.dire-team').text();
						s = processGameForFullDetails({
							team1: team1,
							team2: team2,
							matchIndex: 1,
							row: $checked.attr('rel')
						}).text;
					}
				}
				$.wikiEditor.modules.toolbar.fn.doAction(
					context,
					{
						type: 'replace',
						options: {
							peri: s
						}
					},
					$(this)
				);
				$(this).dialog('close');
			}
		});

		vars = {
			matchIDs: matchIDs,
			ok: false,
			teams: []
		};
		
		processMatchForFullDetails(vars, 0);
	};

	function processMatchForFullDetails(vars, i) {
		// jQuery variables
		var $status = $('#insert-full-match-details-dialog .dota2webapi-result td.status:eq(' + i + ')'),
			$radiantTeam = $('#insert-full-match-details-dialog .dota2webapi-result td.radiant-team:eq(' + i + ')'),
			$direTeam = $('#insert-full-match-details-dialog .dota2webapi-result td.dire-team:eq(' + i + ')'),
			$matchData = $('#insert-full-match-details-dialog .dota2webapi-result td.match-data:eq(' + i + ')');

		$status.text('In progress...')
			.addClass('loading');
		
		$.ajax({
			url: mw.util.wikiScript('api'),
			dataType: 'json',
			data: {
				action: 'dota2webapi',
				matchid: vars.matchIDs[i],
				data: 'picks_bans|kills_deaths|players|radiant_win|teams|start_time',
				format: 'json'
			}
		})
		.done( function ( data ) {
			var radiantPicks, direPicks, radiantBans, direBans,
				start = '{{MatchSeries/Stats\n',
				end = '';

			start += '|MatchID=' + vars.matchIDs[i] + ' ';

			if (data.dota2webapi.isresult) {
				var result = data.dota2webapi.result;

				start += '|VOD=' + '\n';
				start += '|RadiantKills=' + result.kills.radiant + ' ';
				start += '|DireKills=' + result.kills.dire + '\n';

				if ( result.picks_bans.radiant.pick_1 !== undefined ) {
					radiantPicks = "{{MatchSeries/Picks";
					for (var j = 1; j <= 5; ++j)
						radiantPicks += '|' + j + '=' + result.picks_bans.radiant['pick_' + j].toLowerCase();
					radiantPicks += "}}\n";

					direPicks = "{{MatchSeries/Picks";
					for (var j = 1; j <= 5; ++j)
						direPicks += '|' + j + '=' + result.picks_bans.dire['pick_' + j].toLowerCase();
					direPicks += "}}\n";

					radiantBans = "{{MatchSeries/Bans";
					for (var j = 1; j <= 5; ++j)
						radiantBans += '|' + j + '=' + result.picks_bans.radiant['ban_' + j].toLowerCase();
					radiantBans += "}}\n";

					direBans = "{{MatchSeries/Bans";
					for (var j = 1; j <= 5; ++j)
						direBans += '|' + j + '=' + result.picks_bans.dire['ban_' + j].toLowerCase();
					direBans += "}}\n";
				} else {
					radiantPicks = '{{MatchSeries/Picks|1= |2= |3= |4= |5= }}\n';
					direPicks    = '{{MatchSeries/Picks|1= |2= |3= |4= |5= }}\n';
					radiantBans  = '{{MatchSeries/Bans|1= |2= |3= |4= |5= }}\n';
					direBans     = '{{MatchSeries/Bans|1= |2= |3= |4= |5= }}\n';
				}

				end += '|Scoreboard=yes\n';

				var factions = {R: 'radiant', D: 'dire'};
				for (var t in factions) {
					for (var j = 1; j <= 5; ++j) {
						var player = result.players[factions[t]]['player_' + j];
						end += '|' + t + 'Player' + j + '=';
						end += '{{MatchSeries/PlayerRow|player=';
						end += player.name + ' ';
						end += '|hero=' + player.hero.toLowerCase() + ' ';
						end += '|lvl='  + player.level;
						end += '|k='    + player.kills;
						end += '|d='    + player.deaths;
						end += '|a='    + player.assists;
						end += '|lh='   + player.last_hits;
						end += '|den='  + player.denies;
						end += '|gpm='  + player.gold_per_min;
						end += '|xpm='  + player.xp_per_min;
						end += '|items={{MatchSeries/Items';
						for (var k = 1; k <= 6; ++k) {
							end += '|' + k + '=' + player['item_' + k];
						}
						end += '}} ';
						if (player.hero == 'Lone Druid') {
							end += '|bearitems={{MatchSeries/Items';
							for (var k = 1; k <= 6; ++k) {
								end += '|' + k + '=' + player['bearitem_' + k];
							}
							end += '}} ';
						}
						end += '}}\n';
					}
				}
				
				end += '}}\n';
				
				vars.ok |= true;
				vars.teams.push({
					radiant: result.teams['radiant'],
					dire: result.teams['dire']
				});
			
				$radiantTeam.text(result.teams['radiant']);
				$direTeam.text(result.teams['dire']);
				if (result.radiant_win) {
					$radiantTeam.addClass('winning-faction');
					$matchData.data('winningFaction', 'radiant');
				} else {
					$direTeam.addClass('winning-faction');
					$matchData.data('winningFaction', 'dire');
				}
				$matchData.data('radiantScore', result.deaths.dire);
				$matchData.data('direScore', result.deaths.radiant);
				$matchData.data('radiantPicks', radiantPicks);
				$matchData.data('direPicks', direPicks);
				$matchData.data('radiantBans', radiantBans);
				$matchData.data('direBans', direBans);
				$matchData.data('startTime', result.start_time);
				$matchData.data('wikitextStart', start);
				$matchData.data('wikitextEnd', end);
				$status.text('Success');
			} else {
				$status.text(data.dota2webapi.result.error);
			}

			$status.removeClass('loading');
		} )
		.fail( function ( error ) {
			$status.text(error);
		} )
		.complete( function() {
			++i;

			if (i < vars.matchIDs.length) {
				processMatchForFullDetails(vars, i);
			} else if (vars.ok) {
				var h = mw.html,
					sortedTeams = [],
					series = {},
					$newTr,
					$matchTr,
					rowHtml = '';

				for (var j = 0; j < vars.teams.length; j++) {
					var tmp = [vars.teams[j].radiant, vars.teams[j].dire];
					sortedTeams.push(tmp.sort());
				}

				for (var j = 0; j < sortedTeams.length; j++) {
					var team1 = sortedTeams[j][0],
						team2 = sortedTeams[j][1];
					if (series[team1] === undefined) {
						series[team1] = {};
					}
					if (series[team1][team2] === undefined) {
						series[team1][team2] = [];
					}
					series[team1][team2].push(j);
				}

				for (var team1 in series) {
					for (var team2 in series[team1]) {
						$newTr = $('<tr/>');
						rowHtml = h.element('td', {class: 'insert-selection'},
								new h.Raw(h.element('input', {type: 'radio', name: 'insert-selection', class: 'series-radio'}))
							)
							+ h.element('td', {colspan: 4, class: 'series-title'},
								new h.Raw(
									'Entire series - Team 1: '
									+ h.element('span', {class: 'team1'}, team1)
									+ h.element('div', {class: 'switch-teams', title: 'Switch team 1 / team 2'})
									+ 'Team 2: '
									+ h.element('span', {class: 'team2'}, team2)
								)
							)
							+ h.element('td', {class: 'match-data'}, series[team1][team2].join(','));
						$newTr.html(rowHtml)
							.addClass('teams');
						$newTr.appendTo($('#insert-full-match-details-dialog .dota2webapi-result'));

						for (var j = series[team1][team2].length - 1; j >= 0; --j ) {
							$matchTr = $('#insert-full-match-details-dialog tr.match-' + series[team1][team2][j]);
							$matchTr.detach();
							$newTr.after($matchTr);
						}
					}
				}
				$('#insert-full-match-details-dialog input[name="insert-selection"]').first().attr('checked', 'checked');
			}
		});
	}

	function processGameForFullDetails(params) {
		var winningFaction = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('winningFaction'),
			winningTeamName = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .' + winningFaction + '-team').text(),
			winningTeam,
			radiantScore, direScore,
			radiantPicks, direPicks,
			radiantBans, direBans,
			team1Score, team2Score,
			team1Picks, team2Picks,
			team1Bans, team2Bans,
			radiantSide,
			text = '';
		winningTeam = winningTeamName == params.team1 ? 1 : 2;
		
		radiantSide = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .radiant-team').text() == params.team1 ?
			'left' : 'right';

		radiantScore = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('radiantScore');
		direScore = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('direScore');
		team1Score = radiantSide == 'left' ? radiantScore : direScore;
		team2Score = radiantSide == 'left' ? direScore : radiantScore;

		radiantPicks = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('radiantPicks');
		direPicks = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('direPicks');
		team1Picks = radiantSide == 'left' ? radiantPicks : direPicks;
		team2Picks = radiantSide == 'left' ? direPicks : radiantPicks;

		radiantBans = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('radiantBans');
		direBans = $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('direBans');
		team1Bans = radiantSide == 'left' ? radiantBans : direBans;
		team2Bans = radiantSide == 'left' ? direBans : radiantBans;

		text += '|Match' + params.matchIndex + '={{MatchSeries/Game |radiant=' + radiantSide + '\n';
		text += '|Team1=' + params.team1 + ' |Team1Kills=' + team1Score + '\n';
		text += '|Team2=' + params.team2 + ' |Team2Kills=' + team2Score + '\n';
		text += '|Winner=' + winningTeam + '}}\n';

		text += '\n|Match' + params.matchIndex + 'Stats=';
		text += $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('wikitextStart');
		text += '|Team1Picks=' + team1Picks;
		text += '|Team2Picks=' + team2Picks;
		text += '|Team1Bans=' + team1Bans;
		text += '|Team2Bans=' + team2Bans;
		text += $('#insert-full-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('wikitextEnd');

		return {winningTeam: winningTeam, 'text': text};
	}

	// Bracket
	var insertBracketMatchDetails = function(context) {
		var selection = context.$textarea.textSelection('getSelection').replace(/\s+$/, '').replace(/^\s+/, ''),
			matchIDs,
			vars;

		if (selection === '') {
			alert('No match ID selected');
			return;
		}

		matchIDs = selection.split(/\r\n|\n| /);

		addInsertDialog(matchIDs, {
			title: 'Insert bracket match details',
			id: 'insert-bracket-match-details-dialog',
			insertCallback: function(event, ui) {
				var wikitext, team1, team2,
					s, sStart = '', sEnd = '';
				$checked = $('#insert-bracket-match-details-dialog input[name="insert-selection"]:checked');
				if ($checked.size()) {
					$checked = $checked.first();
					wikitext = $checked.parent().siblings('.match-data').text();
					if ($checked.attr('class') == 'series-radio') {
						var matches = wikitext.split(','),
							date = $('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + matches[0] + ' .match-data').data('startTime'),
							winningFaction;

						team1 = $checked.parent().siblings('.series-title').find('.team1').text();
						team2 = $checked.parent().siblings('.series-title').find('.team2').text();

						sStart = '{{BracketMatchSummary\n';
						sStart += '|date=' + date + '\n';
						
						for (var i = 0; i < matches.length; ++i) {
							var processedGame = processGameForBracketDetails({
								team1: team1,
								team2: team2,
								matchIndex: i + 1,
								row: matches[i]
							});

							sStart += '|vodgame' + (i + 1) + '=\n';
							sEnd += '\n' + processedGame.text;
						}
						
						sEnd += '}}';
						
						s = sStart + sEnd;
					} else if ($checked.attr('class') == 'match-radio') {
						team1 = $checked.parent().siblings('.radiant-team').text();
						team2 = $checked.parent().siblings('.dire-team').text();
						s = processGameForBracketDetails({
							team1: team1,
							team2: team2,
							matchIndex: 1,
							row: $checked.attr('rel')
						}).text;
					}
				}
				$.wikiEditor.modules.toolbar.fn.doAction(
					context,
					{
						type: 'replace',
						options: {
							peri: s
						}
					},
					$(this)
				);
				$(this).dialog('close');
			}
		});

		vars = {
			matchIDs: matchIDs,
			ok: false,
			teams: []
		};
		
		processMatchForBracketDetails(vars, 0);
	};

	function processMatchForBracketDetails(vars, i) {
		// jQuery variables
		var $status = $('#insert-bracket-match-details-dialog .dota2webapi-result td.status:eq(' + i + ')'),
			$radiantTeam = $('#insert-bracket-match-details-dialog .dota2webapi-result td.radiant-team:eq(' + i + ')'),
			$direTeam = $('#insert-bracket-match-details-dialog .dota2webapi-result td.dire-team:eq(' + i + ')'),
			$matchData = $('#insert-bracket-match-details-dialog .dota2webapi-result td.match-data:eq(' + i + ')');

		$status.text('In progress...')
			.addClass('loading');
		
		$.ajax({
			url: mw.util.wikiScript('api'),
			dataType: 'json',
			data: {
				action: 'dota2webapi',
				matchid: vars.matchIDs[i],
				data: 'picks_bans|duration|radiant_win|teams|start_time',
				format: 'json'
			}
		})
		.done( function ( data ) {
			var radiantPicks, direPicks,
				end = '';

			if (data.dota2webapi.isresult) {
				var result = data.dota2webapi.result;

				if ( result.picks_bans.radiant.pick_1 !== undefined ) {
					radiantPicks = '';
					for (var j = 1; j <= 5; ++j)
						radiantPicks += '|t{r}h' + j + '=' + result.picks_bans.radiant['pick_' + j].toLowerCase();
					radiantPicks += "\n";

					direPicks = '';
					for (var j = 1; j <= 5; ++j)
						direPicks += '|t{d}h' + j + '=' + result.picks_bans.dire['pick_' + j].toLowerCase();
					direPicks += "\n";
				} else {
					radiantPicks = '|t{r}h1= |t{r}h2= |t{r}h3= |t{r}h4= |t{r}h5=\n';
					direPicks    = '|t{d}h1= |t{d}h2= |t{d}h3= |t{d}h4= |t{d}h5=\n';
				}

				end += '|length=' + result.duration + ' ';
				end += '|win={w}' + '\n';
				end += '}}\n';
				
				vars.ok |= true;
				vars.teams.push({
					radiant: result.teams['radiant'],
					dire: result.teams['dire']
				});
			
				$radiantTeam.text(result.teams['radiant']);
				$direTeam.text(result.teams['dire']);
				if (result.radiant_win) {
					$radiantTeam.addClass('winning-faction');
					$matchData.data('winningFaction', 'radiant');
				} else {
					$direTeam.addClass('winning-faction');
					$matchData.data('winningFaction', 'dire');
				}
				$matchData.data('radiantPicks', radiantPicks);
				$matchData.data('direPicks', direPicks);
				$matchData.data('startTime', result.start_time);
				$matchData.data('wikitextEnd', end);
				$status.text('Success');
			} else {
				$status.text(data.dota2webapi.result.error);
			}

			$status.removeClass('loading');
		} )
		.fail( function ( error ) {
			$status.text(error);
		} )
		.complete( function() {
			++i;

			if (i < vars.matchIDs.length) {
				processMatchForBracketDetails(vars, i);
			} else if (vars.ok) {
				var h = mw.html,
					sortedTeams = [],
					series = {},
					$newTr,
					$matchTr,
					rowHtml = '';

				for (var j = 0; j < vars.teams.length; j++) {
					var tmp = [vars.teams[j].radiant, vars.teams[j].dire];
					sortedTeams.push(tmp.sort());
				}

				for (var j = 0; j < sortedTeams.length; j++) {
					var team1 = sortedTeams[j][0],
						team2 = sortedTeams[j][1];
					if (series[team1] === undefined) {
						series[team1] = {};
					}
					if (series[team1][team2] === undefined) {
						series[team1][team2] = [];
					}
					series[team1][team2].push(j);
				}

				for (var team1 in series) {
					for (var team2 in series[team1]) {
						$newTr = $('<tr/>');
						rowHtml = h.element('td', {class: 'insert-selection'},
								new h.Raw(h.element('input', {type: 'radio', name: 'insert-selection', class: 'series-radio'}))
							)
							+ h.element('td', {colspan: 4, class: 'series-title'},
								new h.Raw(
									'Entire series - Team 1: '
									+ h.element('span', {class: 'team1'}, team1)
									+ h.element('div', {class: 'switch-teams', title: 'Switch team 1 / team 2'})
									+ 'Team 2: '
									+ h.element('span', {class: 'team2'}, team2)
								)
							)
							+ h.element('td', {class: 'match-data'}, series[team1][team2].join(','));
						$newTr.html(rowHtml)
							.addClass('teams');
						$newTr.appendTo($('#insert-bracket-match-details-dialog .dota2webapi-result'));

						for (var j = series[team1][team2].length - 1; j >= 0; --j ) {
							$matchTr = $('#insert-bracket-match-details-dialog tr.match-' + series[team1][team2][j]);
							$matchTr.detach();
							$newTr.after($matchTr);
						}
					}
				}
				$('#insert-bracket-match-details-dialog input[name="insert-selection"]').first().attr('checked', 'checked');
			}
		});
	}

	function processGameForBracketDetails(params) {
		var winningFaction = $('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('winningFaction'),
			winningTeamName = $('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + params.row + ' .' + winningFaction + '-team').text(),
			winningTeam,
			team1Side, team2Side
			text = '';
		winningTeam = winningTeamName == params.team1 ? 1 : 2;

		radiantPicks = $('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('radiantPicks');
		direPicks = $('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('direPicks');

		if ($('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + params.row + ' .radiant-team').text() == params.team1) {
			team1Side = 'radiant';
			team2Side = 'dire';
			team1Picks = radiantPicks.replace(/\{r\}/g, 1);
			team2Picks = direPicks.replace(/\{d\}/g, 2);
		} else {
			team1Side = 'dire';
			team2Side = 'radiant';
			team1Picks = direPicks.replace(/\{d\}/g, 1);
			team2Picks = radiantPicks.replace(/\{r\}/g, 2);
		}

		text += '|match' + params.matchIndex + '={{Match\n';
		text += '|team1side=' + team1Side + '\n';
		text += team1Picks;
		text += '|team2side=' + team2Side + '\n';
		text += team2Picks;
		text += $('#insert-bracket-match-details-dialog .dota2webapi-result .match-' + params.row + ' .match-data').data('wikitextEnd').replace('{w}', winningTeam);

		return {winningTeam: winningTeam, 'text': text};
	}
});