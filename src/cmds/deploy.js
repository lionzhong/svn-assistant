const common = require("./common");

const onlyExist = common.onlyExist;
const getData   = common.getData;
const baseCmd   = common.baseCmd;
const onlyTrue  = common.onlyTrue;
const init      = common.init;

const doDeploy = async (program) => {
    await init();

    const project = require("../project");
    const deploy  = require("../deploy");

    if (onlyExist(program, "module", baseCmd.type)) {
        if (program.module === true) {
            deploy.allModules();
        } else {
            const data = getData(program, "module");

            deploy.modules(data, project.rebuild);
        }
    } else if (onlyExist(program, "trunk", baseCmd.type)) {
        if (program.trunk === true) {
            deploy.allTrunks();
        } else {
            const data = getData(program, "trunk");

            (async () => {
                await deploy.platforms(data, { trunk: true, tipType: "Trunk" });

                deploy.symlinkPlatform(data);
            })();
        }
    } else if (onlyExist(program, "branch", baseCmd.type)) {
        if (onlyTrue(program, "branch", ["branch", "version"])) {
            deploy.allBranches();
        } else {
            const data = getData(program, "branch");

            (async () => {
                await deploy.platforms(data, { trunk: true, tipType: "Branch", isBranches: true });

                deploy.symlinkPlatform(data);
            })();
        }
    } else {
        deploy.all();
    }
};

module.exports = doDeploy;
