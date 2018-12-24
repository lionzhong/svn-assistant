const log     = require("./log");
const project = require("./project");
const deploy  = require("./deploy");
const update  = require("./update");
const cleanup = require("./cleanup");
const runArg  = require("optimist").argv;

const onlyTrue = (sepc = undefined, targets = []) => {
    const arr = targets.filter(key => key !== sepc);

    let result = false;

    for (let i = 0; i < arr.length; i++) {
        if (runArg[arr[i]]) {
            result = true;
            break;
        }
    };

    return runArg[sepc] === true && !result;
};

const onlyExist = (sepc = undefined, targets = []) => {
    const arr = targets.filter(key => key !== sepc);

    let result = false;

    for (let i = 0; i < arr.length; i++) {
        if (runArg[arr[i]]) {
            result = true;
            break;
        }
    };

    return runArg[sepc] && !result;
};

const allNotExist = (keys = []) => {
    let result = true;

    for (let i = 0; i < keys.length; i++) {
        if (runArg[keys[i]]) {
            result = false;
            break;
        }
    };

    return result;
};

const command = () => {
    const baseCmd = {
        "main": ["deploy", "update", "cleanup"],
        "type": ["module", "trunk", "branch"],
        "branchArg": ["version"]
    };

    // rule遍历数据源筛选数据时的规则回调，此回调只能返回布尔值
    const getData = (type = false) => {
        const parseData = (type = false, rule = () => true) => {
            if (!type) { return []; }

            switch (type) {

                case "module":
                    if (onlyExist("module", baseCmd.type)) {
                        return runArg.module === true ? project.svn.checkout.modules : project.svn.checkout.modules.filter(module => rule(module));
                    }
                    break;
                case "trunk":
                    if (onlyExist("trunk", baseCmd.type)) {
                        return runArg.trunk === true ? project.svn.checkout.trunk : project.svn.checkout.trunk.filter(platform => rule(platform));
                    }
                    break;
                case "branch":
                    if (onlyExist("branch", baseCmd.type)) {
                        return runArg.branch === true ? project.svn.checkout.branches : project.svn.checkout.branches.filter(platform => rule(platform));
                    }
                    break;
            
            }
        };

        const data = (() => {
            let arr = [];
            let rule = () => {};

            switch (type) {

                case "module":
                    rule = module => {
                        let flag = true;
    
                        flag = runArg.region ? runArg.region === module.region : true;
    
                        return flag;
                    };
                    break;
                case "trunk":
                    rule = platform => {
                        let flag = true;
    
                        const keys = ["trunk", "region"];

                        if (onlyExist("trunk", keys)) {
                            flag = runArg.branch === platform.name; 
                        } else if (flag && onlyExist("region", keys)) {
                            flag = runArg.region === platform.region; 
                        } else {
                            if (flag) {
                                flag = runArg.trunk === platform.name;
                            }

                            if (flag) {
                                flag = runArg.region ? runArg.region === platform.region : !platform.region;
                            }
                        }
    
                        return flag;
                    };
                    break;
                case "branch":

                    rule = platform => {
                        let flag = true;

                        const keys = ["branch", "version"];
                        
                        if (onlyExist("branch", keys)) {
                            flag = runArg.branch === platform.name;
                        } else if (flag && onlyExist("version", keys)) {
                            flag = runArg.version === platform.version; 
                        } else if (flag && onlyExist("region", keys)) {
                            flag = runArg.region === platform.region; 
                        } else {
                            const except = key => {
                                if (flag && key !== "branch") {
                                    flag = runArg.branch === platform.name;
                                }
                                if (flag && key !== "version") {
                                    flag = runArg.version === platform.version;
                                }
                            };

                            if (flag && !runArg.branch) {
                                except("branch");
                            } else if (flag && !runArg.version) {
                                except("version");
                            } else if (flag) {
                                except("");
                            }
                            
                            if (flag) {
                                flag = runArg.region ? runArg.region === platform.region : !platform.region;
                            } 
                        }
    
                        return flag;
                    };
                    break;
            
            }

            if (onlyExist(type, baseCmd.type)) {
                arr = parseData(type, rule);
            }

            return arr;
        })();

        return data;
    };

    const noneMainCmd = () => {
        if (allNotExist(baseCmd.main)) {
            log.red("无主指令，至少使用一个主指令（deplopy|update|cleanup）！", true);
            process.exit();
        }
    };

    const doDeploy = () => {
        if (onlyExist("deploy", baseCmd.main)) {
            if (onlyExist("module", baseCmd.type)) {
                if (runArg.module === true) {
                    deploy.allModules();
                } else {
                    const data = getData("module");

                    deploy.modules(data, project.rebuild);
                }
            } else if (onlyExist("trunk", baseCmd.type)) {
                if (runArg.trunk === true) {
                    deploy.allTrunks();
                } else {
                    const data = getData("trunk");

                    (async () => {
                        await deploy.platforms(data, { trunk: true, tipType: "Trunk" });

                        deploy.symlinkPlatform(data);
                    })();
                }
            } else if (onlyExist("branch", baseCmd.type)) {
                if (onlyTrue("branch", ["branch", "version"])) {
                    deploy.allBranches();
                } else {
                    const data = getData("branch");

                    (async () => {
                        await deploy.platforms(data, { trunk: true, tipType: "Branch", isBranches: true });

                        deploy.symlinkPlatform(data);
                    })();
                }
            } else {
                deploy.all();
            }
        } else {
            noneMainCmd();
        }
    };

    const doUpdate = () => {
        if (onlyExist("update", baseCmd.main)) {
            if (onlyExist("module", baseCmd.type)) {
                if (runArg.module === true) {
                    update.allModules();
                } else {
                    const data = getData("module");

                    update.modules(data);
                }
            } else if (onlyExist("trunk", baseCmd.type)) {
                if (runArg.trunk === true) {
                    update.allTrunks();
                } else {
                    const data = getData("trunk");

                    update.platforms(data, { trunk: true, tipType: "Trunk" });
                }
            } else if (onlyExist("branch", baseCmd.type)) {
                if (onlyTrue("branch", ["branch", "version"])) {
                    update.allBranches();
                } else {
                    const data = getData("branch");

                    update.platforms(data, { branch: true, tipType: "Branch", isBranches: true });
                }
            } else {
                update.all();
            }
        } else {
            noneMainCmd();
        }
    };

    const doCleanup = () => {
        if (onlyExist("cleanup", baseCmd.main)) {
            if (onlyExist("module", baseCmd.type)) {
                if (runArg.module === true) {
                    cleanup.allModules();
                } else {
                    const data = getData("module");

                    cleanup.modules(data);
                }
            } else if (onlyExist("trunk", baseCmd.type)) {
                if (runArg.trunk === true) {
                    cleanup.allTrunks();
                } else {
                    const data = getData("trunk");

                    cleanup.platforms(data, { trunk: true, tipType: "Trunk" });
                }
            } else if (onlyExist("branch", baseCmd.type)) {
                if (onlyTrue("branch", ["branch", "version"])) {
                    cleanup.allBranches();
                } else {
                    const data = getData("branch");

                    cleanup.platforms(data, { branch: true, tipType: "Branch", isBranches: true });
                }
            } else {
                cleanup.all();
            }
        } else {
            noneMainCmd();
        }
    };

    const init = () => {
        doDeploy();
        doUpdate();
        doCleanup();
    };

    return init;
};

module.exports = command();
