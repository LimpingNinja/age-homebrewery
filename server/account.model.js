const dynamoose = require('dynamoose');
const shortid = require('shortid');
const _ = require('lodash');
const LZUTF8 = require('lzutf8');
const bcrypt = require('bcrypt-nodejs');

const hashPassword = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

let Schema = dynamoose.Schema;
const AccountSchema = new Schema({
    username    : { type: String, required: true, index: { global: true, project: true } },
    password    : { type: String, required: true, set: hashPassword },
    passport    : Map,
},
{
    saveUnknown : true,
    throughput  : 'ON_DEMAND'
});

AccountSchema.statics.serializeAccount = function() {
    return function (account, done) {
        done(null, account.id);
    };
};

AccountSchema.statics.deserializeAccount = function() {
    const that = this;
    return function (accountId, done) {
        //that.findById(accountId, done);
    };
};

AccountSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//AccountSchema.virtual('old').get(function(){
//    return false;
//});

const Account = dynamoose.model('Account', AccountSchema, { update: true });

// Account.post('save', function(error, doc, next) {
    //if(error.name == 'MongoError' && error.code == 11000) {
    //    return next('This username is already taken');
    //}
    //next(error);
//});
module.exports = {
    schema : AccountSchema,
    model  : Account,
}; 