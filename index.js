const util    = require("./modules/util");
const log     = require("./modules/log");
const project = require("./modules/project");
const deploy  = require("./modules/deploy");
const runArg  = require("optimist").argv;

const createFolders = async () => {

    await util.folder.createConfig(project);

};

let init = () => {

    if (!runArg) {

        deploy.all();

    } else {

        if (runArg.trunk) {

            let data = runArg.trunk === "all" ? project.svn.checkout.trunk : project.svn.checkout.trunk.filter(platform => {

                let flag = platform.name === runArg.trunk;

                if (flag && runArg.region) {

                    flag = platform.region === runArg.region;

                }

                return flag;
                
            });

            if (data.length <= 0) {

                if (runArg.trunk === "all") {

                    log.red(`配置中不存在任何trunk`);

                } else {

                    log.red(`配置中不存在 trunk ${runArg.trunk} ${runArg.region ? runArg.region : ""}`);

                }

                process.exit();

            }

            deploy.platforms(data, {
                tipType: "Trunk"
            });

        } else if (runArg.branche) {

        }

    }

};

createFolders().then(() => {

    init();

});
