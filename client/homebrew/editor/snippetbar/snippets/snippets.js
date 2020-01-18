/* eslint-disable max-lines */

const MagicGen = require('./magic.gen.js');
const ClassTableGen = require('./classtable.gen.js');
const MonsterBlockGen = require('./monsterblock.gen.js');
const ClassFeatureGen = require('./classfeature.gen.js');
const CoverPageGen = require('./coverpage.gen.js');
const TableOfContentsGen = require('./tableOfContents.gen.js');


module.exports = [

	{
		groupName : 'Editor',
		icon      : 'fa-pencil',
		snippets  : [
			{
				name : 'Column Break',
				icon : 'fa-columns',
				gen  : '```\n```\n\n'
			},
			{
				name : 'New Page',
				icon : 'fa-file-text',
				gen  : '\\page\n\n'
			},
			{
				name : 'Vertical Spacing',
				icon : 'fa-arrows-v',
				gen  : '<div style=\'margin-top:140px\'></div>\n\n'
			},
			{
				name : 'Wide Block',
				icon : 'fa-arrows-h',
				gen  : '<div class=\'wide\'>\nEverything in here will be extra wide. Tables, text, everything! Beware though, CSS columns can behave a bit weird sometimes.\n</div>\n'
			},
			{
				name : 'Image',
				icon : 'fa-image',
				gen  : [
					'<img ',
					'  src=\'https://s-media-cache-ak0.pinimg.com/736x/4a/81/79/4a8179462cfdf39054a418efd4cb743e.jpg\' ',
					'  style=\'width:325px\' />',
					'Credit: Kyounghwan Kim'
				].join('\n')
			},
			{
				name : 'Background Image',
				icon : 'fa-tree',
				gen  : [
					'<img ',
					'  src=\'http://i.imgur.com/hMna6G0.png\' ',
					'  style=\'position:absolute; top:50px; right:30px; width:280px\' />'
				].join('\n')
			},

			{
				name : 'Page Number',
				icon : 'fa-bookmark',
				gen  : '<div class=\'pageNumber\'>1</div>\n<div class=\'footnote\'>PART 1 | FANCINESS</div>\n\n'
			},

			{
				name : 'Auto-incrementing Page Number',
				icon : 'fa-sort-numeric-asc',
				gen  : '<div class=\'pageNumber auto\'></div>\n'
			},

			{
				name : 'Link to page',
				icon : 'fa-link',
				gen  : '[Click here](#p3) to go to page 3\n'
			},

			{
				name : "QR Code",
				icon : 'fa-qrcode',
				gen : [
					"<img ",
					"  src='https://api.qrserver.com/v1/create-qr-code/?data= ",
					"  http://homebrewery.ageuntold.com/share/PUTCODEHERE ",
					"  &amp;size=100x100' ",
					"  style='width:100px;mix-blend-mode:multiply '/>"
				].join('\n')
			},
			
			{
				name : 'Table of Contents',
				icon : 'fa-book',
				gen  : TableOfContentsGen
			},


		]
	},
	/************************* AGE ********************/

	{
		groupName : 'AGE',
		icon      : 'fa-book',
		snippets  : [
			{
				name : 'Spell',
				icon : 'fa-magic',
				gen  : MagicGen.spell,
			},
			{
				name : 'Spell List',
				icon : 'fa-list',
				gen  : MagicGen.spellList,
			},
			{
				name : 'Class Feature',
				icon : 'fa-trophy',
				gen  : ClassFeatureGen,
			},
			{
				name : 'Note',
				icon : 'fa-sticky-note',
				gen  : function(){
					return [
						'> ##### Time to Drop Knowledge',
						'> Use notes to point out some interesting information. ',
						'> ',
						'> **Tables and lists** both work within a note.'
					].join('\n');
				},
			},
			{
				name : 'Descriptive Text Box',
				icon : 'fa-sticky-note-o',
				gen  : function(){
					return [
						'<div class=\'descriptive\'>',
						'##### Time to Drop Knowledge',
						'Use notes to point out some interesting information. ',
						'',
						'**Tables and lists** both work within a note.',
						'</div>'
					].join('\n');
				},
			},
			{
				name : 'Monster Stat Block',
				icon : 'fa-bug',
				gen  : MonsterBlockGen.half,
			},
			{
				name : 'Wide Monster Stat Block',
				icon : 'fa-paw',
				gen  : MonsterBlockGen.full,
			},
			{
				name : 'Cover Page',
				icon : 'fa-file-word-o',
				gen  : CoverPageGen,
			},
		]
	},



	/*********************  TABLES *********************/

	{
		groupName : 'Tables',
		icon      : 'fa-table',
		snippets  : [
			{
				name : 'Class Table',
				icon : 'fa-table',
				gen  : ClassTableGen.full,
			},
			{
				name : 'Half Class Table',
				icon : 'fa-list-alt',
				gen  : ClassTableGen.half,
			},
			{
				name : 'Table',
				icon : 'fa-th-list',
				gen  : function(){
					return [
						'##### Cookie Tastiness',
						'| Tastiness | Cookie Type |',
						'|:----:|:-------------|',
						'| -5  | Raisin |',
						'| 8th  | Chocolate Chip |',
						'| 11th | 2 or lower |',
						'| 14th | 3 or lower |',
						'| 17th | 4 or lower |\n\n',
					].join('\n');
				},
			},
			{
				name : 'Wide Table',
				icon : 'fa-list',
				gen  : function(){
					return [
						'<div class=\'wide\'>',
						'##### Cookie Tastiness',
						'| Tastiness | Cookie Type |',
						'|:----:|:-------------|',
						'| -5  | Raisin |',
						'| 8th  | Chocolate Chip |',
						'| 11th | 2 or lower |',
						'| 14th | 3 or lower |',
						'| 17th | 4 or lower |',
						'</div>\n\n'
					].join('\n');
				},
			},
			{
				name : 'Split Table',
				icon : 'fa-th-large',
				gen  : function(){
					return [
						'<div style=\'column-count:2\'>',
						'| d10 | Damage Type |',
						'|:---:|:------------|',
						'|  1  | Acid        |',
						'|  2  | Cold        |',
						'|  3  | Fire        |',
						'|  4  | Force       |',
						'|  5  | Lightning   |',
						'',
						'```',
						'```',
						'',
						'| d10 | Damage Type |',
						'|:---:|:------------|',
						'|  6  | Necrotic    |',
						'|  7  | Poison      |',
						'|  8  | Psychic     |',
						'|  9  | Radiant     |',
						'|  10 | Thunder     |',
						'</div>\n\n',
					].join('\n');
				},
			}
		]
	},
//Colors
// Bestiary - 13,101,149
// Core Rulebook - 7,88,107
// Blue Rose - 18,123,182
// Titansgrave - 37, 124, 144
// Dragon Age - 128, 5, 14
	{
		groupName : 'Colors',
		icon      : 'fa-paint-brush',
		snippets  : [
			{
				name : 'Bestiarial',
				icon : 'fa-paw',
				gen  : function(){
					return [
						'<style>.age{--footer-bg:rgb(13,101,149)!important}.age h1,h2,h3,h4{color:#0d6595}.age h2{border-bottom-color:#000}.age h3{color:#000!important;border-bottom-color:#176f9f}.age h5{color:#fff;background-color:#0d6595!important;border-bottom-color:#0d6595}.age table tbody tr{background-color:@monsterStatBackground}.age table tbody tr:nth-child(odd){background-color:#dce4ee}.age table+table tbody tr:nth-child(odd){background-color:@monsterStatBackground}.age blockquote,.age hr+blockquote,.age table+table tbody tr:nth-child(even){background-color:#dce4ee}.age h5+ul{color:#0d6595}.age h5+ul li{color:#0d6595!important}// monster .age hr+blockquote hr+h5{background-color:#0d6595;color:#fff}.age hr+blockquote hr+ul,.age hr+blockquote table ul li string,.age hr+blockquote ul strong{color:#0d6595}.age .footnote,.age .pageNumber{color:#fff}.age .descriptive{color:#dce4ee}.age .toc ul li h3 a{color:#0d6595!important}</style>',
					].join('\n');
				},
			},
			{
				name : 'Companionesque',
				icon : 'fa-users',
				gen  : function(){
					return [
						'<style>.age{--footer-bg:rgb(196,63,49)!important}.age h1,h2,h3,h4{color:#c43f31!important}.age h2{border-bottom-color:#000}.age h3{color:#000!important;border-bottom-color:#ba3531}.age h5{color:#fff;background-color:#c43f31;border-bottom-color:#c43f31}.age table tbody tr{background-color:#fff}.age table tbody tr:nth-child(odd){background-color:#f2cfbb}.age table+table tbody tr:nth-child(odd){background-color:#fff}.age blockquote,.age table+table tbody tr:nth-child(even){background-color:#f2cfbb}.age h5+ul,.age h5+ul li{color:#c43f31}.age hr+blockquote{background-color:#fff}.age hr+blockquote hr+h5{background-color:#c43f31;color:#fff}.age hr+blockquote hr+ul,.age hr+blockquote table ul li string,.age hr+blockquote ul strong{color:#c43f31}.age .footnote,.age .pageNumber{color:#fff}.age .descriptive{color:#f2cfbb}.age .toc ul li h3 a{color:#c43f31!important}</style>',
					].join('\n');
				},
			},
			{
				name : 'Roselike',
				icon : 'fa-leaf',
				gen  : function(){
					return [
						'<style>.age{--footer-bg:rgb(18,123,182)!important}.age h1,h2,h3,h4{color:#127bb6}.age h2{color:#1c85c0;border-bottom-color:#000}.age h3{color:#000!important;border-bottom-color:#1c85c0}.age h5{color:#fff;background-color:#127bb6!important;border-bottom-color:#127bb6}.age table tbody tr{background-color:@monsterStatBackground}.age table tbody tr:nth-child(odd){background-color:#dde7f3}.age table+table tbody tr:nth-child(odd){background-color:#fff}.age table+table tbody tr:nth-child(even){background-color:#dde7f3}.age h5+ul,.age h5+ul li{color:#127bb6}.age blockquote{background-color:#dde7f3!important}.age h5+blockquote,.age hr+blockquote{background-color:#e6e7e8!important}.age hr+blockquote hr+h5{background-color:#127bb6;color:#fff}.age hr+blockquote hr+ul,.age hr+blockquote table ul li string,.age hr+blockquote ul strong{color:#127bb6}.age .footnote,.age .pageNumber{color:#fff}.age .descriptive{color:#dde7f3}.age .toc ul li h3 a{color:#127bb6!important}</style>',
					].join('\n');
				},
			}
		]

	},


	/**************** PRINT *************/

	{
		groupName : 'Print',
		icon      : 'fa-print',
		snippets  : [
			{
				name : 'A4 PageSize',
				icon : 'fa-file-o',
				gen  : ['<style>',
					'  .age{',
					'    width : 210mm;',
					'    height : 296.8mm;',
					'  }',
					'</style>'
				].join('\n')
			},
			{
				name : 'Ink Friendly',
				icon : 'fa-tint',
				gen  : ['<style>',
					'  .age{ background : white;}',
					'  .age img{ display : none;}',
					'  .age hr+blockquote{background : white;}',
					'</style>',
					''
				].join('\n')
			},
		]
	},

];
