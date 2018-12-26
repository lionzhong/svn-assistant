#!/usr/bin/env node

const program = require('commander');
const common = require("../src/cmds/common");

program
    .version('0.1.2', '-V, --version')
    .option('-i, --init', 'init project')
    .option('-c, --config <value>', 'config file path')
    .option('-d, --deploy', 'deploy (main command)')
    .option('-u, --update', 'update (main command)')
    .option('-k, --cleanup', 'cleanup (main command)')
    .option('-m, --module [value]', 'module name([ string ])')
    .option('-t, --trunk [value]', 'trunk platform name([string])')
    .option('-b, --branch [value]', 'The branch platform name([string]) will be operated!')
    .option('-v, --bversion <value>', 'The branch version(<string>) will be operated!')
    .option('-r, --region <value>', 'The region(<string>) will be operated!');

// 必须在.parse()之前，因为node的emit()是即时的
program.on('--help', function () {
    console.log('  还未写完:');
    console.log('');
    console.log('    ');
    console.log('');
});

program.parse(process.argv);

if (program.init) {
    common.init(true);
} else if (program.deploy && !program.update && !program.cleanup) {
    const deploy = require("../src/cmds/deploy");
    deploy(program);
} else if (!program.deploy && program.update && !program.cleanup) {
    const update = require("../src/cmds/update");
    update(program);
} else if (!program.deploy && !program.update && program.cleanup) {
    const cleanup = require("../src/cmds/cleanup");
    cleanup(program);
} else {
    common.noneMainCmd(program);
}
