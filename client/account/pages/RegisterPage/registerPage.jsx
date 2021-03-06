const React = require('react');
const createClass = require('create-react-class');

const Nav = require('naturalcrit/nav/nav.jsx');
const Navbar = require('../../../homebrew/navbar/navbar.jsx');
const ReportIssue = require('../../../homebrew/navbar/issue.navitem.jsx');

const RegisterPage = createClass({
    getDefaultProps : function() {
        return {
            errorMessage : null
        };
    },

    getInputBoxClassName : function(){
        if(this.props.errorMessage && this.props.errorMessage.length != 0)
            return 'has-error';
        return '';
    },

    render : function(){
        return <div className='registerPage page'>
            <Navbar>
                <Nav.section>
                    <ReportIssue />
                </Nav.section>
            </Navbar>

            <div className='content'>
                <div className='brewRenderer'>
                    <div className='pages'>
                        <div className='age' id='p1'>
                            <h1>Register</h1>
                            <h2>Via username and password</h2>
                            <form action='/register' method='post'>
                                <input type='text' className={this.getInputBoxClassName()} required placeholder='Username' name='username' />
                                <input type='password' required placeholder='Password' name='password' />
                                <p className='error-message'>{this.props.errorMessage}</p>
                                <input type='submit' value='Register' />
                            </form>
                            <pre></pre>
                            <h2>Via social networks</h2>
                            <p>This functionality is not yet implemented, but we are on a way!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }
});

module.exports = RegisterPage;