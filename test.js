const log     = require("./modules/log");
const project = require("./modules/project");
const deploy  = require("./modules/deploy");
const update  = require("./modules/update");
const runArg  = require("optimist").argv;
const path    = require("path");
const svnUltimate = require('node-svn-ultimate');

// const data = project.svn.checkout.modules;

// update.modules(data);

update.allBranches();
