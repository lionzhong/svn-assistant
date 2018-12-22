const fs          = require('fs');
const svnUltimate = require('node-svn-ultimate');
const rimraf      = require('rimraf');
const _           = require('lodash');
const util        = require('../modules/util');
const log         = require('../modules/log');
const symlink     = require('../modules/symlink');
const project     = require("./project");

const update = () => {

    const doUpdate = (module = false, op = {}) => {

        return new Promise((resolve, reject) => {
            
            if (module === false) {

                log.red(`Invaild module!`, true);
                reject(new Error("Invaild module!"));
                return false;
    
            }

            svnUltimate.commands.update(module.folder, err => {
                
                if (!err) {
    
                    log.time(`${module.folder}`);
                    log.green(util.getDataType(op.success, "function") ? op.success(module) : `Update complete!`, true);
                    resolve();
    
                } else {
    
                    console.error(err);
                    log.time(`${module.folder}`);
                    log.red(util.getDataType(op.failed, "function") ? op.failed(module) : `Update failed!`, true);

                    reject(err);
    
                }
    
                console.log('\n');
    
            });

        });

    };

    const loopUpdate = (data = [], loopSet = {}, op = {}, resolve, reject) => {

        if (!Array.isArray(data) || data.length === 0) {

            log.red("Invlid source data!", true);
            reject();
            return false;

        }

        const updatePromise = doUpdate(data[loopSet.count], op);

        updatePromise.finally(() => {

            loopSet.count += 1;

            if (loopSet.count < loopSet.max) {

                loopUpdate(data, loopSet, op, resolve, reject);

            } else {

                resolve();

            }

        });

    };

    const modules = (data, doneTip = true) => {

        const promise = new Promise((resolve, reject) => {

            loopUpdate(data, {
                count: 0,
                max: data.length
            }, {
                success: (module) => `Module ${module.name}${util.getRegion(module, "", " ")} update complete!`,
                failed: (module) => `Module ${module.name}${util.getRegion(module, "", " ")} update failed!`
            }, resolve, () => reject);

        });

        if (doneTip) {

            promise.then(() => log.done(`All modules update complete!`));

        }

        return promise;

    };

    return {
        modules: modules,
        do: doUpdate
    };

};

module.exports = update();
