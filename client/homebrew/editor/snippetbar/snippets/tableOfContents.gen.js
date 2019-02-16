const _ = require('lodash');

const getTOC = (pages)=>{
	const add1 = (title, page)=>{
		res.push({
			title    : title,
			page     : page + 1,
			children : []
		});
	};
	const add2 = (title, page)=>{
		if(!_.last(res)) add1('', page);
		_.last(res).children.push({
			title    : title,
			page     : page + 1,
			children : []
		});
	};
	const add3 = (title, page)=>{
		if(!_.last(res)) add1('', page);
		if(!_.last(_.last(res).children)) add2('', page);
		_.last(_.last(res).children).children.push({
			title    : title,
			page     : page + 1,
			children : []
		});
	};

	const res = [];
	_.each(pages, (page, pageNum)=>{
		const lines = page.split('\n');
		_.each(lines, (line)=>{
			if(_.startsWith(line, '# ')){
				const title = line.replace('# ', '');
				add1(title, pageNum);
			}
			if(_.startsWith(line, '## ')){
				const title = line.replace('## ', '');
				add2(title, pageNum);
			}
			if(_.startsWith(line, '### ')){
				const title = line.replace('### ', '');
				add3(title, pageNum);
			}
		});
	});
	return res;
};

module.exports = function(brew){
	const pages = brew.split('\\page');
	const TOC = getTOC(pages);
	const markdown = _.reduce(TOC, (r, g1, idx1)=>{
		if(g1.title) r.push(`- ### [<span>${g1.page}</span> <span>${g1.title}</span>](#p${g1.page})`);
		if(g1.children.length){
			_.each(g1.children, (g2, idx2)=>{
				if(g2.title) r.push(`- #### **[<span>${g2.page}</span> <span>${g2.title}</span>](#p${g2.page})**`);
				if(g2.children.length){
					_.each(g2.children, (g3, idx3)=>{
						if(g3.title) r.push(`  - [<span>${g3.page}</span> <span>${g3.title}</span>](#p${g3.page})`);
					});
				}
			});
		}
		return r;
	}, []).join('\n');

	return `<div class='toc'>
##### Table Of Contents
${markdown}
</div>\n`;
};