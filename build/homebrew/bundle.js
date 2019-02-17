(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.homebrew = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var Markdown = require('naturalcrit/markdown.js');
var ErrorBar = require('./errorBar/errorBar.jsx');

//TODO: move to the brew renderer
var RenderWarnings = require('homebrewery/renderWarnings/renderWarnings.jsx');
var NotificationPopup = require('./notificationPopup/notificationPopup.jsx');

var PAGE_HEIGHT = 1056;
var PPR_THRESHOLD = 50;

var BrewRenderer = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			text: '',
			errors: []
		};
	},
	getInitialState: function getInitialState() {
		var pages = this.props.text.split('\\page');

		return {
			viewablePageNumber: 0,
			height: 0,
			isMounted: false,

			pages: pages,
			usePPR: pages.length >= PPR_THRESHOLD
		};
	},
	height: 0,
	lastRender: React.createElement('div', null),

	componentDidMount: function componentDidMount() {
		this.updateSize();
		window.addEventListener('resize', this.updateSize);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('resize', this.updateSize);
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		var pages = nextProps.text.split('\\page');
		this.setState({
			pages: pages,
			usePPR: pages.length >= PPR_THRESHOLD
		});
	},

	updateSize: function updateSize() {
		this.setState({
			height: this.refs.main.parentNode.clientHeight,
			isMounted: true
		});
	},

	handleScroll: function handleScroll(e) {
		var target = e.target;
		this.setState(function (prevState) {
			return {
				viewablePageNumber: Math.floor(target.scrollTop / target.scrollHeight * prevState.pages.length)
			};
		});
	},

	shouldRender: function shouldRender(pageText, index) {
		if (!this.state.isMounted) return false;

		var viewIndex = this.state.viewablePageNumber;
		if (index == viewIndex - 3) return true;
		if (index == viewIndex - 2) return true;
		if (index == viewIndex - 1) return true;
		if (index == viewIndex) return true;
		if (index == viewIndex + 1) return true;
		if (index == viewIndex + 2) return true;
		if (index == viewIndex + 3) return true;

		//Check for style tages
		if (pageText.indexOf('<style>') !== -1) return true;

		return false;
	},

	renderPageInfo: function renderPageInfo() {
		return React.createElement(
			'div',
			{ className: 'pageInfo' },
			this.state.viewablePageNumber + 1,
			' / ',
			this.state.pages.length
		);
	},

	renderPPRmsg: function renderPPRmsg() {
		if (!this.state.usePPR) return;

		return React.createElement(
			'div',
			{ className: 'ppr_msg' },
			'Partial Page Renderer enabled, because your brew is so large. May effect rendering.'
		);
	},

	renderDummyPage: function renderDummyPage(index) {
		return React.createElement(
			'div',
			{ className: 'age', id: 'p' + (index + 1), key: index },
			React.createElement('i', { className: 'fa fa-spinner fa-spin' })
		);
	},

	renderPage: function renderPage(pageText, index) {
		return React.createElement('div', { className: 'age', id: 'p' + (index + 1), dangerouslySetInnerHTML: { __html: Markdown.render(pageText) }, key: index });
	},

	renderPages: function renderPages() {
		var _this = this;

		if (this.state.usePPR) {
			return _.map(this.state.pages, function (page, index) {
				if (_this.shouldRender(page, index)) {
					return _this.renderPage(page, index);
				} else {
					return _this.renderDummyPage(index);
				}
			});
		}
		if (this.props.errors && this.props.errors.length) return this.lastRender;
		this.lastRender = _.map(this.state.pages, function (page, index) {
			return _this.renderPage(page, index);
		});
		return this.lastRender;
	},

	render: function render() {
		return React.createElement(
			React.Fragment,
			null,
			React.createElement(
				'div',
				{ className: 'brewRenderer',
					onScroll: this.handleScroll,
					ref: 'main',
					style: { height: this.state.height } },
				React.createElement(ErrorBar, { errors: this.props.errors }),
				React.createElement(
					'div',
					{ className: 'popups' },
					React.createElement(RenderWarnings, null),
					React.createElement(NotificationPopup, null)
				),
				React.createElement(
					'div',
					{ className: 'pages', ref: 'pages' },
					this.renderPages()
				)
			),
			';',
			this.renderPageInfo(),
			this.renderPPRmsg()
		);
	}
});

module.exports = BrewRenderer;

},{"./errorBar/errorBar.jsx":2,"./notificationPopup/notificationPopup.jsx":3,"classnames":"classnames","create-react-class":"create-react-class","homebrewery/renderWarnings/renderWarnings.jsx":28,"lodash":"lodash","naturalcrit/markdown.js":30,"react":"react"}],2:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var ErrorBar = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			errors: []
		};
	},

	hasOpenError: false,
	hasCloseError: false,
	hasMatchError: false,

	renderErrors: function renderErrors() {
		var _this = this;

		this.hasOpenError = false;
		this.hasCloseError = false;
		this.hasMatchError = false;

		var errors = _.map(this.props.errors, function (err, idx) {
			if (err.id == 'OPEN') _this.hasOpenError = true;
			if (err.id == 'CLOSE') _this.hasCloseError = true;
			if (err.id == 'MISMATCH') _this.hasMatchError = true;
			return React.createElement(
				'li',
				{ key: idx },
				'Line ',
				err.line,
				' : ',
				err.text,
				', \'',
				err.type,
				'\' tag'
			);
		});

		return React.createElement(
			'ul',
			null,
			errors
		);
	},

	renderProtip: function renderProtip() {
		var msg = [];
		if (this.hasOpenError) {
			msg.push(React.createElement(
				'div',
				null,
				'An unmatched opening tag means there\'s an opened tag that isn\'t closed, you need to close a tag, like this ',
				'</div>',
				'. Make sure to match types!'
			));
		}

		if (this.hasCloseError) {
			msg.push(React.createElement(
				'div',
				null,
				'An unmatched closing tag means you closed a tag without opening it. Either remove it, you check to where you think you opened it.'
			));
		}

		if (this.hasMatchError) {
			msg.push(React.createElement(
				'div',
				null,
				'A type mismatch means you closed a tag, but the last open tag was a different type.'
			));
		}
		return React.createElement(
			'div',
			{ className: 'protips' },
			React.createElement(
				'h4',
				null,
				'Protips!'
			),
			msg
		);
	},

	render: function render() {
		if (!this.props.errors.length) return null;

		return React.createElement(
			'div',
			{ className: 'errorBar' },
			React.createElement('i', { className: 'fa fa-exclamation-triangle' }),
			React.createElement(
				'h3',
				null,
				' There are HTML errors in your markup'
			),
			React.createElement(
				'small',
				null,
				'If these aren\'t fixed your brew will not render properly when you print it to PDF or share it'
			),
			this.renderErrors(),
			React.createElement('hr', null),
			this.renderProtip()
		);
	}
});

module.exports = ErrorBar;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","react":"react"}],3:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames'); //Unused variable

var DISMISS_KEY = 'dismiss_notification';

var NotificationPopup = createClass({
	getInitialState: function getInitialState() {
		return {
			notifications: {}
		};
	},
	componentDidMount: function componentDidMount() {
		this.checkNotifications();
		window.addEventListener('resize', this.checkNotifications);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('resize', this.checkNotifications);
	},
	notifications: {
		faq: function faq() {
			return React.createElement(
				'li',
				{ key: 'faq' },
				React.createElement(
					'em',
					null,
					'Protect your work! '
				),
				' ',
				React.createElement('br', null),
				'At the moment we do not save a history of your projects, so please make frequent backups of your brews!  \xA0',
				React.createElement(
					'a',
					{ target: '_blank', href: 'https://www.reddit.com/r/homebrewery/comments/adh6lh/faqs_psas_announcements/' },
					'See the FAQ'
				),
				' to learn how to avoid losing your work!'
			);
		}
	},
	checkNotifications: function checkNotifications() {
		var hideDismiss = localStorage.getItem(DISMISS_KEY);
		if (hideDismiss) return this.setState({ notifications: {} });

		this.setState({
			notifications: _.mapValues(this.notifications, function (fn) {
				return fn();
			}) //Convert notification functions into their return text value
		});
	},
	dismiss: function dismiss() {
		localStorage.setItem(DISMISS_KEY, true);
		this.checkNotifications();
	},
	render: function render() {
		if (_.isEmpty(this.state.notifications)) return null;

		return React.createElement(
			'div',
			{ className: 'notificationPopup' },
			React.createElement('i', { className: 'fa fa-times dismiss', onClick: this.dismiss }),
			React.createElement('i', { className: 'fa fa-info-circle info' }),
			React.createElement(
				'h3',
				null,
				'Notice'
			),
			React.createElement(
				'small',
				null,
				'This website is always improving and we are still adding new features and squashing bugs. Keep the following in mind:'
			),
			React.createElement(
				'ul',
				null,
				_.values(this.state.notifications)
			)
		);
	}
});

module.exports = NotificationPopup;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","react":"react"}],4:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var CodeEditor = require('naturalcrit/codeEditor/codeEditor.jsx');
var SnippetBar = require('./snippetbar/snippetbar.jsx');
var MetadataEditor = require('./metadataEditor/metadataEditor.jsx');

var splice = function splice(str, index, inject) {
	return str.slice(0, index) + inject + str.slice(index);
};

var SNIPPETBAR_HEIGHT = 25;

var Editor = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			value: '',
			onChange: function onChange() {},

			metadata: {},
			onMetadataChange: function onMetadataChange() {}
		};
	},
	getInitialState: function getInitialState() {
		return {
			showMetadataEditor: false
		};
	},
	cursorPosition: {
		line: 0,
		ch: 0
	},

	componentDidMount: function componentDidMount() {
		this.updateEditorSize();
		this.highlightPageLines();
		window.addEventListener('resize', this.updateEditorSize);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('resize', this.updateEditorSize);
	},

	updateEditorSize: function updateEditorSize() {
		var paneHeight = this.refs.main.parentNode.clientHeight;
		paneHeight -= SNIPPETBAR_HEIGHT + 1;
		this.refs.codeEditor.codeMirror.setSize(null, paneHeight);
	},

	handleTextChange: function handleTextChange(text) {
		this.props.onChange(text);
	},
	handleCursorActivty: function handleCursorActivty(curpos) {
		this.cursorPosition = curpos;
	},
	handleInject: function handleInject(injectText) {
		var lines = this.props.value.split('\n');
		lines[this.cursorPosition.line] = splice(lines[this.cursorPosition.line], this.cursorPosition.ch, injectText);

		this.handleTextChange(lines.join('\n'));
		this.refs.codeEditor.setCursorPosition(this.cursorPosition.line, this.cursorPosition.ch + injectText.length);
	},
	handgleToggle: function handgleToggle() {
		this.setState({
			showMetadataEditor: !this.state.showMetadataEditor
		});
	},

	getCurrentPage: function getCurrentPage() {
		var lines = this.props.value.split('\n').slice(0, this.cursorPosition.line + 1);
		return _.reduce(lines, function (r, line) {
			if (line.indexOf('\\page') !== -1) r++;
			return r;
		}, 1);
	},

	highlightPageLines: function highlightPageLines() {
		if (!this.refs.codeEditor) return;
		var codeMirror = this.refs.codeEditor.codeMirror;

		var lineNumbers = _.reduce(this.props.value.split('\n'), function (r, line, lineNumber) {
			if (line.indexOf('\\page') !== -1) {
				codeMirror.addLineClass(lineNumber, 'background', 'pageLine');
				r.push(lineNumber);
			}
			return r;
		}, []);
		return lineNumbers;
	},

	brewJump: function brewJump() {
		var currentPage = this.getCurrentPage();
		window.location.hash = 'p' + currentPage;
	},

	//Called when there are changes to the editor's dimensions
	update: function update() {
		this.refs.codeEditor.updateSize();
	},

	renderMetadataEditor: function renderMetadataEditor() {
		if (!this.state.showMetadataEditor) return;
		return React.createElement(MetadataEditor, {
			metadata: this.props.metadata,
			onChange: this.props.onMetadataChange
		});
	},

	render: function render() {
		this.highlightPageLines();
		return React.createElement(
			'div',
			{ className: 'editor', ref: 'main' },
			React.createElement(SnippetBar, {
				brew: this.props.value,
				onInject: this.handleInject,
				onToggle: this.handgleToggle,
				showmeta: this.state.showMetadataEditor }),
			this.renderMetadataEditor(),
			React.createElement(CodeEditor, {
				ref: 'codeEditor',
				wrap: true,
				language: 'gfm',
				value: this.props.value,
				onChange: this.handleTextChange,
				onCursorActivity: this.handleCursorActivty })
		);
	}
});

module.exports = Editor;

},{"./metadataEditor/metadataEditor.jsx":5,"./snippetbar/snippetbar.jsx":6,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/codeEditor/codeEditor.jsx":29,"react":"react"}],5:[function(require,module,exports){
'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');
var request = require('superagent');

var SYSTEMS = ['5e', '4e', '3.5e', 'Pathfinder'];

var MetadataEditor = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			metadata: {
				editId: null,
				title: '',
				description: '',
				tags: '',
				published: false,
				authors: [],
				systems: []
			},
			onChange: function onChange() {}
		};
	},

	handleFieldChange: function handleFieldChange(name, e) {
		this.props.onChange(_.merge({}, this.props.metadata, _defineProperty({}, name, e.target.value)));
	},
	handleSystem: function handleSystem(system, e) {
		if (e.target.checked) {
			this.props.metadata.systems.push(system);
		} else {
			this.props.metadata.systems = _.without(this.props.metadata.systems, system);
		}
		this.props.onChange(this.props.metadata);
	},
	handlePublish: function handlePublish(val) {
		this.props.onChange(_.merge({}, this.props.metadata, {
			published: val
		}));
	},

	handleDelete: function handleDelete() {
		if (!confirm('are you sure you want to delete this brew?')) return;
		if (!confirm('are you REALLY sure? You will not be able to recover it')) return;

		request.get('/api/remove/' + this.props.metadata.editId).send().end(function (err, res) {
			window.location.href = '/';
		});
	},

	getRedditLink: function getRedditLink() {
		var meta = this.props.metadata;
		var title = meta.title + ' [' + meta.systems.join(' ') + ']';
		var text = 'Hey guys! I\'ve been working on this homebrew. I\'d love your feedback. Check it out.\n\n**[Homebrewery Link](http://homebrewery.naturalcrit.com/share/' + meta.shareId + ')**';

		return 'https://www.reddit.com/r/UnearthedArcana/submit?title=' + encodeURIComponent(title) + '&text=' + encodeURIComponent(text);
	},

	renderSystems: function renderSystems() {
		var _this = this;

		return _.map(SYSTEMS, function (val) {
			return React.createElement(
				'label',
				{ key: val },
				React.createElement('input', {
					type: 'checkbox',
					checked: _.includes(_this.props.metadata.systems, val),
					onChange: function onChange(e) {
						return _this.handleSystem(val, e);
					} }),
				val
			);
		});
	},

	renderPublish: function renderPublish() {
		var _this2 = this;

		if (this.props.metadata.published) {
			return React.createElement(
				'button',
				{ className: 'unpublish', onClick: function onClick() {
						return _this2.handlePublish(false);
					} },
				React.createElement('i', { className: 'fa fa-ban' }),
				' unpublish'
			);
		} else {
			return React.createElement(
				'button',
				{ className: 'publish', onClick: function onClick() {
						return _this2.handlePublish(true);
					} },
				React.createElement('i', { className: 'fa fa-globe' }),
				' publish'
			);
		}
	},

	renderDelete: function renderDelete() {
		if (!this.props.metadata.editId) return;

		return React.createElement(
			'div',
			{ className: 'field delete' },
			React.createElement(
				'label',
				null,
				'delete'
			),
			React.createElement(
				'div',
				{ className: 'value' },
				React.createElement(
					'button',
					{ className: 'publish', onClick: this.handleDelete },
					React.createElement('i', { className: 'fa fa-trash' }),
					' delete brew'
				)
			)
		);
	},

	renderAuthors: function renderAuthors() {
		var text = 'None.';
		if (this.props.metadata.authors.length) {
			text = this.props.metadata.authors.join(', ');
		}
		return React.createElement(
			'div',
			{ className: 'field authors' },
			React.createElement(
				'label',
				null,
				'authors'
			),
			React.createElement(
				'div',
				{ className: 'value' },
				text
			)
		);
	},

	renderShareToReddit: function renderShareToReddit() {
		if (!this.props.metadata.shareId) return;

		return React.createElement(
			'div',
			{ className: 'field reddit' },
			React.createElement(
				'label',
				null,
				'reddit'
			),
			React.createElement(
				'div',
				{ className: 'value' },
				React.createElement(
					'a',
					{ href: this.getRedditLink(), target: '_blank', rel: 'noopener noreferrer' },
					React.createElement(
						'button',
						{ className: 'publish' },
						React.createElement('i', { className: 'fa fa-reddit-alien' }),
						' share to reddit'
					)
				)
			)
		);
	},

	render: function render() {
		var _this3 = this;

		return React.createElement(
			'div',
			{ className: 'metadataEditor' },
			React.createElement(
				'div',
				{ className: 'field title' },
				React.createElement(
					'label',
					null,
					'title'
				),
				React.createElement('input', { type: 'text', className: 'value',
					value: this.props.metadata.title,
					onChange: function onChange(e) {
						return _this3.handleFieldChange('title', e);
					} })
			),
			React.createElement(
				'div',
				{ className: 'field description' },
				React.createElement(
					'label',
					null,
					'description'
				),
				React.createElement('textarea', { value: this.props.metadata.description, className: 'value',
					onChange: function onChange(e) {
						return _this3.handleFieldChange('description', e);
					} })
			),
			React.createElement(
				'div',
				{ className: 'field systems' },
				React.createElement(
					'label',
					null,
					'systems'
				),
				React.createElement(
					'div',
					{ className: 'value' },
					this.renderSystems()
				)
			),
			this.renderAuthors(),
			React.createElement(
				'div',
				{ className: 'field publish' },
				React.createElement(
					'label',
					null,
					'publish'
				),
				React.createElement(
					'div',
					{ className: 'value' },
					this.renderPublish(),
					React.createElement(
						'small',
						null,
						'Published homebrews will be publicly viewable and searchable (eventually...)'
					)
				)
			),
			this.renderShareToReddit(),
			this.renderDelete()
		);
	}
});

module.exports = MetadataEditor;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","react":"react","superagent":"superagent"}],6:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var Snippets = require('./snippets/snippets.js');

var execute = function execute(val, brew) {
	if (_.isFunction(val)) return val(brew);
	return val;
};

var Snippetbar = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			brew: '',
			onInject: function onInject() {},
			onToggle: function onToggle() {},
			showmeta: false
		};
	},

	handleSnippetClick: function handleSnippetClick(injectedText) {
		this.props.onInject(injectedText);
	},

	renderSnippetGroups: function renderSnippetGroups() {
		var _this = this;

		return _.map(Snippets, function (snippetGroup) {
			return React.createElement(SnippetGroup, {
				brew: _this.props.brew,
				groupName: snippetGroup.groupName,
				icon: snippetGroup.icon,
				snippets: snippetGroup.snippets,
				key: snippetGroup.groupName,
				onSnippetClick: _this.handleSnippetClick
			});
		});
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'snippetBar' },
			this.renderSnippetGroups(),
			React.createElement(
				'div',
				{ className: cx('toggleMeta', { selected: this.props.showmeta }),
					onClick: this.props.onToggle },
				React.createElement('i', { className: 'fa fa-bars' })
			)
		);
	}
});

module.exports = Snippetbar;

var SnippetGroup = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			brew: '',
			groupName: '',
			icon: 'fa-rocket',
			snippets: [],
			onSnippetClick: function onSnippetClick() {}
		};
	},
	handleSnippetClick: function handleSnippetClick(snippet) {
		this.props.onSnippetClick(execute(snippet.gen, this.props.brew));
	},
	renderSnippets: function renderSnippets() {
		var _this2 = this;

		return _.map(this.props.snippets, function (snippet) {
			return React.createElement(
				'div',
				{ className: 'snippet', key: snippet.name, onClick: function onClick() {
						return _this2.handleSnippetClick(snippet);
					} },
				React.createElement('i', { className: 'fa fa-fw ' + snippet.icon }),
				snippet.name
			);
		});
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'snippetGroup' },
			React.createElement(
				'div',
				{ className: 'text' },
				React.createElement('i', { className: 'fa fa-fw ' + this.props.icon }),
				React.createElement(
					'span',
					{ className: 'groupName' },
					this.props.groupName
				)
			),
			React.createElement(
				'div',
				{ className: 'dropdown' },
				this.renderSnippets()
			)
		);
	}

});

},{"./snippets/snippets.js":12,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","react":"react"}],7:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = function (classname) {

	classname = _.sample(['archivist', 'fancyman', 'linguist', 'fletcher', 'notary', 'berserker-typist', 'fishmongerer', 'manicurist', 'haberdasher', 'concierge']);

	classname = classname.toLowerCase();

	var hitDie = _.sample([4, 6, 8, 10, 12]);

	var abilityList = ['Strength', 'Dexerity', 'Constitution', 'Wisdom', 'Charisma', 'Intelligence'];
	var skillList = ['Acrobatics ', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'];

	return ['## Class Features', 'As a ' + classname + ', you gain the following class features', '#### Hit Points', '___', '- **Hit Dice:** 1d' + hitDie + ' per ' + classname + ' level', '- **Hit Points at 1st Level:** ' + hitDie + ' + your Constitution modifier', '- **Hit Points at Higher Levels:** 1d' + hitDie + ' (or ' + (hitDie / 2 + 1) + ') + your Constitution modifier per ' + classname + ' level after 1st', '', '#### Proficiencies', '___', '- **Armor:** ' + (_.sampleSize(['Light armor', 'Medium armor', 'Heavy armor', 'Shields'], _.random(0, 3)).join(', ') || 'None'), '- **Weapons:** ' + (_.sampleSize(['Squeegee', 'Rubber Chicken', 'Simple weapons', 'Martial weapons'], _.random(0, 2)).join(', ') || 'None'), '- **Tools:** ' + (_.sampleSize(['Artian\'s tools', 'one musical instrument', 'Thieve\'s tools'], _.random(0, 2)).join(', ') || 'None'), '', '___', '- **Saving Throws:** ' + _.sampleSize(abilityList, 2).join(', '), '- **Skills:** Choose two from ' + _.sampleSize(skillList, _.random(4, 6)).join(', '), '', '#### Equipment', 'You start with the following equipment, in addition to the equipment granted by your background:', '- *(a)* a martial weapon and a shield or *(b)* two martial weapons', '- *(a)* five javelins or *(b)* any simple melee weapon', '- ' + _.sample(['10 lint fluffs', '1 button', 'a cherished lost sock']), '\n\n\n'].join('\n');
};

},{"lodash":"lodash"}],8:[function(require,module,exports){
'use strict';

var _ = require('lodash');

var features = ['Astrological Botany', 'Astrological Chemistry', 'Biochemical Sorcery', 'Civil Alchemy', 'Consecrated Biochemistry', 'Demonic Anthropology', 'Divinatory Mineralogy', 'Genetic Banishing', 'Hermetic Geography', 'Immunological Incantations', 'Nuclear Illusionism', 'Ritual Astronomy', 'Seismological Divination', 'Spiritual Biochemistry', 'Statistical Occultism', 'Police Necromancer', 'Sixgun Poisoner', 'Pharmaceutical Gunslinger', 'Infernal Banker', 'Spell Analyst', 'Gunslinger Corruptor', 'Torque Interfacer', 'Exo Interfacer', 'Gunpowder Torturer', 'Orbital Gravedigger', 'Phased Linguist', 'Mathematical Pharmacist', 'Plasma Outlaw', 'Malefic Chemist', 'Police Cultist'];

var classnames = ['Archivist', 'Fancyman', 'Linguist', 'Fletcher', 'Notary', 'Berserker-Typist', 'Fishmongerer', 'Manicurist', 'Haberdasher', 'Concierge'];

var levels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th'];

var profBonus = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];

var getFeature = function getFeature(level) {
	var res = [];
	if (_.includes([4, 6, 8, 12, 14, 16, 19], level + 1)) {
		res = ['Ability Score Improvement'];
	}
	res = _.union(res, _.sampleSize(features, _.sample([0, 1, 1, 1, 1, 1])));
	if (!res.length) return '─';
	return res.join(', ');
};

module.exports = {
	full: function full() {
		var classname = _.sample(classnames);

		var maxes = [4, 3, 3, 3, 3, 2, 2, 1, 1];
		var drawSlots = function drawSlots(Slots) {
			var slots = Number(Slots);
			return _.times(9, function (i) {
				var max = maxes[i];
				if (slots < 1) return '—';
				var res = _.min([max, slots]);
				slots -= res;
				return res;
			}).join(' | ');
		};

		var cantrips = 3;
		var spells = 1;
		var slots = 2;
		return '<div class=\'classTable wide\'>\n##### The ' + classname + '\n' + '| Level | Proficiency Bonus | Features | Cantrips Known | Spells Known | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th |\n' + ('|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n' + _.map(levels, function (levelName, level) {
			var res = [levelName, '+' + profBonus[level], getFeature(level), cantrips, spells, drawSlots(slots)].join(' | ');

			cantrips += _.random(0, 1);
			spells += _.random(0, 1);
			slots += _.random(0, 2);

			return '| ' + res + ' |';
		}).join('\n') + '\n</div>\n\n');
	},

	half: function half() {
		var classname = _.sample(classnames);

		var featureScore = 1;
		return '<div class=\'classTable\'>\n##### The ' + classname + '\n' + ('| Level | Proficiency Bonus | Features | ' + _.sample(features) + '|\n') + ('|:---:|:---:|:---|:---:|\n' + _.map(levels, function (levelName, level) {
			var res = [levelName, '+' + profBonus[level], getFeature(level), '+' + featureScore].join(' | ');

			featureScore += _.random(0, 1);

			return '| ' + res + ' |';
		}).join('\n') + '\n</div>\n\n');
	}
};

},{"lodash":"lodash"}],9:[function(require,module,exports){
'use strict';

var _ = require('lodash');

var titles = ['The Burning Gallows', 'The Ring of Nenlast', 'Below the Blind Tavern', 'Below the Hungering River', 'Before Bahamut\'s Land', 'The Cruel Grave from Within', 'The Strength of Trade Road', 'Through The Raven Queen\'s Worlds', 'Within the Settlement', 'The Crown from Within', 'The Merchant Within the Battlefield', 'Ioun\'s Fading Traveler', 'The Legion Ingredient', 'The Explorer Lure', 'Before the Charming Badlands', 'The Living Dead Above the Fearful Cage', 'Vecna\'s Hidden Sage', 'Bahamut\'s Demonspawn', 'Across Gruumsh\'s Elemental Chaos', 'The Blade of Orcus', 'Beyond Revenge', 'Brain of Insanity', 'Breed Battle!, A New Beginning', 'Evil Lake, A New Beginning', 'Invasion of the Gigantic Cat, Part II', 'Kraken War 2020', 'The Body Whisperers', 'The Diabolical Tales of the Ape-Women', 'The Doctor Immortal', 'The Doctor from Heaven', 'The Graveyard', 'Azure Core', 'Core Battle', 'Core of Heaven: The Guardian of Amazement', 'Deadly Amazement III', 'Dry Chaos IX', 'Gate Thunder', 'Guardian: Skies of the Dark Wizard', 'Lute of Eternity', 'Mercury\'s Planet: Brave Evolution', 'Ruby of Atlantis: The Quake of Peace', 'Sky of Zelda: The Thunder of Force', 'Vyse\'s Skies', 'White Greatness III', 'Yellow Divinity', 'Zidane\'s Ghost'];

var subtitles = ['In an ominous universe, a botanist opposes terrorism.', 'In a demon-haunted city, in an age of lies and hate, a physicist tries to find an ancient treasure and battles a mob of aliens.', 'In a land of corruption, two cyberneticists and a dungeon delver search for freedom.', 'In an evil empire of horror, two rangers battle the forces of hell.', 'In a lost city, in an age of sorcery, a librarian quests for revenge.', 'In a universe of illusions and danger, three time travellers and an adventurer search for justice.', 'In a forgotten universe of barbarism, in an era of terror and mysticism, a virtual reality programmer and a spy try to find vengance and battle crime.', 'In a universe of demons, in an era of insanity and ghosts, three bodyguards and a bodyguard try to find vengance.', 'In a kingdom of corruption and battle, seven artificial intelligences try to save the last living fertile woman.', 'In a universe of virutal reality and agony, in an age of ghosts and ghosts, a fortune-teller and a wanderer try to avert the apocalypse.', 'In a crime-infested kingdom, three martial artists quest for the truth and oppose evil.', 'In a terrifying universe of lost souls, in an era of lost souls, eight dancers fight evil.', 'In a galaxy of confusion and insanity, three martial artists and a duke battle a mob of psychics.', 'In an amazing kingdom, a wizard and a secretary hope to prevent the destruction of mankind.', 'In a kingdom of deception, a reporter searches for fame.', 'In a hellish empire, a swordswoman and a duke try to find the ultimate weapon and battle a conspiracy.', 'In an evil galaxy of illusion, in a time of technology and misery, seven psychiatrists battle crime.', 'In a dark city of confusion, three swordswomen and a singer battle lawlessness.', 'In an ominous empire, in an age of hate, two philosophers and a student try to find justice and battle a mob of mages intent on stealing the souls of the innocent.', 'In a kingdom of panic, six adventurers oppose lawlessness.', 'In a land of dreams and hopelessness, three hackers and a cyborg search for justice.', 'On a planet of mysticism, three travelers and a fire fighter quest for the ultimate weapon and oppose evil.', 'In a wicked universe, five seers fight lawlessness.', 'In a kingdom of death, in an era of illusion and blood, four colonists search for fame.', 'In an amazing kingdom, in an age of sorcery and lost souls, eight space pirates quest for freedom.', 'In a cursed empire, five inventors oppose terrorism.', 'On a crime-ridden planet of conspiracy, a watchman and an artificial intelligence try to find love and oppose lawlessness.', 'In a forgotten land, a reporter and a spy try to stop the apocalypse.', 'In a forbidden land of prophecy, a scientist and an archivist oppose a cabal of barbarians intent on stealing the souls of the innocent.', 'On an infernal world of illusion, a grave robber and a watchman try to find revenge and combat a syndicate of mages intent on stealing the source of all magic.', 'In a galaxy of dark magic, four fighters seek freedom.', 'In an empire of deception, six tomb-robbers quest for the ultimate weapon and combat an army of raiders.', 'In a kingdom of corruption and lost souls, in an age of panic, eight planetologists oppose evil.', 'In a galaxy of misery and hopelessness, in a time of agony and pain, five planetologists search for vengance.', 'In a universe of technology and insanity, in a time of sorcery, a computer techician quests for hope.', 'On a planet of dark magic and barbarism, in an age of horror and blasphemy, seven librarians search for fame.', 'In an empire of dark magic, in a time of blood and illusions, four monks try to find the ultimate weapon and combat terrorism.', 'In a forgotten empire of dark magic, six kings try to prevent the destruction of mankind.', 'In a galaxy of dark magic and horror, in an age of hopelessness, four marines and an outlaw combat evil.', 'In a mysterious city of illusion, in an age of computerization, a witch-hunter tries to find the ultimate weapon and opposes an evil corporation.', 'In a damned kingdom of technology, a virtual reality programmer and a fighter seek fame.', 'In a hellish kingdom, in an age of blasphemy and blasphemy, an astrologer searches for fame.', 'In a damned world of devils, an alien and a ranger quest for love and oppose a syndicate of demons.', 'In a cursed galaxy, in a time of pain, seven librarians hope to avert the apocalypse.', 'In a crime-infested galaxy, in an era of hopelessness and panic, three champions and a grave robber try to solve the ultimate crime.'];

module.exports = function () {
	return '<style>\n  .age#p1{ text-align:center; }\n  .age#p1:after{ display:none; }\n  &:not(:nth-child(1)) {\n\t&:after{\n\t\tbackground-color: @headerText\n\t}\n  }\n\n</style>\n\n<div style=\'margin-top:450px;\'></div>\n\n# ' + _.sample(titles) + '\n\n<div style=\'margin-top:25px\'></div>\n<div class=\'wide\'>\n##### ' + _.sample(subtitles) + '\n</div>\n\n\\page';
};

},{"lodash":"lodash"}],10:[function(require,module,exports){
'use strict';

var _ = require('lodash');

var spellNames = ['Astral Rite of Acne', 'Create Acne', 'Cursed Ramen Erruption', 'Dark Chant of the Dentists', 'Erruption of Immaturity', 'Flaming Disc of Inconvenience', 'Heal Bad Hygene', 'Heavenly Transfiguration of the Cream Devil', 'Hellish Cage of Mucus', 'Irritate Peanut Butter Fairy', 'Luminous Erruption of Tea', 'Mystic Spell of the Poser', 'Sorcerous Enchantment of the Chimneysweep', 'Steak Sauce Ray', 'Talk to Groupie', 'Astonishing Chant of Chocolate', 'Astounding Pasta Puddle', 'Ball of Annoyance', 'Cage of Yarn', 'Control Noodles Elemental', 'Create Nervousness', 'Cure Baldness', 'Cursed Ritual of Bad Hair', 'Dispell Piles in Dentist', 'Eliminate Florists', 'Illusionary Transfiguration of the Babysitter', 'Necromantic Armor of Salad Dressing', 'Occult Transfiguration of Foot Fetish', 'Protection from Mucus Giant', 'Tinsel Blast', 'Alchemical Evocation of the Goths', 'Call Fangirl', 'Divine Spell of Crossdressing', 'Dominate Ramen Giant', 'Eliminate Vindictiveness in Gym Teacher', 'Extra-Planar Spell of Irritation', 'Induce Whining in Babysitter', 'Invoke Complaining', 'Magical Enchantment of Arrogance', 'Occult Globe of Salad Dressing', 'Overwhelming Enchantment of the Chocolate Fairy', 'Sorcerous Dandruff Globe', 'Spiritual Invocation of the Costumers', 'Ultimate Rite of the Confetti Angel', 'Ultimate Ritual of Mouthwash'];

module.exports = {

	spellList: function spellList() {
		var levels = ['Cantrips (0 Level)', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];

		var content = _.map(levels, function (level) {
			var spells = _.map(_.sampleSize(spellNames, _.random(5, 15)), function (spell) {
				return '- ' + spell;
			}).join('\n');
			return '##### ' + level + ' \n' + spells + ' \n';
		}).join('\n');

		return '<div class=\'spellList\'>\n' + content + '\n</div>';
	},

	spell: function spell() {
		var level = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
		var spellSchools = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'];

		var components = _.sampleSize(['V', 'S', 'M'], _.random(1, 3)).join(', ');
		if (components.indexOf('M') !== -1) {
			components += ' (' + _.sampleSize(['a small doll', 'a crushed button worth at least 1cp', 'discarded gum wrapper'], _.random(1, 3)).join(', ') + ')';
		}

		return ['#### ' + _.sample(spellNames), '*' + _.sample(level) + '-level ' + _.sample(spellSchools) + '*', '___', '- **Casting Time:** 1 action', '- **Range:** ' + _.sample(['Self', 'Touch', '30 feet', '60 feet']), '- **Components:** ' + components, '- **Duration:** ' + _.sample(['Until dispelled', '1 round', 'Instantaneous', 'Concentration, up to 10 minutes', '1 hour']), '', 'A flame, equivalent in brightness to a torch, springs from from an object that you touch. ', 'The effect look like a regular flame, but it creates no heat and doesn\'t use oxygen. ', 'A *continual flame* can be covered or hidden but not smothered or quenched.', '\n\n\n'].join('\n');
	}
};

},{"lodash":"lodash"}],11:[function(require,module,exports){
'use strict';

var _ = require('lodash');

var genList = function genList(list, max) {
	return _.sampleSize(list, _.random(0, max)).join(', ') || 'None';
};

var getMonsterName = function getMonsterName() {
	return _.sample(['All-devouring Baseball Imp', 'All-devouring Gumdrop Wraith', 'Chocolate Hydra', 'Devouring Peacock', 'Economy-sized Colossus of the Lemonade Stand', 'Ghost Pigeon', 'Gibbering Duck', 'Sparklemuffin Peacock Spider', 'Gum Elemental', 'Illiterate Construct of the Candy Store', 'Ineffable Chihuahua', 'Irritating Death Hamster', 'Irritating Gold Mouse', 'Juggernaut Snail', 'Juggernaut of the Sock Drawer', 'Koala of the Cosmos', 'Mad Koala of the West', 'Milk Djinni of the Lemonade Stand', 'Mind Ferret', 'Mystic Salt Spider', 'Necrotic Halitosis Angel', 'Pinstriped Famine Sheep', 'Ritalin Leech', 'Shocker Kangaroo', 'Stellar Tennis Juggernaut', 'Wailing Quail of the Sun', 'Angel Pigeon', 'Anime Sphinx', 'Bored Avalanche Sheep of the Wasteland', 'Devouring Nougat Sphinx of the Sock Drawer', 'Djinni of the Footlocker', 'Ectoplasmic Jazz Devil', 'Flatuent Angel', 'Gelatinous Duck of the Dream-Lands', 'Gelatinous Mouse', 'Golem of the Footlocker', 'Lich Wombat', 'Mechanical Sloth of the Past', 'Milkshake Succubus', 'Puffy Bone Peacock of the East', 'Rainbow Manatee', 'Rune Parrot', 'Sand Cow', 'Sinister Vanilla Dragon', 'Snail of the North', 'Spider of the Sewer', 'Stellar Sawdust Leech', 'Storm Anteater of Hell', 'Stupid Spirit of the Brewery', 'Time Kangaroo', 'Tomb Poodle']);
};

var getType = function getType() {
	return _.sample(['Tiny', 'Small', 'Medium', 'Large', 'Gargantuan', 'Stupidly vast']) + ' ' + _.sample(['beast', 'fiend', 'annoyance', 'guy', 'cutie']);
};

var getAlignment = function getAlignment() {
	return _.sample(['annoying evil', 'chaotic gossipy', 'chaotic sloppy', 'depressed neutral', 'lawful bogus', 'lawful coy', 'manic-depressive evil', 'narrow-minded neutral', 'neutral annoying', 'neutral ignorant', 'oedpipal neutral', 'silly neutral', 'unoriginal neutral', 'weird neutral', 'wordy evil', 'unaligned']);
};

var getStats = function getStats() {
	return '>|' + _.times(9, function () {
		var num = _.random(1, 15);
		var val = Math.ceil(num / 3 - 2);
		//const mod = Math.ceil(num/2 - 5);
		return '(' + (num == 1 ? -2 : num == 15 ? 4 : val) + ')';
	}).join('|') + '|';
};

var genAbilities = function genAbilities() {
	return _.sample(['> - ***Pack Tactics.*** These guys work together. Like super well, you don\'t even know.', '> - ***False Appearance. *** While the armor reamin motionless, it is indistinguishable from a normal suit of armor.']);
};

var genAction = function genAction() {
	var name = _.sample(['Abdominal Drop', 'Airplane Hammer', 'Atomic Death Throw', 'Bulldog Rake', 'Corkscrew Strike', 'Crossed Splash', 'Crossface Suplex', 'DDT Powerbomb', 'Dual Cobra Wristlock', 'Dual Throw', 'Elbow Hold', 'Gory Body Sweep', 'Heel Jawbreaker', 'Jumping Driver', 'Open Chin Choke', 'Scorpion Flurry', 'Somersault Stump Fists', 'Suffering Wringer', 'Super Hip Submission', 'Super Spin', 'Team Elbow', 'Team Foot', 'Tilt-a-whirl Chin Sleeper', 'Tilt-a-whirl Eye Takedown', 'Turnbuckle Roll']);

	return '> ***' + name + '.*** *Melee Weapon Attack:* +4 to hit, reach 5ft., one target. *Hit* 5 (1d6 + 2) ';
};

module.exports = {

	full: function full() {
		return ['___', '___', '> ## ' + getMonsterName(), '>*' + getType() + ', ' + getAlignment() + '*', '> ___', '> - **Armor Class** ' + _.random(10, 20), '> - **Hit Points** ' + _.random(1, 150) + '(1d4 + 5)', '> - **Speed** ' + _.random(0, 50) + 'ft.', '>___', '>|STR|DEX|CON|INT|WIS|CHA|', '>|:---:|:---:|:---:|:---:|:---:|:---:|', getStats(), '>___', '> - **Condition Immunities** ' + genList(['groggy', 'swagged', 'weak-kneed', 'buzzed', 'groovy', 'melancholy', 'drunk'], 3), '> - **Senses** passive Perception ' + _.random(3, 20), '> - **Languages** ' + genList(['Common', 'Pottymouth', 'Gibberish', 'Latin', 'Jive'], 2), '> - **Challenge** ' + _.random(0, 15) + ' (' + _.random(10, 10000) + ' XP)', '> ___', _.times(_.random(3, 6), function () {
			return genAbilities();
		}).join('\n>\n'), '> ### Actions', _.times(_.random(4, 6), function () {
			return genAction();
		}).join('\n>\n')].join('\n') + '\n\n\n';
	},

	half: function half() {
		return ['___', '> ##### ' + getMonsterName(), '>| Value | Abilities (Focuses) |', '>|:-----:|:-------------|', '>| 1 | Accuracy |', '>| -1 | Communication |', '>| 1 | Constitution (Stamina) |', '>| 0 | Dexterity (Riding) |', '>| 2 | Fighting (Heavy Blades,Spears) |', '>| 0 | Intelligence (Military Lore) |', '>| 0 | Perception |', '>| 2 | Strength (Climbing) |', '>| 1 | Willpower (Morale) |', '>', '> | Speed | Health | Defense | Armor Rating |', '> |:-----:|:------:|:-------:|:------------:|', '> | 10 | 32 | 12 | 3 |', '>', '> | Weapon | Attack Roll | Damage |', '> |:------:|:-----------:|:------:|', '>| Longsword | +4 | 2d6+2 |', '> ___', '> ###### Special Qualities ', '>', '> - **Favored Stunts**: Knock Prone, Mighty Blow, Skirmish. ', '> - **Talents**: Armor  Training (Journeyman), Single Weapon Style (Novice), Thrown Weapon Style (Novice).', '> - **Weapons Groups**: Brawling, Heavy Blades, Polearms, Spears.', '> - **Equipment**: Light mail, medium shield, longsword, and two throwing spears.', '> ', '> ___', '> ##### Threat: Minor'].join('\n') + '\n\n\n';

		/* 
  			'___',
  			`> ## ${getMonsterName()}`,
  			`>*${getType()}, ${getAlignment()}*`,
  			'> ___',
  			`> - **Armor Class** ${_.random(10, 20)}`,
  			`> - **Hit Points** ${_.random(1, 150)}(1d4 + 5)`,
  			`> - **Speed** ${_.random(0, 50)}ft.`,
  			'>___',
  			'>|STR|DEX|CON|INT|WIS|CHA|',
  			'>|:---:|:---:|:---:|:---:|:---:|:---:|',
  			getStats(),
  			'>___',
  			`> - **Condition Immunities** ${genList(['groggy', 'swagged', 'weak-kneed', 'buzzed', 'groovy', 'melancholy', 'drunk'], 3)}`,
  			`> - **Senses** passive Perception ${_.random(3, 20)}`,
  			`> - **Languages** ${genList(['Common', 'Pottymouth', 'Gibberish', 'Latin', 'Jive'], 2)}`,
  			`> - **Challenge** ${_.random(0, 15)} (${_.random(10, 10000)} XP)`,
  			'> ___',
  			_.times(_.random(0, 2), function(){
  				return genAbilities();
  			}).join('\n>\n'),
  			'> ### Actions',
  			_.times(_.random(1, 2), function(){
  				return genAction();
  			}).join('\n>\n'),
  		].join('\n')}\n\n\n`; */
	}
};

},{"lodash":"lodash"}],12:[function(require,module,exports){
'use strict';

/* eslint-disable max-lines */

var MagicGen = require('./magic.gen.js');
var ClassTableGen = require('./classtable.gen.js');
var MonsterBlockGen = require('./monsterblock.gen.js');
var ClassFeatureGen = require('./classfeature.gen.js');
var CoverPageGen = require('./coverpage.gen.js');
var TableOfContentsGen = require('./tableOfContents.gen.js');

module.exports = [{
	groupName: 'Editor',
	icon: 'fa-pencil',
	snippets: [{
		name: 'Column Break',
		icon: 'fa-columns',
		gen: '```\n```\n\n'
	}, {
		name: 'New Page',
		icon: 'fa-file-text',
		gen: '\\page\n\n'
	}, {
		name: 'Vertical Spacing',
		icon: 'fa-arrows-v',
		gen: '<div style=\'margin-top:140px\'></div>\n\n'
	}, {
		name: 'Wide Block',
		icon: 'fa-arrows-h',
		gen: '<div class=\'wide\'>\nEverything in here will be extra wide. Tables, text, everything! Beware though, CSS columns can behave a bit weird sometimes.\n</div>\n'
	}, {
		name: 'Image',
		icon: 'fa-image',
		gen: ['<img ', '  src=\'https://s-media-cache-ak0.pinimg.com/736x/4a/81/79/4a8179462cfdf39054a418efd4cb743e.jpg\' ', '  style=\'width:325px\' />', 'Credit: Kyounghwan Kim'].join('\n')
	}, {
		name: 'Background Image',
		icon: 'fa-tree',
		gen: ['<img ', '  src=\'http://i.imgur.com/hMna6G0.png\' ', '  style=\'position:absolute; top:50px; right:30px; width:280px\' />'].join('\n')
	}, {
		name: 'Page Number',
		icon: 'fa-bookmark',
		gen: '<div class=\'pageNumber\'>1</div>\n<div class=\'footnote\'>PART 1 | FANCINESS</div>\n\n'
	}, {
		name: 'Auto-incrementing Page Number',
		icon: 'fa-sort-numeric-asc',
		gen: '<div class=\'pageNumber auto\'></div>\n'
	}, {
		name: 'Link to page',
		icon: 'fa-link',
		gen: '[Click here](#p3) to go to page 3\n'
	}, {
		name: 'Table of Contents',
		icon: 'fa-book',
		gen: TableOfContentsGen
	}]
},
/************************* AGE ********************/

{
	groupName: 'AGE',
	icon: 'fa-book',
	snippets: [{
		name: 'Spell',
		icon: 'fa-magic',
		gen: MagicGen.spell
	}, {
		name: 'Spell List',
		icon: 'fa-list',
		gen: MagicGen.spellList
	}, {
		name: 'Class Feature',
		icon: 'fa-trophy',
		gen: ClassFeatureGen
	}, {
		name: 'Note',
		icon: 'fa-sticky-note',
		gen: function gen() {
			return ['> ##### Time to Drop Knowledge', '> Use notes to point out some interesting information. ', '> ', '> **Tables and lists** both work within a note.'].join('\n');
		}
	}, {
		name: 'Descriptive Text Box',
		icon: 'fa-sticky-note-o',
		gen: function gen() {
			return ['<div class=\'descriptive\'>', '##### Time to Drop Knowledge', 'Use notes to point out some interesting information. ', '', '**Tables and lists** both work within a note.', '</div>'].join('\n');
		}
	}, {
		name: 'Monster Stat Block',
		icon: 'fa-bug',
		gen: MonsterBlockGen.half
	}, {
		name: 'Wide Monster Stat Block',
		icon: 'fa-paw',
		gen: MonsterBlockGen.full
	}, {
		name: 'Cover Page',
		icon: 'fa-file-word-o',
		gen: CoverPageGen
	}]
},

/*********************  TABLES *********************/

{
	groupName: 'Tables',
	icon: 'fa-table',
	snippets: [{
		name: 'Class Table',
		icon: 'fa-table',
		gen: ClassTableGen.full
	}, {
		name: 'Half Class Table',
		icon: 'fa-list-alt',
		gen: ClassTableGen.half
	}, {
		name: 'Table',
		icon: 'fa-th-list',
		gen: function gen() {
			return ['##### Cookie Tastiness', '| Tastiness | Cookie Type |', '|:----:|:-------------|', '| -5  | Raisin |', '| 8th  | Chocolate Chip |', '| 11th | 2 or lower |', '| 14th | 3 or lower |', '| 17th | 4 or lower |\n\n'].join('\n');
		}
	}, {
		name: 'Wide Table',
		icon: 'fa-list',
		gen: function gen() {
			return ['<div class=\'wide\'>', '##### Cookie Tastiness', '| Tastiness | Cookie Type |', '|:----:|:-------------|', '| -5  | Raisin |', '| 8th  | Chocolate Chip |', '| 11th | 2 or lower |', '| 14th | 3 or lower |', '| 17th | 4 or lower |', '</div>\n\n'].join('\n');
		}
	}, {
		name: 'Split Table',
		icon: 'fa-th-large',
		gen: function gen() {
			return ['<div style=\'column-count:2\'>', '| d10 | Damage Type |', '|:---:|:------------|', '|  1  | Acid        |', '|  2  | Cold        |', '|  3  | Fire        |', '|  4  | Force       |', '|  5  | Lightning   |', '', '```', '```', '', '| d10 | Damage Type |', '|:---:|:------------|', '|  6  | Necrotic    |', '|  7  | Poison      |', '|  8  | Psychic     |', '|  9  | Radiant     |', '|  10 | Thunder     |', '</div>\n\n'].join('\n');
		}
	}]
},
//Colors
// Bestiary - 13,101,149
// Core Rulebook - 7,88,107
// Blue Rose - 18,123,182
// Titansgrave - 37, 124, 144
// Dragon Age - 128, 5, 14
{
	groupName: 'Colors',
	icon: 'fa-paint-brush',
	snippets: [{
		name: 'Bestiarial',
		icon: 'fa-paw',
		gen: function gen() {
			return ['<style>.age{--footer-bg:rgb(13,101,149)!important}.age h1,h2,h3,h4{color:#0d6595}.age h2{border-bottom-color:#000}.age h3{color:#000!important;border-bottom-color:#176f9f}.age h5{color:#fff;background-color:#0d6595!important;border-bottom-color:#0d6595}.age table tbody tr{background-color:@monsterStatBackground}.age table tbody tr:nth-child(odd){background-color:#dce4ee}.age table+table tbody tr:nth-child(odd){background-color:@monsterStatBackground}.age blockquote,.age hr+blockquote,.age table+table tbody tr:nth-child(even){background-color:#dce4ee}.age h5+ul{color:#0d6595}.age h5+ul li{color:#0d6595!important}// monster .age hr+blockquote hr+h5{background-color:#0d6595;color:#fff}.age hr+blockquote hr+ul,.age hr+blockquote table ul li string,.age hr+blockquote ul strong{color:#0d6595}.age .footnote,.age .pageNumber{color:#fff}.age .descriptive{color:#dce4ee}.age .toc ul li h3 a{color:#0d6595!important}</style>'].join('\n');
		}
	}, {
		name: 'Companionesque',
		icon: 'fa-users',
		gen: function gen() {
			return ['<style>.age{--footer-bg:rgb(196,63,49)!important}.age h1,h2,h3,h4{color:#c43f31!important}.age h2{border-bottom-color:#000}.age h3{color:#000!important;border-bottom-color:#ba3531}.age h5{color:#fff;background-color:#c43f31;border-bottom-color:#c43f31}.age table tbody tr{background-color:#fff}.age table tbody tr:nth-child(odd){background-color:#f2cfbb}.age table+table tbody tr:nth-child(odd){background-color:#fff}.age blockquote,.age table+table tbody tr:nth-child(even){background-color:#f2cfbb}.age h5+ul,.age h5+ul li{color:#c43f31}.age hr+blockquote{background-color:#fff}.age hr+blockquote hr+h5{background-color:#c43f31;color:#fff}.age hr+blockquote hr+ul,.age hr+blockquote table ul li string,.age hr+blockquote ul strong{color:#c43f31}.age .footnote,.age .pageNumber{color:#fff}.age .descriptive{color:#f2cfbb}.age .toc ul li h3 a{color:#c43f31!important}</style>'].join('\n');
		}
	}, {
		name: 'Roselike',
		icon: 'fa-leaf',
		gen: function gen() {
			return ['<style>.age{--footer-bg:rgb(18,123,182)!important}.age h1,h2,h3,h4{color:#127bb6}.age h2{color:#1c85c0;border-bottom-color:#000}.age h3{color:#000!important;border-bottom-color:#1c85c0}.age h5{color:#fff;background-color:#127bb6!important;border-bottom-color:#127bb6}.age table tbody tr{background-color:@monsterStatBackground}.age table tbody tr:nth-child(odd){background-color:#dde7f3}.age table+table tbody tr:nth-child(odd){background-color:#fff}.age table+table tbody tr:nth-child(even){background-color:#dde7f3}.age h5+ul,.age h5+ul li{color:#127bb6}.age blockquote{background-color:#dde7f3!important}.age h5+blockquote,.age hr+blockquote{background-color:#e6e7e8!important}.age hr+blockquote hr+h5{background-color:#127bb6;color:#fff}.age hr+blockquote hr+ul,.age hr+blockquote table ul li string,.age hr+blockquote ul strong{color:#127bb6}.age .footnote,.age .pageNumber{color:#fff}.age .descriptive{color:#dde7f3}.age .toc ul li h3 a{color:#127bb6!important}</style>'].join('\n');
		}
	}]

},

/**************** PRINT *************/

{
	groupName: 'Print',
	icon: 'fa-print',
	snippets: [{
		name: 'A4 PageSize',
		icon: 'fa-file-o',
		gen: ['<style>', '  .age{', '    width : 210mm;', '    height : 296.8mm;', '  }', '</style>'].join('\n')
	}, {
		name: 'Ink Friendly',
		icon: 'fa-tint',
		gen: ['<style>', '  .age{ background : white;}', '  .age img{ display : none;}', '  .age hr+blockquote{background : white;}', '</style>', ''].join('\n')
	}]
}];

},{"./classfeature.gen.js":7,"./classtable.gen.js":8,"./coverpage.gen.js":9,"./magic.gen.js":10,"./monsterblock.gen.js":11,"./tableOfContents.gen.js":13}],13:[function(require,module,exports){
'use strict';

var _ = require('lodash');

var getTOC = function getTOC(pages) {
	var add1 = function add1(title, page) {
		res.push({
			title: title,
			page: page + 1,
			children: []
		});
	};
	var add2 = function add2(title, page) {
		if (!_.last(res)) add1('', page);
		_.last(res).children.push({
			title: title,
			page: page + 1,
			children: []
		});
	};
	var add3 = function add3(title, page) {
		if (!_.last(res)) add1('', page);
		if (!_.last(_.last(res).children)) add2('', page);
		_.last(_.last(res).children).children.push({
			title: title,
			page: page + 1,
			children: []
		});
	};

	var res = [];
	_.each(pages, function (page, pageNum) {
		var lines = page.split('\n');
		_.each(lines, function (line) {
			if (_.startsWith(line, '# ')) {
				var title = line.replace('# ', '');
				add1(title, pageNum);
			}
			if (_.startsWith(line, '## ')) {
				var _title = line.replace('## ', '');
				add2(_title, pageNum);
			}
			if (_.startsWith(line, '### ')) {
				var _title2 = line.replace('### ', '');
				add3(_title2, pageNum);
			}
		});
	});
	return res;
};

module.exports = function (brew) {
	var pages = brew.split('\\page');
	var TOC = getTOC(pages);
	var markdown = _.reduce(TOC, function (r, g1, idx1) {
		if (g1.title) r.push('- ### [<span>' + g1.page + '</span> <span>' + g1.title + '</span>](#p' + g1.page + ')');
		if (g1.children.length) {
			_.each(g1.children, function (g2, idx2) {
				if (g2.title) r.push('- #### **[<span>' + g2.page + '</span> <span>' + g2.title + '</span>](#p' + g2.page + ')**');
				if (g2.children.length) {
					_.each(g2.children, function (g3, idx3) {
						if (g3.title) r.push('  - [<span>' + g3.page + '</span> <span>' + g3.title + '</span>](#p' + g3.page + ')');
					});
				}
			});
		}
		return r;
	}, []).join('\n');

	return '<div class=\'toc\'>\n##### Table Of Contents\n' + markdown + '\n</div>\n';
};

},{"lodash":"lodash"}],"/Users/LimpingNinja/Projects/age-homebrewery/client/homebrew/homebrew.jsx":[function(require,module,exports){
(function (global){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var CreateRouter = require('pico-router').createRouter;

var HomePage = require('./pages/homePage/homePage.jsx');
var EditPage = require('./pages/editPage/editPage.jsx');
var UserPage = require('./pages/userPage/userPage.jsx');
var SharePage = require('./pages/sharePage/sharePage.jsx');
var NewPage = require('./pages/newPage/newPage.jsx');
var ErrorPage = require('./pages/errorPage/errorPage.jsx');
var PrintPage = require('./pages/printPage/printPage.jsx');

var Router = void 0;
var Homebrew = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			url: '',
			welcomeText: '',
			changelog: '',
			version: '0.0.0',
			account: null,
			brew: {
				title: '',
				text: '',
				shareId: null,
				editId: null,
				createdAt: null,
				updatedAt: null
			}
		};
	},
	componentWillMount: function componentWillMount() {
		var _this = this;

		global.account = this.props.account;
		global.version = this.props.version;

		Router = CreateRouter({
			'/edit/:id': function editId(args) {
				if (!_this.props.brew.editId) {
					return React.createElement(ErrorPage, { errorId: args.id });
				}

				return React.createElement(EditPage, {
					id: args.id,
					brew: _this.props.brew });
			},

			'/share/:id': function shareId(args) {
				if (!_this.props.brew.shareId) {
					return React.createElement(ErrorPage, { errorId: args.id });
				}

				return React.createElement(SharePage, {
					id: args.id,
					brew: _this.props.brew });
			},
			'/user/:username': function userUsername(args) {
				return React.createElement(UserPage, {
					username: args.username,
					brews: _this.props.brews
				});
			},
			'/print/:id': function printId(args, query) {
				return React.createElement(PrintPage, { brew: _this.props.brew, query: query });
			},
			'/print': function print(args, query) {
				return React.createElement(PrintPage, { query: query });
			},
			'/new': function _new(args) {
				return React.createElement(NewPage, null);
			},
			'/changelog': function changelog(args) {
				return React.createElement(SharePage, {
					brew: { title: 'Changelog', text: _this.props.changelog } });
			},
			'*': React.createElement(HomePage, {
				welcomeText: this.props.welcomeText })
		});
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'homebrew' },
			React.createElement(Router, { defaultUrl: this.props.url })
		);
	}
});

module.exports = Homebrew;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./pages/editPage/editPage.jsx":20,"./pages/errorPage/errorPage.jsx":21,"./pages/homePage/homePage.jsx":22,"./pages/newPage/newPage.jsx":23,"./pages/printPage/printPage.jsx":24,"./pages/sharePage/sharePage.jsx":25,"./pages/userPage/userPage.jsx":27,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","pico-router":"pico-router","react":"react"}],14:[function(require,module,exports){
(function (global){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var Nav = require('naturalcrit/nav/nav.jsx');

module.exports = function (props) {
	if (global.account) {
		return React.createElement(
			Nav.item,
			{ href: '/user/' + global.account.username, color: 'yellow', icon: 'fa-user' },
			global.account.username
		);
	}
	var url = '';
	if (typeof window !== 'undefined') {
		url = window.location.href;
	}
	return React.createElement(
		Nav.item,
		{ href: 'http://unused/login?redirect=' + url, color: 'teal', icon: 'fa-sign-in' },
		'login'
	);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"create-react-class":"create-react-class","naturalcrit/nav/nav.jsx":31,"react":"react"}],15:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var Nav = require('naturalcrit/nav/nav.jsx');

module.exports = function (props) {
	return React.createElement(
		Nav.item,
		{
			newTab: true,
			color: 'red',
			icon: 'fa-bug',
			href: 'https://www.reddit.com/r/homebrewery/submit?selftext=true&title=' + encodeURIComponent('[Issue] Describe Your Issue Here') },
		'report issue'
	);
};

},{"create-react-class":"create-react-class","naturalcrit/nav/nav.jsx":31,"react":"react"}],16:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');

var Nav = require('naturalcrit/nav/nav.jsx');

var Navbar = createClass({
	getInitialState: function getInitialState() {
		return {
			//showNonChromeWarning : false,
			ver: '0.0.0'
		};
	},

	componentDidMount: function componentDidMount() {
		//const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
		this.setState({
			//showNonChromeWarning : !isChrome,
			ver: window.version
		});
	},

	/*
 renderChromeWarning : function(){
 	if(!this.state.showNonChromeWarning) return;
 	return <Nav.item className='warning' icon='fa-exclamation-triangle'>
 		Optimized for Chrome
 		<div className='dropdown'>
 			If you are experiencing rendering issues, use Chrome instead
 		</div>
 	</Nav.item>
 },
 */
	render: function render() {
		return React.createElement(
			Nav.base,
			null,
			React.createElement(
				Nav.section,
				null,
				React.createElement(Nav.logo, null),
				React.createElement(
					Nav.item,
					{ href: '/', className: 'homebrewLogo' },
					React.createElement(
						'div',
						null,
						'AGE Homebrewery'
					)
				),
				React.createElement(
					Nav.item,
					null,
					'v' + this.state.ver
				)
			),
			this.props.children
		);
	}
});

module.exports = Navbar;

},{"create-react-class":"create-react-class","lodash":"lodash","naturalcrit/nav/nav.jsx":31,"react":"react"}],17:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var Nav = require('naturalcrit/nav/nav.jsx');

module.exports = function (props) {
	return React.createElement(
		Nav.item,
		{
			className: 'patreon',
			newTab: true,
			href: 'https://www.patreon.com/stolksdorf',
			color: 'green',
			icon: 'fa-heart' },
		'help out'
	);
};

},{"create-react-class":"create-react-class","naturalcrit/nav/nav.jsx":31,"react":"react"}],18:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var Nav = require('naturalcrit/nav/nav.jsx');

module.exports = function (props) {
	return React.createElement(
		Nav.item,
		{ newTab: true, href: '/print/' + props.shareId + '?dialog=true', color: 'purple', icon: 'fa-file-pdf-o' },
		'get PDF'
	);
};

},{"create-react-class":"create-react-class","naturalcrit/nav/nav.jsx":31,"react":"react"}],19:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var Moment = require('moment');

var Nav = require('naturalcrit/nav/nav.jsx');

var EDIT_KEY = 'homebrewery-recently-edited';
var VIEW_KEY = 'homebrewery-recently-viewed';

var RecentItems = createClass({

	getDefaultProps: function getDefaultProps() {
		return {
			storageKey: '',
			showEdit: false,
			showView: false
		};
	},

	getInitialState: function getInitialState() {
		return {
			showDropdown: false,
			edit: [],
			view: []
		};
	},

	componentDidMount: function componentDidMount() {
		var _this = this;

		//== Load recent items list ==//
		var edited = JSON.parse(localStorage.getItem(EDIT_KEY) || '[]');
		var viewed = JSON.parse(localStorage.getItem(VIEW_KEY) || '[]');

		//== Add current brew to appropriate recent items list (depending on storageKey) ==//
		if (this.props.storageKey == 'edit') {
			edited = _.filter(edited, function (brew) {
				return brew.id !== _this.props.brew.editId;
			});
			edited.unshift({
				id: this.props.brew.editId,
				title: this.props.brew.title,
				url: '/edit/' + this.props.brew.editId,
				ts: Date.now()
			});
		}
		if (this.props.storageKey == 'view') {
			viewed = _.filter(viewed, function (brew) {
				return brew.id !== _this.props.brew.shareId;
			});
			viewed.unshift({
				id: this.props.brew.shareId,
				title: this.props.brew.title,
				url: '/share/' + this.props.brew.shareId,
				ts: Date.now()
			});
		}

		//== Store the updated lists (up to 8 items each) ==//
		edited = _.slice(edited, 0, 8);
		viewed = _.slice(viewed, 0, 8);

		localStorage.setItem(EDIT_KEY, JSON.stringify(edited));
		localStorage.setItem(VIEW_KEY, JSON.stringify(viewed));

		this.setState({
			edit: edited,
			view: viewed
		});
	},

	handleDropdown: function handleDropdown(show) {
		this.setState({
			showDropdown: show
		});
	},

	renderDropdown: function renderDropdown() {
		if (!this.state.showDropdown) return null;

		var makeItems = function makeItems(brews) {
			return _.map(brews, function (brew) {
				return React.createElement(
					'a',
					{ href: brew.url, className: 'item', key: brew.id, target: '_blank', rel: 'noopener noreferrer' },
					React.createElement(
						'span',
						{ className: 'title' },
						brew.title || '[ no title ]'
					),
					React.createElement(
						'span',
						{ className: 'time' },
						Moment(brew.ts).fromNow()
					)
				);
			});
		};

		return React.createElement(
			'div',
			{ className: 'dropdown' },
			this.props.showEdit && this.props.showView ? React.createElement(
				'h4',
				null,
				'edited'
			) : null,
			this.props.showEdit ? makeItems(this.state.edit) : null,
			this.props.showEdit && this.props.showView ? React.createElement(
				'h4',
				null,
				'viewed'
			) : null,
			this.props.showView ? makeItems(this.state.view) : null
		);
	},

	render: function render() {
		var _this2 = this;

		return React.createElement(
			Nav.item,
			{ icon: 'fa-clock-o', color: 'grey', className: 'recent',
				onMouseEnter: function onMouseEnter() {
					return _this2.handleDropdown(true);
				},
				onMouseLeave: function onMouseLeave() {
					return _this2.handleDropdown(false);
				} },
			this.props.text,
			this.renderDropdown()
		);
	}

});

module.exports = {

	edited: function edited(props) {
		return React.createElement(RecentItems, {
			brew: props.brew,
			storageKey: props.storageKey,
			text: 'recently edited',
			showEdit: true
		});
	},

	viewed: function viewed(props) {
		return React.createElement(RecentItems, {
			brew: props.brew,
			storageKey: props.storageKey,
			text: 'recently viewed',
			showView: true
		});
	},

	both: function both(props) {
		return React.createElement(RecentItems, {
			brew: props.brew,
			storageKey: props.storageKey,
			text: 'recent brews',
			showEdit: true,
			showView: true
		});
	}
};

},{"create-react-class":"create-react-class","lodash":"lodash","moment":"moment","naturalcrit/nav/nav.jsx":31,"react":"react"}],20:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');
var request = require('superagent');

var Nav = require('naturalcrit/nav/nav.jsx');
var Navbar = require('../../navbar/navbar.jsx');

var ReportIssue = require('../../navbar/issue.navitem.jsx');
var PrintLink = require('../../navbar/print.navitem.jsx');
var Account = require('../../navbar/account.navitem.jsx');
var RecentNavItem = require('../../navbar/recent.navitem.jsx').both;

var SplitPane = require('naturalcrit/splitPane/splitPane.jsx');
var Editor = require('../../editor/editor.jsx');
var BrewRenderer = require('../../brewRenderer/brewRenderer.jsx');

var Markdown = require('naturalcrit/markdown.js');

var SAVE_TIMEOUT = 3000;

var EditPage = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			brew: {
				text: '',
				shareId: null,
				editId: null,
				createdAt: null,
				updatedAt: null,

				title: '',
				description: '',
				tags: '',
				published: false,
				authors: [],
				systems: []
			}
		};
	},

	getInitialState: function getInitialState() {
		return {
			brew: this.props.brew,

			isSaving: false,
			isPending: false,
			errors: null,
			htmlErrors: Markdown.validate(this.props.brew.text)
		};
	},
	savedBrew: null,

	componentDidMount: function componentDidMount() {
		var _this = this;

		this.trySave();
		window.onbeforeunload = function () {
			if (_this.state.isSaving || _this.state.isPending) {
				return 'You have unsaved changes!';
			}
		};

		this.setState(function (prevState) {
			return {
				htmlErrors: Markdown.validate(prevState.brew.text)
			};
		});

		document.addEventListener('keydown', this.handleControlKeys);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.onbeforeunload = function () {};
		document.removeEventListener('keydown', this.handleControlKeys);
	},

	handleControlKeys: function handleControlKeys(e) {
		if (!(e.ctrlKey || e.metaKey)) return;
		var S_KEY = 83;
		var P_KEY = 80;
		if (e.keyCode == S_KEY) this.save();
		if (e.keyCode == P_KEY) window.open('/print/' + this.props.brew.shareId + '?dialog=true', '_blank').focus();
		if (e.keyCode == P_KEY || e.keyCode == S_KEY) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	handleSplitMove: function handleSplitMove() {
		this.refs.editor.update();
	},

	handleMetadataChange: function handleMetadataChange(metadata) {
		var _this2 = this;

		this.setState(function (prevState) {
			return {
				brew: _.merge({}, prevState.brew, metadata),
				isPending: true
			};
		}, function () {
			return _this2.trySave();
		});
	},

	handleTextChange: function handleTextChange(text) {
		var _this3 = this;

		//If there are errors, run the validator on everychange to give quick feedback
		var htmlErrors = this.state.htmlErrors;
		if (htmlErrors.length) htmlErrors = Markdown.validate(text);

		this.setState(function (prevState) {
			return {
				brew: _.merge({}, prevState.brew, { text: text }),
				isPending: true,
				htmlErrors: htmlErrors
			};
		}, function () {
			return _this3.trySave();
		});
	},

	hasChanges: function hasChanges() {
		var savedBrew = this.savedBrew ? this.savedBrew : this.props.brew;
		return !_.isEqual(this.state.brew, savedBrew);
	},

	trySave: function trySave() {
		if (!this.debounceSave) this.debounceSave = _.debounce(this.save, SAVE_TIMEOUT);
		if (this.hasChanges()) {
			this.debounceSave();
		} else {
			this.debounceSave.cancel();
		}
	},

	save: function save() {
		var _this4 = this;

		if (this.debounceSave && this.debounceSave.cancel) this.debounceSave.cancel();

		this.setState(function (prevState) {
			return {
				isSaving: true,
				errors: null,
				htmlErrors: Markdown.validate(prevState.brew.text)
			};
		});

		request.put('/api/update/' + this.props.brew.editId).send(this.state.brew).end(function (err, res) {
			if (err) {
				_this4.setState({
					errors: err
				});
			} else {
				_this4.savedBrew = res.body;
				_this4.setState({
					isPending: false,
					isSaving: false
				});
			}
		});
	},

	renderSaveButton: function renderSaveButton() {
		if (this.state.errors) {
			var errMsg = '';
			try {
				errMsg += this.state.errors.toString() + '\n\n';
				errMsg += '```\n' + JSON.stringify(this.state.errors.response.error, null, '  ') + '\n```';
			} catch (e) {}

			return React.createElement(
				Nav.item,
				{ className: 'save error', icon: 'fa-warning' },
				'Oops!',
				React.createElement(
					'div',
					{ className: 'errorContainer' },
					'Looks like there was a problem saving. ',
					React.createElement('br', null),
					'Report the issue ',
					React.createElement(
						'a',
						{ target: '_blank', rel: 'noopener noreferrer',
							href: 'https://github.com/stolksdorf/naturalcrit/issues/new?body=' + encodeURIComponent(errMsg) },
						'here'
					),
					'.'
				)
			);
		}

		if (this.state.isSaving) {
			return React.createElement(
				Nav.item,
				{ className: 'save', icon: 'fa-spinner fa-spin' },
				'saving...'
			);
		}
		if (this.state.isPending && this.hasChanges()) {
			return React.createElement(
				Nav.item,
				{ className: 'save', onClick: this.save, color: 'blue', icon: 'fa-save' },
				'Save Now'
			);
		}
		if (!this.state.isPending && !this.state.isSaving) {
			return React.createElement(
				Nav.item,
				{ className: 'save saved' },
				'saved.'
			);
		}
	},
	renderNavbar: function renderNavbar() {
		return React.createElement(
			Navbar,
			null,
			React.createElement(
				Nav.section,
				null,
				React.createElement(
					Nav.item,
					{ className: 'brewTitle' },
					this.state.brew.title
				)
			),
			React.createElement(
				Nav.section,
				null,
				this.renderSaveButton(),
				React.createElement(ReportIssue, null),
				React.createElement(
					Nav.item,
					{ newTab: true, href: '/share/' + this.props.brew.shareId, color: 'teal', icon: 'fa-share-alt' },
					'Share'
				),
				React.createElement(PrintLink, { shareId: this.props.brew.shareId }),
				React.createElement(RecentNavItem, { brew: this.props.brew, storageKey: 'edit' }),
				React.createElement(Account, null)
			)
		);
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'editPage page' },
			this.renderNavbar(),
			React.createElement(
				'div',
				{ className: 'content' },
				React.createElement(
					SplitPane,
					{ onDragFinish: this.handleSplitMove, ref: 'pane' },
					React.createElement(Editor, {
						ref: 'editor',
						value: this.state.brew.text,
						onChange: this.handleTextChange,
						metadata: this.state.brew,
						onMetadataChange: this.handleMetadataChange
					}),
					React.createElement(BrewRenderer, { text: this.state.brew.text, errors: this.state.htmlErrors })
				)
			)
		);
	}
});

module.exports = EditPage;

},{"../../brewRenderer/brewRenderer.jsx":1,"../../editor/editor.jsx":4,"../../navbar/account.navitem.jsx":14,"../../navbar/issue.navitem.jsx":15,"../../navbar/navbar.jsx":16,"../../navbar/print.navitem.jsx":18,"../../navbar/recent.navitem.jsx":19,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/markdown.js":30,"naturalcrit/nav/nav.jsx":31,"naturalcrit/splitPane/splitPane.jsx":32,"react":"react","superagent":"superagent"}],21:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var Nav = require('naturalcrit/nav/nav.jsx');
var Navbar = require('../../navbar/navbar.jsx');
var PatreonNavItem = require('../../navbar/patreon.navitem.jsx');
var IssueNavItem = require('../../navbar/issue.navitem.jsx');
var RecentNavItem = require('../../navbar/recent.navitem.jsx').both;

var BrewRenderer = require('../../brewRenderer/brewRenderer.jsx');

var ErrorPage = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			ver: '0.0.0',
			errorId: ''
		};
	},

	text: '# Oops \n We could not find a brew with that id. **Sorry!**',

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'errorPage page' },
			React.createElement(
				Navbar,
				{ ver: this.props.ver },
				React.createElement(
					Nav.section,
					null,
					React.createElement(
						Nav.item,
						{ className: 'errorTitle' },
						'Crit Fail!'
					)
				),
				React.createElement(
					Nav.section,
					null,
					React.createElement(PatreonNavItem, null),
					React.createElement(IssueNavItem, null),
					React.createElement(RecentNavItem, null)
				)
			),
			React.createElement(
				'div',
				{ className: 'content' },
				React.createElement(BrewRenderer, { text: this.text })
			)
		);
	}
});

module.exports = ErrorPage;

},{"../../brewRenderer/brewRenderer.jsx":1,"../../navbar/issue.navitem.jsx":15,"../../navbar/navbar.jsx":16,"../../navbar/patreon.navitem.jsx":17,"../../navbar/recent.navitem.jsx":19,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/nav/nav.jsx":31,"react":"react"}],22:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');
var request = require('superagent');

var Nav = require('naturalcrit/nav/nav.jsx');
var Navbar = require('../../navbar/navbar.jsx');
var PatreonNavItem = require('../../navbar/patreon.navitem.jsx');
var IssueNavItem = require('../../navbar/issue.navitem.jsx');
var RecentNavItem = require('../../navbar/recent.navitem.jsx').both;
var AccountNavItem = require('../../navbar/account.navitem.jsx');

var SplitPane = require('naturalcrit/splitPane/splitPane.jsx');
var Editor = require('../../editor/editor.jsx');
var BrewRenderer = require('../../brewRenderer/brewRenderer.jsx');

var HomePage = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			welcomeText: '',
			ver: '0.0.0'
		};
	},
	getInitialState: function getInitialState() {
		return {
			text: this.props.welcomeText
		};
	},
	handleSave: function handleSave() {
		request.post('/api').send({
			text: this.state.text
		}).end(function (err, res) {
			if (err) return err;
			var brew = res.body;
			window.location = '/edit/' + brew.editId;
		});
	},
	handleSplitMove: function handleSplitMove() {
		this.refs.editor.update();
	},
	handleTextChange: function handleTextChange(text) {
		this.setState({
			text: text
		});
	},
	renderNavbar: function renderNavbar() {
		return React.createElement(
			Navbar,
			{ ver: this.props.ver },
			React.createElement(
				Nav.section,
				null,
				React.createElement(PatreonNavItem, null),
				React.createElement(IssueNavItem, null),
				React.createElement(
					Nav.item,
					{ newTab: true, href: '/changelog', color: 'purple', icon: 'fa-file-text-o' },
					'Changelog'
				),
				React.createElement(RecentNavItem, null),
				React.createElement(AccountNavItem, null)
			)
		);
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'homePage page' },
			this.renderNavbar(),
			React.createElement(
				'div',
				{ className: 'content' },
				React.createElement(
					SplitPane,
					{ onDragFinish: this.handleSplitMove, ref: 'pane' },
					React.createElement(Editor, { value: this.state.text, onChange: this.handleTextChange, ref: 'editor' }),
					React.createElement(BrewRenderer, { text: this.state.text })
				)
			),
			React.createElement(
				'div',
				{ className: cx('floatingSaveButton', { show: this.props.welcomeText != this.state.text }), onClick: this.handleSave },
				'Save current ',
				React.createElement('i', { className: 'fa fa-save' })
			),
			React.createElement(
				'a',
				{ href: '/new', className: 'floatingNewButton' },
				'Create your own ',
				React.createElement('i', { className: 'fa fa-magic' })
			)
		);
	}
});

module.exports = HomePage;

},{"../../brewRenderer/brewRenderer.jsx":1,"../../editor/editor.jsx":4,"../../navbar/account.navitem.jsx":14,"../../navbar/issue.navitem.jsx":15,"../../navbar/navbar.jsx":16,"../../navbar/patreon.navitem.jsx":17,"../../navbar/recent.navitem.jsx":19,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/nav/nav.jsx":31,"naturalcrit/splitPane/splitPane.jsx":32,"react":"react","superagent":"superagent"}],23:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');
var request = require('superagent');

var Markdown = require('naturalcrit/markdown.js');

var Nav = require('naturalcrit/nav/nav.jsx');
var Navbar = require('../../navbar/navbar.jsx');
var AccountNavItem = require('../../navbar/account.navitem.jsx');
var RecentNavItem = require('../../navbar/recent.navitem.jsx').both;
var IssueNavItem = require('../../navbar/issue.navitem.jsx');

var SplitPane = require('naturalcrit/splitPane/splitPane.jsx');
var Editor = require('../../editor/editor.jsx');
var BrewRenderer = require('../../brewRenderer/brewRenderer.jsx');

var KEY = 'homebrewery-new';

var NewPage = createClass({
	getInitialState: function getInitialState() {
		return {
			metadata: {
				title: '',
				description: '',
				tags: '',
				published: false,
				authors: [],
				systems: []
			},

			text: '',
			isSaving: false,
			errors: []
		};
	},
	componentDidMount: function componentDidMount() {
		var storage = localStorage.getItem(KEY);
		if (storage) {
			this.setState({
				text: storage
			});
		}
		document.addEventListener('keydown', this.handleControlKeys);
	},
	componentWillUnmount: function componentWillUnmount() {
		document.removeEventListener('keydown', this.handleControlKeys);
	},

	handleControlKeys: function handleControlKeys(e) {
		if (!(e.ctrlKey || e.metaKey)) return;
		var S_KEY = 83;
		var P_KEY = 80;
		if (e.keyCode == S_KEY) this.save();
		if (e.keyCode == P_KEY) this.print();
		if (e.keyCode == P_KEY || e.keyCode == S_KEY) {
			e.stopPropagation();
			e.preventDefault();
		}
	},

	handleSplitMove: function handleSplitMove() {
		this.refs.editor.update();
	},

	handleMetadataChange: function handleMetadataChange(metadata) {
		this.setState({
			metadata: _.merge({}, this.state.metadata, metadata)
		});
	},

	handleTextChange: function handleTextChange(text) {
		this.setState({
			text: text,
			errors: Markdown.validate(text)
		});
		localStorage.setItem(KEY, text);
	},

	save: function save() {
		var _this = this;

		this.setState({
			isSaving: true
		});

		request.post('/api').send(_.merge({}, this.state.metadata, {
			text: this.state.text
		})).end(function (err, res) {
			if (err) {
				_this.setState({
					isSaving: false
				});
				return;
			}
			window.onbeforeunload = function () {};
			var brew = res.body;
			localStorage.removeItem(KEY);
			window.location = '/edit/' + brew.editId;
		});
	},

	renderSaveButton: function renderSaveButton() {
		if (this.state.isSaving) {
			return React.createElement(
				Nav.item,
				{ icon: 'fa-spinner fa-spin', className: 'saveButton' },
				'save...'
			);
		} else {
			return React.createElement(
				Nav.item,
				{ icon: 'fa-save', className: 'saveButton', onClick: this.save },
				'save'
			);
		}
	},

	print: function print() {
		localStorage.setItem('print', this.state.text);
		window.open('/print?dialog=true&local=print', '_blank');
	},

	renderLocalPrintButton: function renderLocalPrintButton() {
		return React.createElement(
			Nav.item,
			{ color: 'purple', icon: 'fa-file-pdf-o', onClick: this.print },
			'get PDF'
		);
	},

	renderNavbar: function renderNavbar() {
		return React.createElement(
			Navbar,
			null,
			React.createElement(
				Nav.section,
				null,
				React.createElement(
					Nav.item,
					{ className: 'brewTitle' },
					this.state.metadata.title
				)
			),
			React.createElement(
				Nav.section,
				null,
				this.renderSaveButton(),
				this.renderLocalPrintButton(),
				React.createElement(IssueNavItem, null),
				React.createElement(RecentNavItem, null),
				React.createElement(AccountNavItem, null)
			)
		);
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'newPage page' },
			this.renderNavbar(),
			React.createElement(
				'div',
				{ className: 'content' },
				React.createElement(
					SplitPane,
					{ onDragFinish: this.handleSplitMove, ref: 'pane' },
					React.createElement(Editor, {
						ref: 'editor',
						value: this.state.text,
						onChange: this.handleTextChange,
						metadata: this.state.metadata,
						onMetadataChange: this.handleMetadataChange
					}),
					React.createElement(BrewRenderer, { text: this.state.text, errors: this.state.errors })
				)
			)
		);
	}
});

module.exports = NewPage;

},{"../../brewRenderer/brewRenderer.jsx":1,"../../editor/editor.jsx":4,"../../navbar/account.navitem.jsx":14,"../../navbar/issue.navitem.jsx":15,"../../navbar/navbar.jsx":16,"../../navbar/recent.navitem.jsx":19,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/markdown.js":30,"naturalcrit/nav/nav.jsx":31,"naturalcrit/splitPane/splitPane.jsx":32,"react":"react","superagent":"superagent"}],24:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');
var Markdown = require('naturalcrit/markdown.js');

var PrintPage = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			query: {},
			brew: {
				text: ''
			}
		};
	},

	getInitialState: function getInitialState() {
		return {
			brewText: this.props.brew.text
		};
	},

	componentDidMount: function componentDidMount() {
		if (this.props.query.local) {
			this.setState(function (prevState, prevProps) {
				return {
					brewText: localStorage.getItem(prevProps.query.local)
				};
			});
		}

		if (this.props.query.dialog) window.print();
	},

	renderPages: function renderPages() {
		return _.map(this.state.brewText.split('\\page'), function (page, index) {
			return React.createElement('div', {
				className: 'age',
				id: 'p' + (index + 1),
				dangerouslySetInnerHTML: { __html: Markdown.render(page) },
				key: index });
		});
	},

	render: function render() {
		return React.createElement(
			'div',
			null,
			this.renderPages()
		);
	}
});

module.exports = PrintPage;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/markdown.js":30,"react":"react"}],25:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var Nav = require('naturalcrit/nav/nav.jsx');
var Navbar = require('../../navbar/navbar.jsx');
var PrintLink = require('../../navbar/print.navitem.jsx');
var ReportIssue = require('../../navbar/issue.navitem.jsx');
var RecentNavItem = require('../../navbar/recent.navitem.jsx').both;
var Account = require('../../navbar/account.navitem.jsx');

var BrewRenderer = require('../../brewRenderer/brewRenderer.jsx');

var SharePage = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			brew: {
				title: '',
				text: '',
				shareId: null,
				createdAt: null,
				updatedAt: null,
				views: 0
			}
		};
	},

	componentDidMount: function componentDidMount() {
		document.addEventListener('keydown', this.handleControlKeys);
	},
	componentWillUnmount: function componentWillUnmount() {
		document.removeEventListener('keydown', this.handleControlKeys);
	},
	handleControlKeys: function handleControlKeys(e) {
		if (!(e.ctrlKey || e.metaKey)) return;
		var P_KEY = 80;
		if (e.keyCode == P_KEY) {
			window.open('/print/' + this.props.brew.shareId + '?dialog=true', '_blank').focus();
			e.stopPropagation();
			e.preventDefault();
		}
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'sharePage page' },
			React.createElement(
				Navbar,
				null,
				React.createElement(
					Nav.section,
					null,
					React.createElement(
						Nav.item,
						{ className: 'brewTitle' },
						this.props.brew.title
					)
				),
				React.createElement(
					Nav.section,
					null,
					React.createElement(ReportIssue, null),
					React.createElement(PrintLink, { shareId: this.props.brew.shareId }),
					React.createElement(
						Nav.item,
						{ href: '/source/' + this.props.brew.shareId, color: 'teal', icon: 'fa-code' },
						'source'
					),
					React.createElement(RecentNavItem, { brew: this.props.brew, storageKey: 'view' }),
					React.createElement(Account, null)
				)
			),
			React.createElement(
				'div',
				{ className: 'content' },
				React.createElement(BrewRenderer, { text: this.props.brew.text })
			)
		);
	}
});

module.exports = SharePage;

},{"../../brewRenderer/brewRenderer.jsx":1,"../../navbar/account.navitem.jsx":14,"../../navbar/issue.navitem.jsx":15,"../../navbar/navbar.jsx":16,"../../navbar/print.navitem.jsx":18,"../../navbar/recent.navitem.jsx":19,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/nav/nav.jsx":31,"react":"react"}],26:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');
var moment = require('moment');
var request = require('superagent');

var BrewItem = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			brew: {
				title: '',
				description: '',

				authors: []
			}
		};
	},

	deleteBrew: function deleteBrew() {
		if (!confirm('are you sure you want to delete this brew?')) return;
		if (!confirm('are you REALLY sure? You will not be able to recover it')) return;

		request.get('/api/remove/' + this.props.brew.editId).send().end(function (err, res) {
			location.reload();
		});
	},

	renderDeleteBrewLink: function renderDeleteBrewLink() {
		if (!this.props.brew.editId) return;

		return React.createElement(
			'a',
			{ onClick: this.deleteBrew },
			React.createElement('i', { className: 'fa fa-trash' })
		);
	},
	renderEditLink: function renderEditLink() {
		if (!this.props.brew.editId) return;

		return React.createElement(
			'a',
			{ href: '/edit/' + this.props.brew.editId, target: '_blank', rel: 'noopener noreferrer' },
			React.createElement('i', { className: 'fa fa-pencil' })
		);
	},

	render: function render() {
		var brew = this.props.brew;
		return React.createElement(
			'div',
			{ className: 'brewItem' },
			React.createElement(
				'h2',
				null,
				brew.title
			),
			React.createElement(
				'p',
				{ className: 'description' },
				brew.description
			),
			React.createElement('hr', null),
			React.createElement(
				'div',
				{ className: 'info' },
				React.createElement(
					'span',
					null,
					React.createElement('i', { className: 'fa fa-user' }),
					' ',
					brew.authors.join(', ')
				),
				React.createElement(
					'span',
					null,
					React.createElement('i', { className: 'fa fa-eye' }),
					' ',
					brew.views
				),
				React.createElement(
					'span',
					null,
					React.createElement('i', { className: 'fa fa-refresh' }),
					' ',
					moment(brew.updatedAt).fromNow()
				)
			),
			React.createElement(
				'div',
				{ className: 'links' },
				React.createElement(
					'a',
					{ href: '/share/' + brew.shareId, target: '_blank', rel: 'noopener noreferrer' },
					React.createElement('i', { className: 'fa fa-share-alt' })
				),
				this.renderEditLink(),
				this.renderDeleteBrewLink()
			)
		);
	}
});

module.exports = BrewItem;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","moment":"moment","react":"react","superagent":"superagent"}],27:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var Nav = require('naturalcrit/nav/nav.jsx');
var Navbar = require('../../navbar/navbar.jsx');

var RecentNavItem = require('../../navbar/recent.navitem.jsx').both;
var Account = require('../../navbar/account.navitem.jsx');
var BrewItem = require('./brewItem/brewItem.jsx');

// const brew = {
// 	title   : 'SUPER Long title woah now',
// 	authors : []
// };

//const BREWS = _.times(25, ()=>{ return brew;});


var UserPage = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			username: '',
			brews: []
		};
	},

	renderBrews: function renderBrews(brews) {
		if (!brews || !brews.length) return React.createElement(
			'div',
			{ className: 'noBrews' },
			'No Brews.'
		);

		var sortedBrews = _.sortBy(brews, function (brew) {
			return brew.title;
		});

		return _.map(sortedBrews, function (brew, idx) {
			return React.createElement(BrewItem, { brew: brew, key: idx });
		});
	},

	getSortedBrews: function getSortedBrews() {
		return _.groupBy(this.props.brews, function (brew) {
			return brew.published ? 'published' : 'private';
		});
	},

	renderPrivateBrews: function renderPrivateBrews(privateBrews) {
		if (!privateBrews || !privateBrews.length) return;

		return [React.createElement(
			'h1',
			null,
			this.props.username,
			'\'s unpublished brews'
		), this.renderBrews(privateBrews)];
	},

	render: function render() {
		var brews = this.getSortedBrews();

		return React.createElement(
			'div',
			{ className: 'userPage page' },
			React.createElement(
				Navbar,
				null,
				React.createElement(
					Nav.section,
					null,
					React.createElement(RecentNavItem, null),
					React.createElement(Account, null)
				)
			),
			React.createElement(
				'div',
				{ className: 'content' },
				React.createElement(
					'div',
					{ className: 'age' },
					React.createElement(
						'h1',
						null,
						this.props.username,
						'\'s brews'
					),
					this.renderBrews(brews.published),
					this.renderPrivateBrews(brews.private)
				)
			)
		);
	}
});

module.exports = UserPage;

},{"../../navbar/account.navitem.jsx":14,"../../navbar/navbar.jsx":16,"../../navbar/recent.navitem.jsx":19,"./brewItem/brewItem.jsx":26,"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/nav/nav.jsx":31,"react":"react"}],28:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var DISMISS_KEY = 'dismiss_render_warning';

var RenderWarnings = createClass({
	getInitialState: function getInitialState() {
		return {
			warnings: {}
		};
	},
	componentDidMount: function componentDidMount() {
		this.checkWarnings();
		window.addEventListener('resize', this.checkWarnings);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('resize', this.checkWarnings);
	},
	warnings: {
		chrome: function chrome() {
			var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
			if (!isChrome) {
				return React.createElement(
					'li',
					{ key: 'chrome' },
					React.createElement(
						'em',
						null,
						'Built for Chrome '
					),
					' ',
					React.createElement('br', null),
					'Other browsers do not support \xA0',
					React.createElement(
						'a',
						{ target: '_blank', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/column-span#Browser_compatibility' },
						'key features'
					),
					' this site uses.'
				);
			}
		}
	},
	checkWarnings: function checkWarnings() {
		var hideDismiss = localStorage.getItem(DISMISS_KEY);
		if (hideDismiss) return this.setState({ warnings: {} });

		this.setState({
			warnings: _.reduce(this.warnings, function (r, fn, type) {
				var element = fn();
				if (element) r[type] = element;
				return r;
			}, {})
		});
	},
	dismiss: function dismiss() {
		localStorage.setItem(DISMISS_KEY, true);
		this.checkWarnings();
	},
	render: function render() {
		if (_.isEmpty(this.state.warnings)) return null;

		return React.createElement(
			'div',
			{ className: 'renderWarnings' },
			React.createElement('i', { className: 'fa fa-times dismiss', onClick: this.dismiss }),
			React.createElement('i', { className: 'fa fa-exclamation-triangle ohno' }),
			React.createElement(
				'h3',
				null,
				'Render Warnings'
			),
			React.createElement(
				'small',
				null,
				'If this homebrew is rendering badly if might be because of the following:'
			),
			React.createElement(
				'ul',
				null,
				_.values(this.state.warnings)
			)
		);
	}
});

module.exports = RenderWarnings;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","react":"react"}],29:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var CodeMirror = void 0;
if (typeof navigator !== 'undefined') {
	CodeMirror = require('codemirror');

	//Language Modes
	require('codemirror/mode/gfm/gfm.js'); //Github flavoured markdown
	require('codemirror/mode/javascript/javascript.js');
}

var CodeEditor = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			language: '',
			value: '',
			wrap: false,
			onChange: function onChange() {},
			onCursorActivity: function onCursorActivity() {}
		};
	},

	componentDidMount: function componentDidMount() {
		this.codeMirror = CodeMirror(this.refs.editor, {
			value: this.props.value,
			lineNumbers: true,
			lineWrapping: this.props.wrap,
			mode: this.props.language,
			extraKeys: {
				'Ctrl-B': this.makeBold,
				'Ctrl-I': this.makeItalic
			}
		});

		this.codeMirror.on('change', this.handleChange);
		this.codeMirror.on('cursorActivity', this.handleCursorActivity);
		this.updateSize();
	},

	makeBold: function makeBold() {
		var selection = this.codeMirror.getSelection();
		this.codeMirror.replaceSelection('**' + selection + '**', 'around');
	},

	makeItalic: function makeItalic() {
		var selection = this.codeMirror.getSelection();
		this.codeMirror.replaceSelection('*' + selection + '*', 'around');
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		if (this.codeMirror && nextProps.value !== undefined && this.codeMirror.getValue() != nextProps.value) {
			this.codeMirror.setValue(nextProps.value);
		}
	},

	shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
		return false;
	},

	setCursorPosition: function setCursorPosition(line, char) {
		var _this = this;

		setTimeout(function () {
			_this.codeMirror.focus();
			_this.codeMirror.doc.setCursor(line, char);
		}, 10);
	},

	updateSize: function updateSize() {
		this.codeMirror.refresh();
	},

	handleChange: function handleChange(editor) {
		this.props.onChange(editor.getValue());
	},
	handleCursorActivity: function handleCursorActivity() {
		this.props.onCursorActivity(this.codeMirror.doc.getCursor());
	},

	render: function render() {
		return React.createElement('div', { className: 'codeEditor', ref: 'editor' });
	}
});

module.exports = CodeEditor;

},{"classnames":"classnames","codemirror":"codemirror","codemirror/mode/gfm/gfm.js":"codemirror/mode/gfm/gfm.js","codemirror/mode/javascript/javascript.js":"codemirror/mode/javascript/javascript.js","create-react-class":"create-react-class","lodash":"lodash","react":"react"}],30:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var Markdown = require('marked');
var renderer = new Markdown.Renderer();

//Processes the markdown within an HTML block if it's just a class-wrapper
renderer.html = function (html) {
	if (_.startsWith(_.trim(html), '<div') && _.endsWith(_.trim(html), '</div>')) {
		var openTag = html.substring(0, html.indexOf('>') + 1);
		html = html.substring(html.indexOf('>') + 1);
		html = html.substring(0, html.lastIndexOf('</div>'));
		return openTag + ' ' + Markdown(html) + ' </div>';
	}
	return html;
};

var sanitizeScriptTags = function sanitizeScriptTags(content) {
	return content.replace(/<script/ig, '&lt;script').replace(/<\/script>/ig, '&lt;/script&gt;');
};

var tagTypes = ['div', 'span', 'a'];
var tagRegex = new RegExp('(' + _.map(tagTypes, function (type) {
	return '\\<' + type + '|\\</' + type + '>';
}).join('|') + ')', 'g');

module.exports = {
	marked: Markdown,
	render: function render(rawBrewText) {
		return Markdown(sanitizeScriptTags(rawBrewText), { renderer: renderer });
	},

	validate: function validate(rawBrewText) {
		var errors = [];
		var leftovers = _.reduce(rawBrewText.split('\n'), function (acc, line, _lineNumber) {
			var lineNumber = _lineNumber + 1;
			var matches = line.match(tagRegex);
			if (!matches || !matches.length) return acc;

			_.each(matches, function (match) {
				_.each(tagTypes, function (type) {
					if (match == '<' + type) {
						acc.push({
							type: type,
							line: lineNumber
						});
					}
					if (match === '</' + type + '>') {
						if (!acc.length) {
							errors.push({
								line: lineNumber,
								type: type,
								text: 'Unmatched closing tag',
								id: 'CLOSE'
							});
						} else if (_.last(acc).type == type) {
							acc.pop();
						} else {
							errors.push({
								line: _.last(acc).line + ' to ' + lineNumber,
								type: type,
								text: 'Type mismatch on closing tag',
								id: 'MISMATCH'
							});
							acc.pop();
						}
					}
				});
			});
			return acc;
		}, []);

		_.each(leftovers, function (unmatched) {
			errors.push({
				line: unmatched.line,
				type: unmatched.type,
				text: 'Unmatched opening tag',
				id: 'OPEN'
			});
		});

		return errors;
	}
};

},{"lodash":"lodash","marked":"marked"}],31:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var NaturalCritIcon = require('naturalcrit/svg/naturalcrit.svg.jsx');

var Nav = {
	base: createClass({
		render: function render() {
			return React.createElement(
				'nav',
				null,
				React.createElement(
					'div',
					{ className: 'navContent' },
					this.props.children
				)
			);
		}
	}),
	logo: function logo() {
		return React.createElement(
			'a',
			{ className: 'navLogo', href: 'https://ageuntold.com' },
			React.createElement(NaturalCritIcon, null),
			React.createElement(
				'span',
				{ className: 'name' },
				'AGE',
				React.createElement(
					'span',
					{ className: 'crit' },
					'Untold'
				)
			)
		);
	},

	section: createClass({
		render: function render() {
			return React.createElement(
				'div',
				{ className: 'navSection' },
				this.props.children
			);
		}
	}),

	item: createClass({
		getDefaultProps: function getDefaultProps() {
			return {
				icon: null,
				href: null,
				newTab: false,
				onClick: function onClick() {},
				color: null
			};
		},
		handleClick: function handleClick() {
			this.props.onClick();
		},
		render: function render() {
			var classes = cx('navItem', this.props.color, this.props.className);

			var icon = void 0;
			if (this.props.icon) icon = React.createElement('i', { className: 'fa ' + this.props.icon });

			var props = _.omit(this.props, ['newTab']);

			if (this.props.href) {
				return React.createElement(
					'a',
					_extends({}, props, { className: classes, target: this.props.newTab ? '_blank' : '_self' }),
					this.props.children,
					icon
				);
			} else {
				return React.createElement(
					'div',
					_extends({}, props, { className: classes, onClick: this.handleClick }),
					this.props.children,
					icon
				);
			}
		}
	})

};

module.exports = Nav;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","naturalcrit/svg/naturalcrit.svg.jsx":33,"react":"react"}],32:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var _ = require('lodash');
var cx = require('classnames');

var SplitPane = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			storageKey: 'naturalcrit-pane-split',
			onDragFinish: function onDragFinish() {} //fires when dragging

		};
	},
	getInitialState: function getInitialState() {
		return {
			size: null,
			isDragging: false
		};
	},
	componentDidMount: function componentDidMount() {
		var paneSize = window.localStorage.getItem(this.props.storageKey);
		if (paneSize) {
			this.setState({
				size: paneSize
			});
		}
	},

	handleUp: function handleUp() {
		if (this.state.isDragging) {
			this.props.onDragFinish(this.state.size);
			window.localStorage.setItem(this.props.storageKey, this.state.size);
		}
		this.setState({ isDragging: false });
	},
	handleDown: function handleDown() {
		this.setState({ isDragging: true });
		//this.unFocus()
	},
	handleMove: function handleMove(e) {
		if (!this.state.isDragging) return;
		this.setState({
			size: e.pageX
		});
	},
	/*
 unFocus : function() {
 	if(document.selection){
 			document.selection.empty();
 	}else{
 		window.getSelection().removeAllRanges();
 	}
 },
 */
	renderDivider: function renderDivider() {
		return React.createElement(
			'div',
			{ className: 'divider', onMouseDown: this.handleDown },
			React.createElement(
				'div',
				{ className: 'dots' },
				React.createElement('i', { className: 'fa fa-circle' }),
				React.createElement('i', { className: 'fa fa-circle' }),
				React.createElement('i', { className: 'fa fa-circle' })
			)
		);
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'splitPane', onMouseMove: this.handleMove, onMouseUp: this.handleUp },
			React.createElement(
				Pane,
				{ ref: 'pane1', width: this.state.size },
				this.props.children[0]
			),
			this.renderDivider(),
			React.createElement(
				Pane,
				{ ref: 'pane2' },
				this.props.children[1]
			)
		);
	}
});

var Pane = createClass({
	getDefaultProps: function getDefaultProps() {
		return {
			width: null
		};
	},
	render: function render() {
		var styles = {};
		if (this.props.width) {
			styles = {
				flex: 'none',
				width: this.props.width + 'px'
			};
		}
		return React.createElement(
			'div',
			{ className: cx('pane', this.props.className), style: styles },
			this.props.children
		);
	}
});

module.exports = SplitPane;

},{"classnames":"classnames","create-react-class":"create-react-class","lodash":"lodash","react":"react"}],33:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');

module.exports = function (props) {
	return React.createElement(
		'svg',
		{ version: '1.1', x: '0px', y: '0px', viewBox: '0 0 100 100', enableBackground: 'new 0 0 100 100' },
		React.createElement('path', { d: 'M80.644,87.982l16.592-41.483c0.054-0.128,0.088-0.26,0.108-0.394c0.006-0.039,0.007-0.077,0.011-0.116  c0.007-0.087,0.008-0.174,0.002-0.26c-0.003-0.046-0.007-0.091-0.014-0.137c-0.014-0.089-0.036-0.176-0.063-0.262  c-0.012-0.034-0.019-0.069-0.031-0.103c-0.047-0.118-0.106-0.229-0.178-0.335c-0.004-0.006-0.006-0.012-0.01-0.018L67.999,3.358  c-0.01-0.013-0.003-0.026-0.013-0.04L68,3.315V4c0,0-0.033,0-0.037,0c-0.403-1-1.094-1.124-1.752-0.976  c0,0.004-0.004-0.012-0.007-0.012C66.201,3.016,66.194,3,66.194,3H66.19h-0.003h-0.003h-0.004h-0.003c0,0-0.004,0-0.007,0  s-0.003-0.151-0.007-0.151L20.495,15.227c-0.025,0.007-0.046-0.019-0.071-0.011c-0.087,0.028-0.172,0.041-0.253,0.083  c-0.054,0.027-0.102,0.053-0.152,0.085c-0.051,0.033-0.101,0.061-0.147,0.099c-0.044,0.036-0.084,0.073-0.124,0.113  c-0.048,0.048-0.093,0.098-0.136,0.152c-0.03,0.039-0.059,0.076-0.085,0.117c-0.046,0.07-0.084,0.145-0.12,0.223  c-0.011,0.023-0.027,0.042-0.036,0.066L2.911,57.664C2.891,57.715,3,57.768,3,57.82v0.002c0,0.186,0,0.375,0,0.562  c0,0.004,0,0.004,0,0.008c0,0,0,0,0,0.002c0,0,0,0,0,0.004v0.004v0.002c0,0.074-0.002,0.15,0.012,0.223  C3.015,58.631,3,58.631,3,58.633c0,0.004,0,0.004,0,0.008c0,0,0,0,0,0.002c0,0,0,0,0,0.004v0.004c0,0,0,0,0,0.002v0.004  c0,0.191-0.046,0.377,0.06,0.545c0-0.002-0.03,0.004-0.03,0.004c0,0.004-0.03,0.004-0.03,0.004c0,0.002,0,0.002,0,0.002  l-0.045,0.004c0.03,0.047,0.036,0.09,0.068,0.133l29.049,37.359c0.002,0.004,0,0.006,0.002,0.01c0.002,0.002,0,0.004,0.002,0.008  c0.006,0.008,0.014,0.014,0.021,0.021c0.024,0.029,0.052,0.051,0.078,0.078c0.027,0.029,0.053,0.057,0.082,0.082  c0.03,0.027,0.055,0.062,0.086,0.088c0.026,0.02,0.057,0.033,0.084,0.053c0.04,0.027,0.081,0.053,0.123,0.076  c0.005,0.004,0.01,0.008,0.016,0.01c0.087,0.051,0.176,0.09,0.269,0.123c0.042,0.014,0.082,0.031,0.125,0.043  c0.021,0.006,0.041,0.018,0.062,0.021c0.123,0.027,0.249,0.043,0.375,0.043c0.099,0,0.202-0.012,0.304-0.027l45.669-8.303  c0.057-0.01,0.108-0.021,0.163-0.037C79.547,88.992,79.562,89,79.575,89c0.004,0,0.004,0,0.004,0c0.021,0,0.039-0.027,0.06-0.035  c0.041-0.014,0.08-0.034,0.12-0.052c0.021-0.01,0.044-0.019,0.064-0.03c0.017-0.01,0.026-0.015,0.033-0.017  c0.014-0.008,0.023-0.021,0.037-0.028c0.14-0.078,0.269-0.174,0.38-0.285c0.014-0.016,0.024-0.034,0.038-0.048  c0.109-0.119,0.201-0.252,0.271-0.398c0.006-0.01,0.016-0.018,0.021-0.029c0.004-0.008,0.008-0.017,0.011-0.026  c0.002-0.004,0.003-0.006,0.005-0.01C80.627,88.021,80.635,88.002,80.644,87.982z M77.611,84.461L48.805,66.453l32.407-25.202  L77.611,84.461z M46.817,63.709L35.863,23.542l43.818,14.608L46.817,63.709z M84.668,40.542l8.926,5.952l-11.902,29.75  L84.668,40.542z M89.128,39.446L84.53,36.38l-6.129-12.257L89.128,39.446z M79.876,34.645L37.807,20.622L65.854,6.599L79.876,34.645  z M33.268,19.107l-6.485-2.162l23.781-6.487L33.268,19.107z M21.92,18.895l8.67,2.891L10.357,47.798L21.92,18.895z M32.652,24.649  l10.845,39.757L7.351,57.178L32.652,24.649z M43.472,67.857L32.969,92.363L8.462,60.855L43.472,67.857z M46.631,69.09l27.826,17.393  l-38.263,6.959L46.631,69.09z' })
	);
};

},{"create-react-class":"create-react-class","react":"react"}]},{},[])("/Users/LimpingNinja/Projects/age-homebrewery/client/homebrew/homebrew.jsx")
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaG9tZWJyZXcvYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3giLCJjbGllbnQvaG9tZWJyZXcvYnJld1JlbmRlcmVyL2Vycm9yQmFyL2Vycm9yQmFyLmpzeCIsImNsaWVudC9ob21lYnJldy9icmV3UmVuZGVyZXIvbm90aWZpY2F0aW9uUG9wdXAvbm90aWZpY2F0aW9uUG9wdXAuanN4IiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9lZGl0b3IuanN4IiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9tZXRhZGF0YUVkaXRvci9tZXRhZGF0YUVkaXRvci5qc3giLCJjbGllbnQvaG9tZWJyZXcvZWRpdG9yL3NuaXBwZXRiYXIvc25pcHBldGJhci5qc3giLCJjbGllbnQvaG9tZWJyZXcvZWRpdG9yL3NuaXBwZXRiYXIvc25pcHBldHMvY2xhc3NmZWF0dXJlLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9jbGFzc3RhYmxlLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9jb3ZlcnBhZ2UuZ2VuLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL21hZ2ljLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9tb25zdGVyYmxvY2suZ2VuLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL3NuaXBwZXRzLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL3RhYmxlT2ZDb250ZW50cy5nZW4uanMiLCJjbGllbnQvaG9tZWJyZXcvaG9tZWJyZXcuanN4IiwiY2xpZW50L2hvbWVicmV3L25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4IiwiY2xpZW50L2hvbWVicmV3L25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvbmF2YmFyLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvcGF0cmVvbi5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvcHJpbnQubmF2aXRlbS5qc3giLCJjbGllbnQvaG9tZWJyZXcvbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9wYWdlcy9lZGl0UGFnZS9lZGl0UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvZXJyb3JQYWdlL2Vycm9yUGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvaG9tZVBhZ2UvaG9tZVBhZ2UuanN4IiwiY2xpZW50L2hvbWVicmV3L3BhZ2VzL25ld1BhZ2UvbmV3UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvcHJpbnRQYWdlL3ByaW50UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvc2hhcmVQYWdlL3NoYXJlUGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvdXNlclBhZ2UvYnJld0l0ZW0vYnJld0l0ZW0uanN4IiwiY2xpZW50L2hvbWVicmV3L3BhZ2VzL3VzZXJQYWdlL3VzZXJQYWdlLmpzeCIsInNoYXJlZC9ob21lYnJld2VyeS9yZW5kZXJXYXJuaW5ncy9yZW5kZXJXYXJuaW5ncy5qc3giLCJzaGFyZWQvbmF0dXJhbGNyaXQvY29kZUVkaXRvci9jb2RlRWRpdG9yLmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9tYXJrZG93bi5qcyIsInNoYXJlZC9uYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9zcGxpdFBhbmUvc3BsaXRQYW5lLmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9zdmcvbmF0dXJhbGNyaXQuc3ZnLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBTSxRQUFRLFFBQVEsT0FB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QUZLO0FBR047QUFBQyxRQUFEO0FBQUEsTUFBTSxLQUFJLE9BQVY7QUFBbUIsU0FBSyxLQUFMLENBQVcsUUFBWCxDQUFvQixDQUFwQjtBQUFuQjtBQUhNLEdBQVA7QUFLQTtBQWpFNEIsQ0FBWixDQUFsQjs7QUF5RUEsSUFBTSxPQUFPLFlBQVk7QUFDeEIsa0JBQWtCLDJCQUFXO0FBQzVCLFNBQU87QUFDTixVQUFRO0FBREYsR0FBUDtBQUdBLEVBTHVCO0FBTXhCLFNBQVMsa0JBQVU7QUFDbEIsTUFBSSxTQUFTLEVBQWI7QUFDQSxNQUFHLEtBQUssS0FBTCxDQUFXLEtBQWQsRUFBb0I7QUFDbkIsWUFBUztBQUNSLFVBQVEsTUFEQTtBQUVSLFdBQVcsS0FBSyxLQUFMLENBQVcsS0FBdEI7QUFGUSxJQUFUO0FBSUE7QUFDRCxTQUFPO0FBQUE7QUFBQSxLQUFLLFdBQVcsR0FBRyxNQUFILEVBQVcsS0FBSyxLQUFMLENBQVcsU0FBdEIsQ0FBaEIsRUFBa0QsT0FBTyxNQUF6RDtBQUNMLFFBQUssS0FBTCxDQUFXO0FBRE4sR0FBUDtBQUdBO0FBakJ1QixDQUFaLENBQWI7O0FBcUJBLE9BQU8sT0FBUCxHQUFpQixTQUFqQjs7Ozs7QUNuR0EsSUFBTSxRQUFRLFFBQVEsT0FBUixDQUFkO0FBQ0EsSUFBTSxjQUFjLFFBQVEsb0JBQVIsQ0FBcEI7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFVBQVMsS0FBVCxFQUFlO0FBQy9CLFFBQU87QUFBQTtBQUFBLElBQUssU0FBUSxLQUFiLEVBQW1CLEdBQUUsS0FBckIsRUFBMkIsR0FBRSxLQUE3QixFQUFtQyxTQUFRLGFBQTNDLEVBQXlELGtCQUFpQixpQkFBMUU7QUFBNEYsZ0NBQU0sR0FBRSxxOEZBQVI7QUFBNUYsRUFBUDtBQUNBLENBRkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IE1hcmtkb3duID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbWFya2Rvd24uanMnKTtcbmNvbnN0IEVycm9yQmFyID0gcmVxdWlyZSgnLi9lcnJvckJhci9lcnJvckJhci5qc3gnKTtcblxuLy9UT0RPOiBtb3ZlIHRvIHRoZSBicmV3IHJlbmRlcmVyXG5jb25zdCBSZW5kZXJXYXJuaW5ncyA9IHJlcXVpcmUoJ2hvbWVicmV3ZXJ5L3JlbmRlcldhcm5pbmdzL3JlbmRlcldhcm5pbmdzLmpzeCcpO1xuY29uc3QgTm90aWZpY2F0aW9uUG9wdXAgPSByZXF1aXJlKCcuL25vdGlmaWNhdGlvblBvcHVwL25vdGlmaWNhdGlvblBvcHVwLmpzeCcpO1xuXG5jb25zdCBQQUdFX0hFSUdIVCA9IDEwNTY7XG5jb25zdCBQUFJfVEhSRVNIT0xEID0gNTA7XG5cbmNvbnN0IEJyZXdSZW5kZXJlciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRleHQgICA6ICcnLFxuXHRcdFx0ZXJyb3JzIDogW11cblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBwYWdlcyA9IHRoaXMucHJvcHMudGV4dC5zcGxpdCgnXFxcXHBhZ2UnKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR2aWV3YWJsZVBhZ2VOdW1iZXIgOiAwLFxuXHRcdFx0aGVpZ2h0ICAgICAgICAgICAgIDogMCxcblx0XHRcdGlzTW91bnRlZCAgICAgICAgICA6IGZhbHNlLFxuXG5cdFx0XHRwYWdlcyAgOiBwYWdlcyxcblx0XHRcdHVzZVBQUiA6IHBhZ2VzLmxlbmd0aCA+PSBQUFJfVEhSRVNIT0xELFxuXHRcdH07XG5cdH0sXG5cdGhlaWdodCAgICAgOiAwLFxuXHRsYXN0UmVuZGVyIDogPGRpdj48L2Rpdj4sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVTaXplKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVTaXplKTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIDogZnVuY3Rpb24obmV4dFByb3BzKSB7XG5cdFx0Y29uc3QgcGFnZXMgPSBuZXh0UHJvcHMudGV4dC5zcGxpdCgnXFxcXHBhZ2UnKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHBhZ2VzICA6IHBhZ2VzLFxuXHRcdFx0dXNlUFBSIDogcGFnZXMubGVuZ3RoID49IFBQUl9USFJFU0hPTERcblx0XHR9KTtcblx0fSxcblxuXHR1cGRhdGVTaXplIDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRoZWlnaHQgICAgOiB0aGlzLnJlZnMubWFpbi5wYXJlbnROb2RlLmNsaWVudEhlaWdodCxcblx0XHRcdGlzTW91bnRlZCA6IHRydWVcblx0XHR9KTtcblx0fSxcblxuXHRoYW5kbGVTY3JvbGwgOiBmdW5jdGlvbihlKXtcblx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcblx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUpPT4oe1xuXHRcdFx0dmlld2FibGVQYWdlTnVtYmVyIDogTWF0aC5mbG9vcih0YXJnZXQuc2Nyb2xsVG9wIC8gdGFyZ2V0LnNjcm9sbEhlaWdodCAqIHByZXZTdGF0ZS5wYWdlcy5sZW5ndGgpXG5cdFx0fSkpO1xuXHR9LFxuXG5cdHNob3VsZFJlbmRlciA6IGZ1bmN0aW9uKHBhZ2VUZXh0LCBpbmRleCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUuaXNNb3VudGVkKSByZXR1cm4gZmFsc2U7XG5cblx0XHRjb25zdCB2aWV3SW5kZXggPSB0aGlzLnN0YXRlLnZpZXdhYmxlUGFnZU51bWJlcjtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggLSAzKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggLSAyKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggLSAxKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXgpICAgICByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggKyAxKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggKyAyKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggKyAzKSByZXR1cm4gdHJ1ZTtcblxuXHRcdC8vQ2hlY2sgZm9yIHN0eWxlIHRhZ2VzXG5cdFx0aWYocGFnZVRleHQuaW5kZXhPZignPHN0eWxlPicpICE9PSAtMSkgcmV0dXJuIHRydWU7XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0cmVuZGVyUGFnZUluZm8gOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ncGFnZUluZm8nPlxuXHRcdFx0e3RoaXMuc3RhdGUudmlld2FibGVQYWdlTnVtYmVyICsgMX0gLyB7dGhpcy5zdGF0ZS5wYWdlcy5sZW5ndGh9XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlclBQUm1zZyA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUudXNlUFBSKSByZXR1cm47XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3Bwcl9tc2cnPlxuXHRcdFx0UGFydGlhbCBQYWdlIFJlbmRlcmVyIGVuYWJsZWQsIGJlY2F1c2UgeW91ciBicmV3IGlzIHNvIGxhcmdlLiBNYXkgZWZmZWN0IHJlbmRlcmluZy5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyRHVtbXlQYWdlIDogZnVuY3Rpb24oaW5kZXgpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nYWdlJyBpZD17YHAke2luZGV4ICsgMX1gfSBrZXk9e2luZGV4fT5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtc3Bpbm5lciBmYS1zcGluJyAvPlxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXJQYWdlIDogZnVuY3Rpb24ocGFnZVRleHQsIGluZGV4KXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2FnZScgaWQ9e2BwJHtpbmRleCArIDF9YH0gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBNYXJrZG93bi5yZW5kZXIocGFnZVRleHQpIH19IGtleT17aW5kZXh9IC8+O1xuXHR9LFxuXG5cdHJlbmRlclBhZ2VzIDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLnN0YXRlLnVzZVBQUil7XG5cdFx0XHRyZXR1cm4gXy5tYXAodGhpcy5zdGF0ZS5wYWdlcywgKHBhZ2UsIGluZGV4KT0+e1xuXHRcdFx0XHRpZih0aGlzLnNob3VsZFJlbmRlcihwYWdlLCBpbmRleCkpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlclBhZ2UocGFnZSwgaW5kZXgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckR1bW15UGFnZShpbmRleCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZih0aGlzLnByb3BzLmVycm9ycyAmJiB0aGlzLnByb3BzLmVycm9ycy5sZW5ndGgpIHJldHVybiB0aGlzLmxhc3RSZW5kZXI7XG5cdFx0dGhpcy5sYXN0UmVuZGVyID0gXy5tYXAodGhpcy5zdGF0ZS5wYWdlcywgKHBhZ2UsIGluZGV4KT0+e1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyUGFnZShwYWdlLCBpbmRleCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHRoaXMubGFzdFJlbmRlcjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8UmVhY3QuRnJhZ21lbnQ+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdicmV3UmVuZGVyZXInXG5cdFx0XHRcdFx0b25TY3JvbGw9e3RoaXMuaGFuZGxlU2Nyb2xsfVxuXHRcdFx0XHRcdHJlZj0nbWFpbidcblx0XHRcdFx0XHRzdHlsZT17eyBoZWlnaHQ6IHRoaXMuc3RhdGUuaGVpZ2h0IH19PlxuXG5cdFx0XHRcdFx0PEVycm9yQmFyIGVycm9ycz17dGhpcy5wcm9wcy5lcnJvcnN9IC8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J3BvcHVwcyc+XG5cdFx0XHRcdFx0XHQ8UmVuZGVyV2FybmluZ3MgLz5cblx0XHRcdFx0XHRcdDxOb3RpZmljYXRpb25Qb3B1cCAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J3BhZ2VzJyByZWY9J3BhZ2VzJz5cblx0XHRcdFx0XHRcdHt0aGlzLnJlbmRlclBhZ2VzKCl9XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2Pjtcblx0XHRcdFx0e3RoaXMucmVuZGVyUGFnZUluZm8oKX1cblx0XHRcdFx0e3RoaXMucmVuZGVyUFBSbXNnKCl9XG5cdFx0XHQ8L1JlYWN0LkZyYWdtZW50PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyZXdSZW5kZXJlcjtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IEVycm9yQmFyID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZXJyb3JzIDogW11cblx0XHR9O1xuXHR9LFxuXG5cdGhhc09wZW5FcnJvciAgOiBmYWxzZSxcblx0aGFzQ2xvc2VFcnJvciA6IGZhbHNlLFxuXHRoYXNNYXRjaEVycm9yIDogZmFsc2UsXG5cblx0cmVuZGVyRXJyb3JzIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmhhc09wZW5FcnJvciA9IGZhbHNlO1xuXHRcdHRoaXMuaGFzQ2xvc2VFcnJvciA9IGZhbHNlO1xuXHRcdHRoaXMuaGFzTWF0Y2hFcnJvciA9IGZhbHNlO1xuXG5cblx0XHRjb25zdCBlcnJvcnMgPSBfLm1hcCh0aGlzLnByb3BzLmVycm9ycywgKGVyciwgaWR4KT0+e1xuXHRcdFx0aWYoZXJyLmlkID09ICdPUEVOJykgdGhpcy5oYXNPcGVuRXJyb3IgPSB0cnVlO1xuXHRcdFx0aWYoZXJyLmlkID09ICdDTE9TRScpIHRoaXMuaGFzQ2xvc2VFcnJvciA9IHRydWU7XG5cdFx0XHRpZihlcnIuaWQgPT0gJ01JU01BVENIJykgdGhpcy5oYXNNYXRjaEVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiA8bGkga2V5PXtpZHh9PlxuXHRcdFx0XHRMaW5lIHtlcnIubGluZX0gOiB7ZXJyLnRleHR9LCAne2Vyci50eXBlfScgdGFnXG5cdFx0XHQ8L2xpPjtcblx0XHR9KTtcblxuXHRcdHJldHVybiA8dWw+e2Vycm9yc308L3VsPjtcblx0fSxcblxuXHRyZW5kZXJQcm90aXAgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IG1zZyA9IFtdO1xuXHRcdGlmKHRoaXMuaGFzT3BlbkVycm9yKXtcblx0XHRcdG1zZy5wdXNoKDxkaXY+XG5cdFx0XHRcdEFuIHVubWF0Y2hlZCBvcGVuaW5nIHRhZyBtZWFucyB0aGVyZSdzIGFuIG9wZW5lZCB0YWcgdGhhdCBpc24ndCBjbG9zZWQsIHlvdSBuZWVkIHRvIGNsb3NlIGEgdGFnLCBsaWtlIHRoaXMgeyc8L2Rpdj4nfS4gTWFrZSBzdXJlIHRvIG1hdGNoIHR5cGVzIVxuXHRcdFx0PC9kaXY+KTtcblx0XHR9XG5cblx0XHRpZih0aGlzLmhhc0Nsb3NlRXJyb3Ipe1xuXHRcdFx0bXNnLnB1c2goPGRpdj5cblx0XHRcdFx0QW4gdW5tYXRjaGVkIGNsb3NpbmcgdGFnIG1lYW5zIHlvdSBjbG9zZWQgYSB0YWcgd2l0aG91dCBvcGVuaW5nIGl0LiBFaXRoZXIgcmVtb3ZlIGl0LCB5b3UgY2hlY2sgdG8gd2hlcmUgeW91IHRoaW5rIHlvdSBvcGVuZWQgaXQuXG5cdFx0XHQ8L2Rpdj4pO1xuXHRcdH1cblxuXHRcdGlmKHRoaXMuaGFzTWF0Y2hFcnJvcil7XG5cdFx0XHRtc2cucHVzaCg8ZGl2PlxuXHRcdFx0XHRBIHR5cGUgbWlzbWF0Y2ggbWVhbnMgeW91IGNsb3NlZCBhIHRhZywgYnV0IHRoZSBsYXN0IG9wZW4gdGFnIHdhcyBhIGRpZmZlcmVudCB0eXBlLlxuXHRcdFx0PC9kaXY+KTtcblx0XHR9XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdwcm90aXBzJz5cblx0XHRcdDxoND5Qcm90aXBzITwvaDQ+XG5cdFx0XHR7bXNnfVxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnByb3BzLmVycm9ycy5sZW5ndGgpIHJldHVybiBudWxsO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdlcnJvckJhcic+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyAvPlxuXHRcdFx0PGgzPiBUaGVyZSBhcmUgSFRNTCBlcnJvcnMgaW4geW91ciBtYXJrdXA8L2gzPlxuXHRcdFx0PHNtYWxsPklmIHRoZXNlIGFyZW4ndCBmaXhlZCB5b3VyIGJyZXcgd2lsbCBub3QgcmVuZGVyIHByb3Blcmx5IHdoZW4geW91IHByaW50IGl0IHRvIFBERiBvciBzaGFyZSBpdDwvc21hbGw+XG5cdFx0XHR7dGhpcy5yZW5kZXJFcnJvcnMoKX1cblx0XHRcdDxociAvPlxuXHRcdFx0e3RoaXMucmVuZGVyUHJvdGlwKCl9XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFcnJvckJhcjtcbiIsIlxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcdC8vVW51c2VkIHZhcmlhYmxlXG5cbmNvbnN0IERJU01JU1NfS0VZID0gJ2Rpc21pc3Nfbm90aWZpY2F0aW9uJztcblxuY29uc3QgTm90aWZpY2F0aW9uUG9wdXAgPSBjcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRub3RpZmljYXRpb25zIDoge31cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY2hlY2tOb3RpZmljYXRpb25zKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuY2hlY2tOb3RpZmljYXRpb25zKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5jaGVja05vdGlmaWNhdGlvbnMpO1xuXHR9LFxuXHRub3RpZmljYXRpb25zIDoge1xuXHRcdGZhcSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gPGxpIGtleT0nZmFxJz5cblx0XHRcdFx0PGVtPlByb3RlY3QgeW91ciB3b3JrISA8L2VtPiA8YnIgLz5cblx0XHRcdFx0QXQgdGhlIG1vbWVudCB3ZSBkbyBub3Qgc2F2ZSBhIGhpc3Rvcnkgb2YgeW91ciBwcm9qZWN0cywgc28gcGxlYXNlIG1ha2UgZnJlcXVlbnQgYmFja3VwcyBvZiB5b3VyIGJyZXdzISAgJm5ic3A7XG5cdFx0XHRcdDxhIHRhcmdldD0nX2JsYW5rJyBocmVmPSdodHRwczovL3d3dy5yZWRkaXQuY29tL3IvaG9tZWJyZXdlcnkvY29tbWVudHMvYWRoNmxoL2ZhcXNfcHNhc19hbm5vdW5jZW1lbnRzLyc+XG5cdFx0XHRcdFx0U2VlIHRoZSBGQVFcblx0XHRcdFx0PC9hPiB0byBsZWFybiBob3cgdG8gYXZvaWQgbG9zaW5nIHlvdXIgd29yayFcblx0XHRcdDwvbGk+O1xuXHRcdH0sXG5cdH0sXG5cdGNoZWNrTm90aWZpY2F0aW9ucyA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgaGlkZURpc21pc3MgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShESVNNSVNTX0tFWSk7XG5cdFx0aWYoaGlkZURpc21pc3MpIHJldHVybiB0aGlzLnNldFN0YXRlKHsgbm90aWZpY2F0aW9uczoge30gfSk7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdG5vdGlmaWNhdGlvbnMgOiBfLm1hcFZhbHVlcyh0aGlzLm5vdGlmaWNhdGlvbnMsIChmbik9PnsgcmV0dXJuIGZuKCk7IH0pXHQvL0NvbnZlcnQgbm90aWZpY2F0aW9uIGZ1bmN0aW9ucyBpbnRvIHRoZWlyIHJldHVybiB0ZXh0IHZhbHVlXG5cdFx0fSk7XG5cdH0sXG5cdGRpc21pc3MgOiBmdW5jdGlvbigpe1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKERJU01JU1NfS0VZLCB0cnVlKTtcblx0XHR0aGlzLmNoZWNrTm90aWZpY2F0aW9ucygpO1xuXHR9LFxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGlmKF8uaXNFbXB0eSh0aGlzLnN0YXRlLm5vdGlmaWNhdGlvbnMpKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nbm90aWZpY2F0aW9uUG9wdXAnPlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS10aW1lcyBkaXNtaXNzJyBvbkNsaWNrPXt0aGlzLmRpc21pc3N9Lz5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtaW5mby1jaXJjbGUgaW5mbycgLz5cblx0XHRcdDxoMz5Ob3RpY2U8L2gzPlxuXHRcdFx0PHNtYWxsPlRoaXMgd2Vic2l0ZSBpcyBhbHdheXMgaW1wcm92aW5nIGFuZCB3ZSBhcmUgc3RpbGwgYWRkaW5nIG5ldyBmZWF0dXJlcyBhbmQgc3F1YXNoaW5nIGJ1Z3MuIEtlZXAgdGhlIGZvbGxvd2luZyBpbiBtaW5kOjwvc21hbGw+XG5cdFx0XHQ8dWw+e18udmFsdWVzKHRoaXMuc3RhdGUubm90aWZpY2F0aW9ucyl9PC91bD5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvblBvcHVwO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBDb2RlRWRpdG9yID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvY29kZUVkaXRvci9jb2RlRWRpdG9yLmpzeCcpO1xuY29uc3QgU25pcHBldEJhciA9IHJlcXVpcmUoJy4vc25pcHBldGJhci9zbmlwcGV0YmFyLmpzeCcpO1xuY29uc3QgTWV0YWRhdGFFZGl0b3IgPSByZXF1aXJlKCcuL21ldGFkYXRhRWRpdG9yL21ldGFkYXRhRWRpdG9yLmpzeCcpO1xuXG5cbmNvbnN0IHNwbGljZSA9IGZ1bmN0aW9uKHN0ciwgaW5kZXgsIGluamVjdCl7XG5cdHJldHVybiBzdHIuc2xpY2UoMCwgaW5kZXgpICsgaW5qZWN0ICsgc3RyLnNsaWNlKGluZGV4KTtcbn07XG5cbmNvbnN0IFNOSVBQRVRCQVJfSEVJR0hUID0gMjU7XG5cbmNvbnN0IEVkaXRvciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHZhbHVlICAgIDogJycsXG5cdFx0XHRvbkNoYW5nZSA6ICgpPT57fSxcblxuXHRcdFx0bWV0YWRhdGEgICAgICAgICA6IHt9LFxuXHRcdFx0b25NZXRhZGF0YUNoYW5nZSA6ICgpPT57fSxcblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2hvd01ldGFkYXRhRWRpdG9yIDogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXHRjdXJzb3JQb3NpdGlvbiA6IHtcblx0XHRsaW5lIDogMCxcblx0XHRjaCAgIDogMFxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51cGRhdGVFZGl0b3JTaXplKCk7XG5cdFx0dGhpcy5oaWdobGlnaHRQYWdlTGluZXMoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVFZGl0b3JTaXplKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVFZGl0b3JTaXplKTtcblx0fSxcblxuXHR1cGRhdGVFZGl0b3JTaXplIDogZnVuY3Rpb24oKSB7XG5cdFx0bGV0IHBhbmVIZWlnaHQgPSB0aGlzLnJlZnMubWFpbi5wYXJlbnROb2RlLmNsaWVudEhlaWdodDtcblx0XHRwYW5lSGVpZ2h0IC09IFNOSVBQRVRCQVJfSEVJR0hUICsgMTtcblx0XHR0aGlzLnJlZnMuY29kZUVkaXRvci5jb2RlTWlycm9yLnNldFNpemUobnVsbCwgcGFuZUhlaWdodCk7XG5cdH0sXG5cblx0aGFuZGxlVGV4dENoYW5nZSA6IGZ1bmN0aW9uKHRleHQpe1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UodGV4dCk7XG5cdH0sXG5cdGhhbmRsZUN1cnNvckFjdGl2dHkgOiBmdW5jdGlvbihjdXJwb3Mpe1xuXHRcdHRoaXMuY3Vyc29yUG9zaXRpb24gPSBjdXJwb3M7XG5cdH0sXG5cdGhhbmRsZUluamVjdCA6IGZ1bmN0aW9uKGluamVjdFRleHQpe1xuXHRcdGNvbnN0IGxpbmVzID0gdGhpcy5wcm9wcy52YWx1ZS5zcGxpdCgnXFxuJyk7XG5cdFx0bGluZXNbdGhpcy5jdXJzb3JQb3NpdGlvbi5saW5lXSA9IHNwbGljZShsaW5lc1t0aGlzLmN1cnNvclBvc2l0aW9uLmxpbmVdLCB0aGlzLmN1cnNvclBvc2l0aW9uLmNoLCBpbmplY3RUZXh0KTtcblxuXHRcdHRoaXMuaGFuZGxlVGV4dENoYW5nZShsaW5lcy5qb2luKCdcXG4nKSk7XG5cdFx0dGhpcy5yZWZzLmNvZGVFZGl0b3Iuc2V0Q3Vyc29yUG9zaXRpb24odGhpcy5jdXJzb3JQb3NpdGlvbi5saW5lLCB0aGlzLmN1cnNvclBvc2l0aW9uLmNoICArIGluamVjdFRleHQubGVuZ3RoKTtcblx0fSxcblx0aGFuZGdsZVRvZ2dsZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzaG93TWV0YWRhdGFFZGl0b3IgOiAhdGhpcy5zdGF0ZS5zaG93TWV0YWRhdGFFZGl0b3Jcblx0XHR9KTtcblx0fSxcblxuXHRnZXRDdXJyZW50UGFnZSA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgbGluZXMgPSB0aGlzLnByb3BzLnZhbHVlLnNwbGl0KCdcXG4nKS5zbGljZSgwLCB0aGlzLmN1cnNvclBvc2l0aW9uLmxpbmUgKyAxKTtcblx0XHRyZXR1cm4gXy5yZWR1Y2UobGluZXMsIChyLCBsaW5lKT0+e1xuXHRcdFx0aWYobGluZS5pbmRleE9mKCdcXFxccGFnZScpICE9PSAtMSkgcisrO1xuXHRcdFx0cmV0dXJuIHI7XG5cdFx0fSwgMSk7XG5cdH0sXG5cblx0aGlnaGxpZ2h0UGFnZUxpbmVzIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5yZWZzLmNvZGVFZGl0b3IpIHJldHVybjtcblx0XHRjb25zdCBjb2RlTWlycm9yID0gdGhpcy5yZWZzLmNvZGVFZGl0b3IuY29kZU1pcnJvcjtcblxuXHRcdGNvbnN0IGxpbmVOdW1iZXJzID0gXy5yZWR1Y2UodGhpcy5wcm9wcy52YWx1ZS5zcGxpdCgnXFxuJyksIChyLCBsaW5lLCBsaW5lTnVtYmVyKT0+e1xuXHRcdFx0aWYobGluZS5pbmRleE9mKCdcXFxccGFnZScpICE9PSAtMSl7XG5cdFx0XHRcdGNvZGVNaXJyb3IuYWRkTGluZUNsYXNzKGxpbmVOdW1iZXIsICdiYWNrZ3JvdW5kJywgJ3BhZ2VMaW5lJyk7XG5cdFx0XHRcdHIucHVzaChsaW5lTnVtYmVyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiByO1xuXHRcdH0sIFtdKTtcblx0XHRyZXR1cm4gbGluZU51bWJlcnM7XG5cdH0sXG5cblxuXHRicmV3SnVtcCA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgY3VycmVudFBhZ2UgPSB0aGlzLmdldEN1cnJlbnRQYWdlKCk7XG5cdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSBgcCR7Y3VycmVudFBhZ2V9YDtcblx0fSxcblxuXHQvL0NhbGxlZCB3aGVuIHRoZXJlIGFyZSBjaGFuZ2VzIHRvIHRoZSBlZGl0b3IncyBkaW1lbnNpb25zXG5cdHVwZGF0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5yZWZzLmNvZGVFZGl0b3IudXBkYXRlU2l6ZSgpO1xuXHR9LFxuXG5cdHJlbmRlck1ldGFkYXRhRWRpdG9yIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5zdGF0ZS5zaG93TWV0YWRhdGFFZGl0b3IpIHJldHVybjtcblx0XHRyZXR1cm4gPE1ldGFkYXRhRWRpdG9yXG5cdFx0XHRtZXRhZGF0YT17dGhpcy5wcm9wcy5tZXRhZGF0YX1cblx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLm9uTWV0YWRhdGFDaGFuZ2V9XG5cdFx0Lz47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmhpZ2hsaWdodFBhZ2VMaW5lcygpO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZWRpdG9yJyByZWY9J21haW4nPlxuXHRcdFx0XHQ8U25pcHBldEJhclxuXHRcdFx0XHRcdGJyZXc9e3RoaXMucHJvcHMudmFsdWV9XG5cdFx0XHRcdFx0b25JbmplY3Q9e3RoaXMuaGFuZGxlSW5qZWN0fVxuXHRcdFx0XHRcdG9uVG9nZ2xlPXt0aGlzLmhhbmRnbGVUb2dnbGV9XG5cdFx0XHRcdFx0c2hvd21ldGE9e3RoaXMuc3RhdGUuc2hvd01ldGFkYXRhRWRpdG9yfSAvPlxuXHRcdFx0XHR7dGhpcy5yZW5kZXJNZXRhZGF0YUVkaXRvcigpfVxuXHRcdFx0XHQ8Q29kZUVkaXRvclxuXHRcdFx0XHRcdHJlZj0nY29kZUVkaXRvcidcblx0XHRcdFx0XHR3cmFwPXt0cnVlfVxuXHRcdFx0XHRcdGxhbmd1YWdlPSdnZm0nXG5cdFx0XHRcdFx0dmFsdWU9e3RoaXMucHJvcHMudmFsdWV9XG5cdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuaGFuZGxlVGV4dENoYW5nZX1cblx0XHRcdFx0XHRvbkN1cnNvckFjdGl2aXR5PXt0aGlzLmhhbmRsZUN1cnNvckFjdGl2dHl9IC8+XG5cblx0XHRcdFx0ey8qXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdicmV3SnVtcCcgb25DbGljaz17dGhpcy5icmV3SnVtcH0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1hcnJvdy1yaWdodCcgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdCovfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yO1xuXG5cblxuXG5cblxuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbmNvbnN0IFNZU1RFTVMgPSBbJzVlJywgJzRlJywgJzMuNWUnLCAnUGF0aGZpbmRlciddO1xuXG5jb25zdCBNZXRhZGF0YUVkaXRvciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1ldGFkYXRhIDoge1xuXHRcdFx0XHRlZGl0SWQgICAgICA6IG51bGwsXG5cdFx0XHRcdHRpdGxlICAgICAgIDogJycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uIDogJycsXG5cdFx0XHRcdHRhZ3MgICAgICAgIDogJycsXG5cdFx0XHRcdHB1Ymxpc2hlZCAgIDogZmFsc2UsXG5cdFx0XHRcdGF1dGhvcnMgICAgIDogW10sXG5cdFx0XHRcdHN5c3RlbXMgICAgIDogW11cblx0XHRcdH0sXG5cdFx0XHRvbkNoYW5nZSA6ICgpPT57fVxuXHRcdH07XG5cdH0sXG5cblx0aGFuZGxlRmllbGRDaGFuZ2UgOiBmdW5jdGlvbihuYW1lLCBlKXtcblx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKF8ubWVyZ2Uoe30sIHRoaXMucHJvcHMubWV0YWRhdGEsIHtcblx0XHRcdFtuYW1lXSA6IGUudGFyZ2V0LnZhbHVlXG5cdFx0fSkpO1xuXHR9LFxuXHRoYW5kbGVTeXN0ZW0gOiBmdW5jdGlvbihzeXN0ZW0sIGUpe1xuXHRcdGlmKGUudGFyZ2V0LmNoZWNrZWQpe1xuXHRcdFx0dGhpcy5wcm9wcy5tZXRhZGF0YS5zeXN0ZW1zLnB1c2goc3lzdGVtKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wcm9wcy5tZXRhZGF0YS5zeXN0ZW1zID0gXy53aXRob3V0KHRoaXMucHJvcHMubWV0YWRhdGEuc3lzdGVtcywgc3lzdGVtKTtcblx0XHR9XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZSh0aGlzLnByb3BzLm1ldGFkYXRhKTtcblx0fSxcblx0aGFuZGxlUHVibGlzaCA6IGZ1bmN0aW9uKHZhbCl7XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZShfLm1lcmdlKHt9LCB0aGlzLnByb3BzLm1ldGFkYXRhLCB7XG5cdFx0XHRwdWJsaXNoZWQgOiB2YWxcblx0XHR9KSk7XG5cdH0sXG5cblx0aGFuZGxlRGVsZXRlIDogZnVuY3Rpb24oKXtcblx0XHRpZighY29uZmlybSgnYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIGJyZXc/JykpIHJldHVybjtcblx0XHRpZighY29uZmlybSgnYXJlIHlvdSBSRUFMTFkgc3VyZT8gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gcmVjb3ZlciBpdCcpKSByZXR1cm47XG5cblx0XHRyZXF1ZXN0LmdldChgL2FwaS9yZW1vdmUvJHt0aGlzLnByb3BzLm1ldGFkYXRhLmVkaXRJZH1gKVxuXHRcdFx0LnNlbmQoKVxuXHRcdFx0LmVuZChmdW5jdGlvbihlcnIsIHJlcyl7XG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0Z2V0UmVkZGl0TGluayA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgbWV0YSA9IHRoaXMucHJvcHMubWV0YWRhdGE7XG5cdFx0Y29uc3QgdGl0bGUgPSBgJHttZXRhLnRpdGxlfSBbJHttZXRhLnN5c3RlbXMuam9pbignICcpfV1gO1xuXHRcdGNvbnN0IHRleHQgPSBgSGV5IGd1eXMhIEkndmUgYmVlbiB3b3JraW5nIG9uIHRoaXMgaG9tZWJyZXcuIEknZCBsb3ZlIHlvdXIgZmVlZGJhY2suIENoZWNrIGl0IG91dC5cblxuKipbSG9tZWJyZXdlcnkgTGlua10oaHR0cDovL2hvbWVicmV3ZXJ5Lm5hdHVyYWxjcml0LmNvbS9zaGFyZS8ke21ldGEuc2hhcmVJZH0pKipgO1xuXG5cdFx0cmV0dXJuIGBodHRwczovL3d3dy5yZWRkaXQuY29tL3IvVW5lYXJ0aGVkQXJjYW5hL3N1Ym1pdD90aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aXRsZSl9JnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQodGV4dCl9YDtcblx0fSxcblxuXHRyZW5kZXJTeXN0ZW1zIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5tYXAoU1lTVEVNUywgKHZhbCk9Pntcblx0XHRcdHJldHVybiA8bGFiZWwga2V5PXt2YWx9PlxuXHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHR0eXBlPSdjaGVja2JveCdcblx0XHRcdFx0XHRjaGVja2VkPXtfLmluY2x1ZGVzKHRoaXMucHJvcHMubWV0YWRhdGEuc3lzdGVtcywgdmFsKX1cblx0XHRcdFx0XHRvbkNoYW5nZT17KGUpPT50aGlzLmhhbmRsZVN5c3RlbSh2YWwsIGUpfSAvPlxuXHRcdFx0XHR7dmFsfVxuXHRcdFx0PC9sYWJlbD47XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyUHVibGlzaCA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5wcm9wcy5tZXRhZGF0YS5wdWJsaXNoZWQpe1xuXHRcdFx0cmV0dXJuIDxidXR0b24gY2xhc3NOYW1lPSd1bnB1Ymxpc2gnIG9uQ2xpY2s9eygpPT50aGlzLmhhbmRsZVB1Ymxpc2goZmFsc2UpfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1iYW4nIC8+IHVucHVibGlzaFxuXHRcdFx0PC9idXR0b24+O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gPGJ1dHRvbiBjbGFzc05hbWU9J3B1Ymxpc2gnIG9uQ2xpY2s9eygpPT50aGlzLmhhbmRsZVB1Ymxpc2godHJ1ZSl9PlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWdsb2JlJyAvPiBwdWJsaXNoXG5cdFx0XHQ8L2J1dHRvbj47XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlckRlbGV0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucHJvcHMubWV0YWRhdGEuZWRpdElkKSByZXR1cm47XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2ZpZWxkIGRlbGV0ZSc+XG5cdFx0XHQ8bGFiZWw+ZGVsZXRlPC9sYWJlbD5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSd2YWx1ZSc+XG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPSdwdWJsaXNoJyBvbkNsaWNrPXt0aGlzLmhhbmRsZURlbGV0ZX0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS10cmFzaCcgLz4gZGVsZXRlIGJyZXdcblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyQXV0aG9ycyA6IGZ1bmN0aW9uKCl7XG5cdFx0bGV0IHRleHQgPSAnTm9uZS4nO1xuXHRcdGlmKHRoaXMucHJvcHMubWV0YWRhdGEuYXV0aG9ycy5sZW5ndGgpe1xuXHRcdFx0dGV4dCA9IHRoaXMucHJvcHMubWV0YWRhdGEuYXV0aG9ycy5qb2luKCcsICcpO1xuXHRcdH1cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2ZpZWxkIGF1dGhvcnMnPlxuXHRcdFx0PGxhYmVsPmF1dGhvcnM8L2xhYmVsPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J3ZhbHVlJz5cblx0XHRcdFx0e3RleHR9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyU2hhcmVUb1JlZGRpdCA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucHJvcHMubWV0YWRhdGEuc2hhcmVJZCkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdmaWVsZCByZWRkaXQnPlxuXHRcdFx0PGxhYmVsPnJlZGRpdDwvbGFiZWw+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0ndmFsdWUnPlxuXHRcdFx0XHQ8YSBocmVmPXt0aGlzLmdldFJlZGRpdExpbmsoKX0gdGFyZ2V0PSdfYmxhbmsnIHJlbD0nbm9vcGVuZXIgbm9yZWZlcnJlcic+XG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9J3B1Ymxpc2gnPlxuXHRcdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1yZWRkaXQtYWxpZW4nIC8+IHNoYXJlIHRvIHJlZGRpdFxuXHRcdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQ8L2E+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J21ldGFkYXRhRWRpdG9yJz5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCB0aXRsZSc+XG5cdFx0XHRcdDxsYWJlbD50aXRsZTwvbGFiZWw+XG5cdFx0XHRcdDxpbnB1dCB0eXBlPSd0ZXh0JyBjbGFzc05hbWU9J3ZhbHVlJ1xuXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnByb3BzLm1ldGFkYXRhLnRpdGxlfVxuXHRcdFx0XHRcdG9uQ2hhbmdlPXsoZSk9PnRoaXMuaGFuZGxlRmllbGRDaGFuZ2UoJ3RpdGxlJywgZSl9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBkZXNjcmlwdGlvbic+XG5cdFx0XHRcdDxsYWJlbD5kZXNjcmlwdGlvbjwvbGFiZWw+XG5cdFx0XHRcdDx0ZXh0YXJlYSB2YWx1ZT17dGhpcy5wcm9wcy5tZXRhZGF0YS5kZXNjcmlwdGlvbn0gY2xhc3NOYW1lPSd2YWx1ZSdcblx0XHRcdFx0XHRvbkNoYW5nZT17KGUpPT50aGlzLmhhbmRsZUZpZWxkQ2hhbmdlKCdkZXNjcmlwdGlvbicsIGUpfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7Lyp9XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZmllbGQgdGFncyc+XG5cdFx0XHRcdDxsYWJlbD50YWdzPC9sYWJlbD5cblx0XHRcdFx0PHRleHRhcmVhIHZhbHVlPXt0aGlzLnByb3BzLm1ldGFkYXRhLnRhZ3N9XG5cdFx0XHRcdFx0b25DaGFuZ2U9eyhlKT0+dGhpcy5oYW5kbGVGaWVsZENoYW5nZSgndGFncycsIGUpfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQqL31cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2ZpZWxkIHN5c3RlbXMnPlxuXHRcdFx0XHQ8bGFiZWw+c3lzdGVtczwvbGFiZWw+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSd2YWx1ZSc+XG5cdFx0XHRcdFx0e3RoaXMucmVuZGVyU3lzdGVtcygpfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXG5cdFx0XHR7dGhpcy5yZW5kZXJBdXRob3JzKCl9XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBwdWJsaXNoJz5cblx0XHRcdFx0PGxhYmVsPnB1Ymxpc2g8L2xhYmVsPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0ndmFsdWUnPlxuXHRcdFx0XHRcdHt0aGlzLnJlbmRlclB1Ymxpc2goKX1cblx0XHRcdFx0XHQ8c21hbGw+UHVibGlzaGVkIGhvbWVicmV3cyB3aWxsIGJlIHB1YmxpY2x5IHZpZXdhYmxlIGFuZCBzZWFyY2hhYmxlIChldmVudHVhbGx5Li4uKTwvc21hbGw+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cblx0XHRcdHt0aGlzLnJlbmRlclNoYXJlVG9SZWRkaXQoKX1cblxuXHRcdFx0e3RoaXMucmVuZGVyRGVsZXRlKCl9XG5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFkYXRhRWRpdG9yO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuXG5jb25zdCBTbmlwcGV0cyA9IHJlcXVpcmUoJy4vc25pcHBldHMvc25pcHBldHMuanMnKTtcblxuY29uc3QgZXhlY3V0ZSA9IGZ1bmN0aW9uKHZhbCwgYnJldyl7XG5cdGlmKF8uaXNGdW5jdGlvbih2YWwpKSByZXR1cm4gdmFsKGJyZXcpO1xuXHRyZXR1cm4gdmFsO1xufTtcblxuXG5cbmNvbnN0IFNuaXBwZXRiYXIgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3ICAgICA6ICcnLFxuXHRcdFx0b25JbmplY3QgOiAoKT0+e30sXG5cdFx0XHRvblRvZ2dsZSA6ICgpPT57fSxcblx0XHRcdHNob3dtZXRhIDogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXG5cdGhhbmRsZVNuaXBwZXRDbGljayA6IGZ1bmN0aW9uKGluamVjdGVkVGV4dCl7XG5cdFx0dGhpcy5wcm9wcy5vbkluamVjdChpbmplY3RlZFRleHQpO1xuXHR9LFxuXG5cdHJlbmRlclNuaXBwZXRHcm91cHMgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBfLm1hcChTbmlwcGV0cywgKHNuaXBwZXRHcm91cCk9Pntcblx0XHRcdHJldHVybiA8U25pcHBldEdyb3VwXG5cdFx0XHRcdGJyZXc9e3RoaXMucHJvcHMuYnJld31cblx0XHRcdFx0Z3JvdXBOYW1lPXtzbmlwcGV0R3JvdXAuZ3JvdXBOYW1lfVxuXHRcdFx0XHRpY29uPXtzbmlwcGV0R3JvdXAuaWNvbn1cblx0XHRcdFx0c25pcHBldHM9e3NuaXBwZXRHcm91cC5zbmlwcGV0c31cblx0XHRcdFx0a2V5PXtzbmlwcGV0R3JvdXAuZ3JvdXBOYW1lfVxuXHRcdFx0XHRvblNuaXBwZXRDbGljaz17dGhpcy5oYW5kbGVTbmlwcGV0Q2xpY2t9XG5cdFx0XHQvPjtcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nc25pcHBldEJhcic+XG5cdFx0XHR7dGhpcy5yZW5kZXJTbmlwcGV0R3JvdXBzKCl9XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y3goJ3RvZ2dsZU1ldGEnLCB7IHNlbGVjdGVkOiB0aGlzLnByb3BzLnNob3dtZXRhIH0pfVxuXHRcdFx0XHRvbkNsaWNrPXt0aGlzLnByb3BzLm9uVG9nZ2xlfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1iYXJzJyAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTbmlwcGV0YmFyO1xuXG5cblxuXG5cblxuY29uc3QgU25pcHBldEdyb3VwID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyAgICAgICAgICAgOiAnJyxcblx0XHRcdGdyb3VwTmFtZSAgICAgIDogJycsXG5cdFx0XHRpY29uICAgICAgICAgICA6ICdmYS1yb2NrZXQnLFxuXHRcdFx0c25pcHBldHMgICAgICAgOiBbXSxcblx0XHRcdG9uU25pcHBldENsaWNrIDogZnVuY3Rpb24oKXt9LFxuXHRcdH07XG5cdH0sXG5cdGhhbmRsZVNuaXBwZXRDbGljayA6IGZ1bmN0aW9uKHNuaXBwZXQpe1xuXHRcdHRoaXMucHJvcHMub25TbmlwcGV0Q2xpY2soZXhlY3V0ZShzbmlwcGV0LmdlbiwgdGhpcy5wcm9wcy5icmV3KSk7XG5cdH0sXG5cdHJlbmRlclNuaXBwZXRzIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5tYXAodGhpcy5wcm9wcy5zbmlwcGV0cywgKHNuaXBwZXQpPT57XG5cdFx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3NuaXBwZXQnIGtleT17c25pcHBldC5uYW1lfSBvbkNsaWNrPXsoKT0+dGhpcy5oYW5kbGVTbmlwcGV0Q2xpY2soc25pcHBldCl9PlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9e2BmYSBmYS1mdyAke3NuaXBwZXQuaWNvbn1gfSAvPlxuXHRcdFx0XHR7c25pcHBldC5uYW1lfVxuXHRcdFx0PC9kaXY+O1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdzbmlwcGV0R3JvdXAnPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J3RleHQnPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9e2BmYSBmYS1mdyAke3RoaXMucHJvcHMuaWNvbn1gfSAvPlxuXHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9J2dyb3VwTmFtZSc+e3RoaXMucHJvcHMuZ3JvdXBOYW1lfTwvc3Bhbj5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2Ryb3Bkb3duJz5cblx0XHRcdFx0e3RoaXMucmVuZGVyU25pcHBldHMoKX1cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fSxcblxufSk7IiwiY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNsYXNzbmFtZSl7XG5cblx0Y2xhc3NuYW1lID0gXy5zYW1wbGUoWydhcmNoaXZpc3QnLCAnZmFuY3ltYW4nLCAnbGluZ3Vpc3QnLCAnZmxldGNoZXInLFxuXHRcdCdub3RhcnknLCAnYmVyc2Vya2VyLXR5cGlzdCcsICdmaXNobW9uZ2VyZXInLCAnbWFuaWN1cmlzdCcsICdoYWJlcmRhc2hlcicsICdjb25jaWVyZ2UnXSk7XG5cblx0Y2xhc3NuYW1lID0gY2xhc3NuYW1lLnRvTG93ZXJDYXNlKCk7XG5cblx0Y29uc3QgaGl0RGllID0gXy5zYW1wbGUoWzQsIDYsIDgsIDEwLCAxMl0pO1xuXG5cdGNvbnN0IGFiaWxpdHlMaXN0ID0gWydTdHJlbmd0aCcsICdEZXhlcml0eScsICdDb25zdGl0dXRpb24nLCAnV2lzZG9tJywgJ0NoYXJpc21hJywgJ0ludGVsbGlnZW5jZSddO1xuXHRjb25zdCBza2lsbExpc3QgPSBbJ0Fjcm9iYXRpY3MgJywgJ0FuaW1hbCBIYW5kbGluZycsICdBcmNhbmEnLCAnQXRobGV0aWNzJywgJ0RlY2VwdGlvbicsICdIaXN0b3J5JywgJ0luc2lnaHQnLCAnSW50aW1pZGF0aW9uJywgJ0ludmVzdGlnYXRpb24nLCAnTWVkaWNpbmUnLCAnTmF0dXJlJywgJ1BlcmNlcHRpb24nLCAnUGVyZm9ybWFuY2UnLCAnUGVyc3Vhc2lvbicsICdSZWxpZ2lvbicsICdTbGVpZ2h0IG9mIEhhbmQnLCAnU3RlYWx0aCcsICdTdXJ2aXZhbCddO1xuXG5cblx0cmV0dXJuIFtcblx0XHQnIyMgQ2xhc3MgRmVhdHVyZXMnLFxuXHRcdGBBcyBhICR7Y2xhc3NuYW1lfSwgeW91IGdhaW4gdGhlIGZvbGxvd2luZyBjbGFzcyBmZWF0dXJlc2AsXG5cdFx0JyMjIyMgSGl0IFBvaW50cycsXG5cdFx0J19fXycsXG5cdFx0YC0gKipIaXQgRGljZToqKiAxZCR7aGl0RGllfSBwZXIgJHtjbGFzc25hbWV9IGxldmVsYCxcblx0XHRgLSAqKkhpdCBQb2ludHMgYXQgMXN0IExldmVsOioqICR7aGl0RGllfSArIHlvdXIgQ29uc3RpdHV0aW9uIG1vZGlmaWVyYCxcblx0XHRgLSAqKkhpdCBQb2ludHMgYXQgSGlnaGVyIExldmVsczoqKiAxZCR7aGl0RGllfSAob3IgJHtoaXREaWUvMiArIDF9KSArIHlvdXIgQ29uc3RpdHV0aW9uIG1vZGlmaWVyIHBlciAke2NsYXNzbmFtZX0gbGV2ZWwgYWZ0ZXIgMXN0YCxcblx0XHQnJyxcblx0XHQnIyMjIyBQcm9maWNpZW5jaWVzJyxcblx0XHQnX19fJyxcblx0XHRgLSAqKkFybW9yOioqICR7Xy5zYW1wbGVTaXplKFsnTGlnaHQgYXJtb3InLCAnTWVkaXVtIGFybW9yJywgJ0hlYXZ5IGFybW9yJywgJ1NoaWVsZHMnXSwgXy5yYW5kb20oMCwgMykpLmpvaW4oJywgJykgfHwgJ05vbmUnfWAsXG5cdFx0YC0gKipXZWFwb25zOioqICR7Xy5zYW1wbGVTaXplKFsnU3F1ZWVnZWUnLCAnUnViYmVyIENoaWNrZW4nLCAnU2ltcGxlIHdlYXBvbnMnLCAnTWFydGlhbCB3ZWFwb25zJ10sIF8ucmFuZG9tKDAsIDIpKS5qb2luKCcsICcpIHx8ICdOb25lJ31gLFxuXHRcdGAtICoqVG9vbHM6KiogJHtfLnNhbXBsZVNpemUoWydBcnRpYW5cXCdzIHRvb2xzJywgJ29uZSBtdXNpY2FsIGluc3RydW1lbnQnLCAnVGhpZXZlXFwncyB0b29scyddLCBfLnJhbmRvbSgwLCAyKSkuam9pbignLCAnKSB8fCAnTm9uZSd9YCxcblx0XHQnJyxcblx0XHQnX19fJyxcblx0XHRgLSAqKlNhdmluZyBUaHJvd3M6KiogJHtfLnNhbXBsZVNpemUoYWJpbGl0eUxpc3QsIDIpLmpvaW4oJywgJyl9YCxcblx0XHRgLSAqKlNraWxsczoqKiBDaG9vc2UgdHdvIGZyb20gJHtfLnNhbXBsZVNpemUoc2tpbGxMaXN0LCBfLnJhbmRvbSg0LCA2KSkuam9pbignLCAnKX1gLFxuXHRcdCcnLFxuXHRcdCcjIyMjIEVxdWlwbWVudCcsXG5cdFx0J1lvdSBzdGFydCB3aXRoIHRoZSBmb2xsb3dpbmcgZXF1aXBtZW50LCBpbiBhZGRpdGlvbiB0byB0aGUgZXF1aXBtZW50IGdyYW50ZWQgYnkgeW91ciBiYWNrZ3JvdW5kOicsXG5cdFx0Jy0gKihhKSogYSBtYXJ0aWFsIHdlYXBvbiBhbmQgYSBzaGllbGQgb3IgKihiKSogdHdvIG1hcnRpYWwgd2VhcG9ucycsXG5cdFx0Jy0gKihhKSogZml2ZSBqYXZlbGlucyBvciAqKGIpKiBhbnkgc2ltcGxlIG1lbGVlIHdlYXBvbicsXG5cdFx0YC0gJHtfLnNhbXBsZShbJzEwIGxpbnQgZmx1ZmZzJywgJzEgYnV0dG9uJywgJ2EgY2hlcmlzaGVkIGxvc3Qgc29jayddKX1gLFxuXHRcdCdcXG5cXG5cXG4nXG5cdF0uam9pbignXFxuJyk7XG59O1xuIiwiY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jb25zdCBmZWF0dXJlcyA9IFtcblx0J0FzdHJvbG9naWNhbCBCb3RhbnknLFxuXHQnQXN0cm9sb2dpY2FsIENoZW1pc3RyeScsXG5cdCdCaW9jaGVtaWNhbCBTb3JjZXJ5Jyxcblx0J0NpdmlsIEFsY2hlbXknLFxuXHQnQ29uc2VjcmF0ZWQgQmlvY2hlbWlzdHJ5Jyxcblx0J0RlbW9uaWMgQW50aHJvcG9sb2d5Jyxcblx0J0RpdmluYXRvcnkgTWluZXJhbG9neScsXG5cdCdHZW5ldGljIEJhbmlzaGluZycsXG5cdCdIZXJtZXRpYyBHZW9ncmFwaHknLFxuXHQnSW1tdW5vbG9naWNhbCBJbmNhbnRhdGlvbnMnLFxuXHQnTnVjbGVhciBJbGx1c2lvbmlzbScsXG5cdCdSaXR1YWwgQXN0cm9ub215Jyxcblx0J1NlaXNtb2xvZ2ljYWwgRGl2aW5hdGlvbicsXG5cdCdTcGlyaXR1YWwgQmlvY2hlbWlzdHJ5Jyxcblx0J1N0YXRpc3RpY2FsIE9jY3VsdGlzbScsXG5cdCdQb2xpY2UgTmVjcm9tYW5jZXInLFxuXHQnU2l4Z3VuIFBvaXNvbmVyJyxcblx0J1BoYXJtYWNldXRpY2FsIEd1bnNsaW5nZXInLFxuXHQnSW5mZXJuYWwgQmFua2VyJyxcblx0J1NwZWxsIEFuYWx5c3QnLFxuXHQnR3Vuc2xpbmdlciBDb3JydXB0b3InLFxuXHQnVG9ycXVlIEludGVyZmFjZXInLFxuXHQnRXhvIEludGVyZmFjZXInLFxuXHQnR3VucG93ZGVyIFRvcnR1cmVyJyxcblx0J09yYml0YWwgR3JhdmVkaWdnZXInLFxuXHQnUGhhc2VkIExpbmd1aXN0Jyxcblx0J01hdGhlbWF0aWNhbCBQaGFybWFjaXN0Jyxcblx0J1BsYXNtYSBPdXRsYXcnLFxuXHQnTWFsZWZpYyBDaGVtaXN0Jyxcblx0J1BvbGljZSBDdWx0aXN0J1xuXTtcblxuY29uc3QgY2xhc3NuYW1lcyA9IFsnQXJjaGl2aXN0JywgJ0ZhbmN5bWFuJywgJ0xpbmd1aXN0JywgJ0ZsZXRjaGVyJyxcblx0J05vdGFyeScsICdCZXJzZXJrZXItVHlwaXN0JywgJ0Zpc2htb25nZXJlcicsICdNYW5pY3VyaXN0JywgJ0hhYmVyZGFzaGVyJywgJ0NvbmNpZXJnZSddO1xuXG5jb25zdCBsZXZlbHMgPSBbJzFzdCcsICcybmQnLCAnM3JkJywgJzR0aCcsICc1dGgnLCAnNnRoJywgJzd0aCcsICc4dGgnLCAnOXRoJywgJzEwdGgnLCAnMTF0aCcsICcxMnRoJywgJzEzdGgnLCAnMTR0aCcsICcxNXRoJywgJzE2dGgnLCAnMTd0aCcsICcxOHRoJywgJzE5dGgnLCAnMjB0aCddO1xuXG5jb25zdCBwcm9mQm9udXMgPSBbMiwgMiwgMiwgMiwgMywgMywgMywgMywgNCwgNCwgNCwgNCwgNSwgNSwgNSwgNSwgNiwgNiwgNiwgNl07XG5cbmNvbnN0IGdldEZlYXR1cmUgPSAobGV2ZWwpPT57XG5cdGxldCByZXMgPSBbXTtcblx0aWYoXy5pbmNsdWRlcyhbNCwgNiwgOCwgMTIsIDE0LCAxNiwgMTldLCBsZXZlbCsxKSl7XG5cdFx0cmVzID0gWydBYmlsaXR5IFNjb3JlIEltcHJvdmVtZW50J107XG5cdH1cblx0cmVzID0gXy51bmlvbihyZXMsIF8uc2FtcGxlU2l6ZShmZWF0dXJlcywgXy5zYW1wbGUoWzAsIDEsIDEsIDEsIDEsIDFdKSkpO1xuXHRpZighcmVzLmxlbmd0aCkgcmV0dXJuICfilIAnO1xuXHRyZXR1cm4gcmVzLmpvaW4oJywgJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0ZnVsbCA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgY2xhc3NuYW1lID0gXy5zYW1wbGUoY2xhc3NuYW1lcyk7XG5cblx0XHRjb25zdCBtYXhlcyA9IFs0LCAzLCAzLCAzLCAzLCAyLCAyLCAxLCAxXTtcblx0XHRjb25zdCBkcmF3U2xvdHMgPSBmdW5jdGlvbihTbG90cyl7XG5cdFx0XHRsZXQgc2xvdHMgPSBOdW1iZXIoU2xvdHMpO1xuXHRcdFx0cmV0dXJuIF8udGltZXMoOSwgZnVuY3Rpb24oaSl7XG5cdFx0XHRcdGNvbnN0IG1heCA9IG1heGVzW2ldO1xuXHRcdFx0XHRpZihzbG90cyA8IDEpIHJldHVybiAn4oCUJztcblx0XHRcdFx0Y29uc3QgcmVzID0gXy5taW4oW21heCwgc2xvdHNdKTtcblx0XHRcdFx0c2xvdHMgLT0gcmVzO1xuXHRcdFx0XHRyZXR1cm4gcmVzO1xuXHRcdFx0fSkuam9pbignIHwgJyk7XG5cdFx0fTtcblxuXG5cdFx0bGV0IGNhbnRyaXBzID0gMztcblx0XHRsZXQgc3BlbGxzID0gMTtcblx0XHRsZXQgc2xvdHMgPSAyO1xuXHRcdHJldHVybiBgPGRpdiBjbGFzcz0nY2xhc3NUYWJsZSB3aWRlJz5cXG4jIyMjIyBUaGUgJHtjbGFzc25hbWV9XFxuYCArXG5cdFx0YHwgTGV2ZWwgfCBQcm9maWNpZW5jeSBCb251cyB8IEZlYXR1cmVzIHwgQ2FudHJpcHMgS25vd24gfCBTcGVsbHMgS25vd24gfCAxc3QgfCAybmQgfCAzcmQgfCA0dGggfCA1dGggfCA2dGggfCA3dGggfCA4dGggfCA5dGggfFxcbmArXG5cdFx0YHw6LS0tOnw6LS0tOnw6LS0tfDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fFxcbiR7XG5cdFx0XHRfLm1hcChsZXZlbHMsIGZ1bmN0aW9uKGxldmVsTmFtZSwgbGV2ZWwpe1xuXHRcdFx0XHRjb25zdCByZXMgPSBbXG5cdFx0XHRcdFx0bGV2ZWxOYW1lLFxuXHRcdFx0XHRcdGArJHtwcm9mQm9udXNbbGV2ZWxdfWAsXG5cdFx0XHRcdFx0Z2V0RmVhdHVyZShsZXZlbCksXG5cdFx0XHRcdFx0Y2FudHJpcHMsXG5cdFx0XHRcdFx0c3BlbGxzLFxuXHRcdFx0XHRcdGRyYXdTbG90cyhzbG90cylcblx0XHRcdFx0XS5qb2luKCcgfCAnKTtcblxuXHRcdFx0XHRjYW50cmlwcyArPSBfLnJhbmRvbSgwLCAxKTtcblx0XHRcdFx0c3BlbGxzICs9IF8ucmFuZG9tKDAsIDEpO1xuXHRcdFx0XHRzbG90cyArPSBfLnJhbmRvbSgwLCAyKTtcblxuXHRcdFx0XHRyZXR1cm4gYHwgJHtyZXN9IHxgO1xuXHRcdFx0fSkuam9pbignXFxuJyl9XFxuPC9kaXY+XFxuXFxuYDtcblx0fSxcblxuXHRoYWxmIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBjbGFzc25hbWUgPSAgXy5zYW1wbGUoY2xhc3NuYW1lcyk7XG5cblx0XHRsZXQgZmVhdHVyZVNjb3JlID0gMTtcblx0XHRyZXR1cm4gYDxkaXYgY2xhc3M9J2NsYXNzVGFibGUnPlxcbiMjIyMjIFRoZSAke2NsYXNzbmFtZX1cXG5gICtcblx0XHRgfCBMZXZlbCB8IFByb2ZpY2llbmN5IEJvbnVzIHwgRmVhdHVyZXMgfCAke18uc2FtcGxlKGZlYXR1cmVzKX18XFxuYCArXG5cdFx0YHw6LS0tOnw6LS0tOnw6LS0tfDotLS06fFxcbiR7XG5cdFx0XHRfLm1hcChsZXZlbHMsIGZ1bmN0aW9uKGxldmVsTmFtZSwgbGV2ZWwpe1xuXHRcdFx0XHRjb25zdCByZXMgPSBbXG5cdFx0XHRcdFx0bGV2ZWxOYW1lLFxuXHRcdFx0XHRcdGArJHtwcm9mQm9udXNbbGV2ZWxdfWAsXG5cdFx0XHRcdFx0Z2V0RmVhdHVyZShsZXZlbCksXG5cdFx0XHRcdFx0YCske2ZlYXR1cmVTY29yZX1gXG5cdFx0XHRcdF0uam9pbignIHwgJyk7XG5cblx0XHRcdFx0ZmVhdHVyZVNjb3JlICs9IF8ucmFuZG9tKDAsIDEpO1xuXG5cdFx0XHRcdHJldHVybiBgfCAke3Jlc30gfGA7XG5cdFx0XHR9KS5qb2luKCdcXG4nKX1cXG48L2Rpdj5cXG5cXG5gO1xuXHR9XG59OyIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3QgdGl0bGVzID0gW1xuXHQnVGhlIEJ1cm5pbmcgR2FsbG93cycsXG5cdCdUaGUgUmluZyBvZiBOZW5sYXN0Jyxcblx0J0JlbG93IHRoZSBCbGluZCBUYXZlcm4nLFxuXHQnQmVsb3cgdGhlIEh1bmdlcmluZyBSaXZlcicsXG5cdCdCZWZvcmUgQmFoYW11dFxcJ3MgTGFuZCcsXG5cdCdUaGUgQ3J1ZWwgR3JhdmUgZnJvbSBXaXRoaW4nLFxuXHQnVGhlIFN0cmVuZ3RoIG9mIFRyYWRlIFJvYWQnLFxuXHQnVGhyb3VnaCBUaGUgUmF2ZW4gUXVlZW5cXCdzIFdvcmxkcycsXG5cdCdXaXRoaW4gdGhlIFNldHRsZW1lbnQnLFxuXHQnVGhlIENyb3duIGZyb20gV2l0aGluJyxcblx0J1RoZSBNZXJjaGFudCBXaXRoaW4gdGhlIEJhdHRsZWZpZWxkJyxcblx0J0lvdW5cXCdzIEZhZGluZyBUcmF2ZWxlcicsXG5cdCdUaGUgTGVnaW9uIEluZ3JlZGllbnQnLFxuXHQnVGhlIEV4cGxvcmVyIEx1cmUnLFxuXHQnQmVmb3JlIHRoZSBDaGFybWluZyBCYWRsYW5kcycsXG5cdCdUaGUgTGl2aW5nIERlYWQgQWJvdmUgdGhlIEZlYXJmdWwgQ2FnZScsXG5cdCdWZWNuYVxcJ3MgSGlkZGVuIFNhZ2UnLFxuXHQnQmFoYW11dFxcJ3MgRGVtb25zcGF3bicsXG5cdCdBY3Jvc3MgR3J1dW1zaFxcJ3MgRWxlbWVudGFsIENoYW9zJyxcblx0J1RoZSBCbGFkZSBvZiBPcmN1cycsXG5cdCdCZXlvbmQgUmV2ZW5nZScsXG5cdCdCcmFpbiBvZiBJbnNhbml0eScsXG5cdCdCcmVlZCBCYXR0bGUhLCBBIE5ldyBCZWdpbm5pbmcnLFxuXHQnRXZpbCBMYWtlLCBBIE5ldyBCZWdpbm5pbmcnLFxuXHQnSW52YXNpb24gb2YgdGhlIEdpZ2FudGljIENhdCwgUGFydCBJSScsXG5cdCdLcmFrZW4gV2FyIDIwMjAnLFxuXHQnVGhlIEJvZHkgV2hpc3BlcmVycycsXG5cdCdUaGUgRGlhYm9saWNhbCBUYWxlcyBvZiB0aGUgQXBlLVdvbWVuJyxcblx0J1RoZSBEb2N0b3IgSW1tb3J0YWwnLFxuXHQnVGhlIERvY3RvciBmcm9tIEhlYXZlbicsXG5cdCdUaGUgR3JhdmV5YXJkJyxcblx0J0F6dXJlIENvcmUnLFxuXHQnQ29yZSBCYXR0bGUnLFxuXHQnQ29yZSBvZiBIZWF2ZW46IFRoZSBHdWFyZGlhbiBvZiBBbWF6ZW1lbnQnLFxuXHQnRGVhZGx5IEFtYXplbWVudCBJSUknLFxuXHQnRHJ5IENoYW9zIElYJyxcblx0J0dhdGUgVGh1bmRlcicsXG5cdCdHdWFyZGlhbjogU2tpZXMgb2YgdGhlIERhcmsgV2l6YXJkJyxcblx0J0x1dGUgb2YgRXRlcm5pdHknLFxuXHQnTWVyY3VyeVxcJ3MgUGxhbmV0OiBCcmF2ZSBFdm9sdXRpb24nLFxuXHQnUnVieSBvZiBBdGxhbnRpczogVGhlIFF1YWtlIG9mIFBlYWNlJyxcblx0J1NreSBvZiBaZWxkYTogVGhlIFRodW5kZXIgb2YgRm9yY2UnLFxuXHQnVnlzZVxcJ3MgU2tpZXMnLFxuXHQnV2hpdGUgR3JlYXRuZXNzIElJSScsXG5cdCdZZWxsb3cgRGl2aW5pdHknLFxuXHQnWmlkYW5lXFwncyBHaG9zdCdcbl07XG5cbmNvbnN0IHN1YnRpdGxlcyA9IFtcblx0J0luIGFuIG9taW5vdXMgdW5pdmVyc2UsIGEgYm90YW5pc3Qgb3Bwb3NlcyB0ZXJyb3Jpc20uJyxcblx0J0luIGEgZGVtb24taGF1bnRlZCBjaXR5LCBpbiBhbiBhZ2Ugb2YgbGllcyBhbmQgaGF0ZSwgYSBwaHlzaWNpc3QgdHJpZXMgdG8gZmluZCBhbiBhbmNpZW50IHRyZWFzdXJlIGFuZCBiYXR0bGVzIGEgbW9iIG9mIGFsaWVucy4nLFxuXHQnSW4gYSBsYW5kIG9mIGNvcnJ1cHRpb24sIHR3byBjeWJlcm5ldGljaXN0cyBhbmQgYSBkdW5nZW9uIGRlbHZlciBzZWFyY2ggZm9yIGZyZWVkb20uJyxcblx0J0luIGFuIGV2aWwgZW1waXJlIG9mIGhvcnJvciwgdHdvIHJhbmdlcnMgYmF0dGxlIHRoZSBmb3JjZXMgb2YgaGVsbC4nLFxuXHQnSW4gYSBsb3N0IGNpdHksIGluIGFuIGFnZSBvZiBzb3JjZXJ5LCBhIGxpYnJhcmlhbiBxdWVzdHMgZm9yIHJldmVuZ2UuJyxcblx0J0luIGEgdW5pdmVyc2Ugb2YgaWxsdXNpb25zIGFuZCBkYW5nZXIsIHRocmVlIHRpbWUgdHJhdmVsbGVycyBhbmQgYW4gYWR2ZW50dXJlciBzZWFyY2ggZm9yIGp1c3RpY2UuJyxcblx0J0luIGEgZm9yZ290dGVuIHVuaXZlcnNlIG9mIGJhcmJhcmlzbSwgaW4gYW4gZXJhIG9mIHRlcnJvciBhbmQgbXlzdGljaXNtLCBhIHZpcnR1YWwgcmVhbGl0eSBwcm9ncmFtbWVyIGFuZCBhIHNweSB0cnkgdG8gZmluZCB2ZW5nYW5jZSBhbmQgYmF0dGxlIGNyaW1lLicsXG5cdCdJbiBhIHVuaXZlcnNlIG9mIGRlbW9ucywgaW4gYW4gZXJhIG9mIGluc2FuaXR5IGFuZCBnaG9zdHMsIHRocmVlIGJvZHlndWFyZHMgYW5kIGEgYm9keWd1YXJkIHRyeSB0byBmaW5kIHZlbmdhbmNlLicsXG5cdCdJbiBhIGtpbmdkb20gb2YgY29ycnVwdGlvbiBhbmQgYmF0dGxlLCBzZXZlbiBhcnRpZmljaWFsIGludGVsbGlnZW5jZXMgdHJ5IHRvIHNhdmUgdGhlIGxhc3QgbGl2aW5nIGZlcnRpbGUgd29tYW4uJyxcblx0J0luIGEgdW5pdmVyc2Ugb2YgdmlydXRhbCByZWFsaXR5IGFuZCBhZ29ueSwgaW4gYW4gYWdlIG9mIGdob3N0cyBhbmQgZ2hvc3RzLCBhIGZvcnR1bmUtdGVsbGVyIGFuZCBhIHdhbmRlcmVyIHRyeSB0byBhdmVydCB0aGUgYXBvY2FseXBzZS4nLFxuXHQnSW4gYSBjcmltZS1pbmZlc3RlZCBraW5nZG9tLCB0aHJlZSBtYXJ0aWFsIGFydGlzdHMgcXVlc3QgZm9yIHRoZSB0cnV0aCBhbmQgb3Bwb3NlIGV2aWwuJyxcblx0J0luIGEgdGVycmlmeWluZyB1bml2ZXJzZSBvZiBsb3N0IHNvdWxzLCBpbiBhbiBlcmEgb2YgbG9zdCBzb3VscywgZWlnaHQgZGFuY2VycyBmaWdodCBldmlsLicsXG5cdCdJbiBhIGdhbGF4eSBvZiBjb25mdXNpb24gYW5kIGluc2FuaXR5LCB0aHJlZSBtYXJ0aWFsIGFydGlzdHMgYW5kIGEgZHVrZSBiYXR0bGUgYSBtb2Igb2YgcHN5Y2hpY3MuJyxcblx0J0luIGFuIGFtYXppbmcga2luZ2RvbSwgYSB3aXphcmQgYW5kIGEgc2VjcmV0YXJ5IGhvcGUgdG8gcHJldmVudCB0aGUgZGVzdHJ1Y3Rpb24gb2YgbWFua2luZC4nLFxuXHQnSW4gYSBraW5nZG9tIG9mIGRlY2VwdGlvbiwgYSByZXBvcnRlciBzZWFyY2hlcyBmb3IgZmFtZS4nLFxuXHQnSW4gYSBoZWxsaXNoIGVtcGlyZSwgYSBzd29yZHN3b21hbiBhbmQgYSBkdWtlIHRyeSB0byBmaW5kIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIGJhdHRsZSBhIGNvbnNwaXJhY3kuJyxcblx0J0luIGFuIGV2aWwgZ2FsYXh5IG9mIGlsbHVzaW9uLCBpbiBhIHRpbWUgb2YgdGVjaG5vbG9neSBhbmQgbWlzZXJ5LCBzZXZlbiBwc3ljaGlhdHJpc3RzIGJhdHRsZSBjcmltZS4nLFxuXHQnSW4gYSBkYXJrIGNpdHkgb2YgY29uZnVzaW9uLCB0aHJlZSBzd29yZHN3b21lbiBhbmQgYSBzaW5nZXIgYmF0dGxlIGxhd2xlc3NuZXNzLicsXG5cdCdJbiBhbiBvbWlub3VzIGVtcGlyZSwgaW4gYW4gYWdlIG9mIGhhdGUsIHR3byBwaGlsb3NvcGhlcnMgYW5kIGEgc3R1ZGVudCB0cnkgdG8gZmluZCBqdXN0aWNlIGFuZCBiYXR0bGUgYSBtb2Igb2YgbWFnZXMgaW50ZW50IG9uIHN0ZWFsaW5nIHRoZSBzb3VscyBvZiB0aGUgaW5ub2NlbnQuJyxcblx0J0luIGEga2luZ2RvbSBvZiBwYW5pYywgc2l4IGFkdmVudHVyZXJzIG9wcG9zZSBsYXdsZXNzbmVzcy4nLFxuXHQnSW4gYSBsYW5kIG9mIGRyZWFtcyBhbmQgaG9wZWxlc3NuZXNzLCB0aHJlZSBoYWNrZXJzIGFuZCBhIGN5Ym9yZyBzZWFyY2ggZm9yIGp1c3RpY2UuJyxcblx0J09uIGEgcGxhbmV0IG9mIG15c3RpY2lzbSwgdGhyZWUgdHJhdmVsZXJzIGFuZCBhIGZpcmUgZmlnaHRlciBxdWVzdCBmb3IgdGhlIHVsdGltYXRlIHdlYXBvbiBhbmQgb3Bwb3NlIGV2aWwuJyxcblx0J0luIGEgd2lja2VkIHVuaXZlcnNlLCBmaXZlIHNlZXJzIGZpZ2h0IGxhd2xlc3NuZXNzLicsXG5cdCdJbiBhIGtpbmdkb20gb2YgZGVhdGgsIGluIGFuIGVyYSBvZiBpbGx1c2lvbiBhbmQgYmxvb2QsIGZvdXIgY29sb25pc3RzIHNlYXJjaCBmb3IgZmFtZS4nLFxuXHQnSW4gYW4gYW1hemluZyBraW5nZG9tLCBpbiBhbiBhZ2Ugb2Ygc29yY2VyeSBhbmQgbG9zdCBzb3VscywgZWlnaHQgc3BhY2UgcGlyYXRlcyBxdWVzdCBmb3IgZnJlZWRvbS4nLFxuXHQnSW4gYSBjdXJzZWQgZW1waXJlLCBmaXZlIGludmVudG9ycyBvcHBvc2UgdGVycm9yaXNtLicsXG5cdCdPbiBhIGNyaW1lLXJpZGRlbiBwbGFuZXQgb2YgY29uc3BpcmFjeSwgYSB3YXRjaG1hbiBhbmQgYW4gYXJ0aWZpY2lhbCBpbnRlbGxpZ2VuY2UgdHJ5IHRvIGZpbmQgbG92ZSBhbmQgb3Bwb3NlIGxhd2xlc3NuZXNzLicsXG5cdCdJbiBhIGZvcmdvdHRlbiBsYW5kLCBhIHJlcG9ydGVyIGFuZCBhIHNweSB0cnkgdG8gc3RvcCB0aGUgYXBvY2FseXBzZS4nLFxuXHQnSW4gYSBmb3JiaWRkZW4gbGFuZCBvZiBwcm9waGVjeSwgYSBzY2llbnRpc3QgYW5kIGFuIGFyY2hpdmlzdCBvcHBvc2UgYSBjYWJhbCBvZiBiYXJiYXJpYW5zIGludGVudCBvbiBzdGVhbGluZyB0aGUgc291bHMgb2YgdGhlIGlubm9jZW50LicsXG5cdCdPbiBhbiBpbmZlcm5hbCB3b3JsZCBvZiBpbGx1c2lvbiwgYSBncmF2ZSByb2JiZXIgYW5kIGEgd2F0Y2htYW4gdHJ5IHRvIGZpbmQgcmV2ZW5nZSBhbmQgY29tYmF0IGEgc3luZGljYXRlIG9mIG1hZ2VzIGludGVudCBvbiBzdGVhbGluZyB0aGUgc291cmNlIG9mIGFsbCBtYWdpYy4nLFxuXHQnSW4gYSBnYWxheHkgb2YgZGFyayBtYWdpYywgZm91ciBmaWdodGVycyBzZWVrIGZyZWVkb20uJyxcblx0J0luIGFuIGVtcGlyZSBvZiBkZWNlcHRpb24sIHNpeCB0b21iLXJvYmJlcnMgcXVlc3QgZm9yIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIGNvbWJhdCBhbiBhcm15IG9mIHJhaWRlcnMuJyxcblx0J0luIGEga2luZ2RvbSBvZiBjb3JydXB0aW9uIGFuZCBsb3N0IHNvdWxzLCBpbiBhbiBhZ2Ugb2YgcGFuaWMsIGVpZ2h0IHBsYW5ldG9sb2dpc3RzIG9wcG9zZSBldmlsLicsXG5cdCdJbiBhIGdhbGF4eSBvZiBtaXNlcnkgYW5kIGhvcGVsZXNzbmVzcywgaW4gYSB0aW1lIG9mIGFnb255IGFuZCBwYWluLCBmaXZlIHBsYW5ldG9sb2dpc3RzIHNlYXJjaCBmb3IgdmVuZ2FuY2UuJyxcblx0J0luIGEgdW5pdmVyc2Ugb2YgdGVjaG5vbG9neSBhbmQgaW5zYW5pdHksIGluIGEgdGltZSBvZiBzb3JjZXJ5LCBhIGNvbXB1dGVyIHRlY2hpY2lhbiBxdWVzdHMgZm9yIGhvcGUuJyxcblx0J09uIGEgcGxhbmV0IG9mIGRhcmsgbWFnaWMgYW5kIGJhcmJhcmlzbSwgaW4gYW4gYWdlIG9mIGhvcnJvciBhbmQgYmxhc3BoZW15LCBzZXZlbiBsaWJyYXJpYW5zIHNlYXJjaCBmb3IgZmFtZS4nLFxuXHQnSW4gYW4gZW1waXJlIG9mIGRhcmsgbWFnaWMsIGluIGEgdGltZSBvZiBibG9vZCBhbmQgaWxsdXNpb25zLCBmb3VyIG1vbmtzIHRyeSB0byBmaW5kIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIGNvbWJhdCB0ZXJyb3Jpc20uJyxcblx0J0luIGEgZm9yZ290dGVuIGVtcGlyZSBvZiBkYXJrIG1hZ2ljLCBzaXgga2luZ3MgdHJ5IHRvIHByZXZlbnQgdGhlIGRlc3RydWN0aW9uIG9mIG1hbmtpbmQuJyxcblx0J0luIGEgZ2FsYXh5IG9mIGRhcmsgbWFnaWMgYW5kIGhvcnJvciwgaW4gYW4gYWdlIG9mIGhvcGVsZXNzbmVzcywgZm91ciBtYXJpbmVzIGFuZCBhbiBvdXRsYXcgY29tYmF0IGV2aWwuJyxcblx0J0luIGEgbXlzdGVyaW91cyBjaXR5IG9mIGlsbHVzaW9uLCBpbiBhbiBhZ2Ugb2YgY29tcHV0ZXJpemF0aW9uLCBhIHdpdGNoLWh1bnRlciB0cmllcyB0byBmaW5kIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIG9wcG9zZXMgYW4gZXZpbCBjb3Jwb3JhdGlvbi4nLFxuXHQnSW4gYSBkYW1uZWQga2luZ2RvbSBvZiB0ZWNobm9sb2d5LCBhIHZpcnR1YWwgcmVhbGl0eSBwcm9ncmFtbWVyIGFuZCBhIGZpZ2h0ZXIgc2VlayBmYW1lLicsXG5cdCdJbiBhIGhlbGxpc2gga2luZ2RvbSwgaW4gYW4gYWdlIG9mIGJsYXNwaGVteSBhbmQgYmxhc3BoZW15LCBhbiBhc3Ryb2xvZ2VyIHNlYXJjaGVzIGZvciBmYW1lLicsXG5cdCdJbiBhIGRhbW5lZCB3b3JsZCBvZiBkZXZpbHMsIGFuIGFsaWVuIGFuZCBhIHJhbmdlciBxdWVzdCBmb3IgbG92ZSBhbmQgb3Bwb3NlIGEgc3luZGljYXRlIG9mIGRlbW9ucy4nLFxuXHQnSW4gYSBjdXJzZWQgZ2FsYXh5LCBpbiBhIHRpbWUgb2YgcGFpbiwgc2V2ZW4gbGlicmFyaWFucyBob3BlIHRvIGF2ZXJ0IHRoZSBhcG9jYWx5cHNlLicsXG5cdCdJbiBhIGNyaW1lLWluZmVzdGVkIGdhbGF4eSwgaW4gYW4gZXJhIG9mIGhvcGVsZXNzbmVzcyBhbmQgcGFuaWMsIHRocmVlIGNoYW1waW9ucyBhbmQgYSBncmF2ZSByb2JiZXIgdHJ5IHRvIHNvbHZlIHRoZSB1bHRpbWF0ZSBjcmltZS4nXG5dO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gKCk9Pntcblx0cmV0dXJuIGA8c3R5bGU+XG4gIC5hZ2UjcDF7IHRleHQtYWxpZ246Y2VudGVyOyB9XG4gIC5hZ2UjcDE6YWZ0ZXJ7IGRpc3BsYXk6bm9uZTsgfVxuICAmOm5vdCg6bnRoLWNoaWxkKDEpKSB7XG5cdCY6YWZ0ZXJ7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogQGhlYWRlclRleHRcblx0fVxuICB9XG5cbjwvc3R5bGU+XG5cbjxkaXYgc3R5bGU9J21hcmdpbi10b3A6NDUwcHg7Jz48L2Rpdj5cblxuIyAke18uc2FtcGxlKHRpdGxlcyl9XG5cbjxkaXYgc3R5bGU9J21hcmdpbi10b3A6MjVweCc+PC9kaXY+XG48ZGl2IGNsYXNzPSd3aWRlJz5cbiMjIyMjICR7Xy5zYW1wbGUoc3VidGl0bGVzKX1cbjwvZGl2PlxuXG5cXFxccGFnZWA7XG59OyIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3Qgc3BlbGxOYW1lcyA9IFtcblx0J0FzdHJhbCBSaXRlIG9mIEFjbmUnLFxuXHQnQ3JlYXRlIEFjbmUnLFxuXHQnQ3Vyc2VkIFJhbWVuIEVycnVwdGlvbicsXG5cdCdEYXJrIENoYW50IG9mIHRoZSBEZW50aXN0cycsXG5cdCdFcnJ1cHRpb24gb2YgSW1tYXR1cml0eScsXG5cdCdGbGFtaW5nIERpc2Mgb2YgSW5jb252ZW5pZW5jZScsXG5cdCdIZWFsIEJhZCBIeWdlbmUnLFxuXHQnSGVhdmVubHkgVHJhbnNmaWd1cmF0aW9uIG9mIHRoZSBDcmVhbSBEZXZpbCcsXG5cdCdIZWxsaXNoIENhZ2Ugb2YgTXVjdXMnLFxuXHQnSXJyaXRhdGUgUGVhbnV0IEJ1dHRlciBGYWlyeScsXG5cdCdMdW1pbm91cyBFcnJ1cHRpb24gb2YgVGVhJyxcblx0J015c3RpYyBTcGVsbCBvZiB0aGUgUG9zZXInLFxuXHQnU29yY2Vyb3VzIEVuY2hhbnRtZW50IG9mIHRoZSBDaGltbmV5c3dlZXAnLFxuXHQnU3RlYWsgU2F1Y2UgUmF5Jyxcblx0J1RhbGsgdG8gR3JvdXBpZScsXG5cdCdBc3RvbmlzaGluZyBDaGFudCBvZiBDaG9jb2xhdGUnLFxuXHQnQXN0b3VuZGluZyBQYXN0YSBQdWRkbGUnLFxuXHQnQmFsbCBvZiBBbm5veWFuY2UnLFxuXHQnQ2FnZSBvZiBZYXJuJyxcblx0J0NvbnRyb2wgTm9vZGxlcyBFbGVtZW50YWwnLFxuXHQnQ3JlYXRlIE5lcnZvdXNuZXNzJyxcblx0J0N1cmUgQmFsZG5lc3MnLFxuXHQnQ3Vyc2VkIFJpdHVhbCBvZiBCYWQgSGFpcicsXG5cdCdEaXNwZWxsIFBpbGVzIGluIERlbnRpc3QnLFxuXHQnRWxpbWluYXRlIEZsb3Jpc3RzJyxcblx0J0lsbHVzaW9uYXJ5IFRyYW5zZmlndXJhdGlvbiBvZiB0aGUgQmFieXNpdHRlcicsXG5cdCdOZWNyb21hbnRpYyBBcm1vciBvZiBTYWxhZCBEcmVzc2luZycsXG5cdCdPY2N1bHQgVHJhbnNmaWd1cmF0aW9uIG9mIEZvb3QgRmV0aXNoJyxcblx0J1Byb3RlY3Rpb24gZnJvbSBNdWN1cyBHaWFudCcsXG5cdCdUaW5zZWwgQmxhc3QnLFxuXHQnQWxjaGVtaWNhbCBFdm9jYXRpb24gb2YgdGhlIEdvdGhzJyxcblx0J0NhbGwgRmFuZ2lybCcsXG5cdCdEaXZpbmUgU3BlbGwgb2YgQ3Jvc3NkcmVzc2luZycsXG5cdCdEb21pbmF0ZSBSYW1lbiBHaWFudCcsXG5cdCdFbGltaW5hdGUgVmluZGljdGl2ZW5lc3MgaW4gR3ltIFRlYWNoZXInLFxuXHQnRXh0cmEtUGxhbmFyIFNwZWxsIG9mIElycml0YXRpb24nLFxuXHQnSW5kdWNlIFdoaW5pbmcgaW4gQmFieXNpdHRlcicsXG5cdCdJbnZva2UgQ29tcGxhaW5pbmcnLFxuXHQnTWFnaWNhbCBFbmNoYW50bWVudCBvZiBBcnJvZ2FuY2UnLFxuXHQnT2NjdWx0IEdsb2JlIG9mIFNhbGFkIERyZXNzaW5nJyxcblx0J092ZXJ3aGVsbWluZyBFbmNoYW50bWVudCBvZiB0aGUgQ2hvY29sYXRlIEZhaXJ5Jyxcblx0J1NvcmNlcm91cyBEYW5kcnVmZiBHbG9iZScsXG5cdCdTcGlyaXR1YWwgSW52b2NhdGlvbiBvZiB0aGUgQ29zdHVtZXJzJyxcblx0J1VsdGltYXRlIFJpdGUgb2YgdGhlIENvbmZldHRpIEFuZ2VsJyxcblx0J1VsdGltYXRlIFJpdHVhbCBvZiBNb3V0aHdhc2gnLFxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0c3BlbGxMaXN0IDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBsZXZlbHMgPSBbJ0NhbnRyaXBzICgwIExldmVsKScsICcybmQgTGV2ZWwnLCAnM3JkIExldmVsJywgJzR0aCBMZXZlbCcsICc1dGggTGV2ZWwnLCAnNnRoIExldmVsJywgJzd0aCBMZXZlbCcsICc4dGggTGV2ZWwnLCAnOXRoIExldmVsJ107XG5cblx0XHRjb25zdCBjb250ZW50ID0gXy5tYXAobGV2ZWxzLCAobGV2ZWwpPT57XG5cdFx0XHRjb25zdCBzcGVsbHMgPSBfLm1hcChfLnNhbXBsZVNpemUoc3BlbGxOYW1lcywgXy5yYW5kb20oNSwgMTUpKSwgKHNwZWxsKT0+e1xuXHRcdFx0XHRyZXR1cm4gYC0gJHtzcGVsbH1gO1xuXHRcdFx0fSkuam9pbignXFxuJyk7XG5cdFx0XHRyZXR1cm4gYCMjIyMjICR7bGV2ZWx9IFxcbiR7c3BlbGxzfSBcXG5gO1xuXHRcdH0pLmpvaW4oJ1xcbicpO1xuXG5cdFx0cmV0dXJuIGA8ZGl2IGNsYXNzPSdzcGVsbExpc3QnPlxcbiR7Y29udGVudH1cXG48L2Rpdj5gO1xuXHR9LFxuXG5cdHNwZWxsIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBsZXZlbCA9IFsnMXN0JywgJzJuZCcsICczcmQnLCAnNHRoJywgJzV0aCcsICc2dGgnLCAnN3RoJywgJzh0aCcsICc5dGgnXTtcblx0XHRjb25zdCBzcGVsbFNjaG9vbHMgPSBbJ2FianVyYXRpb24nLCAnY29uanVyYXRpb24nLCAnZGl2aW5hdGlvbicsICdlbmNoYW50bWVudCcsICdldm9jYXRpb24nLCAnaWxsdXNpb24nLCAnbmVjcm9tYW5jeScsICd0cmFuc211dGF0aW9uJ107XG5cblxuXHRcdGxldCBjb21wb25lbnRzID0gXy5zYW1wbGVTaXplKFsnVicsICdTJywgJ00nXSwgXy5yYW5kb20oMSwgMykpLmpvaW4oJywgJyk7XG5cdFx0aWYoY29tcG9uZW50cy5pbmRleE9mKCdNJykgIT09IC0xKXtcblx0XHRcdGNvbXBvbmVudHMgKz0gYCAoJHtfLnNhbXBsZVNpemUoWydhIHNtYWxsIGRvbGwnLCAnYSBjcnVzaGVkIGJ1dHRvbiB3b3J0aCBhdCBsZWFzdCAxY3AnLCAnZGlzY2FyZGVkIGd1bSB3cmFwcGVyJ10sIF8ucmFuZG9tKDEsIDMpKS5qb2luKCcsICcpfSlgO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXG5cdFx0XHRgIyMjIyAke18uc2FtcGxlKHNwZWxsTmFtZXMpfWAsXG5cdFx0XHRgKiR7Xy5zYW1wbGUobGV2ZWwpfS1sZXZlbCAke18uc2FtcGxlKHNwZWxsU2Nob29scyl9KmAsXG5cdFx0XHQnX19fJyxcblx0XHRcdCctICoqQ2FzdGluZyBUaW1lOioqIDEgYWN0aW9uJyxcblx0XHRcdGAtICoqUmFuZ2U6KiogJHtfLnNhbXBsZShbJ1NlbGYnLCAnVG91Y2gnLCAnMzAgZmVldCcsICc2MCBmZWV0J10pfWAsXG5cdFx0XHRgLSAqKkNvbXBvbmVudHM6KiogJHtjb21wb25lbnRzfWAsXG5cdFx0XHRgLSAqKkR1cmF0aW9uOioqICR7Xy5zYW1wbGUoWydVbnRpbCBkaXNwZWxsZWQnLCAnMSByb3VuZCcsICdJbnN0YW50YW5lb3VzJywgJ0NvbmNlbnRyYXRpb24sIHVwIHRvIDEwIG1pbnV0ZXMnLCAnMSBob3VyJ10pfWAsXG5cdFx0XHQnJyxcblx0XHRcdCdBIGZsYW1lLCBlcXVpdmFsZW50IGluIGJyaWdodG5lc3MgdG8gYSB0b3JjaCwgc3ByaW5ncyBmcm9tIGZyb20gYW4gb2JqZWN0IHRoYXQgeW91IHRvdWNoLiAnLFxuXHRcdFx0J1RoZSBlZmZlY3QgbG9vayBsaWtlIGEgcmVndWxhciBmbGFtZSwgYnV0IGl0IGNyZWF0ZXMgbm8gaGVhdCBhbmQgZG9lc25cXCd0IHVzZSBveHlnZW4uICcsXG5cdFx0XHQnQSAqY29udGludWFsIGZsYW1lKiBjYW4gYmUgY292ZXJlZCBvciBoaWRkZW4gYnV0IG5vdCBzbW90aGVyZWQgb3IgcXVlbmNoZWQuJyxcblx0XHRcdCdcXG5cXG5cXG4nXG5cdFx0XS5qb2luKCdcXG4nKTtcblx0fVxufTsiLCJjb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmNvbnN0IGdlbkxpc3QgPSBmdW5jdGlvbihsaXN0LCBtYXgpe1xuXHRyZXR1cm4gXy5zYW1wbGVTaXplKGxpc3QsIF8ucmFuZG9tKDAsIG1heCkpLmpvaW4oJywgJykgfHwgJ05vbmUnO1xufTtcblxuY29uc3QgZ2V0TW9uc3Rlck5hbWUgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gXy5zYW1wbGUoW1xuXHRcdCdBbGwtZGV2b3VyaW5nIEJhc2ViYWxsIEltcCcsXG5cdFx0J0FsbC1kZXZvdXJpbmcgR3VtZHJvcCBXcmFpdGgnLFxuXHRcdCdDaG9jb2xhdGUgSHlkcmEnLFxuXHRcdCdEZXZvdXJpbmcgUGVhY29jaycsXG5cdFx0J0Vjb25vbXktc2l6ZWQgQ29sb3NzdXMgb2YgdGhlIExlbW9uYWRlIFN0YW5kJyxcblx0XHQnR2hvc3QgUGlnZW9uJyxcblx0XHQnR2liYmVyaW5nIER1Y2snLFxuXHRcdCdTcGFya2xlbXVmZmluIFBlYWNvY2sgU3BpZGVyJyxcblx0XHQnR3VtIEVsZW1lbnRhbCcsXG5cdFx0J0lsbGl0ZXJhdGUgQ29uc3RydWN0IG9mIHRoZSBDYW5keSBTdG9yZScsXG5cdFx0J0luZWZmYWJsZSBDaGlodWFodWEnLFxuXHRcdCdJcnJpdGF0aW5nIERlYXRoIEhhbXN0ZXInLFxuXHRcdCdJcnJpdGF0aW5nIEdvbGQgTW91c2UnLFxuXHRcdCdKdWdnZXJuYXV0IFNuYWlsJyxcblx0XHQnSnVnZ2VybmF1dCBvZiB0aGUgU29jayBEcmF3ZXInLFxuXHRcdCdLb2FsYSBvZiB0aGUgQ29zbW9zJyxcblx0XHQnTWFkIEtvYWxhIG9mIHRoZSBXZXN0Jyxcblx0XHQnTWlsayBEamlubmkgb2YgdGhlIExlbW9uYWRlIFN0YW5kJyxcblx0XHQnTWluZCBGZXJyZXQnLFxuXHRcdCdNeXN0aWMgU2FsdCBTcGlkZXInLFxuXHRcdCdOZWNyb3RpYyBIYWxpdG9zaXMgQW5nZWwnLFxuXHRcdCdQaW5zdHJpcGVkIEZhbWluZSBTaGVlcCcsXG5cdFx0J1JpdGFsaW4gTGVlY2gnLFxuXHRcdCdTaG9ja2VyIEthbmdhcm9vJyxcblx0XHQnU3RlbGxhciBUZW5uaXMgSnVnZ2VybmF1dCcsXG5cdFx0J1dhaWxpbmcgUXVhaWwgb2YgdGhlIFN1bicsXG5cdFx0J0FuZ2VsIFBpZ2VvbicsXG5cdFx0J0FuaW1lIFNwaGlueCcsXG5cdFx0J0JvcmVkIEF2YWxhbmNoZSBTaGVlcCBvZiB0aGUgV2FzdGVsYW5kJyxcblx0XHQnRGV2b3VyaW5nIE5vdWdhdCBTcGhpbnggb2YgdGhlIFNvY2sgRHJhd2VyJyxcblx0XHQnRGppbm5pIG9mIHRoZSBGb290bG9ja2VyJyxcblx0XHQnRWN0b3BsYXNtaWMgSmF6eiBEZXZpbCcsXG5cdFx0J0ZsYXR1ZW50IEFuZ2VsJyxcblx0XHQnR2VsYXRpbm91cyBEdWNrIG9mIHRoZSBEcmVhbS1MYW5kcycsXG5cdFx0J0dlbGF0aW5vdXMgTW91c2UnLFxuXHRcdCdHb2xlbSBvZiB0aGUgRm9vdGxvY2tlcicsXG5cdFx0J0xpY2ggV29tYmF0Jyxcblx0XHQnTWVjaGFuaWNhbCBTbG90aCBvZiB0aGUgUGFzdCcsXG5cdFx0J01pbGtzaGFrZSBTdWNjdWJ1cycsXG5cdFx0J1B1ZmZ5IEJvbmUgUGVhY29jayBvZiB0aGUgRWFzdCcsXG5cdFx0J1JhaW5ib3cgTWFuYXRlZScsXG5cdFx0J1J1bmUgUGFycm90Jyxcblx0XHQnU2FuZCBDb3cnLFxuXHRcdCdTaW5pc3RlciBWYW5pbGxhIERyYWdvbicsXG5cdFx0J1NuYWlsIG9mIHRoZSBOb3J0aCcsXG5cdFx0J1NwaWRlciBvZiB0aGUgU2V3ZXInLFxuXHRcdCdTdGVsbGFyIFNhd2R1c3QgTGVlY2gnLFxuXHRcdCdTdG9ybSBBbnRlYXRlciBvZiBIZWxsJyxcblx0XHQnU3R1cGlkIFNwaXJpdCBvZiB0aGUgQnJld2VyeScsXG5cdFx0J1RpbWUgS2FuZ2Fyb28nLFxuXHRcdCdUb21iIFBvb2RsZScsXG5cdF0pO1xufTtcblxuY29uc3QgZ2V0VHlwZSA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBgJHtfLnNhbXBsZShbJ1RpbnknLCAnU21hbGwnLCAnTWVkaXVtJywgJ0xhcmdlJywgJ0dhcmdhbnR1YW4nLCAnU3R1cGlkbHkgdmFzdCddKX0gJHtfLnNhbXBsZShbJ2JlYXN0JywgJ2ZpZW5kJywgJ2Fubm95YW5jZScsICdndXknLCAnY3V0aWUnXSl9YDtcbn07XG5cbmNvbnN0IGdldEFsaWdubWVudCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBfLnNhbXBsZShbXG5cdFx0J2Fubm95aW5nIGV2aWwnLFxuXHRcdCdjaGFvdGljIGdvc3NpcHknLFxuXHRcdCdjaGFvdGljIHNsb3BweScsXG5cdFx0J2RlcHJlc3NlZCBuZXV0cmFsJyxcblx0XHQnbGF3ZnVsIGJvZ3VzJyxcblx0XHQnbGF3ZnVsIGNveScsXG5cdFx0J21hbmljLWRlcHJlc3NpdmUgZXZpbCcsXG5cdFx0J25hcnJvdy1taW5kZWQgbmV1dHJhbCcsXG5cdFx0J25ldXRyYWwgYW5ub3lpbmcnLFxuXHRcdCduZXV0cmFsIGlnbm9yYW50Jyxcblx0XHQnb2VkcGlwYWwgbmV1dHJhbCcsXG5cdFx0J3NpbGx5IG5ldXRyYWwnLFxuXHRcdCd1bm9yaWdpbmFsIG5ldXRyYWwnLFxuXHRcdCd3ZWlyZCBuZXV0cmFsJyxcblx0XHQnd29yZHkgZXZpbCcsXG5cdFx0J3VuYWxpZ25lZCdcblx0XSk7XG59O1xuXG5jb25zdCBnZXRTdGF0cyA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBgPnwke18udGltZXMoOSwgZnVuY3Rpb24oKXtcblx0XHRjb25zdCBudW0gPSBfLnJhbmRvbSgxLCAxNSk7XG5cdFx0Y29uc3QgdmFsID0gTWF0aC5jZWlsKG51bS8zIC0gMik7XG5cdFx0Ly9jb25zdCBtb2QgPSBNYXRoLmNlaWwobnVtLzIgLSA1KTtcblx0XHRyZXR1cm4gYCgkeyBudW0gPT0gMSA/IC0yIDogKG51bSA9PSAxNSA/IDQgOiB2YWwpIH0pYDtcblx0fSkuam9pbignfCcpfXxgO1xufTtcblxuY29uc3QgZ2VuQWJpbGl0aWVzID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIF8uc2FtcGxlKFtcblx0XHQnPiAtICoqKlBhY2sgVGFjdGljcy4qKiogVGhlc2UgZ3V5cyB3b3JrIHRvZ2V0aGVyLiBMaWtlIHN1cGVyIHdlbGwsIHlvdSBkb25cXCd0IGV2ZW4ga25vdy4nLFxuXHRcdCc+IC0gKioqRmFsc2UgQXBwZWFyYW5jZS4gKioqIFdoaWxlIHRoZSBhcm1vciByZWFtaW4gbW90aW9ubGVzcywgaXQgaXMgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSBhIG5vcm1hbCBzdWl0IG9mIGFybW9yLicsXG5cdF0pO1xufTtcblxuY29uc3QgZ2VuQWN0aW9uID0gZnVuY3Rpb24oKXtcblx0Y29uc3QgbmFtZSA9IF8uc2FtcGxlKFtcblx0XHQnQWJkb21pbmFsIERyb3AnLFxuXHRcdCdBaXJwbGFuZSBIYW1tZXInLFxuXHRcdCdBdG9taWMgRGVhdGggVGhyb3cnLFxuXHRcdCdCdWxsZG9nIFJha2UnLFxuXHRcdCdDb3Jrc2NyZXcgU3RyaWtlJyxcblx0XHQnQ3Jvc3NlZCBTcGxhc2gnLFxuXHRcdCdDcm9zc2ZhY2UgU3VwbGV4Jyxcblx0XHQnRERUIFBvd2VyYm9tYicsXG5cdFx0J0R1YWwgQ29icmEgV3Jpc3Rsb2NrJyxcblx0XHQnRHVhbCBUaHJvdycsXG5cdFx0J0VsYm93IEhvbGQnLFxuXHRcdCdHb3J5IEJvZHkgU3dlZXAnLFxuXHRcdCdIZWVsIEphd2JyZWFrZXInLFxuXHRcdCdKdW1waW5nIERyaXZlcicsXG5cdFx0J09wZW4gQ2hpbiBDaG9rZScsXG5cdFx0J1Njb3JwaW9uIEZsdXJyeScsXG5cdFx0J1NvbWVyc2F1bHQgU3R1bXAgRmlzdHMnLFxuXHRcdCdTdWZmZXJpbmcgV3JpbmdlcicsXG5cdFx0J1N1cGVyIEhpcCBTdWJtaXNzaW9uJyxcblx0XHQnU3VwZXIgU3BpbicsXG5cdFx0J1RlYW0gRWxib3cnLFxuXHRcdCdUZWFtIEZvb3QnLFxuXHRcdCdUaWx0LWEtd2hpcmwgQ2hpbiBTbGVlcGVyJyxcblx0XHQnVGlsdC1hLXdoaXJsIEV5ZSBUYWtlZG93bicsXG5cdFx0J1R1cm5idWNrbGUgUm9sbCdcblx0XSk7XG5cblx0cmV0dXJuIGA+ICoqKiR7bmFtZX0uKioqICpNZWxlZSBXZWFwb24gQXR0YWNrOiogKzQgdG8gaGl0LCByZWFjaCA1ZnQuLCBvbmUgdGFyZ2V0LiAqSGl0KiA1ICgxZDYgKyAyKSBgO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRmdWxsIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gYCR7W1xuXHRcdFx0J19fXycsXG5cdFx0XHQnX19fJyxcblx0XHRcdGA+ICMjICR7Z2V0TW9uc3Rlck5hbWUoKX1gLFxuXHRcdFx0YD4qJHtnZXRUeXBlKCl9LCAke2dldEFsaWdubWVudCgpfSpgLFxuXHRcdFx0Jz4gX19fJyxcblx0XHRcdGA+IC0gKipBcm1vciBDbGFzcyoqICR7Xy5yYW5kb20oMTAsIDIwKX1gLFxuXHRcdFx0YD4gLSAqKkhpdCBQb2ludHMqKiAke18ucmFuZG9tKDEsIDE1MCl9KDFkNCArIDUpYCxcblx0XHRcdGA+IC0gKipTcGVlZCoqICR7Xy5yYW5kb20oMCwgNTApfWZ0LmAsXG5cdFx0XHQnPl9fXycsXG5cdFx0XHQnPnxTVFJ8REVYfENPTnxJTlR8V0lTfENIQXwnLFxuXHRcdFx0Jz58Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Jyxcblx0XHRcdGdldFN0YXRzKCksXG5cdFx0XHQnPl9fXycsXG5cdFx0XHRgPiAtICoqQ29uZGl0aW9uIEltbXVuaXRpZXMqKiAke2dlbkxpc3QoWydncm9nZ3knLCAnc3dhZ2dlZCcsICd3ZWFrLWtuZWVkJywgJ2J1enplZCcsICdncm9vdnknLCAnbWVsYW5jaG9seScsICdkcnVuayddLCAzKX1gLFxuXHRcdFx0YD4gLSAqKlNlbnNlcyoqIHBhc3NpdmUgUGVyY2VwdGlvbiAke18ucmFuZG9tKDMsIDIwKX1gLFxuXHRcdFx0YD4gLSAqKkxhbmd1YWdlcyoqICR7Z2VuTGlzdChbJ0NvbW1vbicsICdQb3R0eW1vdXRoJywgJ0dpYmJlcmlzaCcsICdMYXRpbicsICdKaXZlJ10sIDIpfWAsXG5cdFx0XHRgPiAtICoqQ2hhbGxlbmdlKiogJHtfLnJhbmRvbSgwLCAxNSl9ICgke18ucmFuZG9tKDEwLCAxMDAwMCl9IFhQKWAsXG5cdFx0XHQnPiBfX18nLFxuXHRcdFx0Xy50aW1lcyhfLnJhbmRvbSgzLCA2KSwgZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIGdlbkFiaWxpdGllcygpO1xuXHRcdFx0fSkuam9pbignXFxuPlxcbicpLFxuXHRcdFx0Jz4gIyMjIEFjdGlvbnMnLFxuXHRcdFx0Xy50aW1lcyhfLnJhbmRvbSg0LCA2KSwgZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIGdlbkFjdGlvbigpO1xuXHRcdFx0fSkuam9pbignXFxuPlxcbicpLFxuXHRcdF0uam9pbignXFxuJyl9XFxuXFxuXFxuYDtcblx0fSxcblxuXHRoYWxmIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gYCR7W1xuXHRcdFx0J19fXycsXG5cdFx0XHRgPiAjIyMjIyAke2dldE1vbnN0ZXJOYW1lKCl9YCxcblx0XHRcdCc+fCBWYWx1ZSB8IEFiaWxpdGllcyAoRm9jdXNlcykgfCcsXG5cdFx0XHQnPnw6LS0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRgPnwgMSB8IEFjY3VyYWN5IHxgLFxuXHRcdFx0YD58IC0xIHwgQ29tbXVuaWNhdGlvbiB8YCxcblx0XHRcdGA+fCAxIHwgQ29uc3RpdHV0aW9uIChTdGFtaW5hKSB8YCxcblx0XHRcdGA+fCAwIHwgRGV4dGVyaXR5IChSaWRpbmcpIHxgLFxuXHRcdFx0YD58IDIgfCBGaWdodGluZyAoSGVhdnkgQmxhZGVzLFNwZWFycykgfGAsXG5cdFx0XHRgPnwgMCB8IEludGVsbGlnZW5jZSAoTWlsaXRhcnkgTG9yZSkgfGAsXG5cdFx0XHRgPnwgMCB8IFBlcmNlcHRpb24gfGAsXG5cdFx0XHRgPnwgMiB8IFN0cmVuZ3RoIChDbGltYmluZykgfGAsXG5cdFx0XHRgPnwgMSB8IFdpbGxwb3dlciAoTW9yYWxlKSB8YCxcblx0XHRcdCc+Jyxcblx0XHRcdCc+IHwgU3BlZWQgfCBIZWFsdGggfCBEZWZlbnNlIHwgQXJtb3IgUmF0aW5nIHwnLFxuXHRcdFx0Jz4gfDotLS0tLTp8Oi0tLS0tLTp8Oi0tLS0tLS06fDotLS0tLS0tLS0tLS06fCcsXG5cdFx0XHRgPiB8IDEwIHwgMzIgfCAxMiB8IDMgfGAsXG5cdFx0XHQnPicsIFxuXHRcdFx0Jz4gfCBXZWFwb24gfCBBdHRhY2sgUm9sbCB8IERhbWFnZSB8Jyxcblx0XHRcdCc+IHw6LS0tLS0tOnw6LS0tLS0tLS0tLS06fDotLS0tLS06fCcsXG5cdFx0XHQnPnwgTG9uZ3N3b3JkIHwgKzQgfCAyZDYrMiB8Jyxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHQnPiAjIyMjIyMgU3BlY2lhbCBRdWFsaXRpZXMgJyxcblx0XHRcdCc+Jyxcblx0XHRcdCc+IC0gKipGYXZvcmVkIFN0dW50cyoqOiBLbm9jayBQcm9uZSwgTWlnaHR5IEJsb3csIFNraXJtaXNoLiAnLFxuXHRcdFx0Jz4gLSAqKlRhbGVudHMqKjogQXJtb3IgIFRyYWluaW5nIChKb3VybmV5bWFuKSwgU2luZ2xlIFdlYXBvbiBTdHlsZSAoTm92aWNlKSwgVGhyb3duIFdlYXBvbiBTdHlsZSAoTm92aWNlKS4nLFxuXHRcdFx0Jz4gLSAqKldlYXBvbnMgR3JvdXBzKio6IEJyYXdsaW5nLCBIZWF2eSBCbGFkZXMsIFBvbGVhcm1zLCBTcGVhcnMuJyxcblx0XHRcdCc+IC0gKipFcXVpcG1lbnQqKjogTGlnaHQgbWFpbCwgbWVkaXVtIHNoaWVsZCwgbG9uZ3N3b3JkLCBhbmQgdHdvIHRocm93aW5nIHNwZWFycy4nLFxuXHRcdFx0Jz4gJyxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHQnPiAjIyMjIyBUaHJlYXQ6IE1pbm9yJyxcblx0XHRdLmpvaW4oJ1xcbicpfVxcblxcblxcbmA7XG5cbi8qIFxuXHRcdFx0J19fXycsXG5cdFx0XHRgPiAjIyAke2dldE1vbnN0ZXJOYW1lKCl9YCxcblx0XHRcdGA+KiR7Z2V0VHlwZSgpfSwgJHtnZXRBbGlnbm1lbnQoKX0qYCxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHRgPiAtICoqQXJtb3IgQ2xhc3MqKiAke18ucmFuZG9tKDEwLCAyMCl9YCxcblx0XHRcdGA+IC0gKipIaXQgUG9pbnRzKiogJHtfLnJhbmRvbSgxLCAxNTApfSgxZDQgKyA1KWAsXG5cdFx0XHRgPiAtICoqU3BlZWQqKiAke18ucmFuZG9tKDAsIDUwKX1mdC5gLFxuXHRcdFx0Jz5fX18nLFxuXHRcdFx0Jz58U1RSfERFWHxDT058SU5UfFdJU3xDSEF8Jyxcblx0XHRcdCc+fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fCcsXG5cdFx0XHRnZXRTdGF0cygpLFxuXHRcdFx0Jz5fX18nLFxuXHRcdFx0YD4gLSAqKkNvbmRpdGlvbiBJbW11bml0aWVzKiogJHtnZW5MaXN0KFsnZ3JvZ2d5JywgJ3N3YWdnZWQnLCAnd2Vhay1rbmVlZCcsICdidXp6ZWQnLCAnZ3Jvb3Z5JywgJ21lbGFuY2hvbHknLCAnZHJ1bmsnXSwgMyl9YCxcblx0XHRcdGA+IC0gKipTZW5zZXMqKiBwYXNzaXZlIFBlcmNlcHRpb24gJHtfLnJhbmRvbSgzLCAyMCl9YCxcblx0XHRcdGA+IC0gKipMYW5ndWFnZXMqKiAke2dlbkxpc3QoWydDb21tb24nLCAnUG90dHltb3V0aCcsICdHaWJiZXJpc2gnLCAnTGF0aW4nLCAnSml2ZSddLCAyKX1gLFxuXHRcdFx0YD4gLSAqKkNoYWxsZW5nZSoqICR7Xy5yYW5kb20oMCwgMTUpfSAoJHtfLnJhbmRvbSgxMCwgMTAwMDApfSBYUClgLFxuXHRcdFx0Jz4gX19fJyxcblx0XHRcdF8udGltZXMoXy5yYW5kb20oMCwgMiksIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBnZW5BYmlsaXRpZXMoKTtcblx0XHRcdH0pLmpvaW4oJ1xcbj5cXG4nKSxcblx0XHRcdCc+ICMjIyBBY3Rpb25zJyxcblx0XHRcdF8udGltZXMoXy5yYW5kb20oMSwgMiksIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBnZW5BY3Rpb24oKTtcblx0XHRcdH0pLmpvaW4oJ1xcbj5cXG4nKSxcblx0XHRdLmpvaW4oJ1xcbicpfVxcblxcblxcbmA7ICovXG5cdH1cbn07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGluZXMgKi9cblxuY29uc3QgTWFnaWNHZW4gPSByZXF1aXJlKCcuL21hZ2ljLmdlbi5qcycpO1xuY29uc3QgQ2xhc3NUYWJsZUdlbiA9IHJlcXVpcmUoJy4vY2xhc3N0YWJsZS5nZW4uanMnKTtcbmNvbnN0IE1vbnN0ZXJCbG9ja0dlbiA9IHJlcXVpcmUoJy4vbW9uc3RlcmJsb2NrLmdlbi5qcycpO1xuY29uc3QgQ2xhc3NGZWF0dXJlR2VuID0gcmVxdWlyZSgnLi9jbGFzc2ZlYXR1cmUuZ2VuLmpzJyk7XG5jb25zdCBDb3ZlclBhZ2VHZW4gPSByZXF1aXJlKCcuL2NvdmVycGFnZS5nZW4uanMnKTtcbmNvbnN0IFRhYmxlT2ZDb250ZW50c0dlbiA9IHJlcXVpcmUoJy4vdGFibGVPZkNvbnRlbnRzLmdlbi5qcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gW1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnRWRpdG9yJyxcblx0XHRpY29uICAgICAgOiAnZmEtcGVuY2lsJyxcblx0XHRzbmlwcGV0cyAgOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQ29sdW1uIEJyZWFrJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1jb2x1bW5zJyxcblx0XHRcdFx0Z2VuICA6ICdgYGBcXG5gYGBcXG5cXG4nXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ05ldyBQYWdlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1maWxlLXRleHQnLFxuXHRcdFx0XHRnZW4gIDogJ1xcXFxwYWdlXFxuXFxuJ1xuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdWZXJ0aWNhbCBTcGFjaW5nJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1hcnJvd3MtdicsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBzdHlsZT1cXCdtYXJnaW4tdG9wOjE0MHB4XFwnPjwvZGl2Plxcblxcbidcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnV2lkZSBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtYXJyb3dzLWgnLFxuXHRcdFx0XHRnZW4gIDogJzxkaXYgY2xhc3M9XFwnd2lkZVxcJz5cXG5FdmVyeXRoaW5nIGluIGhlcmUgd2lsbCBiZSBleHRyYSB3aWRlLiBUYWJsZXMsIHRleHQsIGV2ZXJ5dGhpbmchIEJld2FyZSB0aG91Z2gsIENTUyBjb2x1bW5zIGNhbiBiZWhhdmUgYSBiaXQgd2VpcmQgc29tZXRpbWVzLlxcbjwvZGl2Plxcbidcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnSW1hZ2UnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLWltYWdlJyxcblx0XHRcdFx0Z2VuICA6IFtcblx0XHRcdFx0XHQnPGltZyAnLFxuXHRcdFx0XHRcdCcgIHNyYz1cXCdodHRwczovL3MtbWVkaWEtY2FjaGUtYWswLnBpbmltZy5jb20vNzM2eC80YS84MS83OS80YTgxNzk0NjJjZmRmMzkwNTRhNDE4ZWZkNGNiNzQzZS5qcGdcXCcgJyxcblx0XHRcdFx0XHQnICBzdHlsZT1cXCd3aWR0aDozMjVweFxcJyAvPicsXG5cdFx0XHRcdFx0J0NyZWRpdDogS3lvdW5naHdhbiBLaW0nXG5cdFx0XHRcdF0uam9pbignXFxuJylcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQmFja2dyb3VuZCBJbWFnZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdHJlZScsXG5cdFx0XHRcdGdlbiAgOiBbXG5cdFx0XHRcdFx0JzxpbWcgJyxcblx0XHRcdFx0XHQnICBzcmM9XFwnaHR0cDovL2kuaW1ndXIuY29tL2hNbmE2RzAucG5nXFwnICcsXG5cdFx0XHRcdFx0JyAgc3R5bGU9XFwncG9zaXRpb246YWJzb2x1dGU7IHRvcDo1MHB4OyByaWdodDozMHB4OyB3aWR0aDoyODBweFxcJyAvPidcblx0XHRcdFx0XS5qb2luKCdcXG4nKVxuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1BhZ2UgTnVtYmVyJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1ib29rbWFyaycsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBjbGFzcz1cXCdwYWdlTnVtYmVyXFwnPjE8L2Rpdj5cXG48ZGl2IGNsYXNzPVxcJ2Zvb3Rub3RlXFwnPlBBUlQgMSB8IEZBTkNJTkVTUzwvZGl2Plxcblxcbidcblx0XHRcdH0sXG5cblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdBdXRvLWluY3JlbWVudGluZyBQYWdlIE51bWJlcicsXG5cdFx0XHRcdGljb24gOiAnZmEtc29ydC1udW1lcmljLWFzYycsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBjbGFzcz1cXCdwYWdlTnVtYmVyIGF1dG9cXCc+PC9kaXY+XFxuJ1xuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0xpbmsgdG8gcGFnZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGluaycsXG5cdFx0XHRcdGdlbiAgOiAnW0NsaWNrIGhlcmVdKCNwMykgdG8gZ28gdG8gcGFnZSAzXFxuJ1xuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1RhYmxlIG9mIENvbnRlbnRzJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1ib29rJyxcblx0XHRcdFx0Z2VuICA6IFRhYmxlT2ZDb250ZW50c0dlblxuXHRcdFx0fSxcblxuXG5cdFx0XVxuXHR9LFxuXHQvKioqKioqKioqKioqKioqKioqKioqKioqKiBBR0UgKioqKioqKioqKioqKioqKioqKiovXG5cblx0e1xuXHRcdGdyb3VwTmFtZSA6ICdBR0UnLFxuXHRcdGljb24gICAgICA6ICdmYS1ib29rJyxcblx0XHRzbmlwcGV0cyAgOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnU3BlbGwnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLW1hZ2ljJyxcblx0XHRcdFx0Z2VuICA6IE1hZ2ljR2VuLnNwZWxsLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdTcGVsbCBMaXN0Jyxcblx0XHRcdFx0aWNvbiA6ICdmYS1saXN0Jyxcblx0XHRcdFx0Z2VuICA6IE1hZ2ljR2VuLnNwZWxsTGlzdCxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQ2xhc3MgRmVhdHVyZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdHJvcGh5Jyxcblx0XHRcdFx0Z2VuICA6IENsYXNzRmVhdHVyZUdlbixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnTm90ZScsXG5cdFx0XHRcdGljb24gOiAnZmEtc3RpY2t5LW5vdGUnLFxuXHRcdFx0XHRnZW4gIDogZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRcdFx0Jz4gIyMjIyMgVGltZSB0byBEcm9wIEtub3dsZWRnZScsXG5cdFx0XHRcdFx0XHQnPiBVc2Ugbm90ZXMgdG8gcG9pbnQgb3V0IHNvbWUgaW50ZXJlc3RpbmcgaW5mb3JtYXRpb24uICcsXG5cdFx0XHRcdFx0XHQnPiAnLFxuXHRcdFx0XHRcdFx0Jz4gKipUYWJsZXMgYW5kIGxpc3RzKiogYm90aCB3b3JrIHdpdGhpbiBhIG5vdGUuJ1xuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0Rlc2NyaXB0aXZlIFRleHQgQm94Jyxcblx0XHRcdFx0aWNvbiA6ICdmYS1zdGlja3ktbm90ZS1vJyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVxcJ2Rlc2NyaXB0aXZlXFwnPicsXG5cdFx0XHRcdFx0XHQnIyMjIyMgVGltZSB0byBEcm9wIEtub3dsZWRnZScsXG5cdFx0XHRcdFx0XHQnVXNlIG5vdGVzIHRvIHBvaW50IG91dCBzb21lIGludGVyZXN0aW5nIGluZm9ybWF0aW9uLiAnLFxuXHRcdFx0XHRcdFx0JycsXG5cdFx0XHRcdFx0XHQnKipUYWJsZXMgYW5kIGxpc3RzKiogYm90aCB3b3JrIHdpdGhpbiBhIG5vdGUuJyxcblx0XHRcdFx0XHRcdCc8L2Rpdj4nXG5cdFx0XHRcdFx0XS5qb2luKCdcXG4nKTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnTW9uc3RlciBTdGF0IEJsb2NrJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1idWcnLFxuXHRcdFx0XHRnZW4gIDogTW9uc3RlckJsb2NrR2VuLmhhbGYsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1dpZGUgTW9uc3RlciBTdGF0IEJsb2NrJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1wYXcnLFxuXHRcdFx0XHRnZW4gIDogTW9uc3RlckJsb2NrR2VuLmZ1bGwsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0NvdmVyIFBhZ2UnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLWZpbGUtd29yZC1vJyxcblx0XHRcdFx0Z2VuICA6IENvdmVyUGFnZUdlbixcblx0XHRcdH0sXG5cdFx0XVxuXHR9LFxuXG5cblxuXHQvKioqKioqKioqKioqKioqKioqKioqICBUQUJMRVMgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnVGFibGVzJyxcblx0XHRpY29uICAgICAgOiAnZmEtdGFibGUnLFxuXHRcdHNuaXBwZXRzICA6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdDbGFzcyBUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdGFibGUnLFxuXHRcdFx0XHRnZW4gIDogQ2xhc3NUYWJsZUdlbi5mdWxsLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdIYWxmIENsYXNzIFRhYmxlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1saXN0LWFsdCcsXG5cdFx0XHRcdGdlbiAgOiBDbGFzc1RhYmxlR2VuLmhhbGYsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1RhYmxlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS10aC1saXN0Jyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCcjIyMjIyBDb29raWUgVGFzdGluZXNzJyxcblx0XHRcdFx0XHRcdCd8IFRhc3RpbmVzcyB8IENvb2tpZSBUeXBlIHwnLFxuXHRcdFx0XHRcdFx0J3w6LS0tLTp8Oi0tLS0tLS0tLS0tLS18Jyxcblx0XHRcdFx0XHRcdCd8IC01ICB8IFJhaXNpbiB8Jyxcblx0XHRcdFx0XHRcdCd8IDh0aCAgfCBDaG9jb2xhdGUgQ2hpcCB8Jyxcblx0XHRcdFx0XHRcdCd8IDExdGggfCAyIG9yIGxvd2VyIHwnLFxuXHRcdFx0XHRcdFx0J3wgMTR0aCB8IDMgb3IgbG93ZXIgfCcsXG5cdFx0XHRcdFx0XHQnfCAxN3RoIHwgNCBvciBsb3dlciB8XFxuXFxuJyxcblx0XHRcdFx0XHRdLmpvaW4oJ1xcbicpO1xuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdXaWRlIFRhYmxlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1saXN0Jyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVxcJ3dpZGVcXCc+Jyxcblx0XHRcdFx0XHRcdCcjIyMjIyBDb29raWUgVGFzdGluZXNzJyxcblx0XHRcdFx0XHRcdCd8IFRhc3RpbmVzcyB8IENvb2tpZSBUeXBlIHwnLFxuXHRcdFx0XHRcdFx0J3w6LS0tLTp8Oi0tLS0tLS0tLS0tLS18Jyxcblx0XHRcdFx0XHRcdCd8IC01ICB8IFJhaXNpbiB8Jyxcblx0XHRcdFx0XHRcdCd8IDh0aCAgfCBDaG9jb2xhdGUgQ2hpcCB8Jyxcblx0XHRcdFx0XHRcdCd8IDExdGggfCAyIG9yIGxvd2VyIHwnLFxuXHRcdFx0XHRcdFx0J3wgMTR0aCB8IDMgb3IgbG93ZXIgfCcsXG5cdFx0XHRcdFx0XHQnfCAxN3RoIHwgNCBvciBsb3dlciB8Jyxcblx0XHRcdFx0XHRcdCc8L2Rpdj5cXG5cXG4nXG5cdFx0XHRcdFx0XS5qb2luKCdcXG4nKTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnU3BsaXQgVGFibGUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRoLWxhcmdlJyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCc8ZGl2IHN0eWxlPVxcJ2NvbHVtbi1jb3VudDoyXFwnPicsXG5cdFx0XHRcdFx0XHQnfCBkMTAgfCBEYW1hZ2UgVHlwZSB8Jyxcblx0XHRcdFx0XHRcdCd8Oi0tLTp8Oi0tLS0tLS0tLS0tLXwnLFxuXHRcdFx0XHRcdFx0J3wgIDEgIHwgQWNpZCAgICAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgMiAgfCBDb2xkICAgICAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICAzICB8IEZpcmUgICAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDQgIHwgRm9yY2UgICAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgNSAgfCBMaWdodG5pbmcgICB8Jyxcblx0XHRcdFx0XHRcdCcnLFxuXHRcdFx0XHRcdFx0J2BgYCcsXG5cdFx0XHRcdFx0XHQnYGBgJyxcblx0XHRcdFx0XHRcdCcnLFxuXHRcdFx0XHRcdFx0J3wgZDEwIHwgRGFtYWdlIFR5cGUgfCcsXG5cdFx0XHRcdFx0XHQnfDotLS06fDotLS0tLS0tLS0tLS18Jyxcblx0XHRcdFx0XHRcdCd8ICA2ICB8IE5lY3JvdGljICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDcgIHwgUG9pc29uICAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgOCAgfCBQc3ljaGljICAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICA5ICB8IFJhZGlhbnQgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDEwIHwgVGh1bmRlciAgICAgfCcsXG5cdFx0XHRcdFx0XHQnPC9kaXY+XFxuXFxuJyxcblx0XHRcdFx0XHRdLmpvaW4oJ1xcbicpO1xuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdF1cblx0fSxcbi8vQ29sb3JzXG4vLyBCZXN0aWFyeSAtIDEzLDEwMSwxNDlcbi8vIENvcmUgUnVsZWJvb2sgLSA3LDg4LDEwN1xuLy8gQmx1ZSBSb3NlIC0gMTgsMTIzLDE4MlxuLy8gVGl0YW5zZ3JhdmUgLSAzNywgMTI0LCAxNDRcbi8vIERyYWdvbiBBZ2UgLSAxMjgsIDUsIDE0XG5cdHtcblx0XHRncm91cE5hbWUgOiAnQ29sb3JzJyxcblx0XHRpY29uICAgICAgOiAnZmEtcGFpbnQtYnJ1c2gnLFxuXHRcdHNuaXBwZXRzICA6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdCZXN0aWFyaWFsJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1wYXcnLFxuXHRcdFx0XHRnZW4gIDogZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRcdFx0JzxzdHlsZT4uYWdley0tZm9vdGVyLWJnOnJnYigxMywxMDEsMTQ5KSFpbXBvcnRhbnR9LmFnZSBoMSxoMixoMyxoNHtjb2xvcjojMGQ2NTk1fS5hZ2UgaDJ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMDAwfS5hZ2UgaDN7Y29sb3I6IzAwMCFpbXBvcnRhbnQ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMTc2ZjlmfS5hZ2UgaDV7Y29sb3I6I2ZmZjtiYWNrZ3JvdW5kLWNvbG9yOiMwZDY1OTUhaW1wb3J0YW50O2JvcmRlci1ib3R0b20tY29sb3I6IzBkNjU5NX0uYWdlIHRhYmxlIHRib2R5IHRye2JhY2tncm91bmQtY29sb3I6QG1vbnN0ZXJTdGF0QmFja2dyb3VuZH0uYWdlIHRhYmxlIHRib2R5IHRyOm50aC1jaGlsZChvZGQpe2JhY2tncm91bmQtY29sb3I6I2RjZTRlZX0uYWdlIHRhYmxlK3RhYmxlIHRib2R5IHRyOm50aC1jaGlsZChvZGQpe2JhY2tncm91bmQtY29sb3I6QG1vbnN0ZXJTdGF0QmFja2dyb3VuZH0uYWdlIGJsb2NrcXVvdGUsLmFnZSBocitibG9ja3F1b3RlLC5hZ2UgdGFibGUrdGFibGUgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2RjZTRlZX0uYWdlIGg1K3Vse2NvbG9yOiMwZDY1OTV9LmFnZSBoNSt1bCBsaXtjb2xvcjojMGQ2NTk1IWltcG9ydGFudH0vLyBtb25zdGVyIC5hZ2UgaHIrYmxvY2txdW90ZSBocitoNXtiYWNrZ3JvdW5kLWNvbG9yOiMwZDY1OTU7Y29sb3I6I2ZmZn0uYWdlIGhyK2Jsb2NrcXVvdGUgaHIrdWwsLmFnZSBocitibG9ja3F1b3RlIHRhYmxlIHVsIGxpIHN0cmluZywuYWdlIGhyK2Jsb2NrcXVvdGUgdWwgc3Ryb25ne2NvbG9yOiMwZDY1OTV9LmFnZSAuZm9vdG5vdGUsLmFnZSAucGFnZU51bWJlcntjb2xvcjojZmZmfS5hZ2UgLmRlc2NyaXB0aXZle2NvbG9yOiNkY2U0ZWV9LmFnZSAudG9jIHVsIGxpIGgzIGF7Y29sb3I6IzBkNjU5NSFpbXBvcnRhbnR9PC9zdHlsZT4nLFxuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0NvbXBhbmlvbmVzcXVlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS11c2VycycsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPHN0eWxlPi5hZ2V7LS1mb290ZXItYmc6cmdiKDE5Niw2Myw0OSkhaW1wb3J0YW50fS5hZ2UgaDEsaDIsaDMsaDR7Y29sb3I6I2M0M2YzMSFpbXBvcnRhbnR9LmFnZSBoMntib3JkZXItYm90dG9tLWNvbG9yOiMwMDB9LmFnZSBoM3tjb2xvcjojMDAwIWltcG9ydGFudDtib3JkZXItYm90dG9tLWNvbG9yOiNiYTM1MzF9LmFnZSBoNXtjb2xvcjojZmZmO2JhY2tncm91bmQtY29sb3I6I2M0M2YzMTtib3JkZXItYm90dG9tLWNvbG9yOiNjNDNmMzF9LmFnZSB0YWJsZSB0Ym9keSB0cntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LmFnZSB0YWJsZSB0Ym9keSB0cjpudGgtY2hpbGQob2RkKXtiYWNrZ3JvdW5kLWNvbG9yOiNmMmNmYmJ9LmFnZSB0YWJsZSt0YWJsZSB0Ym9keSB0cjpudGgtY2hpbGQob2RkKXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LmFnZSBibG9ja3F1b3RlLC5hZ2UgdGFibGUrdGFibGUgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2YyY2ZiYn0uYWdlIGg1K3VsLC5hZ2UgaDUrdWwgbGl7Y29sb3I6I2M0M2YzMX0uYWdlIGhyK2Jsb2NrcXVvdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5hZ2UgaHIrYmxvY2txdW90ZSBocitoNXtiYWNrZ3JvdW5kLWNvbG9yOiNjNDNmMzE7Y29sb3I6I2ZmZn0uYWdlIGhyK2Jsb2NrcXVvdGUgaHIrdWwsLmFnZSBocitibG9ja3F1b3RlIHRhYmxlIHVsIGxpIHN0cmluZywuYWdlIGhyK2Jsb2NrcXVvdGUgdWwgc3Ryb25ne2NvbG9yOiNjNDNmMzF9LmFnZSAuZm9vdG5vdGUsLmFnZSAucGFnZU51bWJlcntjb2xvcjojZmZmfS5hZ2UgLmRlc2NyaXB0aXZle2NvbG9yOiNmMmNmYmJ9LmFnZSAudG9jIHVsIGxpIGgzIGF7Y29sb3I6I2M0M2YzMSFpbXBvcnRhbnR9PC9zdHlsZT4nLFxuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1Jvc2VsaWtlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1sZWFmJyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCc8c3R5bGU+LmFnZXstLWZvb3Rlci1iZzpyZ2IoMTgsMTIzLDE4MikhaW1wb3J0YW50fS5hZ2UgaDEsaDIsaDMsaDR7Y29sb3I6IzEyN2JiNn0uYWdlIGgye2NvbG9yOiMxYzg1YzA7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMDAwfS5hZ2UgaDN7Y29sb3I6IzAwMCFpbXBvcnRhbnQ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMWM4NWMwfS5hZ2UgaDV7Y29sb3I6I2ZmZjtiYWNrZ3JvdW5kLWNvbG9yOiMxMjdiYjYhaW1wb3J0YW50O2JvcmRlci1ib3R0b20tY29sb3I6IzEyN2JiNn0uYWdlIHRhYmxlIHRib2R5IHRye2JhY2tncm91bmQtY29sb3I6QG1vbnN0ZXJTdGF0QmFja2dyb3VuZH0uYWdlIHRhYmxlIHRib2R5IHRyOm50aC1jaGlsZChvZGQpe2JhY2tncm91bmQtY29sb3I6I2RkZTdmM30uYWdlIHRhYmxlK3RhYmxlIHRib2R5IHRyOm50aC1jaGlsZChvZGQpe2JhY2tncm91bmQtY29sb3I6I2ZmZn0uYWdlIHRhYmxlK3RhYmxlIHRib2R5IHRyOm50aC1jaGlsZChldmVuKXtiYWNrZ3JvdW5kLWNvbG9yOiNkZGU3ZjN9LmFnZSBoNSt1bCwuYWdlIGg1K3VsIGxpe2NvbG9yOiMxMjdiYjZ9LmFnZSBibG9ja3F1b3Rle2JhY2tncm91bmQtY29sb3I6I2RkZTdmMyFpbXBvcnRhbnR9LmFnZSBoNStibG9ja3F1b3RlLC5hZ2UgaHIrYmxvY2txdW90ZXtiYWNrZ3JvdW5kLWNvbG9yOiNlNmU3ZTghaW1wb3J0YW50fS5hZ2UgaHIrYmxvY2txdW90ZSBocitoNXtiYWNrZ3JvdW5kLWNvbG9yOiMxMjdiYjY7Y29sb3I6I2ZmZn0uYWdlIGhyK2Jsb2NrcXVvdGUgaHIrdWwsLmFnZSBocitibG9ja3F1b3RlIHRhYmxlIHVsIGxpIHN0cmluZywuYWdlIGhyK2Jsb2NrcXVvdGUgdWwgc3Ryb25ne2NvbG9yOiMxMjdiYjZ9LmFnZSAuZm9vdG5vdGUsLmFnZSAucGFnZU51bWJlcntjb2xvcjojZmZmfS5hZ2UgLmRlc2NyaXB0aXZle2NvbG9yOiNkZGU3ZjN9LmFnZSAudG9jIHVsIGxpIGgzIGF7Y29sb3I6IzEyN2JiNiFpbXBvcnRhbnR9PC9zdHlsZT4nLFxuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9XG5cdFx0XVxuXG5cdH0sXG5cblxuXHQvKioqKioqKioqKioqKioqKiBQUklOVCAqKioqKioqKioqKioqL1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnUHJpbnQnLFxuXHRcdGljb24gICAgICA6ICdmYS1wcmludCcsXG5cdFx0c25pcHBldHMgIDogW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0E0IFBhZ2VTaXplJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1maWxlLW8nLFxuXHRcdFx0XHRnZW4gIDogWyc8c3R5bGU+Jyxcblx0XHRcdFx0XHQnICAuYWdleycsXG5cdFx0XHRcdFx0JyAgICB3aWR0aCA6IDIxMG1tOycsXG5cdFx0XHRcdFx0JyAgICBoZWlnaHQgOiAyOTYuOG1tOycsXG5cdFx0XHRcdFx0JyAgfScsXG5cdFx0XHRcdFx0Jzwvc3R5bGU+J1xuXHRcdFx0XHRdLmpvaW4oJ1xcbicpXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0luayBGcmllbmRseScsXG5cdFx0XHRcdGljb24gOiAnZmEtdGludCcsXG5cdFx0XHRcdGdlbiAgOiBbJzxzdHlsZT4nLFxuXHRcdFx0XHRcdCcgIC5hZ2V7IGJhY2tncm91bmQgOiB3aGl0ZTt9Jyxcblx0XHRcdFx0XHQnICAuYWdlIGltZ3sgZGlzcGxheSA6IG5vbmU7fScsXG5cdFx0XHRcdFx0JyAgLmFnZSBocitibG9ja3F1b3Rle2JhY2tncm91bmQgOiB3aGl0ZTt9Jyxcblx0XHRcdFx0XHQnPC9zdHlsZT4nLFxuXHRcdFx0XHRcdCcnXG5cdFx0XHRcdF0uam9pbignXFxuJylcblx0XHRcdH0sXG5cdFx0XVxuXHR9LFxuXG5dO1xuIiwiY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jb25zdCBnZXRUT0MgPSAocGFnZXMpPT57XG5cdGNvbnN0IGFkZDEgPSAodGl0bGUsIHBhZ2UpPT57XG5cdFx0cmVzLnB1c2goe1xuXHRcdFx0dGl0bGUgICAgOiB0aXRsZSxcblx0XHRcdHBhZ2UgICAgIDogcGFnZSArIDEsXG5cdFx0XHRjaGlsZHJlbiA6IFtdXG5cdFx0fSk7XG5cdH07XG5cdGNvbnN0IGFkZDIgPSAodGl0bGUsIHBhZ2UpPT57XG5cdFx0aWYoIV8ubGFzdChyZXMpKSBhZGQxKCcnLCBwYWdlKTtcblx0XHRfLmxhc3QocmVzKS5jaGlsZHJlbi5wdXNoKHtcblx0XHRcdHRpdGxlICAgIDogdGl0bGUsXG5cdFx0XHRwYWdlICAgICA6IHBhZ2UgKyAxLFxuXHRcdFx0Y2hpbGRyZW4gOiBbXVxuXHRcdH0pO1xuXHR9O1xuXHRjb25zdCBhZGQzID0gKHRpdGxlLCBwYWdlKT0+e1xuXHRcdGlmKCFfLmxhc3QocmVzKSkgYWRkMSgnJywgcGFnZSk7XG5cdFx0aWYoIV8ubGFzdChfLmxhc3QocmVzKS5jaGlsZHJlbikpIGFkZDIoJycsIHBhZ2UpO1xuXHRcdF8ubGFzdChfLmxhc3QocmVzKS5jaGlsZHJlbikuY2hpbGRyZW4ucHVzaCh7XG5cdFx0XHR0aXRsZSAgICA6IHRpdGxlLFxuXHRcdFx0cGFnZSAgICAgOiBwYWdlICsgMSxcblx0XHRcdGNoaWxkcmVuIDogW11cblx0XHR9KTtcblx0fTtcblxuXHRjb25zdCByZXMgPSBbXTtcblx0Xy5lYWNoKHBhZ2VzLCAocGFnZSwgcGFnZU51bSk9Pntcblx0XHRjb25zdCBsaW5lcyA9IHBhZ2Uuc3BsaXQoJ1xcbicpO1xuXHRcdF8uZWFjaChsaW5lcywgKGxpbmUpPT57XG5cdFx0XHRpZihfLnN0YXJ0c1dpdGgobGluZSwgJyMgJykpe1xuXHRcdFx0XHRjb25zdCB0aXRsZSA9IGxpbmUucmVwbGFjZSgnIyAnLCAnJyk7XG5cdFx0XHRcdGFkZDEodGl0bGUsIHBhZ2VOdW0pO1xuXHRcdFx0fVxuXHRcdFx0aWYoXy5zdGFydHNXaXRoKGxpbmUsICcjIyAnKSl7XG5cdFx0XHRcdGNvbnN0IHRpdGxlID0gbGluZS5yZXBsYWNlKCcjIyAnLCAnJyk7XG5cdFx0XHRcdGFkZDIodGl0bGUsIHBhZ2VOdW0pO1xuXHRcdFx0fVxuXHRcdFx0aWYoXy5zdGFydHNXaXRoKGxpbmUsICcjIyMgJykpe1xuXHRcdFx0XHRjb25zdCB0aXRsZSA9IGxpbmUucmVwbGFjZSgnIyMjICcsICcnKTtcblx0XHRcdFx0YWRkMyh0aXRsZSwgcGFnZU51bSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXHRyZXR1cm4gcmVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihicmV3KXtcblx0Y29uc3QgcGFnZXMgPSBicmV3LnNwbGl0KCdcXFxccGFnZScpO1xuXHRjb25zdCBUT0MgPSBnZXRUT0MocGFnZXMpO1xuXHRjb25zdCBtYXJrZG93biA9IF8ucmVkdWNlKFRPQywgKHIsIGcxLCBpZHgxKT0+e1xuXHRcdGlmKGcxLnRpdGxlKSByLnB1c2goYC0gIyMjIFs8c3Bhbj4ke2cxLnBhZ2V9PC9zcGFuPiA8c3Bhbj4ke2cxLnRpdGxlfTwvc3Bhbj5dKCNwJHtnMS5wYWdlfSlgKTtcblx0XHRpZihnMS5jaGlsZHJlbi5sZW5ndGgpe1xuXHRcdFx0Xy5lYWNoKGcxLmNoaWxkcmVuLCAoZzIsIGlkeDIpPT57XG5cdFx0XHRcdGlmKGcyLnRpdGxlKSByLnB1c2goYC0gIyMjIyAqKls8c3Bhbj4ke2cyLnBhZ2V9PC9zcGFuPiA8c3Bhbj4ke2cyLnRpdGxlfTwvc3Bhbj5dKCNwJHtnMi5wYWdlfSkqKmApO1xuXHRcdFx0XHRpZihnMi5jaGlsZHJlbi5sZW5ndGgpe1xuXHRcdFx0XHRcdF8uZWFjaChnMi5jaGlsZHJlbiwgKGczLCBpZHgzKT0+e1xuXHRcdFx0XHRcdFx0aWYoZzMudGl0bGUpIHIucHVzaChgICAtIFs8c3Bhbj4ke2czLnBhZ2V9PC9zcGFuPiA8c3Bhbj4ke2czLnRpdGxlfTwvc3Bhbj5dKCNwJHtnMy5wYWdlfSlgKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHJldHVybiByO1xuXHR9LCBbXSkuam9pbignXFxuJyk7XG5cblx0cmV0dXJuIGA8ZGl2IGNsYXNzPSd0b2MnPlxuIyMjIyMgVGFibGUgT2YgQ29udGVudHNcbiR7bWFya2Rvd259XG48L2Rpdj5cXG5gO1xufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IENyZWF0ZVJvdXRlciA9IHJlcXVpcmUoJ3BpY28tcm91dGVyJykuY3JlYXRlUm91dGVyO1xuXG5jb25zdCBIb21lUGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvaG9tZVBhZ2UvaG9tZVBhZ2UuanN4Jyk7XG5jb25zdCBFZGl0UGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvZWRpdFBhZ2UvZWRpdFBhZ2UuanN4Jyk7XG5jb25zdCBVc2VyUGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvdXNlclBhZ2UvdXNlclBhZ2UuanN4Jyk7XG5jb25zdCBTaGFyZVBhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL3NoYXJlUGFnZS9zaGFyZVBhZ2UuanN4Jyk7XG5jb25zdCBOZXdQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy9uZXdQYWdlL25ld1BhZ2UuanN4Jyk7XG5jb25zdCBFcnJvclBhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL2Vycm9yUGFnZS9lcnJvclBhZ2UuanN4Jyk7XG5jb25zdCBQcmludFBhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL3ByaW50UGFnZS9wcmludFBhZ2UuanN4Jyk7XG5cbmxldCBSb3V0ZXI7XG5jb25zdCBIb21lYnJldyA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVybCAgICAgICAgIDogJycsXG5cdFx0XHR3ZWxjb21lVGV4dCA6ICcnLFxuXHRcdFx0Y2hhbmdlbG9nICAgOiAnJyxcblx0XHRcdHZlcnNpb24gICAgIDogJzAuMC4wJyxcblx0XHRcdGFjY291bnQgICAgIDogbnVsbCxcblx0XHRcdGJyZXcgICAgICAgIDoge1xuXHRcdFx0XHR0aXRsZSAgICAgOiAnJyxcblx0XHRcdFx0dGV4dCAgICAgIDogJycsXG5cdFx0XHRcdHNoYXJlSWQgICA6IG51bGwsXG5cdFx0XHRcdGVkaXRJZCAgICA6IG51bGwsXG5cdFx0XHRcdGNyZWF0ZWRBdCA6IG51bGwsXG5cdFx0XHRcdHVwZGF0ZWRBdCA6IG51bGwsXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50V2lsbE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0Z2xvYmFsLmFjY291bnQgPSB0aGlzLnByb3BzLmFjY291bnQ7XG5cdFx0Z2xvYmFsLnZlcnNpb24gPSB0aGlzLnByb3BzLnZlcnNpb247XG5cblxuXHRcdFJvdXRlciA9IENyZWF0ZVJvdXRlcih7XG5cdFx0XHQnL2VkaXQvOmlkJyA6IChhcmdzKT0+e1xuXHRcdFx0XHRpZighdGhpcy5wcm9wcy5icmV3LmVkaXRJZCl7XG5cdFx0XHRcdFx0cmV0dXJuIDxFcnJvclBhZ2UgZXJyb3JJZD17YXJncy5pZH0vPjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiA8RWRpdFBhZ2Vcblx0XHRcdFx0XHRpZD17YXJncy5pZH1cblx0XHRcdFx0XHRicmV3PXt0aGlzLnByb3BzLmJyZXd9IC8+O1xuXHRcdFx0fSxcblxuXHRcdFx0Jy9zaGFyZS86aWQnIDogKGFyZ3MpPT57XG5cdFx0XHRcdGlmKCF0aGlzLnByb3BzLmJyZXcuc2hhcmVJZCl7XG5cdFx0XHRcdFx0cmV0dXJuIDxFcnJvclBhZ2UgZXJyb3JJZD17YXJncy5pZH0vPjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiA8U2hhcmVQYWdlXG5cdFx0XHRcdFx0aWQ9e2FyZ3MuaWR9XG5cdFx0XHRcdFx0YnJldz17dGhpcy5wcm9wcy5icmV3fSAvPjtcblx0XHRcdH0sXG5cdFx0XHQnL3VzZXIvOnVzZXJuYW1lJyA6IChhcmdzKT0+e1xuXHRcdFx0XHRyZXR1cm4gPFVzZXJQYWdlXG5cdFx0XHRcdFx0dXNlcm5hbWU9e2FyZ3MudXNlcm5hbWV9XG5cdFx0XHRcdFx0YnJld3M9e3RoaXMucHJvcHMuYnJld3N9XG5cdFx0XHRcdC8+O1xuXHRcdFx0fSxcblx0XHRcdCcvcHJpbnQvOmlkJyA6IChhcmdzLCBxdWVyeSk9Pntcblx0XHRcdFx0cmV0dXJuIDxQcmludFBhZ2UgYnJldz17dGhpcy5wcm9wcy5icmV3fSBxdWVyeT17cXVlcnl9Lz47XG5cdFx0XHR9LFxuXHRcdFx0Jy9wcmludCcgOiAoYXJncywgcXVlcnkpPT57XG5cdFx0XHRcdHJldHVybiA8UHJpbnRQYWdlIHF1ZXJ5PXtxdWVyeX0vPjtcblx0XHRcdH0sXG5cdFx0XHQnL25ldycgOiAoYXJncyk9Pntcblx0XHRcdFx0cmV0dXJuIDxOZXdQYWdlIC8+O1xuXHRcdFx0fSxcblx0XHRcdCcvY2hhbmdlbG9nJyA6IChhcmdzKT0+e1xuXHRcdFx0XHRyZXR1cm4gPFNoYXJlUGFnZVxuXHRcdFx0XHRcdGJyZXc9e3sgdGl0bGU6ICdDaGFuZ2Vsb2cnLCB0ZXh0OiB0aGlzLnByb3BzLmNoYW5nZWxvZyB9fSAvPjtcblx0XHRcdH0sXG5cdFx0XHQnKicgOiA8SG9tZVBhZ2Vcblx0XHRcdFx0d2VsY29tZVRleHQ9e3RoaXMucHJvcHMud2VsY29tZVRleHR9IC8+LFxuXHRcdH0pO1xuXHR9LFxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0naG9tZWJyZXcnPlxuXHRcdFx0PFJvdXRlciBkZWZhdWx0VXJsPXt0aGlzLnByb3BzLnVybH0vPlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9tZWJyZXc7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9wcyl7XG5cdGlmKGdsb2JhbC5hY2NvdW50KXtcblx0XHRyZXR1cm4gPE5hdi5pdGVtIGhyZWY9e2AvdXNlci8ke2dsb2JhbC5hY2NvdW50LnVzZXJuYW1lfWB9IGNvbG9yPSd5ZWxsb3cnIGljb249J2ZhLXVzZXInPlxuXHRcdFx0e2dsb2JhbC5hY2NvdW50LnVzZXJuYW1lfVxuXHRcdDwvTmF2Lml0ZW0+O1xuXHR9XG5cdGxldCB1cmwgPSAnJztcblx0aWYodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpe1xuXHRcdHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXHR9XG5cdHJldHVybiA8TmF2Lml0ZW0gaHJlZj17YGh0dHA6Ly91bnVzZWQvbG9naW4/cmVkaXJlY3Q9JHt1cmx9YH0gY29sb3I9J3RlYWwnIGljb249J2ZhLXNpZ24taW4nPlxuXHRcdGxvZ2luXG5cdDwvTmF2Lml0ZW0+O1xufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9wcyl7XG5cdHJldHVybiA8TmF2Lml0ZW1cblx0XHRuZXdUYWI9e3RydWV9XG5cdFx0Y29sb3I9J3JlZCdcblx0XHRpY29uPSdmYS1idWcnXG5cdFx0aHJlZj17YGh0dHBzOi8vd3d3LnJlZGRpdC5jb20vci9ob21lYnJld2VyeS9zdWJtaXQ/c2VsZnRleHQ9dHJ1ZSZ0aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudCgnW0lzc3VlXSBEZXNjcmliZSBZb3VyIElzc3VlIEhlcmUnKX1gfSA+XG5cdFx0cmVwb3J0IGlzc3VlXG5cdDwvTmF2Lml0ZW0+O1xufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuXG5jb25zdCBOYXZiYXIgPSBjcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHQvL3Nob3dOb25DaHJvbWVXYXJuaW5nIDogZmFsc2UsXG5cdFx0XHR2ZXIgOiAnMC4wLjAnXG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc3QgaXNDaHJvbWUgPSAvQ2hyb21lLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmIC9Hb29nbGUgSW5jLy50ZXN0KG5hdmlnYXRvci52ZW5kb3IpO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0Ly9zaG93Tm9uQ2hyb21lV2FybmluZyA6ICFpc0Nocm9tZSxcblx0XHRcdHZlciA6IHdpbmRvdy52ZXJzaW9uXG5cdFx0fSk7XG5cdH0sXG5cblx0Lypcblx0cmVuZGVyQ2hyb21lV2FybmluZyA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUuc2hvd05vbkNocm9tZVdhcm5pbmcpIHJldHVybjtcblx0XHRyZXR1cm4gPE5hdi5pdGVtIGNsYXNzTmFtZT0nd2FybmluZycgaWNvbj0nZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUnPlxuXHRcdFx0T3B0aW1pemVkIGZvciBDaHJvbWVcblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdkcm9wZG93bic+XG5cdFx0XHRcdElmIHlvdSBhcmUgZXhwZXJpZW5jaW5nIHJlbmRlcmluZyBpc3N1ZXMsIHVzZSBDaHJvbWUgaW5zdGVhZFxuXHRcdFx0PC9kaXY+XG5cdFx0PC9OYXYuaXRlbT5cblx0fSxcbiovXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxOYXYuYmFzZT5cblx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0PE5hdi5sb2dvIC8+XG5cdFx0XHRcdDxOYXYuaXRlbSBocmVmPScvJyBjbGFzc05hbWU9J2hvbWVicmV3TG9nbyc+XG5cdFx0XHRcdFx0PGRpdj5BR0UgSG9tZWJyZXdlcnk8L2Rpdj5cblx0XHRcdFx0PC9OYXYuaXRlbT5cblx0XHRcdFx0PE5hdi5pdGVtPntgdiR7dGhpcy5zdGF0ZS52ZXJ9YH08L05hdi5pdGVtPlxuXG5cdFx0XHRcdHsvKnRoaXMucmVuZGVyQ2hyb21lV2FybmluZygpKi99XG5cdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdFx0e3RoaXMucHJvcHMuY2hpbGRyZW59XG5cdFx0PC9OYXYuYmFzZT47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdmJhcjtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByb3BzKXtcblx0cmV0dXJuIDxOYXYuaXRlbVxuXHRcdGNsYXNzTmFtZT0ncGF0cmVvbidcblx0XHRuZXdUYWI9e3RydWV9XG5cdFx0aHJlZj0naHR0cHM6Ly93d3cucGF0cmVvbi5jb20vc3RvbGtzZG9yZidcblx0XHRjb2xvcj0nZ3JlZW4nXG5cdFx0aWNvbj0nZmEtaGVhcnQnPlxuXHRcdGhlbHAgb3V0XG5cdDwvTmF2Lml0ZW0+O1xufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9wcyl7XG5cdHJldHVybiA8TmF2Lml0ZW0gbmV3VGFiPXt0cnVlfSBocmVmPXtgL3ByaW50LyR7cHJvcHMuc2hhcmVJZH0/ZGlhbG9nPXRydWVgfSBjb2xvcj0ncHVycGxlJyBpY29uPSdmYS1maWxlLXBkZi1vJz5cblx0XHRnZXQgUERGXG5cdDwvTmF2Lml0ZW0+O1xufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgTW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5cbmNvbnN0IEVESVRfS0VZID0gJ2hvbWVicmV3ZXJ5LXJlY2VudGx5LWVkaXRlZCc7XG5jb25zdCBWSUVXX0tFWSA9ICdob21lYnJld2VyeS1yZWNlbnRseS12aWV3ZWQnO1xuXG5cbmNvbnN0IFJlY2VudEl0ZW1zID0gY3JlYXRlQ2xhc3Moe1xuXG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdG9yYWdlS2V5IDogJycsXG5cdFx0XHRzaG93RWRpdCAgIDogZmFsc2UsXG5cdFx0XHRzaG93VmlldyAgIDogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzaG93RHJvcGRvd24gOiBmYWxzZSxcblx0XHRcdGVkaXQgICAgICAgICA6IFtdLFxuXHRcdFx0dmlldyAgICAgICAgIDogW11cblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cblx0Ly89PSBMb2FkIHJlY2VudCBpdGVtcyBsaXN0ID09Ly9cblx0XHRsZXQgZWRpdGVkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShFRElUX0tFWSkgfHwgJ1tdJyk7XG5cdFx0bGV0IHZpZXdlZCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oVklFV19LRVkpIHx8ICdbXScpO1xuXG5cdFx0Ly89PSBBZGQgY3VycmVudCBicmV3IHRvIGFwcHJvcHJpYXRlIHJlY2VudCBpdGVtcyBsaXN0IChkZXBlbmRpbmcgb24gc3RvcmFnZUtleSkgPT0vL1xuXHRcdGlmKHRoaXMucHJvcHMuc3RvcmFnZUtleSA9PSAnZWRpdCcpe1xuXHRcdFx0ZWRpdGVkID0gXy5maWx0ZXIoZWRpdGVkLCAoYnJldyk9Pntcblx0XHRcdFx0cmV0dXJuIGJyZXcuaWQgIT09IHRoaXMucHJvcHMuYnJldy5lZGl0SWQ7XG5cdFx0XHR9KTtcblx0XHRcdGVkaXRlZC51bnNoaWZ0KHtcblx0XHRcdFx0aWQgICAgOiB0aGlzLnByb3BzLmJyZXcuZWRpdElkLFxuXHRcdFx0XHR0aXRsZSA6IHRoaXMucHJvcHMuYnJldy50aXRsZSxcblx0XHRcdFx0dXJsICAgOiBgL2VkaXQvJHt0aGlzLnByb3BzLmJyZXcuZWRpdElkfWAsXG5cdFx0XHRcdHRzICAgIDogRGF0ZS5ub3coKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmKHRoaXMucHJvcHMuc3RvcmFnZUtleSA9PSAndmlldycpe1xuXHRcdFx0dmlld2VkID0gXy5maWx0ZXIodmlld2VkLCAoYnJldyk9Pntcblx0XHRcdFx0cmV0dXJuIGJyZXcuaWQgIT09IHRoaXMucHJvcHMuYnJldy5zaGFyZUlkO1xuXHRcdFx0fSk7XG5cdFx0XHR2aWV3ZWQudW5zaGlmdCh7XG5cdFx0XHRcdGlkICAgIDogdGhpcy5wcm9wcy5icmV3LnNoYXJlSWQsXG5cdFx0XHRcdHRpdGxlIDogdGhpcy5wcm9wcy5icmV3LnRpdGxlLFxuXHRcdFx0XHR1cmwgICA6IGAvc2hhcmUvJHt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH1gLFxuXHRcdFx0XHR0cyAgICA6IERhdGUubm93KClcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vPT0gU3RvcmUgdGhlIHVwZGF0ZWQgbGlzdHMgKHVwIHRvIDggaXRlbXMgZWFjaCkgPT0vL1xuXHRcdGVkaXRlZCA9IF8uc2xpY2UoZWRpdGVkLCAwLCA4KTtcblx0XHR2aWV3ZWQgPSBfLnNsaWNlKHZpZXdlZCwgMCwgOCk7XG5cblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShFRElUX0tFWSwgSlNPTi5zdHJpbmdpZnkoZWRpdGVkKSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oVklFV19LRVksIEpTT04uc3RyaW5naWZ5KHZpZXdlZCkpO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRlZGl0IDogZWRpdGVkLFxuXHRcdFx0dmlldyA6IHZpZXdlZFxuXHRcdH0pO1xuXHR9LFxuXG5cdGhhbmRsZURyb3Bkb3duIDogZnVuY3Rpb24oc2hvdyl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzaG93RHJvcGRvd24gOiBzaG93XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyRHJvcGRvd24gOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnN0YXRlLnNob3dEcm9wZG93bikgcmV0dXJuIG51bGw7XG5cblx0XHRjb25zdCBtYWtlSXRlbXMgPSAoYnJld3MpPT57XG5cdFx0XHRyZXR1cm4gXy5tYXAoYnJld3MsIChicmV3KT0+e1xuXHRcdFx0XHRyZXR1cm4gPGEgaHJlZj17YnJldy51cmx9IGNsYXNzTmFtZT0naXRlbScga2V5PXticmV3LmlkfSB0YXJnZXQ9J19ibGFuaycgcmVsPSdub29wZW5lciBub3JlZmVycmVyJz5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9J3RpdGxlJz57YnJldy50aXRsZSB8fCAnWyBubyB0aXRsZSBdJ308L3NwYW4+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPSd0aW1lJz57TW9tZW50KGJyZXcudHMpLmZyb21Ob3coKX08L3NwYW4+XG5cdFx0XHRcdDwvYT47XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdkcm9wZG93bic+XG5cdFx0XHR7KHRoaXMucHJvcHMuc2hvd0VkaXQgJiYgdGhpcy5wcm9wcy5zaG93VmlldykgP1xuXHRcdFx0XHQ8aDQ+ZWRpdGVkPC9oND4gOiBudWxsIH1cblx0XHRcdHt0aGlzLnByb3BzLnNob3dFZGl0ID9cblx0XHRcdFx0bWFrZUl0ZW1zKHRoaXMuc3RhdGUuZWRpdCkgOiBudWxsIH1cblx0XHRcdHsodGhpcy5wcm9wcy5zaG93RWRpdCAmJiB0aGlzLnByb3BzLnNob3dWaWV3KSA/XG5cdFx0XHRcdDxoND52aWV3ZWQ8L2g0Plx0OiBudWxsIH1cblx0XHRcdHt0aGlzLnByb3BzLnNob3dWaWV3ID9cblx0XHRcdFx0bWFrZUl0ZW1zKHRoaXMuc3RhdGUudmlldykgOiBudWxsIH1cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPE5hdi5pdGVtIGljb249J2ZhLWNsb2NrLW8nIGNvbG9yPSdncmV5JyBjbGFzc05hbWU9J3JlY2VudCdcblx0XHRcdG9uTW91c2VFbnRlcj17KCk9PnRoaXMuaGFuZGxlRHJvcGRvd24odHJ1ZSl9XG5cdFx0XHRvbk1vdXNlTGVhdmU9eygpPT50aGlzLmhhbmRsZURyb3Bkb3duKGZhbHNlKX0+XG5cdFx0XHR7dGhpcy5wcm9wcy50ZXh0fVxuXHRcdFx0e3RoaXMucmVuZGVyRHJvcGRvd24oKX1cblx0XHQ8L05hdi5pdGVtPjtcblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0ZWRpdGVkIDogKHByb3BzKT0+e1xuXHRcdHJldHVybiA8UmVjZW50SXRlbXNcblx0XHRcdGJyZXc9e3Byb3BzLmJyZXd9XG5cdFx0XHRzdG9yYWdlS2V5PXtwcm9wcy5zdG9yYWdlS2V5fVxuXHRcdFx0dGV4dD0ncmVjZW50bHkgZWRpdGVkJ1xuXHRcdFx0c2hvd0VkaXQ9e3RydWV9XG5cdFx0Lz47XG5cdH0sXG5cblx0dmlld2VkIDogKHByb3BzKT0+e1xuXHRcdHJldHVybiA8UmVjZW50SXRlbXNcblx0XHRcdGJyZXc9e3Byb3BzLmJyZXd9XG5cdFx0XHRzdG9yYWdlS2V5PXtwcm9wcy5zdG9yYWdlS2V5fVxuXHRcdFx0dGV4dD0ncmVjZW50bHkgdmlld2VkJ1xuXHRcdFx0c2hvd1ZpZXc9e3RydWV9XG5cdFx0Lz47XG5cdH0sXG5cblx0Ym90aCA6IChwcm9wcyk9Pntcblx0XHRyZXR1cm4gPFJlY2VudEl0ZW1zXG5cdFx0XHRicmV3PXtwcm9wcy5icmV3fVxuXHRcdFx0c3RvcmFnZUtleT17cHJvcHMuc3RvcmFnZUtleX1cblx0XHRcdHRleHQ9J3JlY2VudCBicmV3cydcblx0XHRcdHNob3dFZGl0PXt0cnVlfVxuXHRcdFx0c2hvd1ZpZXc9e3RydWV9XG5cdFx0Lz47XG5cdH1cbn07IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcbmNvbnN0IE5hdmJhciA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9uYXZiYXIuanN4Jyk7XG5cbmNvbnN0IFJlcG9ydElzc3VlID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2lzc3VlLm5hdml0ZW0uanN4Jyk7XG5jb25zdCBQcmludExpbmsgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcHJpbnQubmF2aXRlbS5qc3gnKTtcbmNvbnN0IEFjY291bnQgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvYWNjb3VudC5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUmVjZW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9yZWNlbnQubmF2aXRlbS5qc3gnKS5ib3RoO1xuXG5jb25zdCBTcGxpdFBhbmUgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9zcGxpdFBhbmUvc3BsaXRQYW5lLmpzeCcpO1xuY29uc3QgRWRpdG9yID0gcmVxdWlyZSgnLi4vLi4vZWRpdG9yL2VkaXRvci5qc3gnKTtcbmNvbnN0IEJyZXdSZW5kZXJlciA9IHJlcXVpcmUoJy4uLy4uL2JyZXdSZW5kZXJlci9icmV3UmVuZGVyZXIuanN4Jyk7XG5cbmNvbnN0IE1hcmtkb3duID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbWFya2Rvd24uanMnKTtcblxuY29uc3QgU0FWRV9USU1FT1VUID0gMzAwMDtcblxuXG5jb25zdCBFZGl0UGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJyZXcgOiB7XG5cdFx0XHRcdHRleHQgICAgICA6ICcnLFxuXHRcdFx0XHRzaGFyZUlkICAgOiBudWxsLFxuXHRcdFx0XHRlZGl0SWQgICAgOiBudWxsLFxuXHRcdFx0XHRjcmVhdGVkQXQgOiBudWxsLFxuXHRcdFx0XHR1cGRhdGVkQXQgOiBudWxsLFxuXG5cdFx0XHRcdHRpdGxlICAgICAgIDogJycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uIDogJycsXG5cdFx0XHRcdHRhZ3MgICAgICAgIDogJycsXG5cdFx0XHRcdHB1Ymxpc2hlZCAgIDogZmFsc2UsXG5cdFx0XHRcdGF1dGhvcnMgICAgIDogW10sXG5cdFx0XHRcdHN5c3RlbXMgICAgIDogW11cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3IDogdGhpcy5wcm9wcy5icmV3LFxuXG5cdFx0XHRpc1NhdmluZyAgIDogZmFsc2UsXG5cdFx0XHRpc1BlbmRpbmcgIDogZmFsc2UsXG5cdFx0XHRlcnJvcnMgICAgIDogbnVsbCxcblx0XHRcdGh0bWxFcnJvcnMgOiBNYXJrZG93bi52YWxpZGF0ZSh0aGlzLnByb3BzLmJyZXcudGV4dCksXG5cdFx0fTtcblx0fSxcblx0c2F2ZWRCcmV3IDogbnVsbCxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy50cnlTYXZlKCk7XG5cdFx0d2luZG93Lm9uYmVmb3JldW5sb2FkID0gKCk9Pntcblx0XHRcdGlmKHRoaXMuc3RhdGUuaXNTYXZpbmcgfHwgdGhpcy5zdGF0ZS5pc1BlbmRpbmcpe1xuXHRcdFx0XHRyZXR1cm4gJ1lvdSBoYXZlIHVuc2F2ZWQgY2hhbmdlcyEnO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUpPT4oe1xuXHRcdFx0aHRtbEVycm9ycyA6IE1hcmtkb3duLnZhbGlkYXRlKHByZXZTdGF0ZS5icmV3LnRleHQpXG5cdFx0fSkpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlQ29udHJvbEtleXMpO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCl7fTtcblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVDb250cm9sS2V5cyk7XG5cdH0sXG5cblxuXHRoYW5kbGVDb250cm9sS2V5cyA6IGZ1bmN0aW9uKGUpe1xuXHRcdGlmKCEoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpIHJldHVybjtcblx0XHRjb25zdCBTX0tFWSA9IDgzO1xuXHRcdGNvbnN0IFBfS0VZID0gODA7XG5cdFx0aWYoZS5rZXlDb2RlID09IFNfS0VZKSB0aGlzLnNhdmUoKTtcblx0XHRpZihlLmtleUNvZGUgPT0gUF9LRVkpIHdpbmRvdy5vcGVuKGAvcHJpbnQvJHt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH0/ZGlhbG9nPXRydWVgLCAnX2JsYW5rJykuZm9jdXMoKTtcblx0XHRpZihlLmtleUNvZGUgPT0gUF9LRVkgfHwgZS5rZXlDb2RlID09IFNfS0VZKXtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZVNwbGl0TW92ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5yZWZzLmVkaXRvci51cGRhdGUoKTtcblx0fSxcblxuXHRoYW5kbGVNZXRhZGF0YUNoYW5nZSA6IGZ1bmN0aW9uKG1ldGFkYXRhKXtcblx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUpPT4oe1xuXHRcdFx0YnJldyAgICAgIDogXy5tZXJnZSh7fSwgcHJldlN0YXRlLmJyZXcsIG1ldGFkYXRhKSxcblx0XHRcdGlzUGVuZGluZyA6IHRydWUsXG5cdFx0fSksICgpPT50aGlzLnRyeVNhdmUoKSk7XG5cblx0fSxcblxuXHRoYW5kbGVUZXh0Q2hhbmdlIDogZnVuY3Rpb24odGV4dCl7XG5cblx0XHQvL0lmIHRoZXJlIGFyZSBlcnJvcnMsIHJ1biB0aGUgdmFsaWRhdG9yIG9uIGV2ZXJ5Y2hhbmdlIHRvIGdpdmUgcXVpY2sgZmVlZGJhY2tcblx0XHRsZXQgaHRtbEVycm9ycyA9IHRoaXMuc3RhdGUuaHRtbEVycm9ycztcblx0XHRpZihodG1sRXJyb3JzLmxlbmd0aCkgaHRtbEVycm9ycyA9IE1hcmtkb3duLnZhbGlkYXRlKHRleHQpO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSgocHJldlN0YXRlKT0+KHtcblx0XHRcdGJyZXcgICAgICAgOiBfLm1lcmdlKHt9LCBwcmV2U3RhdGUuYnJldywgeyB0ZXh0OiB0ZXh0IH0pLFxuXHRcdFx0aXNQZW5kaW5nICA6IHRydWUsXG5cdFx0XHRodG1sRXJyb3JzIDogaHRtbEVycm9yc1xuXHRcdH0pLCAoKT0+dGhpcy50cnlTYXZlKCkpO1xuXHR9LFxuXG5cdGhhc0NoYW5nZXMgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IHNhdmVkQnJldyA9IHRoaXMuc2F2ZWRCcmV3ID8gdGhpcy5zYXZlZEJyZXcgOiB0aGlzLnByb3BzLmJyZXc7XG5cdFx0cmV0dXJuICFfLmlzRXF1YWwodGhpcy5zdGF0ZS5icmV3LCBzYXZlZEJyZXcpO1xuXHR9LFxuXG5cdHRyeVNhdmUgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLmRlYm91bmNlU2F2ZSkgdGhpcy5kZWJvdW5jZVNhdmUgPSBfLmRlYm91bmNlKHRoaXMuc2F2ZSwgU0FWRV9USU1FT1VUKTtcblx0XHRpZih0aGlzLmhhc0NoYW5nZXMoKSl7XG5cdFx0XHR0aGlzLmRlYm91bmNlU2F2ZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmRlYm91bmNlU2F2ZS5jYW5jZWwoKTtcblx0XHR9XG5cdH0sXG5cblx0c2F2ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5kZWJvdW5jZVNhdmUgJiYgdGhpcy5kZWJvdW5jZVNhdmUuY2FuY2VsKSB0aGlzLmRlYm91bmNlU2F2ZS5jYW5jZWwoKTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoKHByZXZTdGF0ZSk9Pih7XG5cdFx0XHRpc1NhdmluZyAgIDogdHJ1ZSxcblx0XHRcdGVycm9ycyAgICAgOiBudWxsLFxuXHRcdFx0aHRtbEVycm9ycyA6IE1hcmtkb3duLnZhbGlkYXRlKHByZXZTdGF0ZS5icmV3LnRleHQpXG5cdFx0fSkpO1xuXG5cdFx0cmVxdWVzdFxuXHRcdFx0LnB1dChgL2FwaS91cGRhdGUvJHt0aGlzLnByb3BzLmJyZXcuZWRpdElkfWApXG5cdFx0XHQuc2VuZCh0aGlzLnN0YXRlLmJyZXcpXG5cdFx0XHQuZW5kKChlcnIsIHJlcyk9Pntcblx0XHRcdFx0aWYoZXJyKXtcblx0XHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0XHRcdGVycm9ycyA6IGVycixcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnNhdmVkQnJldyA9IHJlcy5ib2R5O1xuXHRcdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdFx0aXNQZW5kaW5nIDogZmFsc2UsXG5cdFx0XHRcdFx0XHRpc1NhdmluZyAgOiBmYWxzZSxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyU2F2ZUJ1dHRvbiA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5zdGF0ZS5lcnJvcnMpe1xuXHRcdFx0bGV0IGVyck1zZyA9ICcnO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZXJyTXNnICs9IGAke3RoaXMuc3RhdGUuZXJyb3JzLnRvU3RyaW5nKCl9XFxuXFxuYDtcblx0XHRcdFx0ZXJyTXNnICs9IGBcXGBcXGBcXGBcXG4ke0pTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUuZXJyb3JzLnJlc3BvbnNlLmVycm9yLCBudWxsLCAnICAnKX1cXG5cXGBcXGBcXGBgO1xuXHRcdFx0fSBjYXRjaCAoZSl7fVxuXG5cdFx0XHRyZXR1cm4gPE5hdi5pdGVtIGNsYXNzTmFtZT0nc2F2ZSBlcnJvcicgaWNvbj0nZmEtd2FybmluZyc+XG5cdFx0XHRcdE9vcHMhXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdlcnJvckNvbnRhaW5lcic+XG5cdFx0XHRcdFx0TG9va3MgbGlrZSB0aGVyZSB3YXMgYSBwcm9ibGVtIHNhdmluZy4gPGJyIC8+XG5cdFx0XHRcdFx0UmVwb3J0IHRoZSBpc3N1ZSA8YSB0YXJnZXQ9J19ibGFuaycgcmVsPSdub29wZW5lciBub3JlZmVycmVyJ1xuXHRcdFx0XHRcdFx0aHJlZj17YGh0dHBzOi8vZ2l0aHViLmNvbS9zdG9sa3Nkb3JmL25hdHVyYWxjcml0L2lzc3Vlcy9uZXc/Ym9keT0ke2VuY29kZVVSSUNvbXBvbmVudChlcnJNc2cpfWB9PlxuXHRcdFx0XHRcdFx0aGVyZVxuXHRcdFx0XHRcdDwvYT4uXG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9OYXYuaXRlbT47XG5cdFx0fVxuXG5cdFx0aWYodGhpcy5zdGF0ZS5pc1NhdmluZyl7XG5cdFx0XHRyZXR1cm4gPE5hdi5pdGVtIGNsYXNzTmFtZT0nc2F2ZScgaWNvbj0nZmEtc3Bpbm5lciBmYS1zcGluJz5zYXZpbmcuLi48L05hdi5pdGVtPjtcblx0XHR9XG5cdFx0aWYodGhpcy5zdGF0ZS5pc1BlbmRpbmcgJiYgdGhpcy5oYXNDaGFuZ2VzKCkpe1xuXHRcdFx0cmV0dXJuIDxOYXYuaXRlbSBjbGFzc05hbWU9J3NhdmUnIG9uQ2xpY2s9e3RoaXMuc2F2ZX0gY29sb3I9J2JsdWUnIGljb249J2ZhLXNhdmUnPlNhdmUgTm93PC9OYXYuaXRlbT47XG5cdFx0fVxuXHRcdGlmKCF0aGlzLnN0YXRlLmlzUGVuZGluZyAmJiAhdGhpcy5zdGF0ZS5pc1NhdmluZyl7XG5cdFx0XHRyZXR1cm4gPE5hdi5pdGVtIGNsYXNzTmFtZT0nc2F2ZSBzYXZlZCc+c2F2ZWQuPC9OYXYuaXRlbT47XG5cdFx0fVxuXHR9LFxuXHRyZW5kZXJOYXZiYXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8TmF2YmFyPlxuXHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHQ8TmF2Lml0ZW0gY2xhc3NOYW1lPSdicmV3VGl0bGUnPnt0aGlzLnN0YXRlLmJyZXcudGl0bGV9PC9OYXYuaXRlbT5cblx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cblx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0e3RoaXMucmVuZGVyU2F2ZUJ1dHRvbigpfVxuXHRcdFx0XHQ8UmVwb3J0SXNzdWUgLz5cblx0XHRcdFx0PE5hdi5pdGVtIG5ld1RhYj17dHJ1ZX0gaHJlZj17YC9zaGFyZS8ke3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfWB9IGNvbG9yPSd0ZWFsJyBpY29uPSdmYS1zaGFyZS1hbHQnPlxuXHRcdFx0XHRcdFNoYXJlXG5cdFx0XHRcdDwvTmF2Lml0ZW0+XG5cdFx0XHRcdDxQcmludExpbmsgc2hhcmVJZD17dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9IC8+XG5cdFx0XHRcdDxSZWNlbnROYXZJdGVtIGJyZXc9e3RoaXMucHJvcHMuYnJld30gc3RvcmFnZUtleT0nZWRpdCcgLz5cblx0XHRcdFx0PEFjY291bnQgLz5cblx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0PC9OYXZiYXI+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdlZGl0UGFnZSBwYWdlJz5cblx0XHRcdHt0aGlzLnJlbmRlck5hdmJhcigpfVxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGVudCc+XG5cdFx0XHRcdDxTcGxpdFBhbmUgb25EcmFnRmluaXNoPXt0aGlzLmhhbmRsZVNwbGl0TW92ZX0gcmVmPSdwYW5lJz5cblx0XHRcdFx0XHQ8RWRpdG9yXG5cdFx0XHRcdFx0XHRyZWY9J2VkaXRvcidcblx0XHRcdFx0XHRcdHZhbHVlPXt0aGlzLnN0YXRlLmJyZXcudGV4dH1cblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLmhhbmRsZVRleHRDaGFuZ2V9XG5cdFx0XHRcdFx0XHRtZXRhZGF0YT17dGhpcy5zdGF0ZS5icmV3fVxuXHRcdFx0XHRcdFx0b25NZXRhZGF0YUNoYW5nZT17dGhpcy5oYW5kbGVNZXRhZGF0YUNoYW5nZX1cblx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdDxCcmV3UmVuZGVyZXIgdGV4dD17dGhpcy5zdGF0ZS5icmV3LnRleHR9IGVycm9ycz17dGhpcy5zdGF0ZS5odG1sRXJyb3JzfSAvPlxuXHRcdFx0XHQ8L1NwbGl0UGFuZT5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdFBhZ2U7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5jb25zdCBOYXZiYXIgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvbmF2YmFyLmpzeCcpO1xuY29uc3QgUGF0cmVvbk5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcGF0cmVvbi5uYXZpdGVtLmpzeCcpO1xuY29uc3QgSXNzdWVOYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2lzc3VlLm5hdml0ZW0uanN4Jyk7XG5jb25zdCBSZWNlbnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCcpLmJvdGg7XG5cbmNvbnN0IEJyZXdSZW5kZXJlciA9IHJlcXVpcmUoJy4uLy4uL2JyZXdSZW5kZXJlci9icmV3UmVuZGVyZXIuanN4Jyk7XG5cbmNvbnN0IEVycm9yUGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHZlciAgICAgOiAnMC4wLjAnLFxuXHRcdFx0ZXJyb3JJZCA6ICcnXG5cdFx0fTtcblx0fSxcblxuXHR0ZXh0IDogJyMgT29wcyBcXG4gV2UgY291bGQgbm90IGZpbmQgYSBicmV3IHdpdGggdGhhdCBpZC4gKipTb3JyeSEqKicsXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2Vycm9yUGFnZSBwYWdlJz5cblx0XHRcdDxOYXZiYXIgdmVyPXt0aGlzLnByb3BzLnZlcn0+XG5cdFx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0XHQ8TmF2Lml0ZW0gY2xhc3NOYW1lPSdlcnJvclRpdGxlJz5cblx0XHRcdFx0XHRcdENyaXQgRmFpbCFcblx0XHRcdFx0XHQ8L05hdi5pdGVtPlxuXHRcdFx0XHQ8L05hdi5zZWN0aW9uPlxuXG5cdFx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0XHQ8UGF0cmVvbk5hdkl0ZW0gLz5cblx0XHRcdFx0XHQ8SXNzdWVOYXZJdGVtIC8+XG5cdFx0XHRcdFx0PFJlY2VudE5hdkl0ZW0gLz5cblx0XHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHRcdDwvTmF2YmFyPlxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGVudCc+XG5cdFx0XHRcdDxCcmV3UmVuZGVyZXIgdGV4dD17dGhpcy50ZXh0fSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFcnJvclBhZ2U7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuY29uc3QgTmF2YmFyID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL25hdmJhci5qc3gnKTtcbmNvbnN0IFBhdHJlb25OYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3BhdHJlb24ubmF2aXRlbS5qc3gnKTtcbmNvbnN0IElzc3VlTmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUmVjZW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9yZWNlbnQubmF2aXRlbS5qc3gnKS5ib3RoO1xuY29uc3QgQWNjb3VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvYWNjb3VudC5uYXZpdGVtLmpzeCcpO1xuXG5cbmNvbnN0IFNwbGl0UGFuZSA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L3NwbGl0UGFuZS9zcGxpdFBhbmUuanN4Jyk7XG5jb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuLi8uLi9lZGl0b3IvZWRpdG9yLmpzeCcpO1xuY29uc3QgQnJld1JlbmRlcmVyID0gcmVxdWlyZSgnLi4vLi4vYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3gnKTtcblxuXG5cbmNvbnN0IEhvbWVQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0d2VsY29tZVRleHQgOiAnJyxcblx0XHRcdHZlciAgICAgICAgIDogJzAuMC4wJ1xuXHRcdH07XG5cblxuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dGV4dCA6IHRoaXMucHJvcHMud2VsY29tZVRleHRcblx0XHR9O1xuXHR9LFxuXHRoYW5kbGVTYXZlIDogZnVuY3Rpb24oKXtcblx0XHRyZXF1ZXN0LnBvc3QoJy9hcGknKVxuXHRcdFx0LnNlbmQoe1xuXHRcdFx0XHR0ZXh0IDogdGhpcy5zdGF0ZS50ZXh0XG5cdFx0XHR9KVxuXHRcdFx0LmVuZCgoZXJyLCByZXMpPT57XG5cdFx0XHRcdGlmKGVycikgcmV0dXJuIGVyclxuXHRcdFx0XHRjb25zdCBicmV3ID0gcmVzLmJvZHk7XG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGAvZWRpdC8ke2JyZXcuZWRpdElkfWA7XG5cdFx0XHR9KTtcblx0fSxcblx0aGFuZGxlU3BsaXRNb3ZlIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnJlZnMuZWRpdG9yLnVwZGF0ZSgpO1xuXHR9LFxuXHRoYW5kbGVUZXh0Q2hhbmdlIDogZnVuY3Rpb24odGV4dCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHR0ZXh0IDogdGV4dFxuXHRcdH0pO1xuXHR9LFxuXHRyZW5kZXJOYXZiYXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8TmF2YmFyIHZlcj17dGhpcy5wcm9wcy52ZXJ9PlxuXHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHQ8UGF0cmVvbk5hdkl0ZW0gLz5cblx0XHRcdFx0PElzc3VlTmF2SXRlbSAvPlxuXHRcdFx0XHQ8TmF2Lml0ZW0gbmV3VGFiPXt0cnVlfSBocmVmPScvY2hhbmdlbG9nJyBjb2xvcj0ncHVycGxlJyBpY29uPSdmYS1maWxlLXRleHQtbyc+XG5cdFx0XHRcdFx0Q2hhbmdlbG9nXG5cdFx0XHRcdDwvTmF2Lml0ZW0+XG5cdFx0XHRcdDxSZWNlbnROYXZJdGVtIC8+XG5cdFx0XHRcdDxBY2NvdW50TmF2SXRlbSAvPlxuXHRcdFx0XHR7Lyp9XG5cdFx0XHRcdDxOYXYuaXRlbSBocmVmPScvbmV3JyBjb2xvcj0nZ3JlZW4nIGljb249J2ZhLWV4dGVybmFsLWxpbmsnPlxuXHRcdFx0XHRcdE5ldyBCcmV3XG5cdFx0XHRcdDwvTmF2Lml0ZW0+XG5cdFx0XHRcdCovfVxuXHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHQ8L05hdmJhcj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2hvbWVQYWdlIHBhZ2UnPlxuXHRcdFx0e3RoaXMucmVuZGVyTmF2YmFyKCl9XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250ZW50Jz5cblx0XHRcdFx0PFNwbGl0UGFuZSBvbkRyYWdGaW5pc2g9e3RoaXMuaGFuZGxlU3BsaXRNb3ZlfSByZWY9J3BhbmUnPlxuXHRcdFx0XHRcdDxFZGl0b3IgdmFsdWU9e3RoaXMuc3RhdGUudGV4dH0gb25DaGFuZ2U9e3RoaXMuaGFuZGxlVGV4dENoYW5nZX0gcmVmPSdlZGl0b3InLz5cblx0XHRcdFx0XHQ8QnJld1JlbmRlcmVyIHRleHQ9e3RoaXMuc3RhdGUudGV4dH0gLz5cblx0XHRcdFx0PC9TcGxpdFBhbmU+XG5cdFx0XHQ8L2Rpdj5cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e2N4KCdmbG9hdGluZ1NhdmVCdXR0b24nLCB7IHNob3c6IHRoaXMucHJvcHMud2VsY29tZVRleHQgIT0gdGhpcy5zdGF0ZS50ZXh0IH0pfSBvbkNsaWNrPXt0aGlzLmhhbmRsZVNhdmV9PlxuXHRcdFx0XHRTYXZlIGN1cnJlbnQgPGkgY2xhc3NOYW1lPSdmYSBmYS1zYXZlJyAvPlxuXHRcdFx0PC9kaXY+XG5cblx0XHRcdDxhIGhyZWY9Jy9uZXcnIGNsYXNzTmFtZT0nZmxvYXRpbmdOZXdCdXR0b24nPlxuXHRcdFx0XHRDcmVhdGUgeW91ciBvd24gPGkgY2xhc3NOYW1lPSdmYSBmYS1tYWdpYycgLz5cblx0XHRcdDwvYT5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVQYWdlO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcblxuY29uc3QgTWFya2Rvd24gPSByZXF1aXJlKCduYXR1cmFsY3JpdC9tYXJrZG93bi5qcycpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuY29uc3QgTmF2YmFyID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL25hdmJhci5qc3gnKTtcbmNvbnN0IEFjY291bnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2FjY291bnQubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFJlY2VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcmVjZW50Lm5hdml0ZW0uanN4JykuYm90aDtcbmNvbnN0IElzc3VlTmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCcpO1xuXG5jb25zdCBTcGxpdFBhbmUgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9zcGxpdFBhbmUvc3BsaXRQYW5lLmpzeCcpO1xuY29uc3QgRWRpdG9yID0gcmVxdWlyZSgnLi4vLi4vZWRpdG9yL2VkaXRvci5qc3gnKTtcbmNvbnN0IEJyZXdSZW5kZXJlciA9IHJlcXVpcmUoJy4uLy4uL2JyZXdSZW5kZXJlci9icmV3UmVuZGVyZXIuanN4Jyk7XG5cblxuY29uc3QgS0VZID0gJ2hvbWVicmV3ZXJ5LW5ldyc7XG5cbmNvbnN0IE5ld1BhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtZXRhZGF0YSA6IHtcblx0XHRcdFx0dGl0bGUgICAgICAgOiAnJyxcblx0XHRcdFx0ZGVzY3JpcHRpb24gOiAnJyxcblx0XHRcdFx0dGFncyAgICAgICAgOiAnJyxcblx0XHRcdFx0cHVibGlzaGVkICAgOiBmYWxzZSxcblx0XHRcdFx0YXV0aG9ycyAgICAgOiBbXSxcblx0XHRcdFx0c3lzdGVtcyAgICAgOiBbXVxuXHRcdFx0fSxcblxuXHRcdFx0dGV4dCAgICAgOiAnJyxcblx0XHRcdGlzU2F2aW5nIDogZmFsc2UsXG5cdFx0XHRlcnJvcnMgICA6IFtdXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBzdG9yYWdlID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oS0VZKTtcblx0XHRpZihzdG9yYWdlKXtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHR0ZXh0IDogc3RvcmFnZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUNvbnRyb2xLZXlzKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVDb250cm9sS2V5cyk7XG5cdH0sXG5cblx0aGFuZGxlQ29udHJvbEtleXMgOiBmdW5jdGlvbihlKXtcblx0XHRpZighKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKSByZXR1cm47XG5cdFx0Y29uc3QgU19LRVkgPSA4Mztcblx0XHRjb25zdCBQX0tFWSA9IDgwO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBTX0tFWSkgdGhpcy5zYXZlKCk7XG5cdFx0aWYoZS5rZXlDb2RlID09IFBfS0VZKSB0aGlzLnByaW50KCk7XG5cdFx0aWYoZS5rZXlDb2RlID09IFBfS0VZIHx8IGUua2V5Q29kZSA9PSBTX0tFWSl7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblxuXHRoYW5kbGVTcGxpdE1vdmUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMucmVmcy5lZGl0b3IudXBkYXRlKCk7XG5cdH0sXG5cblx0aGFuZGxlTWV0YWRhdGFDaGFuZ2UgOiBmdW5jdGlvbihtZXRhZGF0YSl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRtZXRhZGF0YSA6IF8ubWVyZ2Uoe30sIHRoaXMuc3RhdGUubWV0YWRhdGEsIG1ldGFkYXRhKVxuXHRcdH0pO1xuXHR9LFxuXG5cdGhhbmRsZVRleHRDaGFuZ2UgOiBmdW5jdGlvbih0ZXh0KXtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHRleHQgICA6IHRleHQsXG5cdFx0XHRlcnJvcnMgOiBNYXJrZG93bi52YWxpZGF0ZSh0ZXh0KVxuXHRcdH0pO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKEtFWSwgdGV4dCk7XG5cdH0sXG5cblx0c2F2ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRpc1NhdmluZyA6IHRydWVcblx0XHR9KTtcblxuXHRcdHJlcXVlc3QucG9zdCgnL2FwaScpXG5cdFx0XHQuc2VuZChfLm1lcmdlKHt9LCB0aGlzLnN0YXRlLm1ldGFkYXRhLCB7XG5cdFx0XHRcdHRleHQgOiB0aGlzLnN0YXRlLnRleHRcblx0XHRcdH0pKVxuXHRcdFx0LmVuZCgoZXJyLCByZXMpPT57XG5cdFx0XHRcdGlmKGVycil7XG5cdFx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdFx0XHRpc1NhdmluZyA6IGZhbHNlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uKCl7fTtcblx0XHRcdFx0Y29uc3QgYnJldyA9IHJlcy5ib2R5O1xuXHRcdFx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShLRVkpO1xuXHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSBgL2VkaXQvJHticmV3LmVkaXRJZH1gO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyU2F2ZUJ1dHRvbiA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5zdGF0ZS5pc1NhdmluZyl7XG5cdFx0XHRyZXR1cm4gPE5hdi5pdGVtIGljb249J2ZhLXNwaW5uZXIgZmEtc3BpbicgY2xhc3NOYW1lPSdzYXZlQnV0dG9uJz5cblx0XHRcdFx0c2F2ZS4uLlxuXHRcdFx0PC9OYXYuaXRlbT47XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiA8TmF2Lml0ZW0gaWNvbj0nZmEtc2F2ZScgY2xhc3NOYW1lPSdzYXZlQnV0dG9uJyBvbkNsaWNrPXt0aGlzLnNhdmV9PlxuXHRcdFx0XHRzYXZlXG5cdFx0XHQ8L05hdi5pdGVtPjtcblx0XHR9XG5cdH0sXG5cblx0cHJpbnQgOiBmdW5jdGlvbigpe1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwcmludCcsIHRoaXMuc3RhdGUudGV4dCk7XG5cdFx0d2luZG93Lm9wZW4oJy9wcmludD9kaWFsb2c9dHJ1ZSZsb2NhbD1wcmludCcsICdfYmxhbmsnKTtcblx0fSxcblxuXHRyZW5kZXJMb2NhbFByaW50QnV0dG9uIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPE5hdi5pdGVtIGNvbG9yPSdwdXJwbGUnIGljb249J2ZhLWZpbGUtcGRmLW8nIG9uQ2xpY2s9e3RoaXMucHJpbnR9PlxuXHRcdFx0Z2V0IFBERlxuXHRcdDwvTmF2Lml0ZW0+O1xuXHR9LFxuXG5cdHJlbmRlck5hdmJhciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxOYXZiYXI+XG5cblx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0PE5hdi5pdGVtIGNsYXNzTmFtZT0nYnJld1RpdGxlJz57dGhpcy5zdGF0ZS5tZXRhZGF0YS50aXRsZX08L05hdi5pdGVtPlxuXHRcdFx0PC9OYXYuc2VjdGlvbj5cblxuXHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHR7dGhpcy5yZW5kZXJTYXZlQnV0dG9uKCl9XG5cdFx0XHRcdHt0aGlzLnJlbmRlckxvY2FsUHJpbnRCdXR0b24oKX1cblx0XHRcdFx0PElzc3VlTmF2SXRlbSAvPlxuXHRcdFx0XHQ8UmVjZW50TmF2SXRlbSAvPlxuXHRcdFx0XHQ8QWNjb3VudE5hdkl0ZW0gLz5cblx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0PC9OYXZiYXI+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSduZXdQYWdlIHBhZ2UnPlxuXHRcdFx0e3RoaXMucmVuZGVyTmF2YmFyKCl9XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGVudCc+XG5cdFx0XHRcdDxTcGxpdFBhbmUgb25EcmFnRmluaXNoPXt0aGlzLmhhbmRsZVNwbGl0TW92ZX0gcmVmPSdwYW5lJz5cblx0XHRcdFx0XHQ8RWRpdG9yXG5cdFx0XHRcdFx0XHRyZWY9J2VkaXRvcidcblx0XHRcdFx0XHRcdHZhbHVlPXt0aGlzLnN0YXRlLnRleHR9XG5cdFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5oYW5kbGVUZXh0Q2hhbmdlfVxuXHRcdFx0XHRcdFx0bWV0YWRhdGE9e3RoaXMuc3RhdGUubWV0YWRhdGF9XG5cdFx0XHRcdFx0XHRvbk1ldGFkYXRhQ2hhbmdlPXt0aGlzLmhhbmRsZU1ldGFkYXRhQ2hhbmdlfVxuXHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0PEJyZXdSZW5kZXJlciB0ZXh0PXt0aGlzLnN0YXRlLnRleHR9IGVycm9ycz17dGhpcy5zdGF0ZS5lcnJvcnN9IC8+XG5cdFx0XHRcdDwvU3BsaXRQYW5lPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOZXdQYWdlO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IE1hcmtkb3duID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbWFya2Rvd24uanMnKTtcblxuY29uc3QgUHJpbnRQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cXVlcnkgOiB7fSxcblx0XHRcdGJyZXcgIDoge1xuXHRcdFx0XHR0ZXh0IDogJycsXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJld1RleHQgOiB0aGlzLnByb3BzLmJyZXcudGV4dFxuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLnByb3BzLnF1ZXJ5LmxvY2FsKXtcblx0XHRcdHRoaXMuc2V0U3RhdGUoKHByZXZTdGF0ZSwgcHJldlByb3BzKT0+KHtcblx0XHRcdFx0YnJld1RleHQgOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwcmV2UHJvcHMucXVlcnkubG9jYWwpXG5cdFx0XHR9KSk7XG5cdFx0fVxuXG5cdFx0aWYodGhpcy5wcm9wcy5xdWVyeS5kaWFsb2cpIHdpbmRvdy5wcmludCgpO1xuXHR9LFxuXG5cdHJlbmRlclBhZ2VzIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5tYXAodGhpcy5zdGF0ZS5icmV3VGV4dC5zcGxpdCgnXFxcXHBhZ2UnKSwgKHBhZ2UsIGluZGV4KT0+e1xuXHRcdFx0cmV0dXJuIDxkaXZcblx0XHRcdFx0Y2xhc3NOYW1lPSdhZ2UnXG5cdFx0XHRcdGlkPXtgcCR7aW5kZXggKyAxfWB9XG5cdFx0XHRcdGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogTWFya2Rvd24ucmVuZGVyKHBhZ2UpIH19XG5cdFx0XHRcdGtleT17aW5kZXh9IC8+O1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXY+XG5cdFx0XHR7dGhpcy5yZW5kZXJQYWdlcygpfVxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJpbnRQYWdlO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuY29uc3QgTmF2YmFyID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL25hdmJhci5qc3gnKTtcbmNvbnN0IFByaW50TGluayA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9wcmludC5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUmVwb3J0SXNzdWUgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvaXNzdWUubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFJlY2VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcmVjZW50Lm5hdml0ZW0uanN4JykuYm90aDtcbmNvbnN0IEFjY291bnQgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvYWNjb3VudC5uYXZpdGVtLmpzeCcpO1xuXG5cbmNvbnN0IEJyZXdSZW5kZXJlciA9IHJlcXVpcmUoJy4uLy4uL2JyZXdSZW5kZXJlci9icmV3UmVuZGVyZXIuanN4Jyk7XG5cblxuY29uc3QgU2hhcmVQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyA6IHtcblx0XHRcdFx0dGl0bGUgICAgIDogJycsXG5cdFx0XHRcdHRleHQgICAgICA6ICcnLFxuXHRcdFx0XHRzaGFyZUlkICAgOiBudWxsLFxuXHRcdFx0XHRjcmVhdGVkQXQgOiBudWxsLFxuXHRcdFx0XHR1cGRhdGVkQXQgOiBudWxsLFxuXHRcdFx0XHR2aWV3cyAgICAgOiAwXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUNvbnRyb2xLZXlzKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVDb250cm9sS2V5cyk7XG5cdH0sXG5cdGhhbmRsZUNvbnRyb2xLZXlzIDogZnVuY3Rpb24oZSl7XG5cdFx0aWYoIShlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSkgcmV0dXJuO1xuXHRcdGNvbnN0IFBfS0VZID0gODA7XG5cdFx0aWYoZS5rZXlDb2RlID09IFBfS0VZKXtcblx0XHRcdHdpbmRvdy5vcGVuKGAvcHJpbnQvJHt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH0/ZGlhbG9nPXRydWVgLCAnX2JsYW5rJykuZm9jdXMoKTtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdzaGFyZVBhZ2UgcGFnZSc+XG5cdFx0XHQ8TmF2YmFyPlxuXHRcdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdFx0PE5hdi5pdGVtIGNsYXNzTmFtZT0nYnJld1RpdGxlJz57dGhpcy5wcm9wcy5icmV3LnRpdGxlfTwvTmF2Lml0ZW0+XG5cdFx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cblx0XHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHRcdDxSZXBvcnRJc3N1ZSAvPlxuXHRcdFx0XHRcdDxQcmludExpbmsgc2hhcmVJZD17dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9IC8+XG5cdFx0XHRcdFx0PE5hdi5pdGVtIGhyZWY9e2Avc291cmNlLyR7dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9YH0gY29sb3I9J3RlYWwnIGljb249J2ZhLWNvZGUnPlxuXHRcdFx0XHRcdFx0c291cmNlXG5cdFx0XHRcdFx0PC9OYXYuaXRlbT5cblx0XHRcdFx0XHQ8UmVjZW50TmF2SXRlbSBicmV3PXt0aGlzLnByb3BzLmJyZXd9IHN0b3JhZ2VLZXk9J3ZpZXcnIC8+XG5cdFx0XHRcdFx0PEFjY291bnQgLz5cblx0XHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHRcdDwvTmF2YmFyPlxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGVudCc+XG5cdFx0XHRcdDxCcmV3UmVuZGVyZXIgdGV4dD17dGhpcy5wcm9wcy5icmV3LnRleHR9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNoYXJlUGFnZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5jb25zdCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbmNvbnN0IEJyZXdJdGVtID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyA6IHtcblx0XHRcdFx0dGl0bGUgICAgICAgOiAnJyxcblx0XHRcdFx0ZGVzY3JpcHRpb24gOiAnJyxcblxuXHRcdFx0XHRhdXRob3JzIDogW11cblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGRlbGV0ZUJyZXcgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCFjb25maXJtKCdhcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgYnJldz8nKSkgcmV0dXJuO1xuXHRcdGlmKCFjb25maXJtKCdhcmUgeW91IFJFQUxMWSBzdXJlPyBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byByZWNvdmVyIGl0JykpIHJldHVybjtcblxuXHRcdHJlcXVlc3QuZ2V0KGAvYXBpL3JlbW92ZS8ke3RoaXMucHJvcHMuYnJldy5lZGl0SWR9YClcblx0XHRcdC5zZW5kKClcblx0XHRcdC5lbmQoZnVuY3Rpb24oZXJyLCByZXMpe1xuXHRcdFx0XHRsb2NhdGlvbi5yZWxvYWQoKTtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlckRlbGV0ZUJyZXdMaW5rIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5wcm9wcy5icmV3LmVkaXRJZCkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIDxhIG9uQ2xpY2s9e3RoaXMuZGVsZXRlQnJld30+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXRyYXNoJyAvPlxuXHRcdDwvYT47XG5cdH0sXG5cdHJlbmRlckVkaXRMaW5rIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5wcm9wcy5icmV3LmVkaXRJZCkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIDxhIGhyZWY9e2AvZWRpdC8ke3RoaXMucHJvcHMuYnJldy5lZGl0SWR9YH0gdGFyZ2V0PSdfYmxhbmsnIHJlbD0nbm9vcGVuZXIgbm9yZWZlcnJlcic+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXBlbmNpbCcgLz5cblx0XHQ8L2E+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgYnJldyA9IHRoaXMucHJvcHMuYnJldztcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2JyZXdJdGVtJz5cblx0XHRcdDxoMj57YnJldy50aXRsZX08L2gyPlxuXHRcdFx0PHAgY2xhc3NOYW1lPSdkZXNjcmlwdGlvbicgPnticmV3LmRlc2NyaXB0aW9ufTwvcD5cblx0XHRcdDxociAvPlxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0naW5mbyc+XG5cdFx0XHRcdDxzcGFuPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtdXNlcicgLz4ge2JyZXcuYXV0aG9ycy5qb2luKCcsICcpfVxuXHRcdFx0XHQ8L3NwYW4+XG5cdFx0XHRcdDxzcGFuPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtZXllJyAvPiB7YnJldy52aWV3c31cblx0XHRcdFx0PC9zcGFuPlxuXHRcdFx0XHQ8c3Bhbj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXJlZnJlc2gnIC8+IHttb21lbnQoYnJldy51cGRhdGVkQXQpLmZyb21Ob3coKX1cblx0XHRcdFx0PC9zcGFuPlxuXHRcdFx0PC9kaXY+XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdsaW5rcyc+XG5cdFx0XHRcdDxhIGhyZWY9e2Avc2hhcmUvJHticmV3LnNoYXJlSWR9YH0gdGFyZ2V0PSdfYmxhbmsnIHJlbD0nbm9vcGVuZXIgbm9yZWZlcnJlcic+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1zaGFyZS1hbHQnIC8+XG5cdFx0XHRcdDwvYT5cblx0XHRcdFx0e3RoaXMucmVuZGVyRWRpdExpbmsoKX1cblx0XHRcdFx0e3RoaXMucmVuZGVyRGVsZXRlQnJld0xpbmsoKX1cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnJld0l0ZW07XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyAgICAgPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ICAgID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuY29uc3QgTmF2YmFyID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL25hdmJhci5qc3gnKTtcblxuY29uc3QgUmVjZW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9yZWNlbnQubmF2aXRlbS5qc3gnKS5ib3RoO1xuY29uc3QgQWNjb3VudCA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4Jyk7XG5jb25zdCBCcmV3SXRlbSA9IHJlcXVpcmUoJy4vYnJld0l0ZW0vYnJld0l0ZW0uanN4Jyk7XG5cbi8vIGNvbnN0IGJyZXcgPSB7XG4vLyBcdHRpdGxlICAgOiAnU1VQRVIgTG9uZyB0aXRsZSB3b2FoIG5vdycsXG4vLyBcdGF1dGhvcnMgOiBbXVxuLy8gfTtcblxuLy9jb25zdCBCUkVXUyA9IF8udGltZXMoMjUsICgpPT57IHJldHVybiBicmV3O30pO1xuXG5cbmNvbnN0IFVzZXJQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXNlcm5hbWUgOiAnJyxcblx0XHRcdGJyZXdzICAgIDogW11cblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlckJyZXdzIDogZnVuY3Rpb24oYnJld3Mpe1xuXHRcdGlmKCFicmV3cyB8fCAhYnJld3MubGVuZ3RoKSByZXR1cm4gPGRpdiBjbGFzc05hbWU9J25vQnJld3MnPk5vIEJyZXdzLjwvZGl2PjtcblxuXHRcdGNvbnN0IHNvcnRlZEJyZXdzID0gXy5zb3J0QnkoYnJld3MsIChicmV3KT0+eyByZXR1cm4gYnJldy50aXRsZTsgfSk7XG5cblx0XHRyZXR1cm4gXy5tYXAoc29ydGVkQnJld3MsIChicmV3LCBpZHgpPT57XG5cdFx0XHRyZXR1cm4gPEJyZXdJdGVtIGJyZXc9e2JyZXd9IGtleT17aWR4fS8+O1xuXHRcdH0pO1xuXHR9LFxuXG5cdGdldFNvcnRlZEJyZXdzIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5ncm91cEJ5KHRoaXMucHJvcHMuYnJld3MsIChicmV3KT0+e1xuXHRcdFx0cmV0dXJuIChicmV3LnB1Ymxpc2hlZCA/ICdwdWJsaXNoZWQnIDogJ3ByaXZhdGUnKTtcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXJQcml2YXRlQnJld3MgOiBmdW5jdGlvbihwcml2YXRlQnJld3Mpe1xuXHRcdGlmKCFwcml2YXRlQnJld3MgfHwgIXByaXZhdGVCcmV3cy5sZW5ndGgpIHJldHVybjtcblxuXHRcdHJldHVybiBbXG5cdFx0XHQ8aDE+e3RoaXMucHJvcHMudXNlcm5hbWV9J3MgdW5wdWJsaXNoZWQgYnJld3M8L2gxPixcblx0XHRcdHRoaXMucmVuZGVyQnJld3MocHJpdmF0ZUJyZXdzKVxuXHRcdF07XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBicmV3cyA9IHRoaXMuZ2V0U29ydGVkQnJld3MoKTtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ndXNlclBhZ2UgcGFnZSc+XG5cdFx0XHQ8TmF2YmFyPlxuXHRcdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdFx0PFJlY2VudE5hdkl0ZW0gLz5cblx0XHRcdFx0XHQ8QWNjb3VudCAvPlxuXHRcdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdFx0PC9OYXZiYXI+XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250ZW50Jz5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J2FnZSc+XG5cdFx0XHRcdFx0PGgxPnt0aGlzLnByb3BzLnVzZXJuYW1lfSdzIGJyZXdzPC9oMT5cblx0XHRcdFx0XHR7dGhpcy5yZW5kZXJCcmV3cyhicmV3cy5wdWJsaXNoZWQpfVxuXHRcdFx0XHRcdHt0aGlzLnJlbmRlclByaXZhdGVCcmV3cyhicmV3cy5wcml2YXRlKX1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVzZXJQYWdlO1xuIiwiXG5jb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyAgICAgPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ICAgID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBESVNNSVNTX0tFWSA9ICdkaXNtaXNzX3JlbmRlcl93YXJuaW5nJztcblxuY29uc3QgUmVuZGVyV2FybmluZ3MgPSBjcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR3YXJuaW5ncyA6IHt9XG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNoZWNrV2FybmluZ3MoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5jaGVja1dhcm5pbmdzKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5jaGVja1dhcm5pbmdzKTtcblx0fSxcblx0d2FybmluZ3MgOiB7XG5cdFx0Y2hyb21lIDogZnVuY3Rpb24oKXtcblx0XHRcdGNvbnN0IGlzQ2hyb21lID0gL0Nocm9tZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAvR29vZ2xlIEluYy8udGVzdChuYXZpZ2F0b3IudmVuZG9yKTtcblx0XHRcdGlmKCFpc0Nocm9tZSl7XG5cdFx0XHRcdHJldHVybiA8bGkga2V5PSdjaHJvbWUnPlxuXHRcdFx0XHRcdDxlbT5CdWlsdCBmb3IgQ2hyb21lIDwvZW0+IDxiciAvPlxuXHRcdFx0XHRcdE90aGVyIGJyb3dzZXJzIGRvIG5vdCBzdXBwb3J0ICZuYnNwO1xuXHRcdFx0XHRcdDxhIHRhcmdldD0nX2JsYW5rJyBocmVmPSdodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvY29sdW1uLXNwYW4jQnJvd3Nlcl9jb21wYXRpYmlsaXR5Jz5cblx0XHRcdFx0XHRcdGtleSBmZWF0dXJlc1xuXHRcdFx0XHRcdDwvYT4gdGhpcyBzaXRlIHVzZXMuXG5cdFx0XHRcdDwvbGk+O1xuXHRcdFx0fVxuXHRcdH0sXG5cdH0sXG5cdGNoZWNrV2FybmluZ3MgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGhpZGVEaXNtaXNzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oRElTTUlTU19LRVkpO1xuXHRcdGlmKGhpZGVEaXNtaXNzKSByZXR1cm4gdGhpcy5zZXRTdGF0ZSh7IHdhcm5pbmdzOiB7fSB9KTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0d2FybmluZ3MgOiBfLnJlZHVjZSh0aGlzLndhcm5pbmdzLCAociwgZm4sIHR5cGUpPT57XG5cdFx0XHRcdGNvbnN0IGVsZW1lbnQgPSBmbigpO1xuXHRcdFx0XHRpZihlbGVtZW50KSByW3R5cGVdID0gZWxlbWVudDtcblx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHR9LCB7fSlcblx0XHR9KTtcblx0fSxcblx0ZGlzbWlzcyA6IGZ1bmN0aW9uKCl7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oRElTTUlTU19LRVksIHRydWUpO1xuXHRcdHRoaXMuY2hlY2tXYXJuaW5ncygpO1xuXHR9LFxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGlmKF8uaXNFbXB0eSh0aGlzLnN0YXRlLndhcm5pbmdzKSkgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3JlbmRlcldhcm5pbmdzJz5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtdGltZXMgZGlzbWlzcycgb25DbGljaz17dGhpcy5kaXNtaXNzfS8+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlIG9obm8nIC8+XG5cdFx0XHQ8aDM+UmVuZGVyIFdhcm5pbmdzPC9oMz5cblx0XHRcdDxzbWFsbD5JZiB0aGlzIGhvbWVicmV3IGlzIHJlbmRlcmluZyBiYWRseSBpZiBtaWdodCBiZSBiZWNhdXNlIG9mIHRoZSBmb2xsb3dpbmc6PC9zbWFsbD5cblx0XHRcdDx1bD57Xy52YWx1ZXModGhpcy5zdGF0ZS53YXJuaW5ncyl9PC91bD5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcldhcm5pbmdzO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5cbmxldCBDb2RlTWlycm9yO1xuaWYodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcpe1xuXHRDb2RlTWlycm9yID0gcmVxdWlyZSgnY29kZW1pcnJvcicpO1xuXG5cdC8vTGFuZ3VhZ2UgTW9kZXNcblx0cmVxdWlyZSgnY29kZW1pcnJvci9tb2RlL2dmbS9nZm0uanMnKTsgLy9HaXRodWIgZmxhdm91cmVkIG1hcmtkb3duXG5cdHJlcXVpcmUoJ2NvZGVtaXJyb3IvbW9kZS9qYXZhc2NyaXB0L2phdmFzY3JpcHQuanMnKTtcbn1cblxuXG5jb25zdCBDb2RlRWRpdG9yID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bGFuZ3VhZ2UgICAgICAgICA6ICcnLFxuXHRcdFx0dmFsdWUgICAgICAgICAgICA6ICcnLFxuXHRcdFx0d3JhcCAgICAgICAgICAgICA6IGZhbHNlLFxuXHRcdFx0b25DaGFuZ2UgICAgICAgICA6IGZ1bmN0aW9uKCl7fSxcblx0XHRcdG9uQ3Vyc29yQWN0aXZpdHkgOiBmdW5jdGlvbigpe30sXG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29kZU1pcnJvciA9IENvZGVNaXJyb3IodGhpcy5yZWZzLmVkaXRvciwge1xuXHRcdFx0dmFsdWUgICAgICAgIDogdGhpcy5wcm9wcy52YWx1ZSxcblx0XHRcdGxpbmVOdW1iZXJzICA6IHRydWUsXG5cdFx0XHRsaW5lV3JhcHBpbmcgOiB0aGlzLnByb3BzLndyYXAsXG5cdFx0XHRtb2RlICAgICAgICAgOiB0aGlzLnByb3BzLmxhbmd1YWdlLFxuXHRcdFx0ZXh0cmFLZXlzICAgIDoge1xuXHRcdFx0XHQnQ3RybC1CJyA6IHRoaXMubWFrZUJvbGQsXG5cdFx0XHRcdCdDdHJsLUknIDogdGhpcy5tYWtlSXRhbGljXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNvZGVNaXJyb3Iub24oJ2NoYW5nZScsIHRoaXMuaGFuZGxlQ2hhbmdlKTtcblx0XHR0aGlzLmNvZGVNaXJyb3Iub24oJ2N1cnNvckFjdGl2aXR5JywgdGhpcy5oYW5kbGVDdXJzb3JBY3Rpdml0eSk7XG5cdFx0dGhpcy51cGRhdGVTaXplKCk7XG5cdH0sXG5cblx0bWFrZUJvbGQgOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSB0aGlzLmNvZGVNaXJyb3IuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0dGhpcy5jb2RlTWlycm9yLnJlcGxhY2VTZWxlY3Rpb24oYCoqJHtzZWxlY3Rpb259KipgLCAnYXJvdW5kJyk7XG5cdH0sXG5cblx0bWFrZUl0YWxpYyA6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IHRoaXMuY29kZU1pcnJvci5nZXRTZWxlY3Rpb24oKTtcblx0XHR0aGlzLmNvZGVNaXJyb3IucmVwbGFjZVNlbGVjdGlvbihgKiR7c2VsZWN0aW9ufSpgLCAnYXJvdW5kJyk7XG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyA6IGZ1bmN0aW9uKG5leHRQcm9wcyl7XG5cdFx0aWYodGhpcy5jb2RlTWlycm9yICYmIG5leHRQcm9wcy52YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuY29kZU1pcnJvci5nZXRWYWx1ZSgpICE9IG5leHRQcm9wcy52YWx1ZSkge1xuXHRcdFx0dGhpcy5jb2RlTWlycm9yLnNldFZhbHVlKG5leHRQcm9wcy52YWx1ZSk7XG5cdFx0fVxuXHR9LFxuXG5cdHNob3VsZENvbXBvbmVudFVwZGF0ZSA6IGZ1bmN0aW9uKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHNldEN1cnNvclBvc2l0aW9uIDogZnVuY3Rpb24obGluZSwgY2hhcil7XG5cdFx0c2V0VGltZW91dCgoKT0+e1xuXHRcdFx0dGhpcy5jb2RlTWlycm9yLmZvY3VzKCk7XG5cdFx0XHR0aGlzLmNvZGVNaXJyb3IuZG9jLnNldEN1cnNvcihsaW5lLCBjaGFyKTtcblx0XHR9LCAxMCk7XG5cdH0sXG5cblx0dXBkYXRlU2l6ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5jb2RlTWlycm9yLnJlZnJlc2goKTtcblx0fSxcblxuXHRoYW5kbGVDaGFuZ2UgOiBmdW5jdGlvbihlZGl0b3Ipe1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UoZWRpdG9yLmdldFZhbHVlKCkpO1xuXHR9LFxuXHRoYW5kbGVDdXJzb3JBY3Rpdml0eSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5wcm9wcy5vbkN1cnNvckFjdGl2aXR5KHRoaXMuY29kZU1pcnJvci5kb2MuZ2V0Q3Vyc29yKCkpO1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdjb2RlRWRpdG9yJyByZWY9J2VkaXRvcicgLz47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvZGVFZGl0b3I7XG4iLCJjb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBNYXJrZG93biA9IHJlcXVpcmUoJ21hcmtlZCcpO1xuY29uc3QgcmVuZGVyZXIgPSBuZXcgTWFya2Rvd24uUmVuZGVyZXIoKTtcblxuLy9Qcm9jZXNzZXMgdGhlIG1hcmtkb3duIHdpdGhpbiBhbiBIVE1MIGJsb2NrIGlmIGl0J3MganVzdCBhIGNsYXNzLXdyYXBwZXJcbnJlbmRlcmVyLmh0bWwgPSBmdW5jdGlvbiAoaHRtbCkge1xuXHRpZihfLnN0YXJ0c1dpdGgoXy50cmltKGh0bWwpLCAnPGRpdicpICYmIF8uZW5kc1dpdGgoXy50cmltKGh0bWwpLCAnPC9kaXY+Jykpe1xuXHRcdGNvbnN0IG9wZW5UYWcgPSBodG1sLnN1YnN0cmluZygwLCBodG1sLmluZGV4T2YoJz4nKSsxKTtcblx0XHRodG1sID0gaHRtbC5zdWJzdHJpbmcoaHRtbC5pbmRleE9mKCc+JykrMSk7XG5cdFx0aHRtbCA9IGh0bWwuc3Vic3RyaW5nKDAsIGh0bWwubGFzdEluZGV4T2YoJzwvZGl2PicpKTtcblx0XHRyZXR1cm4gYCR7b3BlblRhZ30gJHtNYXJrZG93bihodG1sKX0gPC9kaXY+YDtcblx0fVxuXHRyZXR1cm4gaHRtbDtcbn07XG5cbmNvbnN0IHNhbml0aXplU2NyaXB0VGFncyA9IChjb250ZW50KT0+e1xuXHRyZXR1cm4gY29udGVudFxuXHRcdC5yZXBsYWNlKC88c2NyaXB0L2lnLCAnJmx0O3NjcmlwdCcpXG5cdFx0LnJlcGxhY2UoLzxcXC9zY3JpcHQ+L2lnLCAnJmx0Oy9zY3JpcHQmZ3Q7Jyk7XG59O1xuXG5jb25zdCB0YWdUeXBlcyA9IFsnZGl2JywgJ3NwYW4nLCAnYSddO1xuY29uc3QgdGFnUmVnZXggPSBuZXcgUmVnRXhwKGAoJHtcblx0Xy5tYXAodGFnVHlwZXMsICh0eXBlKT0+e1xuXHRcdHJldHVybiBgXFxcXDwke3R5cGV9fFxcXFw8LyR7dHlwZX0+YDtcblx0fSkuam9pbignfCcpfSlgLCAnZycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRtYXJrZWQgOiBNYXJrZG93bixcblx0cmVuZGVyIDogKHJhd0JyZXdUZXh0KT0+e1xuXHRcdHJldHVybiBNYXJrZG93bihcblx0XHRcdHNhbml0aXplU2NyaXB0VGFncyhyYXdCcmV3VGV4dCksXG5cdFx0XHR7IHJlbmRlcmVyOiByZW5kZXJlciB9XG5cdFx0KTtcblx0fSxcblxuXHR2YWxpZGF0ZSA6IChyYXdCcmV3VGV4dCk9Pntcblx0XHRjb25zdCBlcnJvcnMgPSBbXTtcblx0XHRjb25zdCBsZWZ0b3ZlcnMgPSBfLnJlZHVjZShyYXdCcmV3VGV4dC5zcGxpdCgnXFxuJyksIChhY2MsIGxpbmUsIF9saW5lTnVtYmVyKT0+e1xuXHRcdFx0Y29uc3QgbGluZU51bWJlciA9IF9saW5lTnVtYmVyICsgMTtcblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBsaW5lLm1hdGNoKHRhZ1JlZ2V4KTtcblx0XHRcdGlmKCFtYXRjaGVzIHx8ICFtYXRjaGVzLmxlbmd0aCkgcmV0dXJuIGFjYztcblxuXHRcdFx0Xy5lYWNoKG1hdGNoZXMsIChtYXRjaCk9Pntcblx0XHRcdFx0Xy5lYWNoKHRhZ1R5cGVzLCAodHlwZSk9Pntcblx0XHRcdFx0XHRpZihtYXRjaCA9PSBgPCR7dHlwZX1gKXtcblx0XHRcdFx0XHRcdGFjYy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0dHlwZSA6IHR5cGUsXG5cdFx0XHRcdFx0XHRcdGxpbmUgOiBsaW5lTnVtYmVyXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYobWF0Y2ggPT09IGA8LyR7dHlwZX0+YCl7XG5cdFx0XHRcdFx0XHRpZighYWNjLmxlbmd0aCl7XG5cdFx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRsaW5lIDogbGluZU51bWJlcixcblx0XHRcdFx0XHRcdFx0XHR0eXBlIDogdHlwZSxcblx0XHRcdFx0XHRcdFx0XHR0ZXh0IDogJ1VubWF0Y2hlZCBjbG9zaW5nIHRhZycsXG5cdFx0XHRcdFx0XHRcdFx0aWQgICA6ICdDTE9TRSdcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoXy5sYXN0KGFjYykudHlwZSA9PSB0eXBlKXtcblx0XHRcdFx0XHRcdFx0YWNjLnBvcCgpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGxpbmUgOiBgJHtfLmxhc3QoYWNjKS5saW5lfSB0byAke2xpbmVOdW1iZXJ9YCxcblx0XHRcdFx0XHRcdFx0XHR0eXBlIDogdHlwZSxcblx0XHRcdFx0XHRcdFx0XHR0ZXh0IDogJ1R5cGUgbWlzbWF0Y2ggb24gY2xvc2luZyB0YWcnLFxuXHRcdFx0XHRcdFx0XHRcdGlkICAgOiAnTUlTTUFUQ0gnXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRhY2MucG9wKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGFjYztcblx0XHR9LCBbXSk7XG5cblx0XHRfLmVhY2gobGVmdG92ZXJzLCAodW5tYXRjaGVkKT0+e1xuXHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRsaW5lIDogdW5tYXRjaGVkLmxpbmUsXG5cdFx0XHRcdHR5cGUgOiB1bm1hdGNoZWQudHlwZSxcblx0XHRcdFx0dGV4dCA6ICdVbm1hdGNoZWQgb3BlbmluZyB0YWcnLFxuXHRcdFx0XHRpZCAgIDogJ09QRU4nXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBlcnJvcnM7XG5cdH0sXG59O1xuXG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IE5hdHVyYWxDcml0SWNvbiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L3N2Zy9uYXR1cmFsY3JpdC5zdmcuanN4Jyk7XG5cbmNvbnN0IE5hdiA9IHtcblx0YmFzZSA6IGNyZWF0ZUNsYXNzKHtcblx0XHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIDxuYXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSduYXZDb250ZW50Jz5cblx0XHRcdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L25hdj47XG5cdFx0fVxuXHR9KSxcblx0bG9nbyA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxhIGNsYXNzTmFtZT0nbmF2TG9nbycgaHJlZj0naHR0cHM6Ly9hZ2V1bnRvbGQuY29tJz5cblx0XHRcdDxOYXR1cmFsQ3JpdEljb24gLz5cblx0XHRcdDxzcGFuIGNsYXNzTmFtZT0nbmFtZSc+XG5cdFx0XHRcdEFHRTxzcGFuIGNsYXNzTmFtZT0nY3JpdCc+VW50b2xkPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdDwvYT47XG5cdH0sXG5cblx0c2VjdGlvbiA6IGNyZWF0ZUNsYXNzKHtcblx0XHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSduYXZTZWN0aW9uJz5cblx0XHRcdFx0e3RoaXMucHJvcHMuY2hpbGRyZW59XG5cdFx0XHQ8L2Rpdj47XG5cdFx0fVxuXHR9KSxcblxuXHRpdGVtIDogY3JlYXRlQ2xhc3Moe1xuXHRcdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aWNvbiAgICA6IG51bGwsXG5cdFx0XHRcdGhyZWYgICAgOiBudWxsLFxuXHRcdFx0XHRuZXdUYWIgIDogZmFsc2UsXG5cdFx0XHRcdG9uQ2xpY2sgOiBmdW5jdGlvbigpe30sXG5cdFx0XHRcdGNvbG9yICAgOiBudWxsXG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0aGFuZGxlQ2xpY2sgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5wcm9wcy5vbkNsaWNrKCk7XG5cdFx0fSxcblx0XHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdFx0Y29uc3QgY2xhc3NlcyA9IGN4KCduYXZJdGVtJywgdGhpcy5wcm9wcy5jb2xvciwgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXG5cdFx0XHRsZXQgaWNvbjtcblx0XHRcdGlmKHRoaXMucHJvcHMuaWNvbikgaWNvbiA9IDxpIGNsYXNzTmFtZT17YGZhICR7dGhpcy5wcm9wcy5pY29ufWB9IC8+O1xuXG5cdFx0XHRjb25zdCBwcm9wcyA9IF8ub21pdCh0aGlzLnByb3BzLCBbJ25ld1RhYiddKTtcblxuXHRcdFx0aWYodGhpcy5wcm9wcy5ocmVmKXtcblx0XHRcdFx0cmV0dXJuIDxhIHsuLi5wcm9wc30gY2xhc3NOYW1lPXtjbGFzc2VzfSB0YXJnZXQ9e3RoaXMucHJvcHMubmV3VGFiID8gJ19ibGFuaycgOiAnX3NlbGYnfSA+XG5cdFx0XHRcdFx0e3RoaXMucHJvcHMuY2hpbGRyZW59XG5cdFx0XHRcdFx0e2ljb259XG5cdFx0XHRcdDwvYT47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gPGRpdiB7Li4ucHJvcHN9IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30gPlxuXHRcdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxuXHRcdFx0XHRcdHtpY29ufVxuXHRcdFx0XHQ8L2Rpdj47XG5cdFx0XHR9XG5cdFx0fVxuXHR9KSxcblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdjsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IFNwbGl0UGFuZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0b3JhZ2VLZXkgICA6ICduYXR1cmFsY3JpdC1wYW5lLXNwbGl0Jyxcblx0XHRcdG9uRHJhZ0ZpbmlzaCA6IGZ1bmN0aW9uKCl7fSAvL2ZpcmVzIHdoZW4gZHJhZ2dpbmdcblxuXHRcdH07XG5cdH0sXG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzaXplICAgICAgIDogbnVsbCxcblx0XHRcdGlzRHJhZ2dpbmcgOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgcGFuZVNpemUgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5wcm9wcy5zdG9yYWdlS2V5KTtcblx0XHRpZihwYW5lU2l6ZSl7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0c2l6ZSA6IHBhbmVTaXplXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cblx0aGFuZGxlVXAgOiBmdW5jdGlvbigpe1xuXHRcdGlmKHRoaXMuc3RhdGUuaXNEcmFnZ2luZyl7XG5cdFx0XHR0aGlzLnByb3BzLm9uRHJhZ0ZpbmlzaCh0aGlzLnN0YXRlLnNpemUpO1xuXHRcdFx0d2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMucHJvcHMuc3RvcmFnZUtleSwgdGhpcy5zdGF0ZS5zaXplKTtcblx0XHR9XG5cdFx0dGhpcy5zZXRTdGF0ZSh7IGlzRHJhZ2dpbmc6IGZhbHNlIH0pO1xuXHR9LFxuXHRoYW5kbGVEb3duIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnNldFN0YXRlKHsgaXNEcmFnZ2luZzogdHJ1ZSB9KTtcblx0XHQvL3RoaXMudW5Gb2N1cygpXG5cdH0sXG5cdGhhbmRsZU1vdmUgOiBmdW5jdGlvbihlKXtcblx0XHRpZighdGhpcy5zdGF0ZS5pc0RyYWdnaW5nKSByZXR1cm47XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzaXplIDogZS5wYWdlWFxuXHRcdH0pO1xuXHR9LFxuXHQvKlxuXHR1bkZvY3VzIDogZnVuY3Rpb24oKSB7XG5cdFx0aWYoZG9jdW1lbnQuc2VsZWN0aW9uKXtcblx0XHRcdFx0ZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG5cdFx0fWVsc2V7XG5cdFx0XHR3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cdFx0fVxuXHR9LFxuKi9cblx0cmVuZGVyRGl2aWRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdkaXZpZGVyJyBvbk1vdXNlRG93bj17dGhpcy5oYW5kbGVEb3dufT5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdkb3RzJz5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1jaXJjbGUnIC8+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtY2lyY2xlJyAvPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWNpcmNsZScgLz5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nc3BsaXRQYW5lJyBvbk1vdXNlTW92ZT17dGhpcy5oYW5kbGVNb3ZlfSBvbk1vdXNlVXA9e3RoaXMuaGFuZGxlVXB9PlxuXHRcdFx0PFBhbmUgcmVmPSdwYW5lMScgd2lkdGg9e3RoaXMuc3RhdGUuc2l6ZX0+e3RoaXMucHJvcHMuY2hpbGRyZW5bMF19PC9QYW5lPlxuXHRcdFx0e3RoaXMucmVuZGVyRGl2aWRlcigpfVxuXHRcdFx0PFBhbmUgcmVmPSdwYW5lMic+e3RoaXMucHJvcHMuY2hpbGRyZW5bMV19PC9QYW5lPlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cblxuXG5cblxuXG5jb25zdCBQYW5lID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0d2lkdGggOiBudWxsXG5cdFx0fTtcblx0fSxcblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRsZXQgc3R5bGVzID0ge307XG5cdFx0aWYodGhpcy5wcm9wcy53aWR0aCl7XG5cdFx0XHRzdHlsZXMgPSB7XG5cdFx0XHRcdGZsZXggIDogJ25vbmUnLFxuXHRcdFx0XHR3aWR0aCA6IGAke3RoaXMucHJvcHMud2lkdGh9cHhgXG5cdFx0XHR9O1xuXHRcdH1cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9e2N4KCdwYW5lJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpfSBzdHlsZT17c3R5bGVzfT5cblx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTcGxpdFBhbmU7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByb3BzKXtcblx0cmV0dXJuIDxzdmcgdmVyc2lvbj0nMS4xJyB4PScwcHgnIHk9JzBweCcgdmlld0JveD0nMCAwIDEwMCAxMDAnIGVuYWJsZUJhY2tncm91bmQ9J25ldyAwIDAgMTAwIDEwMCc+PHBhdGggZD0nTTgwLjY0NCw4Ny45ODJsMTYuNTkyLTQxLjQ4M2MwLjA1NC0wLjEyOCwwLjA4OC0wLjI2LDAuMTA4LTAuMzk0YzAuMDA2LTAuMDM5LDAuMDA3LTAuMDc3LDAuMDExLTAuMTE2ICBjMC4wMDctMC4wODcsMC4wMDgtMC4xNzQsMC4wMDItMC4yNmMtMC4wMDMtMC4wNDYtMC4wMDctMC4wOTEtMC4wMTQtMC4xMzdjLTAuMDE0LTAuMDg5LTAuMDM2LTAuMTc2LTAuMDYzLTAuMjYyICBjLTAuMDEyLTAuMDM0LTAuMDE5LTAuMDY5LTAuMDMxLTAuMTAzYy0wLjA0Ny0wLjExOC0wLjEwNi0wLjIyOS0wLjE3OC0wLjMzNWMtMC4wMDQtMC4wMDYtMC4wMDYtMC4wMTItMC4wMS0wLjAxOEw2Ny45OTksMy4zNTggIGMtMC4wMS0wLjAxMy0wLjAwMy0wLjAyNi0wLjAxMy0wLjA0TDY4LDMuMzE1VjRjMCwwLTAuMDMzLDAtMC4wMzcsMGMtMC40MDMtMS0xLjA5NC0xLjEyNC0xLjc1Mi0wLjk3NiAgYzAsMC4wMDQtMC4wMDQtMC4wMTItMC4wMDctMC4wMTJDNjYuMjAxLDMuMDE2LDY2LjE5NCwzLDY2LjE5NCwzSDY2LjE5aC0wLjAwM2gtMC4wMDNoLTAuMDA0aC0wLjAwM2MwLDAtMC4wMDQsMC0wLjAwNywwICBzLTAuMDAzLTAuMTUxLTAuMDA3LTAuMTUxTDIwLjQ5NSwxNS4yMjdjLTAuMDI1LDAuMDA3LTAuMDQ2LTAuMDE5LTAuMDcxLTAuMDExYy0wLjA4NywwLjAyOC0wLjE3MiwwLjA0MS0wLjI1MywwLjA4MyAgYy0wLjA1NCwwLjAyNy0wLjEwMiwwLjA1My0wLjE1MiwwLjA4NWMtMC4wNTEsMC4wMzMtMC4xMDEsMC4wNjEtMC4xNDcsMC4wOTljLTAuMDQ0LDAuMDM2LTAuMDg0LDAuMDczLTAuMTI0LDAuMTEzICBjLTAuMDQ4LDAuMDQ4LTAuMDkzLDAuMDk4LTAuMTM2LDAuMTUyYy0wLjAzLDAuMDM5LTAuMDU5LDAuMDc2LTAuMDg1LDAuMTE3Yy0wLjA0NiwwLjA3LTAuMDg0LDAuMTQ1LTAuMTIsMC4yMjMgIGMtMC4wMTEsMC4wMjMtMC4wMjcsMC4wNDItMC4wMzYsMC4wNjZMMi45MTEsNTcuNjY0QzIuODkxLDU3LjcxNSwzLDU3Ljc2OCwzLDU3LjgydjAuMDAyYzAsMC4xODYsMCwwLjM3NSwwLDAuNTYyICBjMCwwLjAwNCwwLDAuMDA0LDAsMC4wMDhjMCwwLDAsMCwwLDAuMDAyYzAsMCwwLDAsMCwwLjAwNHYwLjAwNHYwLjAwMmMwLDAuMDc0LTAuMDAyLDAuMTUsMC4wMTIsMC4yMjMgIEMzLjAxNSw1OC42MzEsMyw1OC42MzEsMyw1OC42MzNjMCwwLjAwNCwwLDAuMDA0LDAsMC4wMDhjMCwwLDAsMCwwLDAuMDAyYzAsMCwwLDAsMCwwLjAwNHYwLjAwNGMwLDAsMCwwLDAsMC4wMDJ2MC4wMDQgIGMwLDAuMTkxLTAuMDQ2LDAuMzc3LDAuMDYsMC41NDVjMC0wLjAwMi0wLjAzLDAuMDA0LTAuMDMsMC4wMDRjMCwwLjAwNC0wLjAzLDAuMDA0LTAuMDMsMC4wMDRjMCwwLjAwMiwwLDAuMDAyLDAsMC4wMDIgIGwtMC4wNDUsMC4wMDRjMC4wMywwLjA0NywwLjAzNiwwLjA5LDAuMDY4LDAuMTMzbDI5LjA0OSwzNy4zNTljMC4wMDIsMC4wMDQsMCwwLjAwNiwwLjAwMiwwLjAxYzAuMDAyLDAuMDAyLDAsMC4wMDQsMC4wMDIsMC4wMDggIGMwLjAwNiwwLjAwOCwwLjAxNCwwLjAxNCwwLjAyMSwwLjAyMWMwLjAyNCwwLjAyOSwwLjA1MiwwLjA1MSwwLjA3OCwwLjA3OGMwLjAyNywwLjAyOSwwLjA1MywwLjA1NywwLjA4MiwwLjA4MiAgYzAuMDMsMC4wMjcsMC4wNTUsMC4wNjIsMC4wODYsMC4wODhjMC4wMjYsMC4wMiwwLjA1NywwLjAzMywwLjA4NCwwLjA1M2MwLjA0LDAuMDI3LDAuMDgxLDAuMDUzLDAuMTIzLDAuMDc2ICBjMC4wMDUsMC4wMDQsMC4wMSwwLjAwOCwwLjAxNiwwLjAxYzAuMDg3LDAuMDUxLDAuMTc2LDAuMDksMC4yNjksMC4xMjNjMC4wNDIsMC4wMTQsMC4wODIsMC4wMzEsMC4xMjUsMC4wNDMgIGMwLjAyMSwwLjAwNiwwLjA0MSwwLjAxOCwwLjA2MiwwLjAyMWMwLjEyMywwLjAyNywwLjI0OSwwLjA0MywwLjM3NSwwLjA0M2MwLjA5OSwwLDAuMjAyLTAuMDEyLDAuMzA0LTAuMDI3bDQ1LjY2OS04LjMwMyAgYzAuMDU3LTAuMDEsMC4xMDgtMC4wMjEsMC4xNjMtMC4wMzdDNzkuNTQ3LDg4Ljk5Miw3OS41NjIsODksNzkuNTc1LDg5YzAuMDA0LDAsMC4wMDQsMCwwLjAwNCwwYzAuMDIxLDAsMC4wMzktMC4wMjcsMC4wNi0wLjAzNSAgYzAuMDQxLTAuMDE0LDAuMDgtMC4wMzQsMC4xMi0wLjA1MmMwLjAyMS0wLjAxLDAuMDQ0LTAuMDE5LDAuMDY0LTAuMDNjMC4wMTctMC4wMSwwLjAyNi0wLjAxNSwwLjAzMy0wLjAxNyAgYzAuMDE0LTAuMDA4LDAuMDIzLTAuMDIxLDAuMDM3LTAuMDI4YzAuMTQtMC4wNzgsMC4yNjktMC4xNzQsMC4zOC0wLjI4NWMwLjAxNC0wLjAxNiwwLjAyNC0wLjAzNCwwLjAzOC0wLjA0OCAgYzAuMTA5LTAuMTE5LDAuMjAxLTAuMjUyLDAuMjcxLTAuMzk4YzAuMDA2LTAuMDEsMC4wMTYtMC4wMTgsMC4wMjEtMC4wMjljMC4wMDQtMC4wMDgsMC4wMDgtMC4wMTcsMC4wMTEtMC4wMjYgIGMwLjAwMi0wLjAwNCwwLjAwMy0wLjAwNiwwLjAwNS0wLjAxQzgwLjYyNyw4OC4wMjEsODAuNjM1LDg4LjAwMiw4MC42NDQsODcuOTgyeiBNNzcuNjExLDg0LjQ2MUw0OC44MDUsNjYuNDUzbDMyLjQwNy0yNS4yMDIgIEw3Ny42MTEsODQuNDYxeiBNNDYuODE3LDYzLjcwOUwzNS44NjMsMjMuNTQybDQzLjgxOCwxNC42MDhMNDYuODE3LDYzLjcwOXogTTg0LjY2OCw0MC41NDJsOC45MjYsNS45NTJsLTExLjkwMiwyOS43NSAgTDg0LjY2OCw0MC41NDJ6IE04OS4xMjgsMzkuNDQ2TDg0LjUzLDM2LjM4bC02LjEyOS0xMi4yNTdMODkuMTI4LDM5LjQ0NnogTTc5Ljg3NiwzNC42NDVMMzcuODA3LDIwLjYyMkw2NS44NTQsNi41OTlMNzkuODc2LDM0LjY0NSAgeiBNMzMuMjY4LDE5LjEwN2wtNi40ODUtMi4xNjJsMjMuNzgxLTYuNDg3TDMzLjI2OCwxOS4xMDd6IE0yMS45MiwxOC44OTVsOC42NywyLjg5MUwxMC4zNTcsNDcuNzk4TDIxLjkyLDE4Ljg5NXogTTMyLjY1MiwyNC42NDkgIGwxMC44NDUsMzkuNzU3TDcuMzUxLDU3LjE3OEwzMi42NTIsMjQuNjQ5eiBNNDMuNDcyLDY3Ljg1N0wzMi45NjksOTIuMzYzTDguNDYyLDYwLjg1NUw0My40NzIsNjcuODU3eiBNNDYuNjMxLDY5LjA5bDI3LjgyNiwxNy4zOTMgIGwtMzguMjYzLDYuOTU5TDQ2LjYzMSw2OS4wOXonPjwvcGF0aD48L3N2Zz47XG59O1xuXG4iXX0=
