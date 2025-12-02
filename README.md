# Overview

This is Group 20's PostgreSQL app, OnTrak, that uses React, NodeJS, and PostgreSQL to function, created for Fall 2025 CSE 412 - Database Management.

Group Members: Ripken Chong, Chris Chou

# Installation and Setup

1. Download the source code, and unzip to a directory.

2. Navigate to the root directory (should be CSE-412-OnTrak)

3. Download/Install the following dependencies within the root directory: npm, NodeJS, Express, cors, pg, jsonwebtoken, bcryptjs
    a. Once npm is installed, type npm -v to verify that it is installed correctly
    b. Once done, you can add Express, and the other libraries with: npm install express cors pg jsonwebtoken bcryptjs

4. Navigate to the child directory client (cd client, should be CSE-412-OnTrak/client)

5. Download/Install the following dependencies within the client directory: react, react-dom-router, axios, chart.js, react-chart-js2
    a. You can do this by typing: npm install react react-dom-router axios chart.js react-chart-js2

6. Copy and rename the db.js.example to db.js, and fill it out with your local machine's database information
    a. This applies to ONLY the OnTrak database mentioned in the report instructions.

7. To run this program, open 2 commmand terminals. One should be open to the root directory, and the other the client directory.
    a. In the root directory terminal, run "npm start"
    b. In the client directory terminal, run "node server.js"
