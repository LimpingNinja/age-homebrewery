# changelog

### Tuesday, 02/03/2018 - v1.0.0a
- Cloned from https://github.com/naturalcrit/homebrewery.git
Visual:
- Re-referenced all PHB to AGE. 
- Modified the table styling to correspond with AGE styling.
- Changed background and colors to match AGE styling
- Made less @ variables more sane for headers
- Modified the monster stat block to look like an AGE stat blcok
Data
- [breaking] Switched from mongoose to dynamoose, dynamoDb support
- [breaking] Modified the homebrew model to add global secondary index
- [breaking] Changed homebrew.text to 'B' (buffer) data type
- [breaking] Modified the save/get functions to compress/decompress with LZUTF8
Security
- Created .env and .env.example files to keep AWS credentials out of git
Dependencies
- Upgraded packages cryptiles and deepextend for sevfix
- Added dynamoose package
- Added dotenv package

