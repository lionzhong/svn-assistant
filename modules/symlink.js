const fs      = require('fs');
const log     = require('../modules/log');
const util    = require('./util');

const link = (source, target, sync, relink) => {

    const doLink = () => {

        if (sync) {

            fs.symlinkSync(source, target, 'dir');

        } else {

            fs.symlink(source, target, 'dir', err => {

                if (err) {

                    console.log(err);
                    console.log('\n');

                } else {

                    let time = util.getTimeNow();

                    log.time(` | source: ${source} | target: ${target}`);
                    log.green(`${time} Symlink created! \n`, true);

                }

            });

        }

    };
    
    try {

        if (util.getDataType(fs.readlinkSync(target), "string")) {

            if (relink) {

                log.time(`Symlink ${target} start rebuild...`);
                fs.unlinkSync(target);
                doLink();

            }

        }

    } catch (err) {
        
        doLink();

    }

};

const symlink = () => {

    const linkModules = (modules, relink = false, sync = false) => {

        modules.forEach(module => {

            if (fs.existsSync(module.link)) {

                link(module.link, module.folder, sync, relink);

            }

        });

    };

    return {
        link: link,
        modules: linkModules
    };

};

module.exports = symlink();
