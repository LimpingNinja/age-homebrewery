const React = require('react');
const createClass = require('create-react-class');
const _     = require('lodash');
const cx    = require('classnames');

const Nav = require('naturalcrit/nav/nav.jsx');
const Navbar = require('../../navbar/navbar.jsx');

const RecentNavItem = require('../../navbar/recent.navitem.jsx').both;
const Account = require('../../navbar/account.navitem.jsx');
const BrewItem = require('./brewItem/brewItem.jsx');


const UserPage = createClass({
	getDefaultProps : function() {
		return {
			username : '',
			brews    : []
		};
	},

	renderBrews : function(brews){
		if(!brews || !brews.length) return <div className='noBrews'>No Brews.</div>;

		const sortedBrews = _.sortBy(brews, (brew)=>{ return brew.title; });

		return _.map(sortedBrews, (brew, idx)=>{
			return <BrewItem brew={brew} key={idx}/>;
		});
	},

	getSortedBrews : function(){
		return _.groupBy(this.props.brews, (brew)=>{
			return (brew.published ? 'published' : 'private');
		});
	},
	
	render : function(){
		const brews = this.getSortedBrews();

		return <div className='userPage page'>
			<Navbar>
				<Nav.section>
					<RecentNavItem />
					{
						<Nav.link href='/new' color='green' icon='fa-external-link'>
							New Brew
						</Nav.link>
					}
					<Account />
				</Nav.section>
			</Navbar>

			<div className='content'>
				<div className='age'>
					<h1>{this.props.username}'s AGE Brews</h1>
					<div className='published'>
					<h3>Published Brews</h3>
					{this.renderBrews(brews.published)}
					</div>
					<div className='unpublished'>
					<h3>Unpublished Brews</h3>
					{this.renderBrews(brews.private)}
					</div>
				</div>
			</div>
		</div>;
	}
});

module.exports = UserPage;