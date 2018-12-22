const fs          = require('fs');
const svnUltimate = require('node-svn-ultimate');
const _           = require('lodash');
const util        = require('../modules/util');
const log         = require('../modules/log');
const project     = require("./project");

const update = () => {
    const defaultTipEnd = {
        success: "cleanup complete!",
        failed: "cleanup failed!"
    };

    const doUpdate = (module = false, op = {}) => {
        return new Promise((resolve, reject) => {
            let exit = false;

            if (module === false) {
                reject(new Error("Invaild module! \n"));
                exit = true;
            }

            if (!exit && module.link) {
                if (!fs.existsSync(module.link)) {
                    log.time(`${module.link} does not exist!`);
                    log.red(util.getDataType(op.failed, "function") ? `${op.failed(module)} \n\n` : `${defaultTipEnd.failed} \n\n`, true);
                    resolve();
                    exit = true;
                }
            } else if (!exit && !fs.existsSync(module.folder)) {
                log.red(`${module.link} does not exist, ${defaultTipEnd.failed} \n`, true);
                resolve();
                exit = true;
            }

            if (exit) {
                return false;
            }

            svnUltimate.commands.cleanup(module.folder, util.getSvnParams(), err => {
                if (!err) {
                    log.time(`${module.folder}`);
                    log.green(util.getDataType(op.success, "function") ? op.success(module) : defaultTipEnd.success, true);
                    resolve();
                } else {
                    console.error(err);
                    log.time(`${module.folder}`);
                    log.red(util.getDataType(op.failed, "function") ? op.failed(module) : defaultTipEnd.failed, true);

                    reject(err);
                }
    
                console.log('\n');
            });
        });
    };

    const loopUpdate = async (data = [], loopSet = {}, op = {}, resolve, reject) => {
        if (!Array.isArray(data) || data.length === 0) {
            log.red("Invlid source data!", true);
            reject();
            return false;
        }

        await doUpdate(data[loopSet.count], op);

        loopSet.count += 1;

        if (loopSet.count < loopSet.max) {
            loopUpdate(data, loopSet, op, resolve, reject);
        } else {
            resolve();
        }
    };

    const modules = (data, doneTip = true, op = {}) => {
        const promise = new Promise((resolve, reject) => {
            const getTip = (module, end) => {
                return `Module ${module.name}${util.getRegion(module, "", " ")} ${end}`;
            };

            loopUpdate(data, {
                count: 0,
                max: data.length
            }, {
                success: op.success ? op.success : (module) => getTip(module, defaultTipEnd.success),
                failed: op.failed ? op.failed : (module) => getTip(module, defaultTipEnd.failed)
            }, resolve, reject);
        });

        if (doneTip) {
            promise.then(() => log.done(`All modules ${defaultTipEnd.success}`));
        }

        return promise;
    };

    const platform = (data, op = {}) => {
        // update平台，包括基于saomai的bootstrap
        const updateBootstrap = () => {
            const updateSaomai = sourceData => {
                return new Promise((resolve, reject) => {
                    const getTip = (module, end) => {
                        const moduleName = module.name === "saomai" ? `${module.name}` : `saomai ${module.name}`;
    
                        return `${_.capitalize(data.name)} ${op.trunk ? "trunk" : "branch"}${util.getRegion(module, "", " ")}'s ${moduleName} ${end}`;
                    };
    
                    loopUpdate(sourceData, {
                        count: 0,
                        max: sourceData.length
                    }, {
                        success: (module) => getTip(module, `${defaultTipEnd.success}`),
                        failed: (module) => getTip(module, `${defaultTipEnd.failed}`)
                    }, resolve, () => reject);
                });
            };

            const upDatePrapiroon = sourceData => {
                return new Promise((resolve, reject) => {
                    const getTip = (module, end) => {
                        return `${_.capitalize(data.name)} ${op.trunk ? "trunk" : "branch"}'s ${module.name}${util.getRegion(module, "", " ")} ${end}`;
                    };
    
                    loopUpdate(sourceData, {
                        count: 0,
                        max: sourceData.length
                    }, {
                        success: (module) => getTip(module, `${defaultTipEnd.success}`),
                        failed: (module) => getTip(module, `${defaultTipEnd.failed}`)
                    }, resolve, () => reject);
                });
            };

            const doUp = async () => {
                if (data.bootstrap) {
                    await updateSaomai(data.bootstrap);
                }

                if (!data.baseOnSaomai && data.prapiroon) {
                    await upDatePrapiroon([data.prapiroon]);
                }
            };

            return doUp();
        };

        const updateModules = async (loopSet = {}) => {
            if (!data || !Array.isArray(data.modules) || data.modules.length === 0) {
                return false;
            }

            const getTip = (module, end) => {
                return `${_.capitalize(data.name)} ${op.trunk ? "trunk" : "branch"}'s ${module.name}${util.getRegion(data, "", " ")} ${end}`;
            };

            await modules(data.modules, false, {
                success: (module) => getTip(module, defaultTipEnd.success),
                failed: (module) => getTip(module, defaultTipEnd.failed)
            });

            loopSet += 1;

            if (loopSet.count < loopSet.max) {
                updateModules(data.modules, loopSet);
            }
        };

        const updatePlatform = async () => {
            const getTip = (platform, end) => {
                return `${_.capitalize(platform.name)}${util.getRegion(platform, "", " ")} ${op.trunk ? "trunk" : "branch"} ${end}`;
            };

            await doUpdate(data, Object.assign({}, op, { 
                success: (platform) => getTip(platform, defaultTipEnd.success),
                failed: (platform) => getTip(platform, defaultTipEnd.failed)
            }));

            await updateBootstrap();

            await updateModules({ count: 0, max: data.modules.length });
        };

        return updatePlatform();
    };

    const platforms = async (data = [], op = {}) => {
        if (!Array.isArray(data) || data.length === 0) {
            return false;
        }

        const loopPlatform = async (data, loopSet, op) => {
            await platform(data[loopSet.count], op);

            loopSet.count += 1;

            if (loopSet.count < loopSet.max) {
                loopPlatform(data, loopSet, op);
            }
        };

        return loopPlatform(data, { count: 0, max: data.length }, op);
    };

    const allModules = () => {
        return modules(project.svn.checkout.modules);
    };

    const allTrunks = () => {
        return platforms(project.svn.checkout.trunk, { trunk: true });
    };

    const allBranches = () => {
        return platforms(project.svn.checkout.branches, { branch: true });
    };

    const all = async () => {
        await allModules();
        await allTrunks();
        await allBranches();
    };

    return {
        modules: modules,
        platforms: platforms,
        allModules: allModules,
        allTrunks: allTrunks,
        allBranches: allBranches,
        all: all,
        do: doUpdate
    };
};

module.exports = update();
