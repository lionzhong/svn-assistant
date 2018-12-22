const fs      = require('fs');
const log     = require('../modules/log');
const util    = require('./util');

const link = (source, target, sync, relink) => {

    const tip = {
        "success": () => {

            log.time(`source: ${source} | target: ${target}`);
            log.green(`Symlink created! \n`, true);

        },
        "failed": err => {
            
            console.log(err);
            console.log('\n');
            log.red(`Symlink failed! \n`, true);

        }
    };

    const doLink = () => {

        if (sync) {

            try {

                fs.symlinkSync(source, target, 'dir');
                tip.success();

            } catch (err) {

                tip.failed(err);

            }

        } else {

            fs.symlink(source, target, 'dir', err => {

                if (err) {

                    tip.failed(err);

                } else {

                    tip.success();

                }

            });

        }

    };
    
    try {

        if (util.getDataType(fs.readlinkSync(target), "string")) {

            if (relink) {

                log.time(`Symlink rebuild: Enabled`);
                log.time(`Symlink ${target} start rebuild...\n`);
                fs.unlinkSync(target);
                doLink();

            } else {

                log.time(`Symlink rebuild: Disabled`);
                log.time(`Symlink ${target} aleady exist, ignore rebuild!\n`);

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
