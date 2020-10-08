# Comicgen - Architecture

## Configuration files:
 - **.editorconfig** - Code editor should have editorconfig plugin installed to standardise the code.
 - **.eslintrc.js** - This will help to validate the code to ensure all js scripts are enforced with rules that are specified in the file( eg: no-semicolon at the end of each line, restricted to single quotes etc..) and eslint ignore list of files which are below:
	1. node_modules/
	2. dist/
	3. test/tape.js
 - **.htmllintrc** - This will help you to validate html files.
 - **.gitlab-ci.yml** - This will help to check the configuration while deployment.
 - **LICENSE** - Comicgen released under MIT License. this is to store the license agreement.
 - **eula.pdf** - end user license agreement for comicgen power bi plugin.
 - **package.json** - Configuration file for npm packages and dependencies. 
 - **rollup.config.js** - This file is used to compress the comicgen package which will compress the 'src/comicgen.js' to 'dist/comicgen.min.js' by using the plugin 					terser.
 - **Readme.md** - This file contains the description of comicgen(content below the code files in https://github.com/gramener/comicgen)

## Folders:
 - **docs** - This is to store images of static content that are used to show under Readme.md file.
 - **svg** - This folder contains all the images that are related to comic charecters. All of the comic charecters are of the group of svg images that are 							combinig together and make a character. Not all the characters are having the same combination of svg images for example. aryan has emation, pose. But zoozoo has 				body and face. so based on the character we can find different combination of svg's. 
 - **src** - Contains the script files where all the functionalities of comicgen resides. 
 - **test** - This folder contains all the test scripts which will run by the package.json file before pushing into server.
 - **scripts** – There are two files under this folder listed below
	1. ***png.js*** - Puppeteer code which will open every svg file and capture the screenshot of comic character and save it as png. It is used for the 'ext' dropdown in 					the comic dashbord.
	2. ***compress.sh*** - This is used to compress all the svg and png files except three folders chinni, panda and zoozoo. These three are different by giving the user to 				capture the expression within a range insted of a fixed comic expression.

 - **src** - Contains the script files where all the functionalities of comicgen resides. 
	1. ***src/characters.json*** - This file has comicgen character configurations. developer can edit this file to add new characters.
		- **defaults** - There are some default options which can be used for comics with no options provided
		- **namemap** - Comicgen.namemap maps the character name to the format. And these namemaps can be changed / extended. formats block will provide details of each 						map.
		- **format** - Defines the format for characters. Each format has:",
			- *width*: default width of the SVG container",
			- *height*: default height of the SVG container",
			- *dirs*: list of directory tree attrs. For example, ['angle'] means", that the file is under svg/$name/$angle/...",
			- *files*: dict of {attr: filespec}. If the attr is set, draw the image", filespec is a dict of:",
			- *file*: file template, where $<\var> is replaced by the value of var='...'"(example path: for ‘emotionpose’ map emotion file will be 									https://gramener.com/comicgen/svg/aryan/emotion/angry.svg),
			- *width*: actual width of the SVG image",
			- *height*: actual height of the SVG image",
			- *x*: x-offset of the SVG image",
			- *y*: y-offset of the SVG image"

