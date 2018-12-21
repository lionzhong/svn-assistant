const fs     = require('fs');
const moment = require('moment');
const log    = require('../modules/log');

const tool = {
    folder: {

        create: path => {

            if (!fs.existsSync(path)) {

                log.yellow(`${tool.getTimeNow()} 目录不存在：　${path}`);
                fs.mkdirSync(path);
                log.green(`${tool.getTimeNow()} 目录创建成功：${path}`);
                console.log('\n');

            }

        }

    },
    getTimeNow: () => {

        return moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss");

    },
    repeatStr: (str, length) => {

        return new Array(length).fill(str).join("");

    },
    cutline: (str, color) => {

        color = !color ? "green" : color;

        let cut = tool.repeatStr("=", 60);

        [cut, ` ${str}`, cut, "\n"].forEach(temp => log[color](temp));

    },
    parseObjField: (key, obj) => {

        let locale = obj;
        const paths = key.split('.');
        const deplength = paths.length;
        let index = 0;

        while (locale && index < deplength) {

            locale = locale[paths[index++]];

        }

        return index === deplength ? locale : undefined;

    },
    sortArrByName: (arr, field) => {

        arr.sort((a, b) => {

            let [
                nameA,
                nameB
            ] = [
                field ? tool.parseObjField(field, a).toUpperCase() : a.toUpperCase(),
                field ? tool.parseObjField(field, b).toUpperCase() : b.toUpperCase()
            ];

            if (nameA < nameB) {

                return -1;

            }
            if (nameA > nameB) {

                return 1;

            }

            return 0;

        });

        return arr;

    }
};

module.exports = tool;
