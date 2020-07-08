const React = require('react');
const createClass = require('create-react-class');
const _ = require('lodash');

const Nav = require('naturalcrit/nav/nav.jsx');

const Navbar = createClass({
	getInitialState : function() {
		return {
			//showNonChromeWarning : false,
			ver : '0.0.0'
		};
	},

	componentDidMount : function() {
		//const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
		this.setState({
			//showNonChromeWarning : !isChrome,
			ver : window.version
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
	render : function(){
		return <Nav.base>
			<Nav.section>
				<Nav.logo />
				<Nav.link href='/' className='homebrewLogo'>
					<div>3D6 Homebrewery</div>
				</Nav.link>
				<Nav.link>{`v${this.state.ver}`}</Nav.link>

				{/*this.renderChromeWarning()*/}
			</Nav.section>
			{this.props.children}
		</Nav.base>;
	}
});

module.exports = Navbar;
