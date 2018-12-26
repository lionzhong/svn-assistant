# Svn Assistant 前端SVN助手

## 安装

```javascript
npm install -g git+https://github.com/lionzhong/svn-assistant.git
```

## 使用说明

此工具会在执行目录优先查找config.json配置文件，并根据此文件创建基础目录。如果目录内无此文件，将会自动生成默认配置文件（config.json示例）。

此工具需要先在配置中配置好你经常需要使用的各服务。 config.json > services，trunk以及branch中当不需要单独checkout的场景都会使用软连接的方式，在对应平台中软链接各服务到这些services。建议把经常使用的服务都加入，以保证搭建的平台更完整。


### 主指令
Svn Assistant共有3个主指令，分别是 --deploy --update --cleanup。一次只能使用一个主指令，多个主指令同时出现将会停止执行

```javascript
nsvn --deploy --update --cleanup (-d | -u | -k)
```

### deploy：

此指令用于部署moudules，trunk，branches到对应目录，可组合使用。

#### 模块部署：
checkout all modules to project/modules
```javascript
nsvn -d -m
```


checkout one module to project/modules

```javascript
nsvn -d -m nangka
nsvn -d -m nangka -r ap
```

#### trunk平台部署:
checkout all platforms to project/trunk

```javascript
nsvn -d -t
```

checkout multiple platforms to project/trunk

```javascript
nsvn -d -t krosa
nsvn -d -t krosa -r ap
 ```

 只有填写region才会部署对应区域平台

#### branches 分支部署:
checkout all branches to project/branches
```javascript
nsvn -d -b
 ```

checkout multiple branches to project/branches

```javascript
nsvn -d -b krosa
 // 不区分版本，但不包括区域的指定平台
 
nsvn -d -b krosa -v 2.0.5.0
 // 指定对应版本对应平台

nsvn -d -b krosa -r ap
 // 不区分版本，包括区域的指定平台

nsvn -d -b krosa -v 2.0.5.0 -r ap
 // 指定对应版本，对应区域，对应平台
 ```

 只有填写region才会部署对应区域平台

### update/cleanup 操作
操作方式和trunk,branches操作完全一致，切换主指令即可

## config.json 示例
```javascript
{

    /**
     * svn配置
     * @param {string} url - svn仓库地址
     * @param {object} params - svn 指令操作时，需要传递的参数，每个参数默认值为空字符串时，视为无效参数
     * @param {object} folder - svn操作依赖路径
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
            "trunk": "trunk",
            "branches": "branches",
            "modules": "modules"
        }
    },

    // 模块配置
    "services": [
        "modulename"
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
     * 请注意：
     * 平台也会被视作模块单独checkout到svn/modules目录下，如果一个平台同时还设置了region参数，
     * 则会视此平台也为单独的module并checout 到 modules目录，例如modules/krosa_ap
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

}
```