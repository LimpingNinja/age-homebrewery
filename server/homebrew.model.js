const dynamoose = require('dynamoose');
const shortid = require('shortid');
const _ = require('lodash');
const LZUTF8 = require('lzutf8');

let Schema = dynamoose.Schema;
const HomebrewSchema = new Schema({
	shareId : { type: String, default: shortid.generate, index: { global: true, project: true } },
	editId  : { type: String, default: shortid.generate, hashKey: true },
	title   : { type: String, default: '' },
	text    : { type: Buffer, default: '' },

	description : { type: String, default: '' },
	tags        : { type: String, default: '' },
	systems     : [String],
	authors     : [String],
	published   : { type: Boolean, default: false },

	createdAt  : { type: Date, default: Date.now },
	updatedAt  : { type: Date, default: Date.now },
	lastViewed : { type: Date, default: Date.now },
	views      : { type: Number, default: 0 },
	version    : { type: Number, default: 1 }
},
{
	throughput : 'ON_DEMAND'
});

HomebrewSchema.method('sanitize', function(full=false){
	const brew = this;
	delete brew._id;
	delete brew.__v;

	brew.text = LZUTF8.decompress(brew.text, { inputEncoding: 'Buffer' });
	if(full){
		delete brew.editId;
	}
	return brew;
});

HomebrewSchema.method('increaseView', function(){
	return new Promise((resolve, reject)=>{
		this.lastViewed = new Date();
		this.views = this.views + 1;
		this.save((err)=>{
			if(err) return reject(err);
			return resolve(this);
		});
	});
});


HomebrewSchema.statics.get = function(query){
 	return new Promise((resolve, reject)=>{
 		Homebrew.query(query, (err, brews)=>{
 			if(err || !brews.length) return reject('Can not find brew');
 			return resolve(brews[0]);
 		});
 	});
};

HomebrewSchema.statics.getPublishedByUser = function(username, allowAccess=false){
	return new Promise((resolve, reject)=>{
		const query = { published: true, authors: { contains: username } };
		if(allowAccess){
			delete query.published;
		}
		Homebrew.scan(query, function(err, brews) {
			return resolve(_.map(brews, (brew) => {
				return brew.sanitize(!allowAccess);
			}));
		});
	});
};

// TODO: The scan here is terrible IMO; I think possibly creating a secondary index by username on the
// homebrew schema or rewriting the homebrew schema.
HomebrewSchema.statics.getByUser = function(username, allowAccess=false){
	return new Promise((resolve, reject)=>{
		const query = { authors: username, published: true };
		if(allowAccess){
			delete query.published;
		}
		Homebrew.scan({ authors: { contains: username } }, function (err, brews) {
			//Homebrew.query(query, (err, brews)=>{
			if (err) {
				console.log('Can not find brew');
			}
			return resolve(_.map(brews, (brew) => {
				return brew.sanitize(!allowAccess);
			}));
		});
	});
};

const Homebrew = dynamoose.model('Homebrew', HomebrewSchema, { update: true });

module.exports = {
	schema : HomebrewSchema,
	model  : Homebrew,
};
