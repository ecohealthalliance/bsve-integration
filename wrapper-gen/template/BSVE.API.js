var BSVE = BSVE || {};
(function(ns){
	/**
	 * BSVE root API object
	 * @namespace BSVE
	 */
	var ns = ns || {};

	/**
	 * Current BSVE API version number.
	 * @member {string}
	 * @memberof BSVE
	 * @alias BSVE.version
	 */
	ns.version = '0.0.1';

	/**
	 * Initializes the BSVE api and creates a connection to the workbench. 
	 * This function MUST be called before any of the other BSVE API functions will work. Ideally your apps code would be placed inside the callback funciton.
	 * @param {initCallback} [callback=null] - An optional callback to call when the init has completed.
	 * @returns {object} BSVE root Object
	 * @memberof BSVE
	 * @alias BSVE.start
	 */
	ns.start = ns.init = function ns_init(callback)
	{
		if ( !_initializing )
		{
			_initializing = true;
			_initCB = callback || null;
			window.addEventListener( "message", messageHandler, false );

			// load app styles
			var l = document.createElement('link'),
				 protocol = window.location.protocol;
			l.rel="stylesheet";
			l.href= protocol + "//developer.bsvecosystem.net/sdk/api/harbingerApp-1.0.css";
			document.getElementsByTagName('head')[0].appendChild(l);
			/*var l = document.createElement('link');
			l.rel = "stylesheet";
			l.href= window.top.location.origin + '/workbench/styles/harbingerApp.css';
			if ( window.top.location.hostname == 'localhost' )
			{
				l.href= window.top.location.origin + '/harbinger-web-workbench/workbench/styles/harbingerApp.css';
			}
			document.getElementsByTagName('head')[0].appendChild(l);*/

			// load fontawesome
			l = document.createElement('link');
			l.rel="stylesheet";
			l.href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css";
			document.getElementsByTagName('head')[0].appendChild(l);

			// Load jquery if not loaded already
			if ( typeof( jQuery ) == 'undefined' )
			{
				var jq = document.createElement('script');
				jq.type = 'text/javascript';
				jq.src = '//ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js';
				jq.onload = jqLoaded;
				document.getElementsByTagName('head')[0].appendChild(jq);
			}
			else
			{
				jqLoaded();
			}
		}
		else
		{
			console.log('BSVE API has already been _initialized');
		}
		return ns;
	}


	/**
	 * @namespace BSVE.ui
	 * @memberof BSVE
	 */
	ns.ui = ns.ui || {};
	/**
	 * @namespace BSVE.api
	 * @memberof BSVE
	 */
	ns.api = ns.api || {};


	/**
	 * Displays a system level alert prompt
	 * the alert can be dismissed
	 * @param {String} msg - mesasge to use
	 * @param {Boolean} [dismissable=false] - Weather or not to display the dismiss checkbox.
	 * @param {alertCallback} [confirmCB=null] - An optional callback function.
	 * @returns {Object} BSVE root object
	 * @memberof BSVE.ui
	 * @alias BSVE.ui.alert
	 */
	ns.ui.alert = function(msg, dismissable, confirmCB)
	{
		sendWorkbenchMessage('alert', {msg: msg, dismissable: dismissable});
		_alertCB = confirmCB || null;
		return ns;
	}

	/**
	 * @namespace BSVE.api.search
	 * @memberof BSVE.api
	 */
	ns.api.search = ns.api.search || {};

	var _hideLocations = false,
		_hideTerm = false,
		_hideDates = false;

	/**
	 * Attaches a callback for a search submit event and additionally will enable the inline searchbar. This event occurs in one of two scenarios. 
	 * 1. An inline search is performed from within this application. 
	 * 2. This app is an auto-search app: This app must have the auto-search checkbox selected in the app settings page of the developer portal.
	 * NOTE: The inline searchbar will be toggled by the button in the top right of the app and cannot be changed. 
	 * Additionally the styles for the searchbar are handled in the app.css and should not be modified.
	 * @param {searchSubmitCallback} callback - Callback for when a search has been executed by the user.
	 * View callback documentation to see search object signature. 
	 * @param {boolean} [hideTerm] - Hide the keyword term section of the searchbar.
	 * @param {boolean} [hideDates] - Hide the dates section of the searchbar.
	 * @param {boolean} [hideLocations] - Hide the loations section of the searchbar.
	 * @param {string} [searchButtonLabel] - This variable is used to override default search label
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.search
	 * @alias BSVE.api.search.submit
	 */
	ns.api.search.submit = function(callback, hideTerm, hideDates, hideLocations,searchButtonLabel )
	{
		_searchCB = callback;

		if ( hideTerm ) { $('.searchBar .keyword-holder').hide(); _hideTerm = true; } else { _hideTerm = false; }
		if ( hideDates ) { $('.searchBar .pickers').hide(); _hideDates = true; } else { _hideDates = false; }
		if ( hideLocations ) { $('.searchBar .location-section-inline').hide(); _hideLocations = true; } else { _hideLocations = false; }
		if(searchButtonLabel && searchButtonLabel.length > 0){ $('.searchBar span.submitButtonLabel').html(searchButtonLabel); }

		if ( hideTerm && hideDates && hideLocations )
		{
			// don't show the search bar at all
			$('.searchBar').css({'height': 0, 'overflow': 'hidden'});
		}

		if ( _app_launchType && _app_launchType == 'BLANK_SEARCH' )
		{
			toggleSearchbar(1);
		}
		else
		{
			toggleSearchbar(-1);
			sendWorkbenchMessage('searchbar', {state: 'closed'});
		}

		return ns;
	}

	ns.api.search.getQuery = function()
	{
		var _query = {
			term: $('#keyword').val(),
			startDate: ns.api.dates.yymmdd($("#fromDP").val()),
			endDate: ns.api.dates.yymmdd($("#toDP").val()),
			locations: _locations,
			originalTerm: _originalTerm
		};
		return _query;
	}

	/**
	 * Triggers the inline search programatically. 
	 * if a query object is passed in as a parameter the search will use the query, 
	 * otherwise it will use the current values.
	 */
	ns.api.search.trigger = function(query)
	{
		if (query)
		{
			if ( query.term && !_hideTerm ){ $('#keyword').val(query.term); }
			if ( query.startDate && !_hideDates )
			{
				$('#fromDP').val(query.startDate);
				$('#fromDP').data({date: query.startDate}).datepicker('update').children("input").val(query.startDate);
			}
			if ( query.endDate && !_hideDates )
			{
				$('#toDP').val(query.endDate);
				$('#toDP').data({date: query.endDate}).datepicker('update').children("input").val(query.endDate);
			}
			if ( query.locations && !_hideLocations ){ _locations = query.locations; updateLocations(); }

			if(query.originalTerm) { _originalTerm = query.originalTerm };
		}

		$('form#search').submit();
	}
	/**
	 * Search panel located at the top of all apps. It is toggled via a button in the top right corner of apps. Will only be displayed if a search callback has been supplied.
	 * @namespace BSVE.ui.searchbar
	 * @memberof BSVE.ui
	 */
	ns.ui.searchbar = ns.ui.searchbar || {};

	/**
	 * Hides the searchbar.
	 * NOTE: Both the hide and show methods of BSVE.ui.searchbar will only function properly if a search submit handler has been added through the {@link BSVE.api.search.submit} method.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.ui.searchbar
	 * @alias BSVE.ui.searchbar.hide
	 */
	ns.ui.searchbar.hide = function()
	{
		toggleSearchbar(-1);
		sendWorkbenchMessage('searchbar', {state: 'closed'});
		return ns;
	}

	/**
	 * Shows the searchbar. 
	 * NOTE: Both the hide and show methods of BSVE.ui.searchbar will only function properly if a search submit handler has been added through the {@link BSVE.api.search.submit} method.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.ui.searchbar
	 * @alias BSVE.ui.searchbar.show
	 */
	ns.ui.searchbar.show = function()
	{
		toggleSearchbar(1);
		sendWorkbenchMessage('searchbar', {state: 'opened'});
		return ns;
	}

	/** @private */
	function toggleSearchbar(state)
	{
		if ( state == -1 )
		{
			$('#fromDP').datepicker('hide');
			$('#toDP').datepicker('hide');
			$('.searchBar').show().animate({ top: -$('.searchBar').height() + 'px' }, 300, function(){ $('.searchBar').hide(); });
		}
		else
		{
			$('.searchBar').show().animate({ top: 0 }, 300);
		}
	}
	/** @private */
	_locations = [];
	_originalTerm = '';
	function searchbar()
	{
		var currentDate = new Date(),
			defaultFromDate = new Date(),
			_cDate = ns.api.dates.Mddyy(currentDate),
			defaultFromDate = defaultFromDate.setDate(defaultFromDate.getDate() - 45),
			_fDate = ns.api.dates.Mddyy(defaultFromDate);

		$('body').prepend('<div class="searchBar row-fluid">'+
			'<form name="search" id="search" class="bsveapi form">'+
				'<div class="row-fluid keyword-holder">'+
					'<label class="span1">Keywords</label>'+
					'<input type="text" id="keyword" placeholder="New Search" class="flat span10" />'+
					'<i class="unstyled fa fa-times-circle clearIcon"></i>'+
				'</div>'+
				'<div class="alert alert-error" style="display:none">'+
					'Search term must be a minimum of 3 characters.'+
				'</div>'+
				'<div class="pickers row-fluid">'+
					'<label>Timeframe</label>'+
					'<div class="picker">'+
						'<input id="fromDP" type="text" placeholder="Start Date" class="span12 flat" data-date-format="M dd yyyy" bs-datepicker readonly>'+
						'<i class="fa fa-calendar" data-toggle="datepicker"></i>'+
						'<i title="Clear date" class="unstyled fa fa-times-circle defaultDateIcon"></i>'+
					'</div>'+
					'<div class="picker">'+
						'<input id="toDP" type="text" placeholder="End Date" class="span12 flat" data-date-format="M dd yyyy" bs-datepicker readonly />'+
						'<i class="fa fa-calendar" data-toggle="datepicker"></i>'+
						'<i title="Clear date" class="unstyled fa fa-times-circle defaultDateIconTd"></i>'+
					'</div>'+
				'</div>'+
				'<div class="location-section-inline row-fluid">'+
					'<label>Locations</label>'+
					'<button class="btn flat inlineLocationBtn" type="button" title="Add New Location">'+
						'<i class="fa fa-plus"></i> Add Location'+
					'</button>'+
					'<div class="scroll-list" style="display:none"></div>'+
				'</div>'+
				'<div class="submitSection row-fluid">'+
					'<button type="submit" class="btn flat btn-primary"><span class="submitButtonLabel"><i class="fa fa-search"></i> Search</span></button>'+
				'</div>'+
			'</form>'+
		'</div>');

		// cap the end dates of both pickers to today
		$('#fromDP').datepicker('setEndDate', new Date());
		$('#toDP').datepicker('setEndDate', new Date());

		// cap the start of to picker to from date
		$('#fromDP').datepicker().on('changeDate', function() {
			var sd = $('#fromDP').val();
			$('#toDP').datepicker('setStartDate', sd);
		});
		// cap the start of to picker to from date
		$('#toDP').datepicker().on('changeDate', function() {
			var sd = $('#toDP').val();
			$('#fromDP').datepicker('setEndDate', sd);
		});

		$('#fromDP').val(_fDate);
		$("#toDP").val(_cDate);
		$('#fromDP').data({date: _fDate}).datepicker('update').children("input").val(_fDate);
		$('#toDP').data({date: _cDate}).datepicker('update').children("input").val(_cDate);
		$('#fromDP').datepicker('setEndDate', _cDate);
		$('#toDP').datepicker('setStartDate', _fDate);

		// submit search
		$('form#search').submit(function()
		{
			if ($("#fromDP").val().length == 0)
			{
				$('#fromDP').val(_fDate);
				$('#fromDP').data({date: _fDate}).datepicker('update').children("input").val(_fDate);
			}
			if ($("#toDP").val().length == 0)
			{
				$("#toDP").val(_cDate);
				$('#toDP').data({date: _cDate}).datepicker('update').children("input").val(_cDate);
			}

			if ( $('form#search .keyword-holder').css('display') != 'none' && $('input#keyword').val().length < 3 )
			{
				$('form .alert').fadeIn(300);
			}
			else
			{
				$('form .alert').fadeOut(300);
				_searchCB({
					term: $('#keyword').val(),
					originalTerm: _originalTerm,
					startDate: ns.api.dates.yymmdd($("#fromDP").val()),
					endDate: ns.api.dates.yymmdd($("#toDP").val()),
					locations: _locations
				});
				ns.ui.searchbar.hide();
			}

			return false;
		});

		$('.picker .fa-calendar').css('pointer-events', 'none');//click(function(){ $(this).parent().find('input').click();console.log('picker') })

		// clear pickers
		$('.picker .fa-times-circle').click(function()
		{
			if ( $(this).hasClass('defaultDateIconTd') )
			{
				setDefaultDate('to');
			}
			else
			{
				setDefaultDate('from');
			}
		});

		// need to optimize - poorly structured
		function setDefaultDate( picker )
		{
			if ( picker == 'from' )
			{
				$('#fromDP').val('');
				$('#fromDP').datepicker('remove');
				$('#fromDP')
					.datepicker()
					.on('changeDate', function(ev){
						$('#fromDP').datepicker('hide');
					});

				if ($('#toDP').val() == '')
				{
					$('#toDP').datepicker('remove');
					$('#toDP').datepicker();
					$('#toDP').datepicker('setEndDate', new Date());
					$('#fromDP').datepicker('setEndDate', new Date());
				}
				else
				{
					$('#fromDP').datepicker('setEndDate', $('#toDP').val());
				}
			}
			else
			{
				$('#toDP').val('');
				$('#toDP').datepicker('remove');
				$('#toDP')
					.datepicker()
					.on('changeDate', function(ev){
						$('#toDP').datepicker('hide');
					});

				if ($('#fromDP').val() == '')
				{
					$('#fromDP').datepicker('remove');
					$('#fromDP').datepicker();
					$('#fromDP').datepicker('setEndDate', new Date());
					$('#toDP').datepicker('setEndDate', new Date());
				}
				else
				{
					$('#toDP').datepicker('setStartDate', $('#fromDP').val());
					$('#toDP').datepicker('setEndDate', new Date());
				}
			}
		}

		// clear search term
		$('.keyword-holder .fa-times-circle').click(function(event)
		{
			event.preventDefault();
			$('#keyword').val('');
			$('form .alert').fadeOut();
			$('.keyword-holder .fa-times-circle').fadeOut();
		});
		$('#keyword').change(validateForm).keyup(validateForm);

		function validateForm()
		{
			if ( $(this).val().length ){ $('.keyword-holder .fa-times-circle').fadeIn(); } else { $('.keyword-holder .fa-times-circle').fadeOut(); }
			if ( $(this).val().length >= 3 ) { $('form .alert').fadeOut(); }
		}

		// show location modal
		$('.btn.inlineLocationBtn').click(function()
		{
			sendWorkbenchMessage('addlocationfrominline');
		});
		$('.location-section-inline').data({
			update: function(data){
				//_locations.concat( data );
				// remove dupes
				for ( var i = 0; i < data.length; i++ )
				{
					var exists = false;
					for ( var j = 0; j < _locations.length; j++ )
					{
						if ( _locations[j].location == data[i].location ) { exists = true; }
					}
					if ( !exists )
					{
						_locations.push(data[i]);
					}
				}

				updateLocations();
			}
		});
		// remove location
		$('.location-section-inline').on('click', 'span.word .word-remove', function()
		{
			var loc = $(this).parent().attr('data-location');
			for ( var i = _locations.length - 1; i >= 0; i-- )
			{
				if ( loc == _locations[i].location)
				{
					_locations.splice(i, 1);
				}
			}
			updateLocations();
		});

		function updateLocations()
		{
			var html = '';
			for ( var i = 0; i < _locations.length; i++ )
			{
				html += '<span class="word" data-location="'+_locations[i].location+'"><i class="fa fa-times-circle word-remove"></i> ' + _locations[i].locationType + ' - ' + _locations[i].location + '</span>';
			}
			$('.location-section-inline .scroll-list').html(html);
			if (_locations.length){ $('.location-section-inline .scroll-list').show(); } else { $('.location-section-inline .scroll-list').hide(); }
		}

		var sbHeight = ( $('.searchBar').height() == 0 ) ? 400 : $('.searchBar').height();
		$('.searchBar').css({top: -sbHeight + 'px'});
	}

	/**
	 * Dossier control
	 * @namespace BSVE.ui.dossierbar
	 * @memberof BSVE.ui
	 */
	ns.ui.dossierbar = ns.ui.dossierbar || {};

	/**
	 * Creates a new Dossier control bar. The dossier control bar will be positioned in the top left of the application. The control does not 
	 * have a set size and thus should be accounted for in your application. When a report component is selected the 4 report components will 
	 * appear to the right as 4 buttons. The total height that these take up will depend on teh width your application has given the tagger control.
	 * @param {function} onTagged - Callback to execute when an item tag has been clicked. 
	 * NOTE: this does not tag an item but, instead triggers a callback to the developer, in which the item can then be tagged.
	 * It is in this callback function that the developer should call the BSVE.api.tagItem method. The onTagged callback has one parameter, 
	 * which is the status type to pass into the {@link BSVE.api.tagItem} method.
	 * @param {boolean} hide - Weather or not to hide the control after it is created.
	 * @param {string} dom - The dom element selector of the parent element of the dossier control. If this argument is provided, 
	 * the dossier control will be added to this dom element instead of the default body element.
	 * @param {number} x - The x( left ) position of the tagger in relationship to the dom parent.
	 * @param {number} y - The y( top ) position of the tagger in relationship to the dom parent.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.ui.dossierbar
	 * @alias BSVE.ui.dossierbar.create
	 */
	ns.ui.dossierbar.create = function(onTagged, hide, dom, x, y)
	{
		var _dom = dom || $('body'),
			timeoutID = -1,
			customLayout = false,
			events = [];

		if (typeof(dom) != 'undefined')
		{
			_dom = $(dom);
			customLayout = true;
		}

		// remove old tagger if one exists in same dom element
		$(_dom.selector + ' .tagger').remove();

		_dom.prepend('<div class="tagger clearfix">'
			+	'<div class="mousetrap">'
			+		'<button class="drop-toggle btn flat"><span>Select a Dossier</span> <i class="fa fa-angle-down"></i></button>'
			+		'<div class="drop-show" style="display:none;">'
			+			'<div class="new-dossier">'
			+				'<form>'
			+					'<input type="text" class="flat" placeholder="Create New Dossier" />'
			+					'<button type="submit" class="btn flat"><i class="fa fa-plus-circle"></i></button>'
			+				'</form>'
			+			'</div>'
			+			'<ul class="drop"></ul>'
			+		'</div>'
			+	'</div>'
			+	'<div class="tags" style="display:none;">'
			+		'<button type="button" class="status-btn status-IOI" data-status="IOI"><i class="fa fa-thumbs-o-up"></i></button>'
			+		'<button type="button" class="status-btn status-WCH" data-status="WCH"><i class="fa fa-eye"></i></button>'
			+		'<button type="button" class="status-btn status-DRP" data-status="DRP"><i class="fa fa-thumbs-o-down"></i></button>'
			+	'</div>'
			+ '<div class="events" style="display:none"></div>'
			+'</div>');

		if ( customLayout ){ $(_dom.selector + ' .tagger').addClass('custom'); }
		if ( typeof(x) ) { $(_dom.selector + ' .tagger').css('left', x + 'px'); }
		if ( typeof(y) ) { $(_dom.selector + ' .tagger').css('top', y + 'px'); }

		$(_dom.selector + ' .tagger .status-btn').click(function()
		{
			if ( onTagged )
			{
				onTagged( $(this).attr('data-status'), $(this) );
			}
		});

		$(_dom.selector + ' .tagger .events').on('click', 'span', function()
		{
			if ( onTagged )
			{
				onTagged( 'RPT:'+ $(this).attr('data-id'),  $(this));
			}
		});

		$(_dom.selector + ' button.drop-toggle').click(function()
		{
			$(_dom.selector + ' .drop-show').toggle();
			if ( $(_dom.selector + ' .drop-show').css('display') == 'block' )
			{
				$(_dom.selector + ' .tagger').css('z-index', 101);
			}
			else
			{
				$(_dom.selector + ' .tagger').css('z-index', 100);
			}
		});
		$(_dom.selector + ' .mousetrap').on({
			mouseenter: function()
			{
				clearTimeout(timeoutID);
			},
			mouseleave: function()
			{
				timeoutID = setTimeout(function()
				{
					$(_dom.selector + ' .tagger').css('z-index', 100);
					$('.drop-show').hide();

				}, 1000);
			}
		});

		$(_dom.selector + ' .tagger form').submit(function()
		{
			var val = $(this).find('input[type="text"]').val();
			if ( val.length )
			{
				sendWorkbenchMessage('dossierCreate', {name:val});
				$(this).find('input[type="text"]').val('');
			}
			return false;
		});

		$(_dom.selector + ' .tagger .drop').on('click', 'li', function()
		{
			var _dossier = {
				id:$(this).attr('data-id'),
				name:$(this).attr('data-name'),
				permission:$(this).attr('data-permission')
			};
			$('.drop-show').hide();
			$('.tagger .events, .tagger .tags').hide();
			$('button.drop-toggle span').html(_dossier.name);
			

			$('.tagger .drop-toggle').attr('disabled', 'disabled').css('opacity', .6);
			$('.tagger .events').addClass('disableEvents');

			if ( $(this).attr('data-event-id') )
			{
				sendWorkbenchMessage('dossierSet', {id:_dossier.id, eventId: $(this).attr('data-event-id')});
				var _html = '';
				for ( i = 0; i < eventComponents.length; i++ )
				{
					_html += '<span data-id="' + eventComponents[i].id + '"><i class="fa fa-file-text-o"></i>' + eventComponents[i].label + '</span>';
				}
				$('.tagger .events').html(_html).show();
			}
			else
			{
				sendWorkbenchMessage('dossierSet', {id:_dossier.id});
				$('.tagger .tags').show();
			}
		});

		if ( dossiers ){ updateDossierbar(dossiers); }
		if ( hide ) { ns.ui.dossierbar.hide(); }

		return ns;
	}
	/**
	 * Hides dossier bar control within the application. If the argument dom is provided, only the control 
	 * in the provided dom element will be hidden, otherwise, all dossier controls will be hidden.
	 * @param {string} dom - The dom element selector of the parent element of the dossier control.
	 */
	ns.ui.dossierbar.hide = function(dom)
	{
		if ( typeof(dom) !== 'undefined' )
		{
			$(dom + ' div.tagger').hide();
		}
		else
		{
			$('div.tagger').hide();
		}
	}
	/**
	 * Shows dossier bar control within the application. If the argument dom is provided, only the control 
	 * in the provided dom element will be shown, otherwise, all dossier controls will be shown.
	 * @param {string} dom - The dom element selector of the parent element of the dossier control.
	 */
	ns.ui.dossierbar.show = function(dom)
	{
		if ( typeof(dom) !== 'undefined' )
		{
			$(dom + ' div.tagger').show();
		}
		else
		{
			$('div.tagger').show();
		}
	}


	/** @private */
	var dossiers = [],
		eventComponents = [
			{"label":"Current Status","id":"CRC_CES"},
			{"label":"Why We Are Reporting","id":"CRC_WRE"},
			{"label":"Summary of Reports","id":"CRC_SRD"},
			{"label":"References & Links","id":"CRC_RAL"}],
		eventId = -1;
	
	// move filter functionality into this function
	// also sorting
	// may need to que this for when the dbar is built.
	/** @private */
	function updateDossierbar(data)
	{
		dossiers = data;
		if ( typeof($) != 'undefined' )
		{
			_html = '';
			for ( var i = 0; i < data.length; i++ )
			{
				var dossier = data[i];

				if ( dossier.permission !== 'View' && !dossier.archived )
				{
					// if permission != View
					// && not archived
					_html += '<li data-name="'+ dossier.name +'" data-id="' + dossier.id + '" data-permission="' + dossier.permission + '">' + dossier.name + '</li>';

					if ( dossier.dossierEvents )
					{
						for ( var j = 0; j < dossier.dossierEvents.length; j++ )
						{
							var ev = dossier.dossierEvents[j];
							_html += '<li data-name="'+ dossier.name +'/'+ ev.name +'" data-id="' + dossier.id + 
							'" data-event-id="' + ev.id + '" data-permission="' + dossier.permission + '">' + dossier.name + '/' + ev.name +'</li>';	
						}
					}
				}
			}
			$('.tagger .drop').html(_html);
		}
		else
		{
			console.log('$ undefined', data);
		}
	}
	/** @private */
	function setDossier(data, event)
	{
		var selection = false;
		if ( data )
		{
			selection = ( data.archived || data.permission == 'View' ) ? false : true;
		}
		$('.tagger .drop-toggle').removeAttr('disabled').css('opacity', 1);
		$('.tagger .events, .tagger .tags').hide();
		$('.tagger .tags button').removeClass('active');
		$('.tagger .events').removeClass('disableEvents');
		if ( selection )
		{	
			if ( event )
			{
				var ev, i = 0;
				for ( i; i < data.dossierEvents.length; i++ )
				{
					if ( data.dossierEvents[i].id == event )
					{
						ev = data.dossierEvents[i];
					}
				}
				// display name of event
				if ( ev )
				{
					$('button.drop-toggle span').html(data.name + '/' + ev.name);
					eventId = ev.id;

					var _html = '';
					for ( i = 0; i < eventComponents.length; i++ )
					{
						_html += '<span data-id="' + eventComponents[i].id + '"><i class="fa fa-file-text-o"></i>' + eventComponents[i].label + '</span>';
					}

					$('.tagger .events').html(_html).show();
				}
			}
			else
			{
				$('button.drop-toggle span').html(data.name);
				$('.tagger .tags').show();
			}
		}
		else
		{
			$('button.drop-toggle span').html('Select a Dossier');
		}
	}

	/**
	 * @param {object} item - object to save. The object signature is as follows: {
		dataSource : name of data source used | string,
		title : item title | string,
		sourceDate : date of item source | string recommended to use - {@link BSVE.api.dates.yymmdd},
		itemDetail : {
			statusIconType: type of item from three options - Graph, Map, Text, or App | string,
			Description : 'App Item Description...' | string
		}
	 }
	 * @param {string} status - Status of item to save. This includes report component types.
	 * @param {itemTagCallback} [cb=null] - Callback to execute when item has finished being saved.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api
	 * @alias BSVE.api.tagItem
	 */
	ns.api.tagItem = function(item, status, cb)
	{
		sendWorkbenchMessage( 'item', { item: item, status: status } );
		_itemTagCB = cb || null;
		return ns;
	}
	ns.api.unTagItem = function(itemId, eventId, status, cb)
	{
		sendWorkbenchMessage( 'untagitem', { itemId: itemId, eventId: eventId, status: status } );
		_itemUnTagCB = cb || null;
		return ns;
	}

	/**
	 * Returns the curently logged in user id.
	 * @memberof BSVE.api
	 * @alias BSVE.api.user
	 */
	ns.api.user = function()
	{
		return ( !_initialized ) ? false : _user;
	}
	/**
	 * Returns the curently logged in user Data.
	 * @memberof BSVE.api
	 * @alias BSVE.api.userData
	 */
	ns.api.userData = function()
	{
		return ( !_initialized ) ? false : _userData;
	}
	/**
	 * Returns the curent auth ticket.
	 * @memberof BSVE.api
	 * @alias BSVE.api.authTicket
	 */
	ns.api.authTicket = function()
	{
		return ( !_initialized ) ? false : _authTicket;
	}
	/**
	 * Returns the curently logged in user tennant.
	 * @memberof BSVE.api
	 * @alias BSVE.api.tenancy
	 */
	ns.api.tenancy = function()
	{
		return ( !_initialized ) ? false : _tenancy;
	}

	/**
	 * Generic Rest request function when the request is neither a data query or an analytic.
	 * @param {string} url - The rest request url. The api will prepend the necessary server url. 
	 * @param {function} callback - Function to be exectuted once server result has been received.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api
	 * @alias BSVE.api.get
	 */
	ns.api.get = function(url, callback)
	{
		$.ajax({
			url: _searchAPIRoot + url,
			data: {cache : false },
			type: 'GET',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.log(errorThrown);
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(callback) == 'function' ){callback(data);}
			}
		});

		return BSVE;
	}


	/** 
	 * Data Exchange
	 * @namespace BSVE.api.exchange
	 * @memberof BSVE.api
	 */
	ns.api.exchange = ns.api.exchange || {};
	
	/**
	 * Executed when another app has exchanged( shared ) data with this app.
	 * @param {function} callback - Function to be exectuted once an exchange of data has been received.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.exchange
	 * @alias BSVE.api.exchange.receive
	 */
	ns.api.exchange.receive = function(callback)
	{
		_exchangeReceiveCB = callback;
	}

	/**
	 * Executed when another app has exchanged( shared ) data with this app.
	 * @param {function} callback - Function to be exectuted once an exchange of data has been received.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.exchange
	 * @alias BSVE.api.exchange.receive
	 */
	ns.api.exchange.send = function(callback, position)
	{
		_exchangeSendCB = callback;
		var data = {
			BSVE_API:true, 
			sendData: null
		};
		// add button
		var buttonHTML = ''+
			'<div class="exchange-button">'+
				'<button type="button" class="status send"><i class="fa fa-exchange" title="Send Data"></i></button>'+
			'</div>';
		$('body').prepend(buttonHTML);

		if ( position )
		{
			data.position = position;
			$('.exchange-button').css({position: 'absolute', left: position.left+'px', top: position.top+'px'});
		}
		$('.exchange-button button').click(function()
		{
			var _sendData = _exchangeSendCB();
			if ( _sendData )
			{
				data.sendData = _sendData;
				sendWorkbenchMessage( 'appsListDialog', data );
			}
			else
			{
				console.log('WARNING: Data Exchange attempted without providing exchange data in the BSVE.api.exchange.send() callback. Ensure that data is being returned from the exchange callback.');
			}
		});
	}

	/** 
	 * Data source retrieval
	 * @namespace BSVE.api.datasource
	 * @memberof BSVE.api
	 */
	ns.api.datasource = ns.api.datasource || {};

	/**
	 * Lists all available datasources and more detailed information about each data source.
	 * @param {function} callback - Function to be exectuted once server result has been received.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.datasource
	 * @alias BSVE.api.datasource.list
	 */
	ns.api.datasource.list = function(callback)
	{
		$.ajax({
			url: _searchAPIRoot + "/api/data/list",
			data: {cache : false },
			type: 'GET',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.log(errorThrown);
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(callback) == 'function' ){callback(data);}
			}
		});

		return BSVE;
	}

	/**
	 * The BSVE.api.datasource.read method is depricated and will be removed in a future release of the BSVE API. Instead use the BSVE.api.query and BSVE.api.result methods.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.datasource
	 * @alias BSVE.api.datasource.read
	 */
	ns.api.datasource.read = function()
	{
		console.log('The BSVE.api.datasource.read method is depricated and will be removed in a future release of the BSVE API. Instead use the BSVE.api.result method');
		return BSVE;
	}

	/**
	 * Query a datasource and get the result id. The result id is then used in the {@link BSVE.api.datasource.result} method to retrieve the full list of results.
	 * @param {string} dataSource - The string name of the Datasource to query.
	 * @param {string} filter - The string query to apply.
	 * @param sourceValues
	 * @param {string} orderBy - The string key to sort the results by.
	 * @param {function} completeCallback - Callback to execute once the query has been performed on the server and has sent the response. 
	 * The function will return one argument - requestId which is the id needed to retrieve the results of this query.
	 * @param {function} errorCallback - Callback to execute in the event of an error.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.datasource
	 * @alias BSVE.api.datasource.query
	 */
	ns.api.datasource.query = function(dataSource, filter, sourceValues, orderBy, completeCallback, errorCallback)
	{
		var query = '' + dataSource;
		if ( filter || sourceValues || orderBy ) { query += '?'; }
		if ( sourceValues ){ query += '$source=' + sourceValues.join(','); }
		if ( filter ){ query += '$filter=' + filter; }
		if ( orderBy ){ query += '&$orderby=' + orderBy; }

		$.ajax({
			url: _searchAPIRoot + "/api/data/query/" + query,
			type: 'GET',
			contentType : 'application/json',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				if ( typeof(errorCallback) == 'function' )
				{
					errorCallback(errorThrown);
				}
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(completeCallback) == 'function' )
				{
					completeCallback(data.requestId);
				}
			}
		});

		return BSVE;
	}
	
	/**
	 * Retrieve the full list of results from a requestId. The object returned by this will have one of 3 status codes. 0 - in progress, 1 - complete, and -1 error. 
	 * This operation will take an indefinite amount of time and therefore will need to be called on an interval(ex. setInterval()) until the status code 1 is received.
	 * @param {string} id - The requestId to retrieve the results for.
	 * @param {function} completeCallback - Callback function to be executed when the server sends a response.
	 * @param {function} errorCallback - Callback to execute in the event of an error.
	 * @param {number} skip - The number of records to be skipped
	 * @param {number} top - The number of records to be returned
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.datasource
	 * @alias BSVE.api.datasource.result
	 */
	ns.api.datasource.result = function(id, completeCallback, errorCallback, skip, top)
	{
		var query = '';
		if (skip || top) {
			query += '?';
			if (skip) {
				query += '$skip=' + skip;
			}
			if (top) {
				if (!query.endsWith('?')) {
					query += '&';
				}
				query += '$top=' + top;
			}
		}
		
		$.ajax({
			url: _searchAPIRoot + "/api/data/result/" + id + query,
			type: 'GET',
			contentType : 'application/json',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				if ( typeof(errorCallback) == 'function' )
				{
					errorCallback(errorThrown);
				}
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(completeCallback) == 'function' )
				{
					completeCallback(data);
				}
			}
		});

		return BSVE;
	}

	/** 
	 * IN PROGRESS: Perform BSVE analytics
	 * @namespace BSVE.api.analytics
	 * @memberof BSVE.api
	 */
	ns.api.analytics = ns.api.analytics || {};

	/**
	 * List the available system analytics.
	 * @param {function} callback - Function to be exectuted once server result has been received.
	 * @param {string} [analytic] - Optionally pass in the specific analytic to get information for rather than the full list.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.analytics
	 * @alias BSVE.api.analytics.list
	 */
	ns.api.analytics.list = function(callback, analytic)
	{
		var _analytic = '';
		if (analytic) _analytic = '/' + analytic;
		$.ajax({
			url: _searchAPIRoot + "/api/analytics/list" + _analytic,
			data: {cache : false },
			type: 'GET',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.log(errorThrown);
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(callback) == 'function' ){callback(data);}
			}
		});

		return BSVE;
	}

	/**
	 * Run an analytic on the server and get the requestId for that analytic to retrieve the results.
	 * @param {string} analyticName - The string name of the analytic to run.
	 * @param {string} analyticParams - The string parameters of the analytic to run.
	 * @param {function} completeCallback - Callback function to be executed when the server sends a response.
	 * @param {function} errorCallback - Callback to execute in the event of an error.
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.analytics
	 * @alias BSVE.api.analytics.run
	 */
	ns.api.analytics.run = function(analyticName, analyticParams, completeCallabck, errorCallback)
	{
		$.ajax({
			url: _searchAPIRoot + "/api/analytics/run/" + analyticName + '?params=' + analyticParams,
			data: {cache : false },
			type: 'GET',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				if ( typeof(errorCallback) == 'function' ){ errorCallback(errorThrown); }
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(completeCallabck) == 'function' ){ completeCallabck(data); }
			}
		});

		return BSVE;
	}


	/**
	 * Gets the result for the specified analytic. The object returned by this will have one of 3 status codes. 0 - in progress, 1 - complete, and -1 error. 
	 * This operation will take an indefinite amount of time and therefore will need to be called on an interval(ex. setInterval()) until the status code 1 is received.
	 * @param {string} id - The id of the analytic to retrieve the result for.
	 * @param {function} completeCallback - Callback function to be executed when the server sned a response.
	 * @param {function} errorCallback - Callback to execute in the event of an error.
	 * @param {number} skip - The number of records to be skipped
	 * @param {number} top - The number of records to be returned
	 * @returns {object} BSVE root object
	 * @memberof BSVE.api.analytics
	 * @alias BSVE.api.analytics.result
	 */
	ns.api.analytics.result = function(id, completeCallback, errorCallback, skip, top)
	{
		var query = '';
		if (skip || top) {
			query += '?';
			if (skip) {
				query += '$skip=' + skip;
			}
			if (top) {
				if (!query.endsWith('?')) {
					query += '&';
				}
				query += '$top=' + top;
			}
		}
		$.ajax({
			url: _searchAPIRoot + "/api/analytics/result/" + id + query,
			type: 'GET',
			contentType : 'application/json',
			beforeSend: function(xhr)
			{
				xhr.setRequestHeader('harbinger-auth-ticket', _authTicket);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				if ( typeof(errorCallback) == 'function' )
				{
					errorCallback(errorThrown);
				}
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(completeCallback) == 'function' )
				{
					completeCallback(data);
				}
			}
		});

		return BSVE;
	}


	/** 
	 * Real time social data streaming services
	 * @namespace BSVE.api.socialstream
	 * @memberof BSVE.api
	 */
	ns.api.socialstream = ns.api.socialstream || {};

	/**
	 * Twitter Social Stream
	 */
	ns.api.socialstream.tweets = function(callback)
	{
		$.ajax({
			url: 'http://nolo-tr.elasticbeanstalk.com/tweets/realtime',
			type: 'GET',
			beforeSend: function(xhr)
			{},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.log(errorThrown);
			},
			success: function(data, textStatus, jqXHR)
			{
				if ( typeof(callback) == 'function' ){callback(data);}
			}
		});

		return BSVE;
	}

	/** 
	 * Date formatters
	 * @namespace BSVE.api.dates
	 * @memberof BSVE.api
	 */
	ns.api.dates = ns.api.dates || {};

	/**
	 * Mar 02 2014 - MDY
	 * @param {string|number|object} input - The input date to transform.
	 * @returns {string} The transformed date string.
	 * @memberof BSVE.api.dates
	 * @alias BSVE.api.dates.Mddyy
	 */
	ns.api.dates.Mddyy = function(input)
	{
		var d = new Date(input);
		return d.toString().split(' ').slice(1,4).join(' ');
	}
	
	/**
	 * Mar 02 2014 - MDY
	 * @param {string|number|object} input - The input date to transform.
	 * @returns {string} The transformed UTC date string.
	 * @memberof BSVE.api.dates
	 * @alias BSVE.api.dates.UTCMddyy
	 */
	ns.api.dates.UTCMddyy = function(input)
	{
		var d = new Date(input).toUTCString();
		return d.toString().split(' ').slice(1,4).join(' ');
	}

	/**
	 * 2015-02-03 - YmD
	 * @param {string|number|object} input - The input date to transform.
	 * @returns {string} The transformed date string.
	 * @memberof BSVE.api.dates
	 * @alias BSVE.api.dates.yymmdd
	 */
	ns.api.dates.yymmdd = function(input)
	{
		var d = new Date(input);
		return d.getFullYear() + '-' + zeroPad(d.getMonth() + 1) + '-' + zeroPad(d.getDate());
	}


	/////////////////////////////////////////
	// Private Methods/Variables
	/////////////////////////////////////////
	var _initializing = false,
		_initialized = false,
		_ready = false,
		_msgs = [];

	// workbench vars
	var _id,
		_user,
		_userData,
		_tenancy,
		_authTicket,
		_appRoot,
		_searchAPIRoot,
		_analyticsAPIRoot,
		_statisticsAPIRoot,
		_app_id,
		_app_launchType;

	// callbacks
	var _initCB = null,
		_alertCB = null,
		_searchCB = null,
		_itemTagCB = null,
		_itemUnTagCB = null,
		_exchangeReceiveCB = null;

	/** @private */
	function zeroPad(val)
	{
		if ( val < 10 ){ return '0' + val; }
		return val;
	}

	/** @private */
	function init(data)
	{
		_id = data.id;
		_user = data.user;
		_userData = data.userData;
		_tenancy = data.tenancy;
		_authTicket = data.authTicket;
		_app_id = data.app_id; // not sure about this vs id
		_app_launchType = data.launchType;
		_initialized = true;

		_appRoot = data.serviceRegistry['HARBINGER_API_WORKBENCH'];
		_searchAPIRoot = data.serviceRegistry['HARBINGER_API_SEARCH'];
		_analyticsAPIRoot = data.serviceRegistry['HARBINGER_API_ANALYTICS'];
		_statisticsAPIRoot = data.serviceRegistry['HARBINGER_API_STATISTICS'];

		if ( _initCB ) _initCB();
	}

	/** @private */
	function jqLoaded()
	{
		// load datepicker
		$.getScript('//d2i1npmup0vp0c.cloudfront.net/bootstrap-datepicker-1.0.js', function(){
			_ready = true;
			searchbar();
			while ( _msgs.length )
			{
				messageHandler(_msgs.shift());
			}
		});
	}

	/** @private */
	function messageHandler( event )
	{
		if ( !_ready )
		{
			_msgs.push(event);
		}
		else
		{
			var data = JSON.parse(event.data);
			switch ( data.type )
			{
				case 'init':
					init( data.value );
					break;
				case 'dossierSet':
					setDossier(data.value);
					break;
				case 'dossierEventSet':
					setDossier(data.value.dossier, data.value.event);
					break;
				case 'eventComponents':
					//eventComponents = data.value; 
					break;
				case 'dossierList':
					updateDossierbar(data.value);
					break;
				case 'dossierItems':
					//console.log('dossierItems', data.value);
					// not sure why?
					break;
				case 'searchBox':
					if ( _searchCB ) { toggleSearchbar(data.value ? 1 : -1); }
					break;
				case 'locationList':
					$('.location-section-inline').data().update(data.value);
					break;
				case 'alertConfirm':
					if ( _alertCB )
					{
						_alertCB(data.value);
						_alertCB = null;
					}
				case 'itemComplete':
					if ( data.value && _itemTagCB )
					{
						if ( data.value.data.dossierEventId )
						{
							_itemTagCB(data.value.data.itemId, data.value.data.dossierEventId, data.value.data.status);
						}
						else
						{
							_itemTagCB(data.value.data.itemId);
						}
					}
					break;
				case 'unTagItemComplete':
					if ( data.value && _itemUnTagCB )
					{
						_itemUnTagCB(data.value);
					}
					break;
				case 'searchAppInit':
					if ( typeof( data.value.term ) != 'undefined' )
					{
						if ( _searchCB )
						{
							$('.searchBar #keyword').val(data.value.term);
							$('#fromDP').val(ns.api.dates.Mddyy(data.value.startDate));
							$("#toDP").val(ns.api.dates.Mddyy(data.value.endDate));
							_searchCB(data.value);
						}
						else
						{
							console.log('no search cb');
						}
					}
					break;
				case 'autoSearch':
					ns.api.search.trigger({
						term: data.value.term,
						originalTerm: data.value.originalTerm,
						startDate: data.value.fromDate,
						endDate: data.value.toDate,
						rawQuery: data.value
					});
					break;
				case 'fedSearch':
					_searchCB(data.value);
				case 'exchange':
					if ( _exchangeReceiveCB ){ _exchangeReceiveCB(data.value); }
					break;
				default:
					console.log('unknown type', data);
					break;
			}
		}
	}

	/** @private */
	function sendWorkbenchMessage( type, msg )
	{
		var _json = JSON.stringify( { "id":_id, "type":type, "value":msg } );
		top.postMessage( _json, '*' );
	}

})( BSVE );


// callback documentation
/**
 * Executes when init has completed.
 * @callback initCallback
 */

/**
 * Executes when alert has been closed via the OK button.
 * @callback alertCallback
 */

/**
 * Executes when a search has been submitted via the inline searchbar or by the user executing a federated search.
 * Passes search object with the following signature: {
	term: search term - if defined | string,
	startDate: start date - if defined | string,
	endDate: end date - if defined | string,
	locations: list of locations - if defined | array[string]
 }
 * @callback searchSubmitCallback
 */

/**
 * Executes when item has been tagged and a response has been recieved from the server.
 * @callback itemTagCallback
 */
