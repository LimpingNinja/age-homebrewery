(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.admin = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/kcmorgan/Projects/homebrewery/client/admin/admin.jsx":[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');

var BrewCleanup = require('./brewCleanup/brewCleanup.jsx');
var BrewLookup = require('./brewLookup/brewLookup.jsx');
var Stats = require('./stats/stats.jsx');

var Admin = createClass({
	getDefaultProps: function getDefaultProps() {
		return {};
	},

	render: function render() {
		return React.createElement(
			'div',
			{ className: 'admin' },
			React.createElement(
				'header',
				null,
				React.createElement(
					'div',
					{ className: 'container' },
					React.createElement('i', { className: 'fa fa-rocket' }),
					'homebrewery admin'
				)
			),
			React.createElement(
				'div',
				{ className: 'container' },
				React.createElement(Stats, null),
				React.createElement('hr', null),
				React.createElement(BrewLookup, null),
				React.createElement('hr', null),
				React.createElement(BrewCleanup, null)
			)
		);
	}
});

module.exports = Admin;

},{"./brewCleanup/brewCleanup.jsx":1,"./brewLookup/brewLookup.jsx":2,"./stats/stats.jsx":3,"create-react-class":"create-react-class","react":"react"}],1:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var cx = require('classnames');

var request = require('superagent');

var BrewCleanup = createClass({
	displayName: 'BrewCleanup',
	getDefaultProps: function getDefaultProps() {
		return {};
	},
	getInitialState: function getInitialState() {
		return {
			count: 0,

			pending: false,
			primed: false,
			err: null
		};
	},
	prime: function prime() {
		var _this = this;

		this.setState({ pending: true });

		request.get('/admin/cleanup').then(function (res) {
			return _this.setState({ count: res.body.count, primed: true });
		}).catch(function (err) {
			return _this.setState({ error: err });
		}).finally(function () {
			return _this.setState({ pending: false });
		});
	},
	cleanup: function cleanup() {
		var _this2 = this;

		this.setState({ pending: true });

		request.post('/admin/cleanup').then(function (res) {
			return _this2.setState({ count: res.body.count });
		}).catch(function (err) {
			return _this2.setState({ error: err });
		}).finally(function () {
			return _this2.setState({ pending: false, primed: false });
		});
	},
	renderPrimed: function renderPrimed() {
		if (!this.state.primed) return;

		if (!this.state.count) {
			return React.createElement(
				'div',
				{ className: 'removeBox' },
				'No Matching Brews found.'
			);
		}
		return React.createElement(
			'div',
			{ className: 'removeBox' },
			React.createElement(
				'button',
				{ onClick: this.cleanup, className: 'remove' },
				this.state.pending ? React.createElement('i', { className: 'fa fa-spin fa-spinner' }) : React.createElement(
					'span',
					null,
					React.createElement('i', { className: 'fa fa-times' }),
					' Remove'
				)
			),
			React.createElement(
				'span',
				null,
				'Found ',
				this.state.count,
				' Brews that could be removed. '
			)
		);
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'BrewCleanup' },
			React.createElement(
				'h2',
				null,
				' Brew Cleanup '
			),
			React.createElement(
				'p',
				null,
				'Removes very short brews to tidy up the database'
			),
			React.createElement(
				'button',
				{ onClick: this.prime, className: 'query' },
				this.state.pending ? React.createElement('i', { className: 'fa fa-spin fa-spinner' }) : 'Query Brews'
			),
			this.renderPrimed(),
			this.state.error && React.createElement(
				'div',
				{ className: 'error' },
				this.state.error.toString()
			)
		);
	}
});

module.exports = BrewCleanup;

},{"classnames":"classnames","create-react-class":"create-react-class","react":"react","superagent":"superagent"}],2:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var cx = require('classnames');

var request = require('superagent');
var Moment = require('moment');

var BrewLookup = createClass({
	getDefaultProps: function getDefaultProps() {
		return {};
	},
	getInitialState: function getInitialState() {
		return {
			query: '',
			foundBrew: null,
			searching: false,
			error: null
		};
	},
	handleChange: function handleChange(e) {
		this.setState({ query: e.target.value });
	},
	lookup: function lookup() {
		var _this = this;

		this.setState({ searching: true, error: null });

		request.get('/admin/lookup/' + this.state.query).then(function (res) {
			return _this.setState({ foundBrew: res.body });
		}).catch(function (err) {
			return _this.setState({ error: err });
		}).finally(function () {
			return _this.setState({ searching: false });
		});
	},
	renderFoundBrew: function renderFoundBrew() {
		var brew = this.state.foundBrew;
		return React.createElement(
			'div',
			{ className: 'foundBrew' },
			React.createElement(
				'dl',
				null,
				React.createElement(
					'dt',
					null,
					'Title'
				),
				React.createElement(
					'dd',
					null,
					brew.title
				),
				React.createElement(
					'dt',
					null,
					'Authors'
				),
				React.createElement(
					'dd',
					null,
					brew.authors.join(', ')
				),
				React.createElement(
					'dt',
					null,
					'Edit Link'
				),
				React.createElement(
					'dd',
					null,
					React.createElement(
						'a',
						{ href: '/edit/' + brew.editId, target: '_blank', rel: 'noopener noreferrer' },
						'/edit/',
						brew.editId
					)
				),
				React.createElement(
					'dt',
					null,
					'Share Link'
				),
				React.createElement(
					'dd',
					null,
					React.createElement(
						'a',
						{ href: '/share/' + brew.shareId, target: '_blank', rel: 'noopener noreferrer' },
						'/share/',
						brew.shareId
					)
				),
				React.createElement(
					'dt',
					null,
					'Last Updated'
				),
				React.createElement(
					'dd',
					null,
					Moment(brew.updatedAt).fromNow()
				),
				React.createElement(
					'dt',
					null,
					'Num of Views'
				),
				React.createElement(
					'dd',
					null,
					brew.views
				)
			)
		);
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'brewLookup' },
			React.createElement(
				'h2',
				null,
				'Brew Lookup'
			),
			React.createElement('input', { type: 'text', value: this.state.query, onChange: this.handleChange, placeholder: 'edit or share id' }),
			React.createElement(
				'button',
				{ onClick: this.lookup },
				React.createElement('i', { className: cx('fa', {
						'fa-search': !this.state.searching,
						'fa-spin fa-spinner': this.state.searching
					}) })
			),
			this.state.error && React.createElement(
				'div',
				{ className: 'error' },
				this.state.error.toString()
			),
			this.state.foundBrew ? this.renderFoundBrew() : React.createElement(
				'div',
				{ className: 'noBrew' },
				'No brew found.'
			)
		);
	}
});

module.exports = BrewLookup;

},{"classnames":"classnames","create-react-class":"create-react-class","moment":"moment","react":"react","superagent":"superagent"}],3:[function(require,module,exports){
'use strict';

var React = require('react');
var createClass = require('create-react-class');
var cx = require('classnames');

var request = require('superagent');

var Stats = createClass({
	displayName: 'Stats',
	getDefaultProps: function getDefaultProps() {
		return {};
	},
	getInitialState: function getInitialState() {
		return {
			stats: {
				totalBrews: 0
			},
			fetching: false
		};
	},
	componentDidMount: function componentDidMount() {
		this.fetchStats();
	},
	fetchStats: function fetchStats() {
		var _this = this;

		this.setState({ fetching: true });
		request.get('/admin/stats').then(function (res) {
			return _this.setState({ stats: res.body });
		}).finally(function () {
			return _this.setState({ fetching: false });
		});
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'Stats' },
			React.createElement(
				'h2',
				null,
				' Stats '
			),
			React.createElement(
				'dl',
				null,
				React.createElement(
					'dt',
					null,
					'Total Brew Count'
				),
				React.createElement(
					'dd',
					null,
					this.state.stats.totalBrews
				)
			),
			this.state.fetching && React.createElement(
				'div',
				{ className: 'pending' },
				React.createElement('i', { className: 'fa fa-spin fa-spinner' })
			)
		);
	}
});

module.exports = Stats;

},{"classnames":"classnames","create-react-class":"create-react-class","react":"react","superagent":"superagent"}]},{},[])("/Users/kcmorgan/Projects/homebrewery/client/admin/admin.jsx")
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQvYWRtaW4vYWRtaW4uanN4IiwiY2xpZW50L2FkbWluL2JyZXdDbGVhbnVwL2JyZXdDbGVhbnVwLmpzeCIsImNsaWVudC9hZG1pbi9icmV3TG9va3VwL2JyZXdMb29rdXAuanN4IiwiY2xpZW50L2FkbWluL3N0YXRzL3N0YXRzLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBTSxRQUFRLFFBQVEsT0FBUixDQUFkO0FBQ0EsSUFBTSxjQUFjLFFBQVEsb0JBQVIsQ0FBcEI7O0FBR0EsSUFBTSxjQUFjLFFBQVEsK0JBQVIsQ0FBcEI7QUFDQSxJQUFNLGFBQWEsUUFBUSw2QkFBUixDQUFuQjtBQUNBLElBQU0sUUFBUSxRQUFRLG1CQUFSLENBQWQ7O0FBRUEsSUFBTSxRQUFRLFlBQVk7QUFDekIsa0JBQWtCLDJCQUFXO0FBQzVCLFNBQU8sRUFBUDtBQUNBLEVBSHdCOztBQUt6QixTQUFTLGtCQUFVO0FBQ2xCLFNBQU87QUFBQTtBQUFBLEtBQUssV0FBVSxPQUFmO0FBRU47QUFBQTtBQUFBO0FBQ0M7QUFBQTtBQUFBLE9BQUssV0FBVSxXQUFmO0FBQ0MsZ0NBQUcsV0FBVSxjQUFiLEdBREQ7QUFBQTtBQUFBO0FBREQsSUFGTTtBQVFOO0FBQUE7QUFBQSxNQUFLLFdBQVUsV0FBZjtBQUNDLHdCQUFDLEtBQUQsT0FERDtBQUVDLG1DQUZEO0FBR0Msd0JBQUMsVUFBRCxPQUhEO0FBSUMsbUNBSkQ7QUFLQyx3QkFBQyxXQUFEO0FBTEQ7QUFSTSxHQUFQO0FBZ0JBO0FBdEJ3QixDQUFaLENBQWQ7O0FBeUJBLE9BQU8sT0FBUCxHQUFpQixLQUFqQjs7Ozs7QUNqQ0EsSUFBTSxRQUFjLFFBQVEsT0FBUixDQUFwQjtBQUNBLElBQU0sY0FBYyxRQUFRLG9CQUFSLENBQXBCO0FBQ0EsSUFBTSxLQUFjLFFBQVEsWUFBUixDQUFwQjs7QUFFQSxJQUFNLFVBQVUsUUFB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QWIsRUFBZCxDQUFQO0FBQUEsR0FEUCxFQUVFLE9BRkYsQ0FFVTtBQUFBLFVBQUksTUFBSyxRQUFMLENBQWMsRUFBRSxVQUFVLEtBQVosRUFBZCxDQUFKO0FBQUEsR0FGVjtBQUdBLEVBckJ3QjtBQXNCekIsT0F0QnlCLG9CQXNCakI7QUFDUCxTQUFPO0FBQUE7QUFBQSxLQUFLLFdBQVUsT0FBZjtBQUNOO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFETTtBQUVOO0FBQUE7QUFBQTtBQUNDO0FBQUE7QUFBQTtBQUFBO0FBQUEsS0FERDtBQUVDO0FBQUE7QUFBQTtBQUFLLFVBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUI7QUFBdEI7QUFGRCxJQUZNO0FBT0wsUUFBSyxLQUFMLENBQVcsUUFBWCxJQUNHO0FBQUE7QUFBQSxNQUFLLFdBQVUsU0FBZjtBQUF5QiwrQkFBRyxXQUFVLHVCQUFiO0FBQXpCO0FBUkUsR0FBUDtBQVdBO0FBbEN3QixDQUFaLENBQWQ7O0FBcUNBLE9BQU8sT0FBUCxHQUFpQixLQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5cblxuY29uc3QgQnJld0NsZWFudXAgPSByZXF1aXJlKCcuL2JyZXdDbGVhbnVwL2JyZXdDbGVhbnVwLmpzeCcpO1xuY29uc3QgQnJld0xvb2t1cCA9IHJlcXVpcmUoJy4vYnJld0xvb2t1cC9icmV3TG9va3VwLmpzeCcpO1xuY29uc3QgU3RhdHMgPSByZXF1aXJlKCcuL3N0YXRzL3N0YXRzLmpzeCcpO1xuXG5jb25zdCBBZG1pbiA9IGNyZWF0ZUNsYXNzKHtcblx0Z2V0RGVmYXVsdFByb3BzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHt9O1xuXHR9LFxuXG5cdHJlbmRlciA6IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdhZG1pbic+XG5cblx0XHRcdDxoZWFkZXI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPSdjb250YWluZXInPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT0nZmEgZmEtcm9ja2V0JyAvPlxuXHRcdFx0XHRcdGhvbWVicmV3ZXJ5IGFkbWluXG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9oZWFkZXI+XG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT0nY29udGFpbmVyJz5cblx0XHRcdFx0PFN0YXRzIC8+XG5cdFx0XHRcdDxociAvPlxuXHRcdFx0XHQ8QnJld0xvb2t1cCAvPlxuXHRcdFx0XHQ8aHIgLz5cblx0XHRcdFx0PEJyZXdDbGVhbnVwIC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFkbWluO1xuIiwiY29uc3QgUmVhY3QgICAgICAgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdjcmVhdGUtcmVhY3QtY2xhc3MnKTtcbmNvbnN0IGN4ICAgICAgICAgID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG5jb25zdCByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG5cbmNvbnN0IEJyZXdDbGVhbnVwID0gY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZSA6ICdCcmV3Q2xlYW51cCcsXG5cdGdldERlZmF1bHRQcm9wcygpe1xuXHRcdHJldHVybiB7fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb3VudCA6IDAsXG5cblx0XHRcdHBlbmRpbmcgOiBmYWxzZSxcblx0XHRcdHByaW1lZCAgOiBmYWxzZSxcblx0XHRcdGVyciAgICAgOiBudWxsXG5cdFx0fTtcblx0fSxcblx0cHJpbWUoKXtcblx0XHR0aGlzLnNldFN0YXRlKHsgcGVuZGluZzogdHJ1ZSB9KTtcblxuXHRcdHJlcXVlc3QuZ2V0KCcvYWRtaW4vY2xlYW51cCcpXG5cdFx0XHQudGhlbigocmVzKT0+dGhpcy5zZXRTdGF0ZSh7IGNvdW50OiByZXMuYm9keS5jb3VudCwgcHJpbWVkOiB0cnVlIH0pKVxuXHRcdFx0LmNhdGNoKChlcnIpPT50aGlzLnNldFN0YXRlKHsgZXJyb3I6IGVyciB9KSlcblx0XHRcdC5maW5hbGx5KCgpPT50aGlzLnNldFN0YXRlKHsgcGVuZGluZzogZmFsc2UgfSkpO1xuXHR9LFxuXHRjbGVhbnVwKCl7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7IHBlbmRpbmc6IHRydWUgfSk7XG5cblx0XHRyZXF1ZXN0LnBvc3QoJy9hZG1pbi9jbGVhbnVwJylcblx0XHRcdC50aGVuKChyZXMpPT50aGlzLnNldFN0YXRlKHsgY291bnQ6IHJlcy5ib2R5LmNvdW50IH0pKVxuXHRcdFx0LmNhdGNoKChlcnIpPT50aGlzLnNldFN0YXRlKHsgZXJyb3I6IGVyciB9KSlcblx0XHRcdC5maW5hbGx5KCgpPT50aGlzLnNldFN0YXRlKHsgcGVuZGluZzogZmFsc2UsIHByaW1lZDogZmFsc2UgfSkpO1xuXHR9LFxuXHRyZW5kZXJQcmltZWQoKXtcblx0XHRpZighdGhpcy5zdGF0ZS5wcmltZWQpIHJldHVybjtcblxuXHRcdGlmKCF0aGlzLnN0YXRlLmNvdW50KXtcblx0XHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ncmVtb3ZlQm94Jz5ObyBNYXRjaGluZyBCcmV3cyBmb3VuZC48L2Rpdj47XG5cdFx0fVxuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0ncmVtb3ZlQm94Jz5cblx0XHRcdDxidXR0b24gb25DbGljaz17dGhpcy5jbGVhbnVwfSBjbGFzc05hbWU9J3JlbW92ZSc+XG5cdFx0XHRcdHt0aGlzLnN0YXRlLnBlbmRpbmdcblx0XHRcdFx0XHQ/IDxpIGNsYXNzTmFtZT0nZmEgZmEtc3BpbiBmYS1zcGlubmVyJyAvPlxuXHRcdFx0XHRcdDogPHNwYW4+PGkgY2xhc3NOYW1lPSdmYSBmYS10aW1lcycgLz4gUmVtb3ZlPC9zcGFuPlxuXHRcdFx0XHR9XG5cdFx0XHQ8L2J1dHRvbj5cblx0XHRcdDxzcGFuPkZvdW5kIHt0aGlzLnN0YXRlLmNvdW50fSBCcmV3cyB0aGF0IGNvdWxkIGJlIHJlbW92ZWQuIDwvc3Bhbj5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cdHJlbmRlcigpe1xuXHRcdHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nQnJld0NsZWFudXAnPlxuXHRcdFx0PGgyPiBCcmV3IENsZWFudXAgPC9oMj5cblx0XHRcdDxwPlJlbW92ZXMgdmVyeSBzaG9ydCBicmV3cyB0byB0aWR5IHVwIHRoZSBkYXRhYmFzZTwvcD5cblxuXHRcdFx0PGJ1dHRvbiBvbkNsaWNrPXt0aGlzLnByaW1lfSBjbGFzc05hbWU9J3F1ZXJ5Jz5cblx0XHRcdFx0e3RoaXMuc3RhdGUucGVuZGluZ1xuXHRcdFx0XHRcdD8gPGkgY2xhc3NOYW1lPSdmYSBmYS1zcGluIGZhLXNwaW5uZXInIC8+XG5cdFx0XHRcdFx0OiAnUXVlcnkgQnJld3MnXG5cdFx0XHRcdH1cblx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0e3RoaXMucmVuZGVyUHJpbWVkKCl9XG5cblx0XHRcdHt0aGlzLnN0YXRlLmVycm9yXG5cdFx0XHRcdCYmIDxkaXYgY2xhc3NOYW1lPSdlcnJvcic+e3RoaXMuc3RhdGUuZXJyb3IudG9TdHJpbmcoKX08L2Rpdj5cblx0XHRcdH1cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyZXdDbGVhbnVwOyIsImNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmNvbnN0IGNyZWF0ZUNsYXNzID0gcmVxdWlyZSgnY3JlYXRlLXJlYWN0LWNsYXNzJyk7XG5jb25zdCBjeCAgICA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxuY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcbmNvbnN0IE1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuXG5cbmNvbnN0IEJyZXdMb29rdXAgPSBjcmVhdGVDbGFzcyh7XG5cdGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge307XG5cdH0sXG5cdGdldEluaXRpYWxTdGF0ZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cXVlcnkgICAgIDogJycsXG5cdFx0XHRmb3VuZEJyZXcgOiBudWxsLFxuXHRcdFx0c2VhcmNoaW5nIDogZmFsc2UsXG5cdFx0XHRlcnJvciAgICAgOiBudWxsXG5cdFx0fTtcblx0fSxcblx0aGFuZGxlQ2hhbmdlKGUpe1xuXHRcdHRoaXMuc2V0U3RhdGUoeyBxdWVyeTogZS50YXJnZXQudmFsdWUgfSk7XG5cdH0sXG5cdGxvb2t1cCgpe1xuXHRcdHRoaXMuc2V0U3RhdGUoeyBzZWFyY2hpbmc6IHRydWUsIGVycm9yOiBudWxsIH0pO1xuXG5cdFx0cmVxdWVzdC5nZXQoYC9hZG1pbi9sb29rdXAvJHt0aGlzLnN0YXRlLnF1ZXJ5fWApXG5cdFx0XHQudGhlbigocmVzKT0+dGhpcy5zZXRTdGF0ZSh7IGZvdW5kQnJldzogcmVzLmJvZHkgfSkpXG5cdFx0XHQuY2F0Y2goKGVycik9PnRoaXMuc2V0U3RhdGUoeyBlcnJvcjogZXJyIH0pKVxuXHRcdFx0LmZpbmFsbHkoKCk9PnRoaXMuc2V0U3RhdGUoeyBzZWFyY2hpbmc6IGZhbHNlIH0pKTtcblx0fSxcblxuXHRyZW5kZXJGb3VuZEJyZXcoKXtcblx0XHRjb25zdCBicmV3ID0gdGhpcy5zdGF0ZS5mb3VuZEJyZXc7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdmb3VuZEJyZXcnPlxuXHRcdFx0PGRsPlxuXHRcdFx0XHQ8ZHQ+VGl0bGU8L2R0PlxuXHRcdFx0XHQ8ZGQ+e2JyZXcudGl0bGV9PC9kZD5cblxuXHRcdFx0XHQ8ZHQ+QXV0aG9yczwvZHQ+XG5cdFx0XHRcdDxkZD57YnJldy5hdXRob3JzLmpvaW4oJywgJyl9PC9kZD5cblxuXHRcdFx0XHQ8ZHQ+RWRpdCBMaW5rPC9kdD5cblx0XHRcdFx0PGRkPjxhIGhyZWY9e2AvZWRpdC8ke2JyZXcuZWRpdElkfWB9IHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInPi9lZGl0L3ticmV3LmVkaXRJZH08L2E+PC9kZD5cblxuXHRcdFx0XHQ8ZHQ+U2hhcmUgTGluazwvZHQ+XG5cdFx0XHRcdDxkZD48YSBocmVmPXtgL3NoYXJlLyR7YnJldy5zaGFyZUlkfWB9IHRhcmdldD0nX2JsYW5rJyByZWw9J25vb3BlbmVyIG5vcmVmZXJyZXInPi9zaGFyZS97YnJldy5zaGFyZUlkfTwvYT48L2RkPlxuXG5cdFx0XHRcdDxkdD5MYXN0IFVwZGF0ZWQ8L2R0PlxuXHRcdFx0XHQ8ZGQ+e01vbWVudChicmV3LnVwZGF0ZWRBdCkuZnJvbU5vdygpfTwvZGQ+XG5cblx0XHRcdFx0PGR0Pk51bSBvZiBWaWV3czwvZHQ+XG5cdFx0XHRcdDxkZD57YnJldy52aWV3c308L2RkPlxuXHRcdFx0PC9kbD5cblx0XHQ8L2Rpdj47XG5cdH0sXG5cblx0cmVuZGVyKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdicmV3TG9va3VwJz5cblx0XHRcdDxoMj5CcmV3IExvb2t1cDwvaDI+XG5cdFx0XHQ8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9e3RoaXMuc3RhdGUucXVlcnl9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUNoYW5nZX0gcGxhY2Vob2xkZXI9J2VkaXQgb3Igc2hhcmUgaWQnIC8+XG5cdFx0XHQ8YnV0dG9uIG9uQ2xpY2s9e3RoaXMubG9va3VwfT5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPXtjeCgnZmEnLCB7XG5cdFx0XHRcdFx0J2ZhLXNlYXJjaCcgICAgICAgICAgOiAhdGhpcy5zdGF0ZS5zZWFyY2hpbmcsXG5cdFx0XHRcdFx0J2ZhLXNwaW4gZmEtc3Bpbm5lcicgOiB0aGlzLnN0YXRlLnNlYXJjaGluZyxcblx0XHRcdFx0fSl9IC8+XG5cdFx0XHQ8L2J1dHRvbj5cblxuXHRcdFx0e3RoaXMuc3RhdGUuZXJyb3Jcblx0XHRcdFx0JiYgPGRpdiBjbGFzc05hbWU9J2Vycm9yJz57dGhpcy5zdGF0ZS5lcnJvci50b1N0cmluZygpfTwvZGl2PlxuXHRcdFx0fVxuXG5cdFx0XHR7dGhpcy5zdGF0ZS5mb3VuZEJyZXdcblx0XHRcdFx0PyB0aGlzLnJlbmRlckZvdW5kQnJldygpXG5cdFx0XHRcdDogPGRpdiBjbGFzc05hbWU9J25vQnJldyc+Tm8gYnJldyBmb3VuZC48L2Rpdj5cblx0XHRcdH1cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyZXdMb29rdXA7XG4iLCJjb25zdCBSZWFjdCAgICAgICA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBjcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2NyZWF0ZS1yZWFjdC1jbGFzcycpO1xuY29uc3QgY3ggICAgICAgICAgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbmNvbnN0IHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cblxuY29uc3QgU3RhdHMgPSBjcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lIDogJ1N0YXRzJyxcblx0Z2V0RGVmYXVsdFByb3BzKCl7XG5cdFx0cmV0dXJuIHt9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3RhdGUoKXtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RhdHMgOiB7XG5cdFx0XHRcdHRvdGFsQnJld3MgOiAwXG5cdFx0XHR9LFxuXHRcdFx0ZmV0Y2hpbmcgOiBmYWxzZVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50KCl7XG5cdFx0dGhpcy5mZXRjaFN0YXRzKCk7XG5cdH0sXG5cdGZldGNoU3RhdHMoKXtcblx0XHR0aGlzLnNldFN0YXRlKHsgZmV0Y2hpbmc6IHRydWUgfSk7XG5cdFx0cmVxdWVzdC5nZXQoJy9hZG1pbi9zdGF0cycpXG5cdFx0XHQudGhlbigocmVzKT0+dGhpcy5zZXRTdGF0ZSh7IHN0YXRzOiByZXMuYm9keSB9KSlcblx0XHRcdC5maW5hbGx5KCgpPT50aGlzLnNldFN0YXRlKHsgZmV0Y2hpbmc6IGZhbHNlIH0pKTtcblx0fSxcblx0cmVuZGVyKCl7XG5cdFx0cmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdTdGF0cyc+XG5cdFx0XHQ8aDI+IFN0YXRzIDwvaDI+XG5cdFx0XHQ8ZGw+XG5cdFx0XHRcdDxkdD5Ub3RhbCBCcmV3IENvdW50PC9kdD5cblx0XHRcdFx0PGRkPnt0aGlzLnN0YXRlLnN0YXRzLnRvdGFsQnJld3N9PC9kZD5cblx0XHRcdDwvZGw+XG5cblx0XHRcdHt0aGlzLnN0YXRlLmZldGNoaW5nXG5cdFx0XHRcdCYmIDxkaXYgY2xhc3NOYW1lPSdwZW5kaW5nJz48aSBjbGFzc05hbWU9J2ZhIGZhLXNwaW4gZmEtc3Bpbm5lcicgLz48L2Rpdj5cblx0XHRcdH1cblx0XHQ8L2Rpdj47XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRzOyJdfQ==
