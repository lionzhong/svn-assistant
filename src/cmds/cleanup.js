const common = require("./common");

const onlyExist = common.onlyExist;
const getData   = common.getData;
const baseCmd   = common.baseCmd;
const onlyTrue  = common.onlyTrue;
const init      = common.init;

const doCleanup = async (program) => {
    await init();
    
    const cleanup = require("../cleanup");

    if (onlyExist(program, "module", baseCmd.type)) {
        if (program.module === true) {
            cleanup.allModules();
        } else {
            const data = getData(program, "module");

            cleanup.modules(data);
        }
    } else if (onlyExist(program, "trunk", baseCmd.type)) {
        if (program.trunk === true) {
            cleanup.allTrunks();
        } else {
            const data = getData(program, "trunk");

            cleanup.platforms(data, { trunk: true, tipType: "Trunk" });
        }
    } else if (onlyExist(program, "branch", baseCmd.type)) {
        if (onlyTrue(program, "branch", ["branch", "version"])) {
            cleanup.allBranches();
        } else {
            const data = getData(program, "branch");

            cleanup.platforms(data, { branch: true, tipType: "Branch", isBranches: true });
        }
    } else {
        cleanup.all();
    }
};

module.exports = doCleanup;
