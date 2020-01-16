# AGE Homebrewery
AGE Homebrewery is a tool for making Authentic looking content for the AGE engine using a modified [Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet). This is forked from HomeBrewery's DND version - Check it out [here](https://homebrewery.naturalcrit.com).

Installation guide is below pictures.

#### This is what it looks like:
![Markdown Editor](https://i.imgur.com/WhUOhKB.png)

#### Various AGE and other Tables can be created, pre-populated with random data to help you get started. (The random population is a feature of the original Homebrewery by NaturalCrit):
![Many Block Types](https://i.imgur.com/IXTH5VE.png)
![Block Types](https://i.imgur.com/jOCXsGH.png)

#### Four colors of style data with auto-insert included
![Red Colors](https://i.imgur.com/RPTSNxW.png)

#### Like HomeBrewery by NaturalCrit - you can generate a share link and PDF easily
![Share Link](https://i.imgur.com/Lvf51Mi.png)

### issues, suggestions, bugs
If you run into any issues using The Homebrewery, please submit an issue [here](/issues).

### Ch..ch..ch..changes (Tuesday, 29/01/2018 - v1.0.0a) and upcoming
MAJOR changes: field compression, dynamodb, AGE styling

You can check out the changelog [here](https://github.com/LimpingNinja/age-homebrewery/blob/master/changelog.md).

#### pre-reqs
1. install [node](https://nodejs.org/en/)
1. create an AWS account to use [dynamodb](https://aws.amazon.com/dynamodb/)

#### getting started
1. clone it
1. `npm install`
1. `npm run-script build`
1. `cp .env.example .env`
1. modify the aws keys in .env
1. `npm start` or `set NODE_ENV=development && node scripts/dev.js`

*If you are running OSX* Add this to package.json dependencies section:  "fsevents": "^1.2.7",

#### standalone AGE stylesheet
If you just want the stylesheet that is generated to make pages look like they are from the Player's Handbook, you will find it [here](https://github.com/LimpingNinja/age-homebrewery/blob/master/age.standalone.css).

If you are developing locally and would like to generate your own, follow the above steps and then run `npm run age`.

### license

This project is licensed under [MIT](./license). Which means you are free to use AGE Homebrewery in any way that you want, except for claiming that you made it yourself.

If you wish to sell or in some way gain profit for what's created on this site, it's your responsibility to ensure you have the proper licenses/rights for any images or resources used.
