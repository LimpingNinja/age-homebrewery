const less = require('less');
const fs = require('fs');

less.render(fs.readFileSync('./client/homebrew/ageStyle/age.style.less', 'utf8'), { compress: true })
	.then((output)=>{
		fs.writeFileSync('./age.standalone.css', output.css);
		console.log('age.standalone.css created!');
	}, (err)=>{
		console.error(err);
	});