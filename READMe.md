# Paint Scraper

A simple node script to parse the hex codes, color names, and more from Rustoleum Painter's Touch 2x spray paint product pages on Home Depot's website.


# Usage
Note: If you just need the data, see `data.json`

## Running Locally
**Prerequisites**
You must have [node](https://nodejs.org/en/) installed.

** Install and Run**
* Check out repository
* Run `npm install`
* Edit the index file to add the urls of colors. Currently only works with the 6 pack urls.
* Run `node index.js`
* See Results in data.json file.

# Disclaimer
I am not affiliated with Rustoleum nor Home Depot. Usage of this utility may violate the terms of service of the Home Depot website. Use at your own risk.  

# Contributing
The data.json file is not currently an exhaustive list of Rustoleum 2x colors available from Home Depot. You can help add to it, but running this script on your favorite colors and adding them to the index. Feel free to make a PR against the respository and I'll merge.
