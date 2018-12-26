/**
 * deploy 配置项说明
 * */
const path = require("path");

const config = () => {
    return {

        /**
         * svn配置
         * @param {string} url - svn仓库地址
         * @param {object} params - svn 指令操作时，需要传递的参数，每个参数默认值为空字符串时，视为无效参数
         * @param {object} folder - svn操作依赖路径
         * @param {string} folder.project - 项目根路径
         * @param {string} folder.trunk - 项目内，trunk操作目录名
         * @param {string} folder.branches - 项目内，trunk操作目录名
         * @param {string} folder.modules - 项目内，trunk操作目录名
         */
        "svn": {
            "url": "",
            "params": {
                "username": "",
                "password": ""
            },
            "folder": {
                "project": process.cwd(),
                "trunk": path.join(process.cwd(), "trunk"),
                "branches": path.join(process.cwd(), "branches"),
                "modules": path.join(process.cwd(), "modules")
            }
        },

        // 模块配置
        "services": [
            "moduleName"
        ],

        /**
         * 平台部署配置参数（trunk，branches）
         * @param {string} region - 区域设置，关系到checkout,symlink时，是否对应到对应的区域目录
         * @param {array} modules - (仅对分支有效)需要check的模块，如不配置此项，或此项为空数组时，则会直接link到modules中对应的模块，例如（modules = []， platform = krosa, nangka则自动symlink 到 module/nangla/krosa）
         * @param {array} prapiroon - prapiroon内需要link的模块
         * @param {array} modulesInTrunk - (仅对分支有效)此置了已经包含在prapiroon配置内的模块时，则将prapiroon内同名模块symlink改为单独checkout
         * @param {boolean} saomaiTrunk - 是否check Trunk中的saomai，如果deploy分支时，不配置此项将会从saomai分支check对应版本号
         * @param {string} version - (仅对分支有效)deploy.branches内平台独有属性，分支版本号，此版本号将会用于创建目录，checkout url
         * @param {object} rebuild - 重建配置
         * @param {boolean} rebuild.link - 重建symlink
         * @param {boolean} rebuild.folder - 重建folder
         * 
         * 请注意，平台也会被视作模块单独checkout到svn/modules目录下，如果一个平台同时还设置了region参数，则会视此平台也为单独的module并checout 到 modules目录，例如modules/krosa_ap
         */

        "deploy": {
            "trunk": [
                {
                    "platform": "krosa",
                    "prapiroon": [],
                    "rebuild": {
                        "link": false,
                        "folder": false
                    }
                },

                {
                    "platform": "tembin",
                    "prapiroon": [],
                    "rebuild": {
                        "link": false,
                        "folder": false
                    }
                },

                {
                    "platform": "krosa",
                    "region": "ap",
                    "rebuild": {
                        "link": false,
                        "folder": false
                    }
                },

                {
                    "platform": "tembin",
                    "region": "ap",
                    "modules": [],
                    "rebuild": {
                        "link": false,
                        "folder": false
                    }
                },

                {
                    "platform": "halong",
                    "modules": [],
                    "baseOnSaomai": true,
                    "rebuild": {
                        "link": false,
                        "folder": false
                    }
                },

                {
                    "platform": "jangmi",
                    "modules": [],
                    "baseOnSaomai": true,
                    "rebuild": {
                        "link": false,
                        "folder": false
                    }
                }
            ],
            "branches": [
                {
                    "platform": "krosa",
                    "version": "2.0.5.0",
                    // 需要check分支的模块
                    "modules": [],
                    // 需要check到prapiroon的分支模块
                    "prapiroon": [], 
                    // 分支独有配置，此配置项中的模块会从trunk中check或Link，混合部署, 注意:modulesInTrunk会覆盖modules, prapiroon设置中的模块
                    "modulesInTrunk": [], 
                    "rebuild": {
                        "link": true,
                        "folder": false
                    }
                },
                
                {
                    "platform": "tembin",
                    "version": "2.0.5.0",
                    "modules": [],
                    "prapiroon": []
                },
                
                {
                    "platform": "krosa",
                    "version": "2.0.5.0",
                    "region": "ap",
                    "modules": []
                },
                
                {
                    "platform": "tembin",
                    "version": "2.0.5.0",
                    "region": "ap",
                    "modules": []
                },
                
                {
                    "platform": "halong",
                    "version": "2.0.5.0",
                    "baseOnSaomai": true,
                    "modules": []
                },
                
                {
                    "platform": "jangmi",
                    "version": "2.0.5.0",
                    "baseOnSaomai": true,
                    "modules": []
                }
            ]
        },

        // 全局杂项重建配置，此配置和deploy中的重建无关
        "rebuild": {
            "link": false,
            "folder": false
        },

        // debug = true时，会将解析后的配置json写入./debug/config_export.json
        "debug": false

    };
};

module.exports = config();
