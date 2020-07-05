const React = require('react');
const createClass = require('create-react-class');

const Nav = require('naturalcrit/nav/nav.jsx');
const Navbar = require('../../../homebrew/navbar/navbar.jsx');
const ReportIssue = require('../../../homebrew/navbar/issue.navitem.jsx');

const LoginPage = createClass({
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
        return <div className='loginPage page'>
            <Navbar>
                <Nav.section>
                    <ReportIssue />
                </Nav.section>
            </Navbar>

            <div className='content'>
                <div className='brewRenderer'>
                    <div className='pages'>
                        <div className='age'>
                            <h1>Login</h1>
                            <form action='/login' method='post'>
                                <input type='text' className={this.getInputBoxClassName()} required placeholder='Username' name='username' />
                                <input type='password' className={this.getInputBoxClassName()} required placeholder='Password' name='password' />
                                <p className='error-message'>{this.props.errorMessage}</p>
                                <input type='submit' value='Log In' />
                            </form>
                            <br /><br />
                            <h4>Don't have an account?</h4>
                            <p><a href='/register'>Register</a></p>
                            <pre></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    } 
});

module.exports = LoginPage;