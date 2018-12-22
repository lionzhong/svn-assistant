
const log     = require("./modules/log");
const project = require("./modules/project");
const deploy  = require("./modules/deploy");
const runArg  = require("optimist").argv;

const platformInit = (op = {}) => {

    const key = (() => {

        let result = {};

        if (op.trunk) {

            result = Object.assign(result, {
                inProjet: "trunk",
                inArg: "trunk"
            });

        } else if (op.branch) {

            result = Object.assign(result, {
                inProjet: "branches",
                inArg: "branch"
            });

        }

        return result;

    })();

    const data = runArg[key.inArg] === true ? project.svn.checkout[key.inProjet] : project.svn.checkout[key.inProjet].filter(platform => {

        let flag = platform.name === runArg[key.inArg];

        if (flag && key.inArg === "branch") {

            flag = platform.version === runArg.version;

        }

        if (flag) {

            flag = runArg.region ? platform.region === runArg.region : !platform.region;

        }

        return flag;
        
    });

    if (data.length <= 0) {

        if (runArg[key.inArg] === true) {

            log.red(`配置中不存在任何${key.inArg}`);

        } else {

            log.red(`配置中不存在 ${key.inArg} ${runArg[key.inArg]} ${runArg.region ? runArg.region : ""}`);

        }

        process.exit();

    }

    (async () => {

        // 如果参数中要求重新建立平台内软连接，则不会再deploy平台
        if (!runArg.link) {

            await deploy.platforms(data, {
                tipType: "Trunk"
            });
            
        }

        deploy.symlinkPlatform(data);

    })();

};

const init = () => {

    if (!runArg) {

        deploy.all();

    } else {
        
        // 只需要部署模块
        if (runArg.modules === true && !runArg.trunk && !runArg.branch && !runArg.branches) {

            deploy.allModules();

        } else if (runArg.trunk) {

            if (runArg.trunk === true) {

                deploy.allTrunks();

            } else {

                platformInit({ trunk: true });

            }
            
        } else if (runArg.branch) {

            if (!runArg.version) {

                log.red(`操作分支时，必须带上版本号参数，例如: --version=1.0.0.0`, true);

            } else {

                platformInit({ branch: true });

            }

        } else if (runArg.branches) {

            deploy.allBranches();

        }

    }

};

init();
