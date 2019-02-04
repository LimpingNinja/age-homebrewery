const label = 'build';
console.time(label);

const steps = require('vitreum/steps');

const Proj = require('./project.json');

steps.clean()
	.then(steps.libs(Proj.libs))
	.then(steps.jsx('homebrew', './client/homebrew/homebrew.jsx', {libs : Proj.libs, shared : Proj.shared})
		.then((deps)=>steps.less('homebrew', {shared : Proj.shared}, deps))
	)
	.then(steps.jsx('admin', './client/admin/admin.jsx', {libs : Proj.libs, shared : Proj.shared})
		.then((deps)=>steps.less('admin', {shared : Proj.shared}, deps))
	)
	.then(steps.assets(Proj.assets, ['./shared', './client']))
	.then(console.timeEnd.bind(console, label))
	.catch(console.error);
