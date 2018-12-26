/**
 * check 方法说明
 * @param {Object}  - op 可配置选项
 * @param {String}  - op.tipStr 提示语
 * @param {Object}  - op.rebuild 重建配置
 * @param {Boolean} - op.rebuild.link 重建symlink
 * @param {Boolean} - op.rebuild.folder 重建folder
 * */

const fs          = require('fs');
const svnUltimate = require('node-svn-ultimate');
const rimraf      = require('rimraf');
const _           = require('lodash');
const util        = require('./util');
const log         = require('./log');
const symlink     = require('./symlink');
const project     = require("./project");

const check = (set, targetFolder, op) => {
    const method = {
        rebuild: (resolve, reject) => {
            rimraf(targetFolder, err => {
                if (!err) {
                    method.doCheck(resolve, reject);
                } else {
                    console.log(err, '\n', `${set.url} ${targetFolder}`);
                    log.red(`${_.capitalize(op.tipStr ? op.tipStr : set.name)} checkout failed!`, true);
                    console.log('\n');
                    reject();
                }
            });
        },

        doCheck: (resolve, reject) => {
            svnUltimate.commands.checkout(`${set.url}`, `${targetFolder}`, util.getSvnParams(), err => {
                if (!err) {
                    log.time(`${set.url} ${targetFolder}`);
                    log.green(`${_.capitalize(op.tipStr ? op.tipStr : set.name)} checkout complete!`, true);
                    resolve();
                } else {
                    log.time(err, '\n', `${set.url} ${targetFolder}`);
                    log.red(`${_.capitalize(op.tipStr ? op.tipStr : set.name)} checkout failed!`, true);
                    reject();
                }

                console.log('\n');
            });
        }
    };

    return new Promise((resolve, reject) => {
        const rebuild = op.rebuild.folder === true;

        if (fs.existsSync(targetFolder)) {
            if (rebuild) {
                log.time("rebuild folder：enable");
            } else {
                log.time("rebuild folder：disable");
                log.time(`${targetFolder} already exist, ignore checkout`, true);
                console.log("\n");
                resolve();
                return;
            }

            method.rebuild(resolve, reject);
        } else {
            method.doCheck(resolve, reject);
        }
    });
};

const syncLoopCheck = (set, loopSet, op) => {
    op = !op ? {} : op;

    let tipStr = "";

    switch (Object.prototype.toString.call(op.tipStr)) {

        case "[object Function]":
            tipStr = op.tipStr(set, loopSet, op);
            break;
        default:
            tipStr = op.tipStr;
            break;

    }

    log.blue(`${_.capitalize(op.tipStr ? tipStr : set.name)} start checkout...`, true);

    let checkOp = op.mode === "platform" ? Object.assign({}, op, {
        rebuild: set.rebuild
    }, {
        tipStr: tipStr
    }) : Object.assign({}, op, {
        tipStr: tipStr
    });

    check(set, set.folder, checkOp).finally(() => {
        loopSet.count += 1;

        if (loopSet.count < loopSet.max) {
            syncLoopCheck(loopSet.data[loopSet.count], loopSet, op);
        } else {
            if (Object.prototype.toString.call(op.callback) === "[object Object]") {
                if (Object.prototype.toString.call(op.callback.done) === "[object Function]") {
                    op.callback.done();
                }
            }
        }
    });
};

const deploy = () => {
    /**
     * @param {object} op - 可配置选项
     * @param {array}  op.modules - 模块数据
     * @param {string} op.targetFolder - checkout目录
     * @param {object} op.rebuild - 是否打开重建配置
     * */
    
    const modules = (data, rebuild) => {
        return new Promise((resolve, reject) => {
            let defaultSet = {
                count: 0,
                data: [],
                max: 0
            };

            if (!Array.isArray(data) || data.length <= 0) {
                log.warn("No modules data need to deploy!");
                return;
            }

            let loopSet = Object.assign({}, defaultSet, {
                data: data,
                max: data.length
            });

            syncLoopCheck(loopSet.data[0], loopSet, {
                rebuild: rebuild,
                tipStr: (set, loopSet) => {
                    if (rebuild.folder === true) {
                        return `Module ${loopSet.data[loopSet.count].name} rebuild`;
                    } else {
                        return `Module ${loopSet.data[loopSet.count].name}`;
                    }
                },
                callback: {
                    done: () => resolve()
                }
            });
        });
    };

    const allModules = () => {
        let promise = modules(project.svn.checkout.modules, project.rebuild);

        promise.finally(() => log.done("Modules deploy complete!"));

        return promise;
    };

    const platforms = (data = [], op = {}) => {
        if (!Array.isArray(data) || data.length <= 0) {
            log.warn("No trunk data need to deploy!");
            return;
        }

        const defaultSet = {
            count: 0,
            data: [],
            max: 0,
            promises: []
        };

        const parsedData = {
            baseOnSaomai: data.filter(set => set.baseOnSaomai === true),
            normal: data.filter(set => !set.baseOnSaomai)
        };

        // 部署saomai
        const deploySaomai = (dataSource, op) => {
            let hasBootstrap = dataSource.filter(obj => Array.isArray(obj.bootstrap) && obj.bootstrap.length > 0);

            if (hasBootstrap.length <= 0) {
                if (util.getDataType(op, "object") && util.getDataType(op.done, "function")) {
                    op.done();
                }
                return;
            }

            let loopSets = [];

            hasBootstrap.forEach(obj => {
                // 检测是否需要配置prapiroon
                if (Object.prototype.toString.call(obj.prapiroon) === "[object Object]" && Object.keys(obj.prapiroon).length > 0) {
                    obj.bootstrap = obj.bootstrap.concat(obj.prapiroon);
                }

                let data = {
                    data: obj.bootstrap,
                    max: obj.bootstrap.length,
                    tipType: `${op.tipType}`,
                    tipStr: `${obj.name}`,
                    rebuild: obj.rebuild.folder,
                    platform: obj.name
                };

                if (obj.version) {
                    data.version = obj.version;
                }

                if (obj.region) {
                    data.region = obj.region;
                }

                loopSets.push(Object.assign({}, defaultSet, data));
            });

            // 提示信息callback
            let getTipStr = (set, loopSet) => {
                const region  = loopSet.region ? ` ${loopSet.region}` : "";
                const version = loopSet.version ? ` ${loopSet.version}` : "";

                return `${_.capitalize(loopSet.platform)} ${op.tipType.toLowerCase()}${region}${version}'s ${loopSet.data[loopSet.count].name}`;
            };

            let count = 0;
            let countMax = loopSets.length;

            const checkBootstrap = () => {
                const promise = () => {
                    return new Promise((resolve, reject) => {
                        let set = loopSets[count];

                        if (fs.existsSync(loopSets[count].data[0].folder)) {
                            if (set.rebuild === true) {
                                log.time("rebuild folder：enable");
                                rimraf(set.data[0].folder, err => {
                                    if (err) {
                                        console.log(err, '\n', `${set.bootstrap[0].url} ${set.bootstrap[0].folder}`);
                                        resolve();
                                    } else {
                                        syncLoopCheck(set.data[0], set, {
                                            rebuild: {
                                                folder: set.rebuild
                                            },
                                            tipStr: getTipStr,
                                            callback: {
                                                done: () => resolve()
                                            }
                                        });
                                    }
                                });
                            } else {
                                const source  = hasBootstrap[count];
                                const region  = source.region ? ` ${source.region}` : "";
                                const version = source.version ? ` ${source.version}` : "";

                                log.blue(`${set.tipType} ${(set.tipStr ? set.tipStr : set.platform)}${region}${version} start checkout...`, true);
                                log.time("rebuild folder：disable");
                                log.time(`${set.data[0].folder} already exist, ignore checkout`);
                                console.log("\n");
                                resolve();
                            }
                        } else {
                            syncLoopCheck(set.data[0], set, {
                                rebuild: {
                                    folder: set.rebuild
                                },
                                tipStr: getTipStr,
                                callback: {
                                    done: () => resolve()
                                }
                            });
                        }
                    });
                };

                promise().finally(() => {
                    count += 1;

                    if (count < countMax) {
                        checkBootstrap();
                    } else {
                        if (util.getDataType(op, "object") && util.getDataType(op.done, "function")) {
                            op.done();
                        }
                    }
                });
            };

            checkBootstrap();
        };

        // 部署普通平台
        const deployNormal = () => {
            const deployPlatform = loopSet => {
                return new Promise((resolve) => syncLoopCheck(loopSet.data[0], loopSet, {
                    mode: "platform",
                    callback: {
                        done: () => resolve()
                    },
                    tipStr: set => {
                        const region = set.region ? ` ${set.region}` : "";
                        const version = set.version ? ` ${set.version}` : "";

                        if (set.rebuild.folder === true) {
                            return `${op.tipType} ${set.name}${region}${version} rebuild`;
                        } else {
                            return `${op.tipType} ${set.name}${region}${version}`;
                        }
                    }
                }));
            };

            const deployBootstrap = (loopSet, op = {}) => {
                return new Promise((resolve) => deploySaomai(parsedData.normal, {
                    done: () => resolve(),
                    tipType: op.tipType
                }));
            };

            const deployDone = async () => {
                let loopSet = {};

                loopSet = Object.assign({}, defaultSet, op);

                if (Array.isArray(parsedData.normal) && parsedData.normal.length <= 0) {
                    return;
                }

                loopSet = Object.assign({}, loopSet, {
                    data: parsedData.normal,
                    max: parsedData.normal.length
                });

                await deployPlatform(loopSet);
                await deployBootstrap(loopSet, op);
            };

            return deployDone();
        };

        // 部署基于saomai的平台
        const deployBaseOnSaomai = () => {
            const deployBootstrap = (loopSet, op) => {
                return new Promise((resolve, reject) => deploySaomai(parsedData.baseOnSaomai, {
                    done: () => resolve(),
                    tipType: op.tipType,
                    baseOnSaomai: true
                }));
            };

            const deployPlatform = loopSet => {
                loopSet = Object.assign({}, loopSet, {
                    data: parsedData.baseOnSaomai,
                    max: parsedData.baseOnSaomai.length
                });

                return new Promise((resolve, reject) => syncLoopCheck(loopSet.data[0], loopSet, {
                    mode: "platform",
                    callback: {
                        done: () => resolve()
                    },
                    tipStr: set => {
                        const region = set.region ? ` ${set.region}` : "";

                        if (set.rebuild.folder === true) {
                            return `${op.tipType} ${set.name}${region} rebuild`;
                        } else {
                            return `${op.tipType} ${set.name}${region}`;
                        }
                    }
                }));
            };

            const deployDone = async () => {
                let loopSet = {};

                if (Object.prototype.toString.call(op) === "[object Object]") {
                    loopSet = Object.assign({}, defaultSet, op);
                }

                if (Array.isArray(parsedData.baseOnSaomai) && parsedData.baseOnSaomai.length <= 0) {
                    return;
                }

                await deployBootstrap(loopSet, op);
                await deployPlatform(loopSet);
            };

            return deployDone();
        };

        // 部署分支平台中需要直接check的模块
        const deployModulesInBranch = (data = [], op = {}) => {
            const checkouts = [];

            // 筛出分支中需要部署的模块
            data.forEach(set => {
                const modules = set.modules.filter(self => self.checkout === true);

                if (modules.length > 0) {
                    checkouts.push(Object.assign({}, set, { "modules": modules }));
                }
            });

            if (checkouts.length > 0) {
                return new Promise((resolve, reject) => {
                    const loopSet = {
                        data: checkouts,
                        count: 0,
                        max: checkouts.length
                    };

                    const tip = () => {
                        let str = "Modules in platform";

                        str += ` ${loopSet.data[loopSet.count].name}`;
                        
                        if (util.getDataType(loopSet.data[loopSet.count].region, "string")) {
                            str += ` ${loopSet.data[loopSet.count].region}`;
                        }

                        if (op.isBranches === true) {
                            str += ` branch`;
                        } else if (op.isTrunk) {
                            str += ` trunk`;
                        }

                        return str;
                    };

                    const doCheck = (data = []) => {
                        log.blue(`${tip()} start checkout! \n`, true);

                        const promise = modules(data.modules, data.rebuild);

                        promise.then(() => log.time(`${tip()} deploy complete! \n`));
    
                        promise.finally(() => {
                            loopSet.count += 1;
    
                            if (loopSet.count < loopSet.max) {
                                doCheck(loopSet.data[loopSet.count]);
                            } else {
                                resolve();
                            }
                        });
                    };
    
                    doCheck(loopSet.data[0], loopSet);
                });
            }
        };

        const allDeployDone = async () => {
            await deployNormal();

            if (parsedData.baseOnSaomai.length > 0) {
                await deployBaseOnSaomai();
            }

            if (op.isBranches) {
                await deployModulesInBranch(data, op);
            }
        };

        const result = allDeployDone();

        result.finally(() => log.done(`${op.tipType} platforms deploy complete!`));

        return result;
    };

    // 建立symlink是以平台为单位
    const symlinkPlatform = (data = []) => {
        if (data.length <= 0) {
            return false;
        }

        const platforms = data.map(platform => {
            platform.modules = platform.modules.filter(module => module.checkout !== true);
            return platform;
        });

        if (platforms.length > 0) {
            platforms.forEach(platform => symlink.modules(platform.modules, platform.rebuild.link));
        }
    };

    const allTrunks = () => {
        const promise = platforms(project.svn.checkout.trunk, {
            tipType: "Trunk"
        });

        promise.then(() => {
            symlinkPlatform(project.svn.checkout.trunk);
        });

        return promise;
    };

    const branches = (data = []) => {
        const promise = platforms(data, {
            tipType: "Branch",
            isBranches: true
        });

        promise.then(() => {
            symlinkPlatform(data);
        });

        return promise;
    };

    const allBranches = () => {
        const promise = platforms(project.svn.checkout.branches, {
            tipType: "Branch",
            isBranches: true
        });

        promise.then(() => {
            symlinkPlatform(project.svn.checkout.branches);
        });

        return promise;
    };

    const all = () => {
        const doDeploy = async () => {
            log.done("Start deploy all modules, trunks, branches!");

            await allModules();
            await allTrunks();
            await allBranches();

            log.done("All deploy complete!");
        };

        return doDeploy();
    };

    return {
        modules: modules,
        check: check,
        platforms: platforms,
        branches: branches,
        symlinkPlatform: symlinkPlatform,
        allModules: allModules,
        allTrunks: allTrunks,
        allBranches: allBranches,
        all: all
    };
};

module.exports = deploy();
