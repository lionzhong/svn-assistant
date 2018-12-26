const log  = require("../log");
const util = require("../util");
const path = require("path");
const fs   = require("fs");

const onlyTrue = (program, sepc = undefined, targets = []) => {
    const arr = targets.filter(key => key !== sepc);

    let result = false;

    for (let i = 0; i < arr.length; i++) {
        if (program[arr[i]]) {
            result = true;
            break;
        }
    };

    return program[sepc] === true && !result;
};

const onlyExist = (program, sepc = undefined, targets = []) => {
    const arr = targets.filter(key => key !== sepc);

    let result = false;

    for (let i = 0; i < arr.length; i++) {
        if (program[arr[i]]) {
            result = true;
            break;
        }
    };

    return program[sepc] && !result;
};

const allNotExist = (program, keys = []) => {
    let result = true;

    for (let i = 0; i < keys.length; i++) {
        if (program[keys[i]]) {
            result = false;
            break;
        }
    };

    return result;
};

const baseCmd = {
    "main": ["deploy", "update", "cleanup"],
    "type": ["module", "trunk", "branch"],
    "branchArg": ["version"]
};

const noneMainCmd = program => {
    if (allNotExist(program, baseCmd.main)) {
        log.red("无主指令，至少使用一个主指令! --deplopy | --update | --cleanup", true);
        process.exit();
    } else {
        log.red("一次只能使用一个主指令! --deplopy | --update | --cleanup", true);
        process.exit();
    }
};

const init = async (tip = false) => {
    const program = require('commander');
    program.parse(process.argv);

    const configPath = program.config ? path.normalize(program.config) : path.join(process.cwd(), "config.json");
    
    let config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : {};

    if (Object.keys(config).length === 0) {
        const defaultConfig = require("../../config");

        await util.output.config(defaultConfig);
        config = Object.assign({}, JSON.parse(fs.readFileSync(configPath)));
    }

    await util.folder.createConfig(tip);

    if (tip) {
        log.done(`初始化完毕`);
    }
};

// rule遍历数据源筛选数据时的规则回调，此回调只能返回布尔值
const getData = (program, type = false) => {
    const project = require("../project");
    
    const parseData = (type = false, rule = () => true) => {
        if (!type) { return []; }

        switch (type) {

            case "module":
                if (onlyExist(program, "module", baseCmd.type)) {
                    return program.module === true ? project.svn.checkout.modules : project.svn.checkout.modules.filter(module => rule(module));
                }
                break;
            case "trunk":
                if (onlyExist(program, "trunk", baseCmd.type)) {
                    return program.trunk === true ? project.svn.checkout.trunk : project.svn.checkout.trunk.filter(platform => rule(platform));
                }
                break;
            case "branch":
                if (onlyExist(program, "branch", baseCmd.type)) {
                    return program.branch === true ? project.svn.checkout.branches : project.svn.checkout.branches.filter(platform => rule(platform));
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

                    flag = module.name === program.module;

                    if (flag) {
                        flag = program.region ? program.region === module.region : true;
                    }

                    return flag;
                };
                break;
            case "trunk":
                rule = platform => {
                    let flag = true;

                    const keys = ["trunk", "region"];

                    if (onlyExist(program, "trunk", keys)) {
                        flag = program.branch === platform.name; 
                    } else if (flag && onlyExist("region", keys)) {
                        flag = program.region === platform.region; 
                    } else {
                        if (flag) {
                            flag = program.trunk === platform.name;
                        }

                        if (flag) {
                            flag = program.region ? program.region === platform.region : !platform.region;
                        }
                    }

                    return flag;
                };
                break;
            case "branch":

                rule = platform => {
                    let flag = true;

                    const keys = ["branch", "bversion"];
                    
                    if (onlyExist(program, "branch", keys)) {
                        flag = program.branch === platform.name;
                    } else if (flag && onlyExist(program, "bversion", keys)) {
                        flag = program.bversion === platform.version; 
                    } else if (flag && onlyExist(program, "region", keys)) {
                        flag = program.region === platform.region; 
                    } else {
                        const except = key => {
                            if (flag && key !== "branch") {
                                flag = program.branch === platform.name;
                            }
                            if (flag && key !== "bversion") {
                                flag = program.bversion === platform.version;
                            }
                        };

                        if (flag && !program.branch) {
                            except("branch");
                        } else if (flag && !program.bversion) {
                            except("version");
                        } else if (flag) {
                            except("");
                        }
                        
                        if (flag) {
                            flag = program.region ? program.region === platform.region : !platform.region;
                        } 
                    }

                    return flag;
                };
                break;
        
        }

        if (onlyExist(program, type, baseCmd.type)) {
            arr = parseData(type, rule);
        }

        return arr;
    })();

    return data;
};

module.exports = {
    onlyTrue: onlyTrue,
    onlyExist: onlyExist,
    allNotExist: allNotExist,
    baseCmd: baseCmd,
    init: init,
    getData: getData,
    noneMainCmd: noneMainCmd
};
