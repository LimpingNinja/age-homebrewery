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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaG9tZWJyZXcvYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3giLCJjbGllbnQvaG9tZWJyZXcvYnJld1JlbmRlcmVyL2Vycm9yQmFyL2Vycm9yQmFyLmpzeCIsImNsaWVudC9ob21lYnJldy9icmV3UmVuZGVyZXIvbm90aWZpY2F0aW9uUG9wdXAvbm90aWZpY2F0aW9uUG9wdXAuanN4IiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9lZGl0b3IuanN4IiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9tZXRhZGF0YUVkaXRvci9tZXRhZGF0YUVkaXRvci5qc3giLCJjbGllbnQvaG9tZWJyZXcvZWRpdG9yL3NuaXBwZXRiYXIvc25pcHBldGJhci5qc3giLCJjbGllbnQvaG9tZWJyZXcvZWRpdG9yL3NuaXBwZXRiYXIvc25pcHBldHMvY2xhc3NmZWF0dXJlLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9jbGFzc3RhYmxlLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9jb3ZlcnBhZ2UuZ2VuLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL21hZ2ljLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9tb25zdGVyYmxvY2suZ2VuLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL3NuaXBwZXRzLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL3RhYmxlT2ZDb250ZW50cy5nZW4uanMiLCJjbGllbnQvaG9tZWJyZXcvaG9tZWJyZXcuanN4IiwiY2xpZW50L2hvbWVicmV3L25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4IiwiY2xpZW50L2hvbWVicmV3L25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvbmF2YmFyLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvcGF0cmVvbi5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvcHJpbnQubmF2aXRlbS5qc3giLCJjbGllbnQvaG9tZWJyZXcvbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9wYWdlcy9lZGl0UGFnZS9lZGl0UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvZXJyb3JQYWdlL2Vycm9yUGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvaG9tZVBhZ2UvaG9tZVBhZ2UuanN4IiwiY2xpZW50L2hvbWVicmV3L3BhZ2VzL25ld1BhZ2UvbmV3UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvcHJpbnRQYWdlL3ByaW50UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvc2hhcmVQYWdlL3NoYXJlUGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvdXNlclBhZ2UvYnJld0l0ZW0vYnJld0l0ZW0uanN4IiwiY2xpZW50L2hvbWVicmV3L3BhZ2VzL3VzZXJQYWdlL3VzZXJQYWdlLmpzeCIsInNoYXJlZC9ob21lYnJld2VyeS9yZW5kZXJXYXJuaW5ncy9yZW5kZXJXYXJuaW5ncy5qc3giLCJzaGFyZWQvbmF0dXJhbGNyaXQvY29kZUVkaXRvci9jb2RlRWRpdG9yLmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9tYXJrZG93bi5qcyIsInNoYXJlZC9uYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9zcGxpdFBhbmUvc3BsaXRQYW5lLmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9zdmcvbmF0dXJhbGNyaXQuc3ZnLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBTSxRQUFRLFFBQVEsT0FB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RDtBQUNMLFFBQUssS0FBTCxDQUFXO0FBRE4sR0FBUDtBQUdBO0FBakJ1QixDQUFaLENBQWI7O0FBcUJBLE9BQU8sT0FBUCxHQUFpQixTQUFqQjs7Ozs7QUNuR0EsSUFBTSxRQUFRLFFBQVEsT0FBUixDQUFkO0FBQ0EsSUFBTSxjQUFjLFFBQVEsb0JBQVIsQ0FBcEI7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFVBQVMsS0FBVCxFQUFlO0FBQy9CLFFBQU87QUFBQTtBQUFBLElBQUssU0FBUSxLQUFiLEVBQW1CLEdBQUUsS0FBckIsRUFBMkIsR0FBRSxLQUE3QixFQUFtQyxTQUFRLGFBQTNDLEVBQXlELGtCQUFpQixpQkFBMUU7QUFBNEYsZ0NBQU0sR0FBRSxxOEZBQVI7QUFBNUYsRUFBUDtBQUNBLENBRkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IE1hcmtkb3duID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbWFya2Rvd24uanMnKTtcbmNvbnN0IEVycm9yQmFyID0gcmVxdWlyZSgnLi9lcnJvckJhci9lcnJvckJhci5qc3gnKTtcblxuLy9UT0RPOiBtb3ZlIHRvIHRoZSBicmV3IHJlbmRlcmVyXG5jb25zdCBSZW5kZXJXYXJuaW5ncyA9IHJlcXVpcmUoJ2hvbWVicmV3ZXJ5L3JlbmRlcldhcm5pbmdzL3JlbmRlcldhcm5pbmdzLmpzeCcpO1xuY29uc3QgTm90aWZpY2F0aW9uUG9wdXAgPSByZXF1aXJlKCcuL25vdGlmaWNhdGlvblBvcHVwL25vdGlmaWNhdGlvblBvcHVwLmpzeCcpO1xuXG5jb25zdCBQQUdFX0hFSUdIVCA9IDEwNTY7XG5jb25zdCBQUFJfVEhSRVNIT0xEID0gNTA7XG5cbmNvbnN0IEJyZXdSZW5kZXJlciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRleHQgICA6ICcnLFxuXHRcdFx0ZXJyb3JzIDogW11cblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBwYWdlcyA9IHRoaXMucHJvcHMudGV4dC5zcGxpdCgnXFxcXHBhZ2UnKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR2aWV3YWJsZVBhZ2VOdW1iZXIgOiAwLFxuXHRcdFx0aGVpZ2h0ICAgICAgICAgICAgIDogMCxcblx0XHRcdGlzTW91bnRlZCAgICAgICAgICA6IGZhbHNlLFxuXG5cdFx0XHRwYWdlcyAgOiBwYWdlcyxcblx0XHRcdHVzZVBQUiA6IHBhZ2VzLmxlbmd0aCA+PSBQUFJfVEhSRVNIT0xELFxuXHRcdH07XG5cdH0sXG5cdGhlaWdodCAgICAgOiAwLFxuXHRsYXN0UmVuZGVyIDogPGRpdj48L2Rpdj4sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVTaXplKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVTaXplKTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIDogZnVuY3Rpb24obmV4dFByb3BzKSB7XG5cdFx0Y29uc3QgcGFnZXMgPSBuZXh0UHJvcHMudGV4dC5zcGxpdCgnXFxcXHBhZ2UnKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHBhZ2VzICA6IHBhZ2VzLFxuXHRcdFx0dXNlUFBSIDogcGFnZXMubGVuZ3RoID49IFBQUl9USFJFU0hPTERcblx0XHR9KTtcblx0fSxcblxuXHR1cGRhdGVTaXplIDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRoZWlnaHQgICAgOiB0aGlzLnJlZnMubWFpbi5wYXJlbnROb2RlLmNsaWVudEhlaWdodCxcblx0XHRcdGlzTW91bnRlZCA6IHRydWVcblx0XHR9KTtcblx0fSxcblxuXHRoYW5kbGVTY3JvbGwgOiBmdW5jdGlvbihlKXtcblx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcblx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUpPT4oe1xuXHRcdFx0dmlld2FibGVQYWdlTnVtYmVyIDogTWF0aC5mbG9vcih0YXJnZXQuc2Nyb2xsVG9wIC8gdGFyZ2V0LnNjcm9sbEhlaWdodCAqIHByZXZTdGF0ZS5wYWdlcy5sZW5ndGgpXG5cdFx0fSkpO1xuXHR9LFxuXG5cdHNob3VsZFJlbmRlciA6IGZ1bmN0aW9uKHBhZ2VUZXh0LCBpbmRleCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUuaXNNb3VudGVkKSByZXR1cm4gZmFsc2U7XG5cblx0XHRjb25zdCB2aWV3SW5kZXggPSB0aGlzLnN0YXRlLnZpZXdhYmxlUGFnZU51bWJlcjtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggLSAzKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggLSAyKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggLSAxKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXgpICAgICByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggKyAxKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggKyAyKSByZXR1cm4gdHJ1ZTtcblx0XHRpZihpbmRleCA9PSB2aWV3SW5kZXggKyAzKSByZXR1cm4gdHJ1ZTtcblxuXHRcdC8vQ2hlY2sgZm9yIHN0eWxlIHRhZ2VzXG5cdFx0aWYocGFnZVRleHQuaW5kZXhPZignPHN0eWxlPicpICE9PSAtMSkgcmV0dXJuIHRydWU7XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0cmVuZGVyUGFnZUluZm8gOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ncGFnZUluZm8nPlxuXHRcdFx0e3RoaXMuc3RhdGUudmlld2FibGVQYWdlTnVtYmVyICsgMX0gLyB7dGhpcy5zdGF0ZS5wYWdlcy5sZW5ndGh9XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlclBQUm1zZyA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUudXNlUFBSKSByZXR1cm47XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3Bwcl9tc2cnPlxuXHRcdFx0UGFydGlhbCBQYWdlIFJlbmRlcmVyIGVuYWJsZWQsIGJlY2F1c2UgeW91ciBicmV3IGlzIHNvIGxhcmdlLiBNYXkgZWZmZWN0IHJlbmRlcmluZy5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyRHVtbXlQYWdlIDogZnVuY3Rpb24oaW5kZXgpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nYWdlJyBpZD17YHAke2luZGV4ICsgMX1gfSBrZXk9e2luZGV4fT5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtc3Bpbm5lciBmYS1zcGluJyAvPlxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXJQYWdlIDogZnVuY3Rpb24ocGFnZVRleHQsIGluZGV4KXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2FnZScgaWQ9e2BwJHtpbmRleCArIDF9YH0gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBNYXJrZG93bi5yZW5kZXIocGFnZVRleHQpIH19IGtleT17aW5kZXh9IC8+O1xuXHR9LFxuXG5cdHJlbmRlclBhZ2VzIDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLnN0YXRlLnVzZVBQUil7XG5cdFx0XHRyZXR1cm4gXy5tYXAodGhpcy5zdGF0ZS5wYWdlcywgKHBhZ2UsIGluZGV4KT0+e1xuXHRcdFx0XHRpZih0aGlzLnNob3VsZFJlbmRlcihwYWdlLCBpbmRleCkpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlclBhZ2UocGFnZSwgaW5kZXgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckR1bW15UGFnZShpbmRleCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZih0aGlzLnByb3BzLmVycm9ycyAmJiB0aGlzLnByb3BzLmVycm9ycy5sZW5ndGgpIHJldHVybiB0aGlzLmxhc3RSZW5kZXI7XG5cdFx0dGhpcy5sYXN0UmVuZGVyID0gXy5tYXAodGhpcy5zdGF0ZS5wYWdlcywgKHBhZ2UsIGluZGV4KT0+e1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyUGFnZShwYWdlLCBpbmRleCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHRoaXMubGFzdFJlbmRlcjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8UmVhY3QuRnJhZ21lbnQ+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdicmV3UmVuZGVyZXInXG5cdFx0XHRcdFx0b25TY3JvbGw9e3RoaXMuaGFuZGxlU2Nyb2xsfVxuXHRcdFx0XHRcdHJlZj0nbWFpbidcblx0XHRcdFx0XHRzdHlsZT17eyBoZWlnaHQ6IHRoaXMuc3RhdGUuaGVpZ2h0IH19PlxuXG5cdFx0XHRcdFx0PEVycm9yQmFyIGVycm9ycz17dGhpcy5wcm9wcy5lcnJvcnN9IC8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J3BvcHVwcyc+XG5cdFx0XHRcdFx0XHQ8UmVuZGVyV2FybmluZ3MgLz5cblx0XHRcdFx0XHRcdDxOb3RpZmljYXRpb25Qb3B1cCAvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J3BhZ2VzJyByZWY9J3BhZ2VzJz5cblx0XHRcdFx0XHRcdHt0aGlzLnJlbmRlclBhZ2VzKCl9XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2Pjtcblx0XHRcdFx0e3RoaXMucmVuZGVyUGFnZUluZm8oKX1cblx0XHRcdFx0e3RoaXMucmVuZGVyUFBSbXNnKCl9XG5cdFx0XHQ8L1JlYWN0LkZyYWdtZW50PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyZXdSZW5kZXJlcjtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IEVycm9yQmFyID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZXJyb3JzIDogW11cblx0XHR9O1xuXHR9LFxuXG5cdGhhc09wZW5FcnJvciAgOiBmYWxzZSxcblx0aGFzQ2xvc2VFcnJvciA6IGZhbHNlLFxuXHRoYXNNYXRjaEVycm9yIDogZmFsc2UsXG5cblx0cmVuZGVyRXJyb3JzIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmhhc09wZW5FcnJvciA9IGZhbHNlO1xuXHRcdHRoaXMuaGFzQ2xvc2VFcnJvciA9IGZhbHNlO1xuXHRcdHRoaXMuaGFzTWF0Y2hFcnJvciA9IGZhbHNlO1xuXG5cblx0XHRjb25zdCBlcnJvcnMgPSBfLm1hcCh0aGlzLnByb3BzLmVycm9ycywgKGVyciwgaWR4KT0+e1xuXHRcdFx0aWYoZXJyLmlkID09ICdPUEVOJykgdGhpcy5oYXNPcGVuRXJyb3IgPSB0cnVlO1xuXHRcdFx0aWYoZXJyLmlkID09ICdDTE9TRScpIHRoaXMuaGFzQ2xvc2VFcnJvciA9IHRydWU7XG5cdFx0XHRpZihlcnIuaWQgPT0gJ01JU01BVENIJykgdGhpcy5oYXNNYXRjaEVycm9yID0gdHJ1ZTtcblx0XHRcdHJldHVybiA8bGkga2V5PXtpZHh9PlxuXHRcdFx0XHRMaW5lIHtlcnIubGluZX0gOiB7ZXJyLnRleHR9LCAne2Vyci50eXBlfScgdGFnXG5cdFx0XHQ8L2xpPjtcblx0XHR9KTtcblxuXHRcdHJldHVybiA8dWw+e2Vycm9yc308L3VsPjtcblx0fSxcblxuXHRyZW5kZXJQcm90aXAgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IG1zZyA9IFtdO1xuXHRcdGlmKHRoaXMuaGFzT3BlbkVycm9yKXtcblx0XHRcdG1zZy5wdXNoKDxkaXY+XG5cdFx0XHRcdEFuIHVubWF0Y2hlZCBvcGVuaW5nIHRhZyBtZWFucyB0aGVyZSdzIGFuIG9wZW5lZCB0YWcgdGhhdCBpc24ndCBjbG9zZWQsIHlvdSBuZWVkIHRvIGNsb3NlIGEgdGFnLCBsaWtlIHRoaXMgeyc8L2Rpdj4nfS4gTWFrZSBzdXJlIHRvIG1hdGNoIHR5cGVzIVxuXHRcdFx0PC9kaXY+KTtcblx0XHR9XG5cblx0XHRpZih0aGlzLmhhc0Nsb3NlRXJyb3Ipe1xuXHRcdFx0bXNnLnB1c2goPGRpdj5cblx0XHRcdFx0QW4gdW5tYXRjaGVkIGNsb3NpbmcgdGFnIG1lYW5zIHlvdSBjbG9zZWQgYSB0YWcgd2l0aG91dCBvcGVuaW5nIGl0LiBFaXRoZXIgcmVtb3ZlIGl0LCB5b3UgY2hlY2sgdG8gd2hlcmUgeW91IHRoaW5rIHlvdSBvcGVuZWQgaXQuXG5cdFx0XHQ8L2Rpdj4pO1xuXHRcdH1cblxuXHRcdGlmKHRoaXMuaGFzTWF0Y2hFcnJvcil7XG5cdFx0XHRtc2cucHVzaCg8ZGl2PlxuXHRcdFx0XHRBIHR5cGUgbWlzbWF0Y2ggbWVhbnMgeW91IGNsb3NlZCBhIHRhZywgYnV0IHRoZSBsYXN0IG9wZW4gdGFnIHdhcyBhIGRpZmZlcmVudCB0eXBlLlxuXHRcdFx0PC9kaXY+KTtcblx0XHR9XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdwcm90aXBzJz5cblx0XHRcdDxoND5Qcm90aXBzITwvaDQ+XG5cdFx0XHR7bXNnfVxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnByb3BzLmVycm9ycy5sZW5ndGgpIHJldHVybiBudWxsO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdlcnJvckJhcic+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJyAvPlxuXHRcdFx0PGgzPiBUaGVyZSBhcmUgSFRNTCBlcnJvcnMgaW4geW91ciBtYXJrdXA8L2gzPlxuXHRcdFx0PHNtYWxsPklmIHRoZXNlIGFyZW4ndCBmaXhlZCB5b3VyIGJyZXcgd2lsbCBub3QgcmVuZGVyIHByb3Blcmx5IHdoZW4geW91IHByaW50IGl0IHRvIFBERiBvciBzaGFyZSBpdDwvc21hbGw+XG5cdFx0XHR7dGhpcy5yZW5kZXJFcnJvcnMoKX1cblx0XHRcdDxociAvPlxuXHRcdFx0e3RoaXMucmVuZGVyUHJvdGlwKCl9XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFcnJvckJhcjtcbiIsIlxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcdC8vVW51c2VkIHZhcmlhYmxlXG5cbmNvbnN0IERJU01JU1NfS0VZID0gJ2Rpc21pc3Nfbm90aWZpY2F0aW9uJztcblxuY29uc3QgTm90aWZpY2F0aW9uUG9wdXAgPSBjcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRub3RpZmljYXRpb25zIDoge31cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY2hlY2tOb3RpZmljYXRpb25zKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuY2hlY2tOb3RpZmljYXRpb25zKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5jaGVja05vdGlmaWNhdGlvbnMpO1xuXHR9LFxuXHRub3RpZmljYXRpb25zIDoge1xuXHRcdGZhcSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gPGxpIGtleT0nZmFxJz5cblx0XHRcdFx0PGVtPlByb3RlY3QgeW91ciB3b3JrISA8L2VtPiA8YnIgLz5cblx0XHRcdFx0QXQgdGhlIG1vbWVudCB3ZSBkbyBub3Qgc2F2ZSBhIGhpc3Rvcnkgb2YgeW91ciBwcm9qZWN0cywgc28gcGxlYXNlIG1ha2UgZnJlcXVlbnQgYmFja3VwcyBvZiB5b3VyIGJyZXdzISAgJm5ic3A7XG5cdFx0XHRcdDxhIHRhcmdldD0nX2JsYW5rJyBocmVmPSdodHRwczovL3d3dy5yZWRkaXQuY29tL3IvaG9tZWJyZXdlcnkvY29tbWVudHMvYWRoNmxoL2ZhcXNfcHNhc19hbm5vdW5jZW1lbnRzLyc+XG5cdFx0XHRcdFx0U2VlIHRoZSBGQVFcblx0XHRcdFx0PC9hPiB0byBsZWFybiBob3cgdG8gYXZvaWQgbG9zaW5nIHlvdXIgd29yayFcblx0XHRcdDwvbGk+O1xuXHRcdH0sXG5cdH0sXG5cdGNoZWNrTm90aWZpY2F0aW9ucyA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgaGlkZURpc21pc3MgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShESVNNSVNTX0tFWSk7XG5cdFx0aWYoaGlkZURpc21pc3MpIHJldHVybiB0aGlzLnNldFN0YXRlKHsgbm90aWZpY2F0aW9uczoge30gfSk7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdG5vdGlmaWNhdGlvbnMgOiBfLm1hcFZhbHVlcyh0aGlzLm5vdGlmaWNhdGlvbnMsIChmbik9PnsgcmV0dXJuIGZuKCk7IH0pXHQvL0NvbnZlcnQgbm90aWZpY2F0aW9uIGZ1bmN0aW9ucyBpbnRvIHRoZWlyIHJldHVybiB0ZXh0IHZhbHVlXG5cdFx0fSk7XG5cdH0sXG5cdGRpc21pc3MgOiBmdW5jdGlvbigpe1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKERJU01JU1NfS0VZLCB0cnVlKTtcblx0XHR0aGlzLmNoZWNrTm90aWZpY2F0aW9ucygpO1xuXHR9LFxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGlmKF8uaXNFbXB0eSh0aGlzLnN0YXRlLm5vdGlmaWNhdGlvbnMpKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nbm90aWZpY2F0aW9uUG9wdXAnPlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS10aW1lcyBkaXNtaXNzJyBvbkNsaWNrPXt0aGlzLmRpc21pc3N9Lz5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtaW5mby1jaXJjbGUgaW5mbycgLz5cblx0XHRcdDxoMz5Ob3RpY2U8L2gzPlxuXHRcdFx0PHNtYWxsPlRoaXMgd2Vic2l0ZSBpcyBhbHdheXMgaW1wcm92aW5nIGFuZCB3ZSBhcmUgc3RpbGwgYWRkaW5nIG5ldyBmZWF0dXJlcyBhbmQgc3F1YXNoaW5nIGJ1Z3MuIEtlZXAgdGhlIGZvbGxvd2luZyBpbiBtaW5kOjwvc21hbGw+XG5cdFx0XHQ8dWw+e18udmFsdWVzKHRoaXMuc3RhdGUubm90aWZpY2F0aW9ucyl9PC91bD5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvblBvcHVwO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBDb2RlRWRpdG9yID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvY29kZUVkaXRvci9jb2RlRWRpdG9yLmpzeCcpO1xuY29uc3QgU25pcHBldEJhciA9IHJlcXVpcmUoJy4vc25pcHBldGJhci9zbmlwcGV0YmFyLmpzeCcpO1xuY29uc3QgTWV0YWRhdGFFZGl0b3IgPSByZXF1aXJlKCcuL21ldGFkYXRhRWRpdG9yL21ldGFkYXRhRWRpdG9yLmpzeCcpO1xuXG5cbmNvbnN0IHNwbGljZSA9IGZ1bmN0aW9uKHN0ciwgaW5kZXgsIGluamVjdCl7XG5cdHJldHVybiBzdHIuc2xpY2UoMCwgaW5kZXgpICsgaW5qZWN0ICsgc3RyLnNsaWNlKGluZGV4KTtcbn07XG5cbmNvbnN0IFNOSVBQRVRCQVJfSEVJR0hUID0gMjU7XG5cbmNvbnN0IEVkaXRvciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHZhbHVlICAgIDogJycsXG5cdFx0XHRvbkNoYW5nZSA6ICgpPT57fSxcblxuXHRcdFx0bWV0YWRhdGEgICAgICAgICA6IHt9LFxuXHRcdFx0b25NZXRhZGF0YUNoYW5nZSA6ICgpPT57fSxcblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2hvd01ldGFkYXRhRWRpdG9yIDogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXHRjdXJzb3JQb3NpdGlvbiA6IHtcblx0XHRsaW5lIDogMCxcblx0XHRjaCAgIDogMFxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51cGRhdGVFZGl0b3JTaXplKCk7XG5cdFx0dGhpcy5oaWdobGlnaHRQYWdlTGluZXMoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVFZGl0b3JTaXplKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy51cGRhdGVFZGl0b3JTaXplKTtcblx0fSxcblxuXHR1cGRhdGVFZGl0b3JTaXplIDogZnVuY3Rpb24oKSB7XG5cdFx0bGV0IHBhbmVIZWlnaHQgPSB0aGlzLnJlZnMubWFpbi5wYXJlbnROb2RlLmNsaWVudEhlaWdodDtcblx0XHRwYW5lSGVpZ2h0IC09IFNOSVBQRVRCQVJfSEVJR0hUICsgMTtcblx0XHR0aGlzLnJlZnMuY29kZUVkaXRvci5jb2RlTWlycm9yLnNldFNpemUobnVsbCwgcGFuZUhlaWdodCk7XG5cdH0sXG5cblx0aGFuZGxlVGV4dENoYW5nZSA6IGZ1bmN0aW9uKHRleHQpe1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UodGV4dCk7XG5cdH0sXG5cdGhhbmRsZUN1cnNvckFjdGl2dHkgOiBmdW5jdGlvbihjdXJwb3Mpe1xuXHRcdHRoaXMuY3Vyc29yUG9zaXRpb24gPSBjdXJwb3M7XG5cdH0sXG5cdGhhbmRsZUluamVjdCA6IGZ1bmN0aW9uKGluamVjdFRleHQpe1xuXHRcdGNvbnN0IGxpbmVzID0gdGhpcy5wcm9wcy52YWx1ZS5zcGxpdCgnXFxuJyk7XG5cdFx0bGluZXNbdGhpcy5jdXJzb3JQb3NpdGlvbi5saW5lXSA9IHNwbGljZShsaW5lc1t0aGlzLmN1cnNvclBvc2l0aW9uLmxpbmVdLCB0aGlzLmN1cnNvclBvc2l0aW9uLmNoLCBpbmplY3RUZXh0KTtcblxuXHRcdHRoaXMuaGFuZGxlVGV4dENoYW5nZShsaW5lcy5qb2luKCdcXG4nKSk7XG5cdFx0dGhpcy5yZWZzLmNvZGVFZGl0b3Iuc2V0Q3Vyc29yUG9zaXRpb24odGhpcy5jdXJzb3JQb3NpdGlvbi5saW5lLCB0aGlzLmN1cnNvclBvc2l0aW9uLmNoICArIGluamVjdFRleHQubGVuZ3RoKTtcblx0fSxcblx0aGFuZGdsZVRvZ2dsZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzaG93TWV0YWRhdGFFZGl0b3IgOiAhdGhpcy5zdGF0ZS5zaG93TWV0YWRhdGFFZGl0b3Jcblx0XHR9KTtcblx0fSxcblxuXHRnZXRDdXJyZW50UGFnZSA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgbGluZXMgPSB0aGlzLnByb3BzLnZhbHVlLnNwbGl0KCdcXG4nKS5zbGljZSgwLCB0aGlzLmN1cnNvclBvc2l0aW9uLmxpbmUgKyAxKTtcblx0XHRyZXR1cm4gXy5yZWR1Y2UobGluZXMsIChyLCBsaW5lKT0+e1xuXHRcdFx0aWYobGluZS5pbmRleE9mKCdcXFxccGFnZScpICE9PSAtMSkgcisrO1xuXHRcdFx0cmV0dXJuIHI7XG5cdFx0fSwgMSk7XG5cdH0sXG5cblx0aGlnaGxpZ2h0UGFnZUxpbmVzIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5yZWZzLmNvZGVFZGl0b3IpIHJldHVybjtcblx0XHRjb25zdCBjb2RlTWlycm9yID0gdGhpcy5yZWZzLmNvZGVFZGl0b3IuY29kZU1pcnJvcjtcblxuXHRcdGNvbnN0IGxpbmVOdW1iZXJzID0gXy5yZWR1Y2UodGhpcy5wcm9wcy52YWx1ZS5zcGxpdCgnXFxuJyksIChyLCBsaW5lLCBsaW5lTnVtYmVyKT0+e1xuXHRcdFx0aWYobGluZS5pbmRleE9mKCdcXFxccGFnZScpICE9PSAtMSl7XG5cdFx0XHRcdGNvZGVNaXJyb3IuYWRkTGluZUNsYXNzKGxpbmVOdW1iZXIsICdiYWNrZ3JvdW5kJywgJ3BhZ2VMaW5lJyk7XG5cdFx0XHRcdHIucHVzaChsaW5lTnVtYmVyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiByO1xuXHRcdH0sIFtdKTtcblx0XHRyZXR1cm4gbGluZU51bWJlcnM7XG5cdH0sXG5cblxuXHRicmV3SnVtcCA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgY3VycmVudFBhZ2UgPSB0aGlzLmdldEN1cnJlbnRQYWdlKCk7XG5cdFx0d2luZG93LmxvY2F0aW9uLmhhc2ggPSBgcCR7Y3VycmVudFBhZ2V9YDtcblx0fSxcblxuXHQvL0NhbGxlZCB3aGVuIHRoZXJlIGFyZSBjaGFuZ2VzIHRvIHRoZSBlZGl0b3IncyBkaW1lbnNpb25zXG5cdHVwZGF0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5yZWZzLmNvZGVFZGl0b3IudXBkYXRlU2l6ZSgpO1xuXHR9LFxuXG5cdHJlbmRlck1ldGFkYXRhRWRpdG9yIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5zdGF0ZS5zaG93TWV0YWRhdGFFZGl0b3IpIHJldHVybjtcblx0XHRyZXR1cm4gPE1ldGFkYXRhRWRpdG9yXG5cdFx0XHRtZXRhZGF0YT17dGhpcy5wcm9wcy5tZXRhZGF0YX1cblx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLm9uTWV0YWRhdGFDaGFuZ2V9XG5cdFx0Lz47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmhpZ2hsaWdodFBhZ2VMaW5lcygpO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZWRpdG9yJyByZWY9J21haW4nPlxuXHRcdFx0XHQ8U25pcHBldEJhclxuXHRcdFx0XHRcdGJyZXc9e3RoaXMucHJvcHMudmFsdWV9XG5cdFx0XHRcdFx0b25JbmplY3Q9e3RoaXMuaGFuZGxlSW5qZWN0fVxuXHRcdFx0XHRcdG9uVG9nZ2xlPXt0aGlzLmhhbmRnbGVUb2dnbGV9XG5cdFx0XHRcdFx0c2hvd21ldGE9e3RoaXMuc3RhdGUuc2hvd01ldGFkYXRhRWRpdG9yfSAvPlxuXHRcdFx0XHR7dGhpcy5yZW5kZXJNZXRhZGF0YUVkaXRvcigpfVxuXHRcdFx0XHQ8Q29kZUVkaXRvclxuXHRcdFx0XHRcdHJlZj0nY29kZUVkaXRvcidcblx0XHRcdFx0XHR3cmFwPXt0cnVlfVxuXHRcdFx0XHRcdGxhbmd1YWdlPSdnZm0nXG5cdFx0XHRcdFx0dmFsdWU9e3RoaXMucHJvcHMudmFsdWV9XG5cdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuaGFuZGxlVGV4dENoYW5nZX1cblx0XHRcdFx0XHRvbkN1cnNvckFjdGl2aXR5PXt0aGlzLmhhbmRsZUN1cnNvckFjdGl2dHl9IC8+XG5cblx0XHRcdFx0ey8qXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdicmV3SnVtcCcgb25DbGljaz17dGhpcy5icmV3SnVtcH0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1hcnJvdy1yaWdodCcgLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdCovfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yO1xuXG5cblxuXG5cblxuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbmNvbnN0IFNZU1RFTVMgPSBbJzVlJywgJzRlJywgJzMuNWUnLCAnUGF0aGZpbmRlciddO1xuXG5jb25zdCBNZXRhZGF0YUVkaXRvciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1ldGFkYXRhIDoge1xuXHRcdFx0XHRlZGl0SWQgICAgICA6IG51bGwsXG5cdFx0XHRcdHRpdGxlICAgICAgIDogJycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uIDogJycsXG5cdFx0XHRcdHRhZ3MgICAgICAgIDogJycsXG5cdFx0XHRcdHB1Ymxpc2hlZCAgIDogZmFsc2UsXG5cdFx0XHRcdGF1dGhvcnMgICAgIDogW10sXG5cdFx0XHRcdHN5c3RlbXMgICAgIDogW11cblx0XHRcdH0sXG5cdFx0XHRvbkNoYW5nZSA6ICgpPT57fVxuXHRcdH07XG5cdH0sXG5cblx0aGFuZGxlRmllbGRDaGFuZ2UgOiBmdW5jdGlvbihuYW1lLCBlKXtcblx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKF8ubWVyZ2Uoe30sIHRoaXMucHJvcHMubWV0YWRhdGEsIHtcblx0XHRcdFtuYW1lXSA6IGUudGFyZ2V0LnZhbHVlXG5cdFx0fSkpO1xuXHR9LFxuXHRoYW5kbGVTeXN0ZW0gOiBmdW5jdGlvbihzeXN0ZW0sIGUpe1xuXHRcdGlmKGUudGFyZ2V0LmNoZWNrZWQpe1xuXHRcdFx0dGhpcy5wcm9wcy5tZXRhZGF0YS5zeXN0ZW1zLnB1c2goc3lzdGVtKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wcm9wcy5tZXRhZGF0YS5zeXN0ZW1zID0gXy53aXRob3V0KHRoaXMucHJvcHMubWV0YWRhdGEuc3lzdGVtcywgc3lzdGVtKTtcblx0XHR9XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZSh0aGlzLnByb3BzLm1ldGFkYXRhKTtcblx0fSxcblx0aGFuZGxlUHVibGlzaCA6IGZ1bmN0aW9uKHZhbCl7XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZShfLm1lcmdlKHt9LCB0aGlzLnByb3BzLm1ldGFkYXRhLCB7XG5cdFx0XHRwdWJsaXNoZWQgOiB2YWxcblx0XHR9KSk7XG5cdH0sXG5cblx0aGFuZGxlRGVsZXRlIDogZnVuY3Rpb24oKXtcblx0XHRpZighY29uZmlybSgnYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIGJyZXc/JykpIHJldHVybjtcblx0XHRpZighY29uZmlybSgnYXJlIHlvdSBSRUFMTFkgc3VyZT8gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gcmVjb3ZlciBpdCcpKSByZXR1cm47XG5cblx0XHRyZXF1ZXN0LmdldChgL2FwaS9yZW1vdmUvJHt0aGlzLnByb3BzLm1ldGFkYXRhLmVkaXRJZH1gKVxuXHRcdFx0LnNlbmQoKVxuXHRcdFx0LmVuZChmdW5jdGlvbihlcnIsIHJlcyl7XG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy8nO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0Z2V0UmVkZGl0TGluayA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgbWV0YSA9IHRoaXMucHJvcHMubWV0YWRhdGE7XG5cdFx0Y29uc3QgdGl0bGUgPSBgJHttZXRhLnRpdGxlfSBbJHttZXRhLnN5c3RlbXMuam9pbignICcpfV1gO1xuXHRcdGNvbnN0IHRleHQgPSBgSGV5IGd1eXMhIEkndmUgYmVlbiB3b3JraW5nIG9uIHRoaXMgaG9tZWJyZXcuIEknZCBsb3ZlIHlvdXIgZmVlZGJhY2suIENoZWNrIGl0IG91dC5cblxuKipbSG9tZWJyZXdlcnkgTGlua10oaHR0cDovL2hvbWVicmV3ZXJ5Lm5hdHVyYWxjcml0LmNvbS9zaGFyZS8ke21ldGEuc2hhcmVJZH0pKipgO1xuXG5cdFx0cmV0dXJuIGBodHRwczovL3d3dy5yZWRkaXQuY29tL3IvVW5lYXJ0aGVkQXJjYW5hL3N1Ym1pdD90aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aXRsZSl9JnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQodGV4dCl9YDtcblx0fSxcblxuXHRyZW5kZXJTeXN0ZW1zIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5tYXAoU1lTVEVNUywgKHZhbCk9Pntcblx0XHRcdHJldHVybiA8bGFiZWwga2V5PXt2YWx9PlxuXHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHR0eXBlPSdjaGVja2JveCdcblx0XHRcdFx0XHRjaGVja2VkPXtfLmluY2x1ZGVzKHRoaXMucHJvcHMubWV0YWRhdGEuc3lzdGVtcywgdmFsKX1cblx0XHRcdFx0XHRvbkNoYW5nZT17KGUpPT50aGlzLmhhbmRsZVN5c3RlbSh2YWwsIGUpfSAvPlxuXHRcdFx0XHR7dmFsfVxuXHRcdFx0PC9sYWJlbD47XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyUHVibGlzaCA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5wcm9wcy5tZXRhZGF0YS5wdWJsaXNoZWQpe1xuXHRcdFx0cmV0dXJuIDxidXR0b24gY2xhc3NOYW1lPSd1bnB1Ymxpc2gnIG9uQ2xpY2s9eygpPT50aGlzLmhhbmRsZVB1Ymxpc2goZmFsc2UpfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1iYW4nIC8+IHVucHVibGlzaFxuXHRcdFx0PC9idXR0b24+O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gPGJ1dHRvbiBjbGFzc05hbWU9J3B1Ymxpc2gnIG9uQ2xpY2s9eygpPT50aGlzLmhhbmRsZVB1Ymxpc2godHJ1ZSl9PlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWdsb2JlJyAvPiBwdWJsaXNoXG5cdFx0XHQ8L2J1dHRvbj47XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlckRlbGV0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucHJvcHMubWV0YWRhdGEuZWRpdElkKSByZXR1cm47XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2ZpZWxkIGRlbGV0ZSc+XG5cdFx0XHQ8bGFiZWw+ZGVsZXRlPC9sYWJlbD5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSd2YWx1ZSc+XG5cdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPSdwdWJsaXNoJyBvbkNsaWNrPXt0aGlzLmhhbmRsZURlbGV0ZX0+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS10cmFzaCcgLz4gZGVsZXRlIGJyZXdcblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyQXV0aG9ycyA6IGZ1bmN0aW9uKCl7XG5cdFx0bGV0IHRleHQgPSAnTm9uZS4nO1xuXHRcdGlmKHRoaXMucHJvcHMubWV0YWRhdGEuYXV0aG9ycy5sZW5ndGgpe1xuXHRcdFx0dGV4dCA9IHRoaXMucHJvcHMubWV0YWRhdGEuYXV0aG9ycy5qb2luKCcsICcpO1xuXHRcdH1cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2ZpZWxkIGF1dGhvcnMnPlxuXHRcdFx0PGxhYmVsPmF1dGhvcnM8L2xhYmVsPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J3ZhbHVlJz5cblx0XHRcdFx0e3RleHR9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyU2hhcmVUb1JlZGRpdCA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucHJvcHMubWV0YWRhdGEuc2hhcmVJZCkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdmaWVsZCByZWRkaXQnPlxuXHRcdFx0PGxhYmVsPnJlZGRpdDwvbGFiZWw+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0ndmFsdWUnPlxuXHRcdFx0XHQ8YSBocmVmPXt0aGlzLmdldFJlZGRpdExpbmsoKX0gdGFyZ2V0PSdfYmxhbmsnIHJlbD0nbm9vcGVuZXIgbm9yZWZlcnJlcic+XG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzc05hbWU9J3B1Ymxpc2gnPlxuXHRcdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1yZWRkaXQtYWxpZW4nIC8+IHNoYXJlIHRvIHJlZGRpdFxuXHRcdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHQ8L2E+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J21ldGFkYXRhRWRpdG9yJz5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCB0aXRsZSc+XG5cdFx0XHRcdDxsYWJlbD50aXRsZTwvbGFiZWw+XG5cdFx0XHRcdDxpbnB1dCB0eXBlPSd0ZXh0JyBjbGFzc05hbWU9J3ZhbHVlJ1xuXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnByb3BzLm1ldGFkYXRhLnRpdGxlfVxuXHRcdFx0XHRcdG9uQ2hhbmdlPXsoZSk9PnRoaXMuaGFuZGxlRmllbGRDaGFuZ2UoJ3RpdGxlJywgZSl9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBkZXNjcmlwdGlvbic+XG5cdFx0XHRcdDxsYWJlbD5kZXNjcmlwdGlvbjwvbGFiZWw+XG5cdFx0XHRcdDx0ZXh0YXJlYSB2YWx1ZT17dGhpcy5wcm9wcy5tZXRhZGF0YS5kZXNjcmlwdGlvbn0gY2xhc3NOYW1lPSd2YWx1ZSdcblx0XHRcdFx0XHRvbkNoYW5nZT17KGUpPT50aGlzLmhhbmRsZUZpZWxkQ2hhbmdlKCdkZXNjcmlwdGlvbicsIGUpfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHR7Lyp9XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZmllbGQgdGFncyc+XG5cdFx0XHRcdDxsYWJlbD50YWdzPC9sYWJlbD5cblx0XHRcdFx0PHRleHRhcmVhIHZhbHVlPXt0aGlzLnByb3BzLm1ldGFkYXRhLnRhZ3N9XG5cdFx0XHRcdFx0b25DaGFuZ2U9eyhlKT0+dGhpcy5oYW5kbGVGaWVsZENoYW5nZSgndGFncycsIGUpfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQqL31cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2ZpZWxkIHN5c3RlbXMnPlxuXHRcdFx0XHQ8bGFiZWw+c3lzdGVtczwvbGFiZWw+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSd2YWx1ZSc+XG5cdFx0XHRcdFx0e3RoaXMucmVuZGVyU3lzdGVtcygpfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXG5cdFx0XHR7dGhpcy5yZW5kZXJBdXRob3JzKCl9XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBwdWJsaXNoJz5cblx0XHRcdFx0PGxhYmVsPnB1Ymxpc2g8L2xhYmVsPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0ndmFsdWUnPlxuXHRcdFx0XHRcdHt0aGlzLnJlbmRlclB1Ymxpc2goKX1cblx0XHRcdFx0XHQ8c21hbGw+UHVibGlzaGVkIGhvbWVicmV3cyB3aWxsIGJlIHB1YmxpY2x5IHZpZXdhYmxlIGFuZCBzZWFyY2hhYmxlIChldmVudHVhbGx5Li4uKTwvc21hbGw+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cblx0XHRcdHt0aGlzLnJlbmRlclNoYXJlVG9SZWRkaXQoKX1cblxuXHRcdFx0e3RoaXMucmVuZGVyRGVsZXRlKCl9XG5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFkYXRhRWRpdG9yO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuXG5jb25zdCBTbmlwcGV0cyA9IHJlcXVpcmUoJy4vc25pcHBldHMvc25pcHBldHMuanMnKTtcblxuY29uc3QgZXhlY3V0ZSA9IGZ1bmN0aW9uKHZhbCwgYnJldyl7XG5cdGlmKF8uaXNGdW5jdGlvbih2YWwpKSByZXR1cm4gdmFsKGJyZXcpO1xuXHRyZXR1cm4gdmFsO1xufTtcblxuXG5cbmNvbnN0IFNuaXBwZXRiYXIgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3ICAgICA6ICcnLFxuXHRcdFx0b25JbmplY3QgOiAoKT0+e30sXG5cdFx0XHRvblRvZ2dsZSA6ICgpPT57fSxcblx0XHRcdHNob3dtZXRhIDogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXG5cdGhhbmRsZVNuaXBwZXRDbGljayA6IGZ1bmN0aW9uKGluamVjdGVkVGV4dCl7XG5cdFx0dGhpcy5wcm9wcy5vbkluamVjdChpbmplY3RlZFRleHQpO1xuXHR9LFxuXG5cdHJlbmRlclNuaXBwZXRHcm91cHMgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBfLm1hcChTbmlwcGV0cywgKHNuaXBwZXRHcm91cCk9Pntcblx0XHRcdHJldHVybiA8U25pcHBldEdyb3VwXG5cdFx0XHRcdGJyZXc9e3RoaXMucHJvcHMuYnJld31cblx0XHRcdFx0Z3JvdXBOYW1lPXtzbmlwcGV0R3JvdXAuZ3JvdXBOYW1lfVxuXHRcdFx0XHRpY29uPXtzbmlwcGV0R3JvdXAuaWNvbn1cblx0XHRcdFx0c25pcHBldHM9e3NuaXBwZXRHcm91cC5zbmlwcGV0c31cblx0XHRcdFx0a2V5PXtzbmlwcGV0R3JvdXAuZ3JvdXBOYW1lfVxuXHRcdFx0XHRvblNuaXBwZXRDbGljaz17dGhpcy5oYW5kbGVTbmlwcGV0Q2xpY2t9XG5cdFx0XHQvPjtcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nc25pcHBldEJhcic+XG5cdFx0XHR7dGhpcy5yZW5kZXJTbmlwcGV0R3JvdXBzKCl9XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y3goJ3RvZ2dsZU1ldGEnLCB7IHNlbGVjdGVkOiB0aGlzLnByb3BzLnNob3dtZXRhIH0pfVxuXHRcdFx0XHRvbkNsaWNrPXt0aGlzLnByb3BzLm9uVG9nZ2xlfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1iYXJzJyAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTbmlwcGV0YmFyO1xuXG5cblxuXG5cblxuY29uc3QgU25pcHBldEdyb3VwID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyAgICAgICAgICAgOiAnJyxcblx0XHRcdGdyb3VwTmFtZSAgICAgIDogJycsXG5cdFx0XHRpY29uICAgICAgICAgICA6ICdmYS1yb2NrZXQnLFxuXHRcdFx0c25pcHBldHMgICAgICAgOiBbXSxcblx0XHRcdG9uU25pcHBldENsaWNrIDogZnVuY3Rpb24oKXt9LFxuXHRcdH07XG5cdH0sXG5cdGhhbmRsZVNuaXBwZXRDbGljayA6IGZ1bmN0aW9uKHNuaXBwZXQpe1xuXHRcdHRoaXMucHJvcHMub25TbmlwcGV0Q2xpY2soZXhlY3V0ZShzbmlwcGV0LmdlbiwgdGhpcy5wcm9wcy5icmV3KSk7XG5cdH0sXG5cdHJlbmRlclNuaXBwZXRzIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5tYXAodGhpcy5wcm9wcy5zbmlwcGV0cywgKHNuaXBwZXQpPT57XG5cdFx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3NuaXBwZXQnIGtleT17c25pcHBldC5uYW1lfSBvbkNsaWNrPXsoKT0+dGhpcy5oYW5kbGVTbmlwcGV0Q2xpY2soc25pcHBldCl9PlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9e2BmYSBmYS1mdyAke3NuaXBwZXQuaWNvbn1gfSAvPlxuXHRcdFx0XHR7c25pcHBldC5uYW1lfVxuXHRcdFx0PC9kaXY+O1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdzbmlwcGV0R3JvdXAnPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J3RleHQnPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9e2BmYSBmYS1mdyAke3RoaXMucHJvcHMuaWNvbn1gfSAvPlxuXHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9J2dyb3VwTmFtZSc+e3RoaXMucHJvcHMuZ3JvdXBOYW1lfTwvc3Bhbj5cblx0XHRcdDwvZGl2PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2Ryb3Bkb3duJz5cblx0XHRcdFx0e3RoaXMucmVuZGVyU25pcHBldHMoKX1cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fSxcblxufSk7IiwiY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNsYXNzbmFtZSl7XG5cblx0Y2xhc3NuYW1lID0gXy5zYW1wbGUoWydhcmNoaXZpc3QnLCAnZmFuY3ltYW4nLCAnbGluZ3Vpc3QnLCAnZmxldGNoZXInLFxuXHRcdCdub3RhcnknLCAnYmVyc2Vya2VyLXR5cGlzdCcsICdmaXNobW9uZ2VyZXInLCAnbWFuaWN1cmlzdCcsICdoYWJlcmRhc2hlcicsICdjb25jaWVyZ2UnXSk7XG5cblx0Y2xhc3NuYW1lID0gY2xhc3NuYW1lLnRvTG93ZXJDYXNlKCk7XG5cblx0Y29uc3QgaGl0RGllID0gXy5zYW1wbGUoWzQsIDYsIDgsIDEwLCAxMl0pO1xuXG5cdGNvbnN0IGFiaWxpdHlMaXN0ID0gWydTdHJlbmd0aCcsICdEZXhlcml0eScsICdDb25zdGl0dXRpb24nLCAnV2lzZG9tJywgJ0NoYXJpc21hJywgJ0ludGVsbGlnZW5jZSddO1xuXHRjb25zdCBza2lsbExpc3QgPSBbJ0Fjcm9iYXRpY3MgJywgJ0FuaW1hbCBIYW5kbGluZycsICdBcmNhbmEnLCAnQXRobGV0aWNzJywgJ0RlY2VwdGlvbicsICdIaXN0b3J5JywgJ0luc2lnaHQnLCAnSW50aW1pZGF0aW9uJywgJ0ludmVzdGlnYXRpb24nLCAnTWVkaWNpbmUnLCAnTmF0dXJlJywgJ1BlcmNlcHRpb24nLCAnUGVyZm9ybWFuY2UnLCAnUGVyc3Vhc2lvbicsICdSZWxpZ2lvbicsICdTbGVpZ2h0IG9mIEhhbmQnLCAnU3RlYWx0aCcsICdTdXJ2aXZhbCddO1xuXG5cblx0cmV0dXJuIFtcblx0XHQnIyMgQ2xhc3MgRmVhdHVyZXMnLFxuXHRcdGBBcyBhICR7Y2xhc3NuYW1lfSwgeW91IGdhaW4gdGhlIGZvbGxvd2luZyBjbGFzcyBmZWF0dXJlc2AsXG5cdFx0JyMjIyMgSGl0IFBvaW50cycsXG5cdFx0J19fXycsXG5cdFx0YC0gKipIaXQgRGljZToqKiAxZCR7aGl0RGllfSBwZXIgJHtjbGFzc25hbWV9IGxldmVsYCxcblx0XHRgLSAqKkhpdCBQb2ludHMgYXQgMXN0IExldmVsOioqICR7aGl0RGllfSArIHlvdXIgQ29uc3RpdHV0aW9uIG1vZGlmaWVyYCxcblx0XHRgLSAqKkhpdCBQb2ludHMgYXQgSGlnaGVyIExldmVsczoqKiAxZCR7aGl0RGllfSAob3IgJHtoaXREaWUvMiArIDF9KSArIHlvdXIgQ29uc3RpdHV0aW9uIG1vZGlmaWVyIHBlciAke2NsYXNzbmFtZX0gbGV2ZWwgYWZ0ZXIgMXN0YCxcblx0XHQnJyxcblx0XHQnIyMjIyBQcm9maWNpZW5jaWVzJyxcblx0XHQnX19fJyxcblx0XHRgLSAqKkFybW9yOioqICR7Xy5zYW1wbGVTaXplKFsnTGlnaHQgYXJtb3InLCAnTWVkaXVtIGFybW9yJywgJ0hlYXZ5IGFybW9yJywgJ1NoaWVsZHMnXSwgXy5yYW5kb20oMCwgMykpLmpvaW4oJywgJykgfHwgJ05vbmUnfWAsXG5cdFx0YC0gKipXZWFwb25zOioqICR7Xy5zYW1wbGVTaXplKFsnU3F1ZWVnZWUnLCAnUnViYmVyIENoaWNrZW4nLCAnU2ltcGxlIHdlYXBvbnMnLCAnTWFydGlhbCB3ZWFwb25zJ10sIF8ucmFuZG9tKDAsIDIpKS5qb2luKCcsICcpIHx8ICdOb25lJ31gLFxuXHRcdGAtICoqVG9vbHM6KiogJHtfLnNhbXBsZVNpemUoWydBcnRpYW5cXCdzIHRvb2xzJywgJ29uZSBtdXNpY2FsIGluc3RydW1lbnQnLCAnVGhpZXZlXFwncyB0b29scyddLCBfLnJhbmRvbSgwLCAyKSkuam9pbignLCAnKSB8fCAnTm9uZSd9YCxcblx0XHQnJyxcblx0XHQnX19fJyxcblx0XHRgLSAqKlNhdmluZyBUaHJvd3M6KiogJHtfLnNhbXBsZVNpemUoYWJpbGl0eUxpc3QsIDIpLmpvaW4oJywgJyl9YCxcblx0XHRgLSAqKlNraWxsczoqKiBDaG9vc2UgdHdvIGZyb20gJHtfLnNhbXBsZVNpemUoc2tpbGxMaXN0LCBfLnJhbmRvbSg0LCA2KSkuam9pbignLCAnKX1gLFxuXHRcdCcnLFxuXHRcdCcjIyMjIEVxdWlwbWVudCcsXG5cdFx0J1lvdSBzdGFydCB3aXRoIHRoZSBmb2xsb3dpbmcgZXF1aXBtZW50LCBpbiBhZGRpdGlvbiB0byB0aGUgZXF1aXBtZW50IGdyYW50ZWQgYnkgeW91ciBiYWNrZ3JvdW5kOicsXG5cdFx0Jy0gKihhKSogYSBtYXJ0aWFsIHdlYXBvbiBhbmQgYSBzaGllbGQgb3IgKihiKSogdHdvIG1hcnRpYWwgd2VhcG9ucycsXG5cdFx0Jy0gKihhKSogZml2ZSBqYXZlbGlucyBvciAqKGIpKiBhbnkgc2ltcGxlIG1lbGVlIHdlYXBvbicsXG5cdFx0YC0gJHtfLnNhbXBsZShbJzEwIGxpbnQgZmx1ZmZzJywgJzEgYnV0dG9uJywgJ2EgY2hlcmlzaGVkIGxvc3Qgc29jayddKX1gLFxuXHRcdCdcXG5cXG5cXG4nXG5cdF0uam9pbignXFxuJyk7XG59O1xuIiwiY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5jb25zdCBmZWF0dXJlcyA9IFtcblx0J0FzdHJvbG9naWNhbCBCb3RhbnknLFxuXHQnQXN0cm9sb2dpY2FsIENoZW1pc3RyeScsXG5cdCdCaW9jaGVtaWNhbCBTb3JjZXJ5Jyxcblx0J0NpdmlsIEFsY2hlbXknLFxuXHQnQ29uc2VjcmF0ZWQgQmlvY2hlbWlzdHJ5Jyxcblx0J0RlbW9uaWMgQW50aHJvcG9sb2d5Jyxcblx0J0RpdmluYXRvcnkgTWluZXJhbG9neScsXG5cdCdHZW5ldGljIEJhbmlzaGluZycsXG5cdCdIZXJtZXRpYyBHZW9ncmFwaHknLFxuXHQnSW1tdW5vbG9naWNhbCBJbmNhbnRhdGlvbnMnLFxuXHQnTnVjbGVhciBJbGx1c2lvbmlzbScsXG5cdCdSaXR1YWwgQXN0cm9ub215Jyxcblx0J1NlaXNtb2xvZ2ljYWwgRGl2aW5hdGlvbicsXG5cdCdTcGlyaXR1YWwgQmlvY2hlbWlzdHJ5Jyxcblx0J1N0YXRpc3RpY2FsIE9jY3VsdGlzbScsXG5cdCdQb2xpY2UgTmVjcm9tYW5jZXInLFxuXHQnU2l4Z3VuIFBvaXNvbmVyJyxcblx0J1BoYXJtYWNldXRpY2FsIEd1bnNsaW5nZXInLFxuXHQnSW5mZXJuYWwgQmFua2VyJyxcblx0J1NwZWxsIEFuYWx5c3QnLFxuXHQnR3Vuc2xpbmdlciBDb3JydXB0b3InLFxuXHQnVG9ycXVlIEludGVyZmFjZXInLFxuXHQnRXhvIEludGVyZmFjZXInLFxuXHQnR3VucG93ZGVyIFRvcnR1cmVyJyxcblx0J09yYml0YWwgR3JhdmVkaWdnZXInLFxuXHQnUGhhc2VkIExpbmd1aXN0Jyxcblx0J01hdGhlbWF0aWNhbCBQaGFybWFjaXN0Jyxcblx0J1BsYXNtYSBPdXRsYXcnLFxuXHQnTWFsZWZpYyBDaGVtaXN0Jyxcblx0J1BvbGljZSBDdWx0aXN0J1xuXTtcblxuY29uc3QgY2xhc3NuYW1lcyA9IFsnQXJjaGl2aXN0JywgJ0ZhbmN5bWFuJywgJ0xpbmd1aXN0JywgJ0ZsZXRjaGVyJyxcblx0J05vdGFyeScsICdCZXJzZXJrZXItVHlwaXN0JywgJ0Zpc2htb25nZXJlcicsICdNYW5pY3VyaXN0JywgJ0hhYmVyZGFzaGVyJywgJ0NvbmNpZXJnZSddO1xuXG5jb25zdCBsZXZlbHMgPSBbJzFzdCcsICcybmQnLCAnM3JkJywgJzR0aCcsICc1dGgnLCAnNnRoJywgJzd0aCcsICc4dGgnLCAnOXRoJywgJzEwdGgnLCAnMTF0aCcsICcxMnRoJywgJzEzdGgnLCAnMTR0aCcsICcxNXRoJywgJzE2dGgnLCAnMTd0aCcsICcxOHRoJywgJzE5dGgnLCAnMjB0aCddO1xuXG5jb25zdCBwcm9mQm9udXMgPSBbMiwgMiwgMiwgMiwgMywgMywgMywgMywgNCwgNCwgNCwgNCwgNSwgNSwgNSwgNSwgNiwgNiwgNiwgNl07XG5cbmNvbnN0IGdldEZlYXR1cmUgPSAobGV2ZWwpPT57XG5cdGxldCByZXMgPSBbXTtcblx0aWYoXy5pbmNsdWRlcyhbNCwgNiwgOCwgMTIsIDE0LCAxNiwgMTldLCBsZXZlbCsxKSl7XG5cdFx0cmVzID0gWydBYmlsaXR5IFNjb3JlIEltcHJvdmVtZW50J107XG5cdH1cblx0cmVzID0gXy51bmlvbihyZXMsIF8uc2FtcGxlU2l6ZShmZWF0dXJlcywgXy5zYW1wbGUoWzAsIDEsIDEsIDEsIDEsIDFdKSkpO1xuXHRpZighcmVzLmxlbmd0aCkgcmV0dXJuICfilIAnO1xuXHRyZXR1cm4gcmVzLmpvaW4oJywgJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0ZnVsbCA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgY2xhc3NuYW1lID0gXy5zYW1wbGUoY2xhc3NuYW1lcyk7XG5cblx0XHRjb25zdCBtYXhlcyA9IFs0LCAzLCAzLCAzLCAzLCAyLCAyLCAxLCAxXTtcblx0XHRjb25zdCBkcmF3U2xvdHMgPSBmdW5jdGlvbihTbG90cyl7XG5cdFx0XHRsZXQgc2xvdHMgPSBOdW1iZXIoU2xvdHMpO1xuXHRcdFx0cmV0dXJuIF8udGltZXMoOSwgZnVuY3Rpb24oaSl7XG5cdFx0XHRcdGNvbnN0IG1heCA9IG1heGVzW2ldO1xuXHRcdFx0XHRpZihzbG90cyA8IDEpIHJldHVybiAn4oCUJztcblx0XHRcdFx0Y29uc3QgcmVzID0gXy5taW4oW21heCwgc2xvdHNdKTtcblx0XHRcdFx0c2xvdHMgLT0gcmVzO1xuXHRcdFx0XHRyZXR1cm4gcmVzO1xuXHRcdFx0fSkuam9pbignIHwgJyk7XG5cdFx0fTtcblxuXG5cdFx0bGV0IGNhbnRyaXBzID0gMztcblx0XHRsZXQgc3BlbGxzID0gMTtcblx0XHRsZXQgc2xvdHMgPSAyO1xuXHRcdHJldHVybiBgPGRpdiBjbGFzcz0nY2xhc3NUYWJsZSB3aWRlJz5cXG4jIyMjIyBUaGUgJHtjbGFzc25hbWV9XFxuYCArXG5cdFx0YHwgTGV2ZWwgfCBQcm9maWNpZW5jeSBCb251cyB8IEZlYXR1cmVzIHwgQ2FudHJpcHMgS25vd24gfCBTcGVsbHMgS25vd24gfCAxc3QgfCAybmQgfCAzcmQgfCA0dGggfCA1dGggfCA2dGggfCA3dGggfCA4dGggfCA5dGggfFxcbmArXG5cdFx0YHw6LS0tOnw6LS0tOnw6LS0tfDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fFxcbiR7XG5cdFx0XHRfLm1hcChsZXZlbHMsIGZ1bmN0aW9uKGxldmVsTmFtZSwgbGV2ZWwpe1xuXHRcdFx0XHRjb25zdCByZXMgPSBbXG5cdFx0XHRcdFx0bGV2ZWxOYW1lLFxuXHRcdFx0XHRcdGArJHtwcm9mQm9udXNbbGV2ZWxdfWAsXG5cdFx0XHRcdFx0Z2V0RmVhdHVyZShsZXZlbCksXG5cdFx0XHRcdFx0Y2FudHJpcHMsXG5cdFx0XHRcdFx0c3BlbGxzLFxuXHRcdFx0XHRcdGRyYXdTbG90cyhzbG90cylcblx0XHRcdFx0XS5qb2luKCcgfCAnKTtcblxuXHRcdFx0XHRjYW50cmlwcyArPSBfLnJhbmRvbSgwLCAxKTtcblx0XHRcdFx0c3BlbGxzICs9IF8ucmFuZG9tKDAsIDEpO1xuXHRcdFx0XHRzbG90cyArPSBfLnJhbmRvbSgwLCAyKTtcblxuXHRcdFx0XHRyZXR1cm4gYHwgJHtyZXN9IHxgO1xuXHRcdFx0fSkuam9pbignXFxuJyl9XFxuPC9kaXY+XFxuXFxuYDtcblx0fSxcblxuXHRoYWxmIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBjbGFzc25hbWUgPSAgXy5zYW1wbGUoY2xhc3NuYW1lcyk7XG5cblx0XHRsZXQgZmVhdHVyZVNjb3JlID0gMTtcblx0XHRyZXR1cm4gYDxkaXYgY2xhc3M9J2NsYXNzVGFibGUnPlxcbiMjIyMjIFRoZSAke2NsYXNzbmFtZX1cXG5gICtcblx0XHRgfCBMZXZlbCB8IFByb2ZpY2llbmN5IEJvbnVzIHwgRmVhdHVyZXMgfCAke18uc2FtcGxlKGZlYXR1cmVzKX18XFxuYCArXG5cdFx0YHw6LS0tOnw6LS0tOnw6LS0tfDotLS06fFxcbiR7XG5cdFx0XHRfLm1hcChsZXZlbHMsIGZ1bmN0aW9uKGxldmVsTmFtZSwgbGV2ZWwpe1xuXHRcdFx0XHRjb25zdCByZXMgPSBbXG5cdFx0XHRcdFx0bGV2ZWxOYW1lLFxuXHRcdFx0XHRcdGArJHtwcm9mQm9udXNbbGV2ZWxdfWAsXG5cdFx0XHRcdFx0Z2V0RmVhdHVyZShsZXZlbCksXG5cdFx0XHRcdFx0YCske2ZlYXR1cmVTY29yZX1gXG5cdFx0XHRcdF0uam9pbignIHwgJyk7XG5cblx0XHRcdFx0ZmVhdHVyZVNjb3JlICs9IF8ucmFuZG9tKDAsIDEpO1xuXG5cdFx0XHRcdHJldHVybiBgfCAke3Jlc30gfGA7XG5cdFx0XHR9KS5qb2luKCdcXG4nKX1cXG48L2Rpdj5cXG5cXG5gO1xuXHR9XG59OyIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3QgdGl0bGVzID0gW1xuXHQnVGhlIEJ1cm5pbmcgR2FsbG93cycsXG5cdCdUaGUgUmluZyBvZiBOZW5sYXN0Jyxcblx0J0JlbG93IHRoZSBCbGluZCBUYXZlcm4nLFxuXHQnQmVsb3cgdGhlIEh1bmdlcmluZyBSaXZlcicsXG5cdCdCZWZvcmUgQmFoYW11dFxcJ3MgTGFuZCcsXG5cdCdUaGUgQ3J1ZWwgR3JhdmUgZnJvbSBXaXRoaW4nLFxuXHQnVGhlIFN0cmVuZ3RoIG9mIFRyYWRlIFJvYWQnLFxuXHQnVGhyb3VnaCBUaGUgUmF2ZW4gUXVlZW5cXCdzIFdvcmxkcycsXG5cdCdXaXRoaW4gdGhlIFNldHRsZW1lbnQnLFxuXHQnVGhlIENyb3duIGZyb20gV2l0aGluJyxcblx0J1RoZSBNZXJjaGFudCBXaXRoaW4gdGhlIEJhdHRsZWZpZWxkJyxcblx0J0lvdW5cXCdzIEZhZGluZyBUcmF2ZWxlcicsXG5cdCdUaGUgTGVnaW9uIEluZ3JlZGllbnQnLFxuXHQnVGhlIEV4cGxvcmVyIEx1cmUnLFxuXHQnQmVmb3JlIHRoZSBDaGFybWluZyBCYWRsYW5kcycsXG5cdCdUaGUgTGl2aW5nIERlYWQgQWJvdmUgdGhlIEZlYXJmdWwgQ2FnZScsXG5cdCdWZWNuYVxcJ3MgSGlkZGVuIFNhZ2UnLFxuXHQnQmFoYW11dFxcJ3MgRGVtb25zcGF3bicsXG5cdCdBY3Jvc3MgR3J1dW1zaFxcJ3MgRWxlbWVudGFsIENoYW9zJyxcblx0J1RoZSBCbGFkZSBvZiBPcmN1cycsXG5cdCdCZXlvbmQgUmV2ZW5nZScsXG5cdCdCcmFpbiBvZiBJbnNhbml0eScsXG5cdCdCcmVlZCBCYXR0bGUhLCBBIE5ldyBCZWdpbm5pbmcnLFxuXHQnRXZpbCBMYWtlLCBBIE5ldyBCZWdpbm5pbmcnLFxuXHQnSW52YXNpb24gb2YgdGhlIEdpZ2FudGljIENhdCwgUGFydCBJSScsXG5cdCdLcmFrZW4gV2FyIDIwMjAnLFxuXHQnVGhlIEJvZHkgV2hpc3BlcmVycycsXG5cdCdUaGUgRGlhYm9saWNhbCBUYWxlcyBvZiB0aGUgQXBlLVdvbWVuJyxcblx0J1RoZSBEb2N0b3IgSW1tb3J0YWwnLFxuXHQnVGhlIERvY3RvciBmcm9tIEhlYXZlbicsXG5cdCdUaGUgR3JhdmV5YXJkJyxcblx0J0F6dXJlIENvcmUnLFxuXHQnQ29yZSBCYXR0bGUnLFxuXHQnQ29yZSBvZiBIZWF2ZW46IFRoZSBHdWFyZGlhbiBvZiBBbWF6ZW1lbnQnLFxuXHQnRGVhZGx5IEFtYXplbWVudCBJSUknLFxuXHQnRHJ5IENoYW9zIElYJyxcblx0J0dhdGUgVGh1bmRlcicsXG5cdCdHdWFyZGlhbjogU2tpZXMgb2YgdGhlIERhcmsgV2l6YXJkJyxcblx0J0x1dGUgb2YgRXRlcm5pdHknLFxuXHQnTWVyY3VyeVxcJ3MgUGxhbmV0OiBCcmF2ZSBFdm9sdXRpb24nLFxuXHQnUnVieSBvZiBBdGxhbnRpczogVGhlIFF1YWtlIG9mIFBlYWNlJyxcblx0J1NreSBvZiBaZWxkYTogVGhlIFRodW5kZXIgb2YgRm9yY2UnLFxuXHQnVnlzZVxcJ3MgU2tpZXMnLFxuXHQnV2hpdGUgR3JlYXRuZXNzIElJSScsXG5cdCdZZWxsb3cgRGl2aW5pdHknLFxuXHQnWmlkYW5lXFwncyBHaG9zdCdcbl07XG5cbmNvbnN0IHN1YnRpdGxlcyA9IFtcblx0J0luIGFuIG9taW5vdXMgdW5pdmVyc2UsIGEgYm90YW5pc3Qgb3Bwb3NlcyB0ZXJyb3Jpc20uJyxcblx0J0luIGEgZGVtb24taGF1bnRlZCBjaXR5LCBpbiBhbiBhZ2Ugb2YgbGllcyBhbmQgaGF0ZSwgYSBwaHlzaWNpc3QgdHJpZXMgdG8gZmluZCBhbiBhbmNpZW50IHRyZWFzdXJlIGFuZCBiYXR0bGVzIGEgbW9iIG9mIGFsaWVucy4nLFxuXHQnSW4gYSBsYW5kIG9mIGNvcnJ1cHRpb24sIHR3byBjeWJlcm5ldGljaXN0cyBhbmQgYSBkdW5nZW9uIGRlbHZlciBzZWFyY2ggZm9yIGZyZWVkb20uJyxcblx0J0luIGFuIGV2aWwgZW1waXJlIG9mIGhvcnJvciwgdHdvIHJhbmdlcnMgYmF0dGxlIHRoZSBmb3JjZXMgb2YgaGVsbC4nLFxuXHQnSW4gYSBsb3N0IGNpdHksIGluIGFuIGFnZSBvZiBzb3JjZXJ5LCBhIGxpYnJhcmlhbiBxdWVzdHMgZm9yIHJldmVuZ2UuJyxcblx0J0luIGEgdW5pdmVyc2Ugb2YgaWxsdXNpb25zIGFuZCBkYW5nZXIsIHRocmVlIHRpbWUgdHJhdmVsbGVycyBhbmQgYW4gYWR2ZW50dXJlciBzZWFyY2ggZm9yIGp1c3RpY2UuJyxcblx0J0luIGEgZm9yZ290dGVuIHVuaXZlcnNlIG9mIGJhcmJhcmlzbSwgaW4gYW4gZXJhIG9mIHRlcnJvciBhbmQgbXlzdGljaXNtLCBhIHZpcnR1YWwgcmVhbGl0eSBwcm9ncmFtbWVyIGFuZCBhIHNweSB0cnkgdG8gZmluZCB2ZW5nYW5jZSBhbmQgYmF0dGxlIGNyaW1lLicsXG5cdCdJbiBhIHVuaXZlcnNlIG9mIGRlbW9ucywgaW4gYW4gZXJhIG9mIGluc2FuaXR5IGFuZCBnaG9zdHMsIHRocmVlIGJvZHlndWFyZHMgYW5kIGEgYm9keWd1YXJkIHRyeSB0byBmaW5kIHZlbmdhbmNlLicsXG5cdCdJbiBhIGtpbmdkb20gb2YgY29ycnVwdGlvbiBhbmQgYmF0dGxlLCBzZXZlbiBhcnRpZmljaWFsIGludGVsbGlnZW5jZXMgdHJ5IHRvIHNhdmUgdGhlIGxhc3QgbGl2aW5nIGZlcnRpbGUgd29tYW4uJyxcblx0J0luIGEgdW5pdmVyc2Ugb2YgdmlydXRhbCByZWFsaXR5IGFuZCBhZ29ueSwgaW4gYW4gYWdlIG9mIGdob3N0cyBhbmQgZ2hvc3RzLCBhIGZvcnR1bmUtdGVsbGVyIGFuZCBhIHdhbmRlcmVyIHRyeSB0byBhdmVydCB0aGUgYXBvY2FseXBzZS4nLFxuXHQnSW4gYSBjcmltZS1pbmZlc3RlZCBraW5nZG9tLCB0aHJlZSBtYXJ0aWFsIGFydGlzdHMgcXVlc3QgZm9yIHRoZSB0cnV0aCBhbmQgb3Bwb3NlIGV2aWwuJyxcblx0J0luIGEgdGVycmlmeWluZyB1bml2ZXJzZSBvZiBsb3N0IHNvdWxzLCBpbiBhbiBlcmEgb2YgbG9zdCBzb3VscywgZWlnaHQgZGFuY2VycyBmaWdodCBldmlsLicsXG5cdCdJbiBhIGdhbGF4eSBvZiBjb25mdXNpb24gYW5kIGluc2FuaXR5LCB0aHJlZSBtYXJ0aWFsIGFydGlzdHMgYW5kIGEgZHVrZSBiYXR0bGUgYSBtb2Igb2YgcHN5Y2hpY3MuJyxcblx0J0luIGFuIGFtYXppbmcga2luZ2RvbSwgYSB3aXphcmQgYW5kIGEgc2VjcmV0YXJ5IGhvcGUgdG8gcHJldmVudCB0aGUgZGVzdHJ1Y3Rpb24gb2YgbWFua2luZC4nLFxuXHQnSW4gYSBraW5nZG9tIG9mIGRlY2VwdGlvbiwgYSByZXBvcnRlciBzZWFyY2hlcyBmb3IgZmFtZS4nLFxuXHQnSW4gYSBoZWxsaXNoIGVtcGlyZSwgYSBzd29yZHN3b21hbiBhbmQgYSBkdWtlIHRyeSB0byBmaW5kIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIGJhdHRsZSBhIGNvbnNwaXJhY3kuJyxcblx0J0luIGFuIGV2aWwgZ2FsYXh5IG9mIGlsbHVzaW9uLCBpbiBhIHRpbWUgb2YgdGVjaG5vbG9neSBhbmQgbWlzZXJ5LCBzZXZlbiBwc3ljaGlhdHJpc3RzIGJhdHRsZSBjcmltZS4nLFxuXHQnSW4gYSBkYXJrIGNpdHkgb2YgY29uZnVzaW9uLCB0aHJlZSBzd29yZHN3b21lbiBhbmQgYSBzaW5nZXIgYmF0dGxlIGxhd2xlc3NuZXNzLicsXG5cdCdJbiBhbiBvbWlub3VzIGVtcGlyZSwgaW4gYW4gYWdlIG9mIGhhdGUsIHR3byBwaGlsb3NvcGhlcnMgYW5kIGEgc3R1ZGVudCB0cnkgdG8gZmluZCBqdXN0aWNlIGFuZCBiYXR0bGUgYSBtb2Igb2YgbWFnZXMgaW50ZW50IG9uIHN0ZWFsaW5nIHRoZSBzb3VscyBvZiB0aGUgaW5ub2NlbnQuJyxcblx0J0luIGEga2luZ2RvbSBvZiBwYW5pYywgc2l4IGFkdmVudHVyZXJzIG9wcG9zZSBsYXdsZXNzbmVzcy4nLFxuXHQnSW4gYSBsYW5kIG9mIGRyZWFtcyBhbmQgaG9wZWxlc3NuZXNzLCB0aHJlZSBoYWNrZXJzIGFuZCBhIGN5Ym9yZyBzZWFyY2ggZm9yIGp1c3RpY2UuJyxcblx0J09uIGEgcGxhbmV0IG9mIG15c3RpY2lzbSwgdGhyZWUgdHJhdmVsZXJzIGFuZCBhIGZpcmUgZmlnaHRlciBxdWVzdCBmb3IgdGhlIHVsdGltYXRlIHdlYXBvbiBhbmQgb3Bwb3NlIGV2aWwuJyxcblx0J0luIGEgd2lja2VkIHVuaXZlcnNlLCBmaXZlIHNlZXJzIGZpZ2h0IGxhd2xlc3NuZXNzLicsXG5cdCdJbiBhIGtpbmdkb20gb2YgZGVhdGgsIGluIGFuIGVyYSBvZiBpbGx1c2lvbiBhbmQgYmxvb2QsIGZvdXIgY29sb25pc3RzIHNlYXJjaCBmb3IgZmFtZS4nLFxuXHQnSW4gYW4gYW1hemluZyBraW5nZG9tLCBpbiBhbiBhZ2Ugb2Ygc29yY2VyeSBhbmQgbG9zdCBzb3VscywgZWlnaHQgc3BhY2UgcGlyYXRlcyBxdWVzdCBmb3IgZnJlZWRvbS4nLFxuXHQnSW4gYSBjdXJzZWQgZW1waXJlLCBmaXZlIGludmVudG9ycyBvcHBvc2UgdGVycm9yaXNtLicsXG5cdCdPbiBhIGNyaW1lLXJpZGRlbiBwbGFuZXQgb2YgY29uc3BpcmFjeSwgYSB3YXRjaG1hbiBhbmQgYW4gYXJ0aWZpY2lhbCBpbnRlbGxpZ2VuY2UgdHJ5IHRvIGZpbmQgbG92ZSBhbmQgb3Bwb3NlIGxhd2xlc3NuZXNzLicsXG5cdCdJbiBhIGZvcmdvdHRlbiBsYW5kLCBhIHJlcG9ydGVyIGFuZCBhIHNweSB0cnkgdG8gc3RvcCB0aGUgYXBvY2FseXBzZS4nLFxuXHQnSW4gYSBmb3JiaWRkZW4gbGFuZCBvZiBwcm9waGVjeSwgYSBzY2llbnRpc3QgYW5kIGFuIGFyY2hpdmlzdCBvcHBvc2UgYSBjYWJhbCBvZiBiYXJiYXJpYW5zIGludGVudCBvbiBzdGVhbGluZyB0aGUgc291bHMgb2YgdGhlIGlubm9jZW50LicsXG5cdCdPbiBhbiBpbmZlcm5hbCB3b3JsZCBvZiBpbGx1c2lvbiwgYSBncmF2ZSByb2JiZXIgYW5kIGEgd2F0Y2htYW4gdHJ5IHRvIGZpbmQgcmV2ZW5nZSBhbmQgY29tYmF0IGEgc3luZGljYXRlIG9mIG1hZ2VzIGludGVudCBvbiBzdGVhbGluZyB0aGUgc291cmNlIG9mIGFsbCBtYWdpYy4nLFxuXHQnSW4gYSBnYWxheHkgb2YgZGFyayBtYWdpYywgZm91ciBmaWdodGVycyBzZWVrIGZyZWVkb20uJyxcblx0J0luIGFuIGVtcGlyZSBvZiBkZWNlcHRpb24sIHNpeCB0b21iLXJvYmJlcnMgcXVlc3QgZm9yIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIGNvbWJhdCBhbiBhcm15IG9mIHJhaWRlcnMuJyxcblx0J0luIGEga2luZ2RvbSBvZiBjb3JydXB0aW9uIGFuZCBsb3N0IHNvdWxzLCBpbiBhbiBhZ2Ugb2YgcGFuaWMsIGVpZ2h0IHBsYW5ldG9sb2dpc3RzIG9wcG9zZSBldmlsLicsXG5cdCdJbiBhIGdhbGF4eSBvZiBtaXNlcnkgYW5kIGhvcGVsZXNzbmVzcywgaW4gYSB0aW1lIG9mIGFnb255IGFuZCBwYWluLCBmaXZlIHBsYW5ldG9sb2dpc3RzIHNlYXJjaCBmb3IgdmVuZ2FuY2UuJyxcblx0J0luIGEgdW5pdmVyc2Ugb2YgdGVjaG5vbG9neSBhbmQgaW5zYW5pdHksIGluIGEgdGltZSBvZiBzb3JjZXJ5LCBhIGNvbXB1dGVyIHRlY2hpY2lhbiBxdWVzdHMgZm9yIGhvcGUuJyxcblx0J09uIGEgcGxhbmV0IG9mIGRhcmsgbWFnaWMgYW5kIGJhcmJhcmlzbSwgaW4gYW4gYWdlIG9mIGhvcnJvciBhbmQgYmxhc3BoZW15LCBzZXZlbiBsaWJyYXJpYW5zIHNlYXJjaCBmb3IgZmFtZS4nLFxuXHQnSW4gYW4gZW1waXJlIG9mIGRhcmsgbWFnaWMsIGluIGEgdGltZSBvZiBibG9vZCBhbmQgaWxsdXNpb25zLCBmb3VyIG1vbmtzIHRyeSB0byBmaW5kIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIGNvbWJhdCB0ZXJyb3Jpc20uJyxcblx0J0luIGEgZm9yZ290dGVuIGVtcGlyZSBvZiBkYXJrIG1hZ2ljLCBzaXgga2luZ3MgdHJ5IHRvIHByZXZlbnQgdGhlIGRlc3RydWN0aW9uIG9mIG1hbmtpbmQuJyxcblx0J0luIGEgZ2FsYXh5IG9mIGRhcmsgbWFnaWMgYW5kIGhvcnJvciwgaW4gYW4gYWdlIG9mIGhvcGVsZXNzbmVzcywgZm91ciBtYXJpbmVzIGFuZCBhbiBvdXRsYXcgY29tYmF0IGV2aWwuJyxcblx0J0luIGEgbXlzdGVyaW91cyBjaXR5IG9mIGlsbHVzaW9uLCBpbiBhbiBhZ2Ugb2YgY29tcHV0ZXJpemF0aW9uLCBhIHdpdGNoLWh1bnRlciB0cmllcyB0byBmaW5kIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIG9wcG9zZXMgYW4gZXZpbCBjb3Jwb3JhdGlvbi4nLFxuXHQnSW4gYSBkYW1uZWQga2luZ2RvbSBvZiB0ZWNobm9sb2d5LCBhIHZpcnR1YWwgcmVhbGl0eSBwcm9ncmFtbWVyIGFuZCBhIGZpZ2h0ZXIgc2VlayBmYW1lLicsXG5cdCdJbiBhIGhlbGxpc2gga2luZ2RvbSwgaW4gYW4gYWdlIG9mIGJsYXNwaGVteSBhbmQgYmxhc3BoZW15LCBhbiBhc3Ryb2xvZ2VyIHNlYXJjaGVzIGZvciBmYW1lLicsXG5cdCdJbiBhIGRhbW5lZCB3b3JsZCBvZiBkZXZpbHMsIGFuIGFsaWVuIGFuZCBhIHJhbmdlciBxdWVzdCBmb3IgbG92ZSBhbmQgb3Bwb3NlIGEgc3luZGljYXRlIG9mIGRlbW9ucy4nLFxuXHQnSW4gYSBjdXJzZWQgZ2FsYXh5LCBpbiBhIHRpbWUgb2YgcGFpbiwgc2V2ZW4gbGlicmFyaWFucyBob3BlIHRvIGF2ZXJ0IHRoZSBhcG9jYWx5cHNlLicsXG5cdCdJbiBhIGNyaW1lLWluZmVzdGVkIGdhbGF4eSwgaW4gYW4gZXJhIG9mIGhvcGVsZXNzbmVzcyBhbmQgcGFuaWMsIHRocmVlIGNoYW1waW9ucyBhbmQgYSBncmF2ZSByb2JiZXIgdHJ5IHRvIHNvbHZlIHRoZSB1bHRpbWF0ZSBjcmltZS4nXG5dO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gKCk9Pntcblx0cmV0dXJuIGA8c3R5bGU+XG4gIC5hZ2UjcDF7IHRleHQtYWxpZ246Y2VudGVyOyB9XG4gIC5hZ2UjcDE6YWZ0ZXJ7IGRpc3BsYXk6bm9uZTsgfVxuICAmOm5vdCg6bnRoLWNoaWxkKDEpKSB7XG5cdCY6YWZ0ZXJ7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogQGhlYWRlclRleHRcblx0fVxuICB9XG5cbjwvc3R5bGU+XG5cbjxkaXYgc3R5bGU9J21hcmdpbi10b3A6NDUwcHg7Jz48L2Rpdj5cblxuIyAke18uc2FtcGxlKHRpdGxlcyl9XG5cbjxkaXYgc3R5bGU9J21hcmdpbi10b3A6MjVweCc+PC9kaXY+XG48ZGl2IGNsYXNzPSd3aWRlJz5cbiMjIyMjICR7Xy5zYW1wbGUoc3VidGl0bGVzKX1cbjwvZGl2PlxuXG5cXFxccGFnZWA7XG59OyIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3Qgc3BlbGxOYW1lcyA9IFtcblx0J0FzdHJhbCBSaXRlIG9mIEFjbmUnLFxuXHQnQ3JlYXRlIEFjbmUnLFxuXHQnQ3Vyc2VkIFJhbWVuIEVycnVwdGlvbicsXG5cdCdEYXJrIENoYW50IG9mIHRoZSBEZW50aXN0cycsXG5cdCdFcnJ1cHRpb24gb2YgSW1tYXR1cml0eScsXG5cdCdGbGFtaW5nIERpc2Mgb2YgSW5jb252ZW5pZW5jZScsXG5cdCdIZWFsIEJhZCBIeWdlbmUnLFxuXHQnSGVhdmVubHkgVHJhbnNmaWd1cmF0aW9uIG9mIHRoZSBDcmVhbSBEZXZpbCcsXG5cdCdIZWxsaXNoIENhZ2Ugb2YgTXVjdXMnLFxuXHQnSXJyaXRhdGUgUGVhbnV0IEJ1dHRlciBGYWlyeScsXG5cdCdMdW1pbm91cyBFcnJ1cHRpb24gb2YgVGVhJyxcblx0J015c3RpYyBTcGVsbCBvZiB0aGUgUG9zZXInLFxuXHQnU29yY2Vyb3VzIEVuY2hhbnRtZW50IG9mIHRoZSBDaGltbmV5c3dlZXAnLFxuXHQnU3RlYWsgU2F1Y2UgUmF5Jyxcblx0J1RhbGsgdG8gR3JvdXBpZScsXG5cdCdBc3RvbmlzaGluZyBDaGFudCBvZiBDaG9jb2xhdGUnLFxuXHQnQXN0b3VuZGluZyBQYXN0YSBQdWRkbGUnLFxuXHQnQmFsbCBvZiBBbm5veWFuY2UnLFxuXHQnQ2FnZSBvZiBZYXJuJyxcblx0J0NvbnRyb2wgTm9vZGxlcyBFbGVtZW50YWwnLFxuXHQnQ3JlYXRlIE5lcnZvdXNuZXNzJyxcblx0J0N1cmUgQmFsZG5lc3MnLFxuXHQnQ3Vyc2VkIFJpdHVhbCBvZiBCYWQgSGFpcicsXG5cdCdEaXNwZWxsIFBpbGVzIGluIERlbnRpc3QnLFxuXHQnRWxpbWluYXRlIEZsb3Jpc3RzJyxcblx0J0lsbHVzaW9uYXJ5IFRyYW5zZmlndXJhdGlvbiBvZiB0aGUgQmFieXNpdHRlcicsXG5cdCdOZWNyb21hbnRpYyBBcm1vciBvZiBTYWxhZCBEcmVzc2luZycsXG5cdCdPY2N1bHQgVHJhbnNmaWd1cmF0aW9uIG9mIEZvb3QgRmV0aXNoJyxcblx0J1Byb3RlY3Rpb24gZnJvbSBNdWN1cyBHaWFudCcsXG5cdCdUaW5zZWwgQmxhc3QnLFxuXHQnQWxjaGVtaWNhbCBFdm9jYXRpb24gb2YgdGhlIEdvdGhzJyxcblx0J0NhbGwgRmFuZ2lybCcsXG5cdCdEaXZpbmUgU3BlbGwgb2YgQ3Jvc3NkcmVzc2luZycsXG5cdCdEb21pbmF0ZSBSYW1lbiBHaWFudCcsXG5cdCdFbGltaW5hdGUgVmluZGljdGl2ZW5lc3MgaW4gR3ltIFRlYWNoZXInLFxuXHQnRXh0cmEtUGxhbmFyIFNwZWxsIG9mIElycml0YXRpb24nLFxuXHQnSW5kdWNlIFdoaW5pbmcgaW4gQmFieXNpdHRlcicsXG5cdCdJbnZva2UgQ29tcGxhaW5pbmcnLFxuXHQnTWFnaWNhbCBFbmNoYW50bWVudCBvZiBBcnJvZ2FuY2UnLFxuXHQnT2NjdWx0IEdsb2JlIG9mIFNhbGFkIERyZXNzaW5nJyxcblx0J092ZXJ3aGVsbWluZyBFbmNoYW50bWVudCBvZiB0aGUgQ2hvY29sYXRlIEZhaXJ5Jyxcblx0J1NvcmNlcm91cyBEYW5kcnVmZiBHbG9iZScsXG5cdCdTcGlyaXR1YWwgSW52b2NhdGlvbiBvZiB0aGUgQ29zdHVtZXJzJyxcblx0J1VsdGltYXRlIFJpdGUgb2YgdGhlIENvbmZldHRpIEFuZ2VsJyxcblx0J1VsdGltYXRlIFJpdHVhbCBvZiBNb3V0aHdhc2gnLFxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0c3BlbGxMaXN0IDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBsZXZlbHMgPSBbJ0NhbnRyaXBzICgwIExldmVsKScsICcybmQgTGV2ZWwnLCAnM3JkIExldmVsJywgJzR0aCBMZXZlbCcsICc1dGggTGV2ZWwnLCAnNnRoIExldmVsJywgJzd0aCBMZXZlbCcsICc4dGggTGV2ZWwnLCAnOXRoIExldmVsJ107XG5cblx0XHRjb25zdCBjb250ZW50ID0gXy5tYXAobGV2ZWxzLCAobGV2ZWwpPT57XG5cdFx0XHRjb25zdCBzcGVsbHMgPSBfLm1hcChfLnNhbXBsZVNpemUoc3BlbGxOYW1lcywgXy5yYW5kb20oNSwgMTUpKSwgKHNwZWxsKT0+e1xuXHRcdFx0XHRyZXR1cm4gYC0gJHtzcGVsbH1gO1xuXHRcdFx0fSkuam9pbignXFxuJyk7XG5cdFx0XHRyZXR1cm4gYCMjIyMjICR7bGV2ZWx9IFxcbiR7c3BlbGxzfSBcXG5gO1xuXHRcdH0pLmpvaW4oJ1xcbicpO1xuXG5cdFx0cmV0dXJuIGA8ZGl2IGNsYXNzPSdzcGVsbExpc3QnPlxcbiR7Y29udGVudH1cXG48L2Rpdj5gO1xuXHR9LFxuXG5cdHNwZWxsIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBsZXZlbCA9IFsnMXN0JywgJzJuZCcsICczcmQnLCAnNHRoJywgJzV0aCcsICc2dGgnLCAnN3RoJywgJzh0aCcsICc5dGgnXTtcblx0XHRjb25zdCBzcGVsbFNjaG9vbHMgPSBbJ2FianVyYXRpb24nLCAnY29uanVyYXRpb24nLCAnZGl2aW5hdGlvbicsICdlbmNoYW50bWVudCcsICdldm9jYXRpb24nLCAnaWxsdXNpb24nLCAnbmVjcm9tYW5jeScsICd0cmFuc211dGF0aW9uJ107XG5cblxuXHRcdGxldCBjb21wb25lbnRzID0gXy5zYW1wbGVTaXplKFsnVicsICdTJywgJ00nXSwgXy5yYW5kb20oMSwgMykpLmpvaW4oJywgJyk7XG5cdFx0aWYoY29tcG9uZW50cy5pbmRleE9mKCdNJykgIT09IC0xKXtcblx0XHRcdGNvbXBvbmVudHMgKz0gYCAoJHtfLnNhbXBsZVNpemUoWydhIHNtYWxsIGRvbGwnLCAnYSBjcnVzaGVkIGJ1dHRvbiB3b3J0aCBhdCBsZWFzdCAxY3AnLCAnZGlzY2FyZGVkIGd1bSB3cmFwcGVyJ10sIF8ucmFuZG9tKDEsIDMpKS5qb2luKCcsICcpfSlgO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXG5cdFx0XHRgIyMjIyAke18uc2FtcGxlKHNwZWxsTmFtZXMpfWAsXG5cdFx0XHRgKiR7Xy5zYW1wbGUobGV2ZWwpfS1sZXZlbCAke18uc2FtcGxlKHNwZWxsU2Nob29scyl9KmAsXG5cdFx0XHQnX19fJyxcblx0XHRcdCctICoqQ2FzdGluZyBUaW1lOioqIDEgYWN0aW9uJyxcblx0XHRcdGAtICoqUmFuZ2U6KiogJHtfLnNhbXBsZShbJ1NlbGYnLCAnVG91Y2gnLCAnMzAgZmVldCcsICc2MCBmZWV0J10pfWAsXG5cdFx0XHRgLSAqKkNvbXBvbmVudHM6KiogJHtjb21wb25lbnRzfWAsXG5cdFx0XHRgLSAqKkR1cmF0aW9uOioqICR7Xy5zYW1wbGUoWydVbnRpbCBkaXNwZWxsZWQnLCAnMSByb3VuZCcsICdJbnN0YW50YW5lb3VzJywgJ0NvbmNlbnRyYXRpb24sIHVwIHRvIDEwIG1pbnV0ZXMnLCAnMSBob3VyJ10pfWAsXG5cdFx0XHQnJyxcblx0XHRcdCdBIGZsYW1lLCBlcXVpdmFsZW50IGluIGJyaWdodG5lc3MgdG8gYSB0b3JjaCwgc3ByaW5ncyBmcm9tIGZyb20gYW4gb2JqZWN0IHRoYXQgeW91IHRvdWNoLiAnLFxuXHRcdFx0J1RoZSBlZmZlY3QgbG9vayBsaWtlIGEgcmVndWxhciBmbGFtZSwgYnV0IGl0IGNyZWF0ZXMgbm8gaGVhdCBhbmQgZG9lc25cXCd0IHVzZSBveHlnZW4uICcsXG5cdFx0XHQnQSAqY29udGludWFsIGZsYW1lKiBjYW4gYmUgY292ZXJlZCBvciBoaWRkZW4gYnV0IG5vdCBzbW90aGVyZWQgb3IgcXVlbmNoZWQuJyxcblx0XHRcdCdcXG5cXG5cXG4nXG5cdFx0XS5qb2luKCdcXG4nKTtcblx0fVxufTsiLCJjb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmNvbnN0IGdlbkxpc3QgPSBmdW5jdGlvbihsaXN0LCBtYXgpe1xuXHRyZXR1cm4gXy5zYW1wbGVTaXplKGxpc3QsIF8ucmFuZG9tKDAsIG1heCkpLmpvaW4oJywgJykgfHwgJ05vbmUnO1xufTtcblxuY29uc3QgZ2V0TW9uc3Rlck5hbWUgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gXy5zYW1wbGUoW1xuXHRcdCdBbGwtZGV2b3VyaW5nIEJhc2ViYWxsIEltcCcsXG5cdFx0J0FsbC1kZXZvdXJpbmcgR3VtZHJvcCBXcmFpdGgnLFxuXHRcdCdDaG9jb2xhdGUgSHlkcmEnLFxuXHRcdCdEZXZvdXJpbmcgUGVhY29jaycsXG5cdFx0J0Vjb25vbXktc2l6ZWQgQ29sb3NzdXMgb2YgdGhlIExlbW9uYWRlIFN0YW5kJyxcblx0XHQnR2hvc3QgUGlnZW9uJyxcblx0XHQnR2liYmVyaW5nIER1Y2snLFxuXHRcdCdTcGFya2xlbXVmZmluIFBlYWNvY2sgU3BpZGVyJyxcblx0XHQnR3VtIEVsZW1lbnRhbCcsXG5cdFx0J0lsbGl0ZXJhdGUgQ29uc3RydWN0IG9mIHRoZSBDYW5keSBTdG9yZScsXG5cdFx0J0luZWZmYWJsZSBDaGlodWFodWEnLFxuXHRcdCdJcnJpdGF0aW5nIERlYXRoIEhhbXN0ZXInLFxuXHRcdCdJcnJpdGF0aW5nIEdvbGQgTW91c2UnLFxuXHRcdCdKdWdnZXJuYXV0IFNuYWlsJyxcblx0XHQnSnVnZ2VybmF1dCBvZiB0aGUgU29jayBEcmF3ZXInLFxuXHRcdCdLb2FsYSBvZiB0aGUgQ29zbW9zJyxcblx0XHQnTWFkIEtvYWxhIG9mIHRoZSBXZXN0Jyxcblx0XHQnTWlsayBEamlubmkgb2YgdGhlIExlbW9uYWRlIFN0YW5kJyxcblx0XHQnTWluZCBGZXJyZXQnLFxuXHRcdCdNeXN0aWMgU2FsdCBTcGlkZXInLFxuXHRcdCdOZWNyb3RpYyBIYWxpdG9zaXMgQW5nZWwnLFxuXHRcdCdQaW5zdHJpcGVkIEZhbWluZSBTaGVlcCcsXG5cdFx0J1JpdGFsaW4gTGVlY2gnLFxuXHRcdCdTaG9ja2VyIEthbmdhcm9vJyxcblx0XHQnU3RlbGxhciBUZW5uaXMgSnVnZ2VybmF1dCcsXG5cdFx0J1dhaWxpbmcgUXVhaWwgb2YgdGhlIFN1bicsXG5cdFx0J0FuZ2VsIFBpZ2VvbicsXG5cdFx0J0FuaW1lIFNwaGlueCcsXG5cdFx0J0JvcmVkIEF2YWxhbmNoZSBTaGVlcCBvZiB0aGUgV2FzdGVsYW5kJyxcblx0XHQnRGV2b3VyaW5nIE5vdWdhdCBTcGhpbnggb2YgdGhlIFNvY2sgRHJhd2VyJyxcblx0XHQnRGppbm5pIG9mIHRoZSBGb290bG9ja2VyJyxcblx0XHQnRWN0b3BsYXNtaWMgSmF6eiBEZXZpbCcsXG5cdFx0J0ZsYXR1ZW50IEFuZ2VsJyxcblx0XHQnR2VsYXRpbm91cyBEdWNrIG9mIHRoZSBEcmVhbS1MYW5kcycsXG5cdFx0J0dlbGF0aW5vdXMgTW91c2UnLFxuXHRcdCdHb2xlbSBvZiB0aGUgRm9vdGxvY2tlcicsXG5cdFx0J0xpY2ggV29tYmF0Jyxcblx0XHQnTWVjaGFuaWNhbCBTbG90aCBvZiB0aGUgUGFzdCcsXG5cdFx0J01pbGtzaGFrZSBTdWNjdWJ1cycsXG5cdFx0J1B1ZmZ5IEJvbmUgUGVhY29jayBvZiB0aGUgRWFzdCcsXG5cdFx0J1JhaW5ib3cgTWFuYXRlZScsXG5cdFx0J1J1bmUgUGFycm90Jyxcblx0XHQnU2FuZCBDb3cnLFxuXHRcdCdTaW5pc3RlciBWYW5pbGxhIERyYWdvbicsXG5cdFx0J1NuYWlsIG9mIHRoZSBOb3J0aCcsXG5cdFx0J1NwaWRlciBvZiB0aGUgU2V3ZXInLFxuXHRcdCdTdGVsbGFyIFNhd2R1c3QgTGVlY2gnLFxuXHRcdCdTdG9ybSBBbnRlYXRlciBvZiBIZWxsJyxcblx0XHQnU3R1cGlkIFNwaXJpdCBvZiB0aGUgQnJld2VyeScsXG5cdFx0J1RpbWUgS2FuZ2Fyb28nLFxuXHRcdCdUb21iIFBvb2RsZScsXG5cdF0pO1xufTtcblxuY29uc3QgZ2V0VHlwZSA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBgJHtfLnNhbXBsZShbJ1RpbnknLCAnU21hbGwnLCAnTWVkaXVtJywgJ0xhcmdlJywgJ0dhcmdhbnR1YW4nLCAnU3R1cGlkbHkgdmFzdCddKX0gJHtfLnNhbXBsZShbJ2JlYXN0JywgJ2ZpZW5kJywgJ2Fubm95YW5jZScsICdndXknLCAnY3V0aWUnXSl9YDtcbn07XG5cbmNvbnN0IGdldEFsaWdubWVudCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBfLnNhbXBsZShbXG5cdFx0J2Fubm95aW5nIGV2aWwnLFxuXHRcdCdjaGFvdGljIGdvc3NpcHknLFxuXHRcdCdjaGFvdGljIHNsb3BweScsXG5cdFx0J2RlcHJlc3NlZCBuZXV0cmFsJyxcblx0XHQnbGF3ZnVsIGJvZ3VzJyxcblx0XHQnbGF3ZnVsIGNveScsXG5cdFx0J21hbmljLWRlcHJlc3NpdmUgZXZpbCcsXG5cdFx0J25hcnJvdy1taW5kZWQgbmV1dHJhbCcsXG5cdFx0J25ldXRyYWwgYW5ub3lpbmcnLFxuXHRcdCduZXV0cmFsIGlnbm9yYW50Jyxcblx0XHQnb2VkcGlwYWwgbmV1dHJhbCcsXG5cdFx0J3NpbGx5IG5ldXRyYWwnLFxuXHRcdCd1bm9yaWdpbmFsIG5ldXRyYWwnLFxuXHRcdCd3ZWlyZCBuZXV0cmFsJyxcblx0XHQnd29yZHkgZXZpbCcsXG5cdFx0J3VuYWxpZ25lZCdcblx0XSk7XG59O1xuXG5jb25zdCBnZXRTdGF0cyA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBgPnwke18udGltZXMoOSwgZnVuY3Rpb24oKXtcblx0XHRjb25zdCBudW0gPSBfLnJhbmRvbSgxLCAxNSk7XG5cdFx0Y29uc3QgdmFsID0gTWF0aC5jZWlsKG51bS8zIC0gMik7XG5cdFx0Ly9jb25zdCBtb2QgPSBNYXRoLmNlaWwobnVtLzIgLSA1KTtcblx0XHRyZXR1cm4gYCgkeyBudW0gPT0gMSA/IC0yIDogKG51bSA9PSAxNSA/IDQgOiB2YWwpIH0pYDtcblx0fSkuam9pbignfCcpfXxgO1xufTtcblxuY29uc3QgZ2VuQWJpbGl0aWVzID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIF8uc2FtcGxlKFtcblx0XHQnPiAtICoqKlBhY2sgVGFjdGljcy4qKiogVGhlc2UgZ3V5cyB3b3JrIHRvZ2V0aGVyLiBMaWtlIHN1cGVyIHdlbGwsIHlvdSBkb25cXCd0IGV2ZW4ga25vdy4nLFxuXHRcdCc+IC0gKioqRmFsc2UgQXBwZWFyYW5jZS4gKioqIFdoaWxlIHRoZSBhcm1vciByZWFtaW4gbW90aW9ubGVzcywgaXQgaXMgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSBhIG5vcm1hbCBzdWl0IG9mIGFybW9yLicsXG5cdF0pO1xufTtcblxuY29uc3QgZ2VuQWN0aW9uID0gZnVuY3Rpb24oKXtcblx0Y29uc3QgbmFtZSA9IF8uc2FtcGxlKFtcblx0XHQnQWJkb21pbmFsIERyb3AnLFxuXHRcdCdBaXJwbGFuZSBIYW1tZXInLFxuXHRcdCdBdG9taWMgRGVhdGggVGhyb3cnLFxuXHRcdCdCdWxsZG9nIFJha2UnLFxuXHRcdCdDb3Jrc2NyZXcgU3RyaWtlJyxcblx0XHQnQ3Jvc3NlZCBTcGxhc2gnLFxuXHRcdCdDcm9zc2ZhY2UgU3VwbGV4Jyxcblx0XHQnRERUIFBvd2VyYm9tYicsXG5cdFx0J0R1YWwgQ29icmEgV3Jpc3Rsb2NrJyxcblx0XHQnRHVhbCBUaHJvdycsXG5cdFx0J0VsYm93IEhvbGQnLFxuXHRcdCdHb3J5IEJvZHkgU3dlZXAnLFxuXHRcdCdIZWVsIEphd2JyZWFrZXInLFxuXHRcdCdKdW1waW5nIERyaXZlcicsXG5cdFx0J09wZW4gQ2hpbiBDaG9rZScsXG5cdFx0J1Njb3JwaW9uIEZsdXJyeScsXG5cdFx0J1NvbWVyc2F1bHQgU3R1bXAgRmlzdHMnLFxuXHRcdCdTdWZmZXJpbmcgV3JpbmdlcicsXG5cdFx0J1N1cGVyIEhpcCBTdWJtaXNzaW9uJyxcblx0XHQnU3VwZXIgU3BpbicsXG5cdFx0J1RlYW0gRWxib3cnLFxuXHRcdCdUZWFtIEZvb3QnLFxuXHRcdCdUaWx0LWEtd2hpcmwgQ2hpbiBTbGVlcGVyJyxcblx0XHQnVGlsdC1hLXdoaXJsIEV5ZSBUYWtlZG93bicsXG5cdFx0J1R1cm5idWNrbGUgUm9sbCdcblx0XSk7XG5cblx0cmV0dXJuIGA+ICoqKiR7bmFtZX0uKioqICpNZWxlZSBXZWFwb24gQXR0YWNrOiogKzQgdG8gaGl0LCByZWFjaCA1ZnQuLCBvbmUgdGFyZ2V0LiAqSGl0KiA1ICgxZDYgKyAyKSBgO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRmdWxsIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gYCR7W1xuXHRcdFx0J19fXycsXG5cdFx0XHQnX19fJyxcblx0XHRcdGA+ICMjICR7Z2V0TW9uc3Rlck5hbWUoKX1gLFxuXHRcdFx0YD4qJHtnZXRUeXBlKCl9LCAke2dldEFsaWdubWVudCgpfSpgLFxuXHRcdFx0Jz4gX19fJyxcblx0XHRcdGA+IC0gKipBcm1vciBDbGFzcyoqICR7Xy5yYW5kb20oMTAsIDIwKX1gLFxuXHRcdFx0YD4gLSAqKkhpdCBQb2ludHMqKiAke18ucmFuZG9tKDEsIDE1MCl9KDFkNCArIDUpYCxcblx0XHRcdGA+IC0gKipTcGVlZCoqICR7Xy5yYW5kb20oMCwgNTApfWZ0LmAsXG5cdFx0XHQnPl9fXycsXG5cdFx0XHQnPnxTVFJ8REVYfENPTnxJTlR8V0lTfENIQXwnLFxuXHRcdFx0Jz58Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Jyxcblx0XHRcdGdldFN0YXRzKCksXG5cdFx0XHQnPl9fXycsXG5cdFx0XHRgPiAtICoqQ29uZGl0aW9uIEltbXVuaXRpZXMqKiAke2dlbkxpc3QoWydncm9nZ3knLCAnc3dhZ2dlZCcsICd3ZWFrLWtuZWVkJywgJ2J1enplZCcsICdncm9vdnknLCAnbWVsYW5jaG9seScsICdkcnVuayddLCAzKX1gLFxuXHRcdFx0YD4gLSAqKlNlbnNlcyoqIHBhc3NpdmUgUGVyY2VwdGlvbiAke18ucmFuZG9tKDMsIDIwKX1gLFxuXHRcdFx0YD4gLSAqKkxhbmd1YWdlcyoqICR7Z2VuTGlzdChbJ0NvbW1vbicsICdQb3R0eW1vdXRoJywgJ0dpYmJlcmlzaCcsICdMYXRpbicsICdKaXZlJ10sIDIpfWAsXG5cdFx0XHRgPiAtICoqQ2hhbGxlbmdlKiogJHtfLnJhbmRvbSgwLCAxNSl9ICgke18ucmFuZG9tKDEwLCAxMDAwMCl9IFhQKWAsXG5cdFx0XHQnPiBfX18nLFxuXHRcdFx0Xy50aW1lcyhfLnJhbmRvbSgzLCA2KSwgZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIGdlbkFiaWxpdGllcygpO1xuXHRcdFx0fSkuam9pbignXFxuPlxcbicpLFxuXHRcdFx0Jz4gIyMjIEFjdGlvbnMnLFxuXHRcdFx0Xy50aW1lcyhfLnJhbmRvbSg0LCA2KSwgZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIGdlbkFjdGlvbigpO1xuXHRcdFx0fSkuam9pbignXFxuPlxcbicpLFxuXHRcdF0uam9pbignXFxuJyl9XFxuXFxuXFxuYDtcblx0fSxcblxuXHRoYWxmIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gYCR7W1xuXHRcdFx0J19fXycsXG5cdFx0XHRgPiAjIyMjIyAke2dldE1vbnN0ZXJOYW1lKCl9YCxcblx0XHRcdCc+fCBWYWx1ZSB8IEFiaWxpdGllcyAoRm9jdXNlcykgfCcsXG5cdFx0XHQnPnw6LS0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRgPnwgMSB8IEFjY3VyYWN5IHxgLFxuXHRcdFx0YD58IC0xIHwgQ29tbXVuaWNhdGlvbiB8YCxcblx0XHRcdGA+fCAxIHwgQ29uc3RpdHV0aW9uIChTdGFtaW5hKSB8YCxcblx0XHRcdGA+fCAwIHwgRGV4dGVyaXR5IChSaWRpbmcpIHxgLFxuXHRcdFx0YD58IDIgfCBGaWdodGluZyAoSGVhdnkgQmxhZGVzLFNwZWFycykgfGAsXG5cdFx0XHRgPnwgMCB8IEludGVsbGlnZW5jZSAoTWlsaXRhcnkgTG9yZSkgfGAsXG5cdFx0XHRgPnwgMCB8IFBlcmNlcHRpb24gfGAsXG5cdFx0XHRgPnwgMiB8IFN0cmVuZ3RoIChDbGltYmluZykgfGAsXG5cdFx0XHRgPnwgMSB8IFdpbGxwb3dlciAoTW9yYWxlKSB8YCxcblx0XHRcdCc+Jyxcblx0XHRcdCc+IHwgU3BlZWQgfCBIZWFsdGggfCBEZWZlbnNlIHwgQXJtb3IgUmF0aW5nIHwnLFxuXHRcdFx0Jz4gfDotLS0tLTp8Oi0tLS0tLTp8Oi0tLS0tLS06fDotLS0tLS0tLS0tLS06fCcsXG5cdFx0XHRgPiB8IDEwIHwgMzIgfCAxMiB8IDMgfGAsXG5cdFx0XHQnPicsIFxuXHRcdFx0Jz4gfCBXZWFwb24gfCBBdHRhY2sgUm9sbCB8IERhbWFnZSB8Jyxcblx0XHRcdCc+IHw6LS0tLS0tOnw6LS0tLS0tLS0tLS06fDotLS0tLS06fCcsXG5cdFx0XHQnPnwgTG9uZ3N3b3JkIHwgKzQgfCAyZDYrMiB8Jyxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHQnPiAjIyMjIyMgU3BlY2lhbCBRdWFsaXRpZXMgJyxcblx0XHRcdCc+Jyxcblx0XHRcdCc+IC0gKipGYXZvcmVkIFN0dW50cyoqOiBLbm9jayBQcm9uZSwgTWlnaHR5IEJsb3csIFNraXJtaXNoLiAnLFxuXHRcdFx0Jz4gLSAqKlRhbGVudHMqKjogQXJtb3IgIFRyYWluaW5nIChKb3VybmV5bWFuKSwgU2luZ2xlIFdlYXBvbiBTdHlsZSAoTm92aWNlKSwgVGhyb3duIFdlYXBvbiBTdHlsZSAoTm92aWNlKS4nLFxuXHRcdFx0Jz4gLSAqKldlYXBvbnMgR3JvdXBzKio6IEJyYXdsaW5nLCBIZWF2eSBCbGFkZXMsIFBvbGVhcm1zLCBTcGVhcnMuJyxcblx0XHRcdCc+IC0gKipFcXVpcG1lbnQqKjogTGlnaHQgbWFpbCwgbWVkaXVtIHNoaWVsZCwgbG9uZ3N3b3JkLCBhbmQgdHdvIHRocm93aW5nIHNwZWFycy4nLFxuXHRcdFx0Jz4gJyxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHQnPiAjIyMjIyBUaHJlYXQ6IE1pbm9yJyxcblx0XHRdLmpvaW4oJ1xcbicpfVxcblxcblxcbmA7XG5cbi8qIFxuXHRcdFx0J19fXycsXG5cdFx0XHRgPiAjIyAke2dldE1vbnN0ZXJOYW1lKCl9YCxcblx0XHRcdGA+KiR7Z2V0VHlwZSgpfSwgJHtnZXRBbGlnbm1lbnQoKX0qYCxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHRgPiAtICoqQXJtb3IgQ2xhc3MqKiAke18ucmFuZG9tKDEwLCAyMCl9YCxcblx0XHRcdGA+IC0gKipIaXQgUG9pbnRzKiogJHtfLnJhbmRvbSgxLCAxNTApfSgxZDQgKyA1KWAsXG5cdFx0XHRgPiAtICoqU3BlZWQqKiAke18ucmFuZG9tKDAsIDUwKX1mdC5gLFxuXHRcdFx0Jz5fX18nLFxuXHRcdFx0Jz58U1RSfERFWHxDT058SU5UfFdJU3xDSEF8Jyxcblx0XHRcdCc+fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fCcsXG5cdFx0XHRnZXRTdGF0cygpLFxuXHRcdFx0Jz5fX18nLFxuXHRcdFx0YD4gLSAqKkNvbmRpdGlvbiBJbW11bml0aWVzKiogJHtnZW5MaXN0KFsnZ3JvZ2d5JywgJ3N3YWdnZWQnLCAnd2Vhay1rbmVlZCcsICdidXp6ZWQnLCAnZ3Jvb3Z5JywgJ21lbGFuY2hvbHknLCAnZHJ1bmsnXSwgMyl9YCxcblx0XHRcdGA+IC0gKipTZW5zZXMqKiBwYXNzaXZlIFBlcmNlcHRpb24gJHtfLnJhbmRvbSgzLCAyMCl9YCxcblx0XHRcdGA+IC0gKipMYW5ndWFnZXMqKiAke2dlbkxpc3QoWydDb21tb24nLCAnUG90dHltb3V0aCcsICdHaWJiZXJpc2gnLCAnTGF0aW4nLCAnSml2ZSddLCAyKX1gLFxuXHRcdFx0YD4gLSAqKkNoYWxsZW5nZSoqICR7Xy5yYW5kb20oMCwgMTUpfSAoJHtfLnJhbmRvbSgxMCwgMTAwMDApfSBYUClgLFxuXHRcdFx0Jz4gX19fJyxcblx0XHRcdF8udGltZXMoXy5yYW5kb20oMCwgMiksIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBnZW5BYmlsaXRpZXMoKTtcblx0XHRcdH0pLmpvaW4oJ1xcbj5cXG4nKSxcblx0XHRcdCc+ICMjIyBBY3Rpb25zJyxcblx0XHRcdF8udGltZXMoXy5yYW5kb20oMSwgMiksIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBnZW5BY3Rpb24oKTtcblx0XHRcdH0pLmpvaW4oJ1xcbj5cXG4nKSxcblx0XHRdLmpvaW4oJ1xcbicpfVxcblxcblxcbmA7ICovXG5cdH1cbn07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGluZXMgKi9cblxuY29uc3QgTWFnaWNHZW4gPSByZXF1aXJlKCcuL21hZ2ljLmdlbi5qcycpO1xuY29uc3QgQ2xhc3NUYWJsZUdlbiA9IHJlcXVpcmUoJy4vY2xhc3N0YWJsZS5nZW4uanMnKTtcbmNvbnN0IE1vbnN0ZXJCbG9ja0dlbiA9IHJlcXVpcmUoJy4vbW9uc3RlcmJsb2NrLmdlbi5qcycpO1xuY29uc3QgQ2xhc3NGZWF0dXJlR2VuID0gcmVxdWlyZSgnLi9jbGFzc2ZlYXR1cmUuZ2VuLmpzJyk7XG5jb25zdCBDb3ZlclBhZ2VHZW4gPSByZXF1aXJlKCcuL2NvdmVycGFnZS5nZW4uanMnKTtcbmNvbnN0IFRhYmxlT2ZDb250ZW50c0dlbiA9IHJlcXVpcmUoJy4vdGFibGVPZkNvbnRlbnRzLmdlbi5qcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gW1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnRWRpdG9yJyxcblx0XHRpY29uICAgICAgOiAnZmEtcGVuY2lsJyxcblx0XHRzbmlwcGV0cyAgOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQ29sdW1uIEJyZWFrJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1jb2x1bW5zJyxcblx0XHRcdFx0Z2VuICA6ICdgYGBcXG5gYGBcXG5cXG4nXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ05ldyBQYWdlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1maWxlLXRleHQnLFxuXHRcdFx0XHRnZW4gIDogJ1xcXFxwYWdlXFxuXFxuJ1xuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdWZXJ0aWNhbCBTcGFjaW5nJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1hcnJvd3MtdicsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBzdHlsZT1cXCdtYXJnaW4tdG9wOjE0MHB4XFwnPjwvZGl2Plxcblxcbidcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnV2lkZSBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtYXJyb3dzLWgnLFxuXHRcdFx0XHRnZW4gIDogJzxkaXYgY2xhc3M9XFwnd2lkZVxcJz5cXG5FdmVyeXRoaW5nIGluIGhlcmUgd2lsbCBiZSBleHRyYSB3aWRlLiBUYWJsZXMsIHRleHQsIGV2ZXJ5dGhpbmchIEJld2FyZSB0aG91Z2gsIENTUyBjb2x1bW5zIGNhbiBiZWhhdmUgYSBiaXQgd2VpcmQgc29tZXRpbWVzLlxcbjwvZGl2Plxcbidcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnSW1hZ2UnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLWltYWdlJyxcblx0XHRcdFx0Z2VuICA6IFtcblx0XHRcdFx0XHQnPGltZyAnLFxuXHRcdFx0XHRcdCcgIHNyYz1cXCdodHRwczovL3MtbWVkaWEtY2FjaGUtYWswLnBpbmltZy5jb20vNzM2eC80YS84MS83OS80YTgxNzk0NjJjZmRmMzkwNTRhNDE4ZWZkNGNiNzQzZS5qcGdcXCcgJyxcblx0XHRcdFx0XHQnICBzdHlsZT1cXCd3aWR0aDozMjVweFxcJyAvPicsXG5cdFx0XHRcdFx0J0NyZWRpdDogS3lvdW5naHdhbiBLaW0nXG5cdFx0XHRcdF0uam9pbignXFxuJylcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQmFja2dyb3VuZCBJbWFnZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdHJlZScsXG5cdFx0XHRcdGdlbiAgOiBbXG5cdFx0XHRcdFx0JzxpbWcgJyxcblx0XHRcdFx0XHQnICBzcmM9XFwnaHR0cDovL2kuaW1ndXIuY29tL2hNbmE2RzAucG5nXFwnICcsXG5cdFx0XHRcdFx0JyAgc3R5bGU9XFwncG9zaXRpb246YWJzb2x1dGU7IHRvcDo1MHB4OyByaWdodDozMHB4OyB3aWR0aDoyODBweFxcJyAvPidcblx0XHRcdFx0XS5qb2luKCdcXG4nKVxuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1BhZ2UgTnVtYmVyJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1ib29rbWFyaycsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBjbGFzcz1cXCdwYWdlTnVtYmVyXFwnPjE8L2Rpdj5cXG48ZGl2IGNsYXNzPVxcJ2Zvb3Rub3RlXFwnPlBBUlQgMSB8IEZBTkNJTkVTUzwvZGl2Plxcblxcbidcblx0XHRcdH0sXG5cblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdBdXRvLWluY3JlbWVudGluZyBQYWdlIE51bWJlcicsXG5cdFx0XHRcdGljb24gOiAnZmEtc29ydC1udW1lcmljLWFzYycsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBjbGFzcz1cXCdwYWdlTnVtYmVyIGF1dG9cXCc+PC9kaXY+XFxuJ1xuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0xpbmsgdG8gcGFnZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGluaycsXG5cdFx0XHRcdGdlbiAgOiAnW0NsaWNrIGhlcmVdKCNwMykgdG8gZ28gdG8gcGFnZSAzXFxuJ1xuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1RhYmxlIG9mIENvbnRlbnRzJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1ib29rJyxcblx0XHRcdFx0Z2VuICA6IFRhYmxlT2ZDb250ZW50c0dlblxuXHRcdFx0fSxcblxuXG5cdFx0XVxuXHR9LFxuXG5cblx0LyoqKioqKioqKioqKioqKioqKioqKioqKiogQUdFICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnQUdFJyxcblx0XHRpY29uICAgICAgOiAnZmEtYm9vaycsXG5cdFx0c25pcHBldHMgIDogW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1NwZWxsJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1tYWdpYycsXG5cdFx0XHRcdGdlbiAgOiBNYWdpY0dlbi5zcGVsbCxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnU3BlbGwgTGlzdCcsXG5cdFx0XHRcdGljb24gOiAnZmEtbGlzdCcsXG5cdFx0XHRcdGdlbiAgOiBNYWdpY0dlbi5zcGVsbExpc3QsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0NsYXNzIEZlYXR1cmUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRyb3BoeScsXG5cdFx0XHRcdGdlbiAgOiBDbGFzc0ZlYXR1cmVHZW4sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ05vdGUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXN0aWNreS1ub3RlJyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCc+ICMjIyMjIFRpbWUgdG8gRHJvcCBLbm93bGVkZ2UnLFxuXHRcdFx0XHRcdFx0Jz4gVXNlIG5vdGVzIHRvIHBvaW50IG91dCBzb21lIGludGVyZXN0aW5nIGluZm9ybWF0aW9uLiAnLFxuXHRcdFx0XHRcdFx0Jz4gJyxcblx0XHRcdFx0XHRcdCc+ICoqVGFibGVzIGFuZCBsaXN0cyoqIGJvdGggd29yayB3aXRoaW4gYSBub3RlLidcblx0XHRcdFx0XHRdLmpvaW4oJ1xcbicpO1xuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdEZXNjcmlwdGl2ZSBUZXh0IEJveCcsXG5cdFx0XHRcdGljb24gOiAnZmEtc3RpY2t5LW5vdGUtbycsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cXCdkZXNjcmlwdGl2ZVxcJz4nLFxuXHRcdFx0XHRcdFx0JyMjIyMjIFRpbWUgdG8gRHJvcCBLbm93bGVkZ2UnLFxuXHRcdFx0XHRcdFx0J1VzZSBub3RlcyB0byBwb2ludCBvdXQgc29tZSBpbnRlcmVzdGluZyBpbmZvcm1hdGlvbi4gJyxcblx0XHRcdFx0XHRcdCcnLFxuXHRcdFx0XHRcdFx0JyoqVGFibGVzIGFuZCBsaXN0cyoqIGJvdGggd29yayB3aXRoaW4gYSBub3RlLicsXG5cdFx0XHRcdFx0XHQnPC9kaXY+J1xuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ01vbnN0ZXIgU3RhdCBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtYnVnJyxcblx0XHRcdFx0Z2VuICA6IE1vbnN0ZXJCbG9ja0dlbi5oYWxmLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdXaWRlIE1vbnN0ZXIgU3RhdCBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtcGF3Jyxcblx0XHRcdFx0Z2VuICA6IE1vbnN0ZXJCbG9ja0dlbi5mdWxsLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdDb3ZlciBQYWdlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1maWxlLXdvcmQtbycsXG5cdFx0XHRcdGdlbiAgOiBDb3ZlclBhZ2VHZW4sXG5cdFx0XHR9LFxuXHRcdF1cblx0fSxcblxuXG5cblx0LyoqKioqKioqKioqKioqKioqKioqKiAgVEFCTEVTICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHR7XG5cdFx0Z3JvdXBOYW1lIDogJ1RhYmxlcycsXG5cdFx0aWNvbiAgICAgIDogJ2ZhLXRhYmxlJyxcblx0XHRzbmlwcGV0cyAgOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQ2xhc3MgVGFibGUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRhYmxlJyxcblx0XHRcdFx0Z2VuICA6IENsYXNzVGFibGVHZW4uZnVsbCxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnSGFsZiBDbGFzcyBUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGlzdC1hbHQnLFxuXHRcdFx0XHRnZW4gIDogQ2xhc3NUYWJsZUdlbi5oYWxmLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdGgtbGlzdCcsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnIyMjIyMgQ29va2llIFRhc3RpbmVzcycsXG5cdFx0XHRcdFx0XHQnfCBUYXN0aW5lc3MgfCBDb29raWUgVHlwZSB8Jyxcblx0XHRcdFx0XHRcdCd8Oi0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRcdFx0XHQnfCAtNSAgfCBSYWlzaW4gfCcsXG5cdFx0XHRcdFx0XHQnfCA4dGggIHwgQ2hvY29sYXRlIENoaXAgfCcsXG5cdFx0XHRcdFx0XHQnfCAxMXRoIHwgMiBvciBsb3dlciB8Jyxcblx0XHRcdFx0XHRcdCd8IDE0dGggfCAzIG9yIGxvd2VyIHwnLFxuXHRcdFx0XHRcdFx0J3wgMTd0aCB8IDQgb3IgbG93ZXIgfFxcblxcbicsXG5cdFx0XHRcdFx0XS5qb2luKCdcXG4nKTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnV2lkZSBUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGlzdCcsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cXCd3aWRlXFwnPicsXG5cdFx0XHRcdFx0XHQnIyMjIyMgQ29va2llIFRhc3RpbmVzcycsXG5cdFx0XHRcdFx0XHQnfCBUYXN0aW5lc3MgfCBDb29raWUgVHlwZSB8Jyxcblx0XHRcdFx0XHRcdCd8Oi0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRcdFx0XHQnfCAtNSAgfCBSYWlzaW4gfCcsXG5cdFx0XHRcdFx0XHQnfCA4dGggIHwgQ2hvY29sYXRlIENoaXAgfCcsXG5cdFx0XHRcdFx0XHQnfCAxMXRoIHwgMiBvciBsb3dlciB8Jyxcblx0XHRcdFx0XHRcdCd8IDE0dGggfCAzIG9yIGxvd2VyIHwnLFxuXHRcdFx0XHRcdFx0J3wgMTd0aCB8IDQgb3IgbG93ZXIgfCcsXG5cdFx0XHRcdFx0XHQnPC9kaXY+XFxuXFxuJ1xuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1NwbGl0IFRhYmxlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS10aC1sYXJnZScsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPGRpdiBzdHlsZT1cXCdjb2x1bW4tY291bnQ6MlxcJz4nLFxuXHRcdFx0XHRcdFx0J3wgZDEwIHwgRGFtYWdlIFR5cGUgfCcsXG5cdFx0XHRcdFx0XHQnfDotLS06fDotLS0tLS0tLS0tLS18Jyxcblx0XHRcdFx0XHRcdCd8ICAxICB8IEFjaWQgICAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDIgIHwgQ29sZCAgICAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgMyAgfCBGaXJlICAgICAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICA0ICB8IEZvcmNlICAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDUgIHwgTGlnaHRuaW5nICAgfCcsXG5cdFx0XHRcdFx0XHQnJyxcblx0XHRcdFx0XHRcdCdgYGAnLFxuXHRcdFx0XHRcdFx0J2BgYCcsXG5cdFx0XHRcdFx0XHQnJyxcblx0XHRcdFx0XHRcdCd8IGQxMCB8IERhbWFnZSBUeXBlIHwnLFxuXHRcdFx0XHRcdFx0J3w6LS0tOnw6LS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRcdFx0XHQnfCAgNiAgfCBOZWNyb3RpYyAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICA3ICB8IFBvaXNvbiAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDggIHwgUHN5Y2hpYyAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgOSAgfCBSYWRpYW50ICAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICAxMCB8IFRodW5kZXIgICAgIHwnLFxuXHRcdFx0XHRcdFx0JzwvZGl2PlxcblxcbicsXG5cdFx0XHRcdFx0XS5qb2luKCdcXG4nKTtcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHRdXG5cdH0sXG5cblxuXG5cblx0LyoqKioqKioqKioqKioqKiogUFJJTlQgKioqKioqKioqKioqKi9cblxuXHR7XG5cdFx0Z3JvdXBOYW1lIDogJ1ByaW50Jyxcblx0XHRpY29uICAgICAgOiAnZmEtcHJpbnQnLFxuXHRcdHNuaXBwZXRzICA6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdBNCBQYWdlU2l6ZScsXG5cdFx0XHRcdGljb24gOiAnZmEtZmlsZS1vJyxcblx0XHRcdFx0Z2VuICA6IFsnPHN0eWxlPicsXG5cdFx0XHRcdFx0JyAgLmFnZXsnLFxuXHRcdFx0XHRcdCcgICAgd2lkdGggOiAyMTBtbTsnLFxuXHRcdFx0XHRcdCcgICAgaGVpZ2h0IDogMjk2LjhtbTsnLFxuXHRcdFx0XHRcdCcgIH0nLFxuXHRcdFx0XHRcdCc8L3N0eWxlPidcblx0XHRcdFx0XS5qb2luKCdcXG4nKVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdJbmsgRnJpZW5kbHknLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRpbnQnLFxuXHRcdFx0XHRnZW4gIDogWyc8c3R5bGU+Jyxcblx0XHRcdFx0XHQnICAuYWdleyBiYWNrZ3JvdW5kIDogd2hpdGU7fScsXG5cdFx0XHRcdFx0JyAgLmFnZSBpbWd7IGRpc3BsYXkgOiBub25lO30nLFxuXHRcdFx0XHRcdCcgIC5hZ2UgaHIrYmxvY2txdW90ZXtiYWNrZ3JvdW5kIDogd2hpdGU7fScsXG5cdFx0XHRcdFx0Jzwvc3R5bGU+Jyxcblx0XHRcdFx0XHQnJ1xuXHRcdFx0XHRdLmpvaW4oJ1xcbicpXG5cdFx0XHR9LFxuXHRcdF1cblx0fSxcblxuXTtcbiIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3QgZ2V0VE9DID0gKHBhZ2VzKT0+e1xuXHRjb25zdCBhZGQxID0gKHRpdGxlLCBwYWdlKT0+e1xuXHRcdHJlcy5wdXNoKHtcblx0XHRcdHRpdGxlICAgIDogdGl0bGUsXG5cdFx0XHRwYWdlICAgICA6IHBhZ2UgKyAxLFxuXHRcdFx0Y2hpbGRyZW4gOiBbXVxuXHRcdH0pO1xuXHR9O1xuXHRjb25zdCBhZGQyID0gKHRpdGxlLCBwYWdlKT0+e1xuXHRcdGlmKCFfLmxhc3QocmVzKSkgYWRkMSgnJywgcGFnZSk7XG5cdFx0Xy5sYXN0KHJlcykuY2hpbGRyZW4ucHVzaCh7XG5cdFx0XHR0aXRsZSAgICA6IHRpdGxlLFxuXHRcdFx0cGFnZSAgICAgOiBwYWdlICsgMSxcblx0XHRcdGNoaWxkcmVuIDogW11cblx0XHR9KTtcblx0fTtcblx0Y29uc3QgYWRkMyA9ICh0aXRsZSwgcGFnZSk9Pntcblx0XHRpZighXy5sYXN0KHJlcykpIGFkZDEoJycsIHBhZ2UpO1xuXHRcdGlmKCFfLmxhc3QoXy5sYXN0KHJlcykuY2hpbGRyZW4pKSBhZGQyKCcnLCBwYWdlKTtcblx0XHRfLmxhc3QoXy5sYXN0KHJlcykuY2hpbGRyZW4pLmNoaWxkcmVuLnB1c2goe1xuXHRcdFx0dGl0bGUgICAgOiB0aXRsZSxcblx0XHRcdHBhZ2UgICAgIDogcGFnZSArIDEsXG5cdFx0XHRjaGlsZHJlbiA6IFtdXG5cdFx0fSk7XG5cdH07XG5cblx0Y29uc3QgcmVzID0gW107XG5cdF8uZWFjaChwYWdlcywgKHBhZ2UsIHBhZ2VOdW0pPT57XG5cdFx0Y29uc3QgbGluZXMgPSBwYWdlLnNwbGl0KCdcXG4nKTtcblx0XHRfLmVhY2gobGluZXMsIChsaW5lKT0+e1xuXHRcdFx0aWYoXy5zdGFydHNXaXRoKGxpbmUsICcjICcpKXtcblx0XHRcdFx0Y29uc3QgdGl0bGUgPSBsaW5lLnJlcGxhY2UoJyMgJywgJycpO1xuXHRcdFx0XHRhZGQxKHRpdGxlLCBwYWdlTnVtKTtcblx0XHRcdH1cblx0XHRcdGlmKF8uc3RhcnRzV2l0aChsaW5lLCAnIyMgJykpe1xuXHRcdFx0XHRjb25zdCB0aXRsZSA9IGxpbmUucmVwbGFjZSgnIyMgJywgJycpO1xuXHRcdFx0XHRhZGQyKHRpdGxlLCBwYWdlTnVtKTtcblx0XHRcdH1cblx0XHRcdGlmKF8uc3RhcnRzV2l0aChsaW5lLCAnIyMjICcpKXtcblx0XHRcdFx0Y29uc3QgdGl0bGUgPSBsaW5lLnJlcGxhY2UoJyMjIyAnLCAnJyk7XG5cdFx0XHRcdGFkZDModGl0bGUsIHBhZ2VOdW0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblx0cmV0dXJuIHJlcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYnJldyl7XG5cdGNvbnN0IHBhZ2VzID0gYnJldy5zcGxpdCgnXFxcXHBhZ2UnKTtcblx0Y29uc3QgVE9DID0gZ2V0VE9DKHBhZ2VzKTtcblx0Y29uc3QgbWFya2Rvd24gPSBfLnJlZHVjZShUT0MsIChyLCBnMSwgaWR4MSk9Pntcblx0XHRpZihnMS50aXRsZSkgci5wdXNoKGAtICMjIyBbPHNwYW4+JHtnMS5wYWdlfTwvc3Bhbj4gPHNwYW4+JHtnMS50aXRsZX08L3NwYW4+XSgjcCR7ZzEucGFnZX0pYCk7XG5cdFx0aWYoZzEuY2hpbGRyZW4ubGVuZ3RoKXtcblx0XHRcdF8uZWFjaChnMS5jaGlsZHJlbiwgKGcyLCBpZHgyKT0+e1xuXHRcdFx0XHRpZihnMi50aXRsZSkgci5wdXNoKGAtICMjIyMgKipbPHNwYW4+JHtnMi5wYWdlfTwvc3Bhbj4gPHNwYW4+JHtnMi50aXRsZX08L3NwYW4+XSgjcCR7ZzIucGFnZX0pKipgKTtcblx0XHRcdFx0aWYoZzIuY2hpbGRyZW4ubGVuZ3RoKXtcblx0XHRcdFx0XHRfLmVhY2goZzIuY2hpbGRyZW4sIChnMywgaWR4Myk9Pntcblx0XHRcdFx0XHRcdGlmKGczLnRpdGxlKSByLnB1c2goYCAgLSBbPHNwYW4+JHtnMy5wYWdlfTwvc3Bhbj4gPHNwYW4+JHtnMy50aXRsZX08L3NwYW4+XSgjcCR7ZzMucGFnZX0pYCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcjtcblx0fSwgW10pLmpvaW4oJ1xcbicpO1xuXG5cdHJldHVybiBgPGRpdiBjbGFzcz0ndG9jJz5cbiMjIyMjIFRhYmxlIE9mIENvbnRlbnRzXG4ke21hcmtkb3dufVxuPC9kaXY+XFxuYDtcbn07IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBDcmVhdGVSb3V0ZXIgPSByZXF1aXJlKCdwaWNvLXJvdXRlcicpLmNyZWF0ZVJvdXRlcjtcblxuY29uc3QgSG9tZVBhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL2hvbWVQYWdlL2hvbWVQYWdlLmpzeCcpO1xuY29uc3QgRWRpdFBhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL2VkaXRQYWdlL2VkaXRQYWdlLmpzeCcpO1xuY29uc3QgVXNlclBhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL3VzZXJQYWdlL3VzZXJQYWdlLmpzeCcpO1xuY29uc3QgU2hhcmVQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy9zaGFyZVBhZ2Uvc2hhcmVQYWdlLmpzeCcpO1xuY29uc3QgTmV3UGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvbmV3UGFnZS9uZXdQYWdlLmpzeCcpO1xuY29uc3QgRXJyb3JQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy9lcnJvclBhZ2UvZXJyb3JQYWdlLmpzeCcpO1xuY29uc3QgUHJpbnRQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy9wcmludFBhZ2UvcHJpbnRQYWdlLmpzeCcpO1xuXG5sZXQgUm91dGVyO1xuY29uc3QgSG9tZWJyZXcgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1cmwgICAgICAgICA6ICcnLFxuXHRcdFx0d2VsY29tZVRleHQgOiAnJyxcblx0XHRcdGNoYW5nZWxvZyAgIDogJycsXG5cdFx0XHR2ZXJzaW9uICAgICA6ICcwLjAuMCcsXG5cdFx0XHRhY2NvdW50ICAgICA6IG51bGwsXG5cdFx0XHRicmV3ICAgICAgICA6IHtcblx0XHRcdFx0dGl0bGUgICAgIDogJycsXG5cdFx0XHRcdHRleHQgICAgICA6ICcnLFxuXHRcdFx0XHRzaGFyZUlkICAgOiBudWxsLFxuXHRcdFx0XHRlZGl0SWQgICAgOiBudWxsLFxuXHRcdFx0XHRjcmVhdGVkQXQgOiBudWxsLFxuXHRcdFx0XHR1cGRhdGVkQXQgOiBudWxsLFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGdsb2JhbC5hY2NvdW50ID0gdGhpcy5wcm9wcy5hY2NvdW50O1xuXHRcdGdsb2JhbC52ZXJzaW9uID0gdGhpcy5wcm9wcy52ZXJzaW9uO1xuXG5cblx0XHRSb3V0ZXIgPSBDcmVhdGVSb3V0ZXIoe1xuXHRcdFx0Jy9lZGl0LzppZCcgOiAoYXJncyk9Pntcblx0XHRcdFx0aWYoIXRoaXMucHJvcHMuYnJldy5lZGl0SWQpe1xuXHRcdFx0XHRcdHJldHVybiA8RXJyb3JQYWdlIGVycm9ySWQ9e2FyZ3MuaWR9Lz47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gPEVkaXRQYWdlXG5cdFx0XHRcdFx0aWQ9e2FyZ3MuaWR9XG5cdFx0XHRcdFx0YnJldz17dGhpcy5wcm9wcy5icmV3fSAvPjtcblx0XHRcdH0sXG5cblx0XHRcdCcvc2hhcmUvOmlkJyA6IChhcmdzKT0+e1xuXHRcdFx0XHRpZighdGhpcy5wcm9wcy5icmV3LnNoYXJlSWQpe1xuXHRcdFx0XHRcdHJldHVybiA8RXJyb3JQYWdlIGVycm9ySWQ9e2FyZ3MuaWR9Lz47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gPFNoYXJlUGFnZVxuXHRcdFx0XHRcdGlkPXthcmdzLmlkfVxuXHRcdFx0XHRcdGJyZXc9e3RoaXMucHJvcHMuYnJld30gLz47XG5cdFx0XHR9LFxuXHRcdFx0Jy91c2VyLzp1c2VybmFtZScgOiAoYXJncyk9Pntcblx0XHRcdFx0cmV0dXJuIDxVc2VyUGFnZVxuXHRcdFx0XHRcdHVzZXJuYW1lPXthcmdzLnVzZXJuYW1lfVxuXHRcdFx0XHRcdGJyZXdzPXt0aGlzLnByb3BzLmJyZXdzfVxuXHRcdFx0XHQvPjtcblx0XHRcdH0sXG5cdFx0XHQnL3ByaW50LzppZCcgOiAoYXJncywgcXVlcnkpPT57XG5cdFx0XHRcdHJldHVybiA8UHJpbnRQYWdlIGJyZXc9e3RoaXMucHJvcHMuYnJld30gcXVlcnk9e3F1ZXJ5fS8+O1xuXHRcdFx0fSxcblx0XHRcdCcvcHJpbnQnIDogKGFyZ3MsIHF1ZXJ5KT0+e1xuXHRcdFx0XHRyZXR1cm4gPFByaW50UGFnZSBxdWVyeT17cXVlcnl9Lz47XG5cdFx0XHR9LFxuXHRcdFx0Jy9uZXcnIDogKGFyZ3MpPT57XG5cdFx0XHRcdHJldHVybiA8TmV3UGFnZSAvPjtcblx0XHRcdH0sXG5cdFx0XHQnL2NoYW5nZWxvZycgOiAoYXJncyk9Pntcblx0XHRcdFx0cmV0dXJuIDxTaGFyZVBhZ2Vcblx0XHRcdFx0XHRicmV3PXt7IHRpdGxlOiAnQ2hhbmdlbG9nJywgdGV4dDogdGhpcy5wcm9wcy5jaGFuZ2Vsb2cgfX0gLz47XG5cdFx0XHR9LFxuXHRcdFx0JyonIDogPEhvbWVQYWdlXG5cdFx0XHRcdHdlbGNvbWVUZXh0PXt0aGlzLnByb3BzLndlbGNvbWVUZXh0fSAvPixcblx0XHR9KTtcblx0fSxcblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2hvbWVicmV3Jz5cblx0XHRcdDxSb3V0ZXIgZGVmYXVsdFVybD17dGhpcy5wcm9wcy51cmx9Lz5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVicmV3O1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJvcHMpe1xuXHRpZihnbG9iYWwuYWNjb3VudCl7XG5cdFx0cmV0dXJuIDxOYXYuaXRlbSBocmVmPXtgL3VzZXIvJHtnbG9iYWwuYWNjb3VudC51c2VybmFtZX1gfSBjb2xvcj0neWVsbG93JyBpY29uPSdmYS11c2VyJz5cblx0XHRcdHtnbG9iYWwuYWNjb3VudC51c2VybmFtZX1cblx0XHQ8L05hdi5pdGVtPjtcblx0fVxuXHRsZXQgdXJsID0gJyc7XG5cdGlmKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKXtcblx0XHR1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblx0fVxuXHRyZXR1cm4gPE5hdi5pdGVtIGhyZWY9e2BodHRwOi8vdW51c2VkL2xvZ2luP3JlZGlyZWN0PSR7dXJsfWB9IGNvbG9yPSd0ZWFsJyBpY29uPSdmYS1zaWduLWluJz5cblx0XHRsb2dpblxuXHQ8L05hdi5pdGVtPjtcbn07IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJvcHMpe1xuXHRyZXR1cm4gPE5hdi5pdGVtXG5cdFx0bmV3VGFiPXt0cnVlfVxuXHRcdGNvbG9yPSdyZWQnXG5cdFx0aWNvbj0nZmEtYnVnJ1xuXHRcdGhyZWY9e2BodHRwczovL3d3dy5yZWRkaXQuY29tL3IvaG9tZWJyZXdlcnkvc3VibWl0P3NlbGZ0ZXh0PXRydWUmdGl0bGU9JHtlbmNvZGVVUklDb21wb25lbnQoJ1tJc3N1ZV0gRGVzY3JpYmUgWW91ciBJc3N1ZSBIZXJlJyl9YH0gPlxuXHRcdHJlcG9ydCBpc3N1ZVxuXHQ8L05hdi5pdGVtPjtcbn07IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcblxuY29uc3QgTmF2YmFyID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Ly9zaG93Tm9uQ2hyb21lV2FybmluZyA6IGZhbHNlLFxuXHRcdFx0dmVyIDogJzAuMC4wJ1xuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnN0IGlzQ2hyb21lID0gL0Nocm9tZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAvR29vZ2xlIEluYy8udGVzdChuYXZpZ2F0b3IudmVuZG9yKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdC8vc2hvd05vbkNocm9tZVdhcm5pbmcgOiAhaXNDaHJvbWUsXG5cdFx0XHR2ZXIgOiB3aW5kb3cudmVyc2lvblxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qXG5cdHJlbmRlckNocm9tZVdhcm5pbmcgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnN0YXRlLnNob3dOb25DaHJvbWVXYXJuaW5nKSByZXR1cm47XG5cdFx0cmV0dXJuIDxOYXYuaXRlbSBjbGFzc05hbWU9J3dhcm5pbmcnIGljb249J2ZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlJz5cblx0XHRcdE9wdGltaXplZCBmb3IgQ2hyb21lXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZHJvcGRvd24nPlxuXHRcdFx0XHRJZiB5b3UgYXJlIGV4cGVyaWVuY2luZyByZW5kZXJpbmcgaXNzdWVzLCB1c2UgQ2hyb21lIGluc3RlYWRcblx0XHRcdDwvZGl2PlxuXHRcdDwvTmF2Lml0ZW0+XG5cdH0sXG4qL1xuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8TmF2LmJhc2U+XG5cdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdDxOYXYubG9nbyAvPlxuXHRcdFx0XHQ8TmF2Lml0ZW0gaHJlZj0nLycgY2xhc3NOYW1lPSdob21lYnJld0xvZ28nPlxuXHRcdFx0XHRcdDxkaXY+QUdFIEhvbWVicmV3ZXJ5PC9kaXY+XG5cdFx0XHRcdDwvTmF2Lml0ZW0+XG5cdFx0XHRcdDxOYXYuaXRlbT57YHYke3RoaXMuc3RhdGUudmVyfWB9PC9OYXYuaXRlbT5cblxuXHRcdFx0XHR7Lyp0aGlzLnJlbmRlckNocm9tZVdhcm5pbmcoKSovfVxuXHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxuXHRcdDwvTmF2LmJhc2U+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZiYXI7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9wcyl7XG5cdHJldHVybiA8TmF2Lml0ZW1cblx0XHRjbGFzc05hbWU9J3BhdHJlb24nXG5cdFx0bmV3VGFiPXt0cnVlfVxuXHRcdGhyZWY9J2h0dHBzOi8vd3d3LnBhdHJlb24uY29tL3N0b2xrc2RvcmYnXG5cdFx0Y29sb3I9J2dyZWVuJ1xuXHRcdGljb249J2ZhLWhlYXJ0Jz5cblx0XHRoZWxwIG91dFxuXHQ8L05hdi5pdGVtPjtcbn07IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJvcHMpe1xuXHRyZXR1cm4gPE5hdi5pdGVtIG5ld1RhYj17dHJ1ZX0gaHJlZj17YC9wcmludC8ke3Byb3BzLnNoYXJlSWR9P2RpYWxvZz10cnVlYH0gY29sb3I9J3B1cnBsZScgaWNvbj0nZmEtZmlsZS1wZGYtbyc+XG5cdFx0Z2V0IFBERlxuXHQ8L05hdi5pdGVtPjtcbn07IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IE1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuXG5jb25zdCBFRElUX0tFWSA9ICdob21lYnJld2VyeS1yZWNlbnRseS1lZGl0ZWQnO1xuY29uc3QgVklFV19LRVkgPSAnaG9tZWJyZXdlcnktcmVjZW50bHktdmlld2VkJztcblxuXG5jb25zdCBSZWNlbnRJdGVtcyA9IGNyZWF0ZUNsYXNzKHtcblxuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RvcmFnZUtleSA6ICcnLFxuXHRcdFx0c2hvd0VkaXQgICA6IGZhbHNlLFxuXHRcdFx0c2hvd1ZpZXcgICA6IGZhbHNlXG5cdFx0fTtcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2hvd0Ryb3Bkb3duIDogZmFsc2UsXG5cdFx0XHRlZGl0ICAgICAgICAgOiBbXSxcblx0XHRcdHZpZXcgICAgICAgICA6IFtdXG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXG5cdC8vPT0gTG9hZCByZWNlbnQgaXRlbXMgbGlzdCA9PS8vXG5cdFx0bGV0IGVkaXRlZCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oRURJVF9LRVkpIHx8ICdbXScpO1xuXHRcdGxldCB2aWV3ZWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFZJRVdfS0VZKSB8fCAnW10nKTtcblxuXHRcdC8vPT0gQWRkIGN1cnJlbnQgYnJldyB0byBhcHByb3ByaWF0ZSByZWNlbnQgaXRlbXMgbGlzdCAoZGVwZW5kaW5nIG9uIHN0b3JhZ2VLZXkpID09Ly9cblx0XHRpZih0aGlzLnByb3BzLnN0b3JhZ2VLZXkgPT0gJ2VkaXQnKXtcblx0XHRcdGVkaXRlZCA9IF8uZmlsdGVyKGVkaXRlZCwgKGJyZXcpPT57XG5cdFx0XHRcdHJldHVybiBicmV3LmlkICE9PSB0aGlzLnByb3BzLmJyZXcuZWRpdElkO1xuXHRcdFx0fSk7XG5cdFx0XHRlZGl0ZWQudW5zaGlmdCh7XG5cdFx0XHRcdGlkICAgIDogdGhpcy5wcm9wcy5icmV3LmVkaXRJZCxcblx0XHRcdFx0dGl0bGUgOiB0aGlzLnByb3BzLmJyZXcudGl0bGUsXG5cdFx0XHRcdHVybCAgIDogYC9lZGl0LyR7dGhpcy5wcm9wcy5icmV3LmVkaXRJZH1gLFxuXHRcdFx0XHR0cyAgICA6IERhdGUubm93KClcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZih0aGlzLnByb3BzLnN0b3JhZ2VLZXkgPT0gJ3ZpZXcnKXtcblx0XHRcdHZpZXdlZCA9IF8uZmlsdGVyKHZpZXdlZCwgKGJyZXcpPT57XG5cdFx0XHRcdHJldHVybiBicmV3LmlkICE9PSB0aGlzLnByb3BzLmJyZXcuc2hhcmVJZDtcblx0XHRcdH0pO1xuXHRcdFx0dmlld2VkLnVuc2hpZnQoe1xuXHRcdFx0XHRpZCAgICA6IHRoaXMucHJvcHMuYnJldy5zaGFyZUlkLFxuXHRcdFx0XHR0aXRsZSA6IHRoaXMucHJvcHMuYnJldy50aXRsZSxcblx0XHRcdFx0dXJsICAgOiBgL3NoYXJlLyR7dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9YCxcblx0XHRcdFx0dHMgICAgOiBEYXRlLm5vdygpXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLz09IFN0b3JlIHRoZSB1cGRhdGVkIGxpc3RzICh1cCB0byA4IGl0ZW1zIGVhY2gpID09Ly9cblx0XHRlZGl0ZWQgPSBfLnNsaWNlKGVkaXRlZCwgMCwgOCk7XG5cdFx0dmlld2VkID0gXy5zbGljZSh2aWV3ZWQsIDAsIDgpO1xuXG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oRURJVF9LRVksIEpTT04uc3RyaW5naWZ5KGVkaXRlZCkpO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKFZJRVdfS0VZLCBKU09OLnN0cmluZ2lmeSh2aWV3ZWQpKTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0ZWRpdCA6IGVkaXRlZCxcblx0XHRcdHZpZXcgOiB2aWV3ZWRcblx0XHR9KTtcblx0fSxcblxuXHRoYW5kbGVEcm9wZG93biA6IGZ1bmN0aW9uKHNob3cpe1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2hvd0Ryb3Bkb3duIDogc2hvd1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlckRyb3Bkb3duIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5zdGF0ZS5zaG93RHJvcGRvd24pIHJldHVybiBudWxsO1xuXG5cdFx0Y29uc3QgbWFrZUl0ZW1zID0gKGJyZXdzKT0+e1xuXHRcdFx0cmV0dXJuIF8ubWFwKGJyZXdzLCAoYnJldyk9Pntcblx0XHRcdFx0cmV0dXJuIDxhIGhyZWY9e2JyZXcudXJsfSBjbGFzc05hbWU9J2l0ZW0nIGtleT17YnJldy5pZH0gdGFyZ2V0PSdfYmxhbmsnIHJlbD0nbm9vcGVuZXIgbm9yZWZlcnJlcic+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPSd0aXRsZSc+e2JyZXcudGl0bGUgfHwgJ1sgbm8gdGl0bGUgXSd9PC9zcGFuPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT0ndGltZSc+e01vbWVudChicmV3LnRzKS5mcm9tTm93KCl9PC9zcGFuPlxuXHRcdFx0XHQ8L2E+O1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nZHJvcGRvd24nPlxuXHRcdFx0eyh0aGlzLnByb3BzLnNob3dFZGl0ICYmIHRoaXMucHJvcHMuc2hvd1ZpZXcpID9cblx0XHRcdFx0PGg0PmVkaXRlZDwvaDQ+IDogbnVsbCB9XG5cdFx0XHR7dGhpcy5wcm9wcy5zaG93RWRpdCA/XG5cdFx0XHRcdG1ha2VJdGVtcyh0aGlzLnN0YXRlLmVkaXQpIDogbnVsbCB9XG5cdFx0XHR7KHRoaXMucHJvcHMuc2hvd0VkaXQgJiYgdGhpcy5wcm9wcy5zaG93VmlldykgP1xuXHRcdFx0XHQ8aDQ+dmlld2VkPC9oND5cdDogbnVsbCB9XG5cdFx0XHR7dGhpcy5wcm9wcy5zaG93VmlldyA/XG5cdFx0XHRcdG1ha2VJdGVtcyh0aGlzLnN0YXRlLnZpZXcpIDogbnVsbCB9XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxOYXYuaXRlbSBpY29uPSdmYS1jbG9jay1vJyBjb2xvcj0nZ3JleScgY2xhc3NOYW1lPSdyZWNlbnQnXG5cdFx0XHRvbk1vdXNlRW50ZXI9eygpPT50aGlzLmhhbmRsZURyb3Bkb3duKHRydWUpfVxuXHRcdFx0b25Nb3VzZUxlYXZlPXsoKT0+dGhpcy5oYW5kbGVEcm9wZG93bihmYWxzZSl9PlxuXHRcdFx0e3RoaXMucHJvcHMudGV4dH1cblx0XHRcdHt0aGlzLnJlbmRlckRyb3Bkb3duKCl9XG5cdFx0PC9OYXYuaXRlbT47XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG5cdGVkaXRlZCA6IChwcm9wcyk9Pntcblx0XHRyZXR1cm4gPFJlY2VudEl0ZW1zXG5cdFx0XHRicmV3PXtwcm9wcy5icmV3fVxuXHRcdFx0c3RvcmFnZUtleT17cHJvcHMuc3RvcmFnZUtleX1cblx0XHRcdHRleHQ9J3JlY2VudGx5IGVkaXRlZCdcblx0XHRcdHNob3dFZGl0PXt0cnVlfVxuXHRcdC8+O1xuXHR9LFxuXG5cdHZpZXdlZCA6IChwcm9wcyk9Pntcblx0XHRyZXR1cm4gPFJlY2VudEl0ZW1zXG5cdFx0XHRicmV3PXtwcm9wcy5icmV3fVxuXHRcdFx0c3RvcmFnZUtleT17cHJvcHMuc3RvcmFnZUtleX1cblx0XHRcdHRleHQ9J3JlY2VudGx5IHZpZXdlZCdcblx0XHRcdHNob3dWaWV3PXt0cnVlfVxuXHRcdC8+O1xuXHR9LFxuXG5cdGJvdGggOiAocHJvcHMpPT57XG5cdFx0cmV0dXJuIDxSZWNlbnRJdGVtc1xuXHRcdFx0YnJldz17cHJvcHMuYnJld31cblx0XHRcdHN0b3JhZ2VLZXk9e3Byb3BzLnN0b3JhZ2VLZXl9XG5cdFx0XHR0ZXh0PSdyZWNlbnQgYnJld3MnXG5cdFx0XHRzaG93RWRpdD17dHJ1ZX1cblx0XHRcdHNob3dWaWV3PXt0cnVlfVxuXHRcdC8+O1xuXHR9XG59OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5jb25zdCBOYXZiYXIgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvbmF2YmFyLmpzeCcpO1xuXG5jb25zdCBSZXBvcnRJc3N1ZSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUHJpbnRMaW5rID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3ByaW50Lm5hdml0ZW0uanN4Jyk7XG5jb25zdCBBY2NvdW50ID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2FjY291bnQubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFJlY2VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcmVjZW50Lm5hdml0ZW0uanN4JykuYm90aDtcblxuY29uc3QgU3BsaXRQYW5lID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvc3BsaXRQYW5lL3NwbGl0UGFuZS5qc3gnKTtcbmNvbnN0IEVkaXRvciA9IHJlcXVpcmUoJy4uLy4uL2VkaXRvci9lZGl0b3IuanN4Jyk7XG5jb25zdCBCcmV3UmVuZGVyZXIgPSByZXF1aXJlKCcuLi8uLi9icmV3UmVuZGVyZXIvYnJld1JlbmRlcmVyLmpzeCcpO1xuXG5jb25zdCBNYXJrZG93biA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L21hcmtkb3duLmpzJyk7XG5cbmNvbnN0IFNBVkVfVElNRU9VVCA9IDMwMDA7XG5cblxuY29uc3QgRWRpdFBhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3IDoge1xuXHRcdFx0XHR0ZXh0ICAgICAgOiAnJyxcblx0XHRcdFx0c2hhcmVJZCAgIDogbnVsbCxcblx0XHRcdFx0ZWRpdElkICAgIDogbnVsbCxcblx0XHRcdFx0Y3JlYXRlZEF0IDogbnVsbCxcblx0XHRcdFx0dXBkYXRlZEF0IDogbnVsbCxcblxuXHRcdFx0XHR0aXRsZSAgICAgICA6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbiA6ICcnLFxuXHRcdFx0XHR0YWdzICAgICAgICA6ICcnLFxuXHRcdFx0XHRwdWJsaXNoZWQgICA6IGZhbHNlLFxuXHRcdFx0XHRhdXRob3JzICAgICA6IFtdLFxuXHRcdFx0XHRzeXN0ZW1zICAgICA6IFtdXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyA6IHRoaXMucHJvcHMuYnJldyxcblxuXHRcdFx0aXNTYXZpbmcgICA6IGZhbHNlLFxuXHRcdFx0aXNQZW5kaW5nICA6IGZhbHNlLFxuXHRcdFx0ZXJyb3JzICAgICA6IG51bGwsXG5cdFx0XHRodG1sRXJyb3JzIDogTWFya2Rvd24udmFsaWRhdGUodGhpcy5wcm9wcy5icmV3LnRleHQpLFxuXHRcdH07XG5cdH0sXG5cdHNhdmVkQnJldyA6IG51bGwsXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMudHJ5U2F2ZSgpO1xuXHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9ICgpPT57XG5cdFx0XHRpZih0aGlzLnN0YXRlLmlzU2F2aW5nIHx8IHRoaXMuc3RhdGUuaXNQZW5kaW5nKXtcblx0XHRcdFx0cmV0dXJuICdZb3UgaGF2ZSB1bnNhdmVkIGNoYW5nZXMhJztcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSgocHJldlN0YXRlKT0+KHtcblx0XHRcdGh0bWxFcnJvcnMgOiBNYXJrZG93bi52YWxpZGF0ZShwcmV2U3RhdGUuYnJldy50ZXh0KVxuXHRcdH0pKTtcblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUNvbnRyb2xLZXlzKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbigpe307XG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlQ29udHJvbEtleXMpO1xuXHR9LFxuXG5cblx0aGFuZGxlQ29udHJvbEtleXMgOiBmdW5jdGlvbihlKXtcblx0XHRpZighKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKSByZXR1cm47XG5cdFx0Y29uc3QgU19LRVkgPSA4Mztcblx0XHRjb25zdCBQX0tFWSA9IDgwO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBTX0tFWSkgdGhpcy5zYXZlKCk7XG5cdFx0aWYoZS5rZXlDb2RlID09IFBfS0VZKSB3aW5kb3cub3BlbihgL3ByaW50LyR7dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9P2RpYWxvZz10cnVlYCwgJ19ibGFuaycpLmZvY3VzKCk7XG5cdFx0aWYoZS5rZXlDb2RlID09IFBfS0VZIHx8IGUua2V5Q29kZSA9PSBTX0tFWSl7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblxuXHRoYW5kbGVTcGxpdE1vdmUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMucmVmcy5lZGl0b3IudXBkYXRlKCk7XG5cdH0sXG5cblx0aGFuZGxlTWV0YWRhdGFDaGFuZ2UgOiBmdW5jdGlvbihtZXRhZGF0YSl7XG5cdFx0dGhpcy5zZXRTdGF0ZSgocHJldlN0YXRlKT0+KHtcblx0XHRcdGJyZXcgICAgICA6IF8ubWVyZ2Uoe30sIHByZXZTdGF0ZS5icmV3LCBtZXRhZGF0YSksXG5cdFx0XHRpc1BlbmRpbmcgOiB0cnVlLFxuXHRcdH0pLCAoKT0+dGhpcy50cnlTYXZlKCkpO1xuXG5cdH0sXG5cblx0aGFuZGxlVGV4dENoYW5nZSA6IGZ1bmN0aW9uKHRleHQpe1xuXG5cdFx0Ly9JZiB0aGVyZSBhcmUgZXJyb3JzLCBydW4gdGhlIHZhbGlkYXRvciBvbiBldmVyeWNoYW5nZSB0byBnaXZlIHF1aWNrIGZlZWRiYWNrXG5cdFx0bGV0IGh0bWxFcnJvcnMgPSB0aGlzLnN0YXRlLmh0bWxFcnJvcnM7XG5cdFx0aWYoaHRtbEVycm9ycy5sZW5ndGgpIGh0bWxFcnJvcnMgPSBNYXJrZG93bi52YWxpZGF0ZSh0ZXh0KTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoKHByZXZTdGF0ZSk9Pih7XG5cdFx0XHRicmV3ICAgICAgIDogXy5tZXJnZSh7fSwgcHJldlN0YXRlLmJyZXcsIHsgdGV4dDogdGV4dCB9KSxcblx0XHRcdGlzUGVuZGluZyAgOiB0cnVlLFxuXHRcdFx0aHRtbEVycm9ycyA6IGh0bWxFcnJvcnNcblx0XHR9KSwgKCk9PnRoaXMudHJ5U2F2ZSgpKTtcblx0fSxcblxuXHRoYXNDaGFuZ2VzIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBzYXZlZEJyZXcgPSB0aGlzLnNhdmVkQnJldyA/IHRoaXMuc2F2ZWRCcmV3IDogdGhpcy5wcm9wcy5icmV3O1xuXHRcdHJldHVybiAhXy5pc0VxdWFsKHRoaXMuc3RhdGUuYnJldywgc2F2ZWRCcmV3KTtcblx0fSxcblxuXHR0cnlTYXZlIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5kZWJvdW5jZVNhdmUpIHRoaXMuZGVib3VuY2VTYXZlID0gXy5kZWJvdW5jZSh0aGlzLnNhdmUsIFNBVkVfVElNRU9VVCk7XG5cdFx0aWYodGhpcy5oYXNDaGFuZ2VzKCkpe1xuXHRcdFx0dGhpcy5kZWJvdW5jZVNhdmUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5kZWJvdW5jZVNhdmUuY2FuY2VsKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHNhdmUgOiBmdW5jdGlvbigpe1xuXHRcdGlmKHRoaXMuZGVib3VuY2VTYXZlICYmIHRoaXMuZGVib3VuY2VTYXZlLmNhbmNlbCkgdGhpcy5kZWJvdW5jZVNhdmUuY2FuY2VsKCk7XG5cblx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUpPT4oe1xuXHRcdFx0aXNTYXZpbmcgICA6IHRydWUsXG5cdFx0XHRlcnJvcnMgICAgIDogbnVsbCxcblx0XHRcdGh0bWxFcnJvcnMgOiBNYXJrZG93bi52YWxpZGF0ZShwcmV2U3RhdGUuYnJldy50ZXh0KVxuXHRcdH0pKTtcblxuXHRcdHJlcXVlc3Rcblx0XHRcdC5wdXQoYC9hcGkvdXBkYXRlLyR7dGhpcy5wcm9wcy5icmV3LmVkaXRJZH1gKVxuXHRcdFx0LnNlbmQodGhpcy5zdGF0ZS5icmV3KVxuXHRcdFx0LmVuZCgoZXJyLCByZXMpPT57XG5cdFx0XHRcdGlmKGVycil7XG5cdFx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdFx0XHRlcnJvcnMgOiBlcnIsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5zYXZlZEJyZXcgPSByZXMuYm9keTtcblx0XHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0XHRcdGlzUGVuZGluZyA6IGZhbHNlLFxuXHRcdFx0XHRcdFx0aXNTYXZpbmcgIDogZmFsc2UsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlclNhdmVCdXR0b24gOiBmdW5jdGlvbigpe1xuXHRcdGlmKHRoaXMuc3RhdGUuZXJyb3JzKXtcblx0XHRcdGxldCBlcnJNc2cgPSAnJztcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGVyck1zZyArPSBgJHt0aGlzLnN0YXRlLmVycm9ycy50b1N0cmluZygpfVxcblxcbmA7XG5cdFx0XHRcdGVyck1zZyArPSBgXFxgXFxgXFxgXFxuJHtKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLmVycm9ycy5yZXNwb25zZS5lcnJvciwgbnVsbCwgJyAgJyl9XFxuXFxgXFxgXFxgYDtcblx0XHRcdH0gY2F0Y2ggKGUpe31cblxuXHRcdFx0cmV0dXJuIDxOYXYuaXRlbSBjbGFzc05hbWU9J3NhdmUgZXJyb3InIGljb249J2ZhLXdhcm5pbmcnPlxuXHRcdFx0XHRPb3BzIVxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZXJyb3JDb250YWluZXInPlxuXHRcdFx0XHRcdExvb2tzIGxpa2UgdGhlcmUgd2FzIGEgcHJvYmxlbSBzYXZpbmcuIDxiciAvPlxuXHRcdFx0XHRcdFJlcG9ydCB0aGUgaXNzdWUgPGEgdGFyZ2V0PSdfYmxhbmsnIHJlbD0nbm9vcGVuZXIgbm9yZWZlcnJlcidcblx0XHRcdFx0XHRcdGhyZWY9e2BodHRwczovL2dpdGh1Yi5jb20vc3RvbGtzZG9yZi9uYXR1cmFsY3JpdC9pc3N1ZXMvbmV3P2JvZHk9JHtlbmNvZGVVUklDb21wb25lbnQoZXJyTXNnKX1gfT5cblx0XHRcdFx0XHRcdGhlcmVcblx0XHRcdFx0XHQ8L2E+LlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvTmF2Lml0ZW0+O1xuXHRcdH1cblxuXHRcdGlmKHRoaXMuc3RhdGUuaXNTYXZpbmcpe1xuXHRcdFx0cmV0dXJuIDxOYXYuaXRlbSBjbGFzc05hbWU9J3NhdmUnIGljb249J2ZhLXNwaW5uZXIgZmEtc3Bpbic+c2F2aW5nLi4uPC9OYXYuaXRlbT47XG5cdFx0fVxuXHRcdGlmKHRoaXMuc3RhdGUuaXNQZW5kaW5nICYmIHRoaXMuaGFzQ2hhbmdlcygpKXtcblx0XHRcdHJldHVybiA8TmF2Lml0ZW0gY2xhc3NOYW1lPSdzYXZlJyBvbkNsaWNrPXt0aGlzLnNhdmV9IGNvbG9yPSdibHVlJyBpY29uPSdmYS1zYXZlJz5TYXZlIE5vdzwvTmF2Lml0ZW0+O1xuXHRcdH1cblx0XHRpZighdGhpcy5zdGF0ZS5pc1BlbmRpbmcgJiYgIXRoaXMuc3RhdGUuaXNTYXZpbmcpe1xuXHRcdFx0cmV0dXJuIDxOYXYuaXRlbSBjbGFzc05hbWU9J3NhdmUgc2F2ZWQnPnNhdmVkLjwvTmF2Lml0ZW0+O1xuXHRcdH1cblx0fSxcblx0cmVuZGVyTmF2YmFyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPE5hdmJhcj5cblx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0PE5hdi5pdGVtIGNsYXNzTmFtZT0nYnJld1RpdGxlJz57dGhpcy5zdGF0ZS5icmV3LnRpdGxlfTwvTmF2Lml0ZW0+XG5cdFx0XHQ8L05hdi5zZWN0aW9uPlxuXG5cdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdHt0aGlzLnJlbmRlclNhdmVCdXR0b24oKX1cblx0XHRcdFx0PFJlcG9ydElzc3VlIC8+XG5cdFx0XHRcdDxOYXYuaXRlbSBuZXdUYWI9e3RydWV9IGhyZWY9e2Avc2hhcmUvJHt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH1gfSBjb2xvcj0ndGVhbCcgaWNvbj0nZmEtc2hhcmUtYWx0Jz5cblx0XHRcdFx0XHRTaGFyZVxuXHRcdFx0XHQ8L05hdi5pdGVtPlxuXHRcdFx0XHQ8UHJpbnRMaW5rIHNoYXJlSWQ9e3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfSAvPlxuXHRcdFx0XHQ8UmVjZW50TmF2SXRlbSBicmV3PXt0aGlzLnByb3BzLmJyZXd9IHN0b3JhZ2VLZXk9J2VkaXQnIC8+XG5cdFx0XHRcdDxBY2NvdW50IC8+XG5cdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdDwvTmF2YmFyPjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nZWRpdFBhZ2UgcGFnZSc+XG5cdFx0XHR7dGhpcy5yZW5kZXJOYXZiYXIoKX1cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRlbnQnPlxuXHRcdFx0XHQ8U3BsaXRQYW5lIG9uRHJhZ0ZpbmlzaD17dGhpcy5oYW5kbGVTcGxpdE1vdmV9IHJlZj0ncGFuZSc+XG5cdFx0XHRcdFx0PEVkaXRvclxuXHRcdFx0XHRcdFx0cmVmPSdlZGl0b3InXG5cdFx0XHRcdFx0XHR2YWx1ZT17dGhpcy5zdGF0ZS5icmV3LnRleHR9XG5cdFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5oYW5kbGVUZXh0Q2hhbmdlfVxuXHRcdFx0XHRcdFx0bWV0YWRhdGE9e3RoaXMuc3RhdGUuYnJld31cblx0XHRcdFx0XHRcdG9uTWV0YWRhdGFDaGFuZ2U9e3RoaXMuaGFuZGxlTWV0YWRhdGFDaGFuZ2V9XG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHQ8QnJld1JlbmRlcmVyIHRleHQ9e3RoaXMuc3RhdGUuYnJldy50ZXh0fSBlcnJvcnM9e3RoaXMuc3RhdGUuaHRtbEVycm9yc30gLz5cblx0XHRcdFx0PC9TcGxpdFBhbmU+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRQYWdlO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuY29uc3QgTmF2YmFyID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL25hdmJhci5qc3gnKTtcbmNvbnN0IFBhdHJlb25OYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3BhdHJlb24ubmF2aXRlbS5qc3gnKTtcbmNvbnN0IElzc3VlTmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUmVjZW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9yZWNlbnQubmF2aXRlbS5qc3gnKS5ib3RoO1xuXG5jb25zdCBCcmV3UmVuZGVyZXIgPSByZXF1aXJlKCcuLi8uLi9icmV3UmVuZGVyZXIvYnJld1JlbmRlcmVyLmpzeCcpO1xuXG5jb25zdCBFcnJvclBhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR2ZXIgICAgIDogJzAuMC4wJyxcblx0XHRcdGVycm9ySWQgOiAnJ1xuXHRcdH07XG5cdH0sXG5cblx0dGV4dCA6ICcjIE9vcHMgXFxuIFdlIGNvdWxkIG5vdCBmaW5kIGEgYnJldyB3aXRoIHRoYXQgaWQuICoqU29ycnkhKionLFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdlcnJvclBhZ2UgcGFnZSc+XG5cdFx0XHQ8TmF2YmFyIHZlcj17dGhpcy5wcm9wcy52ZXJ9PlxuXHRcdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdFx0PE5hdi5pdGVtIGNsYXNzTmFtZT0nZXJyb3JUaXRsZSc+XG5cdFx0XHRcdFx0XHRDcml0IEZhaWwhXG5cdFx0XHRcdFx0PC9OYXYuaXRlbT5cblx0XHRcdFx0PC9OYXYuc2VjdGlvbj5cblxuXHRcdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdFx0PFBhdHJlb25OYXZJdGVtIC8+XG5cdFx0XHRcdFx0PElzc3VlTmF2SXRlbSAvPlxuXHRcdFx0XHRcdDxSZWNlbnROYXZJdGVtIC8+XG5cdFx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0XHQ8L05hdmJhcj5cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRlbnQnPlxuXHRcdFx0XHQ8QnJld1JlbmRlcmVyIHRleHQ9e3RoaXMudGV4dH0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXJyb3JQYWdlO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcbmNvbnN0IE5hdmJhciA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9uYXZiYXIuanN4Jyk7XG5jb25zdCBQYXRyZW9uTmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9wYXRyZW9uLm5hdml0ZW0uanN4Jyk7XG5jb25zdCBJc3N1ZU5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvaXNzdWUubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFJlY2VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcmVjZW50Lm5hdml0ZW0uanN4JykuYm90aDtcbmNvbnN0IEFjY291bnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2FjY291bnQubmF2aXRlbS5qc3gnKTtcblxuXG5jb25zdCBTcGxpdFBhbmUgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9zcGxpdFBhbmUvc3BsaXRQYW5lLmpzeCcpO1xuY29uc3QgRWRpdG9yID0gcmVxdWlyZSgnLi4vLi4vZWRpdG9yL2VkaXRvci5qc3gnKTtcbmNvbnN0IEJyZXdSZW5kZXJlciA9IHJlcXVpcmUoJy4uLy4uL2JyZXdSZW5kZXJlci9icmV3UmVuZGVyZXIuanN4Jyk7XG5cblxuXG5jb25zdCBIb21lUGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHdlbGNvbWVUZXh0IDogJycsXG5cdFx0XHR2ZXIgICAgICAgICA6ICcwLjAuMCdcblx0XHR9O1xuXG5cblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRleHQgOiB0aGlzLnByb3BzLndlbGNvbWVUZXh0XG5cdFx0fTtcblx0fSxcblx0aGFuZGxlU2F2ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0cmVxdWVzdC5wb3N0KCcvYXBpJylcblx0XHRcdC5zZW5kKHtcblx0XHRcdFx0dGV4dCA6IHRoaXMuc3RhdGUudGV4dFxuXHRcdFx0fSlcblx0XHRcdC5lbmQoKGVyciwgcmVzKT0+e1xuXHRcdFx0XHRpZihlcnIpIHJldHVybiBlcnJcblx0XHRcdFx0Y29uc3QgYnJldyA9IHJlcy5ib2R5O1xuXHRcdFx0XHR3aW5kb3cubG9jYXRpb24gPSBgL2VkaXQvJHticmV3LmVkaXRJZH1gO1xuXHRcdFx0fSk7XG5cdH0sXG5cdGhhbmRsZVNwbGl0TW92ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5yZWZzLmVkaXRvci51cGRhdGUoKTtcblx0fSxcblx0aGFuZGxlVGV4dENoYW5nZSA6IGZ1bmN0aW9uKHRleHQpe1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0dGV4dCA6IHRleHRcblx0XHR9KTtcblx0fSxcblx0cmVuZGVyTmF2YmFyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPE5hdmJhciB2ZXI9e3RoaXMucHJvcHMudmVyfT5cblx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0PFBhdHJlb25OYXZJdGVtIC8+XG5cdFx0XHRcdDxJc3N1ZU5hdkl0ZW0gLz5cblx0XHRcdFx0PE5hdi5pdGVtIG5ld1RhYj17dHJ1ZX0gaHJlZj0nL2NoYW5nZWxvZycgY29sb3I9J3B1cnBsZScgaWNvbj0nZmEtZmlsZS10ZXh0LW8nPlxuXHRcdFx0XHRcdENoYW5nZWxvZ1xuXHRcdFx0XHQ8L05hdi5pdGVtPlxuXHRcdFx0XHQ8UmVjZW50TmF2SXRlbSAvPlxuXHRcdFx0XHQ8QWNjb3VudE5hdkl0ZW0gLz5cblx0XHRcdFx0ey8qfVxuXHRcdFx0XHQ8TmF2Lml0ZW0gaHJlZj0nL25ldycgY29sb3I9J2dyZWVuJyBpY29uPSdmYS1leHRlcm5hbC1saW5rJz5cblx0XHRcdFx0XHROZXcgQnJld1xuXHRcdFx0XHQ8L05hdi5pdGVtPlxuXHRcdFx0XHQqL31cblx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0PC9OYXZiYXI+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdob21lUGFnZSBwYWdlJz5cblx0XHRcdHt0aGlzLnJlbmRlck5hdmJhcigpfVxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGVudCc+XG5cdFx0XHRcdDxTcGxpdFBhbmUgb25EcmFnRmluaXNoPXt0aGlzLmhhbmRsZVNwbGl0TW92ZX0gcmVmPSdwYW5lJz5cblx0XHRcdFx0XHQ8RWRpdG9yIHZhbHVlPXt0aGlzLnN0YXRlLnRleHR9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZVRleHRDaGFuZ2V9IHJlZj0nZWRpdG9yJy8+XG5cdFx0XHRcdFx0PEJyZXdSZW5kZXJlciB0ZXh0PXt0aGlzLnN0YXRlLnRleHR9IC8+XG5cdFx0XHRcdDwvU3BsaXRQYW5lPlxuXHRcdFx0PC9kaXY+XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjeCgnZmxvYXRpbmdTYXZlQnV0dG9uJywgeyBzaG93OiB0aGlzLnByb3BzLndlbGNvbWVUZXh0ICE9IHRoaXMuc3RhdGUudGV4dCB9KX0gb25DbGljaz17dGhpcy5oYW5kbGVTYXZlfT5cblx0XHRcdFx0U2F2ZSBjdXJyZW50IDxpIGNsYXNzTmFtZT0nZmEgZmEtc2F2ZScgLz5cblx0XHRcdDwvZGl2PlxuXG5cdFx0XHQ8YSBocmVmPScvbmV3JyBjbGFzc05hbWU9J2Zsb2F0aW5nTmV3QnV0dG9uJz5cblx0XHRcdFx0Q3JlYXRlIHlvdXIgb3duIDxpIGNsYXNzTmFtZT0nZmEgZmEtbWFnaWMnIC8+XG5cdFx0XHQ8L2E+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIb21lUGFnZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbmNvbnN0IE1hcmtkb3duID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbWFya2Rvd24uanMnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcbmNvbnN0IE5hdmJhciA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9uYXZiYXIuanN4Jyk7XG5jb25zdCBBY2NvdW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4Jyk7XG5jb25zdCBSZWNlbnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCcpLmJvdGg7XG5jb25zdCBJc3N1ZU5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvaXNzdWUubmF2aXRlbS5qc3gnKTtcblxuY29uc3QgU3BsaXRQYW5lID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvc3BsaXRQYW5lL3NwbGl0UGFuZS5qc3gnKTtcbmNvbnN0IEVkaXRvciA9IHJlcXVpcmUoJy4uLy4uL2VkaXRvci9lZGl0b3IuanN4Jyk7XG5jb25zdCBCcmV3UmVuZGVyZXIgPSByZXF1aXJlKCcuLi8uLi9icmV3UmVuZGVyZXIvYnJld1JlbmRlcmVyLmpzeCcpO1xuXG5cbmNvbnN0IEtFWSA9ICdob21lYnJld2VyeS1uZXcnO1xuXG5jb25zdCBOZXdQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bWV0YWRhdGEgOiB7XG5cdFx0XHRcdHRpdGxlICAgICAgIDogJycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uIDogJycsXG5cdFx0XHRcdHRhZ3MgICAgICAgIDogJycsXG5cdFx0XHRcdHB1Ymxpc2hlZCAgIDogZmFsc2UsXG5cdFx0XHRcdGF1dGhvcnMgICAgIDogW10sXG5cdFx0XHRcdHN5c3RlbXMgICAgIDogW11cblx0XHRcdH0sXG5cblx0XHRcdHRleHQgICAgIDogJycsXG5cdFx0XHRpc1NhdmluZyA6IGZhbHNlLFxuXHRcdFx0ZXJyb3JzICAgOiBbXVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3Qgc3RvcmFnZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKEtFWSk7XG5cdFx0aWYoc3RvcmFnZSl7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0dGV4dCA6IHN0b3JhZ2Vcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVDb250cm9sS2V5cyk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlQ29udHJvbEtleXMpO1xuXHR9LFxuXG5cdGhhbmRsZUNvbnRyb2xLZXlzIDogZnVuY3Rpb24oZSl7XG5cdFx0aWYoIShlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSkgcmV0dXJuO1xuXHRcdGNvbnN0IFNfS0VZID0gODM7XG5cdFx0Y29uc3QgUF9LRVkgPSA4MDtcblx0XHRpZihlLmtleUNvZGUgPT0gU19LRVkpIHRoaXMuc2F2ZSgpO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBQX0tFWSkgdGhpcy5wcmludCgpO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBQX0tFWSB8fCBlLmtleUNvZGUgPT0gU19LRVkpe1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH0sXG5cblx0aGFuZGxlU3BsaXRNb3ZlIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnJlZnMuZWRpdG9yLnVwZGF0ZSgpO1xuXHR9LFxuXG5cdGhhbmRsZU1ldGFkYXRhQ2hhbmdlIDogZnVuY3Rpb24obWV0YWRhdGEpe1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0bWV0YWRhdGEgOiBfLm1lcmdlKHt9LCB0aGlzLnN0YXRlLm1ldGFkYXRhLCBtZXRhZGF0YSlcblx0XHR9KTtcblx0fSxcblxuXHRoYW5kbGVUZXh0Q2hhbmdlIDogZnVuY3Rpb24odGV4dCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHR0ZXh0ICAgOiB0ZXh0LFxuXHRcdFx0ZXJyb3JzIDogTWFya2Rvd24udmFsaWRhdGUodGV4dClcblx0XHR9KTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShLRVksIHRleHQpO1xuXHR9LFxuXG5cdHNhdmUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0aXNTYXZpbmcgOiB0cnVlXG5cdFx0fSk7XG5cblx0XHRyZXF1ZXN0LnBvc3QoJy9hcGknKVxuXHRcdFx0LnNlbmQoXy5tZXJnZSh7fSwgdGhpcy5zdGF0ZS5tZXRhZGF0YSwge1xuXHRcdFx0XHR0ZXh0IDogdGhpcy5zdGF0ZS50ZXh0XG5cdFx0XHR9KSlcblx0XHRcdC5lbmQoKGVyciwgcmVzKT0+e1xuXHRcdFx0XHRpZihlcnIpe1xuXHRcdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdFx0aXNTYXZpbmcgOiBmYWxzZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbigpe307XG5cdFx0XHRcdGNvbnN0IGJyZXcgPSByZXMuYm9keTtcblx0XHRcdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oS0VZKTtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uID0gYC9lZGl0LyR7YnJldy5lZGl0SWR9YDtcblx0XHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlclNhdmVCdXR0b24gOiBmdW5jdGlvbigpe1xuXHRcdGlmKHRoaXMuc3RhdGUuaXNTYXZpbmcpe1xuXHRcdFx0cmV0dXJuIDxOYXYuaXRlbSBpY29uPSdmYS1zcGlubmVyIGZhLXNwaW4nIGNsYXNzTmFtZT0nc2F2ZUJ1dHRvbic+XG5cdFx0XHRcdHNhdmUuLi5cblx0XHRcdDwvTmF2Lml0ZW0+O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gPE5hdi5pdGVtIGljb249J2ZhLXNhdmUnIGNsYXNzTmFtZT0nc2F2ZUJ1dHRvbicgb25DbGljaz17dGhpcy5zYXZlfT5cblx0XHRcdFx0c2F2ZVxuXHRcdFx0PC9OYXYuaXRlbT47XG5cdFx0fVxuXHR9LFxuXG5cdHByaW50IDogZnVuY3Rpb24oKXtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncHJpbnQnLCB0aGlzLnN0YXRlLnRleHQpO1xuXHRcdHdpbmRvdy5vcGVuKCcvcHJpbnQ/ZGlhbG9nPXRydWUmbG9jYWw9cHJpbnQnLCAnX2JsYW5rJyk7XG5cdH0sXG5cblx0cmVuZGVyTG9jYWxQcmludEJ1dHRvbiA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxOYXYuaXRlbSBjb2xvcj0ncHVycGxlJyBpY29uPSdmYS1maWxlLXBkZi1vJyBvbkNsaWNrPXt0aGlzLnByaW50fT5cblx0XHRcdGdldCBQREZcblx0XHQ8L05hdi5pdGVtPjtcblx0fSxcblxuXHRyZW5kZXJOYXZiYXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8TmF2YmFyPlxuXG5cdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdDxOYXYuaXRlbSBjbGFzc05hbWU9J2JyZXdUaXRsZSc+e3RoaXMuc3RhdGUubWV0YWRhdGEudGl0bGV9PC9OYXYuaXRlbT5cblx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cblx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0e3RoaXMucmVuZGVyU2F2ZUJ1dHRvbigpfVxuXHRcdFx0XHR7dGhpcy5yZW5kZXJMb2NhbFByaW50QnV0dG9uKCl9XG5cdFx0XHRcdDxJc3N1ZU5hdkl0ZW0gLz5cblx0XHRcdFx0PFJlY2VudE5hdkl0ZW0gLz5cblx0XHRcdFx0PEFjY291bnROYXZJdGVtIC8+XG5cdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdDwvTmF2YmFyPjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nbmV3UGFnZSBwYWdlJz5cblx0XHRcdHt0aGlzLnJlbmRlck5hdmJhcigpfVxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRlbnQnPlxuXHRcdFx0XHQ8U3BsaXRQYW5lIG9uRHJhZ0ZpbmlzaD17dGhpcy5oYW5kbGVTcGxpdE1vdmV9IHJlZj0ncGFuZSc+XG5cdFx0XHRcdFx0PEVkaXRvclxuXHRcdFx0XHRcdFx0cmVmPSdlZGl0b3InXG5cdFx0XHRcdFx0XHR2YWx1ZT17dGhpcy5zdGF0ZS50ZXh0fVxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuaGFuZGxlVGV4dENoYW5nZX1cblx0XHRcdFx0XHRcdG1ldGFkYXRhPXt0aGlzLnN0YXRlLm1ldGFkYXRhfVxuXHRcdFx0XHRcdFx0b25NZXRhZGF0YUNoYW5nZT17dGhpcy5oYW5kbGVNZXRhZGF0YUNoYW5nZX1cblx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdDxCcmV3UmVuZGVyZXIgdGV4dD17dGhpcy5zdGF0ZS50ZXh0fSBlcnJvcnM9e3RoaXMuc3RhdGUuZXJyb3JzfSAvPlxuXHRcdFx0XHQ8L1NwbGl0UGFuZT5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmV3UGFnZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5jb25zdCBNYXJrZG93biA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L21hcmtkb3duLmpzJyk7XG5cbmNvbnN0IFByaW50UGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHF1ZXJ5IDoge30sXG5cdFx0XHRicmV3ICA6IHtcblx0XHRcdFx0dGV4dCA6ICcnLFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJyZXdUZXh0IDogdGhpcy5wcm9wcy5icmV3LnRleHRcblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5wcm9wcy5xdWVyeS5sb2NhbCl7XG5cdFx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUsIHByZXZQcm9wcyk9Pih7XG5cdFx0XHRcdGJyZXdUZXh0IDogbG9jYWxTdG9yYWdlLmdldEl0ZW0ocHJldlByb3BzLnF1ZXJ5LmxvY2FsKVxuXHRcdFx0fSkpO1xuXHRcdH1cblxuXHRcdGlmKHRoaXMucHJvcHMucXVlcnkuZGlhbG9nKSB3aW5kb3cucHJpbnQoKTtcblx0fSxcblxuXHRyZW5kZXJQYWdlcyA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIF8ubWFwKHRoaXMuc3RhdGUuYnJld1RleHQuc3BsaXQoJ1xcXFxwYWdlJyksIChwYWdlLCBpbmRleCk9Pntcblx0XHRcdHJldHVybiA8ZGl2XG5cdFx0XHRcdGNsYXNzTmFtZT0nYWdlJ1xuXHRcdFx0XHRpZD17YHAke2luZGV4ICsgMX1gfVxuXHRcdFx0XHRkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IE1hcmtkb3duLnJlbmRlcihwYWdlKSB9fVxuXHRcdFx0XHRrZXk9e2luZGV4fSAvPjtcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2PlxuXHRcdFx0e3RoaXMucmVuZGVyUGFnZXMoKX1cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByaW50UGFnZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcbmNvbnN0IE5hdmJhciA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9uYXZiYXIuanN4Jyk7XG5jb25zdCBQcmludExpbmsgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcHJpbnQubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFJlcG9ydElzc3VlID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2lzc3VlLm5hdml0ZW0uanN4Jyk7XG5jb25zdCBSZWNlbnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCcpLmJvdGg7XG5jb25zdCBBY2NvdW50ID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2FjY291bnQubmF2aXRlbS5qc3gnKTtcblxuXG5jb25zdCBCcmV3UmVuZGVyZXIgPSByZXF1aXJlKCcuLi8uLi9icmV3UmVuZGVyZXIvYnJld1JlbmRlcmVyLmpzeCcpO1xuXG5cbmNvbnN0IFNoYXJlUGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJyZXcgOiB7XG5cdFx0XHRcdHRpdGxlICAgICA6ICcnLFxuXHRcdFx0XHR0ZXh0ICAgICAgOiAnJyxcblx0XHRcdFx0c2hhcmVJZCAgIDogbnVsbCxcblx0XHRcdFx0Y3JlYXRlZEF0IDogbnVsbCxcblx0XHRcdFx0dXBkYXRlZEF0IDogbnVsbCxcblx0XHRcdFx0dmlld3MgICAgIDogMFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVDb250cm9sS2V5cyk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlQ29udHJvbEtleXMpO1xuXHR9LFxuXHRoYW5kbGVDb250cm9sS2V5cyA6IGZ1bmN0aW9uKGUpe1xuXHRcdGlmKCEoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpIHJldHVybjtcblx0XHRjb25zdCBQX0tFWSA9IDgwO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBQX0tFWSl7XG5cdFx0XHR3aW5kb3cub3BlbihgL3ByaW50LyR7dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9P2RpYWxvZz10cnVlYCwgJ19ibGFuaycpLmZvY3VzKCk7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nc2hhcmVQYWdlIHBhZ2UnPlxuXHRcdFx0PE5hdmJhcj5cblx0XHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHRcdDxOYXYuaXRlbSBjbGFzc05hbWU9J2JyZXdUaXRsZSc+e3RoaXMucHJvcHMuYnJldy50aXRsZX08L05hdi5pdGVtPlxuXHRcdFx0XHQ8L05hdi5zZWN0aW9uPlxuXG5cdFx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0XHQ8UmVwb3J0SXNzdWUgLz5cblx0XHRcdFx0XHQ8UHJpbnRMaW5rIHNoYXJlSWQ9e3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfSAvPlxuXHRcdFx0XHRcdDxOYXYuaXRlbSBocmVmPXtgL3NvdXJjZS8ke3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfWB9IGNvbG9yPSd0ZWFsJyBpY29uPSdmYS1jb2RlJz5cblx0XHRcdFx0XHRcdHNvdXJjZVxuXHRcdFx0XHRcdDwvTmF2Lml0ZW0+XG5cdFx0XHRcdFx0PFJlY2VudE5hdkl0ZW0gYnJldz17dGhpcy5wcm9wcy5icmV3fSBzdG9yYWdlS2V5PSd2aWV3JyAvPlxuXHRcdFx0XHRcdDxBY2NvdW50IC8+XG5cdFx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0XHQ8L05hdmJhcj5cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRlbnQnPlxuXHRcdFx0XHQ8QnJld1JlbmRlcmVyIHRleHQ9e3RoaXMucHJvcHMuYnJldy50ZXh0fSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaGFyZVBhZ2U7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyAgICAgPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ICAgID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29uc3QgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG5jb25zdCBCcmV3SXRlbSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJyZXcgOiB7XG5cdFx0XHRcdHRpdGxlICAgICAgIDogJycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uIDogJycsXG5cblx0XHRcdFx0YXV0aG9ycyA6IFtdXG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRkZWxldGVCcmV3IDogZnVuY3Rpb24oKXtcblx0XHRpZighY29uZmlybSgnYXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIGJyZXc/JykpIHJldHVybjtcblx0XHRpZighY29uZmlybSgnYXJlIHlvdSBSRUFMTFkgc3VyZT8gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gcmVjb3ZlciBpdCcpKSByZXR1cm47XG5cblx0XHRyZXF1ZXN0LmdldChgL2FwaS9yZW1vdmUvJHt0aGlzLnByb3BzLmJyZXcuZWRpdElkfWApXG5cdFx0XHQuc2VuZCgpXG5cdFx0XHQuZW5kKGZ1bmN0aW9uKGVyciwgcmVzKXtcblx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXJEZWxldGVCcmV3TGluayA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucHJvcHMuYnJldy5lZGl0SWQpIHJldHVybjtcblxuXHRcdHJldHVybiA8YSBvbkNsaWNrPXt0aGlzLmRlbGV0ZUJyZXd9PlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS10cmFzaCcgLz5cblx0XHQ8L2E+O1xuXHR9LFxuXHRyZW5kZXJFZGl0TGluayA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucHJvcHMuYnJldy5lZGl0SWQpIHJldHVybjtcblxuXHRcdHJldHVybiA8YSBocmVmPXtgL2VkaXQvJHt0aGlzLnByb3BzLmJyZXcuZWRpdElkfWB9IHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInPlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1wZW5jaWwnIC8+XG5cdFx0PC9hPjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGJyZXcgPSB0aGlzLnByb3BzLmJyZXc7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdicmV3SXRlbSc+XG5cdFx0XHQ8aDI+e2JyZXcudGl0bGV9PC9oMj5cblx0XHRcdDxwIGNsYXNzTmFtZT0nZGVzY3JpcHRpb24nID57YnJldy5kZXNjcmlwdGlvbn08L3A+XG5cdFx0XHQ8aHIgLz5cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2luZm8nPlxuXHRcdFx0XHQ8c3Bhbj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXVzZXInIC8+IHticmV3LmF1dGhvcnMuam9pbignLCAnKX1cblx0XHRcdFx0PC9zcGFuPlxuXHRcdFx0XHQ8c3Bhbj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWV5ZScgLz4ge2JyZXcudmlld3N9XG5cdFx0XHRcdDwvc3Bhbj5cblx0XHRcdFx0PHNwYW4+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1yZWZyZXNoJyAvPiB7bW9tZW50KGJyZXcudXBkYXRlZEF0KS5mcm9tTm93KCl9XG5cdFx0XHRcdDwvc3Bhbj5cblx0XHRcdDwvZGl2PlxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nbGlua3MnPlxuXHRcdFx0XHQ8YSBocmVmPXtgL3NoYXJlLyR7YnJldy5zaGFyZUlkfWB9IHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtc2hhcmUtYWx0JyAvPlxuXHRcdFx0XHQ8L2E+XG5cdFx0XHRcdHt0aGlzLnJlbmRlckVkaXRMaW5rKCl9XG5cdFx0XHRcdHt0aGlzLnJlbmRlckRlbGV0ZUJyZXdMaW5rKCl9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyZXdJdGVtO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcbmNvbnN0IE5hdmJhciA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9uYXZiYXIuanN4Jyk7XG5cbmNvbnN0IFJlY2VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcmVjZW50Lm5hdml0ZW0uanN4JykuYm90aDtcbmNvbnN0IEFjY291bnQgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvYWNjb3VudC5uYXZpdGVtLmpzeCcpO1xuY29uc3QgQnJld0l0ZW0gPSByZXF1aXJlKCcuL2JyZXdJdGVtL2JyZXdJdGVtLmpzeCcpO1xuXG4vLyBjb25zdCBicmV3ID0ge1xuLy8gXHR0aXRsZSAgIDogJ1NVUEVSIExvbmcgdGl0bGUgd29haCBub3cnLFxuLy8gXHRhdXRob3JzIDogW11cbi8vIH07XG5cbi8vY29uc3QgQlJFV1MgPSBfLnRpbWVzKDI1LCAoKT0+eyByZXR1cm4gYnJldzt9KTtcblxuXG5jb25zdCBVc2VyUGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHVzZXJuYW1lIDogJycsXG5cdFx0XHRicmV3cyAgICA6IFtdXG5cdFx0fTtcblx0fSxcblxuXHRyZW5kZXJCcmV3cyA6IGZ1bmN0aW9uKGJyZXdzKXtcblx0XHRpZighYnJld3MgfHwgIWJyZXdzLmxlbmd0aCkgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdub0JyZXdzJz5ObyBCcmV3cy48L2Rpdj47XG5cblx0XHRjb25zdCBzb3J0ZWRCcmV3cyA9IF8uc29ydEJ5KGJyZXdzLCAoYnJldyk9PnsgcmV0dXJuIGJyZXcudGl0bGU7IH0pO1xuXG5cdFx0cmV0dXJuIF8ubWFwKHNvcnRlZEJyZXdzLCAoYnJldywgaWR4KT0+e1xuXHRcdFx0cmV0dXJuIDxCcmV3SXRlbSBicmV3PXticmV3fSBrZXk9e2lkeH0vPjtcblx0XHR9KTtcblx0fSxcblxuXHRnZXRTb3J0ZWRCcmV3cyA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIF8uZ3JvdXBCeSh0aGlzLnByb3BzLmJyZXdzLCAoYnJldyk9Pntcblx0XHRcdHJldHVybiAoYnJldy5wdWJsaXNoZWQgPyAncHVibGlzaGVkJyA6ICdwcml2YXRlJyk7XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyUHJpdmF0ZUJyZXdzIDogZnVuY3Rpb24ocHJpdmF0ZUJyZXdzKXtcblx0XHRpZighcHJpdmF0ZUJyZXdzIHx8ICFwcml2YXRlQnJld3MubGVuZ3RoKSByZXR1cm47XG5cblx0XHRyZXR1cm4gW1xuXHRcdFx0PGgxPnt0aGlzLnByb3BzLnVzZXJuYW1lfSdzIHVucHVibGlzaGVkIGJyZXdzPC9oMT4sXG5cdFx0XHR0aGlzLnJlbmRlckJyZXdzKHByaXZhdGVCcmV3cylcblx0XHRdO1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgYnJld3MgPSB0aGlzLmdldFNvcnRlZEJyZXdzKCk7XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3VzZXJQYWdlIHBhZ2UnPlxuXHRcdFx0PE5hdmJhcj5cblx0XHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHRcdDxSZWNlbnROYXZJdGVtIC8+XG5cdFx0XHRcdFx0PEFjY291bnQgLz5cblx0XHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHRcdDwvTmF2YmFyPlxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGVudCc+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdhZ2UnPlxuXHRcdFx0XHRcdDxoMT57dGhpcy5wcm9wcy51c2VybmFtZX0ncyBicmV3czwvaDE+XG5cdFx0XHRcdFx0e3RoaXMucmVuZGVyQnJld3MoYnJld3MucHVibGlzaGVkKX1cblx0XHRcdFx0XHR7dGhpcy5yZW5kZXJQcml2YXRlQnJld3MoYnJld3MucHJpdmF0ZSl9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBVc2VyUGFnZTtcbiIsIlxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgRElTTUlTU19LRVkgPSAnZGlzbWlzc19yZW5kZXJfd2FybmluZyc7XG5cbmNvbnN0IFJlbmRlcldhcm5pbmdzID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0d2FybmluZ3MgOiB7fVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jaGVja1dhcm5pbmdzKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuY2hlY2tXYXJuaW5ncyk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuY2hlY2tXYXJuaW5ncyk7XG5cdH0sXG5cdHdhcm5pbmdzIDoge1xuXHRcdGNocm9tZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRjb25zdCBpc0Nocm9tZSA9IC9DaHJvbWUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgL0dvb2dsZSBJbmMvLnRlc3QobmF2aWdhdG9yLnZlbmRvcik7XG5cdFx0XHRpZighaXNDaHJvbWUpe1xuXHRcdFx0XHRyZXR1cm4gPGxpIGtleT0nY2hyb21lJz5cblx0XHRcdFx0XHQ8ZW0+QnVpbHQgZm9yIENocm9tZSA8L2VtPiA8YnIgLz5cblx0XHRcdFx0XHRPdGhlciBicm93c2VycyBkbyBub3Qgc3VwcG9ydCAmbmJzcDtcblx0XHRcdFx0XHQ8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0naHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL2NvbHVtbi1zcGFuI0Jyb3dzZXJfY29tcGF0aWJpbGl0eSc+XG5cdFx0XHRcdFx0XHRrZXkgZmVhdHVyZXNcblx0XHRcdFx0XHQ8L2E+IHRoaXMgc2l0ZSB1c2VzLlxuXHRcdFx0XHQ8L2xpPjtcblx0XHRcdH1cblx0XHR9LFxuXHR9LFxuXHRjaGVja1dhcm5pbmdzIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBoaWRlRGlzbWlzcyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKERJU01JU1NfS0VZKTtcblx0XHRpZihoaWRlRGlzbWlzcykgcmV0dXJuIHRoaXMuc2V0U3RhdGUoeyB3YXJuaW5nczoge30gfSk7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHdhcm5pbmdzIDogXy5yZWR1Y2UodGhpcy53YXJuaW5ncywgKHIsIGZuLCB0eXBlKT0+e1xuXHRcdFx0XHRjb25zdCBlbGVtZW50ID0gZm4oKTtcblx0XHRcdFx0aWYoZWxlbWVudCkgclt0eXBlXSA9IGVsZW1lbnQ7XG5cdFx0XHRcdHJldHVybiByO1xuXHRcdFx0fSwge30pXG5cdFx0fSk7XG5cdH0sXG5cdGRpc21pc3MgOiBmdW5jdGlvbigpe1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKERJU01JU1NfS0VZLCB0cnVlKTtcblx0XHR0aGlzLmNoZWNrV2FybmluZ3MoKTtcblx0fSxcblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRpZihfLmlzRW1wdHkodGhpcy5zdGF0ZS53YXJuaW5ncykpIHJldHVybiBudWxsO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdyZW5kZXJXYXJuaW5ncyc+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXRpbWVzIGRpc21pc3MnIG9uQ2xpY2s9e3RoaXMuZGlzbWlzc30vPlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1leGNsYW1hdGlvbi10cmlhbmdsZSBvaG5vJyAvPlxuXHRcdFx0PGgzPlJlbmRlciBXYXJuaW5nczwvaDM+XG5cdFx0XHQ8c21hbGw+SWYgdGhpcyBob21lYnJldyBpcyByZW5kZXJpbmcgYmFkbHkgaWYgbWlnaHQgYmUgYmVjYXVzZSBvZiB0aGUgZm9sbG93aW5nOjwvc21hbGw+XG5cdFx0XHQ8dWw+e18udmFsdWVzKHRoaXMuc3RhdGUud2FybmluZ3MpfTwvdWw+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJXYXJuaW5ncztcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuXG5sZXQgQ29kZU1pcnJvcjtcbmlmKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnKXtcblx0Q29kZU1pcnJvciA9IHJlcXVpcmUoJ2NvZGVtaXJyb3InKTtcblxuXHQvL0xhbmd1YWdlIE1vZGVzXG5cdHJlcXVpcmUoJ2NvZGVtaXJyb3IvbW9kZS9nZm0vZ2ZtLmpzJyk7IC8vR2l0aHViIGZsYXZvdXJlZCBtYXJrZG93blxuXHRyZXF1aXJlKCdjb2RlbWlycm9yL21vZGUvamF2YXNjcmlwdC9qYXZhc2NyaXB0LmpzJyk7XG59XG5cblxuY29uc3QgQ29kZUVkaXRvciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxhbmd1YWdlICAgICAgICAgOiAnJyxcblx0XHRcdHZhbHVlICAgICAgICAgICAgOiAnJyxcblx0XHRcdHdyYXAgICAgICAgICAgICAgOiBmYWxzZSxcblx0XHRcdG9uQ2hhbmdlICAgICAgICAgOiBmdW5jdGlvbigpe30sXG5cdFx0XHRvbkN1cnNvckFjdGl2aXR5IDogZnVuY3Rpb24oKXt9LFxuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNvZGVNaXJyb3IgPSBDb2RlTWlycm9yKHRoaXMucmVmcy5lZGl0b3IsIHtcblx0XHRcdHZhbHVlICAgICAgICA6IHRoaXMucHJvcHMudmFsdWUsXG5cdFx0XHRsaW5lTnVtYmVycyAgOiB0cnVlLFxuXHRcdFx0bGluZVdyYXBwaW5nIDogdGhpcy5wcm9wcy53cmFwLFxuXHRcdFx0bW9kZSAgICAgICAgIDogdGhpcy5wcm9wcy5sYW5ndWFnZSxcblx0XHRcdGV4dHJhS2V5cyAgICA6IHtcblx0XHRcdFx0J0N0cmwtQicgOiB0aGlzLm1ha2VCb2xkLFxuXHRcdFx0XHQnQ3RybC1JJyA6IHRoaXMubWFrZUl0YWxpY1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5jb2RlTWlycm9yLm9uKCdjaGFuZ2UnLCB0aGlzLmhhbmRsZUNoYW5nZSk7XG5cdFx0dGhpcy5jb2RlTWlycm9yLm9uKCdjdXJzb3JBY3Rpdml0eScsIHRoaXMuaGFuZGxlQ3Vyc29yQWN0aXZpdHkpO1xuXHRcdHRoaXMudXBkYXRlU2l6ZSgpO1xuXHR9LFxuXG5cdG1ha2VCb2xkIDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uID0gdGhpcy5jb2RlTWlycm9yLmdldFNlbGVjdGlvbigpO1xuXHRcdHRoaXMuY29kZU1pcnJvci5yZXBsYWNlU2VsZWN0aW9uKGAqKiR7c2VsZWN0aW9ufSoqYCwgJ2Fyb3VuZCcpO1xuXHR9LFxuXG5cdG1ha2VJdGFsaWMgOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSB0aGlzLmNvZGVNaXJyb3IuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0dGhpcy5jb2RlTWlycm9yLnJlcGxhY2VTZWxlY3Rpb24oYCoke3NlbGVjdGlvbn0qYCwgJ2Fyb3VuZCcpO1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMgOiBmdW5jdGlvbihuZXh0UHJvcHMpe1xuXHRcdGlmKHRoaXMuY29kZU1pcnJvciAmJiBuZXh0UHJvcHMudmFsdWUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmNvZGVNaXJyb3IuZ2V0VmFsdWUoKSAhPSBuZXh0UHJvcHMudmFsdWUpIHtcblx0XHRcdHRoaXMuY29kZU1pcnJvci5zZXRWYWx1ZShuZXh0UHJvcHMudmFsdWUpO1xuXHRcdH1cblx0fSxcblxuXHRzaG91bGRDb21wb25lbnRVcGRhdGUgOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRzZXRDdXJzb3JQb3NpdGlvbiA6IGZ1bmN0aW9uKGxpbmUsIGNoYXIpe1xuXHRcdHNldFRpbWVvdXQoKCk9Pntcblx0XHRcdHRoaXMuY29kZU1pcnJvci5mb2N1cygpO1xuXHRcdFx0dGhpcy5jb2RlTWlycm9yLmRvYy5zZXRDdXJzb3IobGluZSwgY2hhcik7XG5cdFx0fSwgMTApO1xuXHR9LFxuXG5cdHVwZGF0ZVNpemUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuY29kZU1pcnJvci5yZWZyZXNoKCk7XG5cdH0sXG5cblx0aGFuZGxlQ2hhbmdlIDogZnVuY3Rpb24oZWRpdG9yKXtcblx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKGVkaXRvci5nZXRWYWx1ZSgpKTtcblx0fSxcblx0aGFuZGxlQ3Vyc29yQWN0aXZpdHkgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMucHJvcHMub25DdXJzb3JBY3Rpdml0eSh0aGlzLmNvZGVNaXJyb3IuZG9jLmdldEN1cnNvcigpKTtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nY29kZUVkaXRvcicgcmVmPSdlZGl0b3InIC8+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2RlRWRpdG9yO1xuIiwiY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgTWFya2Rvd24gPSByZXF1aXJlKCdtYXJrZWQnKTtcbmNvbnN0IHJlbmRlcmVyID0gbmV3IE1hcmtkb3duLlJlbmRlcmVyKCk7XG5cbi8vUHJvY2Vzc2VzIHRoZSBtYXJrZG93biB3aXRoaW4gYW4gSFRNTCBibG9jayBpZiBpdCdzIGp1c3QgYSBjbGFzcy13cmFwcGVyXG5yZW5kZXJlci5odG1sID0gZnVuY3Rpb24gKGh0bWwpIHtcblx0aWYoXy5zdGFydHNXaXRoKF8udHJpbShodG1sKSwgJzxkaXYnKSAmJiBfLmVuZHNXaXRoKF8udHJpbShodG1sKSwgJzwvZGl2PicpKXtcblx0XHRjb25zdCBvcGVuVGFnID0gaHRtbC5zdWJzdHJpbmcoMCwgaHRtbC5pbmRleE9mKCc+JykrMSk7XG5cdFx0aHRtbCA9IGh0bWwuc3Vic3RyaW5nKGh0bWwuaW5kZXhPZignPicpKzEpO1xuXHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZygwLCBodG1sLmxhc3RJbmRleE9mKCc8L2Rpdj4nKSk7XG5cdFx0cmV0dXJuIGAke29wZW5UYWd9ICR7TWFya2Rvd24oaHRtbCl9IDwvZGl2PmA7XG5cdH1cblx0cmV0dXJuIGh0bWw7XG59O1xuXG5jb25zdCBzYW5pdGl6ZVNjcmlwdFRhZ3MgPSAoY29udGVudCk9Pntcblx0cmV0dXJuIGNvbnRlbnRcblx0XHQucmVwbGFjZSgvPHNjcmlwdC9pZywgJyZsdDtzY3JpcHQnKVxuXHRcdC5yZXBsYWNlKC88XFwvc2NyaXB0Pi9pZywgJyZsdDsvc2NyaXB0Jmd0OycpO1xufTtcblxuY29uc3QgdGFnVHlwZXMgPSBbJ2RpdicsICdzcGFuJywgJ2EnXTtcbmNvbnN0IHRhZ1JlZ2V4ID0gbmV3IFJlZ0V4cChgKCR7XG5cdF8ubWFwKHRhZ1R5cGVzLCAodHlwZSk9Pntcblx0XHRyZXR1cm4gYFxcXFw8JHt0eXBlfXxcXFxcPC8ke3R5cGV9PmA7XG5cdH0pLmpvaW4oJ3wnKX0pYCwgJ2cnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bWFya2VkIDogTWFya2Rvd24sXG5cdHJlbmRlciA6IChyYXdCcmV3VGV4dCk9Pntcblx0XHRyZXR1cm4gTWFya2Rvd24oXG5cdFx0XHRzYW5pdGl6ZVNjcmlwdFRhZ3MocmF3QnJld1RleHQpLFxuXHRcdFx0eyByZW5kZXJlcjogcmVuZGVyZXIgfVxuXHRcdCk7XG5cdH0sXG5cblx0dmFsaWRhdGUgOiAocmF3QnJld1RleHQpPT57XG5cdFx0Y29uc3QgZXJyb3JzID0gW107XG5cdFx0Y29uc3QgbGVmdG92ZXJzID0gXy5yZWR1Y2UocmF3QnJld1RleHQuc3BsaXQoJ1xcbicpLCAoYWNjLCBsaW5lLCBfbGluZU51bWJlcik9Pntcblx0XHRcdGNvbnN0IGxpbmVOdW1iZXIgPSBfbGluZU51bWJlciArIDE7XG5cdFx0XHRjb25zdCBtYXRjaGVzID0gbGluZS5tYXRjaCh0YWdSZWdleCk7XG5cdFx0XHRpZighbWF0Y2hlcyB8fCAhbWF0Y2hlcy5sZW5ndGgpIHJldHVybiBhY2M7XG5cblx0XHRcdF8uZWFjaChtYXRjaGVzLCAobWF0Y2gpPT57XG5cdFx0XHRcdF8uZWFjaCh0YWdUeXBlcywgKHR5cGUpPT57XG5cdFx0XHRcdFx0aWYobWF0Y2ggPT0gYDwke3R5cGV9YCl7XG5cdFx0XHRcdFx0XHRhY2MucHVzaCh7XG5cdFx0XHRcdFx0XHRcdHR5cGUgOiB0eXBlLFxuXHRcdFx0XHRcdFx0XHRsaW5lIDogbGluZU51bWJlclxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKG1hdGNoID09PSBgPC8ke3R5cGV9PmApe1xuXHRcdFx0XHRcdFx0aWYoIWFjYy5sZW5ndGgpe1xuXHRcdFx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0bGluZSA6IGxpbmVOdW1iZXIsXG5cdFx0XHRcdFx0XHRcdFx0dHlwZSA6IHR5cGUsXG5cdFx0XHRcdFx0XHRcdFx0dGV4dCA6ICdVbm1hdGNoZWQgY2xvc2luZyB0YWcnLFxuXHRcdFx0XHRcdFx0XHRcdGlkICAgOiAnQ0xPU0UnXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKF8ubGFzdChhY2MpLnR5cGUgPT0gdHlwZSl7XG5cdFx0XHRcdFx0XHRcdGFjYy5wb3AoKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRsaW5lIDogYCR7Xy5sYXN0KGFjYykubGluZX0gdG8gJHtsaW5lTnVtYmVyfWAsXG5cdFx0XHRcdFx0XHRcdFx0dHlwZSA6IHR5cGUsXG5cdFx0XHRcdFx0XHRcdFx0dGV4dCA6ICdUeXBlIG1pc21hdGNoIG9uIGNsb3NpbmcgdGFnJyxcblx0XHRcdFx0XHRcdFx0XHRpZCAgIDogJ01JU01BVENIJ1xuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0YWNjLnBvcCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBhY2M7XG5cdFx0fSwgW10pO1xuXG5cdFx0Xy5lYWNoKGxlZnRvdmVycywgKHVubWF0Y2hlZCk9Pntcblx0XHRcdGVycm9ycy5wdXNoKHtcblx0XHRcdFx0bGluZSA6IHVubWF0Y2hlZC5saW5lLFxuXHRcdFx0XHR0eXBlIDogdW5tYXRjaGVkLnR5cGUsXG5cdFx0XHRcdHRleHQgOiAnVW5tYXRjaGVkIG9wZW5pbmcgdGFnJyxcblx0XHRcdFx0aWQgICA6ICdPUEVOJ1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZXJyb3JzO1xuXHR9LFxufTtcblxuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBOYXR1cmFsQ3JpdEljb24gPSByZXF1aXJlKCduYXR1cmFsY3JpdC9zdmcvbmF0dXJhbGNyaXQuc3ZnLmpzeCcpO1xuXG5jb25zdCBOYXYgPSB7XG5cdGJhc2UgOiBjcmVhdGVDbGFzcyh7XG5cdFx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiA8bmF2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nbmF2Q29udGVudCc+XG5cdFx0XHRcdFx0e3RoaXMucHJvcHMuY2hpbGRyZW59XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9uYXY+O1xuXHRcdH1cblx0fSksXG5cdGxvZ28gOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8YSBjbGFzc05hbWU9J25hdkxvZ28nIGhyZWY9J2h0dHBzOi8vYWdldW50b2xkLmNvbSc+XG5cdFx0XHQ8TmF0dXJhbENyaXRJY29uIC8+XG5cdFx0XHQ8c3BhbiBjbGFzc05hbWU9J25hbWUnPlxuXHRcdFx0XHRBR0U8c3BhbiBjbGFzc05hbWU9J2NyaXQnPlVudG9sZDwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHQ8L2E+O1xuXHR9LFxuXG5cdHNlY3Rpb24gOiBjcmVhdGVDbGFzcyh7XG5cdFx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nbmF2U2VjdGlvbic+XG5cdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxuXHRcdFx0PC9kaXY+O1xuXHRcdH1cblx0fSksXG5cblx0aXRlbSA6IGNyZWF0ZUNsYXNzKHtcblx0XHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGljb24gICAgOiBudWxsLFxuXHRcdFx0XHRocmVmICAgIDogbnVsbCxcblx0XHRcdFx0bmV3VGFiICA6IGZhbHNlLFxuXHRcdFx0XHRvbkNsaWNrIDogZnVuY3Rpb24oKXt9LFxuXHRcdFx0XHRjb2xvciAgIDogbnVsbFxuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGhhbmRsZUNsaWNrIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMucHJvcHMub25DbGljaygpO1xuXHRcdH0sXG5cdFx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRcdGNvbnN0IGNsYXNzZXMgPSBjeCgnbmF2SXRlbScsIHRoaXMucHJvcHMuY29sb3IsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdFx0bGV0IGljb247XG5cdFx0XHRpZih0aGlzLnByb3BzLmljb24pIGljb24gPSA8aSBjbGFzc05hbWU9e2BmYSAke3RoaXMucHJvcHMuaWNvbn1gfSAvPjtcblxuXHRcdFx0Y29uc3QgcHJvcHMgPSBfLm9taXQodGhpcy5wcm9wcywgWyduZXdUYWInXSk7XG5cblx0XHRcdGlmKHRoaXMucHJvcHMuaHJlZil7XG5cdFx0XHRcdHJldHVybiA8YSB7Li4ucHJvcHN9IGNsYXNzTmFtZT17Y2xhc3Nlc30gdGFyZ2V0PXt0aGlzLnByb3BzLm5ld1RhYiA/ICdfYmxhbmsnIDogJ19zZWxmJ30gPlxuXHRcdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxuXHRcdFx0XHRcdHtpY29ufVxuXHRcdFx0XHQ8L2E+O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIDxkaXYgey4uLnByb3BzfSBjbGFzc05hbWU9e2NsYXNzZXN9IG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9ID5cblx0XHRcdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHRcdFx0XHR7aWNvbn1cblx0XHRcdFx0PC9kaXY+O1xuXHRcdFx0fVxuXHRcdH1cblx0fSksXG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBOYXY7IiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBTcGxpdFBhbmUgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdG9yYWdlS2V5ICAgOiAnbmF0dXJhbGNyaXQtcGFuZS1zcGxpdCcsXG5cdFx0XHRvbkRyYWdGaW5pc2ggOiBmdW5jdGlvbigpe30gLy9maXJlcyB3aGVuIGRyYWdnaW5nXG5cblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2l6ZSAgICAgICA6IG51bGwsXG5cdFx0XHRpc0RyYWdnaW5nIDogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHBhbmVTaXplID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMucHJvcHMuc3RvcmFnZUtleSk7XG5cdFx0aWYocGFuZVNpemUpe1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHNpemUgOiBwYW5lU2l6ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZVVwIDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLnN0YXRlLmlzRHJhZ2dpbmcpe1xuXHRcdFx0dGhpcy5wcm9wcy5vbkRyYWdGaW5pc2godGhpcy5zdGF0ZS5zaXplKTtcblx0XHRcdHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnByb3BzLnN0b3JhZ2VLZXksIHRoaXMuc3RhdGUuc2l6ZSk7XG5cdFx0fVxuXHRcdHRoaXMuc2V0U3RhdGUoeyBpc0RyYWdnaW5nOiBmYWxzZSB9KTtcblx0fSxcblx0aGFuZGxlRG93biA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7IGlzRHJhZ2dpbmc6IHRydWUgfSk7XG5cdFx0Ly90aGlzLnVuRm9jdXMoKVxuXHR9LFxuXHRoYW5kbGVNb3ZlIDogZnVuY3Rpb24oZSl7XG5cdFx0aWYoIXRoaXMuc3RhdGUuaXNEcmFnZ2luZykgcmV0dXJuO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2l6ZSA6IGUucGFnZVhcblx0XHR9KTtcblx0fSxcblx0Lypcblx0dW5Gb2N1cyA6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKGRvY3VtZW50LnNlbGVjdGlvbil7XG5cdFx0XHRcdGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xuXHRcdH1lbHNle1xuXHRcdFx0d2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuXHRcdH1cblx0fSxcbiovXG5cdHJlbmRlckRpdmlkZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nZGl2aWRlcicgb25Nb3VzZURvd249e3RoaXMuaGFuZGxlRG93bn0+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZG90cyc+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtY2lyY2xlJyAvPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWNpcmNsZScgLz5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1jaXJjbGUnIC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3NwbGl0UGFuZScgb25Nb3VzZU1vdmU9e3RoaXMuaGFuZGxlTW92ZX0gb25Nb3VzZVVwPXt0aGlzLmhhbmRsZVVwfT5cblx0XHRcdDxQYW5lIHJlZj0ncGFuZTEnIHdpZHRoPXt0aGlzLnN0YXRlLnNpemV9Pnt0aGlzLnByb3BzLmNoaWxkcmVuWzBdfTwvUGFuZT5cblx0XHRcdHt0aGlzLnJlbmRlckRpdmlkZXIoKX1cblx0XHRcdDxQYW5lIHJlZj0ncGFuZTInPnt0aGlzLnByb3BzLmNoaWxkcmVuWzFdfTwvUGFuZT5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5cblxuXG5cblxuY29uc3QgUGFuZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHdpZHRoIDogbnVsbFxuXHRcdH07XG5cdH0sXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0bGV0IHN0eWxlcyA9IHt9O1xuXHRcdGlmKHRoaXMucHJvcHMud2lkdGgpe1xuXHRcdFx0c3R5bGVzID0ge1xuXHRcdFx0XHRmbGV4ICA6ICdub25lJyxcblx0XHRcdFx0d2lkdGggOiBgJHt0aGlzLnByb3BzLndpZHRofXB4YFxuXHRcdFx0fTtcblx0XHR9XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPXtjeCgncGFuZScsIHRoaXMucHJvcHMuY2xhc3NOYW1lKX0gc3R5bGU9e3N0eWxlc30+XG5cdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3BsaXRQYW5lO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9wcyl7XG5cdHJldHVybiA8c3ZnIHZlcnNpb249JzEuMScgeD0nMHB4JyB5PScwcHgnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJyBlbmFibGVCYWNrZ3JvdW5kPSduZXcgMCAwIDEwMCAxMDAnPjxwYXRoIGQ9J004MC42NDQsODcuOTgybDE2LjU5Mi00MS40ODNjMC4wNTQtMC4xMjgsMC4wODgtMC4yNiwwLjEwOC0wLjM5NGMwLjAwNi0wLjAzOSwwLjAwNy0wLjA3NywwLjAxMS0wLjExNiAgYzAuMDA3LTAuMDg3LDAuMDA4LTAuMTc0LDAuMDAyLTAuMjZjLTAuMDAzLTAuMDQ2LTAuMDA3LTAuMDkxLTAuMDE0LTAuMTM3Yy0wLjAxNC0wLjA4OS0wLjAzNi0wLjE3Ni0wLjA2My0wLjI2MiAgYy0wLjAxMi0wLjAzNC0wLjAxOS0wLjA2OS0wLjAzMS0wLjEwM2MtMC4wNDctMC4xMTgtMC4xMDYtMC4yMjktMC4xNzgtMC4zMzVjLTAuMDA0LTAuMDA2LTAuMDA2LTAuMDEyLTAuMDEtMC4wMThMNjcuOTk5LDMuMzU4ICBjLTAuMDEtMC4wMTMtMC4wMDMtMC4wMjYtMC4wMTMtMC4wNEw2OCwzLjMxNVY0YzAsMC0wLjAzMywwLTAuMDM3LDBjLTAuNDAzLTEtMS4wOTQtMS4xMjQtMS43NTItMC45NzYgIGMwLDAuMDA0LTAuMDA0LTAuMDEyLTAuMDA3LTAuMDEyQzY2LjIwMSwzLjAxNiw2Ni4xOTQsMyw2Ni4xOTQsM0g2Ni4xOWgtMC4wMDNoLTAuMDAzaC0wLjAwNGgtMC4wMDNjMCwwLTAuMDA0LDAtMC4wMDcsMCAgcy0wLjAwMy0wLjE1MS0wLjAwNy0wLjE1MUwyMC40OTUsMTUuMjI3Yy0wLjAyNSwwLjAwNy0wLjA0Ni0wLjAxOS0wLjA3MS0wLjAxMWMtMC4wODcsMC4wMjgtMC4xNzIsMC4wNDEtMC4yNTMsMC4wODMgIGMtMC4wNTQsMC4wMjctMC4xMDIsMC4wNTMtMC4xNTIsMC4wODVjLTAuMDUxLDAuMDMzLTAuMTAxLDAuMDYxLTAuMTQ3LDAuMDk5Yy0wLjA0NCwwLjAzNi0wLjA4NCwwLjA3My0wLjEyNCwwLjExMyAgYy0wLjA0OCwwLjA0OC0wLjA5MywwLjA5OC0wLjEzNiwwLjE1MmMtMC4wMywwLjAzOS0wLjA1OSwwLjA3Ni0wLjA4NSwwLjExN2MtMC4wNDYsMC4wNy0wLjA4NCwwLjE0NS0wLjEyLDAuMjIzICBjLTAuMDExLDAuMDIzLTAuMDI3LDAuMDQyLTAuMDM2LDAuMDY2TDIuOTExLDU3LjY2NEMyLjg5MSw1Ny43MTUsMyw1Ny43NjgsMyw1Ny44MnYwLjAwMmMwLDAuMTg2LDAsMC4zNzUsMCwwLjU2MiAgYzAsMC4wMDQsMCwwLjAwNCwwLDAuMDA4YzAsMCwwLDAsMCwwLjAwMmMwLDAsMCwwLDAsMC4wMDR2MC4wMDR2MC4wMDJjMCwwLjA3NC0wLjAwMiwwLjE1LDAuMDEyLDAuMjIzICBDMy4wMTUsNTguNjMxLDMsNTguNjMxLDMsNTguNjMzYzAsMC4wMDQsMCwwLjAwNCwwLDAuMDA4YzAsMCwwLDAsMCwwLjAwMmMwLDAsMCwwLDAsMC4wMDR2MC4wMDRjMCwwLDAsMCwwLDAuMDAydjAuMDA0ICBjMCwwLjE5MS0wLjA0NiwwLjM3NywwLjA2LDAuNTQ1YzAtMC4wMDItMC4wMywwLjAwNC0wLjAzLDAuMDA0YzAsMC4wMDQtMC4wMywwLjAwNC0wLjAzLDAuMDA0YzAsMC4wMDIsMCwwLjAwMiwwLDAuMDAyICBsLTAuMDQ1LDAuMDA0YzAuMDMsMC4wNDcsMC4wMzYsMC4wOSwwLjA2OCwwLjEzM2wyOS4wNDksMzcuMzU5YzAuMDAyLDAuMDA0LDAsMC4wMDYsMC4wMDIsMC4wMWMwLjAwMiwwLjAwMiwwLDAuMDA0LDAuMDAyLDAuMDA4ICBjMC4wMDYsMC4wMDgsMC4wMTQsMC4wMTQsMC4wMjEsMC4wMjFjMC4wMjQsMC4wMjksMC4wNTIsMC4wNTEsMC4wNzgsMC4wNzhjMC4wMjcsMC4wMjksMC4wNTMsMC4wNTcsMC4wODIsMC4wODIgIGMwLjAzLDAuMDI3LDAuMDU1LDAuMDYyLDAuMDg2LDAuMDg4YzAuMDI2LDAuMDIsMC4wNTcsMC4wMzMsMC4wODQsMC4wNTNjMC4wNCwwLjAyNywwLjA4MSwwLjA1MywwLjEyMywwLjA3NiAgYzAuMDA1LDAuMDA0LDAuMDEsMC4wMDgsMC4wMTYsMC4wMWMwLjA4NywwLjA1MSwwLjE3NiwwLjA5LDAuMjY5LDAuMTIzYzAuMDQyLDAuMDE0LDAuMDgyLDAuMDMxLDAuMTI1LDAuMDQzICBjMC4wMjEsMC4wMDYsMC4wNDEsMC4wMTgsMC4wNjIsMC4wMjFjMC4xMjMsMC4wMjcsMC4yNDksMC4wNDMsMC4zNzUsMC4wNDNjMC4wOTksMCwwLjIwMi0wLjAxMiwwLjMwNC0wLjAyN2w0NS42NjktOC4zMDMgIGMwLjA1Ny0wLjAxLDAuMTA4LTAuMDIxLDAuMTYzLTAuMDM3Qzc5LjU0Nyw4OC45OTIsNzkuNTYyLDg5LDc5LjU3NSw4OWMwLjAwNCwwLDAuMDA0LDAsMC4wMDQsMGMwLjAyMSwwLDAuMDM5LTAuMDI3LDAuMDYtMC4wMzUgIGMwLjA0MS0wLjAxNCwwLjA4LTAuMDM0LDAuMTItMC4wNTJjMC4wMjEtMC4wMSwwLjA0NC0wLjAxOSwwLjA2NC0wLjAzYzAuMDE3LTAuMDEsMC4wMjYtMC4wMTUsMC4wMzMtMC4wMTcgIGMwLjAxNC0wLjAwOCwwLjAyMy0wLjAyMSwwLjAzNy0wLjAyOGMwLjE0LTAuMDc4LDAuMjY5LTAuMTc0LDAuMzgtMC4yODVjMC4wMTQtMC4wMTYsMC4wMjQtMC4wMzQsMC4wMzgtMC4wNDggIGMwLjEwOS0wLjExOSwwLjIwMS0wLjI1MiwwLjI3MS0wLjM5OGMwLjAwNi0wLjAxLDAuMDE2LTAuMDE4LDAuMDIxLTAuMDI5YzAuMDA0LTAuMDA4LDAuMDA4LTAuMDE3LDAuMDExLTAuMDI2ICBjMC4wMDItMC4wMDQsMC4wMDMtMC4wMDYsMC4wMDUtMC4wMUM4MC42MjcsODguMDIxLDgwLjYzNSw4OC4wMDIsODAuNjQ0LDg3Ljk4MnogTTc3LjYxMSw4NC40NjFMNDguODA1LDY2LjQ1M2wzMi40MDctMjUuMjAyICBMNzcuNjExLDg0LjQ2MXogTTQ2LjgxNyw2My43MDlMMzUuODYzLDIzLjU0Mmw0My44MTgsMTQuNjA4TDQ2LjgxNyw2My43MDl6IE04NC42NjgsNDAuNTQybDguOTI2LDUuOTUybC0xMS45MDIsMjkuNzUgIEw4NC42NjgsNDAuNTQyeiBNODkuMTI4LDM5LjQ0Nkw4NC41MywzNi4zOGwtNi4xMjktMTIuMjU3TDg5LjEyOCwzOS40NDZ6IE03OS44NzYsMzQuNjQ1TDM3LjgwNywyMC42MjJMNjUuODU0LDYuNTk5TDc5Ljg3NiwzNC42NDUgIHogTTMzLjI2OCwxOS4xMDdsLTYuNDg1LTIuMTYybDIzLjc4MS02LjQ4N0wzMy4yNjgsMTkuMTA3eiBNMjEuOTIsMTguODk1bDguNjcsMi44OTFMMTAuMzU3LDQ3Ljc5OEwyMS45MiwxOC44OTV6IE0zMi42NTIsMjQuNjQ5ICBsMTAuODQ1LDM5Ljc1N0w3LjM1MSw1Ny4xNzhMMzIuNjUyLDI0LjY0OXogTTQzLjQ3Miw2Ny44NTdMMzIuOTY5LDkyLjM2M0w4LjQ2Miw2MC44NTVMNDMuNDcyLDY3Ljg1N3ogTTQ2LjYzMSw2OS4wOWwyNy44MjYsMTcuMzkzICBsLTM4LjI2Myw2Ljk1OUw0Ni42MzEsNjkuMDl6Jz48L3BhdGg+PC9zdmc+O1xufTtcblxuIl19
