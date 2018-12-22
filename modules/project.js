/**
 * svn 工具项目配置
 *
 * @param {Array} moduleNames - 需要check/update的模块
 *
 * @param {Object} region - 除国内以外其他地区配置
 * @param {Array} region.zone - 除国内以外其他地区
 * @param {Array} region.platform - 除国内以外其他地区需要支持的平台代号
 *
 * @param {Object} svn - svn配置数据集合
 * */
const _    = require('lodash');
const util = require('./util');
const path = require('path');
let config = require('../config');

const project = () => {

    config.services = Array.isArray(config.services) ? _.uniq(config.services).map(key => key.toLowerCase()) : [];
    config.bootstrap = ["saomai", "prapiroon"];
    config.platforms = (() => {

        let results = [];
        const keys = Object.keys(config.deploy);

        keys.forEach(key => {

            config.deploy[key].forEach(obj => {

                const region = util.getRegion(obj, "");
                const { platform } = obj;

                // 基于saomai的平台，将不会再处理prapiroon
                if (obj.baseOnSaomai === true && obj.prapiroon) {

                    delete obj.prapiroon;
                
                }

                // 从trunk配置中移除多余配置
                if (key === "trunk") {

                    ["modulesInTrunk"].forEach(key => {

                        if (obj[key]) {

                            delete obj[key];
                        
                        }
                    
                    });

                }

                if (!results.includes(`${platform}${region}`)) {

                    results.push(`${platform}${region}`);
                
                }

            });
        
        });

        return results;
    
    })();

    config.regions = ["ap", "ib"];

    config.svn = Object.assign(config.svn, {
        checkout: {
            trunk: [],
            branches: [],
            modules: []
        }

    });

    const getSvnCheckoutUrl = () => {

        // 从一条平台配置中解析出此平台下的所有模块存储路径，URL地址（如果需要），symlink路径（如果需要）
        const getModules = op => {

            // 解析模块
            let urlEnd = op.setting.platform.startsWith("jangmi") ? "krosa" : op.setting.platform;

            const moduleInPraiproon = (source, moduleCode) => {

                // 服务存在于prapiroon内，如果存在，则直接更改folder路径
                if (Array.isArray(op.setting.prapiroon) && op.setting.prapiroon.length > 0 && op.setting.prapiroon.includes(moduleCode)) {

                    return {
                        data: Object.assign({}, source, {
                            folder: `${op.baseObj.folder}\\web\\prapiroon\\${moduleCode}`
                        }),
                        included: true
                    };

                } else {

                    return {
                        data: source,
                        included: false
                    };
                
                }
            
            };

            switch (op.trunkOrBranch) {

                case "trunk":

                    if (Array.isArray(config.services) && config.services.length > 0) {

                        let region = util.getRegion(op.setting, "");

                        config.services.forEach(moduleCode => {

                            let parsedModule = {
                                name: moduleCode,
                                url: `${config.svn.url}/${_.capitalize(moduleCode)}/trunk/html/${urlEnd}`,
                                folder: `${op.baseObj.folder}\\${moduleCode}`,
                                link: `${config.svn.folder.modules}\\${moduleCode}\\${op.setting.platform}`
                            };

                            const isInPrapiroon = moduleInPraiproon(parsedModule, moduleCode);

                            parsedModule = isInPrapiroon.data;

                            if (util.getDataType(region, "string") && region !== "") {

                                parsedModule = Object.assign({}, parsedModule, {
                                    link: `${parsedModule.link}${region}`
                                });

                            }

                            op.baseObj.modules.push(parsedModule);
                        
                        });

                    }

                    break;
                case "branches":

                    if (Array.isArray(op.setting.modules) && op.setting.modules.length > 0) {

                        let region = util.getRegion(op.setting, "");

                        config.services.forEach(moduleCode => {

                            let parsedModule = {
                                name: moduleCode,
                                folder: `${op.baseObj.folder}\\${moduleCode}`,
                                link: `${config.svn.folder.modules}\\${moduleCode}\\${op.setting.platform}`,
                                url: `${config.svn.url}/${_.capitalize(moduleCode)}/trunk/html/${urlEnd}`
                            };

                            // 检查branch配置内，此模块是否设置了需要单独checkout分支版本
                            if (op.setting.modules.includes(moduleCode)) {

                                // 如果分支中设置了需要部署trunk的模块，
                                if (!util.array.includes(op.setting.modulesInTrunk, moduleCode)) {

                                    parsedModule = Object.assign({}, parsedModule, {
                                        url: `${config.svn.url}/${_.capitalize(moduleCode)}/branches/${op.setting.version}/html/${urlEnd}`,
                                        folder: `${op.baseObj.folder}\\${moduleCode}`,
                                        checkout: true
                                    });

                                    delete parsedModule.link;
                                
                                }

                            }

                            // 检查branch配置，此模块是否存在于prapiroon内，如果存在就会更高folder路径
                            const isInPrapiroon = moduleInPraiproon(parsedModule, moduleCode);

                            parsedModule = isInPrapiroon.data;

                            if (isInPrapiroon.included && !util.array.includes(op.setting.modulesInTrunk, moduleCode)) {

                                parsedModule = Object.assign({}, parsedModule, {
                                    url: `${config.svn.url}/${_.capitalize(moduleCode)}/branches/${op.setting.version}/html/${urlEnd}`,
                                    checkout: true
                                });

                            }

                            if (util.getDataType(region, "string") && region !== "") {

                                if (parsedModule.link) {

                                    parsedModule = Object.assign({}, parsedModule, {
                                        link: `${parsedModule.link}${region}`,
                                        url: `${parsedModule.url}${region}`
                                    });
                                
                                }

                            }

                            op.baseObj.modules.push(parsedModule);
                        
                        });

                    }

                    break;
            
            }

        };

        const getPlatformName = str => {

            let arr = ["krosa", "tembin", "halong", "jangmi"];
            let index = arr.findIndex(key => str.startsWith(key));

            return index > -1 ? arr[index] : undefined;
        
        };

        // 在branch中部署trunk模块
        const buildInTrunk = (trunkOrBranch, setting, key) => {

            return trunkOrBranch === "branches" && Array.isArray(setting.modulesInTrunk) && setting.modulesInTrunk.length > 0 && setting.modulesInTrunk.includes(key);
        
        };

        // 解析分支中SVN目录基础路径（buildInTrunk）
        const getSvnFolder = (trunkOrBranch, setting, key) => {

            let result = "trunk/html";

            if (trunkOrBranch === "branches" && !buildInTrunk(trunkOrBranch, setting, key)) {

                result = `${trunkOrBranch}/${setting.version}/html`;
            
            }

            return result;
        
        };

        Object.keys(config.deploy).forEach(trunkOrBranch => {

            // 从每个deploy配置解析出对应的checkout配置
            config.deploy[trunkOrBranch].forEach(setting => {

                let defaultOp = {
                    rebuild: {
                        link: false,
                        folder: false
                    }
                };

                // 检查每个deploy中的配置rebuild，用已设置的配置覆盖默认配置
                if (!setting.hasOwnProperty("rebuild")) {

                    setting = Object.assign(setting, defaultOp);
                
                } else {

                    Object.keys(defaultOp.rebuild).forEach(key => {

                        if (!setting.rebuild.hasOwnProperty(key)) {

                            setting.rebuild[key] = false;
                        
                        }
                    
                    });
                
                }

                let platFormInSvn = setting.platform.replace(`_${setting.region}`, "");

                let insertObj = {
                    name: setting.platform,
                    url: "",
                    folder: "",
                    baseOnSaomai: setting.baseOnSaomai === true,
                    modules: []
                };

                {

                    let obj = {};

                    ["region", "modulesInTrunk", "rebuild"].forEach(key => {

                        if (setting[key]) {

                            obj[key] = setting[key];

                        }

                    });

                    insertObj = Object.assign({}, insertObj, obj);

                }

                if (setting.region) {

                    insertObj = Object.assign({}, insertObj, {
                        region: setting.region
                    });
                
                }

                let region = util.getRegion(setting, "");

                if (region !== "") {

                    insertObj = Object.assign({}, insertObj, {
                        region: setting.region
                    });
                
                }

                switch (trunkOrBranch) {

                    case "trunk":
                        insertObj = Object.assign(insertObj, {
                            url: `${config.svn.url}/${_.capitalize(platFormInSvn)}/trunk/html`,
                            folder: path.join(config.svn.folder.trunk, `${setting.platform}${region}`)
                        });
                        break;
                    case "branches":
                        insertObj = Object.assign(insertObj, {
                            url: `${config.svn.url}/${_.capitalize(platFormInSvn)}/${getSvnFolder("branches", setting, setting.platform)}`,
                            folder: path.join(config.svn.folder.branches, setting.version, `${setting.platform}${region}`),
                            version: setting.version
                        });
                        break;
                
                }

                let [halong, jangmi] = [setting.platform.startsWith("halong"), setting.platform.startsWith("jangmi")];

                let originFolder = insertObj.folder;

                if (halong || jangmi) {

                    insertObj.url = `${insertObj.url}/krosa`;

                    if (halong) {

                        insertObj.folder = path.join(insertObj.folder, `halong`);
                    
                    }

                    if (jangmi) {

                        insertObj.folder = path.join(insertObj.folder, `jangmi`);
                    
                    }
                
                }

                insertObj.url = setting.region ? `${insertObj.url}_${setting.region}` : insertObj.url;

                // 解析此平台内需要checkout的模块
                getModules({
                    setting: setting,
                    baseObj: insertObj,
                    trunkOrBranch: trunkOrBranch
                });

                // 解析配置中的宇轩版框架
                if (Array.isArray(setting.prapiroon) || halong || jangmi) {

                    insertObj.bootstrap = [];

                    let base = {};

                    const [prapiroonSvn, saomaiSvn] = [getSvnFolder(trunkOrBranch, setting, "prapiroon"), getSvnFolder(trunkOrBranch, setting, "saomai")];

                    // 区别对待trunk，branches
                    ["saomai", "nscloud", "nscloud_visual"].forEach(key => {

                        base = {
                            name: key
                        };

                        let baseFolderPath = (function () {

                            let platform = getPlatformName(insertObj.name);

                            if (platform === "krosa" || platform === "tembin") {

                                insertObj.prapiroon = {
                                    name: `prapiroon-${platform}`,
                                    url: `${config.svn.url}/${_.capitalize("prapiroon")}/${prapiroonSvn}/${platform}`,
                                    folder: path.join(originFolder, "web", "prapiroon")
                                };

                                return path.join(originFolder, "web");
                            
                            } else if (platform === "halong" || platform === "jangmi") {

                                return originFolder;
                            
                            }

                        })();

                        switch (key) {

                            case "saomai":
                                base = Object.assign(base, {
                                    url: `${config.svn.url}/${_.capitalize("saomai")}/${saomaiSvn}/web`,
                                    folder: `${baseFolderPath}`
                                });

                                if (halong || jangmi) {

                                    base = Object.assign(base, {
                                        rebuild: setting.rebuild
                                    });
                                
                                }
                                break;
                            case "nscloud":
                                base = Object.assign(base, {
                                    url: `${config.svn.url}/${_.capitalize("saomai")}/${saomaiSvn}/ui/angular`,
                                    folder: path.join(baseFolderPath, "lib", "nscloud")
                                });
                                break;
                            case "nscloud_visual":
                                base = Object.assign(base, {
                                    url: `${config.svn.url}/${_.capitalize("saomai")}/${saomaiSvn}/ui/visual`,
                                    folder: path.join(baseFolderPath, "lib", "nscloud_visual")
                                });
                                break;
                        
                        }

                        insertObj.bootstrap.push(base);
                    
                    });
                
                }

                config.svn.checkout[trunkOrBranch].push(insertObj);

            });

        });

        // 解析所有模块checkout配置
        const parseModulesCheckout = () => {

            const keys = Object.keys(config.deploy);

            if (keys.length <= 0) {

                return;
            
            }

            keys.forEach(key => {

                config.deploy[key].forEach(setting => {

                    const region = util.getRegion(setting, "");

                    const obj = (() => {

                        let result = {
                            name: setting.platform,
                            url: `${config.svn.url}/${_.capitalize(setting.platform)}/trunk/html${region}`,
                            folder: path.join(config.svn.folder.modules, `${setting.platform}${region}`)
                        };

                        if (region !== "") {

                            result = Object.assign(result, { region: setting.region });
    
                        }

                        return result;

                    })();

                    config.svn.checkout.modules.push(obj);

                });
            
            });

            const getCodeInSvn = code => {

                switch (code.toLowerCase()) {

                    case "choi_wan":
                        code = "Choi_Wan";
                        break;
                    default:
                        code = _.capitalize(code);
                        break;

                }

                return code;
    
            };

            _.uniq([].concat(config.bootstrap, config.services)).forEach(code => {

                config.svn.checkout.modules.push({
                    name: code,
                    url: `${config.svn.url}/${getCodeInSvn(code)}/trunk/html`,
                    folder: path.join(config.svn.folder.modules, code.toLowerCase())
                });

            });
        
        };

        parseModulesCheckout();

    };

    const parseFolderPath = () => {

        Object.keys(config.svn.folder).forEach(key => {

            switch (key) {

                case "project":
                    config.svn.folder[key] = path.normalize(config.svn.folder.project);
                    break;
                default:
                    config.svn.folder[key] = path.normalize(path.join(config.svn.folder.project, key));
                    break;

            }

        });

    };

    const init = () => {

        parseFolderPath();
        util.folder.createConfig(config);
        getSvnCheckoutUrl();

        if (config.debug === true) {

            util.output.json("./debug/config_export.json", config);

        }
    
    };

    // const createFolders = async () => {

    //     await util.folder.createConfig(config);
    
    // };

    // createFolders().finally(() => init());

    init();

    return config;

};

module.exports = project();
