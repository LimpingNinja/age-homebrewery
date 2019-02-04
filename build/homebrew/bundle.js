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
	return '<style>\n  .age#p1{ text-align:center; }\n  .age#p1:after{ display:none; }\n</style>\n\n<div style=\'margin-top:450px;\'></div>\n\n# ' + _.sample(titles) + '\n\n<div style=\'margin-top:25px\'></div>\n<div class=\'wide\'>\n##### ' + _.sample(subtitles) + '\n</div>\n\n\\page';
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
		r.push('- **[' + (idx1 + 1) + ' ' + g1.title + '](#p' + g1.page + ')**');
		if (g1.children.length) {
			_.each(g1.children, function (g2, idx2) {
				r.push('  - [' + (idx1 + 1) + '.' + (idx2 + 1) + ' ' + g2.title + '](#p' + g2.page + ')');
				if (g2.children.length) {
					_.each(g2.children, function (g3, idx3) {
						r.push('    - [' + (idx1 + 1) + '.' + (idx2 + 1) + '.' + (idx3 + 1) + ' ' + g3.title + '](#p' + g3.page + ')');
					});
				}
			});
		}
		return r;
	}, []).join('\n');

	return '<div class=\'toc\'>\n##### Table Of Contents\n' + markdown + '\n</div>\n';
};

},{"lodash":"lodash"}],"/Users/kcmorgan/Projects/homebrewery/client/homebrew/homebrew.jsx":[function(require,module,exports){
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
						'The Homebrewery'
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
			{ className: 'navLogo', href: 'http://naturalcrit.com' },
			React.createElement(NaturalCritIcon, null),
			React.createElement(
				'span',
				{ className: 'name' },
				'Natural',
				React.createElement(
					'span',
					{ className: 'crit' },
					'Crit'
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

},{"create-react-class":"create-react-class","react":"react"}]},{},[])("/Users/kcmorgan/Projects/homebrewery/client/homebrew/homebrew.jsx")
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvaG9tZWJyZXcvYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3giLCJjbGllbnQvaG9tZWJyZXcvYnJld1JlbmRlcmVyL2Vycm9yQmFyL2Vycm9yQmFyLmpzeCIsImNsaWVudC9ob21lYnJldy9icmV3UmVuZGVyZXIvbm90aWZpY2F0aW9uUG9wdXAvbm90aWZpY2F0aW9uUG9wdXAuanN4IiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9lZGl0b3IuanN4IiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9tZXRhZGF0YUVkaXRvci9tZXRhZGF0YUVkaXRvci5qc3giLCJjbGllbnQvaG9tZWJyZXcvZWRpdG9yL3NuaXBwZXRiYXIvc25pcHBldGJhci5qc3giLCJjbGllbnQvaG9tZWJyZXcvZWRpdG9yL3NuaXBwZXRiYXIvc25pcHBldHMvY2xhc3NmZWF0dXJlLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9jbGFzc3RhYmxlLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9jb3ZlcnBhZ2UuZ2VuLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL21hZ2ljLmdlbi5qcyIsImNsaWVudC9ob21lYnJldy9lZGl0b3Ivc25pcHBldGJhci9zbmlwcGV0cy9tb25zdGVyYmxvY2suZ2VuLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL3NuaXBwZXRzLmpzIiwiY2xpZW50L2hvbWVicmV3L2VkaXRvci9zbmlwcGV0YmFyL3NuaXBwZXRzL3RhYmxlT2ZDb250ZW50cy5nZW4uanMiLCJjbGllbnQvaG9tZWJyZXcvaG9tZWJyZXcuanN4IiwiY2xpZW50L2hvbWVicmV3L25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4IiwiY2xpZW50L2hvbWVicmV3L25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvbmF2YmFyLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvcGF0cmVvbi5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9uYXZiYXIvcHJpbnQubmF2aXRlbS5qc3giLCJjbGllbnQvaG9tZWJyZXcvbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCIsImNsaWVudC9ob21lYnJldy9wYWdlcy9lZGl0UGFnZS9lZGl0UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvZXJyb3JQYWdlL2Vycm9yUGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvaG9tZVBhZ2UvaG9tZVBhZ2UuanN4IiwiY2xpZW50L2hvbWVicmV3L3BhZ2VzL25ld1BhZ2UvbmV3UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvcHJpbnRQYWdlL3ByaW50UGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvc2hhcmVQYWdlL3NoYXJlUGFnZS5qc3giLCJjbGllbnQvaG9tZWJyZXcvcGFnZXMvdXNlclBhZ2UvYnJld0l0ZW0vYnJld0l0ZW0uanN4IiwiY2xpZW50L2hvbWVicmV3L3BhZ2VzL3VzZXJQYWdlL3VzZXJQYWdlLmpzeCIsInNoYXJlZC9ob21lYnJld2VyeS9yZW5kZXJXYXJuaW5ncy9yZW5kZXJXYXJuaW5ncy5qc3giLCJzaGFyZWQvbmF0dXJhbGNyaXQvY29kZUVkaXRvci9jb2RlRWRpdG9yLmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9tYXJrZG93bi5qcyIsInNoYXJlZC9uYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9zcGxpdFBhbmUvc3BsaXRQYW5lLmpzeCIsInNoYXJlZC9uYXR1cmFsY3JpdC9zdmcvbmF0dXJhbGNyaXQuc3ZnLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBTSxRQUFRLFFBQVEsT0FB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QUROLEdBQVA7QUFHQTtBQWpCdUIsQ0FBWixDQUFiOztBQXFCQSxPQUFPLE9BQVAsR0FBaUIsU0FBakI7Ozs7O0FDbkdBLElBQU0sUUFBUSxRQUFRLE9BQVIsQ0FBZDtBQUNBLElBQU0sY0FBYyxRQUFRLG9CQUFSLENBQXBCOztBQUVBLE9BQU8sT0FBUCxHQUFpQixVQUFTLEtBQVQsRUFBZTtBQUMvQixRQUFPO0FBQUE7QUFBQSxJQUFLLFNBQVEsS0FBYixFQUFtQixHQUFFLEtBQXJCLEVBQTJCLEdBQUUsS0FBN0IsRUFBbUMsU0FBUSxhQUEzQyxFQUF5RCxrQkFBaUIsaUJBQTFFO0FBQTRGLGdDQUFNLEdBQUUscThGQUFSO0FBQTVGLEVBQVA7QUFDQSxDQUZEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBNYXJrZG93biA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L21hcmtkb3duLmpzJyk7XG5jb25zdCBFcnJvckJhciA9IHJlcXVpcmUoJy4vZXJyb3JCYXIvZXJyb3JCYXIuanN4Jyk7XG5cbi8vVE9ETzogbW92ZSB0byB0aGUgYnJldyByZW5kZXJlclxuY29uc3QgUmVuZGVyV2FybmluZ3MgPSByZXF1aXJlKCdob21lYnJld2VyeS9yZW5kZXJXYXJuaW5ncy9yZW5kZXJXYXJuaW5ncy5qc3gnKTtcbmNvbnN0IE5vdGlmaWNhdGlvblBvcHVwID0gcmVxdWlyZSgnLi9ub3RpZmljYXRpb25Qb3B1cC9ub3RpZmljYXRpb25Qb3B1cC5qc3gnKTtcblxuY29uc3QgUEFHRV9IRUlHSFQgPSAxMDU2O1xuY29uc3QgUFBSX1RIUkVTSE9MRCA9IDUwO1xuXG5jb25zdCBCcmV3UmVuZGVyZXIgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0ZXh0ICAgOiAnJyxcblx0XHRcdGVycm9ycyA6IFtdXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgcGFnZXMgPSB0aGlzLnByb3BzLnRleHQuc3BsaXQoJ1xcXFxwYWdlJyk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dmlld2FibGVQYWdlTnVtYmVyIDogMCxcblx0XHRcdGhlaWdodCAgICAgICAgICAgICA6IDAsXG5cdFx0XHRpc01vdW50ZWQgICAgICAgICAgOiBmYWxzZSxcblxuXHRcdFx0cGFnZXMgIDogcGFnZXMsXG5cdFx0XHR1c2VQUFIgOiBwYWdlcy5sZW5ndGggPj0gUFBSX1RIUkVTSE9MRCxcblx0XHR9O1xuXHR9LFxuXHRoZWlnaHQgICAgIDogMCxcblx0bGFzdFJlbmRlciA6IDxkaXY+PC9kaXY+LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy51cGRhdGVTaXplKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMudXBkYXRlU2l6ZSk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMudXBkYXRlU2l6ZSk7XG5cdH0sXG5cblx0Y29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyA6IGZ1bmN0aW9uKG5leHRQcm9wcykge1xuXHRcdGNvbnN0IHBhZ2VzID0gbmV4dFByb3BzLnRleHQuc3BsaXQoJ1xcXFxwYWdlJyk7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRwYWdlcyAgOiBwYWdlcyxcblx0XHRcdHVzZVBQUiA6IHBhZ2VzLmxlbmd0aCA+PSBQUFJfVEhSRVNIT0xEXG5cdFx0fSk7XG5cdH0sXG5cblx0dXBkYXRlU2l6ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0aGVpZ2h0ICAgIDogdGhpcy5yZWZzLm1haW4ucGFyZW50Tm9kZS5jbGllbnRIZWlnaHQsXG5cdFx0XHRpc01vdW50ZWQgOiB0cnVlXG5cdFx0fSk7XG5cdH0sXG5cblx0aGFuZGxlU2Nyb2xsIDogZnVuY3Rpb24oZSl7XG5cdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG5cdFx0dGhpcy5zZXRTdGF0ZSgocHJldlN0YXRlKT0+KHtcblx0XHRcdHZpZXdhYmxlUGFnZU51bWJlciA6IE1hdGguZmxvb3IodGFyZ2V0LnNjcm9sbFRvcCAvIHRhcmdldC5zY3JvbGxIZWlnaHQgKiBwcmV2U3RhdGUucGFnZXMubGVuZ3RoKVxuXHRcdH0pKTtcblx0fSxcblxuXHRzaG91bGRSZW5kZXIgOiBmdW5jdGlvbihwYWdlVGV4dCwgaW5kZXgpe1xuXHRcdGlmKCF0aGlzLnN0YXRlLmlzTW91bnRlZCkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0Y29uc3Qgdmlld0luZGV4ID0gdGhpcy5zdGF0ZS52aWV3YWJsZVBhZ2VOdW1iZXI7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4IC0gMykgcmV0dXJuIHRydWU7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4IC0gMikgcmV0dXJuIHRydWU7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4IC0gMSkgcmV0dXJuIHRydWU7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4KSAgICAgcmV0dXJuIHRydWU7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4ICsgMSkgcmV0dXJuIHRydWU7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4ICsgMikgcmV0dXJuIHRydWU7XG5cdFx0aWYoaW5kZXggPT0gdmlld0luZGV4ICsgMykgcmV0dXJuIHRydWU7XG5cblx0XHQvL0NoZWNrIGZvciBzdHlsZSB0YWdlc1xuXHRcdGlmKHBhZ2VUZXh0LmluZGV4T2YoJzxzdHlsZT4nKSAhPT0gLTEpIHJldHVybiB0cnVlO1xuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHJlbmRlclBhZ2VJbmZvIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3BhZ2VJbmZvJz5cblx0XHRcdHt0aGlzLnN0YXRlLnZpZXdhYmxlUGFnZU51bWJlciArIDF9IC8ge3RoaXMuc3RhdGUucGFnZXMubGVuZ3RofVxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXJQUFJtc2cgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnN0YXRlLnVzZVBQUikgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdwcHJfbXNnJz5cblx0XHRcdFBhcnRpYWwgUGFnZSBSZW5kZXJlciBlbmFibGVkLCBiZWNhdXNlIHlvdXIgYnJldyBpcyBzbyBsYXJnZS4gTWF5IGVmZmVjdCByZW5kZXJpbmcuXG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlckR1bW15UGFnZSA6IGZ1bmN0aW9uKGluZGV4KXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2FnZScgaWQ9e2BwJHtpbmRleCArIDF9YH0ga2V5PXtpbmRleH0+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXNwaW5uZXIgZmEtc3BpbicgLz5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyUGFnZSA6IGZ1bmN0aW9uKHBhZ2VUZXh0LCBpbmRleCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdhZ2UnIGlkPXtgcCR7aW5kZXggKyAxfWB9IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogTWFya2Rvd24ucmVuZGVyKHBhZ2VUZXh0KSB9fSBrZXk9e2luZGV4fSAvPjtcblx0fSxcblxuXHRyZW5kZXJQYWdlcyA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5zdGF0ZS51c2VQUFIpe1xuXHRcdFx0cmV0dXJuIF8ubWFwKHRoaXMuc3RhdGUucGFnZXMsIChwYWdlLCBpbmRleCk9Pntcblx0XHRcdFx0aWYodGhpcy5zaG91bGRSZW5kZXIocGFnZSwgaW5kZXgpKXtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJQYWdlKHBhZ2UsIGluZGV4KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJEdW1teVBhZ2UoaW5kZXgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYodGhpcy5wcm9wcy5lcnJvcnMgJiYgdGhpcy5wcm9wcy5lcnJvcnMubGVuZ3RoKSByZXR1cm4gdGhpcy5sYXN0UmVuZGVyO1xuXHRcdHRoaXMubGFzdFJlbmRlciA9IF8ubWFwKHRoaXMuc3RhdGUucGFnZXMsIChwYWdlLCBpbmRleCk9Pntcblx0XHRcdHJldHVybiB0aGlzLnJlbmRlclBhZ2UocGFnZSwgaW5kZXgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzLmxhc3RSZW5kZXI7XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PFJlYWN0LkZyYWdtZW50PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nYnJld1JlbmRlcmVyJ1xuXHRcdFx0XHRcdG9uU2Nyb2xsPXt0aGlzLmhhbmRsZVNjcm9sbH1cblx0XHRcdFx0XHRyZWY9J21haW4nXG5cdFx0XHRcdFx0c3R5bGU9e3sgaGVpZ2h0OiB0aGlzLnN0YXRlLmhlaWdodCB9fT5cblxuXHRcdFx0XHRcdDxFcnJvckJhciBlcnJvcnM9e3RoaXMucHJvcHMuZXJyb3JzfSAvPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdwb3B1cHMnPlxuXHRcdFx0XHRcdFx0PFJlbmRlcldhcm5pbmdzIC8+XG5cdFx0XHRcdFx0XHQ8Tm90aWZpY2F0aW9uUG9wdXAgLz5cblx0XHRcdFx0XHQ8L2Rpdj5cblxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdwYWdlcycgcmVmPSdwYWdlcyc+XG5cdFx0XHRcdFx0XHR7dGhpcy5yZW5kZXJQYWdlcygpfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj47XG5cdFx0XHRcdHt0aGlzLnJlbmRlclBhZ2VJbmZvKCl9XG5cdFx0XHRcdHt0aGlzLnJlbmRlclBQUm1zZygpfVxuXHRcdFx0PC9SZWFjdC5GcmFnbWVudD5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCcmV3UmVuZGVyZXI7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyAgICAgPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ICAgID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCBFcnJvckJhciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGVycm9ycyA6IFtdXG5cdFx0fTtcblx0fSxcblxuXHRoYXNPcGVuRXJyb3IgIDogZmFsc2UsXG5cdGhhc0Nsb3NlRXJyb3IgOiBmYWxzZSxcblx0aGFzTWF0Y2hFcnJvciA6IGZhbHNlLFxuXG5cdHJlbmRlckVycm9ycyA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5oYXNPcGVuRXJyb3IgPSBmYWxzZTtcblx0XHR0aGlzLmhhc0Nsb3NlRXJyb3IgPSBmYWxzZTtcblx0XHR0aGlzLmhhc01hdGNoRXJyb3IgPSBmYWxzZTtcblxuXG5cdFx0Y29uc3QgZXJyb3JzID0gXy5tYXAodGhpcy5wcm9wcy5lcnJvcnMsIChlcnIsIGlkeCk9Pntcblx0XHRcdGlmKGVyci5pZCA9PSAnT1BFTicpIHRoaXMuaGFzT3BlbkVycm9yID0gdHJ1ZTtcblx0XHRcdGlmKGVyci5pZCA9PSAnQ0xPU0UnKSB0aGlzLmhhc0Nsb3NlRXJyb3IgPSB0cnVlO1xuXHRcdFx0aWYoZXJyLmlkID09ICdNSVNNQVRDSCcpIHRoaXMuaGFzTWF0Y2hFcnJvciA9IHRydWU7XG5cdFx0XHRyZXR1cm4gPGxpIGtleT17aWR4fT5cblx0XHRcdFx0TGluZSB7ZXJyLmxpbmV9IDoge2Vyci50ZXh0fSwgJ3tlcnIudHlwZX0nIHRhZ1xuXHRcdFx0PC9saT47XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gPHVsPntlcnJvcnN9PC91bD47XG5cdH0sXG5cblx0cmVuZGVyUHJvdGlwIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBtc2cgPSBbXTtcblx0XHRpZih0aGlzLmhhc09wZW5FcnJvcil7XG5cdFx0XHRtc2cucHVzaCg8ZGl2PlxuXHRcdFx0XHRBbiB1bm1hdGNoZWQgb3BlbmluZyB0YWcgbWVhbnMgdGhlcmUncyBhbiBvcGVuZWQgdGFnIHRoYXQgaXNuJ3QgY2xvc2VkLCB5b3UgbmVlZCB0byBjbG9zZSBhIHRhZywgbGlrZSB0aGlzIHsnPC9kaXY+J30uIE1ha2Ugc3VyZSB0byBtYXRjaCB0eXBlcyFcblx0XHRcdDwvZGl2Pik7XG5cdFx0fVxuXG5cdFx0aWYodGhpcy5oYXNDbG9zZUVycm9yKXtcblx0XHRcdG1zZy5wdXNoKDxkaXY+XG5cdFx0XHRcdEFuIHVubWF0Y2hlZCBjbG9zaW5nIHRhZyBtZWFucyB5b3UgY2xvc2VkIGEgdGFnIHdpdGhvdXQgb3BlbmluZyBpdC4gRWl0aGVyIHJlbW92ZSBpdCwgeW91IGNoZWNrIHRvIHdoZXJlIHlvdSB0aGluayB5b3Ugb3BlbmVkIGl0LlxuXHRcdFx0PC9kaXY+KTtcblx0XHR9XG5cblx0XHRpZih0aGlzLmhhc01hdGNoRXJyb3Ipe1xuXHRcdFx0bXNnLnB1c2goPGRpdj5cblx0XHRcdFx0QSB0eXBlIG1pc21hdGNoIG1lYW5zIHlvdSBjbG9zZWQgYSB0YWcsIGJ1dCB0aGUgbGFzdCBvcGVuIHRhZyB3YXMgYSBkaWZmZXJlbnQgdHlwZS5cblx0XHRcdDwvZGl2Pik7XG5cdFx0fVxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ncHJvdGlwcyc+XG5cdFx0XHQ8aDQ+UHJvdGlwcyE8L2g0PlxuXHRcdFx0e21zZ31cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5wcm9wcy5lcnJvcnMubGVuZ3RoKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nZXJyb3JCYXInPlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1leGNsYW1hdGlvbi10cmlhbmdsZScgLz5cblx0XHRcdDxoMz4gVGhlcmUgYXJlIEhUTUwgZXJyb3JzIGluIHlvdXIgbWFya3VwPC9oMz5cblx0XHRcdDxzbWFsbD5JZiB0aGVzZSBhcmVuJ3QgZml4ZWQgeW91ciBicmV3IHdpbGwgbm90IHJlbmRlciBwcm9wZXJseSB3aGVuIHlvdSBwcmludCBpdCB0byBQREYgb3Igc2hhcmUgaXQ8L3NtYWxsPlxuXHRcdFx0e3RoaXMucmVuZGVyRXJyb3JzKCl9XG5cdFx0XHQ8aHIgLz5cblx0XHRcdHt0aGlzLnJlbmRlclByb3RpcCgpfVxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRXJyb3JCYXI7XG4iLCJcbmNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XHQvL1VudXNlZCB2YXJpYWJsZVxuXG5jb25zdCBESVNNSVNTX0tFWSA9ICdkaXNtaXNzX25vdGlmaWNhdGlvbic7XG5cbmNvbnN0IE5vdGlmaWNhdGlvblBvcHVwID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bm90aWZpY2F0aW9ucyA6IHt9XG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNoZWNrTm90aWZpY2F0aW9ucygpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLmNoZWNrTm90aWZpY2F0aW9ucyk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuY2hlY2tOb3RpZmljYXRpb25zKTtcblx0fSxcblx0bm90aWZpY2F0aW9ucyA6IHtcblx0XHRmYXEgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIDxsaSBrZXk9J2ZhcSc+XG5cdFx0XHRcdDxlbT5Qcm90ZWN0IHlvdXIgd29yayEgPC9lbT4gPGJyIC8+XG5cdFx0XHRcdEF0IHRoZSBtb21lbnQgd2UgZG8gbm90IHNhdmUgYSBoaXN0b3J5IG9mIHlvdXIgcHJvamVjdHMsIHNvIHBsZWFzZSBtYWtlIGZyZXF1ZW50IGJhY2t1cHMgb2YgeW91ciBicmV3cyEgICZuYnNwO1xuXHRcdFx0XHQ8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0naHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL2hvbWVicmV3ZXJ5L2NvbW1lbnRzL2FkaDZsaC9mYXFzX3BzYXNfYW5ub3VuY2VtZW50cy8nPlxuXHRcdFx0XHRcdFNlZSB0aGUgRkFRXG5cdFx0XHRcdDwvYT4gdG8gbGVhcm4gaG93IHRvIGF2b2lkIGxvc2luZyB5b3VyIHdvcmshXG5cdFx0XHQ8L2xpPjtcblx0XHR9LFxuXHR9LFxuXHRjaGVja05vdGlmaWNhdGlvbnMgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGhpZGVEaXNtaXNzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oRElTTUlTU19LRVkpO1xuXHRcdGlmKGhpZGVEaXNtaXNzKSByZXR1cm4gdGhpcy5zZXRTdGF0ZSh7IG5vdGlmaWNhdGlvbnM6IHt9IH0pO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRub3RpZmljYXRpb25zIDogXy5tYXBWYWx1ZXModGhpcy5ub3RpZmljYXRpb25zLCAoZm4pPT57IHJldHVybiBmbigpOyB9KVx0Ly9Db252ZXJ0IG5vdGlmaWNhdGlvbiBmdW5jdGlvbnMgaW50byB0aGVpciByZXR1cm4gdGV4dCB2YWx1ZVxuXHRcdH0pO1xuXHR9LFxuXHRkaXNtaXNzIDogZnVuY3Rpb24oKXtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShESVNNSVNTX0tFWSwgdHJ1ZSk7XG5cdFx0dGhpcy5jaGVja05vdGlmaWNhdGlvbnMoKTtcblx0fSxcblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRpZihfLmlzRW1wdHkodGhpcy5zdGF0ZS5ub3RpZmljYXRpb25zKSkgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J25vdGlmaWNhdGlvblBvcHVwJz5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtdGltZXMgZGlzbWlzcycgb25DbGljaz17dGhpcy5kaXNtaXNzfS8+XG5cdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWluZm8tY2lyY2xlIGluZm8nIC8+XG5cdFx0XHQ8aDM+Tm90aWNlPC9oMz5cblx0XHRcdDxzbWFsbD5UaGlzIHdlYnNpdGUgaXMgYWx3YXlzIGltcHJvdmluZyBhbmQgd2UgYXJlIHN0aWxsIGFkZGluZyBuZXcgZmVhdHVyZXMgYW5kIHNxdWFzaGluZyBidWdzLiBLZWVwIHRoZSBmb2xsb3dpbmcgaW4gbWluZDo8L3NtYWxsPlxuXHRcdFx0PHVsPntfLnZhbHVlcyh0aGlzLnN0YXRlLm5vdGlmaWNhdGlvbnMpfTwvdWw+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb3RpZmljYXRpb25Qb3B1cDtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgQ29kZUVkaXRvciA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L2NvZGVFZGl0b3IvY29kZUVkaXRvci5qc3gnKTtcbmNvbnN0IFNuaXBwZXRCYXIgPSByZXF1aXJlKCcuL3NuaXBwZXRiYXIvc25pcHBldGJhci5qc3gnKTtcbmNvbnN0IE1ldGFkYXRhRWRpdG9yID0gcmVxdWlyZSgnLi9tZXRhZGF0YUVkaXRvci9tZXRhZGF0YUVkaXRvci5qc3gnKTtcblxuXG5jb25zdCBzcGxpY2UgPSBmdW5jdGlvbihzdHIsIGluZGV4LCBpbmplY3Qpe1xuXHRyZXR1cm4gc3RyLnNsaWNlKDAsIGluZGV4KSArIGluamVjdCArIHN0ci5zbGljZShpbmRleCk7XG59O1xuXG5jb25zdCBTTklQUEVUQkFSX0hFSUdIVCA9IDI1O1xuXG5jb25zdCBFZGl0b3IgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR2YWx1ZSAgICA6ICcnLFxuXHRcdFx0b25DaGFuZ2UgOiAoKT0+e30sXG5cblx0XHRcdG1ldGFkYXRhICAgICAgICAgOiB7fSxcblx0XHRcdG9uTWV0YWRhdGFDaGFuZ2UgOiAoKT0+e30sXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNob3dNZXRhZGF0YUVkaXRvciA6IGZhbHNlXG5cdFx0fTtcblx0fSxcblx0Y3Vyc29yUG9zaXRpb24gOiB7XG5cdFx0bGluZSA6IDAsXG5cdFx0Y2ggICA6IDBcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudXBkYXRlRWRpdG9yU2l6ZSgpO1xuXHRcdHRoaXMuaGlnaGxpZ2h0UGFnZUxpbmVzKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMudXBkYXRlRWRpdG9yU2l6ZSk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMudXBkYXRlRWRpdG9yU2l6ZSk7XG5cdH0sXG5cblx0dXBkYXRlRWRpdG9yU2l6ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdGxldCBwYW5lSGVpZ2h0ID0gdGhpcy5yZWZzLm1haW4ucGFyZW50Tm9kZS5jbGllbnRIZWlnaHQ7XG5cdFx0cGFuZUhlaWdodCAtPSBTTklQUEVUQkFSX0hFSUdIVCArIDE7XG5cdFx0dGhpcy5yZWZzLmNvZGVFZGl0b3IuY29kZU1pcnJvci5zZXRTaXplKG51bGwsIHBhbmVIZWlnaHQpO1xuXHR9LFxuXG5cdGhhbmRsZVRleHRDaGFuZ2UgOiBmdW5jdGlvbih0ZXh0KXtcblx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKHRleHQpO1xuXHR9LFxuXHRoYW5kbGVDdXJzb3JBY3RpdnR5IDogZnVuY3Rpb24oY3VycG9zKXtcblx0XHR0aGlzLmN1cnNvclBvc2l0aW9uID0gY3VycG9zO1xuXHR9LFxuXHRoYW5kbGVJbmplY3QgOiBmdW5jdGlvbihpbmplY3RUZXh0KXtcblx0XHRjb25zdCBsaW5lcyA9IHRoaXMucHJvcHMudmFsdWUuc3BsaXQoJ1xcbicpO1xuXHRcdGxpbmVzW3RoaXMuY3Vyc29yUG9zaXRpb24ubGluZV0gPSBzcGxpY2UobGluZXNbdGhpcy5jdXJzb3JQb3NpdGlvbi5saW5lXSwgdGhpcy5jdXJzb3JQb3NpdGlvbi5jaCwgaW5qZWN0VGV4dCk7XG5cblx0XHR0aGlzLmhhbmRsZVRleHRDaGFuZ2UobGluZXMuam9pbignXFxuJykpO1xuXHRcdHRoaXMucmVmcy5jb2RlRWRpdG9yLnNldEN1cnNvclBvc2l0aW9uKHRoaXMuY3Vyc29yUG9zaXRpb24ubGluZSwgdGhpcy5jdXJzb3JQb3NpdGlvbi5jaCAgKyBpbmplY3RUZXh0Lmxlbmd0aCk7XG5cdH0sXG5cdGhhbmRnbGVUb2dnbGUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2hvd01ldGFkYXRhRWRpdG9yIDogIXRoaXMuc3RhdGUuc2hvd01ldGFkYXRhRWRpdG9yXG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0Q3VycmVudFBhZ2UgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGxpbmVzID0gdGhpcy5wcm9wcy52YWx1ZS5zcGxpdCgnXFxuJykuc2xpY2UoMCwgdGhpcy5jdXJzb3JQb3NpdGlvbi5saW5lICsgMSk7XG5cdFx0cmV0dXJuIF8ucmVkdWNlKGxpbmVzLCAociwgbGluZSk9Pntcblx0XHRcdGlmKGxpbmUuaW5kZXhPZignXFxcXHBhZ2UnKSAhPT0gLTEpIHIrKztcblx0XHRcdHJldHVybiByO1xuXHRcdH0sIDEpO1xuXHR9LFxuXG5cdGhpZ2hsaWdodFBhZ2VMaW5lcyA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMucmVmcy5jb2RlRWRpdG9yKSByZXR1cm47XG5cdFx0Y29uc3QgY29kZU1pcnJvciA9IHRoaXMucmVmcy5jb2RlRWRpdG9yLmNvZGVNaXJyb3I7XG5cblx0XHRjb25zdCBsaW5lTnVtYmVycyA9IF8ucmVkdWNlKHRoaXMucHJvcHMudmFsdWUuc3BsaXQoJ1xcbicpLCAociwgbGluZSwgbGluZU51bWJlcik9Pntcblx0XHRcdGlmKGxpbmUuaW5kZXhPZignXFxcXHBhZ2UnKSAhPT0gLTEpe1xuXHRcdFx0XHRjb2RlTWlycm9yLmFkZExpbmVDbGFzcyhsaW5lTnVtYmVyLCAnYmFja2dyb3VuZCcsICdwYWdlTGluZScpO1xuXHRcdFx0XHRyLnB1c2gobGluZU51bWJlcik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcjtcblx0XHR9LCBbXSk7XG5cdFx0cmV0dXJuIGxpbmVOdW1iZXJzO1xuXHR9LFxuXG5cblx0YnJld0p1bXAgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGN1cnJlbnRQYWdlID0gdGhpcy5nZXRDdXJyZW50UGFnZSgpO1xuXHRcdHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gYHAke2N1cnJlbnRQYWdlfWA7XG5cdH0sXG5cblx0Ly9DYWxsZWQgd2hlbiB0aGVyZSBhcmUgY2hhbmdlcyB0byB0aGUgZWRpdG9yJ3MgZGltZW5zaW9uc1xuXHR1cGRhdGUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMucmVmcy5jb2RlRWRpdG9yLnVwZGF0ZVNpemUoKTtcblx0fSxcblxuXHRyZW5kZXJNZXRhZGF0YUVkaXRvciA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUuc2hvd01ldGFkYXRhRWRpdG9yKSByZXR1cm47XG5cdFx0cmV0dXJuIDxNZXRhZGF0YUVkaXRvclxuXHRcdFx0bWV0YWRhdGE9e3RoaXMucHJvcHMubWV0YWRhdGF9XG5cdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5vbk1ldGFkYXRhQ2hhbmdlfVxuXHRcdC8+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5oaWdobGlnaHRQYWdlTGluZXMoKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2VkaXRvcicgcmVmPSdtYWluJz5cblx0XHRcdFx0PFNuaXBwZXRCYXJcblx0XHRcdFx0XHRicmV3PXt0aGlzLnByb3BzLnZhbHVlfVxuXHRcdFx0XHRcdG9uSW5qZWN0PXt0aGlzLmhhbmRsZUluamVjdH1cblx0XHRcdFx0XHRvblRvZ2dsZT17dGhpcy5oYW5kZ2xlVG9nZ2xlfVxuXHRcdFx0XHRcdHNob3dtZXRhPXt0aGlzLnN0YXRlLnNob3dNZXRhZGF0YUVkaXRvcn0gLz5cblx0XHRcdFx0e3RoaXMucmVuZGVyTWV0YWRhdGFFZGl0b3IoKX1cblx0XHRcdFx0PENvZGVFZGl0b3Jcblx0XHRcdFx0XHRyZWY9J2NvZGVFZGl0b3InXG5cdFx0XHRcdFx0d3JhcD17dHJ1ZX1cblx0XHRcdFx0XHRsYW5ndWFnZT0nZ2ZtJ1xuXHRcdFx0XHRcdHZhbHVlPXt0aGlzLnByb3BzLnZhbHVlfVxuXHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLmhhbmRsZVRleHRDaGFuZ2V9XG5cdFx0XHRcdFx0b25DdXJzb3JBY3Rpdml0eT17dGhpcy5oYW5kbGVDdXJzb3JBY3RpdnR5fSAvPlxuXG5cdFx0XHRcdHsvKlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nYnJld0p1bXAnIG9uQ2xpY2s9e3RoaXMuYnJld0p1bXB9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtYXJyb3ctcmlnaHQnIC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQqL31cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvcjtcblxuXG5cblxuXG5cbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG5jb25zdCBTWVNURU1TID0gWyc1ZScsICc0ZScsICczLjVlJywgJ1BhdGhmaW5kZXInXTtcblxuY29uc3QgTWV0YWRhdGFFZGl0b3IgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtZXRhZGF0YSA6IHtcblx0XHRcdFx0ZWRpdElkICAgICAgOiBudWxsLFxuXHRcdFx0XHR0aXRsZSAgICAgICA6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbiA6ICcnLFxuXHRcdFx0XHR0YWdzICAgICAgICA6ICcnLFxuXHRcdFx0XHRwdWJsaXNoZWQgICA6IGZhbHNlLFxuXHRcdFx0XHRhdXRob3JzICAgICA6IFtdLFxuXHRcdFx0XHRzeXN0ZW1zICAgICA6IFtdXG5cdFx0XHR9LFxuXHRcdFx0b25DaGFuZ2UgOiAoKT0+e31cblx0XHR9O1xuXHR9LFxuXG5cdGhhbmRsZUZpZWxkQ2hhbmdlIDogZnVuY3Rpb24obmFtZSwgZSl7XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZShfLm1lcmdlKHt9LCB0aGlzLnByb3BzLm1ldGFkYXRhLCB7XG5cdFx0XHRbbmFtZV0gOiBlLnRhcmdldC52YWx1ZVxuXHRcdH0pKTtcblx0fSxcblx0aGFuZGxlU3lzdGVtIDogZnVuY3Rpb24oc3lzdGVtLCBlKXtcblx0XHRpZihlLnRhcmdldC5jaGVja2VkKXtcblx0XHRcdHRoaXMucHJvcHMubWV0YWRhdGEuc3lzdGVtcy5wdXNoKHN5c3RlbSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucHJvcHMubWV0YWRhdGEuc3lzdGVtcyA9IF8ud2l0aG91dCh0aGlzLnByb3BzLm1ldGFkYXRhLnN5c3RlbXMsIHN5c3RlbSk7XG5cdFx0fVxuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5wcm9wcy5tZXRhZGF0YSk7XG5cdH0sXG5cdGhhbmRsZVB1Ymxpc2ggOiBmdW5jdGlvbih2YWwpe1xuXHRcdHRoaXMucHJvcHMub25DaGFuZ2UoXy5tZXJnZSh7fSwgdGhpcy5wcm9wcy5tZXRhZGF0YSwge1xuXHRcdFx0cHVibGlzaGVkIDogdmFsXG5cdFx0fSkpO1xuXHR9LFxuXG5cdGhhbmRsZURlbGV0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIWNvbmZpcm0oJ2FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhpcyBicmV3PycpKSByZXR1cm47XG5cdFx0aWYoIWNvbmZpcm0oJ2FyZSB5b3UgUkVBTExZIHN1cmU/IFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIHJlY292ZXIgaXQnKSkgcmV0dXJuO1xuXG5cdFx0cmVxdWVzdC5nZXQoYC9hcGkvcmVtb3ZlLyR7dGhpcy5wcm9wcy5tZXRhZGF0YS5lZGl0SWR9YClcblx0XHRcdC5zZW5kKClcblx0XHRcdC5lbmQoZnVuY3Rpb24oZXJyLCByZXMpe1xuXHRcdFx0XHR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcblx0XHRcdH0pO1xuXHR9LFxuXG5cdGdldFJlZGRpdExpbmsgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IG1ldGEgPSB0aGlzLnByb3BzLm1ldGFkYXRhO1xuXHRcdGNvbnN0IHRpdGxlID0gYCR7bWV0YS50aXRsZX0gWyR7bWV0YS5zeXN0ZW1zLmpvaW4oJyAnKX1dYDtcblx0XHRjb25zdCB0ZXh0ID0gYEhleSBndXlzISBJJ3ZlIGJlZW4gd29ya2luZyBvbiB0aGlzIGhvbWVicmV3LiBJJ2QgbG92ZSB5b3VyIGZlZWRiYWNrLiBDaGVjayBpdCBvdXQuXG5cbioqW0hvbWVicmV3ZXJ5IExpbmtdKGh0dHA6Ly9ob21lYnJld2VyeS5uYXR1cmFsY3JpdC5jb20vc2hhcmUvJHttZXRhLnNoYXJlSWR9KSoqYDtcblxuXHRcdHJldHVybiBgaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL1VuZWFydGhlZEFyY2FuYS9zdWJtaXQ/dGl0bGU9JHtlbmNvZGVVUklDb21wb25lbnQodGl0bGUpfSZ0ZXh0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRleHQpfWA7XG5cdH0sXG5cblx0cmVuZGVyU3lzdGVtcyA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIF8ubWFwKFNZU1RFTVMsICh2YWwpPT57XG5cdFx0XHRyZXR1cm4gPGxhYmVsIGtleT17dmFsfT5cblx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0dHlwZT0nY2hlY2tib3gnXG5cdFx0XHRcdFx0Y2hlY2tlZD17Xy5pbmNsdWRlcyh0aGlzLnByb3BzLm1ldGFkYXRhLnN5c3RlbXMsIHZhbCl9XG5cdFx0XHRcdFx0b25DaGFuZ2U9eyhlKT0+dGhpcy5oYW5kbGVTeXN0ZW0odmFsLCBlKX0gLz5cblx0XHRcdFx0e3ZhbH1cblx0XHRcdDwvbGFiZWw+O1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlclB1Ymxpc2ggOiBmdW5jdGlvbigpe1xuXHRcdGlmKHRoaXMucHJvcHMubWV0YWRhdGEucHVibGlzaGVkKXtcblx0XHRcdHJldHVybiA8YnV0dG9uIGNsYXNzTmFtZT0ndW5wdWJsaXNoJyBvbkNsaWNrPXsoKT0+dGhpcy5oYW5kbGVQdWJsaXNoKGZhbHNlKX0+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtYmFuJyAvPiB1bnB1Ymxpc2hcblx0XHRcdDwvYnV0dG9uPjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIDxidXR0b24gY2xhc3NOYW1lPSdwdWJsaXNoJyBvbkNsaWNrPXsoKT0+dGhpcy5oYW5kbGVQdWJsaXNoKHRydWUpfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1nbG9iZScgLz4gcHVibGlzaFxuXHRcdFx0PC9idXR0b24+O1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXJEZWxldGUgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnByb3BzLm1ldGFkYXRhLmVkaXRJZCkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBkZWxldGUnPlxuXHRcdFx0PGxhYmVsPmRlbGV0ZTwvbGFiZWw+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0ndmFsdWUnPlxuXHRcdFx0XHQ8YnV0dG9uIGNsYXNzTmFtZT0ncHVibGlzaCcgb25DbGljaz17dGhpcy5oYW5kbGVEZWxldGV9PlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtdHJhc2gnIC8+IGRlbGV0ZSBicmV3XG5cdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlckF1dGhvcnMgOiBmdW5jdGlvbigpe1xuXHRcdGxldCB0ZXh0ID0gJ05vbmUuJztcblx0XHRpZih0aGlzLnByb3BzLm1ldGFkYXRhLmF1dGhvcnMubGVuZ3RoKXtcblx0XHRcdHRleHQgPSB0aGlzLnByb3BzLm1ldGFkYXRhLmF1dGhvcnMuam9pbignLCAnKTtcblx0XHR9XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBhdXRob3JzJz5cblx0XHRcdDxsYWJlbD5hdXRob3JzPC9sYWJlbD5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSd2YWx1ZSc+XG5cdFx0XHRcdHt0ZXh0fVxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlclNoYXJlVG9SZWRkaXQgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnByb3BzLm1ldGFkYXRhLnNoYXJlSWQpIHJldHVybjtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nZmllbGQgcmVkZGl0Jz5cblx0XHRcdDxsYWJlbD5yZWRkaXQ8L2xhYmVsPlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J3ZhbHVlJz5cblx0XHRcdFx0PGEgaHJlZj17dGhpcy5nZXRSZWRkaXRMaW5rKCl9IHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInPlxuXHRcdFx0XHRcdDxidXR0b24gY2xhc3NOYW1lPSdwdWJsaXNoJz5cblx0XHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtcmVkZGl0LWFsaWVuJyAvPiBzaGFyZSB0byByZWRkaXRcblx0XHRcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0PC9hPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdtZXRhZGF0YUVkaXRvcic+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZmllbGQgdGl0bGUnPlxuXHRcdFx0XHQ8bGFiZWw+dGl0bGU8L2xhYmVsPlxuXHRcdFx0XHQ8aW5wdXQgdHlwZT0ndGV4dCcgY2xhc3NOYW1lPSd2YWx1ZSdcblx0XHRcdFx0XHR2YWx1ZT17dGhpcy5wcm9wcy5tZXRhZGF0YS50aXRsZX1cblx0XHRcdFx0XHRvbkNoYW5nZT17KGUpPT50aGlzLmhhbmRsZUZpZWxkQ2hhbmdlKCd0aXRsZScsIGUpfSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZmllbGQgZGVzY3JpcHRpb24nPlxuXHRcdFx0XHQ8bGFiZWw+ZGVzY3JpcHRpb248L2xhYmVsPlxuXHRcdFx0XHQ8dGV4dGFyZWEgdmFsdWU9e3RoaXMucHJvcHMubWV0YWRhdGEuZGVzY3JpcHRpb259IGNsYXNzTmFtZT0ndmFsdWUnXG5cdFx0XHRcdFx0b25DaGFuZ2U9eyhlKT0+dGhpcy5oYW5kbGVGaWVsZENoYW5nZSgnZGVzY3JpcHRpb24nLCBlKX0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdFx0ey8qfVxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2ZpZWxkIHRhZ3MnPlxuXHRcdFx0XHQ8bGFiZWw+dGFnczwvbGFiZWw+XG5cdFx0XHRcdDx0ZXh0YXJlYSB2YWx1ZT17dGhpcy5wcm9wcy5tZXRhZGF0YS50YWdzfVxuXHRcdFx0XHRcdG9uQ2hhbmdlPXsoZSk9PnRoaXMuaGFuZGxlRmllbGRDaGFuZ2UoJ3RhZ3MnLCBlKX0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdFx0Ki99XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdmaWVsZCBzeXN0ZW1zJz5cblx0XHRcdFx0PGxhYmVsPnN5c3RlbXM8L2xhYmVsPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0ndmFsdWUnPlxuXHRcdFx0XHRcdHt0aGlzLnJlbmRlclN5c3RlbXMoKX1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblxuXHRcdFx0e3RoaXMucmVuZGVyQXV0aG9ycygpfVxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nZmllbGQgcHVibGlzaCc+XG5cdFx0XHRcdDxsYWJlbD5wdWJsaXNoPC9sYWJlbD5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J3ZhbHVlJz5cblx0XHRcdFx0XHR7dGhpcy5yZW5kZXJQdWJsaXNoKCl9XG5cdFx0XHRcdFx0PHNtYWxsPlB1Ymxpc2hlZCBob21lYnJld3Mgd2lsbCBiZSBwdWJsaWNseSB2aWV3YWJsZSBhbmQgc2VhcmNoYWJsZSAoZXZlbnR1YWxseS4uLik8L3NtYWxsPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXG5cdFx0XHR7dGhpcy5yZW5kZXJTaGFyZVRvUmVkZGl0KCl9XG5cblx0XHRcdHt0aGlzLnJlbmRlckRlbGV0ZSgpfVxuXG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZXRhZGF0YUVkaXRvcjtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cblxuY29uc3QgU25pcHBldHMgPSByZXF1aXJlKCcuL3NuaXBwZXRzL3NuaXBwZXRzLmpzJyk7XG5cbmNvbnN0IGV4ZWN1dGUgPSBmdW5jdGlvbih2YWwsIGJyZXcpe1xuXHRpZihfLmlzRnVuY3Rpb24odmFsKSkgcmV0dXJuIHZhbChicmV3KTtcblx0cmV0dXJuIHZhbDtcbn07XG5cblxuXG5jb25zdCBTbmlwcGV0YmFyID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyAgICAgOiAnJyxcblx0XHRcdG9uSW5qZWN0IDogKCk9Pnt9LFxuXHRcdFx0b25Ub2dnbGUgOiAoKT0+e30sXG5cdFx0XHRzaG93bWV0YSA6IGZhbHNlXG5cdFx0fTtcblx0fSxcblxuXHRoYW5kbGVTbmlwcGV0Q2xpY2sgOiBmdW5jdGlvbihpbmplY3RlZFRleHQpe1xuXHRcdHRoaXMucHJvcHMub25JbmplY3QoaW5qZWN0ZWRUZXh0KTtcblx0fSxcblxuXHRyZW5kZXJTbmlwcGV0R3JvdXBzIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gXy5tYXAoU25pcHBldHMsIChzbmlwcGV0R3JvdXApPT57XG5cdFx0XHRyZXR1cm4gPFNuaXBwZXRHcm91cFxuXHRcdFx0XHRicmV3PXt0aGlzLnByb3BzLmJyZXd9XG5cdFx0XHRcdGdyb3VwTmFtZT17c25pcHBldEdyb3VwLmdyb3VwTmFtZX1cblx0XHRcdFx0aWNvbj17c25pcHBldEdyb3VwLmljb259XG5cdFx0XHRcdHNuaXBwZXRzPXtzbmlwcGV0R3JvdXAuc25pcHBldHN9XG5cdFx0XHRcdGtleT17c25pcHBldEdyb3VwLmdyb3VwTmFtZX1cblx0XHRcdFx0b25TbmlwcGV0Q2xpY2s9e3RoaXMuaGFuZGxlU25pcHBldENsaWNrfVxuXHRcdFx0Lz47XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3NuaXBwZXRCYXInPlxuXHRcdFx0e3RoaXMucmVuZGVyU25pcHBldEdyb3VwcygpfVxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e2N4KCd0b2dnbGVNZXRhJywgeyBzZWxlY3RlZDogdGhpcy5wcm9wcy5zaG93bWV0YSB9KX1cblx0XHRcdFx0b25DbGljaz17dGhpcy5wcm9wcy5vblRvZ2dsZX0+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtYmFycycgLz5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU25pcHBldGJhcjtcblxuXG5cblxuXG5cbmNvbnN0IFNuaXBwZXRHcm91cCA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJyZXcgICAgICAgICAgIDogJycsXG5cdFx0XHRncm91cE5hbWUgICAgICA6ICcnLFxuXHRcdFx0aWNvbiAgICAgICAgICAgOiAnZmEtcm9ja2V0Jyxcblx0XHRcdHNuaXBwZXRzICAgICAgIDogW10sXG5cdFx0XHRvblNuaXBwZXRDbGljayA6IGZ1bmN0aW9uKCl7fSxcblx0XHR9O1xuXHR9LFxuXHRoYW5kbGVTbmlwcGV0Q2xpY2sgOiBmdW5jdGlvbihzbmlwcGV0KXtcblx0XHR0aGlzLnByb3BzLm9uU25pcHBldENsaWNrKGV4ZWN1dGUoc25pcHBldC5nZW4sIHRoaXMucHJvcHMuYnJldykpO1xuXHR9LFxuXHRyZW5kZXJTbmlwcGV0cyA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIF8ubWFwKHRoaXMucHJvcHMuc25pcHBldHMsIChzbmlwcGV0KT0+e1xuXHRcdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdzbmlwcGV0JyBrZXk9e3NuaXBwZXQubmFtZX0gb25DbGljaz17KCk9PnRoaXMuaGFuZGxlU25pcHBldENsaWNrKHNuaXBwZXQpfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPXtgZmEgZmEtZncgJHtzbmlwcGV0Lmljb259YH0gLz5cblx0XHRcdFx0e3NuaXBwZXQubmFtZX1cblx0XHRcdDwvZGl2Pjtcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nc25pcHBldEdyb3VwJz5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSd0ZXh0Jz5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPXtgZmEgZmEtZncgJHt0aGlzLnByb3BzLmljb259YH0gLz5cblx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPSdncm91cE5hbWUnPnt0aGlzLnByb3BzLmdyb3VwTmFtZX08L3NwYW4+XG5cdFx0XHQ8L2Rpdj5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdkcm9wZG93bic+XG5cdFx0XHRcdHt0aGlzLnJlbmRlclNuaXBwZXRzKCl9XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cbn0pOyIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjbGFzc25hbWUpe1xuXG5cdGNsYXNzbmFtZSA9IF8uc2FtcGxlKFsnYXJjaGl2aXN0JywgJ2ZhbmN5bWFuJywgJ2xpbmd1aXN0JywgJ2ZsZXRjaGVyJyxcblx0XHQnbm90YXJ5JywgJ2JlcnNlcmtlci10eXBpc3QnLCAnZmlzaG1vbmdlcmVyJywgJ21hbmljdXJpc3QnLCAnaGFiZXJkYXNoZXInLCAnY29uY2llcmdlJ10pO1xuXG5cdGNsYXNzbmFtZSA9IGNsYXNzbmFtZS50b0xvd2VyQ2FzZSgpO1xuXG5cdGNvbnN0IGhpdERpZSA9IF8uc2FtcGxlKFs0LCA2LCA4LCAxMCwgMTJdKTtcblxuXHRjb25zdCBhYmlsaXR5TGlzdCA9IFsnU3RyZW5ndGgnLCAnRGV4ZXJpdHknLCAnQ29uc3RpdHV0aW9uJywgJ1dpc2RvbScsICdDaGFyaXNtYScsICdJbnRlbGxpZ2VuY2UnXTtcblx0Y29uc3Qgc2tpbGxMaXN0ID0gWydBY3JvYmF0aWNzICcsICdBbmltYWwgSGFuZGxpbmcnLCAnQXJjYW5hJywgJ0F0aGxldGljcycsICdEZWNlcHRpb24nLCAnSGlzdG9yeScsICdJbnNpZ2h0JywgJ0ludGltaWRhdGlvbicsICdJbnZlc3RpZ2F0aW9uJywgJ01lZGljaW5lJywgJ05hdHVyZScsICdQZXJjZXB0aW9uJywgJ1BlcmZvcm1hbmNlJywgJ1BlcnN1YXNpb24nLCAnUmVsaWdpb24nLCAnU2xlaWdodCBvZiBIYW5kJywgJ1N0ZWFsdGgnLCAnU3Vydml2YWwnXTtcblxuXG5cdHJldHVybiBbXG5cdFx0JyMjIENsYXNzIEZlYXR1cmVzJyxcblx0XHRgQXMgYSAke2NsYXNzbmFtZX0sIHlvdSBnYWluIHRoZSBmb2xsb3dpbmcgY2xhc3MgZmVhdHVyZXNgLFxuXHRcdCcjIyMjIEhpdCBQb2ludHMnLFxuXHRcdCdfX18nLFxuXHRcdGAtICoqSGl0IERpY2U6KiogMWQke2hpdERpZX0gcGVyICR7Y2xhc3NuYW1lfSBsZXZlbGAsXG5cdFx0YC0gKipIaXQgUG9pbnRzIGF0IDFzdCBMZXZlbDoqKiAke2hpdERpZX0gKyB5b3VyIENvbnN0aXR1dGlvbiBtb2RpZmllcmAsXG5cdFx0YC0gKipIaXQgUG9pbnRzIGF0IEhpZ2hlciBMZXZlbHM6KiogMWQke2hpdERpZX0gKG9yICR7aGl0RGllLzIgKyAxfSkgKyB5b3VyIENvbnN0aXR1dGlvbiBtb2RpZmllciBwZXIgJHtjbGFzc25hbWV9IGxldmVsIGFmdGVyIDFzdGAsXG5cdFx0JycsXG5cdFx0JyMjIyMgUHJvZmljaWVuY2llcycsXG5cdFx0J19fXycsXG5cdFx0YC0gKipBcm1vcjoqKiAke18uc2FtcGxlU2l6ZShbJ0xpZ2h0IGFybW9yJywgJ01lZGl1bSBhcm1vcicsICdIZWF2eSBhcm1vcicsICdTaGllbGRzJ10sIF8ucmFuZG9tKDAsIDMpKS5qb2luKCcsICcpIHx8ICdOb25lJ31gLFxuXHRcdGAtICoqV2VhcG9uczoqKiAke18uc2FtcGxlU2l6ZShbJ1NxdWVlZ2VlJywgJ1J1YmJlciBDaGlja2VuJywgJ1NpbXBsZSB3ZWFwb25zJywgJ01hcnRpYWwgd2VhcG9ucyddLCBfLnJhbmRvbSgwLCAyKSkuam9pbignLCAnKSB8fCAnTm9uZSd9YCxcblx0XHRgLSAqKlRvb2xzOioqICR7Xy5zYW1wbGVTaXplKFsnQXJ0aWFuXFwncyB0b29scycsICdvbmUgbXVzaWNhbCBpbnN0cnVtZW50JywgJ1RoaWV2ZVxcJ3MgdG9vbHMnXSwgXy5yYW5kb20oMCwgMikpLmpvaW4oJywgJykgfHwgJ05vbmUnfWAsXG5cdFx0JycsXG5cdFx0J19fXycsXG5cdFx0YC0gKipTYXZpbmcgVGhyb3dzOioqICR7Xy5zYW1wbGVTaXplKGFiaWxpdHlMaXN0LCAyKS5qb2luKCcsICcpfWAsXG5cdFx0YC0gKipTa2lsbHM6KiogQ2hvb3NlIHR3byBmcm9tICR7Xy5zYW1wbGVTaXplKHNraWxsTGlzdCwgXy5yYW5kb20oNCwgNikpLmpvaW4oJywgJyl9YCxcblx0XHQnJyxcblx0XHQnIyMjIyBFcXVpcG1lbnQnLFxuXHRcdCdZb3Ugc3RhcnQgd2l0aCB0aGUgZm9sbG93aW5nIGVxdWlwbWVudCwgaW4gYWRkaXRpb24gdG8gdGhlIGVxdWlwbWVudCBncmFudGVkIGJ5IHlvdXIgYmFja2dyb3VuZDonLFxuXHRcdCctICooYSkqIGEgbWFydGlhbCB3ZWFwb24gYW5kIGEgc2hpZWxkIG9yICooYikqIHR3byBtYXJ0aWFsIHdlYXBvbnMnLFxuXHRcdCctICooYSkqIGZpdmUgamF2ZWxpbnMgb3IgKihiKSogYW55IHNpbXBsZSBtZWxlZSB3ZWFwb24nLFxuXHRcdGAtICR7Xy5zYW1wbGUoWycxMCBsaW50IGZsdWZmcycsICcxIGJ1dHRvbicsICdhIGNoZXJpc2hlZCBsb3N0IHNvY2snXSl9YCxcblx0XHQnXFxuXFxuXFxuJ1xuXHRdLmpvaW4oJ1xcbicpO1xufTtcbiIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3QgZmVhdHVyZXMgPSBbXG5cdCdBc3Ryb2xvZ2ljYWwgQm90YW55Jyxcblx0J0FzdHJvbG9naWNhbCBDaGVtaXN0cnknLFxuXHQnQmlvY2hlbWljYWwgU29yY2VyeScsXG5cdCdDaXZpbCBBbGNoZW15Jyxcblx0J0NvbnNlY3JhdGVkIEJpb2NoZW1pc3RyeScsXG5cdCdEZW1vbmljIEFudGhyb3BvbG9neScsXG5cdCdEaXZpbmF0b3J5IE1pbmVyYWxvZ3knLFxuXHQnR2VuZXRpYyBCYW5pc2hpbmcnLFxuXHQnSGVybWV0aWMgR2VvZ3JhcGh5Jyxcblx0J0ltbXVub2xvZ2ljYWwgSW5jYW50YXRpb25zJyxcblx0J051Y2xlYXIgSWxsdXNpb25pc20nLFxuXHQnUml0dWFsIEFzdHJvbm9teScsXG5cdCdTZWlzbW9sb2dpY2FsIERpdmluYXRpb24nLFxuXHQnU3Bpcml0dWFsIEJpb2NoZW1pc3RyeScsXG5cdCdTdGF0aXN0aWNhbCBPY2N1bHRpc20nLFxuXHQnUG9saWNlIE5lY3JvbWFuY2VyJyxcblx0J1NpeGd1biBQb2lzb25lcicsXG5cdCdQaGFybWFjZXV0aWNhbCBHdW5zbGluZ2VyJyxcblx0J0luZmVybmFsIEJhbmtlcicsXG5cdCdTcGVsbCBBbmFseXN0Jyxcblx0J0d1bnNsaW5nZXIgQ29ycnVwdG9yJyxcblx0J1RvcnF1ZSBJbnRlcmZhY2VyJyxcblx0J0V4byBJbnRlcmZhY2VyJyxcblx0J0d1bnBvd2RlciBUb3J0dXJlcicsXG5cdCdPcmJpdGFsIEdyYXZlZGlnZ2VyJyxcblx0J1BoYXNlZCBMaW5ndWlzdCcsXG5cdCdNYXRoZW1hdGljYWwgUGhhcm1hY2lzdCcsXG5cdCdQbGFzbWEgT3V0bGF3Jyxcblx0J01hbGVmaWMgQ2hlbWlzdCcsXG5cdCdQb2xpY2UgQ3VsdGlzdCdcbl07XG5cbmNvbnN0IGNsYXNzbmFtZXMgPSBbJ0FyY2hpdmlzdCcsICdGYW5jeW1hbicsICdMaW5ndWlzdCcsICdGbGV0Y2hlcicsXG5cdCdOb3RhcnknLCAnQmVyc2Vya2VyLVR5cGlzdCcsICdGaXNobW9uZ2VyZXInLCAnTWFuaWN1cmlzdCcsICdIYWJlcmRhc2hlcicsICdDb25jaWVyZ2UnXTtcblxuY29uc3QgbGV2ZWxzID0gWycxc3QnLCAnMm5kJywgJzNyZCcsICc0dGgnLCAnNXRoJywgJzZ0aCcsICc3dGgnLCAnOHRoJywgJzl0aCcsICcxMHRoJywgJzExdGgnLCAnMTJ0aCcsICcxM3RoJywgJzE0dGgnLCAnMTV0aCcsICcxNnRoJywgJzE3dGgnLCAnMTh0aCcsICcxOXRoJywgJzIwdGgnXTtcblxuY29uc3QgcHJvZkJvbnVzID0gWzIsIDIsIDIsIDIsIDMsIDMsIDMsIDMsIDQsIDQsIDQsIDQsIDUsIDUsIDUsIDUsIDYsIDYsIDYsIDZdO1xuXG5jb25zdCBnZXRGZWF0dXJlID0gKGxldmVsKT0+e1xuXHRsZXQgcmVzID0gW107XG5cdGlmKF8uaW5jbHVkZXMoWzQsIDYsIDgsIDEyLCAxNCwgMTYsIDE5XSwgbGV2ZWwrMSkpe1xuXHRcdHJlcyA9IFsnQWJpbGl0eSBTY29yZSBJbXByb3ZlbWVudCddO1xuXHR9XG5cdHJlcyA9IF8udW5pb24ocmVzLCBfLnNhbXBsZVNpemUoZmVhdHVyZXMsIF8uc2FtcGxlKFswLCAxLCAxLCAxLCAxLCAxXSkpKTtcblx0aWYoIXJlcy5sZW5ndGgpIHJldHVybiAn4pSAJztcblx0cmV0dXJuIHJlcy5qb2luKCcsICcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGZ1bGwgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGNsYXNzbmFtZSA9IF8uc2FtcGxlKGNsYXNzbmFtZXMpO1xuXG5cdFx0Y29uc3QgbWF4ZXMgPSBbNCwgMywgMywgMywgMywgMiwgMiwgMSwgMV07XG5cdFx0Y29uc3QgZHJhd1Nsb3RzID0gZnVuY3Rpb24oU2xvdHMpe1xuXHRcdFx0bGV0IHNsb3RzID0gTnVtYmVyKFNsb3RzKTtcblx0XHRcdHJldHVybiBfLnRpbWVzKDksIGZ1bmN0aW9uKGkpe1xuXHRcdFx0XHRjb25zdCBtYXggPSBtYXhlc1tpXTtcblx0XHRcdFx0aWYoc2xvdHMgPCAxKSByZXR1cm4gJ+KAlCc7XG5cdFx0XHRcdGNvbnN0IHJlcyA9IF8ubWluKFttYXgsIHNsb3RzXSk7XG5cdFx0XHRcdHNsb3RzIC09IHJlcztcblx0XHRcdFx0cmV0dXJuIHJlcztcblx0XHRcdH0pLmpvaW4oJyB8ICcpO1xuXHRcdH07XG5cblxuXHRcdGxldCBjYW50cmlwcyA9IDM7XG5cdFx0bGV0IHNwZWxscyA9IDE7XG5cdFx0bGV0IHNsb3RzID0gMjtcblx0XHRyZXR1cm4gYDxkaXYgY2xhc3M9J2NsYXNzVGFibGUgd2lkZSc+XFxuIyMjIyMgVGhlICR7Y2xhc3NuYW1lfVxcbmAgK1xuXHRcdGB8IExldmVsIHwgUHJvZmljaWVuY3kgQm9udXMgfCBGZWF0dXJlcyB8IENhbnRyaXBzIEtub3duIHwgU3BlbGxzIEtub3duIHwgMXN0IHwgMm5kIHwgM3JkIHwgNHRoIHwgNXRoIHwgNnRoIHwgN3RoIHwgOHRoIHwgOXRoIHxcXG5gK1xuXHRcdGB8Oi0tLTp8Oi0tLTp8Oi0tLXw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnw6LS0tOnxcXG4ke1xuXHRcdFx0Xy5tYXAobGV2ZWxzLCBmdW5jdGlvbihsZXZlbE5hbWUsIGxldmVsKXtcblx0XHRcdFx0Y29uc3QgcmVzID0gW1xuXHRcdFx0XHRcdGxldmVsTmFtZSxcblx0XHRcdFx0XHRgKyR7cHJvZkJvbnVzW2xldmVsXX1gLFxuXHRcdFx0XHRcdGdldEZlYXR1cmUobGV2ZWwpLFxuXHRcdFx0XHRcdGNhbnRyaXBzLFxuXHRcdFx0XHRcdHNwZWxscyxcblx0XHRcdFx0XHRkcmF3U2xvdHMoc2xvdHMpXG5cdFx0XHRcdF0uam9pbignIHwgJyk7XG5cblx0XHRcdFx0Y2FudHJpcHMgKz0gXy5yYW5kb20oMCwgMSk7XG5cdFx0XHRcdHNwZWxscyArPSBfLnJhbmRvbSgwLCAxKTtcblx0XHRcdFx0c2xvdHMgKz0gXy5yYW5kb20oMCwgMik7XG5cblx0XHRcdFx0cmV0dXJuIGB8ICR7cmVzfSB8YDtcblx0XHRcdH0pLmpvaW4oJ1xcbicpfVxcbjwvZGl2PlxcblxcbmA7XG5cdH0sXG5cblx0aGFsZiA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgY2xhc3NuYW1lID0gIF8uc2FtcGxlKGNsYXNzbmFtZXMpO1xuXG5cdFx0bGV0IGZlYXR1cmVTY29yZSA9IDE7XG5cdFx0cmV0dXJuIGA8ZGl2IGNsYXNzPSdjbGFzc1RhYmxlJz5cXG4jIyMjIyBUaGUgJHtjbGFzc25hbWV9XFxuYCArXG5cdFx0YHwgTGV2ZWwgfCBQcm9maWNpZW5jeSBCb251cyB8IEZlYXR1cmVzIHwgJHtfLnNhbXBsZShmZWF0dXJlcyl9fFxcbmAgK1xuXHRcdGB8Oi0tLTp8Oi0tLTp8Oi0tLXw6LS0tOnxcXG4ke1xuXHRcdFx0Xy5tYXAobGV2ZWxzLCBmdW5jdGlvbihsZXZlbE5hbWUsIGxldmVsKXtcblx0XHRcdFx0Y29uc3QgcmVzID0gW1xuXHRcdFx0XHRcdGxldmVsTmFtZSxcblx0XHRcdFx0XHRgKyR7cHJvZkJvbnVzW2xldmVsXX1gLFxuXHRcdFx0XHRcdGdldEZlYXR1cmUobGV2ZWwpLFxuXHRcdFx0XHRcdGArJHtmZWF0dXJlU2NvcmV9YFxuXHRcdFx0XHRdLmpvaW4oJyB8ICcpO1xuXG5cdFx0XHRcdGZlYXR1cmVTY29yZSArPSBfLnJhbmRvbSgwLCAxKTtcblxuXHRcdFx0XHRyZXR1cm4gYHwgJHtyZXN9IHxgO1xuXHRcdFx0fSkuam9pbignXFxuJyl9XFxuPC9kaXY+XFxuXFxuYDtcblx0fVxufTsiLCJjb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmNvbnN0IHRpdGxlcyA9IFtcblx0J1RoZSBCdXJuaW5nIEdhbGxvd3MnLFxuXHQnVGhlIFJpbmcgb2YgTmVubGFzdCcsXG5cdCdCZWxvdyB0aGUgQmxpbmQgVGF2ZXJuJyxcblx0J0JlbG93IHRoZSBIdW5nZXJpbmcgUml2ZXInLFxuXHQnQmVmb3JlIEJhaGFtdXRcXCdzIExhbmQnLFxuXHQnVGhlIENydWVsIEdyYXZlIGZyb20gV2l0aGluJyxcblx0J1RoZSBTdHJlbmd0aCBvZiBUcmFkZSBSb2FkJyxcblx0J1Rocm91Z2ggVGhlIFJhdmVuIFF1ZWVuXFwncyBXb3JsZHMnLFxuXHQnV2l0aGluIHRoZSBTZXR0bGVtZW50Jyxcblx0J1RoZSBDcm93biBmcm9tIFdpdGhpbicsXG5cdCdUaGUgTWVyY2hhbnQgV2l0aGluIHRoZSBCYXR0bGVmaWVsZCcsXG5cdCdJb3VuXFwncyBGYWRpbmcgVHJhdmVsZXInLFxuXHQnVGhlIExlZ2lvbiBJbmdyZWRpZW50Jyxcblx0J1RoZSBFeHBsb3JlciBMdXJlJyxcblx0J0JlZm9yZSB0aGUgQ2hhcm1pbmcgQmFkbGFuZHMnLFxuXHQnVGhlIExpdmluZyBEZWFkIEFib3ZlIHRoZSBGZWFyZnVsIENhZ2UnLFxuXHQnVmVjbmFcXCdzIEhpZGRlbiBTYWdlJyxcblx0J0JhaGFtdXRcXCdzIERlbW9uc3Bhd24nLFxuXHQnQWNyb3NzIEdydXVtc2hcXCdzIEVsZW1lbnRhbCBDaGFvcycsXG5cdCdUaGUgQmxhZGUgb2YgT3JjdXMnLFxuXHQnQmV5b25kIFJldmVuZ2UnLFxuXHQnQnJhaW4gb2YgSW5zYW5pdHknLFxuXHQnQnJlZWQgQmF0dGxlISwgQSBOZXcgQmVnaW5uaW5nJyxcblx0J0V2aWwgTGFrZSwgQSBOZXcgQmVnaW5uaW5nJyxcblx0J0ludmFzaW9uIG9mIHRoZSBHaWdhbnRpYyBDYXQsIFBhcnQgSUknLFxuXHQnS3Jha2VuIFdhciAyMDIwJyxcblx0J1RoZSBCb2R5IFdoaXNwZXJlcnMnLFxuXHQnVGhlIERpYWJvbGljYWwgVGFsZXMgb2YgdGhlIEFwZS1Xb21lbicsXG5cdCdUaGUgRG9jdG9yIEltbW9ydGFsJyxcblx0J1RoZSBEb2N0b3IgZnJvbSBIZWF2ZW4nLFxuXHQnVGhlIEdyYXZleWFyZCcsXG5cdCdBenVyZSBDb3JlJyxcblx0J0NvcmUgQmF0dGxlJyxcblx0J0NvcmUgb2YgSGVhdmVuOiBUaGUgR3VhcmRpYW4gb2YgQW1hemVtZW50Jyxcblx0J0RlYWRseSBBbWF6ZW1lbnQgSUlJJyxcblx0J0RyeSBDaGFvcyBJWCcsXG5cdCdHYXRlIFRodW5kZXInLFxuXHQnR3VhcmRpYW46IFNraWVzIG9mIHRoZSBEYXJrIFdpemFyZCcsXG5cdCdMdXRlIG9mIEV0ZXJuaXR5Jyxcblx0J01lcmN1cnlcXCdzIFBsYW5ldDogQnJhdmUgRXZvbHV0aW9uJyxcblx0J1J1Ynkgb2YgQXRsYW50aXM6IFRoZSBRdWFrZSBvZiBQZWFjZScsXG5cdCdTa3kgb2YgWmVsZGE6IFRoZSBUaHVuZGVyIG9mIEZvcmNlJyxcblx0J1Z5c2VcXCdzIFNraWVzJyxcblx0J1doaXRlIEdyZWF0bmVzcyBJSUknLFxuXHQnWWVsbG93IERpdmluaXR5Jyxcblx0J1ppZGFuZVxcJ3MgR2hvc3QnXG5dO1xuXG5jb25zdCBzdWJ0aXRsZXMgPSBbXG5cdCdJbiBhbiBvbWlub3VzIHVuaXZlcnNlLCBhIGJvdGFuaXN0IG9wcG9zZXMgdGVycm9yaXNtLicsXG5cdCdJbiBhIGRlbW9uLWhhdW50ZWQgY2l0eSwgaW4gYW4gYWdlIG9mIGxpZXMgYW5kIGhhdGUsIGEgcGh5c2ljaXN0IHRyaWVzIHRvIGZpbmQgYW4gYW5jaWVudCB0cmVhc3VyZSBhbmQgYmF0dGxlcyBhIG1vYiBvZiBhbGllbnMuJyxcblx0J0luIGEgbGFuZCBvZiBjb3JydXB0aW9uLCB0d28gY3liZXJuZXRpY2lzdHMgYW5kIGEgZHVuZ2VvbiBkZWx2ZXIgc2VhcmNoIGZvciBmcmVlZG9tLicsXG5cdCdJbiBhbiBldmlsIGVtcGlyZSBvZiBob3Jyb3IsIHR3byByYW5nZXJzIGJhdHRsZSB0aGUgZm9yY2VzIG9mIGhlbGwuJyxcblx0J0luIGEgbG9zdCBjaXR5LCBpbiBhbiBhZ2Ugb2Ygc29yY2VyeSwgYSBsaWJyYXJpYW4gcXVlc3RzIGZvciByZXZlbmdlLicsXG5cdCdJbiBhIHVuaXZlcnNlIG9mIGlsbHVzaW9ucyBhbmQgZGFuZ2VyLCB0aHJlZSB0aW1lIHRyYXZlbGxlcnMgYW5kIGFuIGFkdmVudHVyZXIgc2VhcmNoIGZvciBqdXN0aWNlLicsXG5cdCdJbiBhIGZvcmdvdHRlbiB1bml2ZXJzZSBvZiBiYXJiYXJpc20sIGluIGFuIGVyYSBvZiB0ZXJyb3IgYW5kIG15c3RpY2lzbSwgYSB2aXJ0dWFsIHJlYWxpdHkgcHJvZ3JhbW1lciBhbmQgYSBzcHkgdHJ5IHRvIGZpbmQgdmVuZ2FuY2UgYW5kIGJhdHRsZSBjcmltZS4nLFxuXHQnSW4gYSB1bml2ZXJzZSBvZiBkZW1vbnMsIGluIGFuIGVyYSBvZiBpbnNhbml0eSBhbmQgZ2hvc3RzLCB0aHJlZSBib2R5Z3VhcmRzIGFuZCBhIGJvZHlndWFyZCB0cnkgdG8gZmluZCB2ZW5nYW5jZS4nLFxuXHQnSW4gYSBraW5nZG9tIG9mIGNvcnJ1cHRpb24gYW5kIGJhdHRsZSwgc2V2ZW4gYXJ0aWZpY2lhbCBpbnRlbGxpZ2VuY2VzIHRyeSB0byBzYXZlIHRoZSBsYXN0IGxpdmluZyBmZXJ0aWxlIHdvbWFuLicsXG5cdCdJbiBhIHVuaXZlcnNlIG9mIHZpcnV0YWwgcmVhbGl0eSBhbmQgYWdvbnksIGluIGFuIGFnZSBvZiBnaG9zdHMgYW5kIGdob3N0cywgYSBmb3J0dW5lLXRlbGxlciBhbmQgYSB3YW5kZXJlciB0cnkgdG8gYXZlcnQgdGhlIGFwb2NhbHlwc2UuJyxcblx0J0luIGEgY3JpbWUtaW5mZXN0ZWQga2luZ2RvbSwgdGhyZWUgbWFydGlhbCBhcnRpc3RzIHF1ZXN0IGZvciB0aGUgdHJ1dGggYW5kIG9wcG9zZSBldmlsLicsXG5cdCdJbiBhIHRlcnJpZnlpbmcgdW5pdmVyc2Ugb2YgbG9zdCBzb3VscywgaW4gYW4gZXJhIG9mIGxvc3Qgc291bHMsIGVpZ2h0IGRhbmNlcnMgZmlnaHQgZXZpbC4nLFxuXHQnSW4gYSBnYWxheHkgb2YgY29uZnVzaW9uIGFuZCBpbnNhbml0eSwgdGhyZWUgbWFydGlhbCBhcnRpc3RzIGFuZCBhIGR1a2UgYmF0dGxlIGEgbW9iIG9mIHBzeWNoaWNzLicsXG5cdCdJbiBhbiBhbWF6aW5nIGtpbmdkb20sIGEgd2l6YXJkIGFuZCBhIHNlY3JldGFyeSBob3BlIHRvIHByZXZlbnQgdGhlIGRlc3RydWN0aW9uIG9mIG1hbmtpbmQuJyxcblx0J0luIGEga2luZ2RvbSBvZiBkZWNlcHRpb24sIGEgcmVwb3J0ZXIgc2VhcmNoZXMgZm9yIGZhbWUuJyxcblx0J0luIGEgaGVsbGlzaCBlbXBpcmUsIGEgc3dvcmRzd29tYW4gYW5kIGEgZHVrZSB0cnkgdG8gZmluZCB0aGUgdWx0aW1hdGUgd2VhcG9uIGFuZCBiYXR0bGUgYSBjb25zcGlyYWN5LicsXG5cdCdJbiBhbiBldmlsIGdhbGF4eSBvZiBpbGx1c2lvbiwgaW4gYSB0aW1lIG9mIHRlY2hub2xvZ3kgYW5kIG1pc2VyeSwgc2V2ZW4gcHN5Y2hpYXRyaXN0cyBiYXR0bGUgY3JpbWUuJyxcblx0J0luIGEgZGFyayBjaXR5IG9mIGNvbmZ1c2lvbiwgdGhyZWUgc3dvcmRzd29tZW4gYW5kIGEgc2luZ2VyIGJhdHRsZSBsYXdsZXNzbmVzcy4nLFxuXHQnSW4gYW4gb21pbm91cyBlbXBpcmUsIGluIGFuIGFnZSBvZiBoYXRlLCB0d28gcGhpbG9zb3BoZXJzIGFuZCBhIHN0dWRlbnQgdHJ5IHRvIGZpbmQganVzdGljZSBhbmQgYmF0dGxlIGEgbW9iIG9mIG1hZ2VzIGludGVudCBvbiBzdGVhbGluZyB0aGUgc291bHMgb2YgdGhlIGlubm9jZW50LicsXG5cdCdJbiBhIGtpbmdkb20gb2YgcGFuaWMsIHNpeCBhZHZlbnR1cmVycyBvcHBvc2UgbGF3bGVzc25lc3MuJyxcblx0J0luIGEgbGFuZCBvZiBkcmVhbXMgYW5kIGhvcGVsZXNzbmVzcywgdGhyZWUgaGFja2VycyBhbmQgYSBjeWJvcmcgc2VhcmNoIGZvciBqdXN0aWNlLicsXG5cdCdPbiBhIHBsYW5ldCBvZiBteXN0aWNpc20sIHRocmVlIHRyYXZlbGVycyBhbmQgYSBmaXJlIGZpZ2h0ZXIgcXVlc3QgZm9yIHRoZSB1bHRpbWF0ZSB3ZWFwb24gYW5kIG9wcG9zZSBldmlsLicsXG5cdCdJbiBhIHdpY2tlZCB1bml2ZXJzZSwgZml2ZSBzZWVycyBmaWdodCBsYXdsZXNzbmVzcy4nLFxuXHQnSW4gYSBraW5nZG9tIG9mIGRlYXRoLCBpbiBhbiBlcmEgb2YgaWxsdXNpb24gYW5kIGJsb29kLCBmb3VyIGNvbG9uaXN0cyBzZWFyY2ggZm9yIGZhbWUuJyxcblx0J0luIGFuIGFtYXppbmcga2luZ2RvbSwgaW4gYW4gYWdlIG9mIHNvcmNlcnkgYW5kIGxvc3Qgc291bHMsIGVpZ2h0IHNwYWNlIHBpcmF0ZXMgcXVlc3QgZm9yIGZyZWVkb20uJyxcblx0J0luIGEgY3Vyc2VkIGVtcGlyZSwgZml2ZSBpbnZlbnRvcnMgb3Bwb3NlIHRlcnJvcmlzbS4nLFxuXHQnT24gYSBjcmltZS1yaWRkZW4gcGxhbmV0IG9mIGNvbnNwaXJhY3ksIGEgd2F0Y2htYW4gYW5kIGFuIGFydGlmaWNpYWwgaW50ZWxsaWdlbmNlIHRyeSB0byBmaW5kIGxvdmUgYW5kIG9wcG9zZSBsYXdsZXNzbmVzcy4nLFxuXHQnSW4gYSBmb3Jnb3R0ZW4gbGFuZCwgYSByZXBvcnRlciBhbmQgYSBzcHkgdHJ5IHRvIHN0b3AgdGhlIGFwb2NhbHlwc2UuJyxcblx0J0luIGEgZm9yYmlkZGVuIGxhbmQgb2YgcHJvcGhlY3ksIGEgc2NpZW50aXN0IGFuZCBhbiBhcmNoaXZpc3Qgb3Bwb3NlIGEgY2FiYWwgb2YgYmFyYmFyaWFucyBpbnRlbnQgb24gc3RlYWxpbmcgdGhlIHNvdWxzIG9mIHRoZSBpbm5vY2VudC4nLFxuXHQnT24gYW4gaW5mZXJuYWwgd29ybGQgb2YgaWxsdXNpb24sIGEgZ3JhdmUgcm9iYmVyIGFuZCBhIHdhdGNobWFuIHRyeSB0byBmaW5kIHJldmVuZ2UgYW5kIGNvbWJhdCBhIHN5bmRpY2F0ZSBvZiBtYWdlcyBpbnRlbnQgb24gc3RlYWxpbmcgdGhlIHNvdXJjZSBvZiBhbGwgbWFnaWMuJyxcblx0J0luIGEgZ2FsYXh5IG9mIGRhcmsgbWFnaWMsIGZvdXIgZmlnaHRlcnMgc2VlayBmcmVlZG9tLicsXG5cdCdJbiBhbiBlbXBpcmUgb2YgZGVjZXB0aW9uLCBzaXggdG9tYi1yb2JiZXJzIHF1ZXN0IGZvciB0aGUgdWx0aW1hdGUgd2VhcG9uIGFuZCBjb21iYXQgYW4gYXJteSBvZiByYWlkZXJzLicsXG5cdCdJbiBhIGtpbmdkb20gb2YgY29ycnVwdGlvbiBhbmQgbG9zdCBzb3VscywgaW4gYW4gYWdlIG9mIHBhbmljLCBlaWdodCBwbGFuZXRvbG9naXN0cyBvcHBvc2UgZXZpbC4nLFxuXHQnSW4gYSBnYWxheHkgb2YgbWlzZXJ5IGFuZCBob3BlbGVzc25lc3MsIGluIGEgdGltZSBvZiBhZ29ueSBhbmQgcGFpbiwgZml2ZSBwbGFuZXRvbG9naXN0cyBzZWFyY2ggZm9yIHZlbmdhbmNlLicsXG5cdCdJbiBhIHVuaXZlcnNlIG9mIHRlY2hub2xvZ3kgYW5kIGluc2FuaXR5LCBpbiBhIHRpbWUgb2Ygc29yY2VyeSwgYSBjb21wdXRlciB0ZWNoaWNpYW4gcXVlc3RzIGZvciBob3BlLicsXG5cdCdPbiBhIHBsYW5ldCBvZiBkYXJrIG1hZ2ljIGFuZCBiYXJiYXJpc20sIGluIGFuIGFnZSBvZiBob3Jyb3IgYW5kIGJsYXNwaGVteSwgc2V2ZW4gbGlicmFyaWFucyBzZWFyY2ggZm9yIGZhbWUuJyxcblx0J0luIGFuIGVtcGlyZSBvZiBkYXJrIG1hZ2ljLCBpbiBhIHRpbWUgb2YgYmxvb2QgYW5kIGlsbHVzaW9ucywgZm91ciBtb25rcyB0cnkgdG8gZmluZCB0aGUgdWx0aW1hdGUgd2VhcG9uIGFuZCBjb21iYXQgdGVycm9yaXNtLicsXG5cdCdJbiBhIGZvcmdvdHRlbiBlbXBpcmUgb2YgZGFyayBtYWdpYywgc2l4IGtpbmdzIHRyeSB0byBwcmV2ZW50IHRoZSBkZXN0cnVjdGlvbiBvZiBtYW5raW5kLicsXG5cdCdJbiBhIGdhbGF4eSBvZiBkYXJrIG1hZ2ljIGFuZCBob3Jyb3IsIGluIGFuIGFnZSBvZiBob3BlbGVzc25lc3MsIGZvdXIgbWFyaW5lcyBhbmQgYW4gb3V0bGF3IGNvbWJhdCBldmlsLicsXG5cdCdJbiBhIG15c3RlcmlvdXMgY2l0eSBvZiBpbGx1c2lvbiwgaW4gYW4gYWdlIG9mIGNvbXB1dGVyaXphdGlvbiwgYSB3aXRjaC1odW50ZXIgdHJpZXMgdG8gZmluZCB0aGUgdWx0aW1hdGUgd2VhcG9uIGFuZCBvcHBvc2VzIGFuIGV2aWwgY29ycG9yYXRpb24uJyxcblx0J0luIGEgZGFtbmVkIGtpbmdkb20gb2YgdGVjaG5vbG9neSwgYSB2aXJ0dWFsIHJlYWxpdHkgcHJvZ3JhbW1lciBhbmQgYSBmaWdodGVyIHNlZWsgZmFtZS4nLFxuXHQnSW4gYSBoZWxsaXNoIGtpbmdkb20sIGluIGFuIGFnZSBvZiBibGFzcGhlbXkgYW5kIGJsYXNwaGVteSwgYW4gYXN0cm9sb2dlciBzZWFyY2hlcyBmb3IgZmFtZS4nLFxuXHQnSW4gYSBkYW1uZWQgd29ybGQgb2YgZGV2aWxzLCBhbiBhbGllbiBhbmQgYSByYW5nZXIgcXVlc3QgZm9yIGxvdmUgYW5kIG9wcG9zZSBhIHN5bmRpY2F0ZSBvZiBkZW1vbnMuJyxcblx0J0luIGEgY3Vyc2VkIGdhbGF4eSwgaW4gYSB0aW1lIG9mIHBhaW4sIHNldmVuIGxpYnJhcmlhbnMgaG9wZSB0byBhdmVydCB0aGUgYXBvY2FseXBzZS4nLFxuXHQnSW4gYSBjcmltZS1pbmZlc3RlZCBnYWxheHksIGluIGFuIGVyYSBvZiBob3BlbGVzc25lc3MgYW5kIHBhbmljLCB0aHJlZSBjaGFtcGlvbnMgYW5kIGEgZ3JhdmUgcm9iYmVyIHRyeSB0byBzb2x2ZSB0aGUgdWx0aW1hdGUgY3JpbWUuJ1xuXTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpPT57XG5cdHJldHVybiBgPHN0eWxlPlxuICAuYWdlI3AxeyB0ZXh0LWFsaWduOmNlbnRlcjsgfVxuICAuYWdlI3AxOmFmdGVyeyBkaXNwbGF5Om5vbmU7IH1cbjwvc3R5bGU+XG5cbjxkaXYgc3R5bGU9J21hcmdpbi10b3A6NDUwcHg7Jz48L2Rpdj5cblxuIyAke18uc2FtcGxlKHRpdGxlcyl9XG5cbjxkaXYgc3R5bGU9J21hcmdpbi10b3A6MjVweCc+PC9kaXY+XG48ZGl2IGNsYXNzPSd3aWRlJz5cbiMjIyMjICR7Xy5zYW1wbGUoc3VidGl0bGVzKX1cbjwvZGl2PlxuXG5cXFxccGFnZWA7XG59OyIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3Qgc3BlbGxOYW1lcyA9IFtcblx0J0FzdHJhbCBSaXRlIG9mIEFjbmUnLFxuXHQnQ3JlYXRlIEFjbmUnLFxuXHQnQ3Vyc2VkIFJhbWVuIEVycnVwdGlvbicsXG5cdCdEYXJrIENoYW50IG9mIHRoZSBEZW50aXN0cycsXG5cdCdFcnJ1cHRpb24gb2YgSW1tYXR1cml0eScsXG5cdCdGbGFtaW5nIERpc2Mgb2YgSW5jb252ZW5pZW5jZScsXG5cdCdIZWFsIEJhZCBIeWdlbmUnLFxuXHQnSGVhdmVubHkgVHJhbnNmaWd1cmF0aW9uIG9mIHRoZSBDcmVhbSBEZXZpbCcsXG5cdCdIZWxsaXNoIENhZ2Ugb2YgTXVjdXMnLFxuXHQnSXJyaXRhdGUgUGVhbnV0IEJ1dHRlciBGYWlyeScsXG5cdCdMdW1pbm91cyBFcnJ1cHRpb24gb2YgVGVhJyxcblx0J015c3RpYyBTcGVsbCBvZiB0aGUgUG9zZXInLFxuXHQnU29yY2Vyb3VzIEVuY2hhbnRtZW50IG9mIHRoZSBDaGltbmV5c3dlZXAnLFxuXHQnU3RlYWsgU2F1Y2UgUmF5Jyxcblx0J1RhbGsgdG8gR3JvdXBpZScsXG5cdCdBc3RvbmlzaGluZyBDaGFudCBvZiBDaG9jb2xhdGUnLFxuXHQnQXN0b3VuZGluZyBQYXN0YSBQdWRkbGUnLFxuXHQnQmFsbCBvZiBBbm5veWFuY2UnLFxuXHQnQ2FnZSBvZiBZYXJuJyxcblx0J0NvbnRyb2wgTm9vZGxlcyBFbGVtZW50YWwnLFxuXHQnQ3JlYXRlIE5lcnZvdXNuZXNzJyxcblx0J0N1cmUgQmFsZG5lc3MnLFxuXHQnQ3Vyc2VkIFJpdHVhbCBvZiBCYWQgSGFpcicsXG5cdCdEaXNwZWxsIFBpbGVzIGluIERlbnRpc3QnLFxuXHQnRWxpbWluYXRlIEZsb3Jpc3RzJyxcblx0J0lsbHVzaW9uYXJ5IFRyYW5zZmlndXJhdGlvbiBvZiB0aGUgQmFieXNpdHRlcicsXG5cdCdOZWNyb21hbnRpYyBBcm1vciBvZiBTYWxhZCBEcmVzc2luZycsXG5cdCdPY2N1bHQgVHJhbnNmaWd1cmF0aW9uIG9mIEZvb3QgRmV0aXNoJyxcblx0J1Byb3RlY3Rpb24gZnJvbSBNdWN1cyBHaWFudCcsXG5cdCdUaW5zZWwgQmxhc3QnLFxuXHQnQWxjaGVtaWNhbCBFdm9jYXRpb24gb2YgdGhlIEdvdGhzJyxcblx0J0NhbGwgRmFuZ2lybCcsXG5cdCdEaXZpbmUgU3BlbGwgb2YgQ3Jvc3NkcmVzc2luZycsXG5cdCdEb21pbmF0ZSBSYW1lbiBHaWFudCcsXG5cdCdFbGltaW5hdGUgVmluZGljdGl2ZW5lc3MgaW4gR3ltIFRlYWNoZXInLFxuXHQnRXh0cmEtUGxhbmFyIFNwZWxsIG9mIElycml0YXRpb24nLFxuXHQnSW5kdWNlIFdoaW5pbmcgaW4gQmFieXNpdHRlcicsXG5cdCdJbnZva2UgQ29tcGxhaW5pbmcnLFxuXHQnTWFnaWNhbCBFbmNoYW50bWVudCBvZiBBcnJvZ2FuY2UnLFxuXHQnT2NjdWx0IEdsb2JlIG9mIFNhbGFkIERyZXNzaW5nJyxcblx0J092ZXJ3aGVsbWluZyBFbmNoYW50bWVudCBvZiB0aGUgQ2hvY29sYXRlIEZhaXJ5Jyxcblx0J1NvcmNlcm91cyBEYW5kcnVmZiBHbG9iZScsXG5cdCdTcGlyaXR1YWwgSW52b2NhdGlvbiBvZiB0aGUgQ29zdHVtZXJzJyxcblx0J1VsdGltYXRlIFJpdGUgb2YgdGhlIENvbmZldHRpIEFuZ2VsJyxcblx0J1VsdGltYXRlIFJpdHVhbCBvZiBNb3V0aHdhc2gnLFxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0c3BlbGxMaXN0IDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBsZXZlbHMgPSBbJ0NhbnRyaXBzICgwIExldmVsKScsICcybmQgTGV2ZWwnLCAnM3JkIExldmVsJywgJzR0aCBMZXZlbCcsICc1dGggTGV2ZWwnLCAnNnRoIExldmVsJywgJzd0aCBMZXZlbCcsICc4dGggTGV2ZWwnLCAnOXRoIExldmVsJ107XG5cblx0XHRjb25zdCBjb250ZW50ID0gXy5tYXAobGV2ZWxzLCAobGV2ZWwpPT57XG5cdFx0XHRjb25zdCBzcGVsbHMgPSBfLm1hcChfLnNhbXBsZVNpemUoc3BlbGxOYW1lcywgXy5yYW5kb20oNSwgMTUpKSwgKHNwZWxsKT0+e1xuXHRcdFx0XHRyZXR1cm4gYC0gJHtzcGVsbH1gO1xuXHRcdFx0fSkuam9pbignXFxuJyk7XG5cdFx0XHRyZXR1cm4gYCMjIyMjICR7bGV2ZWx9IFxcbiR7c3BlbGxzfSBcXG5gO1xuXHRcdH0pLmpvaW4oJ1xcbicpO1xuXG5cdFx0cmV0dXJuIGA8ZGl2IGNsYXNzPSdzcGVsbExpc3QnPlxcbiR7Y29udGVudH1cXG48L2Rpdj5gO1xuXHR9LFxuXG5cdHNwZWxsIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBsZXZlbCA9IFsnMXN0JywgJzJuZCcsICczcmQnLCAnNHRoJywgJzV0aCcsICc2dGgnLCAnN3RoJywgJzh0aCcsICc5dGgnXTtcblx0XHRjb25zdCBzcGVsbFNjaG9vbHMgPSBbJ2FianVyYXRpb24nLCAnY29uanVyYXRpb24nLCAnZGl2aW5hdGlvbicsICdlbmNoYW50bWVudCcsICdldm9jYXRpb24nLCAnaWxsdXNpb24nLCAnbmVjcm9tYW5jeScsICd0cmFuc211dGF0aW9uJ107XG5cblxuXHRcdGxldCBjb21wb25lbnRzID0gXy5zYW1wbGVTaXplKFsnVicsICdTJywgJ00nXSwgXy5yYW5kb20oMSwgMykpLmpvaW4oJywgJyk7XG5cdFx0aWYoY29tcG9uZW50cy5pbmRleE9mKCdNJykgIT09IC0xKXtcblx0XHRcdGNvbXBvbmVudHMgKz0gYCAoJHtfLnNhbXBsZVNpemUoWydhIHNtYWxsIGRvbGwnLCAnYSBjcnVzaGVkIGJ1dHRvbiB3b3J0aCBhdCBsZWFzdCAxY3AnLCAnZGlzY2FyZGVkIGd1bSB3cmFwcGVyJ10sIF8ucmFuZG9tKDEsIDMpKS5qb2luKCcsICcpfSlgO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXG5cdFx0XHRgIyMjIyAke18uc2FtcGxlKHNwZWxsTmFtZXMpfWAsXG5cdFx0XHRgKiR7Xy5zYW1wbGUobGV2ZWwpfS1sZXZlbCAke18uc2FtcGxlKHNwZWxsU2Nob29scyl9KmAsXG5cdFx0XHQnX19fJyxcblx0XHRcdCctICoqQ2FzdGluZyBUaW1lOioqIDEgYWN0aW9uJyxcblx0XHRcdGAtICoqUmFuZ2U6KiogJHtfLnNhbXBsZShbJ1NlbGYnLCAnVG91Y2gnLCAnMzAgZmVldCcsICc2MCBmZWV0J10pfWAsXG5cdFx0XHRgLSAqKkNvbXBvbmVudHM6KiogJHtjb21wb25lbnRzfWAsXG5cdFx0XHRgLSAqKkR1cmF0aW9uOioqICR7Xy5zYW1wbGUoWydVbnRpbCBkaXNwZWxsZWQnLCAnMSByb3VuZCcsICdJbnN0YW50YW5lb3VzJywgJ0NvbmNlbnRyYXRpb24sIHVwIHRvIDEwIG1pbnV0ZXMnLCAnMSBob3VyJ10pfWAsXG5cdFx0XHQnJyxcblx0XHRcdCdBIGZsYW1lLCBlcXVpdmFsZW50IGluIGJyaWdodG5lc3MgdG8gYSB0b3JjaCwgc3ByaW5ncyBmcm9tIGZyb20gYW4gb2JqZWN0IHRoYXQgeW91IHRvdWNoLiAnLFxuXHRcdFx0J1RoZSBlZmZlY3QgbG9vayBsaWtlIGEgcmVndWxhciBmbGFtZSwgYnV0IGl0IGNyZWF0ZXMgbm8gaGVhdCBhbmQgZG9lc25cXCd0IHVzZSBveHlnZW4uICcsXG5cdFx0XHQnQSAqY29udGludWFsIGZsYW1lKiBjYW4gYmUgY292ZXJlZCBvciBoaWRkZW4gYnV0IG5vdCBzbW90aGVyZWQgb3IgcXVlbmNoZWQuJyxcblx0XHRcdCdcXG5cXG5cXG4nXG5cdFx0XS5qb2luKCdcXG4nKTtcblx0fVxufTsiLCJjb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmNvbnN0IGdlbkxpc3QgPSBmdW5jdGlvbihsaXN0LCBtYXgpe1xuXHRyZXR1cm4gXy5zYW1wbGVTaXplKGxpc3QsIF8ucmFuZG9tKDAsIG1heCkpLmpvaW4oJywgJykgfHwgJ05vbmUnO1xufTtcblxuY29uc3QgZ2V0TW9uc3Rlck5hbWUgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gXy5zYW1wbGUoW1xuXHRcdCdBbGwtZGV2b3VyaW5nIEJhc2ViYWxsIEltcCcsXG5cdFx0J0FsbC1kZXZvdXJpbmcgR3VtZHJvcCBXcmFpdGgnLFxuXHRcdCdDaG9jb2xhdGUgSHlkcmEnLFxuXHRcdCdEZXZvdXJpbmcgUGVhY29jaycsXG5cdFx0J0Vjb25vbXktc2l6ZWQgQ29sb3NzdXMgb2YgdGhlIExlbW9uYWRlIFN0YW5kJyxcblx0XHQnR2hvc3QgUGlnZW9uJyxcblx0XHQnR2liYmVyaW5nIER1Y2snLFxuXHRcdCdTcGFya2xlbXVmZmluIFBlYWNvY2sgU3BpZGVyJyxcblx0XHQnR3VtIEVsZW1lbnRhbCcsXG5cdFx0J0lsbGl0ZXJhdGUgQ29uc3RydWN0IG9mIHRoZSBDYW5keSBTdG9yZScsXG5cdFx0J0luZWZmYWJsZSBDaGlodWFodWEnLFxuXHRcdCdJcnJpdGF0aW5nIERlYXRoIEhhbXN0ZXInLFxuXHRcdCdJcnJpdGF0aW5nIEdvbGQgTW91c2UnLFxuXHRcdCdKdWdnZXJuYXV0IFNuYWlsJyxcblx0XHQnSnVnZ2VybmF1dCBvZiB0aGUgU29jayBEcmF3ZXInLFxuXHRcdCdLb2FsYSBvZiB0aGUgQ29zbW9zJyxcblx0XHQnTWFkIEtvYWxhIG9mIHRoZSBXZXN0Jyxcblx0XHQnTWlsayBEamlubmkgb2YgdGhlIExlbW9uYWRlIFN0YW5kJyxcblx0XHQnTWluZCBGZXJyZXQnLFxuXHRcdCdNeXN0aWMgU2FsdCBTcGlkZXInLFxuXHRcdCdOZWNyb3RpYyBIYWxpdG9zaXMgQW5nZWwnLFxuXHRcdCdQaW5zdHJpcGVkIEZhbWluZSBTaGVlcCcsXG5cdFx0J1JpdGFsaW4gTGVlY2gnLFxuXHRcdCdTaG9ja2VyIEthbmdhcm9vJyxcblx0XHQnU3RlbGxhciBUZW5uaXMgSnVnZ2VybmF1dCcsXG5cdFx0J1dhaWxpbmcgUXVhaWwgb2YgdGhlIFN1bicsXG5cdFx0J0FuZ2VsIFBpZ2VvbicsXG5cdFx0J0FuaW1lIFNwaGlueCcsXG5cdFx0J0JvcmVkIEF2YWxhbmNoZSBTaGVlcCBvZiB0aGUgV2FzdGVsYW5kJyxcblx0XHQnRGV2b3VyaW5nIE5vdWdhdCBTcGhpbnggb2YgdGhlIFNvY2sgRHJhd2VyJyxcblx0XHQnRGppbm5pIG9mIHRoZSBGb290bG9ja2VyJyxcblx0XHQnRWN0b3BsYXNtaWMgSmF6eiBEZXZpbCcsXG5cdFx0J0ZsYXR1ZW50IEFuZ2VsJyxcblx0XHQnR2VsYXRpbm91cyBEdWNrIG9mIHRoZSBEcmVhbS1MYW5kcycsXG5cdFx0J0dlbGF0aW5vdXMgTW91c2UnLFxuXHRcdCdHb2xlbSBvZiB0aGUgRm9vdGxvY2tlcicsXG5cdFx0J0xpY2ggV29tYmF0Jyxcblx0XHQnTWVjaGFuaWNhbCBTbG90aCBvZiB0aGUgUGFzdCcsXG5cdFx0J01pbGtzaGFrZSBTdWNjdWJ1cycsXG5cdFx0J1B1ZmZ5IEJvbmUgUGVhY29jayBvZiB0aGUgRWFzdCcsXG5cdFx0J1JhaW5ib3cgTWFuYXRlZScsXG5cdFx0J1J1bmUgUGFycm90Jyxcblx0XHQnU2FuZCBDb3cnLFxuXHRcdCdTaW5pc3RlciBWYW5pbGxhIERyYWdvbicsXG5cdFx0J1NuYWlsIG9mIHRoZSBOb3J0aCcsXG5cdFx0J1NwaWRlciBvZiB0aGUgU2V3ZXInLFxuXHRcdCdTdGVsbGFyIFNhd2R1c3QgTGVlY2gnLFxuXHRcdCdTdG9ybSBBbnRlYXRlciBvZiBIZWxsJyxcblx0XHQnU3R1cGlkIFNwaXJpdCBvZiB0aGUgQnJld2VyeScsXG5cdFx0J1RpbWUgS2FuZ2Fyb28nLFxuXHRcdCdUb21iIFBvb2RsZScsXG5cdF0pO1xufTtcblxuY29uc3QgZ2V0VHlwZSA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBgJHtfLnNhbXBsZShbJ1RpbnknLCAnU21hbGwnLCAnTWVkaXVtJywgJ0xhcmdlJywgJ0dhcmdhbnR1YW4nLCAnU3R1cGlkbHkgdmFzdCddKX0gJHtfLnNhbXBsZShbJ2JlYXN0JywgJ2ZpZW5kJywgJ2Fubm95YW5jZScsICdndXknLCAnY3V0aWUnXSl9YDtcbn07XG5cbmNvbnN0IGdldEFsaWdubWVudCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBfLnNhbXBsZShbXG5cdFx0J2Fubm95aW5nIGV2aWwnLFxuXHRcdCdjaGFvdGljIGdvc3NpcHknLFxuXHRcdCdjaGFvdGljIHNsb3BweScsXG5cdFx0J2RlcHJlc3NlZCBuZXV0cmFsJyxcblx0XHQnbGF3ZnVsIGJvZ3VzJyxcblx0XHQnbGF3ZnVsIGNveScsXG5cdFx0J21hbmljLWRlcHJlc3NpdmUgZXZpbCcsXG5cdFx0J25hcnJvdy1taW5kZWQgbmV1dHJhbCcsXG5cdFx0J25ldXRyYWwgYW5ub3lpbmcnLFxuXHRcdCduZXV0cmFsIGlnbm9yYW50Jyxcblx0XHQnb2VkcGlwYWwgbmV1dHJhbCcsXG5cdFx0J3NpbGx5IG5ldXRyYWwnLFxuXHRcdCd1bm9yaWdpbmFsIG5ldXRyYWwnLFxuXHRcdCd3ZWlyZCBuZXV0cmFsJyxcblx0XHQnd29yZHkgZXZpbCcsXG5cdFx0J3VuYWxpZ25lZCdcblx0XSk7XG59O1xuXG5jb25zdCBnZXRTdGF0cyA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBgPnwke18udGltZXMoOSwgZnVuY3Rpb24oKXtcblx0XHRjb25zdCBudW0gPSBfLnJhbmRvbSgxLCAxNSk7XG5cdFx0Y29uc3QgdmFsID0gTWF0aC5jZWlsKG51bS8zIC0gMik7XG5cdFx0Ly9jb25zdCBtb2QgPSBNYXRoLmNlaWwobnVtLzIgLSA1KTtcblx0XHRyZXR1cm4gYCgkeyBudW0gPT0gMSA/IC0yIDogKG51bSA9PSAxNSA/IDQgOiB2YWwpIH0pYDtcblx0fSkuam9pbignfCcpfXxgO1xufTtcblxuY29uc3QgZ2VuQWJpbGl0aWVzID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIF8uc2FtcGxlKFtcblx0XHQnPiAtICoqKlBhY2sgVGFjdGljcy4qKiogVGhlc2UgZ3V5cyB3b3JrIHRvZ2V0aGVyLiBMaWtlIHN1cGVyIHdlbGwsIHlvdSBkb25cXCd0IGV2ZW4ga25vdy4nLFxuXHRcdCc+IC0gKioqRmFsc2UgQXBwZWFyYW5jZS4gKioqIFdoaWxlIHRoZSBhcm1vciByZWFtaW4gbW90aW9ubGVzcywgaXQgaXMgaW5kaXN0aW5ndWlzaGFibGUgZnJvbSBhIG5vcm1hbCBzdWl0IG9mIGFybW9yLicsXG5cdF0pO1xufTtcblxuY29uc3QgZ2VuQWN0aW9uID0gZnVuY3Rpb24oKXtcblx0Y29uc3QgbmFtZSA9IF8uc2FtcGxlKFtcblx0XHQnQWJkb21pbmFsIERyb3AnLFxuXHRcdCdBaXJwbGFuZSBIYW1tZXInLFxuXHRcdCdBdG9taWMgRGVhdGggVGhyb3cnLFxuXHRcdCdCdWxsZG9nIFJha2UnLFxuXHRcdCdDb3Jrc2NyZXcgU3RyaWtlJyxcblx0XHQnQ3Jvc3NlZCBTcGxhc2gnLFxuXHRcdCdDcm9zc2ZhY2UgU3VwbGV4Jyxcblx0XHQnRERUIFBvd2VyYm9tYicsXG5cdFx0J0R1YWwgQ29icmEgV3Jpc3Rsb2NrJyxcblx0XHQnRHVhbCBUaHJvdycsXG5cdFx0J0VsYm93IEhvbGQnLFxuXHRcdCdHb3J5IEJvZHkgU3dlZXAnLFxuXHRcdCdIZWVsIEphd2JyZWFrZXInLFxuXHRcdCdKdW1waW5nIERyaXZlcicsXG5cdFx0J09wZW4gQ2hpbiBDaG9rZScsXG5cdFx0J1Njb3JwaW9uIEZsdXJyeScsXG5cdFx0J1NvbWVyc2F1bHQgU3R1bXAgRmlzdHMnLFxuXHRcdCdTdWZmZXJpbmcgV3JpbmdlcicsXG5cdFx0J1N1cGVyIEhpcCBTdWJtaXNzaW9uJyxcblx0XHQnU3VwZXIgU3BpbicsXG5cdFx0J1RlYW0gRWxib3cnLFxuXHRcdCdUZWFtIEZvb3QnLFxuXHRcdCdUaWx0LWEtd2hpcmwgQ2hpbiBTbGVlcGVyJyxcblx0XHQnVGlsdC1hLXdoaXJsIEV5ZSBUYWtlZG93bicsXG5cdFx0J1R1cm5idWNrbGUgUm9sbCdcblx0XSk7XG5cblx0cmV0dXJuIGA+ICoqKiR7bmFtZX0uKioqICpNZWxlZSBXZWFwb24gQXR0YWNrOiogKzQgdG8gaGl0LCByZWFjaCA1ZnQuLCBvbmUgdGFyZ2V0LiAqSGl0KiA1ICgxZDYgKyAyKSBgO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRmdWxsIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gYCR7W1xuXHRcdFx0J19fXycsXG5cdFx0XHQnX19fJyxcblx0XHRcdGA+ICMjICR7Z2V0TW9uc3Rlck5hbWUoKX1gLFxuXHRcdFx0YD4qJHtnZXRUeXBlKCl9LCAke2dldEFsaWdubWVudCgpfSpgLFxuXHRcdFx0Jz4gX19fJyxcblx0XHRcdGA+IC0gKipBcm1vciBDbGFzcyoqICR7Xy5yYW5kb20oMTAsIDIwKX1gLFxuXHRcdFx0YD4gLSAqKkhpdCBQb2ludHMqKiAke18ucmFuZG9tKDEsIDE1MCl9KDFkNCArIDUpYCxcblx0XHRcdGA+IC0gKipTcGVlZCoqICR7Xy5yYW5kb20oMCwgNTApfWZ0LmAsXG5cdFx0XHQnPl9fXycsXG5cdFx0XHQnPnxTVFJ8REVYfENPTnxJTlR8V0lTfENIQXwnLFxuXHRcdFx0Jz58Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Oi0tLTp8Jyxcblx0XHRcdGdldFN0YXRzKCksXG5cdFx0XHQnPl9fXycsXG5cdFx0XHRgPiAtICoqQ29uZGl0aW9uIEltbXVuaXRpZXMqKiAke2dlbkxpc3QoWydncm9nZ3knLCAnc3dhZ2dlZCcsICd3ZWFrLWtuZWVkJywgJ2J1enplZCcsICdncm9vdnknLCAnbWVsYW5jaG9seScsICdkcnVuayddLCAzKX1gLFxuXHRcdFx0YD4gLSAqKlNlbnNlcyoqIHBhc3NpdmUgUGVyY2VwdGlvbiAke18ucmFuZG9tKDMsIDIwKX1gLFxuXHRcdFx0YD4gLSAqKkxhbmd1YWdlcyoqICR7Z2VuTGlzdChbJ0NvbW1vbicsICdQb3R0eW1vdXRoJywgJ0dpYmJlcmlzaCcsICdMYXRpbicsICdKaXZlJ10sIDIpfWAsXG5cdFx0XHRgPiAtICoqQ2hhbGxlbmdlKiogJHtfLnJhbmRvbSgwLCAxNSl9ICgke18ucmFuZG9tKDEwLCAxMDAwMCl9IFhQKWAsXG5cdFx0XHQnPiBfX18nLFxuXHRcdFx0Xy50aW1lcyhfLnJhbmRvbSgzLCA2KSwgZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIGdlbkFiaWxpdGllcygpO1xuXHRcdFx0fSkuam9pbignXFxuPlxcbicpLFxuXHRcdFx0Jz4gIyMjIEFjdGlvbnMnLFxuXHRcdFx0Xy50aW1lcyhfLnJhbmRvbSg0LCA2KSwgZnVuY3Rpb24oKXtcblx0XHRcdFx0cmV0dXJuIGdlbkFjdGlvbigpO1xuXHRcdFx0fSkuam9pbignXFxuPlxcbicpLFxuXHRcdF0uam9pbignXFxuJyl9XFxuXFxuXFxuYDtcblx0fSxcblxuXHRoYWxmIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gYCR7W1xuXHRcdFx0J19fXycsXG5cdFx0XHRgPiAjIyMjIyAke2dldE1vbnN0ZXJOYW1lKCl9YCxcblx0XHRcdCc+fCBWYWx1ZSB8IEFiaWxpdGllcyAoRm9jdXNlcykgfCcsXG5cdFx0XHQnPnw6LS0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRgPnwgMSB8IEFjY3VyYWN5IHxgLFxuXHRcdFx0YD58IC0xIHwgQ29tbXVuaWNhdGlvbiB8YCxcblx0XHRcdGA+fCAxIHwgQ29uc3RpdHV0aW9uIChTdGFtaW5hKSB8YCxcblx0XHRcdGA+fCAwIHwgRGV4dGVyaXR5IChSaWRpbmcpIHxgLFxuXHRcdFx0YD58IDIgfCBGaWdodGluZyAoSGVhdnkgQmxhZGVzLFNwZWFycykgfGAsXG5cdFx0XHRgPnwgMCB8IEludGVsbGlnZW5jZSAoTWlsaXRhcnkgTG9yZSkgfGAsXG5cdFx0XHRgPnwgMCB8IFBlcmNlcHRpb24gfGAsXG5cdFx0XHRgPnwgMiB8IFN0cmVuZ3RoIChDbGltYmluZykgfGAsXG5cdFx0XHRgPnwgMSB8IFdpbGxwb3dlciAoTW9yYWxlKSB8YCxcblx0XHRcdCc+Jyxcblx0XHRcdCc+IHwgU3BlZWQgfCBIZWFsdGggfCBEZWZlbnNlIHwgQXJtb3IgUmF0aW5nIHwnLFxuXHRcdFx0Jz4gfDotLS0tLTp8Oi0tLS0tLTp8Oi0tLS0tLS06fDotLS0tLS0tLS0tLS06fCcsXG5cdFx0XHRgPiB8IDEwIHwgMzIgfCAxMiB8IDMgfGAsXG5cdFx0XHQnPicsIFxuXHRcdFx0Jz4gfCBXZWFwb24gfCBBdHRhY2sgUm9sbCB8IERhbWFnZSB8Jyxcblx0XHRcdCc+IHw6LS0tLS0tOnw6LS0tLS0tLS0tLS06fDotLS0tLS06fCcsXG5cdFx0XHQnPnwgTG9uZ3N3b3JkIHwgKzQgfCAyZDYrMiB8Jyxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHQnPiAjIyMjIyMgU3BlY2lhbCBRdWFsaXRpZXMgJyxcblx0XHRcdCc+Jyxcblx0XHRcdCc+IC0gKipGYXZvcmVkIFN0dW50cyoqOiBLbm9jayBQcm9uZSwgTWlnaHR5IEJsb3csIFNraXJtaXNoLiAnLFxuXHRcdFx0Jz4gLSAqKlRhbGVudHMqKjogQXJtb3IgIFRyYWluaW5nIChKb3VybmV5bWFuKSwgU2luZ2xlIFdlYXBvbiBTdHlsZSAoTm92aWNlKSwgVGhyb3duIFdlYXBvbiBTdHlsZSAoTm92aWNlKS4nLFxuXHRcdFx0Jz4gLSAqKldlYXBvbnMgR3JvdXBzKio6IEJyYXdsaW5nLCBIZWF2eSBCbGFkZXMsIFBvbGVhcm1zLCBTcGVhcnMuJyxcblx0XHRcdCc+IC0gKipFcXVpcG1lbnQqKjogTGlnaHQgbWFpbCwgbWVkaXVtIHNoaWVsZCwgbG9uZ3N3b3JkLCBhbmQgdHdvIHRocm93aW5nIHNwZWFycy4nLFxuXHRcdFx0Jz4gJyxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHQnPiAjIyMjIyBUaHJlYXQ6IE1pbm9yJyxcblx0XHRdLmpvaW4oJ1xcbicpfVxcblxcblxcbmA7XG5cbi8qIFxuXHRcdFx0J19fXycsXG5cdFx0XHRgPiAjIyAke2dldE1vbnN0ZXJOYW1lKCl9YCxcblx0XHRcdGA+KiR7Z2V0VHlwZSgpfSwgJHtnZXRBbGlnbm1lbnQoKX0qYCxcblx0XHRcdCc+IF9fXycsXG5cdFx0XHRgPiAtICoqQXJtb3IgQ2xhc3MqKiAke18ucmFuZG9tKDEwLCAyMCl9YCxcblx0XHRcdGA+IC0gKipIaXQgUG9pbnRzKiogJHtfLnJhbmRvbSgxLCAxNTApfSgxZDQgKyA1KWAsXG5cdFx0XHRgPiAtICoqU3BlZWQqKiAke18ucmFuZG9tKDAsIDUwKX1mdC5gLFxuXHRcdFx0Jz5fX18nLFxuXHRcdFx0Jz58U1RSfERFWHxDT058SU5UfFdJU3xDSEF8Jyxcblx0XHRcdCc+fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fDotLS06fCcsXG5cdFx0XHRnZXRTdGF0cygpLFxuXHRcdFx0Jz5fX18nLFxuXHRcdFx0YD4gLSAqKkNvbmRpdGlvbiBJbW11bml0aWVzKiogJHtnZW5MaXN0KFsnZ3JvZ2d5JywgJ3N3YWdnZWQnLCAnd2Vhay1rbmVlZCcsICdidXp6ZWQnLCAnZ3Jvb3Z5JywgJ21lbGFuY2hvbHknLCAnZHJ1bmsnXSwgMyl9YCxcblx0XHRcdGA+IC0gKipTZW5zZXMqKiBwYXNzaXZlIFBlcmNlcHRpb24gJHtfLnJhbmRvbSgzLCAyMCl9YCxcblx0XHRcdGA+IC0gKipMYW5ndWFnZXMqKiAke2dlbkxpc3QoWydDb21tb24nLCAnUG90dHltb3V0aCcsICdHaWJiZXJpc2gnLCAnTGF0aW4nLCAnSml2ZSddLCAyKX1gLFxuXHRcdFx0YD4gLSAqKkNoYWxsZW5nZSoqICR7Xy5yYW5kb20oMCwgMTUpfSAoJHtfLnJhbmRvbSgxMCwgMTAwMDApfSBYUClgLFxuXHRcdFx0Jz4gX19fJyxcblx0XHRcdF8udGltZXMoXy5yYW5kb20oMCwgMiksIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBnZW5BYmlsaXRpZXMoKTtcblx0XHRcdH0pLmpvaW4oJ1xcbj5cXG4nKSxcblx0XHRcdCc+ICMjIyBBY3Rpb25zJyxcblx0XHRcdF8udGltZXMoXy5yYW5kb20oMSwgMiksIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBnZW5BY3Rpb24oKTtcblx0XHRcdH0pLmpvaW4oJ1xcbj5cXG4nKSxcblx0XHRdLmpvaW4oJ1xcbicpfVxcblxcblxcbmA7ICovXG5cdH1cbn07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGluZXMgKi9cblxuY29uc3QgTWFnaWNHZW4gPSByZXF1aXJlKCcuL21hZ2ljLmdlbi5qcycpO1xuY29uc3QgQ2xhc3NUYWJsZUdlbiA9IHJlcXVpcmUoJy4vY2xhc3N0YWJsZS5nZW4uanMnKTtcbmNvbnN0IE1vbnN0ZXJCbG9ja0dlbiA9IHJlcXVpcmUoJy4vbW9uc3RlcmJsb2NrLmdlbi5qcycpO1xuY29uc3QgQ2xhc3NGZWF0dXJlR2VuID0gcmVxdWlyZSgnLi9jbGFzc2ZlYXR1cmUuZ2VuLmpzJyk7XG5jb25zdCBDb3ZlclBhZ2VHZW4gPSByZXF1aXJlKCcuL2NvdmVycGFnZS5nZW4uanMnKTtcbmNvbnN0IFRhYmxlT2ZDb250ZW50c0dlbiA9IHJlcXVpcmUoJy4vdGFibGVPZkNvbnRlbnRzLmdlbi5qcycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gW1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnRWRpdG9yJyxcblx0XHRpY29uICAgICAgOiAnZmEtcGVuY2lsJyxcblx0XHRzbmlwcGV0cyAgOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQ29sdW1uIEJyZWFrJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1jb2x1bW5zJyxcblx0XHRcdFx0Z2VuICA6ICdgYGBcXG5gYGBcXG5cXG4nXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ05ldyBQYWdlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1maWxlLXRleHQnLFxuXHRcdFx0XHRnZW4gIDogJ1xcXFxwYWdlXFxuXFxuJ1xuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdWZXJ0aWNhbCBTcGFjaW5nJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1hcnJvd3MtdicsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBzdHlsZT1cXCdtYXJnaW4tdG9wOjE0MHB4XFwnPjwvZGl2Plxcblxcbidcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnV2lkZSBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtYXJyb3dzLWgnLFxuXHRcdFx0XHRnZW4gIDogJzxkaXYgY2xhc3M9XFwnd2lkZVxcJz5cXG5FdmVyeXRoaW5nIGluIGhlcmUgd2lsbCBiZSBleHRyYSB3aWRlLiBUYWJsZXMsIHRleHQsIGV2ZXJ5dGhpbmchIEJld2FyZSB0aG91Z2gsIENTUyBjb2x1bW5zIGNhbiBiZWhhdmUgYSBiaXQgd2VpcmQgc29tZXRpbWVzLlxcbjwvZGl2Plxcbidcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnSW1hZ2UnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLWltYWdlJyxcblx0XHRcdFx0Z2VuICA6IFtcblx0XHRcdFx0XHQnPGltZyAnLFxuXHRcdFx0XHRcdCcgIHNyYz1cXCdodHRwczovL3MtbWVkaWEtY2FjaGUtYWswLnBpbmltZy5jb20vNzM2eC80YS84MS83OS80YTgxNzk0NjJjZmRmMzkwNTRhNDE4ZWZkNGNiNzQzZS5qcGdcXCcgJyxcblx0XHRcdFx0XHQnICBzdHlsZT1cXCd3aWR0aDozMjVweFxcJyAvPicsXG5cdFx0XHRcdFx0J0NyZWRpdDogS3lvdW5naHdhbiBLaW0nXG5cdFx0XHRcdF0uam9pbignXFxuJylcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQmFja2dyb3VuZCBJbWFnZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdHJlZScsXG5cdFx0XHRcdGdlbiAgOiBbXG5cdFx0XHRcdFx0JzxpbWcgJyxcblx0XHRcdFx0XHQnICBzcmM9XFwnaHR0cDovL2kuaW1ndXIuY29tL2hNbmE2RzAucG5nXFwnICcsXG5cdFx0XHRcdFx0JyAgc3R5bGU9XFwncG9zaXRpb246YWJzb2x1dGU7IHRvcDo1MHB4OyByaWdodDozMHB4OyB3aWR0aDoyODBweFxcJyAvPidcblx0XHRcdFx0XS5qb2luKCdcXG4nKVxuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1BhZ2UgTnVtYmVyJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1ib29rbWFyaycsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBjbGFzcz1cXCdwYWdlTnVtYmVyXFwnPjE8L2Rpdj5cXG48ZGl2IGNsYXNzPVxcJ2Zvb3Rub3RlXFwnPlBBUlQgMSB8IEZBTkNJTkVTUzwvZGl2Plxcblxcbidcblx0XHRcdH0sXG5cblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdBdXRvLWluY3JlbWVudGluZyBQYWdlIE51bWJlcicsXG5cdFx0XHRcdGljb24gOiAnZmEtc29ydC1udW1lcmljLWFzYycsXG5cdFx0XHRcdGdlbiAgOiAnPGRpdiBjbGFzcz1cXCdwYWdlTnVtYmVyIGF1dG9cXCc+PC9kaXY+XFxuJ1xuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0xpbmsgdG8gcGFnZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGluaycsXG5cdFx0XHRcdGdlbiAgOiAnW0NsaWNrIGhlcmVdKCNwMykgdG8gZ28gdG8gcGFnZSAzXFxuJ1xuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1RhYmxlIG9mIENvbnRlbnRzJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1ib29rJyxcblx0XHRcdFx0Z2VuICA6IFRhYmxlT2ZDb250ZW50c0dlblxuXHRcdFx0fSxcblxuXG5cdFx0XVxuXHR9LFxuXG5cblx0LyoqKioqKioqKioqKioqKioqKioqKioqKiogQUdFICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdHtcblx0XHRncm91cE5hbWUgOiAnQUdFJyxcblx0XHRpY29uICAgICAgOiAnZmEtYm9vaycsXG5cdFx0c25pcHBldHMgIDogW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1NwZWxsJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1tYWdpYycsXG5cdFx0XHRcdGdlbiAgOiBNYWdpY0dlbi5zcGVsbCxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnU3BlbGwgTGlzdCcsXG5cdFx0XHRcdGljb24gOiAnZmEtbGlzdCcsXG5cdFx0XHRcdGdlbiAgOiBNYWdpY0dlbi5zcGVsbExpc3QsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ0NsYXNzIEZlYXR1cmUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRyb3BoeScsXG5cdFx0XHRcdGdlbiAgOiBDbGFzc0ZlYXR1cmVHZW4sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ05vdGUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXN0aWNreS1ub3RlJyxcblx0XHRcdFx0Z2VuICA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHRcdCc+ICMjIyMjIFRpbWUgdG8gRHJvcCBLbm93bGVkZ2UnLFxuXHRcdFx0XHRcdFx0Jz4gVXNlIG5vdGVzIHRvIHBvaW50IG91dCBzb21lIGludGVyZXN0aW5nIGluZm9ybWF0aW9uLiAnLFxuXHRcdFx0XHRcdFx0Jz4gJyxcblx0XHRcdFx0XHRcdCc+ICoqVGFibGVzIGFuZCBsaXN0cyoqIGJvdGggd29yayB3aXRoaW4gYSBub3RlLidcblx0XHRcdFx0XHRdLmpvaW4oJ1xcbicpO1xuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdEZXNjcmlwdGl2ZSBUZXh0IEJveCcsXG5cdFx0XHRcdGljb24gOiAnZmEtc3RpY2t5LW5vdGUtbycsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cXCdkZXNjcmlwdGl2ZVxcJz4nLFxuXHRcdFx0XHRcdFx0JyMjIyMjIFRpbWUgdG8gRHJvcCBLbm93bGVkZ2UnLFxuXHRcdFx0XHRcdFx0J1VzZSBub3RlcyB0byBwb2ludCBvdXQgc29tZSBpbnRlcmVzdGluZyBpbmZvcm1hdGlvbi4gJyxcblx0XHRcdFx0XHRcdCcnLFxuXHRcdFx0XHRcdFx0JyoqVGFibGVzIGFuZCBsaXN0cyoqIGJvdGggd29yayB3aXRoaW4gYSBub3RlLicsXG5cdFx0XHRcdFx0XHQnPC9kaXY+J1xuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ01vbnN0ZXIgU3RhdCBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtYnVnJyxcblx0XHRcdFx0Z2VuICA6IE1vbnN0ZXJCbG9ja0dlbi5oYWxmLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdXaWRlIE1vbnN0ZXIgU3RhdCBCbG9jaycsXG5cdFx0XHRcdGljb24gOiAnZmEtcGF3Jyxcblx0XHRcdFx0Z2VuICA6IE1vbnN0ZXJCbG9ja0dlbi5mdWxsLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdDb3ZlciBQYWdlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS1maWxlLXdvcmQtbycsXG5cdFx0XHRcdGdlbiAgOiBDb3ZlclBhZ2VHZW4sXG5cdFx0XHR9LFxuXHRcdF1cblx0fSxcblxuXG5cblx0LyoqKioqKioqKioqKioqKioqKioqKiAgVEFCTEVTICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHR7XG5cdFx0Z3JvdXBOYW1lIDogJ1RhYmxlcycsXG5cdFx0aWNvbiAgICAgIDogJ2ZhLXRhYmxlJyxcblx0XHRzbmlwcGV0cyAgOiBbXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnQ2xhc3MgVGFibGUnLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRhYmxlJyxcblx0XHRcdFx0Z2VuICA6IENsYXNzVGFibGVHZW4uZnVsbCxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnSGFsZiBDbGFzcyBUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGlzdC1hbHQnLFxuXHRcdFx0XHRnZW4gIDogQ2xhc3NUYWJsZUdlbi5oYWxmLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtdGgtbGlzdCcsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnIyMjIyMgQ29va2llIFRhc3RpbmVzcycsXG5cdFx0XHRcdFx0XHQnfCBUYXN0aW5lc3MgfCBDb29raWUgVHlwZSB8Jyxcblx0XHRcdFx0XHRcdCd8Oi0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRcdFx0XHQnfCAtNSAgfCBSYWlzaW4gfCcsXG5cdFx0XHRcdFx0XHQnfCA4dGggIHwgQ2hvY29sYXRlIENoaXAgfCcsXG5cdFx0XHRcdFx0XHQnfCAxMXRoIHwgMiBvciBsb3dlciB8Jyxcblx0XHRcdFx0XHRcdCd8IDE0dGggfCAzIG9yIGxvd2VyIHwnLFxuXHRcdFx0XHRcdFx0J3wgMTd0aCB8IDQgb3IgbG93ZXIgfFxcblxcbicsXG5cdFx0XHRcdFx0XS5qb2luKCdcXG4nKTtcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgOiAnV2lkZSBUYWJsZScsXG5cdFx0XHRcdGljb24gOiAnZmEtbGlzdCcsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cXCd3aWRlXFwnPicsXG5cdFx0XHRcdFx0XHQnIyMjIyMgQ29va2llIFRhc3RpbmVzcycsXG5cdFx0XHRcdFx0XHQnfCBUYXN0aW5lc3MgfCBDb29raWUgVHlwZSB8Jyxcblx0XHRcdFx0XHRcdCd8Oi0tLS06fDotLS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRcdFx0XHQnfCAtNSAgfCBSYWlzaW4gfCcsXG5cdFx0XHRcdFx0XHQnfCA4dGggIHwgQ2hvY29sYXRlIENoaXAgfCcsXG5cdFx0XHRcdFx0XHQnfCAxMXRoIHwgMiBvciBsb3dlciB8Jyxcblx0XHRcdFx0XHRcdCd8IDE0dGggfCAzIG9yIGxvd2VyIHwnLFxuXHRcdFx0XHRcdFx0J3wgMTd0aCB8IDQgb3IgbG93ZXIgfCcsXG5cdFx0XHRcdFx0XHQnPC9kaXY+XFxuXFxuJ1xuXHRcdFx0XHRcdF0uam9pbignXFxuJyk7XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRuYW1lIDogJ1NwbGl0IFRhYmxlJyxcblx0XHRcdFx0aWNvbiA6ICdmYS10aC1sYXJnZScsXG5cdFx0XHRcdGdlbiAgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0XHQnPGRpdiBzdHlsZT1cXCdjb2x1bW4tY291bnQ6MlxcJz4nLFxuXHRcdFx0XHRcdFx0J3wgZDEwIHwgRGFtYWdlIFR5cGUgfCcsXG5cdFx0XHRcdFx0XHQnfDotLS06fDotLS0tLS0tLS0tLS18Jyxcblx0XHRcdFx0XHRcdCd8ICAxICB8IEFjaWQgICAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDIgIHwgQ29sZCAgICAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgMyAgfCBGaXJlICAgICAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICA0ICB8IEZvcmNlICAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDUgIHwgTGlnaHRuaW5nICAgfCcsXG5cdFx0XHRcdFx0XHQnJyxcblx0XHRcdFx0XHRcdCdgYGAnLFxuXHRcdFx0XHRcdFx0J2BgYCcsXG5cdFx0XHRcdFx0XHQnJyxcblx0XHRcdFx0XHRcdCd8IGQxMCB8IERhbWFnZSBUeXBlIHwnLFxuXHRcdFx0XHRcdFx0J3w6LS0tOnw6LS0tLS0tLS0tLS0tfCcsXG5cdFx0XHRcdFx0XHQnfCAgNiAgfCBOZWNyb3RpYyAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICA3ICB8IFBvaXNvbiAgICAgIHwnLFxuXHRcdFx0XHRcdFx0J3wgIDggIHwgUHN5Y2hpYyAgICAgfCcsXG5cdFx0XHRcdFx0XHQnfCAgOSAgfCBSYWRpYW50ICAgICB8Jyxcblx0XHRcdFx0XHRcdCd8ICAxMCB8IFRodW5kZXIgICAgIHwnLFxuXHRcdFx0XHRcdFx0JzwvZGl2PlxcblxcbicsXG5cdFx0XHRcdFx0XS5qb2luKCdcXG4nKTtcblx0XHRcdFx0fSxcblx0XHRcdH1cblx0XHRdXG5cdH0sXG5cblxuXG5cblx0LyoqKioqKioqKioqKioqKiogUFJJTlQgKioqKioqKioqKioqKi9cblxuXHR7XG5cdFx0Z3JvdXBOYW1lIDogJ1ByaW50Jyxcblx0XHRpY29uICAgICAgOiAnZmEtcHJpbnQnLFxuXHRcdHNuaXBwZXRzICA6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdBNCBQYWdlU2l6ZScsXG5cdFx0XHRcdGljb24gOiAnZmEtZmlsZS1vJyxcblx0XHRcdFx0Z2VuICA6IFsnPHN0eWxlPicsXG5cdFx0XHRcdFx0JyAgLmFnZXsnLFxuXHRcdFx0XHRcdCcgICAgd2lkdGggOiAyMTBtbTsnLFxuXHRcdFx0XHRcdCcgICAgaGVpZ2h0IDogMjk2LjhtbTsnLFxuXHRcdFx0XHRcdCcgIH0nLFxuXHRcdFx0XHRcdCc8L3N0eWxlPidcblx0XHRcdFx0XS5qb2luKCdcXG4nKVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZSA6ICdJbmsgRnJpZW5kbHknLFxuXHRcdFx0XHRpY29uIDogJ2ZhLXRpbnQnLFxuXHRcdFx0XHRnZW4gIDogWyc8c3R5bGU+Jyxcblx0XHRcdFx0XHQnICAuYWdleyBiYWNrZ3JvdW5kIDogd2hpdGU7fScsXG5cdFx0XHRcdFx0JyAgLmFnZSBpbWd7IGRpc3BsYXkgOiBub25lO30nLFxuXHRcdFx0XHRcdCcgIC5hZ2UgaHIrYmxvY2txdW90ZXtiYWNrZ3JvdW5kIDogd2hpdGU7fScsXG5cdFx0XHRcdFx0Jzwvc3R5bGU+Jyxcblx0XHRcdFx0XHQnJ1xuXHRcdFx0XHRdLmpvaW4oJ1xcbicpXG5cdFx0XHR9LFxuXHRcdF1cblx0fSxcblxuXTtcbiIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuY29uc3QgZ2V0VE9DID0gKHBhZ2VzKT0+e1xuXHRjb25zdCBhZGQxID0gKHRpdGxlLCBwYWdlKT0+e1xuXHRcdHJlcy5wdXNoKHtcblx0XHRcdHRpdGxlICAgIDogdGl0bGUsXG5cdFx0XHRwYWdlICAgICA6IHBhZ2UgKyAxLFxuXHRcdFx0Y2hpbGRyZW4gOiBbXVxuXHRcdH0pO1xuXHR9O1xuXHRjb25zdCBhZGQyID0gKHRpdGxlLCBwYWdlKT0+e1xuXHRcdGlmKCFfLmxhc3QocmVzKSkgYWRkMSgnJywgcGFnZSk7XG5cdFx0Xy5sYXN0KHJlcykuY2hpbGRyZW4ucHVzaCh7XG5cdFx0XHR0aXRsZSAgICA6IHRpdGxlLFxuXHRcdFx0cGFnZSAgICAgOiBwYWdlICsgMSxcblx0XHRcdGNoaWxkcmVuIDogW11cblx0XHR9KTtcblx0fTtcblx0Y29uc3QgYWRkMyA9ICh0aXRsZSwgcGFnZSk9Pntcblx0XHRpZighXy5sYXN0KHJlcykpIGFkZDEoJycsIHBhZ2UpO1xuXHRcdGlmKCFfLmxhc3QoXy5sYXN0KHJlcykuY2hpbGRyZW4pKSBhZGQyKCcnLCBwYWdlKTtcblx0XHRfLmxhc3QoXy5sYXN0KHJlcykuY2hpbGRyZW4pLmNoaWxkcmVuLnB1c2goe1xuXHRcdFx0dGl0bGUgICAgOiB0aXRsZSxcblx0XHRcdHBhZ2UgICAgIDogcGFnZSArIDEsXG5cdFx0XHRjaGlsZHJlbiA6IFtdXG5cdFx0fSk7XG5cdH07XG5cblx0Y29uc3QgcmVzID0gW107XG5cdF8uZWFjaChwYWdlcywgKHBhZ2UsIHBhZ2VOdW0pPT57XG5cdFx0Y29uc3QgbGluZXMgPSBwYWdlLnNwbGl0KCdcXG4nKTtcblx0XHRfLmVhY2gobGluZXMsIChsaW5lKT0+e1xuXHRcdFx0aWYoXy5zdGFydHNXaXRoKGxpbmUsICcjICcpKXtcblx0XHRcdFx0Y29uc3QgdGl0bGUgPSBsaW5lLnJlcGxhY2UoJyMgJywgJycpO1xuXHRcdFx0XHRhZGQxKHRpdGxlLCBwYWdlTnVtKTtcblx0XHRcdH1cblx0XHRcdGlmKF8uc3RhcnRzV2l0aChsaW5lLCAnIyMgJykpe1xuXHRcdFx0XHRjb25zdCB0aXRsZSA9IGxpbmUucmVwbGFjZSgnIyMgJywgJycpO1xuXHRcdFx0XHRhZGQyKHRpdGxlLCBwYWdlTnVtKTtcblx0XHRcdH1cblx0XHRcdGlmKF8uc3RhcnRzV2l0aChsaW5lLCAnIyMjICcpKXtcblx0XHRcdFx0Y29uc3QgdGl0bGUgPSBsaW5lLnJlcGxhY2UoJyMjIyAnLCAnJyk7XG5cdFx0XHRcdGFkZDModGl0bGUsIHBhZ2VOdW0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblx0cmV0dXJuIHJlcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYnJldyl7XG5cdGNvbnN0IHBhZ2VzID0gYnJldy5zcGxpdCgnXFxcXHBhZ2UnKTtcblx0Y29uc3QgVE9DID0gZ2V0VE9DKHBhZ2VzKTtcblx0Y29uc3QgbWFya2Rvd24gPSBfLnJlZHVjZShUT0MsIChyLCBnMSwgaWR4MSk9Pntcblx0XHRyLnB1c2goYC0gKipbJHtpZHgxICsgMX0gJHtnMS50aXRsZX1dKCNwJHtnMS5wYWdlfSkqKmApO1xuXHRcdGlmKGcxLmNoaWxkcmVuLmxlbmd0aCl7XG5cdFx0XHRfLmVhY2goZzEuY2hpbGRyZW4sIChnMiwgaWR4Mik9Pntcblx0XHRcdFx0ci5wdXNoKGAgIC0gWyR7aWR4MSArIDF9LiR7aWR4MiArIDF9ICR7ZzIudGl0bGV9XSgjcCR7ZzIucGFnZX0pYCk7XG5cdFx0XHRcdGlmKGcyLmNoaWxkcmVuLmxlbmd0aCl7XG5cdFx0XHRcdFx0Xy5lYWNoKGcyLmNoaWxkcmVuLCAoZzMsIGlkeDMpPT57XG5cdFx0XHRcdFx0XHRyLnB1c2goYCAgICAtIFske2lkeDEgKyAxfS4ke2lkeDIgKyAxfS4ke2lkeDMgKyAxfSAke2czLnRpdGxlfV0oI3Ake2czLnBhZ2V9KWApO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0cmV0dXJuIHI7XG5cdH0sIFtdKS5qb2luKCdcXG4nKTtcblxuXHRyZXR1cm4gYDxkaXYgY2xhc3M9J3RvYyc+XG4jIyMjIyBUYWJsZSBPZiBDb250ZW50c1xuJHttYXJrZG93bn1cbjwvZGl2PlxcbmA7XG59OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgQ3JlYXRlUm91dGVyID0gcmVxdWlyZSgncGljby1yb3V0ZXInKS5jcmVhdGVSb3V0ZXI7XG5cbmNvbnN0IEhvbWVQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy9ob21lUGFnZS9ob21lUGFnZS5qc3gnKTtcbmNvbnN0IEVkaXRQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy9lZGl0UGFnZS9lZGl0UGFnZS5qc3gnKTtcbmNvbnN0IFVzZXJQYWdlID0gcmVxdWlyZSgnLi9wYWdlcy91c2VyUGFnZS91c2VyUGFnZS5qc3gnKTtcbmNvbnN0IFNoYXJlUGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvc2hhcmVQYWdlL3NoYXJlUGFnZS5qc3gnKTtcbmNvbnN0IE5ld1BhZ2UgPSByZXF1aXJlKCcuL3BhZ2VzL25ld1BhZ2UvbmV3UGFnZS5qc3gnKTtcbmNvbnN0IEVycm9yUGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvZXJyb3JQYWdlL2Vycm9yUGFnZS5qc3gnKTtcbmNvbnN0IFByaW50UGFnZSA9IHJlcXVpcmUoJy4vcGFnZXMvcHJpbnRQYWdlL3ByaW50UGFnZS5qc3gnKTtcblxubGV0IFJvdXRlcjtcbmNvbnN0IEhvbWVicmV3ID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXJsICAgICAgICAgOiAnJyxcblx0XHRcdHdlbGNvbWVUZXh0IDogJycsXG5cdFx0XHRjaGFuZ2Vsb2cgICA6ICcnLFxuXHRcdFx0dmVyc2lvbiAgICAgOiAnMC4wLjAnLFxuXHRcdFx0YWNjb3VudCAgICAgOiBudWxsLFxuXHRcdFx0YnJldyAgICAgICAgOiB7XG5cdFx0XHRcdHRpdGxlICAgICA6ICcnLFxuXHRcdFx0XHR0ZXh0ICAgICAgOiAnJyxcblx0XHRcdFx0c2hhcmVJZCAgIDogbnVsbCxcblx0XHRcdFx0ZWRpdElkICAgIDogbnVsbCxcblx0XHRcdFx0Y3JlYXRlZEF0IDogbnVsbCxcblx0XHRcdFx0dXBkYXRlZEF0IDogbnVsbCxcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnRXaWxsTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRnbG9iYWwuYWNjb3VudCA9IHRoaXMucHJvcHMuYWNjb3VudDtcblx0XHRnbG9iYWwudmVyc2lvbiA9IHRoaXMucHJvcHMudmVyc2lvbjtcblxuXG5cdFx0Um91dGVyID0gQ3JlYXRlUm91dGVyKHtcblx0XHRcdCcvZWRpdC86aWQnIDogKGFyZ3MpPT57XG5cdFx0XHRcdGlmKCF0aGlzLnByb3BzLmJyZXcuZWRpdElkKXtcblx0XHRcdFx0XHRyZXR1cm4gPEVycm9yUGFnZSBlcnJvcklkPXthcmdzLmlkfS8+O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIDxFZGl0UGFnZVxuXHRcdFx0XHRcdGlkPXthcmdzLmlkfVxuXHRcdFx0XHRcdGJyZXc9e3RoaXMucHJvcHMuYnJld30gLz47XG5cdFx0XHR9LFxuXG5cdFx0XHQnL3NoYXJlLzppZCcgOiAoYXJncyk9Pntcblx0XHRcdFx0aWYoIXRoaXMucHJvcHMuYnJldy5zaGFyZUlkKXtcblx0XHRcdFx0XHRyZXR1cm4gPEVycm9yUGFnZSBlcnJvcklkPXthcmdzLmlkfS8+O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIDxTaGFyZVBhZ2Vcblx0XHRcdFx0XHRpZD17YXJncy5pZH1cblx0XHRcdFx0XHRicmV3PXt0aGlzLnByb3BzLmJyZXd9IC8+O1xuXHRcdFx0fSxcblx0XHRcdCcvdXNlci86dXNlcm5hbWUnIDogKGFyZ3MpPT57XG5cdFx0XHRcdHJldHVybiA8VXNlclBhZ2Vcblx0XHRcdFx0XHR1c2VybmFtZT17YXJncy51c2VybmFtZX1cblx0XHRcdFx0XHRicmV3cz17dGhpcy5wcm9wcy5icmV3c31cblx0XHRcdFx0Lz47XG5cdFx0XHR9LFxuXHRcdFx0Jy9wcmludC86aWQnIDogKGFyZ3MsIHF1ZXJ5KT0+e1xuXHRcdFx0XHRyZXR1cm4gPFByaW50UGFnZSBicmV3PXt0aGlzLnByb3BzLmJyZXd9IHF1ZXJ5PXtxdWVyeX0vPjtcblx0XHRcdH0sXG5cdFx0XHQnL3ByaW50JyA6IChhcmdzLCBxdWVyeSk9Pntcblx0XHRcdFx0cmV0dXJuIDxQcmludFBhZ2UgcXVlcnk9e3F1ZXJ5fS8+O1xuXHRcdFx0fSxcblx0XHRcdCcvbmV3JyA6IChhcmdzKT0+e1xuXHRcdFx0XHRyZXR1cm4gPE5ld1BhZ2UgLz47XG5cdFx0XHR9LFxuXHRcdFx0Jy9jaGFuZ2Vsb2cnIDogKGFyZ3MpPT57XG5cdFx0XHRcdHJldHVybiA8U2hhcmVQYWdlXG5cdFx0XHRcdFx0YnJldz17eyB0aXRsZTogJ0NoYW5nZWxvZycsIHRleHQ6IHRoaXMucHJvcHMuY2hhbmdlbG9nIH19IC8+O1xuXHRcdFx0fSxcblx0XHRcdCcqJyA6IDxIb21lUGFnZVxuXHRcdFx0XHR3ZWxjb21lVGV4dD17dGhpcy5wcm9wcy53ZWxjb21lVGV4dH0gLz4sXG5cdFx0fSk7XG5cdH0sXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdob21lYnJldyc+XG5cdFx0XHQ8Um91dGVyIGRlZmF1bHRVcmw9e3RoaXMucHJvcHMudXJsfS8+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBIb21lYnJldztcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByb3BzKXtcblx0aWYoZ2xvYmFsLmFjY291bnQpe1xuXHRcdHJldHVybiA8TmF2Lml0ZW0gaHJlZj17YC91c2VyLyR7Z2xvYmFsLmFjY291bnQudXNlcm5hbWV9YH0gY29sb3I9J3llbGxvdycgaWNvbj0nZmEtdXNlcic+XG5cdFx0XHR7Z2xvYmFsLmFjY291bnQudXNlcm5hbWV9XG5cdFx0PC9OYXYuaXRlbT47XG5cdH1cblx0bGV0IHVybCA9ICcnO1xuXHRpZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyl7XG5cdFx0dXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG5cdH1cblx0cmV0dXJuIDxOYXYuaXRlbSBocmVmPXtgaHR0cDovL3VudXNlZC9sb2dpbj9yZWRpcmVjdD0ke3VybH1gfSBjb2xvcj0ndGVhbCcgaWNvbj0nZmEtc2lnbi1pbic+XG5cdFx0bG9naW5cblx0PC9OYXYuaXRlbT47XG59OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByb3BzKXtcblx0cmV0dXJuIDxOYXYuaXRlbVxuXHRcdG5ld1RhYj17dHJ1ZX1cblx0XHRjb2xvcj0ncmVkJ1xuXHRcdGljb249J2ZhLWJ1Zydcblx0XHRocmVmPXtgaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL2hvbWVicmV3ZXJ5L3N1Ym1pdD9zZWxmdGV4dD10cnVlJnRpdGxlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdbSXNzdWVdIERlc2NyaWJlIFlvdXIgSXNzdWUgSGVyZScpfWB9ID5cblx0XHRyZXBvcnQgaXNzdWVcblx0PC9OYXYuaXRlbT47XG59OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5cbmNvbnN0IE5hdmJhciA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdC8vc2hvd05vbkNocm9tZVdhcm5pbmcgOiBmYWxzZSxcblx0XHRcdHZlciA6ICcwLjAuMCdcblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zdCBpc0Nocm9tZSA9IC9DaHJvbWUvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgL0dvb2dsZSBJbmMvLnRlc3QobmF2aWdhdG9yLnZlbmRvcik7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHQvL3Nob3dOb25DaHJvbWVXYXJuaW5nIDogIWlzQ2hyb21lLFxuXHRcdFx0dmVyIDogd2luZG93LnZlcnNpb25cblx0XHR9KTtcblx0fSxcblxuXHQvKlxuXHRyZW5kZXJDaHJvbWVXYXJuaW5nIDogZnVuY3Rpb24oKXtcblx0XHRpZighdGhpcy5zdGF0ZS5zaG93Tm9uQ2hyb21lV2FybmluZykgcmV0dXJuO1xuXHRcdHJldHVybiA8TmF2Lml0ZW0gY2xhc3NOYW1lPSd3YXJuaW5nJyBpY29uPSdmYS1leGNsYW1hdGlvbi10cmlhbmdsZSc+XG5cdFx0XHRPcHRpbWl6ZWQgZm9yIENocm9tZVxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2Ryb3Bkb3duJz5cblx0XHRcdFx0SWYgeW91IGFyZSBleHBlcmllbmNpbmcgcmVuZGVyaW5nIGlzc3VlcywgdXNlIENocm9tZSBpbnN0ZWFkXG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L05hdi5pdGVtPlxuXHR9LFxuKi9cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPE5hdi5iYXNlPlxuXHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHQ8TmF2LmxvZ28gLz5cblx0XHRcdFx0PE5hdi5pdGVtIGhyZWY9Jy8nIGNsYXNzTmFtZT0naG9tZWJyZXdMb2dvJz5cblx0XHRcdFx0XHQ8ZGl2PlRoZSBIb21lYnJld2VyeTwvZGl2PlxuXHRcdFx0XHQ8L05hdi5pdGVtPlxuXHRcdFx0XHQ8TmF2Lml0ZW0+e2B2JHt0aGlzLnN0YXRlLnZlcn1gfTwvTmF2Lml0ZW0+XG5cblx0XHRcdFx0ey8qdGhpcy5yZW5kZXJDaHJvbWVXYXJuaW5nKCkqL31cblx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHQ8L05hdi5iYXNlPjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2YmFyO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJvcHMpe1xuXHRyZXR1cm4gPE5hdi5pdGVtXG5cdFx0Y2xhc3NOYW1lPSdwYXRyZW9uJ1xuXHRcdG5ld1RhYj17dHJ1ZX1cblx0XHRocmVmPSdodHRwczovL3d3dy5wYXRyZW9uLmNvbS9zdG9sa3Nkb3JmJ1xuXHRcdGNvbG9yPSdncmVlbidcblx0XHRpY29uPSdmYS1oZWFydCc+XG5cdFx0aGVscCBvdXRcblx0PC9OYXYuaXRlbT47XG59OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByb3BzKXtcblx0cmV0dXJuIDxOYXYuaXRlbSBuZXdUYWI9e3RydWV9IGhyZWY9e2AvcHJpbnQvJHtwcm9wcy5zaGFyZUlkfT9kaWFsb2c9dHJ1ZWB9IGNvbG9yPSdwdXJwbGUnIGljb249J2ZhLWZpbGUtcGRmLW8nPlxuXHRcdGdldCBQREZcblx0PC9OYXYuaXRlbT47XG59OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBNb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcblxuY29uc3QgRURJVF9LRVkgPSAnaG9tZWJyZXdlcnktcmVjZW50bHktZWRpdGVkJztcbmNvbnN0IFZJRVdfS0VZID0gJ2hvbWVicmV3ZXJ5LXJlY2VudGx5LXZpZXdlZCc7XG5cblxuY29uc3QgUmVjZW50SXRlbXMgPSBjcmVhdGVDbGFzcyh7XG5cblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0b3JhZ2VLZXkgOiAnJyxcblx0XHRcdHNob3dFZGl0ICAgOiBmYWxzZSxcblx0XHRcdHNob3dWaWV3ICAgOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNob3dEcm9wZG93biA6IGZhbHNlLFxuXHRcdFx0ZWRpdCAgICAgICAgIDogW10sXG5cdFx0XHR2aWV3ICAgICAgICAgOiBbXVxuXHRcdH07XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblxuXHQvLz09IExvYWQgcmVjZW50IGl0ZW1zIGxpc3QgPT0vL1xuXHRcdGxldCBlZGl0ZWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKEVESVRfS0VZKSB8fCAnW10nKTtcblx0XHRsZXQgdmlld2VkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShWSUVXX0tFWSkgfHwgJ1tdJyk7XG5cblx0XHQvLz09IEFkZCBjdXJyZW50IGJyZXcgdG8gYXBwcm9wcmlhdGUgcmVjZW50IGl0ZW1zIGxpc3QgKGRlcGVuZGluZyBvbiBzdG9yYWdlS2V5KSA9PS8vXG5cdFx0aWYodGhpcy5wcm9wcy5zdG9yYWdlS2V5ID09ICdlZGl0Jyl7XG5cdFx0XHRlZGl0ZWQgPSBfLmZpbHRlcihlZGl0ZWQsIChicmV3KT0+e1xuXHRcdFx0XHRyZXR1cm4gYnJldy5pZCAhPT0gdGhpcy5wcm9wcy5icmV3LmVkaXRJZDtcblx0XHRcdH0pO1xuXHRcdFx0ZWRpdGVkLnVuc2hpZnQoe1xuXHRcdFx0XHRpZCAgICA6IHRoaXMucHJvcHMuYnJldy5lZGl0SWQsXG5cdFx0XHRcdHRpdGxlIDogdGhpcy5wcm9wcy5icmV3LnRpdGxlLFxuXHRcdFx0XHR1cmwgICA6IGAvZWRpdC8ke3RoaXMucHJvcHMuYnJldy5lZGl0SWR9YCxcblx0XHRcdFx0dHMgICAgOiBEYXRlLm5vdygpXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYodGhpcy5wcm9wcy5zdG9yYWdlS2V5ID09ICd2aWV3Jyl7XG5cdFx0XHR2aWV3ZWQgPSBfLmZpbHRlcih2aWV3ZWQsIChicmV3KT0+e1xuXHRcdFx0XHRyZXR1cm4gYnJldy5pZCAhPT0gdGhpcy5wcm9wcy5icmV3LnNoYXJlSWQ7XG5cdFx0XHR9KTtcblx0XHRcdHZpZXdlZC51bnNoaWZ0KHtcblx0XHRcdFx0aWQgICAgOiB0aGlzLnByb3BzLmJyZXcuc2hhcmVJZCxcblx0XHRcdFx0dGl0bGUgOiB0aGlzLnByb3BzLmJyZXcudGl0bGUsXG5cdFx0XHRcdHVybCAgIDogYC9zaGFyZS8ke3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfWAsXG5cdFx0XHRcdHRzICAgIDogRGF0ZS5ub3coKVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly89PSBTdG9yZSB0aGUgdXBkYXRlZCBsaXN0cyAodXAgdG8gOCBpdGVtcyBlYWNoKSA9PS8vXG5cdFx0ZWRpdGVkID0gXy5zbGljZShlZGl0ZWQsIDAsIDgpO1xuXHRcdHZpZXdlZCA9IF8uc2xpY2Uodmlld2VkLCAwLCA4KTtcblxuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKEVESVRfS0VZLCBKU09OLnN0cmluZ2lmeShlZGl0ZWQpKTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShWSUVXX0tFWSwgSlNPTi5zdHJpbmdpZnkodmlld2VkKSk7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGVkaXQgOiBlZGl0ZWQsXG5cdFx0XHR2aWV3IDogdmlld2VkXG5cdFx0fSk7XG5cdH0sXG5cblx0aGFuZGxlRHJvcGRvd24gOiBmdW5jdGlvbihzaG93KXtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNob3dEcm9wZG93biA6IHNob3dcblx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXJEcm9wZG93biA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMuc3RhdGUuc2hvd0Ryb3Bkb3duKSByZXR1cm4gbnVsbDtcblxuXHRcdGNvbnN0IG1ha2VJdGVtcyA9IChicmV3cyk9Pntcblx0XHRcdHJldHVybiBfLm1hcChicmV3cywgKGJyZXcpPT57XG5cdFx0XHRcdHJldHVybiA8YSBocmVmPXticmV3LnVybH0gY2xhc3NOYW1lPSdpdGVtJyBrZXk9e2JyZXcuaWR9IHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT0ndGl0bGUnPnticmV3LnRpdGxlIHx8ICdbIG5vIHRpdGxlIF0nfTwvc3Bhbj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9J3RpbWUnPntNb21lbnQoYnJldy50cykuZnJvbU5vdygpfTwvc3Bhbj5cblx0XHRcdFx0PC9hPjtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2Ryb3Bkb3duJz5cblx0XHRcdHsodGhpcy5wcm9wcy5zaG93RWRpdCAmJiB0aGlzLnByb3BzLnNob3dWaWV3KSA/XG5cdFx0XHRcdDxoND5lZGl0ZWQ8L2g0PiA6IG51bGwgfVxuXHRcdFx0e3RoaXMucHJvcHMuc2hvd0VkaXQgP1xuXHRcdFx0XHRtYWtlSXRlbXModGhpcy5zdGF0ZS5lZGl0KSA6IG51bGwgfVxuXHRcdFx0eyh0aGlzLnByb3BzLnNob3dFZGl0ICYmIHRoaXMucHJvcHMuc2hvd1ZpZXcpID9cblx0XHRcdFx0PGg0PnZpZXdlZDwvaDQ+XHQ6IG51bGwgfVxuXHRcdFx0e3RoaXMucHJvcHMuc2hvd1ZpZXcgP1xuXHRcdFx0XHRtYWtlSXRlbXModGhpcy5zdGF0ZS52aWV3KSA6IG51bGwgfVxuXHRcdDwvZGl2Pjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8TmF2Lml0ZW0gaWNvbj0nZmEtY2xvY2stbycgY29sb3I9J2dyZXknIGNsYXNzTmFtZT0ncmVjZW50J1xuXHRcdFx0b25Nb3VzZUVudGVyPXsoKT0+dGhpcy5oYW5kbGVEcm9wZG93bih0cnVlKX1cblx0XHRcdG9uTW91c2VMZWF2ZT17KCk9PnRoaXMuaGFuZGxlRHJvcGRvd24oZmFsc2UpfT5cblx0XHRcdHt0aGlzLnByb3BzLnRleHR9XG5cdFx0XHR7dGhpcy5yZW5kZXJEcm9wZG93bigpfVxuXHRcdDwvTmF2Lml0ZW0+O1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRlZGl0ZWQgOiAocHJvcHMpPT57XG5cdFx0cmV0dXJuIDxSZWNlbnRJdGVtc1xuXHRcdFx0YnJldz17cHJvcHMuYnJld31cblx0XHRcdHN0b3JhZ2VLZXk9e3Byb3BzLnN0b3JhZ2VLZXl9XG5cdFx0XHR0ZXh0PSdyZWNlbnRseSBlZGl0ZWQnXG5cdFx0XHRzaG93RWRpdD17dHJ1ZX1cblx0XHQvPjtcblx0fSxcblxuXHR2aWV3ZWQgOiAocHJvcHMpPT57XG5cdFx0cmV0dXJuIDxSZWNlbnRJdGVtc1xuXHRcdFx0YnJldz17cHJvcHMuYnJld31cblx0XHRcdHN0b3JhZ2VLZXk9e3Byb3BzLnN0b3JhZ2VLZXl9XG5cdFx0XHR0ZXh0PSdyZWNlbnRseSB2aWV3ZWQnXG5cdFx0XHRzaG93Vmlldz17dHJ1ZX1cblx0XHQvPjtcblx0fSxcblxuXHRib3RoIDogKHByb3BzKT0+e1xuXHRcdHJldHVybiA8UmVjZW50SXRlbXNcblx0XHRcdGJyZXc9e3Byb3BzLmJyZXd9XG5cdFx0XHRzdG9yYWdlS2V5PXtwcm9wcy5zdG9yYWdlS2V5fVxuXHRcdFx0dGV4dD0ncmVjZW50IGJyZXdzJ1xuXHRcdFx0c2hvd0VkaXQ9e3RydWV9XG5cdFx0XHRzaG93Vmlldz17dHJ1ZX1cblx0XHQvPjtcblx0fVxufTsiLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG5jb25zdCBOYXYgPSByZXF1aXJlKCduYXR1cmFsY3JpdC9uYXYvbmF2LmpzeCcpO1xuY29uc3QgTmF2YmFyID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL25hdmJhci5qc3gnKTtcblxuY29uc3QgUmVwb3J0SXNzdWUgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvaXNzdWUubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFByaW50TGluayA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9wcmludC5uYXZpdGVtLmpzeCcpO1xuY29uc3QgQWNjb3VudCA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4Jyk7XG5jb25zdCBSZWNlbnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCcpLmJvdGg7XG5cbmNvbnN0IFNwbGl0UGFuZSA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L3NwbGl0UGFuZS9zcGxpdFBhbmUuanN4Jyk7XG5jb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuLi8uLi9lZGl0b3IvZWRpdG9yLmpzeCcpO1xuY29uc3QgQnJld1JlbmRlcmVyID0gcmVxdWlyZSgnLi4vLi4vYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3gnKTtcblxuY29uc3QgTWFya2Rvd24gPSByZXF1aXJlKCduYXR1cmFsY3JpdC9tYXJrZG93bi5qcycpO1xuXG5jb25zdCBTQVZFX1RJTUVPVVQgPSAzMDAwO1xuXG5cbmNvbnN0IEVkaXRQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YnJldyA6IHtcblx0XHRcdFx0dGV4dCAgICAgIDogJycsXG5cdFx0XHRcdHNoYXJlSWQgICA6IG51bGwsXG5cdFx0XHRcdGVkaXRJZCAgICA6IG51bGwsXG5cdFx0XHRcdGNyZWF0ZWRBdCA6IG51bGwsXG5cdFx0XHRcdHVwZGF0ZWRBdCA6IG51bGwsXG5cblx0XHRcdFx0dGl0bGUgICAgICAgOiAnJyxcblx0XHRcdFx0ZGVzY3JpcHRpb24gOiAnJyxcblx0XHRcdFx0dGFncyAgICAgICAgOiAnJyxcblx0XHRcdFx0cHVibGlzaGVkICAgOiBmYWxzZSxcblx0XHRcdFx0YXV0aG9ycyAgICAgOiBbXSxcblx0XHRcdFx0c3lzdGVtcyAgICAgOiBbXVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGJyZXcgOiB0aGlzLnByb3BzLmJyZXcsXG5cblx0XHRcdGlzU2F2aW5nICAgOiBmYWxzZSxcblx0XHRcdGlzUGVuZGluZyAgOiBmYWxzZSxcblx0XHRcdGVycm9ycyAgICAgOiBudWxsLFxuXHRcdFx0aHRtbEVycm9ycyA6IE1hcmtkb3duLnZhbGlkYXRlKHRoaXMucHJvcHMuYnJldy50ZXh0KSxcblx0XHR9O1xuXHR9LFxuXHRzYXZlZEJyZXcgOiBudWxsLFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnRyeVNhdmUoKTtcblx0XHR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSAoKT0+e1xuXHRcdFx0aWYodGhpcy5zdGF0ZS5pc1NhdmluZyB8fCB0aGlzLnN0YXRlLmlzUGVuZGluZyl7XG5cdFx0XHRcdHJldHVybiAnWW91IGhhdmUgdW5zYXZlZCBjaGFuZ2VzISc7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoKHByZXZTdGF0ZSk9Pih7XG5cdFx0XHRodG1sRXJyb3JzIDogTWFya2Rvd24udmFsaWRhdGUocHJldlN0YXRlLmJyZXcudGV4dClcblx0XHR9KSk7XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVDb250cm9sS2V5cyk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0d2luZG93Lm9uYmVmb3JldW5sb2FkID0gZnVuY3Rpb24oKXt9O1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUNvbnRyb2xLZXlzKTtcblx0fSxcblxuXG5cdGhhbmRsZUNvbnRyb2xLZXlzIDogZnVuY3Rpb24oZSl7XG5cdFx0aWYoIShlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSkgcmV0dXJuO1xuXHRcdGNvbnN0IFNfS0VZID0gODM7XG5cdFx0Y29uc3QgUF9LRVkgPSA4MDtcblx0XHRpZihlLmtleUNvZGUgPT0gU19LRVkpIHRoaXMuc2F2ZSgpO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBQX0tFWSkgd2luZG93Lm9wZW4oYC9wcmludC8ke3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfT9kaWFsb2c9dHJ1ZWAsICdfYmxhbmsnKS5mb2N1cygpO1xuXHRcdGlmKGUua2V5Q29kZSA9PSBQX0tFWSB8fCBlLmtleUNvZGUgPT0gU19LRVkpe1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH0sXG5cblx0aGFuZGxlU3BsaXRNb3ZlIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnJlZnMuZWRpdG9yLnVwZGF0ZSgpO1xuXHR9LFxuXG5cdGhhbmRsZU1ldGFkYXRhQ2hhbmdlIDogZnVuY3Rpb24obWV0YWRhdGEpe1xuXHRcdHRoaXMuc2V0U3RhdGUoKHByZXZTdGF0ZSk9Pih7XG5cdFx0XHRicmV3ICAgICAgOiBfLm1lcmdlKHt9LCBwcmV2U3RhdGUuYnJldywgbWV0YWRhdGEpLFxuXHRcdFx0aXNQZW5kaW5nIDogdHJ1ZSxcblx0XHR9KSwgKCk9PnRoaXMudHJ5U2F2ZSgpKTtcblxuXHR9LFxuXG5cdGhhbmRsZVRleHRDaGFuZ2UgOiBmdW5jdGlvbih0ZXh0KXtcblxuXHRcdC8vSWYgdGhlcmUgYXJlIGVycm9ycywgcnVuIHRoZSB2YWxpZGF0b3Igb24gZXZlcnljaGFuZ2UgdG8gZ2l2ZSBxdWljayBmZWVkYmFja1xuXHRcdGxldCBodG1sRXJyb3JzID0gdGhpcy5zdGF0ZS5odG1sRXJyb3JzO1xuXHRcdGlmKGh0bWxFcnJvcnMubGVuZ3RoKSBodG1sRXJyb3JzID0gTWFya2Rvd24udmFsaWRhdGUodGV4dCk7XG5cblx0XHR0aGlzLnNldFN0YXRlKChwcmV2U3RhdGUpPT4oe1xuXHRcdFx0YnJldyAgICAgICA6IF8ubWVyZ2Uoe30sIHByZXZTdGF0ZS5icmV3LCB7IHRleHQ6IHRleHQgfSksXG5cdFx0XHRpc1BlbmRpbmcgIDogdHJ1ZSxcblx0XHRcdGh0bWxFcnJvcnMgOiBodG1sRXJyb3JzXG5cdFx0fSksICgpPT50aGlzLnRyeVNhdmUoKSk7XG5cdH0sXG5cblx0aGFzQ2hhbmdlcyA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3Qgc2F2ZWRCcmV3ID0gdGhpcy5zYXZlZEJyZXcgPyB0aGlzLnNhdmVkQnJldyA6IHRoaXMucHJvcHMuYnJldztcblx0XHRyZXR1cm4gIV8uaXNFcXVhbCh0aGlzLnN0YXRlLmJyZXcsIHNhdmVkQnJldyk7XG5cdH0sXG5cblx0dHJ5U2F2ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIXRoaXMuZGVib3VuY2VTYXZlKSB0aGlzLmRlYm91bmNlU2F2ZSA9IF8uZGVib3VuY2UodGhpcy5zYXZlLCBTQVZFX1RJTUVPVVQpO1xuXHRcdGlmKHRoaXMuaGFzQ2hhbmdlcygpKXtcblx0XHRcdHRoaXMuZGVib3VuY2VTYXZlKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZGVib3VuY2VTYXZlLmNhbmNlbCgpO1xuXHRcdH1cblx0fSxcblxuXHRzYXZlIDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLmRlYm91bmNlU2F2ZSAmJiB0aGlzLmRlYm91bmNlU2F2ZS5jYW5jZWwpIHRoaXMuZGVib3VuY2VTYXZlLmNhbmNlbCgpO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSgocHJldlN0YXRlKT0+KHtcblx0XHRcdGlzU2F2aW5nICAgOiB0cnVlLFxuXHRcdFx0ZXJyb3JzICAgICA6IG51bGwsXG5cdFx0XHRodG1sRXJyb3JzIDogTWFya2Rvd24udmFsaWRhdGUocHJldlN0YXRlLmJyZXcudGV4dClcblx0XHR9KSk7XG5cblx0XHRyZXF1ZXN0XG5cdFx0XHQucHV0KGAvYXBpL3VwZGF0ZS8ke3RoaXMucHJvcHMuYnJldy5lZGl0SWR9YClcblx0XHRcdC5zZW5kKHRoaXMuc3RhdGUuYnJldylcblx0XHRcdC5lbmQoKGVyciwgcmVzKT0+e1xuXHRcdFx0XHRpZihlcnIpe1xuXHRcdFx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdFx0ZXJyb3JzIDogZXJyLFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2F2ZWRCcmV3ID0gcmVzLmJvZHk7XG5cdFx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdFx0XHRpc1BlbmRpbmcgOiBmYWxzZSxcblx0XHRcdFx0XHRcdGlzU2F2aW5nICA6IGZhbHNlLFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXJTYXZlQnV0dG9uIDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLnN0YXRlLmVycm9ycyl7XG5cdFx0XHRsZXQgZXJyTXNnID0gJyc7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRlcnJNc2cgKz0gYCR7dGhpcy5zdGF0ZS5lcnJvcnMudG9TdHJpbmcoKX1cXG5cXG5gO1xuXHRcdFx0XHRlcnJNc2cgKz0gYFxcYFxcYFxcYFxcbiR7SlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZS5lcnJvcnMucmVzcG9uc2UuZXJyb3IsIG51bGwsICcgICcpfVxcblxcYFxcYFxcYGA7XG5cdFx0XHR9IGNhdGNoIChlKXt9XG5cblx0XHRcdHJldHVybiA8TmF2Lml0ZW0gY2xhc3NOYW1lPSdzYXZlIGVycm9yJyBpY29uPSdmYS13YXJuaW5nJz5cblx0XHRcdFx0T29wcyFcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J2Vycm9yQ29udGFpbmVyJz5cblx0XHRcdFx0XHRMb29rcyBsaWtlIHRoZXJlIHdhcyBhIHByb2JsZW0gc2F2aW5nLiA8YnIgLz5cblx0XHRcdFx0XHRSZXBvcnQgdGhlIGlzc3VlIDxhIHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInXG5cdFx0XHRcdFx0XHRocmVmPXtgaHR0cHM6Ly9naXRodWIuY29tL3N0b2xrc2RvcmYvbmF0dXJhbGNyaXQvaXNzdWVzL25ldz9ib2R5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGVyck1zZyl9YH0+XG5cdFx0XHRcdFx0XHRoZXJlXG5cdFx0XHRcdFx0PC9hPi5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L05hdi5pdGVtPjtcblx0XHR9XG5cblx0XHRpZih0aGlzLnN0YXRlLmlzU2F2aW5nKXtcblx0XHRcdHJldHVybiA8TmF2Lml0ZW0gY2xhc3NOYW1lPSdzYXZlJyBpY29uPSdmYS1zcGlubmVyIGZhLXNwaW4nPnNhdmluZy4uLjwvTmF2Lml0ZW0+O1xuXHRcdH1cblx0XHRpZih0aGlzLnN0YXRlLmlzUGVuZGluZyAmJiB0aGlzLmhhc0NoYW5nZXMoKSl7XG5cdFx0XHRyZXR1cm4gPE5hdi5pdGVtIGNsYXNzTmFtZT0nc2F2ZScgb25DbGljaz17dGhpcy5zYXZlfSBjb2xvcj0nYmx1ZScgaWNvbj0nZmEtc2F2ZSc+U2F2ZSBOb3c8L05hdi5pdGVtPjtcblx0XHR9XG5cdFx0aWYoIXRoaXMuc3RhdGUuaXNQZW5kaW5nICYmICF0aGlzLnN0YXRlLmlzU2F2aW5nKXtcblx0XHRcdHJldHVybiA8TmF2Lml0ZW0gY2xhc3NOYW1lPSdzYXZlIHNhdmVkJz5zYXZlZC48L05hdi5pdGVtPjtcblx0XHR9XG5cdH0sXG5cdHJlbmRlck5hdmJhciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxOYXZiYXI+XG5cdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdDxOYXYuaXRlbSBjbGFzc05hbWU9J2JyZXdUaXRsZSc+e3RoaXMuc3RhdGUuYnJldy50aXRsZX08L05hdi5pdGVtPlxuXHRcdFx0PC9OYXYuc2VjdGlvbj5cblxuXHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHR7dGhpcy5yZW5kZXJTYXZlQnV0dG9uKCl9XG5cdFx0XHRcdDxSZXBvcnRJc3N1ZSAvPlxuXHRcdFx0XHQ8TmF2Lml0ZW0gbmV3VGFiPXt0cnVlfSBocmVmPXtgL3NoYXJlLyR7dGhpcy5wcm9wcy5icmV3LnNoYXJlSWR9YH0gY29sb3I9J3RlYWwnIGljb249J2ZhLXNoYXJlLWFsdCc+XG5cdFx0XHRcdFx0U2hhcmVcblx0XHRcdFx0PC9OYXYuaXRlbT5cblx0XHRcdFx0PFByaW50TGluayBzaGFyZUlkPXt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH0gLz5cblx0XHRcdFx0PFJlY2VudE5hdkl0ZW0gYnJldz17dGhpcy5wcm9wcy5icmV3fSBzdG9yYWdlS2V5PSdlZGl0JyAvPlxuXHRcdFx0XHQ8QWNjb3VudCAvPlxuXHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHQ8L05hdmJhcj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2VkaXRQYWdlIHBhZ2UnPlxuXHRcdFx0e3RoaXMucmVuZGVyTmF2YmFyKCl9XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250ZW50Jz5cblx0XHRcdFx0PFNwbGl0UGFuZSBvbkRyYWdGaW5pc2g9e3RoaXMuaGFuZGxlU3BsaXRNb3ZlfSByZWY9J3BhbmUnPlxuXHRcdFx0XHRcdDxFZGl0b3Jcblx0XHRcdFx0XHRcdHJlZj0nZWRpdG9yJ1xuXHRcdFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUuYnJldy50ZXh0fVxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMuaGFuZGxlVGV4dENoYW5nZX1cblx0XHRcdFx0XHRcdG1ldGFkYXRhPXt0aGlzLnN0YXRlLmJyZXd9XG5cdFx0XHRcdFx0XHRvbk1ldGFkYXRhQ2hhbmdlPXt0aGlzLmhhbmRsZU1ldGFkYXRhQ2hhbmdlfVxuXHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0PEJyZXdSZW5kZXJlciB0ZXh0PXt0aGlzLnN0YXRlLmJyZXcudGV4dH0gZXJyb3JzPXt0aGlzLnN0YXRlLmh0bWxFcnJvcnN9IC8+XG5cdFx0XHRcdDwvU3BsaXRQYW5lPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0UGFnZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgTmF2ID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvbmF2L25hdi5qc3gnKTtcbmNvbnN0IE5hdmJhciA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9uYXZiYXIuanN4Jyk7XG5jb25zdCBQYXRyZW9uTmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9wYXRyZW9uLm5hdml0ZW0uanN4Jyk7XG5jb25zdCBJc3N1ZU5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvaXNzdWUubmF2aXRlbS5qc3gnKTtcbmNvbnN0IFJlY2VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcmVjZW50Lm5hdml0ZW0uanN4JykuYm90aDtcblxuY29uc3QgQnJld1JlbmRlcmVyID0gcmVxdWlyZSgnLi4vLi4vYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3gnKTtcblxuY29uc3QgRXJyb3JQYWdlID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dmVyICAgICA6ICcwLjAuMCcsXG5cdFx0XHRlcnJvcklkIDogJydcblx0XHR9O1xuXHR9LFxuXG5cdHRleHQgOiAnIyBPb3BzIFxcbiBXZSBjb3VsZCBub3QgZmluZCBhIGJyZXcgd2l0aCB0aGF0IGlkLiAqKlNvcnJ5ISoqJyxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nZXJyb3JQYWdlIHBhZ2UnPlxuXHRcdFx0PE5hdmJhciB2ZXI9e3RoaXMucHJvcHMudmVyfT5cblx0XHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHRcdDxOYXYuaXRlbSBjbGFzc05hbWU9J2Vycm9yVGl0bGUnPlxuXHRcdFx0XHRcdFx0Q3JpdCBGYWlsIVxuXHRcdFx0XHRcdDwvTmF2Lml0ZW0+XG5cdFx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cblx0XHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHRcdDxQYXRyZW9uTmF2SXRlbSAvPlxuXHRcdFx0XHRcdDxJc3N1ZU5hdkl0ZW0gLz5cblx0XHRcdFx0XHQ8UmVjZW50TmF2SXRlbSAvPlxuXHRcdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdFx0PC9OYXZiYXI+XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250ZW50Jz5cblx0XHRcdFx0PEJyZXdSZW5kZXJlciB0ZXh0PXt0aGlzLnRleHR9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVycm9yUGFnZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5jb25zdCBOYXZiYXIgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvbmF2YmFyLmpzeCcpO1xuY29uc3QgUGF0cmVvbk5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvcGF0cmVvbi5uYXZpdGVtLmpzeCcpO1xuY29uc3QgSXNzdWVOYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2lzc3VlLm5hdml0ZW0uanN4Jyk7XG5jb25zdCBSZWNlbnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCcpLmJvdGg7XG5jb25zdCBBY2NvdW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4Jyk7XG5cblxuY29uc3QgU3BsaXRQYW5lID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvc3BsaXRQYW5lL3NwbGl0UGFuZS5qc3gnKTtcbmNvbnN0IEVkaXRvciA9IHJlcXVpcmUoJy4uLy4uL2VkaXRvci9lZGl0b3IuanN4Jyk7XG5jb25zdCBCcmV3UmVuZGVyZXIgPSByZXF1aXJlKCcuLi8uLi9icmV3UmVuZGVyZXIvYnJld1JlbmRlcmVyLmpzeCcpO1xuXG5cblxuY29uc3QgSG9tZVBhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR3ZWxjb21lVGV4dCA6ICcnLFxuXHRcdFx0dmVyICAgICAgICAgOiAnMC4wLjAnXG5cdFx0fTtcblxuXG5cdH0sXG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0ZXh0IDogdGhpcy5wcm9wcy53ZWxjb21lVGV4dFxuXHRcdH07XG5cdH0sXG5cdGhhbmRsZVNhdmUgOiBmdW5jdGlvbigpe1xuXHRcdHJlcXVlc3QucG9zdCgnL2FwaScpXG5cdFx0XHQuc2VuZCh7XG5cdFx0XHRcdHRleHQgOiB0aGlzLnN0YXRlLnRleHRcblx0XHRcdH0pXG5cdFx0XHQuZW5kKChlcnIsIHJlcyk9Pntcblx0XHRcdFx0aWYoZXJyKSByZXR1cm4gZXJyXG5cdFx0XHRcdGNvbnN0IGJyZXcgPSByZXMuYm9keTtcblx0XHRcdFx0d2luZG93LmxvY2F0aW9uID0gYC9lZGl0LyR7YnJldy5lZGl0SWR9YDtcblx0XHRcdH0pO1xuXHR9LFxuXHRoYW5kbGVTcGxpdE1vdmUgOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMucmVmcy5lZGl0b3IudXBkYXRlKCk7XG5cdH0sXG5cdGhhbmRsZVRleHRDaGFuZ2UgOiBmdW5jdGlvbih0ZXh0KXtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHRleHQgOiB0ZXh0XG5cdFx0fSk7XG5cdH0sXG5cdHJlbmRlck5hdmJhciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxOYXZiYXIgdmVyPXt0aGlzLnByb3BzLnZlcn0+XG5cdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdDxQYXRyZW9uTmF2SXRlbSAvPlxuXHRcdFx0XHQ8SXNzdWVOYXZJdGVtIC8+XG5cdFx0XHRcdDxOYXYuaXRlbSBuZXdUYWI9e3RydWV9IGhyZWY9Jy9jaGFuZ2Vsb2cnIGNvbG9yPSdwdXJwbGUnIGljb249J2ZhLWZpbGUtdGV4dC1vJz5cblx0XHRcdFx0XHRDaGFuZ2Vsb2dcblx0XHRcdFx0PC9OYXYuaXRlbT5cblx0XHRcdFx0PFJlY2VudE5hdkl0ZW0gLz5cblx0XHRcdFx0PEFjY291bnROYXZJdGVtIC8+XG5cdFx0XHRcdHsvKn1cblx0XHRcdFx0PE5hdi5pdGVtIGhyZWY9Jy9uZXcnIGNvbG9yPSdncmVlbicgaWNvbj0nZmEtZXh0ZXJuYWwtbGluayc+XG5cdFx0XHRcdFx0TmV3IEJyZXdcblx0XHRcdFx0PC9OYXYuaXRlbT5cblx0XHRcdFx0Ki99XG5cdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdDwvTmF2YmFyPjtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0naG9tZVBhZ2UgcGFnZSc+XG5cdFx0XHR7dGhpcy5yZW5kZXJOYXZiYXIoKX1cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRlbnQnPlxuXHRcdFx0XHQ8U3BsaXRQYW5lIG9uRHJhZ0ZpbmlzaD17dGhpcy5oYW5kbGVTcGxpdE1vdmV9IHJlZj0ncGFuZSc+XG5cdFx0XHRcdFx0PEVkaXRvciB2YWx1ZT17dGhpcy5zdGF0ZS50ZXh0fSBvbkNoYW5nZT17dGhpcy5oYW5kbGVUZXh0Q2hhbmdlfSByZWY9J2VkaXRvcicvPlxuXHRcdFx0XHRcdDxCcmV3UmVuZGVyZXIgdGV4dD17dGhpcy5zdGF0ZS50ZXh0fSAvPlxuXHRcdFx0XHQ8L1NwbGl0UGFuZT5cblx0XHRcdDwvZGl2PlxuXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y3goJ2Zsb2F0aW5nU2F2ZUJ1dHRvbicsIHsgc2hvdzogdGhpcy5wcm9wcy53ZWxjb21lVGV4dCAhPSB0aGlzLnN0YXRlLnRleHQgfSl9IG9uQ2xpY2s9e3RoaXMuaGFuZGxlU2F2ZX0+XG5cdFx0XHRcdFNhdmUgY3VycmVudCA8aSBjbGFzc05hbWU9J2ZhIGZhLXNhdmUnIC8+XG5cdFx0XHQ8L2Rpdj5cblxuXHRcdFx0PGEgaHJlZj0nL25ldycgY2xhc3NOYW1lPSdmbG9hdGluZ05ld0J1dHRvbic+XG5cdFx0XHRcdENyZWF0ZSB5b3VyIG93biA8aSBjbGFzc05hbWU9J2ZhIGZhLW1hZ2ljJyAvPlxuXHRcdFx0PC9hPlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSG9tZVBhZ2U7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG5jb25zdCBNYXJrZG93biA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L21hcmtkb3duLmpzJyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5jb25zdCBOYXZiYXIgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvbmF2YmFyLmpzeCcpO1xuY29uc3QgQWNjb3VudE5hdkl0ZW0gPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvYWNjb3VudC5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUmVjZW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9yZWNlbnQubmF2aXRlbS5qc3gnKS5ib3RoO1xuY29uc3QgSXNzdWVOYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2lzc3VlLm5hdml0ZW0uanN4Jyk7XG5cbmNvbnN0IFNwbGl0UGFuZSA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L3NwbGl0UGFuZS9zcGxpdFBhbmUuanN4Jyk7XG5jb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuLi8uLi9lZGl0b3IvZWRpdG9yLmpzeCcpO1xuY29uc3QgQnJld1JlbmRlcmVyID0gcmVxdWlyZSgnLi4vLi4vYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3gnKTtcblxuXG5jb25zdCBLRVkgPSAnaG9tZWJyZXdlcnktbmV3JztcblxuY29uc3QgTmV3UGFnZSA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1ldGFkYXRhIDoge1xuXHRcdFx0XHR0aXRsZSAgICAgICA6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbiA6ICcnLFxuXHRcdFx0XHR0YWdzICAgICAgICA6ICcnLFxuXHRcdFx0XHRwdWJsaXNoZWQgICA6IGZhbHNlLFxuXHRcdFx0XHRhdXRob3JzICAgICA6IFtdLFxuXHRcdFx0XHRzeXN0ZW1zICAgICA6IFtdXG5cdFx0XHR9LFxuXG5cdFx0XHR0ZXh0ICAgICA6ICcnLFxuXHRcdFx0aXNTYXZpbmcgOiBmYWxzZSxcblx0XHRcdGVycm9ycyAgIDogW11cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHN0b3JhZ2UgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShLRVkpO1xuXHRcdGlmKHN0b3JhZ2Upe1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHRleHQgOiBzdG9yYWdlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlQ29udHJvbEtleXMpO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUNvbnRyb2xLZXlzKTtcblx0fSxcblxuXHRoYW5kbGVDb250cm9sS2V5cyA6IGZ1bmN0aW9uKGUpe1xuXHRcdGlmKCEoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpIHJldHVybjtcblx0XHRjb25zdCBTX0tFWSA9IDgzO1xuXHRcdGNvbnN0IFBfS0VZID0gODA7XG5cdFx0aWYoZS5rZXlDb2RlID09IFNfS0VZKSB0aGlzLnNhdmUoKTtcblx0XHRpZihlLmtleUNvZGUgPT0gUF9LRVkpIHRoaXMucHJpbnQoKTtcblx0XHRpZihlLmtleUNvZGUgPT0gUF9LRVkgfHwgZS5rZXlDb2RlID09IFNfS0VZKXtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZVNwbGl0TW92ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5yZWZzLmVkaXRvci51cGRhdGUoKTtcblx0fSxcblxuXHRoYW5kbGVNZXRhZGF0YUNoYW5nZSA6IGZ1bmN0aW9uKG1ldGFkYXRhKXtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdG1ldGFkYXRhIDogXy5tZXJnZSh7fSwgdGhpcy5zdGF0ZS5tZXRhZGF0YSwgbWV0YWRhdGEpXG5cdFx0fSk7XG5cdH0sXG5cblx0aGFuZGxlVGV4dENoYW5nZSA6IGZ1bmN0aW9uKHRleHQpe1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0dGV4dCAgIDogdGV4dCxcblx0XHRcdGVycm9ycyA6IE1hcmtkb3duLnZhbGlkYXRlKHRleHQpXG5cdFx0fSk7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oS0VZLCB0ZXh0KTtcblx0fSxcblxuXHRzYXZlIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzU2F2aW5nIDogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0cmVxdWVzdC5wb3N0KCcvYXBpJylcblx0XHRcdC5zZW5kKF8ubWVyZ2Uoe30sIHRoaXMuc3RhdGUubWV0YWRhdGEsIHtcblx0XHRcdFx0dGV4dCA6IHRoaXMuc3RhdGUudGV4dFxuXHRcdFx0fSkpXG5cdFx0XHQuZW5kKChlcnIsIHJlcyk9Pntcblx0XHRcdFx0aWYoZXJyKXtcblx0XHRcdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0XHRcdGlzU2F2aW5nIDogZmFsc2Vcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0d2luZG93Lm9uYmVmb3JldW5sb2FkID0gZnVuY3Rpb24oKXt9O1xuXHRcdFx0XHRjb25zdCBicmV3ID0gcmVzLmJvZHk7XG5cdFx0XHRcdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKEtFWSk7XG5cdFx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGAvZWRpdC8ke2JyZXcuZWRpdElkfWA7XG5cdFx0XHR9KTtcblx0fSxcblxuXHRyZW5kZXJTYXZlQnV0dG9uIDogZnVuY3Rpb24oKXtcblx0XHRpZih0aGlzLnN0YXRlLmlzU2F2aW5nKXtcblx0XHRcdHJldHVybiA8TmF2Lml0ZW0gaWNvbj0nZmEtc3Bpbm5lciBmYS1zcGluJyBjbGFzc05hbWU9J3NhdmVCdXR0b24nPlxuXHRcdFx0XHRzYXZlLi4uXG5cdFx0XHQ8L05hdi5pdGVtPjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIDxOYXYuaXRlbSBpY29uPSdmYS1zYXZlJyBjbGFzc05hbWU9J3NhdmVCdXR0b24nIG9uQ2xpY2s9e3RoaXMuc2F2ZX0+XG5cdFx0XHRcdHNhdmVcblx0XHRcdDwvTmF2Lml0ZW0+O1xuXHRcdH1cblx0fSxcblxuXHRwcmludCA6IGZ1bmN0aW9uKCl7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3ByaW50JywgdGhpcy5zdGF0ZS50ZXh0KTtcblx0XHR3aW5kb3cub3BlbignL3ByaW50P2RpYWxvZz10cnVlJmxvY2FsPXByaW50JywgJ19ibGFuaycpO1xuXHR9LFxuXG5cdHJlbmRlckxvY2FsUHJpbnRCdXR0b24gOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiA8TmF2Lml0ZW0gY29sb3I9J3B1cnBsZScgaWNvbj0nZmEtZmlsZS1wZGYtbycgb25DbGljaz17dGhpcy5wcmludH0+XG5cdFx0XHRnZXQgUERGXG5cdFx0PC9OYXYuaXRlbT47XG5cdH0sXG5cblx0cmVuZGVyTmF2YmFyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPE5hdmJhcj5cblxuXHRcdFx0PE5hdi5zZWN0aW9uPlxuXHRcdFx0XHQ8TmF2Lml0ZW0gY2xhc3NOYW1lPSdicmV3VGl0bGUnPnt0aGlzLnN0YXRlLm1ldGFkYXRhLnRpdGxlfTwvTmF2Lml0ZW0+XG5cdFx0XHQ8L05hdi5zZWN0aW9uPlxuXG5cdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdHt0aGlzLnJlbmRlclNhdmVCdXR0b24oKX1cblx0XHRcdFx0e3RoaXMucmVuZGVyTG9jYWxQcmludEJ1dHRvbigpfVxuXHRcdFx0XHQ8SXNzdWVOYXZJdGVtIC8+XG5cdFx0XHRcdDxSZWNlbnROYXZJdGVtIC8+XG5cdFx0XHRcdDxBY2NvdW50TmF2SXRlbSAvPlxuXHRcdFx0PC9OYXYuc2VjdGlvbj5cblx0XHQ8L05hdmJhcj47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J25ld1BhZ2UgcGFnZSc+XG5cdFx0XHR7dGhpcy5yZW5kZXJOYXZiYXIoKX1cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250ZW50Jz5cblx0XHRcdFx0PFNwbGl0UGFuZSBvbkRyYWdGaW5pc2g9e3RoaXMuaGFuZGxlU3BsaXRNb3ZlfSByZWY9J3BhbmUnPlxuXHRcdFx0XHRcdDxFZGl0b3Jcblx0XHRcdFx0XHRcdHJlZj0nZWRpdG9yJ1xuXHRcdFx0XHRcdFx0dmFsdWU9e3RoaXMuc3RhdGUudGV4dH1cblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLmhhbmRsZVRleHRDaGFuZ2V9XG5cdFx0XHRcdFx0XHRtZXRhZGF0YT17dGhpcy5zdGF0ZS5tZXRhZGF0YX1cblx0XHRcdFx0XHRcdG9uTWV0YWRhdGFDaGFuZ2U9e3RoaXMuaGFuZGxlTWV0YWRhdGFDaGFuZ2V9XG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHQ8QnJld1JlbmRlcmVyIHRleHQ9e3RoaXMuc3RhdGUudGV4dH0gZXJyb3JzPXt0aGlzLnN0YXRlLmVycm9yc30gLz5cblx0XHRcdFx0PC9TcGxpdFBhbmU+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5ld1BhZ2U7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyAgICAgPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGN4ICAgID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29uc3QgTWFya2Rvd24gPSByZXF1aXJlKCduYXR1cmFsY3JpdC9tYXJrZG93bi5qcycpO1xuXG5jb25zdCBQcmludFBhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRxdWVyeSA6IHt9LFxuXHRcdFx0YnJldyAgOiB7XG5cdFx0XHRcdHRleHQgOiAnJyxcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGdldEluaXRpYWxTdGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3VGV4dCA6IHRoaXMucHJvcHMuYnJldy50ZXh0XG5cdFx0fTtcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMucHJvcHMucXVlcnkubG9jYWwpe1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSgocHJldlN0YXRlLCBwcmV2UHJvcHMpPT4oe1xuXHRcdFx0XHRicmV3VGV4dCA6IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHByZXZQcm9wcy5xdWVyeS5sb2NhbClcblx0XHRcdH0pKTtcblx0XHR9XG5cblx0XHRpZih0aGlzLnByb3BzLnF1ZXJ5LmRpYWxvZykgd2luZG93LnByaW50KCk7XG5cdH0sXG5cblx0cmVuZGVyUGFnZXMgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBfLm1hcCh0aGlzLnN0YXRlLmJyZXdUZXh0LnNwbGl0KCdcXFxccGFnZScpLCAocGFnZSwgaW5kZXgpPT57XG5cdFx0XHRyZXR1cm4gPGRpdlxuXHRcdFx0XHRjbGFzc05hbWU9J2FnZSdcblx0XHRcdFx0aWQ9e2BwJHtpbmRleCArIDF9YH1cblx0XHRcdFx0ZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBNYXJrZG93bi5yZW5kZXIocGFnZSkgfX1cblx0XHRcdFx0a2V5PXtpbmRleH0gLz47XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdj5cblx0XHRcdHt0aGlzLnJlbmRlclBhZ2VzKCl9XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcmludFBhZ2U7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5jb25zdCBOYXZiYXIgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvbmF2YmFyLmpzeCcpO1xuY29uc3QgUHJpbnRMaW5rID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3ByaW50Lm5hdml0ZW0uanN4Jyk7XG5jb25zdCBSZXBvcnRJc3N1ZSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9pc3N1ZS5uYXZpdGVtLmpzeCcpO1xuY29uc3QgUmVjZW50TmF2SXRlbSA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9yZWNlbnQubmF2aXRlbS5qc3gnKS5ib3RoO1xuY29uc3QgQWNjb3VudCA9IHJlcXVpcmUoJy4uLy4uL25hdmJhci9hY2NvdW50Lm5hdml0ZW0uanN4Jyk7XG5cblxuY29uc3QgQnJld1JlbmRlcmVyID0gcmVxdWlyZSgnLi4vLi4vYnJld1JlbmRlcmVyL2JyZXdSZW5kZXJlci5qc3gnKTtcblxuXG5jb25zdCBTaGFyZVBhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3IDoge1xuXHRcdFx0XHR0aXRsZSAgICAgOiAnJyxcblx0XHRcdFx0dGV4dCAgICAgIDogJycsXG5cdFx0XHRcdHNoYXJlSWQgICA6IG51bGwsXG5cdFx0XHRcdGNyZWF0ZWRBdCA6IG51bGwsXG5cdFx0XHRcdHVwZGF0ZWRBdCA6IG51bGwsXG5cdFx0XHRcdHZpZXdzICAgICA6IDBcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlQ29udHJvbEtleXMpO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUNvbnRyb2xLZXlzKTtcblx0fSxcblx0aGFuZGxlQ29udHJvbEtleXMgOiBmdW5jdGlvbihlKXtcblx0XHRpZighKGUuY3RybEtleSB8fCBlLm1ldGFLZXkpKSByZXR1cm47XG5cdFx0Y29uc3QgUF9LRVkgPSA4MDtcblx0XHRpZihlLmtleUNvZGUgPT0gUF9LRVkpe1xuXHRcdFx0d2luZG93Lm9wZW4oYC9wcmludC8ke3RoaXMucHJvcHMuYnJldy5zaGFyZUlkfT9kaWFsb2c9dHJ1ZWAsICdfYmxhbmsnKS5mb2N1cygpO1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J3NoYXJlUGFnZSBwYWdlJz5cblx0XHRcdDxOYXZiYXI+XG5cdFx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0XHQ8TmF2Lml0ZW0gY2xhc3NOYW1lPSdicmV3VGl0bGUnPnt0aGlzLnByb3BzLmJyZXcudGl0bGV9PC9OYXYuaXRlbT5cblx0XHRcdFx0PC9OYXYuc2VjdGlvbj5cblxuXHRcdFx0XHQ8TmF2LnNlY3Rpb24+XG5cdFx0XHRcdFx0PFJlcG9ydElzc3VlIC8+XG5cdFx0XHRcdFx0PFByaW50TGluayBzaGFyZUlkPXt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH0gLz5cblx0XHRcdFx0XHQ8TmF2Lml0ZW0gaHJlZj17YC9zb3VyY2UvJHt0aGlzLnByb3BzLmJyZXcuc2hhcmVJZH1gfSBjb2xvcj0ndGVhbCcgaWNvbj0nZmEtY29kZSc+XG5cdFx0XHRcdFx0XHRzb3VyY2Vcblx0XHRcdFx0XHQ8L05hdi5pdGVtPlxuXHRcdFx0XHRcdDxSZWNlbnROYXZJdGVtIGJyZXc9e3RoaXMucHJvcHMuYnJld30gc3RvcmFnZUtleT0ndmlldycgLz5cblx0XHRcdFx0XHQ8QWNjb3VudCAvPlxuXHRcdFx0XHQ8L05hdi5zZWN0aW9uPlxuXHRcdFx0PC9OYXZiYXI+XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250ZW50Jz5cblx0XHRcdFx0PEJyZXdSZW5kZXJlciB0ZXh0PXt0aGlzLnByb3BzLmJyZXcudGV4dH0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2hhcmVQYWdlO1xuIiwiY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IF8gICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcbmNvbnN0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcblxuY29uc3QgQnJld0l0ZW0gPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRicmV3IDoge1xuXHRcdFx0XHR0aXRsZSAgICAgICA6ICcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbiA6ICcnLFxuXG5cdFx0XHRcdGF1dGhvcnMgOiBbXVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0ZGVsZXRlQnJldyA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoIWNvbmZpcm0oJ2FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhpcyBicmV3PycpKSByZXR1cm47XG5cdFx0aWYoIWNvbmZpcm0oJ2FyZSB5b3UgUkVBTExZIHN1cmU/IFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIHJlY292ZXIgaXQnKSkgcmV0dXJuO1xuXG5cdFx0cmVxdWVzdC5nZXQoYC9hcGkvcmVtb3ZlLyR7dGhpcy5wcm9wcy5icmV3LmVkaXRJZH1gKVxuXHRcdFx0LnNlbmQoKVxuXHRcdFx0LmVuZChmdW5jdGlvbihlcnIsIHJlcyl7XG5cdFx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xuXHRcdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyRGVsZXRlQnJld0xpbmsgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnByb3BzLmJyZXcuZWRpdElkKSByZXR1cm47XG5cblx0XHRyZXR1cm4gPGEgb25DbGljaz17dGhpcy5kZWxldGVCcmV3fT5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtdHJhc2gnIC8+XG5cdFx0PC9hPjtcblx0fSxcblx0cmVuZGVyRWRpdExpbmsgOiBmdW5jdGlvbigpe1xuXHRcdGlmKCF0aGlzLnByb3BzLmJyZXcuZWRpdElkKSByZXR1cm47XG5cblx0XHRyZXR1cm4gPGEgaHJlZj17YC9lZGl0LyR7dGhpcy5wcm9wcy5icmV3LmVkaXRJZH1gfSB0YXJnZXQ9J19ibGFuaycgcmVsPSdub29wZW5lciBub3JlZmVycmVyJz5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtcGVuY2lsJyAvPlxuXHRcdDwvYT47XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRjb25zdCBicmV3ID0gdGhpcy5wcm9wcy5icmV3O1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nYnJld0l0ZW0nPlxuXHRcdFx0PGgyPnticmV3LnRpdGxlfTwvaDI+XG5cdFx0XHQ8cCBjbGFzc05hbWU9J2Rlc2NyaXB0aW9uJyA+e2JyZXcuZGVzY3JpcHRpb259PC9wPlxuXHRcdFx0PGhyIC8+XG5cblx0XHRcdDxkaXYgY2xhc3NOYW1lPSdpbmZvJz5cblx0XHRcdFx0PHNwYW4+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS11c2VyJyAvPiB7YnJldy5hdXRob3JzLmpvaW4oJywgJyl9XG5cdFx0XHRcdDwvc3Bhbj5cblx0XHRcdFx0PHNwYW4+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1leWUnIC8+IHticmV3LnZpZXdzfVxuXHRcdFx0XHQ8L3NwYW4+XG5cdFx0XHRcdDxzcGFuPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtcmVmcmVzaCcgLz4ge21vbWVudChicmV3LnVwZGF0ZWRBdCkuZnJvbU5vdygpfVxuXHRcdFx0XHQ8L3NwYW4+XG5cdFx0XHQ8L2Rpdj5cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2xpbmtzJz5cblx0XHRcdFx0PGEgaHJlZj17YC9zaGFyZS8ke2JyZXcuc2hhcmVJZH1gfSB0YXJnZXQ9J19ibGFuaycgcmVsPSdub29wZW5lciBub3JlZmVycmVyJz5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLXNoYXJlLWFsdCcgLz5cblx0XHRcdFx0PC9hPlxuXHRcdFx0XHR7dGhpcy5yZW5kZXJFZGl0TGluaygpfVxuXHRcdFx0XHR7dGhpcy5yZW5kZXJEZWxldGVCcmV3TGluaygpfVxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCcmV3SXRlbTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IE5hdiA9IHJlcXVpcmUoJ25hdHVyYWxjcml0L25hdi9uYXYuanN4Jyk7XG5jb25zdCBOYXZiYXIgPSByZXF1aXJlKCcuLi8uLi9uYXZiYXIvbmF2YmFyLmpzeCcpO1xuXG5jb25zdCBSZWNlbnROYXZJdGVtID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL3JlY2VudC5uYXZpdGVtLmpzeCcpLmJvdGg7XG5jb25zdCBBY2NvdW50ID0gcmVxdWlyZSgnLi4vLi4vbmF2YmFyL2FjY291bnQubmF2aXRlbS5qc3gnKTtcbmNvbnN0IEJyZXdJdGVtID0gcmVxdWlyZSgnLi9icmV3SXRlbS9icmV3SXRlbS5qc3gnKTtcblxuLy8gY29uc3QgYnJldyA9IHtcbi8vIFx0dGl0bGUgICA6ICdTVVBFUiBMb25nIHRpdGxlIHdvYWggbm93Jyxcbi8vIFx0YXV0aG9ycyA6IFtdXG4vLyB9O1xuXG4vL2NvbnN0IEJSRVdTID0gXy50aW1lcygyNSwgKCk9PnsgcmV0dXJuIGJyZXc7fSk7XG5cblxuY29uc3QgVXNlclBhZ2UgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR1c2VybmFtZSA6ICcnLFxuXHRcdFx0YnJld3MgICAgOiBbXVxuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyQnJld3MgOiBmdW5jdGlvbihicmV3cyl7XG5cdFx0aWYoIWJyZXdzIHx8ICFicmV3cy5sZW5ndGgpIHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nbm9CcmV3cyc+Tm8gQnJld3MuPC9kaXY+O1xuXG5cdFx0Y29uc3Qgc29ydGVkQnJld3MgPSBfLnNvcnRCeShicmV3cywgKGJyZXcpPT57IHJldHVybiBicmV3LnRpdGxlOyB9KTtcblxuXHRcdHJldHVybiBfLm1hcChzb3J0ZWRCcmV3cywgKGJyZXcsIGlkeCk9Pntcblx0XHRcdHJldHVybiA8QnJld0l0ZW0gYnJldz17YnJld30ga2V5PXtpZHh9Lz47XG5cdFx0fSk7XG5cdH0sXG5cblx0Z2V0U29ydGVkQnJld3MgOiBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBfLmdyb3VwQnkodGhpcy5wcm9wcy5icmV3cywgKGJyZXcpPT57XG5cdFx0XHRyZXR1cm4gKGJyZXcucHVibGlzaGVkID8gJ3B1Ymxpc2hlZCcgOiAncHJpdmF0ZScpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlclByaXZhdGVCcmV3cyA6IGZ1bmN0aW9uKHByaXZhdGVCcmV3cyl7XG5cdFx0aWYoIXByaXZhdGVCcmV3cyB8fCAhcHJpdmF0ZUJyZXdzLmxlbmd0aCkgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIFtcblx0XHRcdDxoMT57dGhpcy5wcm9wcy51c2VybmFtZX0ncyB1bnB1Ymxpc2hlZCBicmV3czwvaDE+LFxuXHRcdFx0dGhpcy5yZW5kZXJCcmV3cyhwcml2YXRlQnJld3MpXG5cdFx0XTtcblx0fSxcblxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGNvbnN0IGJyZXdzID0gdGhpcy5nZXRTb3J0ZWRCcmV3cygpO1xuXG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSd1c2VyUGFnZSBwYWdlJz5cblx0XHRcdDxOYXZiYXI+XG5cdFx0XHRcdDxOYXYuc2VjdGlvbj5cblx0XHRcdFx0XHQ8UmVjZW50TmF2SXRlbSAvPlxuXHRcdFx0XHRcdDxBY2NvdW50IC8+XG5cdFx0XHRcdDwvTmF2LnNlY3Rpb24+XG5cdFx0XHQ8L05hdmJhcj5cblxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2NvbnRlbnQnPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nYWdlJz5cblx0XHRcdFx0XHQ8aDE+e3RoaXMucHJvcHMudXNlcm5hbWV9J3MgYnJld3M8L2gxPlxuXHRcdFx0XHRcdHt0aGlzLnJlbmRlckJyZXdzKGJyZXdzLnB1Ymxpc2hlZCl9XG5cdFx0XHRcdFx0e3RoaXMucmVuZGVyUHJpdmF0ZUJyZXdzKGJyZXdzLnByaXZhdGUpfVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXNlclBhZ2U7XG4iLCJcbmNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfICAgICA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IERJU01JU1NfS0VZID0gJ2Rpc21pc3NfcmVuZGVyX3dhcm5pbmcnO1xuXG5jb25zdCBSZW5kZXJXYXJuaW5ncyA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHdhcm5pbmdzIDoge31cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY2hlY2tXYXJuaW5ncygpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLmNoZWNrV2FybmluZ3MpO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLmNoZWNrV2FybmluZ3MpO1xuXHR9LFxuXHR3YXJuaW5ncyA6IHtcblx0XHRjaHJvbWUgOiBmdW5jdGlvbigpe1xuXHRcdFx0Y29uc3QgaXNDaHJvbWUgPSAvQ2hyb21lLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmIC9Hb29nbGUgSW5jLy50ZXN0KG5hdmlnYXRvci52ZW5kb3IpO1xuXHRcdFx0aWYoIWlzQ2hyb21lKXtcblx0XHRcdFx0cmV0dXJuIDxsaSBrZXk9J2Nocm9tZSc+XG5cdFx0XHRcdFx0PGVtPkJ1aWx0IGZvciBDaHJvbWUgPC9lbT4gPGJyIC8+XG5cdFx0XHRcdFx0T3RoZXIgYnJvd3NlcnMgZG8gbm90IHN1cHBvcnQgJm5ic3A7XG5cdFx0XHRcdFx0PGEgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9J2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9jb2x1bW4tc3BhbiNCcm93c2VyX2NvbXBhdGliaWxpdHknPlxuXHRcdFx0XHRcdFx0a2V5IGZlYXR1cmVzXG5cdFx0XHRcdFx0PC9hPiB0aGlzIHNpdGUgdXNlcy5cblx0XHRcdFx0PC9saT47XG5cdFx0XHR9XG5cdFx0fSxcblx0fSxcblx0Y2hlY2tXYXJuaW5ncyA6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc3QgaGlkZURpc21pc3MgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShESVNNSVNTX0tFWSk7XG5cdFx0aWYoaGlkZURpc21pc3MpIHJldHVybiB0aGlzLnNldFN0YXRlKHsgd2FybmluZ3M6IHt9IH0pO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHR3YXJuaW5ncyA6IF8ucmVkdWNlKHRoaXMud2FybmluZ3MsIChyLCBmbiwgdHlwZSk9Pntcblx0XHRcdFx0Y29uc3QgZWxlbWVudCA9IGZuKCk7XG5cdFx0XHRcdGlmKGVsZW1lbnQpIHJbdHlwZV0gPSBlbGVtZW50O1xuXHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdH0sIHt9KVxuXHRcdH0pO1xuXHR9LFxuXHRkaXNtaXNzIDogZnVuY3Rpb24oKXtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShESVNNSVNTX0tFWSwgdHJ1ZSk7XG5cdFx0dGhpcy5jaGVja1dhcm5pbmdzKCk7XG5cdH0sXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYoXy5pc0VtcHR5KHRoaXMuc3RhdGUud2FybmluZ3MpKSByZXR1cm4gbnVsbDtcblxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ncmVuZGVyV2FybmluZ3MnPlxuXHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS10aW1lcyBkaXNtaXNzJyBvbkNsaWNrPXt0aGlzLmRpc21pc3N9Lz5cblx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtZXhjbGFtYXRpb24tdHJpYW5nbGUgb2hubycgLz5cblx0XHRcdDxoMz5SZW5kZXIgV2FybmluZ3M8L2gzPlxuXHRcdFx0PHNtYWxsPklmIHRoaXMgaG9tZWJyZXcgaXMgcmVuZGVyaW5nIGJhZGx5IGlmIG1pZ2h0IGJlIGJlY2F1c2Ugb2YgdGhlIGZvbGxvd2luZzo8L3NtYWxsPlxuXHRcdFx0PHVsPntfLnZhbHVlcyh0aGlzLnN0YXRlLndhcm5pbmdzKX08L3VsPlxuXHRcdDwvZGl2Pjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyV2FybmluZ3M7XG4iLCJjb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cblxubGV0IENvZGVNaXJyb3I7XG5pZih0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyl7XG5cdENvZGVNaXJyb3IgPSByZXF1aXJlKCdjb2RlbWlycm9yJyk7XG5cblx0Ly9MYW5ndWFnZSBNb2Rlc1xuXHRyZXF1aXJlKCdjb2RlbWlycm9yL21vZGUvZ2ZtL2dmbS5qcycpOyAvL0dpdGh1YiBmbGF2b3VyZWQgbWFya2Rvd25cblx0cmVxdWlyZSgnY29kZW1pcnJvci9tb2RlL2phdmFzY3JpcHQvamF2YXNjcmlwdC5qcycpO1xufVxuXG5cbmNvbnN0IENvZGVFZGl0b3IgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsYW5ndWFnZSAgICAgICAgIDogJycsXG5cdFx0XHR2YWx1ZSAgICAgICAgICAgIDogJycsXG5cdFx0XHR3cmFwICAgICAgICAgICAgIDogZmFsc2UsXG5cdFx0XHRvbkNoYW5nZSAgICAgICAgIDogZnVuY3Rpb24oKXt9LFxuXHRcdFx0b25DdXJzb3JBY3Rpdml0eSA6IGZ1bmN0aW9uKCl7fSxcblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50IDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb2RlTWlycm9yID0gQ29kZU1pcnJvcih0aGlzLnJlZnMuZWRpdG9yLCB7XG5cdFx0XHR2YWx1ZSAgICAgICAgOiB0aGlzLnByb3BzLnZhbHVlLFxuXHRcdFx0bGluZU51bWJlcnMgIDogdHJ1ZSxcblx0XHRcdGxpbmVXcmFwcGluZyA6IHRoaXMucHJvcHMud3JhcCxcblx0XHRcdG1vZGUgICAgICAgICA6IHRoaXMucHJvcHMubGFuZ3VhZ2UsXG5cdFx0XHRleHRyYUtleXMgICAgOiB7XG5cdFx0XHRcdCdDdHJsLUInIDogdGhpcy5tYWtlQm9sZCxcblx0XHRcdFx0J0N0cmwtSScgOiB0aGlzLm1ha2VJdGFsaWNcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuY29kZU1pcnJvci5vbignY2hhbmdlJywgdGhpcy5oYW5kbGVDaGFuZ2UpO1xuXHRcdHRoaXMuY29kZU1pcnJvci5vbignY3Vyc29yQWN0aXZpdHknLCB0aGlzLmhhbmRsZUN1cnNvckFjdGl2aXR5KTtcblx0XHR0aGlzLnVwZGF0ZVNpemUoKTtcblx0fSxcblxuXHRtYWtlQm9sZCA6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IHRoaXMuY29kZU1pcnJvci5nZXRTZWxlY3Rpb24oKTtcblx0XHR0aGlzLmNvZGVNaXJyb3IucmVwbGFjZVNlbGVjdGlvbihgKioke3NlbGVjdGlvbn0qKmAsICdhcm91bmQnKTtcblx0fSxcblxuXHRtYWtlSXRhbGljIDogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uID0gdGhpcy5jb2RlTWlycm9yLmdldFNlbGVjdGlvbigpO1xuXHRcdHRoaXMuY29kZU1pcnJvci5yZXBsYWNlU2VsZWN0aW9uKGAqJHtzZWxlY3Rpb259KmAsICdhcm91bmQnKTtcblx0fSxcblxuXHRjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIDogZnVuY3Rpb24obmV4dFByb3BzKXtcblx0XHRpZih0aGlzLmNvZGVNaXJyb3IgJiYgbmV4dFByb3BzLnZhbHVlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5jb2RlTWlycm9yLmdldFZhbHVlKCkgIT0gbmV4dFByb3BzLnZhbHVlKSB7XG5cdFx0XHR0aGlzLmNvZGVNaXJyb3Iuc2V0VmFsdWUobmV4dFByb3BzLnZhbHVlKTtcblx0XHR9XG5cdH0sXG5cblx0c2hvdWxkQ29tcG9uZW50VXBkYXRlIDogZnVuY3Rpb24obmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0c2V0Q3Vyc29yUG9zaXRpb24gOiBmdW5jdGlvbihsaW5lLCBjaGFyKXtcblx0XHRzZXRUaW1lb3V0KCgpPT57XG5cdFx0XHR0aGlzLmNvZGVNaXJyb3IuZm9jdXMoKTtcblx0XHRcdHRoaXMuY29kZU1pcnJvci5kb2Muc2V0Q3Vyc29yKGxpbmUsIGNoYXIpO1xuXHRcdH0sIDEwKTtcblx0fSxcblxuXHR1cGRhdGVTaXplIDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmNvZGVNaXJyb3IucmVmcmVzaCgpO1xuXHR9LFxuXG5cdGhhbmRsZUNoYW5nZSA6IGZ1bmN0aW9uKGVkaXRvcil7XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZShlZGl0b3IuZ2V0VmFsdWUoKSk7XG5cdH0sXG5cdGhhbmRsZUN1cnNvckFjdGl2aXR5IDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLnByb3BzLm9uQ3Vyc29yQWN0aXZpdHkodGhpcy5jb2RlTWlycm9yLmRvYy5nZXRDdXJzb3IoKSk7XG5cdH0sXG5cblx0cmVuZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2NvZGVFZGl0b3InIHJlZj0nZWRpdG9yJyAvPjtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29kZUVkaXRvcjtcbiIsImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IE1hcmtkb3duID0gcmVxdWlyZSgnbWFya2VkJyk7XG5jb25zdCByZW5kZXJlciA9IG5ldyBNYXJrZG93bi5SZW5kZXJlcigpO1xuXG4vL1Byb2Nlc3NlcyB0aGUgbWFya2Rvd24gd2l0aGluIGFuIEhUTUwgYmxvY2sgaWYgaXQncyBqdXN0IGEgY2xhc3Mtd3JhcHBlclxucmVuZGVyZXIuaHRtbCA9IGZ1bmN0aW9uIChodG1sKSB7XG5cdGlmKF8uc3RhcnRzV2l0aChfLnRyaW0oaHRtbCksICc8ZGl2JykgJiYgXy5lbmRzV2l0aChfLnRyaW0oaHRtbCksICc8L2Rpdj4nKSl7XG5cdFx0Y29uc3Qgb3BlblRhZyA9IGh0bWwuc3Vic3RyaW5nKDAsIGh0bWwuaW5kZXhPZignPicpKzEpO1xuXHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZyhodG1sLmluZGV4T2YoJz4nKSsxKTtcblx0XHRodG1sID0gaHRtbC5zdWJzdHJpbmcoMCwgaHRtbC5sYXN0SW5kZXhPZignPC9kaXY+JykpO1xuXHRcdHJldHVybiBgJHtvcGVuVGFnfSAke01hcmtkb3duKGh0bWwpfSA8L2Rpdj5gO1xuXHR9XG5cdHJldHVybiBodG1sO1xufTtcblxuY29uc3Qgc2FuaXRpemVTY3JpcHRUYWdzID0gKGNvbnRlbnQpPT57XG5cdHJldHVybiBjb250ZW50XG5cdFx0LnJlcGxhY2UoLzxzY3JpcHQvaWcsICcmbHQ7c2NyaXB0Jylcblx0XHQucmVwbGFjZSgvPFxcL3NjcmlwdD4vaWcsICcmbHQ7L3NjcmlwdCZndDsnKTtcbn07XG5cbmNvbnN0IHRhZ1R5cGVzID0gWydkaXYnLCAnc3BhbicsICdhJ107XG5jb25zdCB0YWdSZWdleCA9IG5ldyBSZWdFeHAoYCgke1xuXHRfLm1hcCh0YWdUeXBlcywgKHR5cGUpPT57XG5cdFx0cmV0dXJuIGBcXFxcPCR7dHlwZX18XFxcXDwvJHt0eXBlfT5gO1xuXHR9KS5qb2luKCd8Jyl9KWAsICdnJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG1hcmtlZCA6IE1hcmtkb3duLFxuXHRyZW5kZXIgOiAocmF3QnJld1RleHQpPT57XG5cdFx0cmV0dXJuIE1hcmtkb3duKFxuXHRcdFx0c2FuaXRpemVTY3JpcHRUYWdzKHJhd0JyZXdUZXh0KSxcblx0XHRcdHsgcmVuZGVyZXI6IHJlbmRlcmVyIH1cblx0XHQpO1xuXHR9LFxuXG5cdHZhbGlkYXRlIDogKHJhd0JyZXdUZXh0KT0+e1xuXHRcdGNvbnN0IGVycm9ycyA9IFtdO1xuXHRcdGNvbnN0IGxlZnRvdmVycyA9IF8ucmVkdWNlKHJhd0JyZXdUZXh0LnNwbGl0KCdcXG4nKSwgKGFjYywgbGluZSwgX2xpbmVOdW1iZXIpPT57XG5cdFx0XHRjb25zdCBsaW5lTnVtYmVyID0gX2xpbmVOdW1iZXIgKyAxO1xuXHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGxpbmUubWF0Y2godGFnUmVnZXgpO1xuXHRcdFx0aWYoIW1hdGNoZXMgfHwgIW1hdGNoZXMubGVuZ3RoKSByZXR1cm4gYWNjO1xuXG5cdFx0XHRfLmVhY2gobWF0Y2hlcywgKG1hdGNoKT0+e1xuXHRcdFx0XHRfLmVhY2godGFnVHlwZXMsICh0eXBlKT0+e1xuXHRcdFx0XHRcdGlmKG1hdGNoID09IGA8JHt0eXBlfWApe1xuXHRcdFx0XHRcdFx0YWNjLnB1c2goe1xuXHRcdFx0XHRcdFx0XHR0eXBlIDogdHlwZSxcblx0XHRcdFx0XHRcdFx0bGluZSA6IGxpbmVOdW1iZXJcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZihtYXRjaCA9PT0gYDwvJHt0eXBlfT5gKXtcblx0XHRcdFx0XHRcdGlmKCFhY2MubGVuZ3RoKXtcblx0XHRcdFx0XHRcdFx0ZXJyb3JzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGxpbmUgOiBsaW5lTnVtYmVyLFxuXHRcdFx0XHRcdFx0XHRcdHR5cGUgOiB0eXBlLFxuXHRcdFx0XHRcdFx0XHRcdHRleHQgOiAnVW5tYXRjaGVkIGNsb3NpbmcgdGFnJyxcblx0XHRcdFx0XHRcdFx0XHRpZCAgIDogJ0NMT1NFJ1xuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihfLmxhc3QoYWNjKS50eXBlID09IHR5cGUpe1xuXHRcdFx0XHRcdFx0XHRhY2MucG9wKCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0bGluZSA6IGAke18ubGFzdChhY2MpLmxpbmV9IHRvICR7bGluZU51bWJlcn1gLFxuXHRcdFx0XHRcdFx0XHRcdHR5cGUgOiB0eXBlLFxuXHRcdFx0XHRcdFx0XHRcdHRleHQgOiAnVHlwZSBtaXNtYXRjaCBvbiBjbG9zaW5nIHRhZycsXG5cdFx0XHRcdFx0XHRcdFx0aWQgICA6ICdNSVNNQVRDSCdcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGFjYy5wb3AoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gYWNjO1xuXHRcdH0sIFtdKTtcblxuXHRcdF8uZWFjaChsZWZ0b3ZlcnMsICh1bm1hdGNoZWQpPT57XG5cdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdGxpbmUgOiB1bm1hdGNoZWQubGluZSxcblx0XHRcdFx0dHlwZSA6IHVubWF0Y2hlZC50eXBlLFxuXHRcdFx0XHR0ZXh0IDogJ1VubWF0Y2hlZCBvcGVuaW5nIHRhZycsXG5cdFx0XHRcdGlkICAgOiAnT1BFTidcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGVycm9ycztcblx0fSxcbn07XG5cbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgTmF0dXJhbENyaXRJY29uID0gcmVxdWlyZSgnbmF0dXJhbGNyaXQvc3ZnL25hdHVyYWxjcml0LnN2Zy5qc3gnKTtcblxuY29uc3QgTmF2ID0ge1xuXHRiYXNlIDogY3JlYXRlQ2xhc3Moe1xuXHRcdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gPG5hdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9J25hdkNvbnRlbnQnPlxuXHRcdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvbmF2Pjtcblx0XHR9XG5cdH0pLFxuXHRsb2dvIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGEgY2xhc3NOYW1lPSduYXZMb2dvJyBocmVmPSdodHRwOi8vbmF0dXJhbGNyaXQuY29tJz5cblx0XHRcdDxOYXR1cmFsQ3JpdEljb24gLz5cblx0XHRcdDxzcGFuIGNsYXNzTmFtZT0nbmFtZSc+XG5cdFx0XHRcdE5hdHVyYWw8c3BhbiBjbGFzc05hbWU9J2NyaXQnPkNyaXQ8L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0PC9hPjtcblx0fSxcblxuXHRzZWN0aW9uIDogY3JlYXRlQ2xhc3Moe1xuXHRcdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J25hdlNlY3Rpb24nPlxuXHRcdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHRcdDwvZGl2Pjtcblx0XHR9XG5cdH0pLFxuXG5cdGl0ZW0gOiBjcmVhdGVDbGFzcyh7XG5cdFx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRpY29uICAgIDogbnVsbCxcblx0XHRcdFx0aHJlZiAgICA6IG51bGwsXG5cdFx0XHRcdG5ld1RhYiAgOiBmYWxzZSxcblx0XHRcdFx0b25DbGljayA6IGZ1bmN0aW9uKCl7fSxcblx0XHRcdFx0Y29sb3IgICA6IG51bGxcblx0XHRcdH07XG5cdFx0fSxcblx0XHRoYW5kbGVDbGljayA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnByb3BzLm9uQ2xpY2soKTtcblx0XHR9LFxuXHRcdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRjb25zdCBjbGFzc2VzID0gY3goJ25hdkl0ZW0nLCB0aGlzLnByb3BzLmNvbG9yLCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cblx0XHRcdGxldCBpY29uO1xuXHRcdFx0aWYodGhpcy5wcm9wcy5pY29uKSBpY29uID0gPGkgY2xhc3NOYW1lPXtgZmEgJHt0aGlzLnByb3BzLmljb259YH0gLz47XG5cblx0XHRcdGNvbnN0IHByb3BzID0gXy5vbWl0KHRoaXMucHJvcHMsIFsnbmV3VGFiJ10pO1xuXG5cdFx0XHRpZih0aGlzLnByb3BzLmhyZWYpe1xuXHRcdFx0XHRyZXR1cm4gPGEgey4uLnByb3BzfSBjbGFzc05hbWU9e2NsYXNzZXN9IHRhcmdldD17dGhpcy5wcm9wcy5uZXdUYWIgPyAnX2JsYW5rJyA6ICdfc2VsZid9ID5cblx0XHRcdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHRcdFx0XHR7aWNvbn1cblx0XHRcdFx0PC9hPjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiA8ZGl2IHsuLi5wcm9wc30gY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfSA+XG5cdFx0XHRcdFx0e3RoaXMucHJvcHMuY2hpbGRyZW59XG5cdFx0XHRcdFx0e2ljb259XG5cdFx0XHRcdDwvZGl2Pjtcblx0XHRcdH1cblx0XHR9XG5cdH0pLFxuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTmF2OyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjeCA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgU3BsaXRQYW5lID0gY3JlYXRlQ2xhc3Moe1xuXHRnZXREZWZhdWx0UHJvcHMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RvcmFnZUtleSAgIDogJ25hdHVyYWxjcml0LXBhbmUtc3BsaXQnLFxuXHRcdFx0b25EcmFnRmluaXNoIDogZnVuY3Rpb24oKXt9IC8vZmlyZXMgd2hlbiBkcmFnZ2luZ1xuXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNpemUgICAgICAgOiBudWxsLFxuXHRcdFx0aXNEcmFnZ2luZyA6IGZhbHNlXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQgOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBwYW5lU2l6ZSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSh0aGlzLnByb3BzLnN0b3JhZ2VLZXkpO1xuXHRcdGlmKHBhbmVTaXplKXtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRzaXplIDogcGFuZVNpemVcblx0XHRcdH0pO1xuXHRcdH1cblx0fSxcblxuXHRoYW5kbGVVcCA6IGZ1bmN0aW9uKCl7XG5cdFx0aWYodGhpcy5zdGF0ZS5pc0RyYWdnaW5nKXtcblx0XHRcdHRoaXMucHJvcHMub25EcmFnRmluaXNoKHRoaXMuc3RhdGUuc2l6ZSk7XG5cdFx0XHR3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0odGhpcy5wcm9wcy5zdG9yYWdlS2V5LCB0aGlzLnN0YXRlLnNpemUpO1xuXHRcdH1cblx0XHR0aGlzLnNldFN0YXRlKHsgaXNEcmFnZ2luZzogZmFsc2UgfSk7XG5cdH0sXG5cdGhhbmRsZURvd24gOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuc2V0U3RhdGUoeyBpc0RyYWdnaW5nOiB0cnVlIH0pO1xuXHRcdC8vdGhpcy51bkZvY3VzKClcblx0fSxcblx0aGFuZGxlTW92ZSA6IGZ1bmN0aW9uKGUpe1xuXHRcdGlmKCF0aGlzLnN0YXRlLmlzRHJhZ2dpbmcpIHJldHVybjtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNpemUgOiBlLnBhZ2VYXG5cdFx0fSk7XG5cdH0sXG5cdC8qXG5cdHVuRm9jdXMgOiBmdW5jdGlvbigpIHtcblx0XHRpZihkb2N1bWVudC5zZWxlY3Rpb24pe1xuXHRcdFx0XHRkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkoKTtcblx0XHR9ZWxzZXtcblx0XHRcdHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcblx0XHR9XG5cdH0sXG4qL1xuXHRyZW5kZXJEaXZpZGVyIDogZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gPGRpdiBjbGFzc05hbWU9J2RpdmlkZXInIG9uTW91c2VEb3duPXt0aGlzLmhhbmRsZURvd259PlxuXHRcdFx0PGRpdiBjbGFzc05hbWU9J2RvdHMnPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9J2ZhIGZhLWNpcmNsZScgLz5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPSdmYSBmYS1jaXJjbGUnIC8+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtY2lyY2xlJyAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdzcGxpdFBhbmUnIG9uTW91c2VNb3ZlPXt0aGlzLmhhbmRsZU1vdmV9IG9uTW91c2VVcD17dGhpcy5oYW5kbGVVcH0+XG5cdFx0XHQ8UGFuZSByZWY9J3BhbmUxJyB3aWR0aD17dGhpcy5zdGF0ZS5zaXplfT57dGhpcy5wcm9wcy5jaGlsZHJlblswXX08L1BhbmU+XG5cdFx0XHR7dGhpcy5yZW5kZXJEaXZpZGVyKCl9XG5cdFx0XHQ8UGFuZSByZWY9J3BhbmUyJz57dGhpcy5wcm9wcy5jaGlsZHJlblsxXX08L1BhbmU+XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxuXG5cblxuXG5cbmNvbnN0IFBhbmUgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR3aWR0aCA6IG51bGxcblx0XHR9O1xuXHR9LFxuXHRyZW5kZXIgOiBmdW5jdGlvbigpe1xuXHRcdGxldCBzdHlsZXMgPSB7fTtcblx0XHRpZih0aGlzLnByb3BzLndpZHRoKXtcblx0XHRcdHN0eWxlcyA9IHtcblx0XHRcdFx0ZmxleCAgOiAnbm9uZScsXG5cdFx0XHRcdHdpZHRoIDogYCR7dGhpcy5wcm9wcy53aWR0aH1weGBcblx0XHRcdH07XG5cdFx0fVxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT17Y3goJ3BhbmUnLCB0aGlzLnByb3BzLmNsYXNzTmFtZSl9IHN0eWxlPXtzdHlsZXN9PlxuXHRcdFx0e3RoaXMucHJvcHMuY2hpbGRyZW59XG5cdFx0PC9kaXY+O1xuXHR9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGl0UGFuZTtcbiIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJvcHMpe1xuXHRyZXR1cm4gPHN2ZyB2ZXJzaW9uPScxLjEnIHg9JzBweCcgeT0nMHB4JyB2aWV3Qm94PScwIDAgMTAwIDEwMCcgZW5hYmxlQmFja2dyb3VuZD0nbmV3IDAgMCAxMDAgMTAwJz48cGF0aCBkPSdNODAuNjQ0LDg3Ljk4MmwxNi41OTItNDEuNDgzYzAuMDU0LTAuMTI4LDAuMDg4LTAuMjYsMC4xMDgtMC4zOTRjMC4wMDYtMC4wMzksMC4wMDctMC4wNzcsMC4wMTEtMC4xMTYgIGMwLjAwNy0wLjA4NywwLjAwOC0wLjE3NCwwLjAwMi0wLjI2Yy0wLjAwMy0wLjA0Ni0wLjAwNy0wLjA5MS0wLjAxNC0wLjEzN2MtMC4wMTQtMC4wODktMC4wMzYtMC4xNzYtMC4wNjMtMC4yNjIgIGMtMC4wMTItMC4wMzQtMC4wMTktMC4wNjktMC4wMzEtMC4xMDNjLTAuMDQ3LTAuMTE4LTAuMTA2LTAuMjI5LTAuMTc4LTAuMzM1Yy0wLjAwNC0wLjAwNi0wLjAwNi0wLjAxMi0wLjAxLTAuMDE4TDY3Ljk5OSwzLjM1OCAgYy0wLjAxLTAuMDEzLTAuMDAzLTAuMDI2LTAuMDEzLTAuMDRMNjgsMy4zMTVWNGMwLDAtMC4wMzMsMC0wLjAzNywwYy0wLjQwMy0xLTEuMDk0LTEuMTI0LTEuNzUyLTAuOTc2ICBjMCwwLjAwNC0wLjAwNC0wLjAxMi0wLjAwNy0wLjAxMkM2Ni4yMDEsMy4wMTYsNjYuMTk0LDMsNjYuMTk0LDNINjYuMTloLTAuMDAzaC0wLjAwM2gtMC4wMDRoLTAuMDAzYzAsMC0wLjAwNCwwLTAuMDA3LDAgIHMtMC4wMDMtMC4xNTEtMC4wMDctMC4xNTFMMjAuNDk1LDE1LjIyN2MtMC4wMjUsMC4wMDctMC4wNDYtMC4wMTktMC4wNzEtMC4wMTFjLTAuMDg3LDAuMDI4LTAuMTcyLDAuMDQxLTAuMjUzLDAuMDgzICBjLTAuMDU0LDAuMDI3LTAuMTAyLDAuMDUzLTAuMTUyLDAuMDg1Yy0wLjA1MSwwLjAzMy0wLjEwMSwwLjA2MS0wLjE0NywwLjA5OWMtMC4wNDQsMC4wMzYtMC4wODQsMC4wNzMtMC4xMjQsMC4xMTMgIGMtMC4wNDgsMC4wNDgtMC4wOTMsMC4wOTgtMC4xMzYsMC4xNTJjLTAuMDMsMC4wMzktMC4wNTksMC4wNzYtMC4wODUsMC4xMTdjLTAuMDQ2LDAuMDctMC4wODQsMC4xNDUtMC4xMiwwLjIyMyAgYy0wLjAxMSwwLjAyMy0wLjAyNywwLjA0Mi0wLjAzNiwwLjA2NkwyLjkxMSw1Ny42NjRDMi44OTEsNTcuNzE1LDMsNTcuNzY4LDMsNTcuODJ2MC4wMDJjMCwwLjE4NiwwLDAuMzc1LDAsMC41NjIgIGMwLDAuMDA0LDAsMC4wMDQsMCwwLjAwOGMwLDAsMCwwLDAsMC4wMDJjMCwwLDAsMCwwLDAuMDA0djAuMDA0djAuMDAyYzAsMC4wNzQtMC4wMDIsMC4xNSwwLjAxMiwwLjIyMyAgQzMuMDE1LDU4LjYzMSwzLDU4LjYzMSwzLDU4LjYzM2MwLDAuMDA0LDAsMC4wMDQsMCwwLjAwOGMwLDAsMCwwLDAsMC4wMDJjMCwwLDAsMCwwLDAuMDA0djAuMDA0YzAsMCwwLDAsMCwwLjAwMnYwLjAwNCAgYzAsMC4xOTEtMC4wNDYsMC4zNzcsMC4wNiwwLjU0NWMwLTAuMDAyLTAuMDMsMC4wMDQtMC4wMywwLjAwNGMwLDAuMDA0LTAuMDMsMC4wMDQtMC4wMywwLjAwNGMwLDAuMDAyLDAsMC4wMDIsMCwwLjAwMiAgbC0wLjA0NSwwLjAwNGMwLjAzLDAuMDQ3LDAuMDM2LDAuMDksMC4wNjgsMC4xMzNsMjkuMDQ5LDM3LjM1OWMwLjAwMiwwLjAwNCwwLDAuMDA2LDAuMDAyLDAuMDFjMC4wMDIsMC4wMDIsMCwwLjAwNCwwLjAwMiwwLjAwOCAgYzAuMDA2LDAuMDA4LDAuMDE0LDAuMDE0LDAuMDIxLDAuMDIxYzAuMDI0LDAuMDI5LDAuMDUyLDAuMDUxLDAuMDc4LDAuMDc4YzAuMDI3LDAuMDI5LDAuMDUzLDAuMDU3LDAuMDgyLDAuMDgyICBjMC4wMywwLjAyNywwLjA1NSwwLjA2MiwwLjA4NiwwLjA4OGMwLjAyNiwwLjAyLDAuMDU3LDAuMDMzLDAuMDg0LDAuMDUzYzAuMDQsMC4wMjcsMC4wODEsMC4wNTMsMC4xMjMsMC4wNzYgIGMwLjAwNSwwLjAwNCwwLjAxLDAuMDA4LDAuMDE2LDAuMDFjMC4wODcsMC4wNTEsMC4xNzYsMC4wOSwwLjI2OSwwLjEyM2MwLjA0MiwwLjAxNCwwLjA4MiwwLjAzMSwwLjEyNSwwLjA0MyAgYzAuMDIxLDAuMDA2LDAuMDQxLDAuMDE4LDAuMDYyLDAuMDIxYzAuMTIzLDAuMDI3LDAuMjQ5LDAuMDQzLDAuMzc1LDAuMDQzYzAuMDk5LDAsMC4yMDItMC4wMTIsMC4zMDQtMC4wMjdsNDUuNjY5LTguMzAzICBjMC4wNTctMC4wMSwwLjEwOC0wLjAyMSwwLjE2My0wLjAzN0M3OS41NDcsODguOTkyLDc5LjU2Miw4OSw3OS41NzUsODljMC4wMDQsMCwwLjAwNCwwLDAuMDA0LDBjMC4wMjEsMCwwLjAzOS0wLjAyNywwLjA2LTAuMDM1ICBjMC4wNDEtMC4wMTQsMC4wOC0wLjAzNCwwLjEyLTAuMDUyYzAuMDIxLTAuMDEsMC4wNDQtMC4wMTksMC4wNjQtMC4wM2MwLjAxNy0wLjAxLDAuMDI2LTAuMDE1LDAuMDMzLTAuMDE3ICBjMC4wMTQtMC4wMDgsMC4wMjMtMC4wMjEsMC4wMzctMC4wMjhjMC4xNC0wLjA3OCwwLjI2OS0wLjE3NCwwLjM4LTAuMjg1YzAuMDE0LTAuMDE2LDAuMDI0LTAuMDM0LDAuMDM4LTAuMDQ4ICBjMC4xMDktMC4xMTksMC4yMDEtMC4yNTIsMC4yNzEtMC4zOThjMC4wMDYtMC4wMSwwLjAxNi0wLjAxOCwwLjAyMS0wLjAyOWMwLjAwNC0wLjAwOCwwLjAwOC0wLjAxNywwLjAxMS0wLjAyNiAgYzAuMDAyLTAuMDA0LDAuMDAzLTAuMDA2LDAuMDA1LTAuMDFDODAuNjI3LDg4LjAyMSw4MC42MzUsODguMDAyLDgwLjY0NCw4Ny45ODJ6IE03Ny42MTEsODQuNDYxTDQ4LjgwNSw2Ni40NTNsMzIuNDA3LTI1LjIwMiAgTDc3LjYxMSw4NC40NjF6IE00Ni44MTcsNjMuNzA5TDM1Ljg2MywyMy41NDJsNDMuODE4LDE0LjYwOEw0Ni44MTcsNjMuNzA5eiBNODQuNjY4LDQwLjU0Mmw4LjkyNiw1Ljk1MmwtMTEuOTAyLDI5Ljc1ICBMODQuNjY4LDQwLjU0MnogTTg5LjEyOCwzOS40NDZMODQuNTMsMzYuMzhsLTYuMTI5LTEyLjI1N0w4OS4xMjgsMzkuNDQ2eiBNNzkuODc2LDM0LjY0NUwzNy44MDcsMjAuNjIyTDY1Ljg1NCw2LjU5OUw3OS44NzYsMzQuNjQ1ICB6IE0zMy4yNjgsMTkuMTA3bC02LjQ4NS0yLjE2MmwyMy43ODEtNi40ODdMMzMuMjY4LDE5LjEwN3ogTTIxLjkyLDE4Ljg5NWw4LjY3LDIuODkxTDEwLjM1Nyw0Ny43OThMMjEuOTIsMTguODk1eiBNMzIuNjUyLDI0LjY0OSAgbDEwLjg0NSwzOS43NTdMNy4zNTEsNTcuMTc4TDMyLjY1MiwyNC42NDl6IE00My40NzIsNjcuODU3TDMyLjk2OSw5Mi4zNjNMOC40NjIsNjAuODU1TDQzLjQ3Miw2Ny44NTd6IE00Ni42MzEsNjkuMDlsMjcuODI2LDE3LjM5MyAgbC0zOC4yNjMsNi45NTlMNDYuNjMxLDY5LjA5eic+PC9wYXRoPjwvc3ZnPjtcbn07Il19
