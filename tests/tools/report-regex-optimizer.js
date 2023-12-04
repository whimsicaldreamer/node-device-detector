const regexpTree = require('regexp-tree');
const {Command} = require('commander');
const {performance} = require('node:perf_hooks');
const fs = require('node:fs');
const DeviceDetector = require('../../index');
const DEVICE_PARSER_LIST = require('../../parser/const/device-parser');
const {YAMLLoad, YAMLDump, getFixtureFolder} = require('./../functions');

const command = new Command();
command.option('-rb, --rewrite-brand <string>',
    'Rewrite common rule for brand');

command.option('-rm, --rewrite-model <bool>',
    'Rewrite models position for actual device release');
command.parse(process.argv);

const options = command.opts();
const hasOptions = Object.keys(options).length > 0;

const detector = new DeviceDetector();

const regexOptimize = (regex) => {
  return regexpTree.optimize(regex).toString();
};

if (options.rewriteBrand) {

  let excludeFilesNames = ['bots.yml', 'alias_devices.yml'];
  let fixtureFolder = getFixtureFolder();
  let ymlDeviceFiles = fs.readdirSync(fixtureFolder + 'devices/');
  let useragents =  {};

  ymlDeviceFiles.forEach((file) => {
    if (excludeFilesNames.indexOf(file) !== -1) {
      return;
    }
    console.log('create map devices for file: ', 'devices/' + file);
    let fixtureData = YAMLLoad(fixtureFolder + 'devices/' + file);
    fixtureData.forEach((fixture) => {
        if (fixture.device && fixture.device.brand && fixture.device.brand === options.rewriteBrand) {
          useragents[fixture.user_agent] = {};
        }
    });
  });

  const main = async (brand) => {

    let parser = detector.getParseDevice(DEVICE_PARSER_LIST.MOBILE);
    let structure = parser.collection[brand];
    let regexString = parser.normalizeBaseRegExp(String(structure.regex));

    let commandRegex = new RegExp(regexString, 'i');
    let optimizedRe = regexpTree.optimize(commandRegex).toRegExp();

    const trace = (useragent, regex) => {
      const start = performance.now();
      const detect = regex.test(useragent);
      const time = performance.now() - start;
      return {
        detect,
        time
      }
    }

    for (let useragent in useragents) {
      trace(useragent, /sda/i);
      useragents[useragent].optimiz = trace(useragent, optimizedRe)
      useragents[useragent].default = trace(useragent, commandRegex)

      useragents[useragent].victory =  {}


      console.log(useragent, useragents[useragent]);
    }

  };

  main(options.rewriteBrand)

}


