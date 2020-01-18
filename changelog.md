# changelog

### 01/19/2020 - v1.2.0a
- Modified monster abilities, randomized more stats
- Fixed popup warnings and notifications about deletion (pulled from NaturalCrit)
- Removed links, fixed bad links (pulled from NaturalCrit)
- Started scaffolding (not in codebase) for buildout of authentication framework
- Added QRcode snippet from https://github.com/bakgaard (pulled from open NaturalCrit pull requests)
### 02/16/2019 - v1.1.0a
- Modified the TOC generator based on CalculusChild's modification:
  - https://github.com/naturalcrit/homebrewery/issues/304#issue-203419600
- Style modifications to add 'example', correct 'notes' and fix some -margin issues
- Added new favicon, temporary
- Changed URLS, next version will have a breaking model as we start storing UID in the object and rewrite the 'personal page' in the new backend.
- Modified Welcome text to be more appropriate
- Added quick-color snippets menu bar and options for adding custom styling 
- Added styles: Beastiarial, Companionesque, Roselike to add additional color schemes
- [note]: Changes for the share shop will not be added to this application, this will remain as-is with additional functionality added outside.
### 02/03/2019 - v1.0.0a
- Cloned from https://github.com/naturalcrit/homebrewery.git
#### Visual:
- Re-referenced all PHB to AGE. 
- Modified the table styling to correspond with AGE styling.
- Changed background and colors to match AGE styling
- Made less @ variables more sane for headers
- Modified the monster stat block to look like an AGE stat blcok
#### Data
- [breaking] Switched from mongoose to dynamoose, dynamoDb support
- [breaking] Modified the homebrew model to add global secondary index
- [breaking] Changed homebrew.text to 'B' (buffer) data type
- [breaking] Modified the save/get functions to compress/decompress with LZUTF8
#### Security
- Created .env and .env.example files to keep AWS credentials out of git
#### Dependencies
- Upgraded packages cryptiles and deepextend for sevfix
- Added dynamoose package
- Added dotenv package

