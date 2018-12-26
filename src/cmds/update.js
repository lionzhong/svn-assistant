const common = require("./common");

const onlyExist = common.onlyExist;
const getData   = common.getData;
const baseCmd   = common.baseCmd;
const onlyTrue  = common.onlyTrue;
const init      = common.init;

const doUpdate = async (program) => {
    await init();
    
    const update  = require("../update");

    if (onlyExist("module", baseCmd.type)) {
        if (program.module === true) {
            update.allModules();
        } else {
            const data = getData(program, "module");

            update.modules(data);
        }
    } else if (onlyExist("trunk", baseCmd.type)) {
        if (program.trunk === true) {
            update.allTrunks();
        } else {
            const data = getData(program, "trunk");

            update.platforms(data, { trunk: true, tipType: "Trunk" });
        }
    } else if (onlyExist("branch", baseCmd.type)) {
        if (onlyTrue(program, "branch", ["branch", "version"])) {
            update.allBranches();
        } else {
            const data = getData(program, "branch");

            update.platforms(data, { branch: true, tipType: "Branch", isBranches: true });
        }
    } else {
        update.all();
    }
};

module.exports = doUpdate;
