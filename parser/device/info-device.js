const ParserAbstract = require('./../abstract-parser');
const DataPacker = require('./../../lib/data-packer');

// this is a test functionality do not try to use this class in production
// this is a test functionality do not try to use this class in production
// this is a test functionality do not try to use this class in production
// this is a test functionality do not try to use this class in production
// this is a test functionality do not try to use this class in production
// this is a test functionality do not try to use this class in production
// this is a test functionality do not try to use this class in production

// declaration doc object

/*

### Get more information about a device (experimental)
> year, weight, release, display.size, display.resolution, display.ratio
```js
const InfoDevice = require('node-device-detector/parser/device/info-device');
const infoDevice = new InfoDevice;
const result = infoDevice.info('Asus', 'Zenfone 4');
console.log('Result information about device', result);
/*
result
{
  display: { size: '5.5', resolution: '1080x1920', ratio: '16:9' },
  size: '155.4x75.2x7.7',
  weight: '165',
  release: '2017'
}
is not found result null
*/
/*
```
cast methods
```js
infoDevice.setSizeConvertObject(true);
infoDevice.setResolutionConvertObject(true);
```
 */

/**
 * @typedef InfoDisplay
 * @param {string} size
 * @param {string} resolution
 * @param {string} ratio
 *
 * @typedef InfoResult
 * @param {InfoDisplay} display
 * @param {string} size
 * @param {string} weight
 * @param {string|null} release
 */

// private methods

/**
 * Convert string 100x100 to object {width, height}
 * @param size
 * @return {{width: string, height: string}}
 */
const castResolutionToObject = (size) => {
  let [width, height] = size.split('x');
  return { width, height };
};
/**
 * Convert string 100x100x100 to object {width, height,thickness}
 * @param size
 * @return {{thickness: string, width: string, height: string}}
 */
const castSizeToObject = (size) => {
  let [width, height, thickness] = size.split('x');
  return { width, height, thickness };
};

/**
 * calculate PPI
 * @param width
 * @param height
 * @param size
 * @returns {number}
 */
const castResolutionPPI = (width, height, size) => {
  return Math.round(
    Math.sqrt(Math.pow(parseInt(width), 2) + Math.pow(parseInt(height), 2)) /
      parseFloat(size)
  );
};

/**
 * port gcd function
 * @param u
 * @param v
 * @returns {*}
 */
const gcd = (u, v) => {
  if (u === v) return u;
  if (u === 0) return v;
  if (v === 0) return u;
  if (~u & 1) {
    return v & 1 ? gcd(u >> 1, v) : gcd(u >> 1, v >> 1) << 1;
  }
  if (~v & 1) return gcd(u, v >> 1);
  if (u > v) return gcd((u - v) >> 1, v);
  return gcd((v - u) >> 1, u);
};

const mergeDeep = (...objects) => {
  const isObject = (obj) => obj && typeof obj === 'object';
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });
    return prev;
  }, {});
};

/**
 * calculate ratio
 * @param width
 * @param height
 * @returns {string}
 */
const castResolutionRatio = (width, height) => {
  let d = gcd(width, height);
  return `${Math.round(height / d)}:${Math.round(width / d)}`;
};

const sortObject = (o) =>
  Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});

// help block

/**
 * @usage
 * let i = new InfoDevice
 * let result = i.info('Asus', 'ZenFone 4')
 * console.log({result});
 * // result if found
 * {
 *   display: {size: "5.5", resolution: "1080x1920", ratio: "16:9", ppi: 401},
 *   size: "155.4x75.2x7.7",
 *   weight: "165",
 *   release: "2017"
 * }
 * // result in not found
 * null
 */

const SHORT_KEYS = {
  DS: 'display.size',
  // DT: 'display.type',        // string: display type IPS, LCD, OLED, SLED etc.
  // TS: 'display.touch',       // boolean: touch support
  RS: 'display.resolution', // string|obj: 1080x1920
  SZ: 'size', // string|obj: 155.4x75.2x7.7
  WT: 'weight', // int: weight
  RE: 'release', // string:year release
  RM: 'hardware.ram', // int: RAM in MB
  CP: 'hardware.cpu_id', // int: <id>
  GP: 'hardware.gpu_id', // int: <id>
  OS: 'os', // string: Android 4.4
  SM: 'sim', // int: count SIM
};

/**
 * Class for obtaining information on a device
 */
class InfoDevice extends ParserAbstract {
  constructor() {
    super();

    /** @type {boolean} convert size 75.2x155.4x7.7 to object {width, height, thickness} */
    this.sizeConvertObject = false;
    /** @type {boolean} convert display.resolution 1080x1920 to object {width, height} */
    this.resolutionConvertObject = false;
    /** @type {string} fixture path to file */
    this.fixtureFile = 'device-info/device.yml';

    this.collectionHardwareCPU = {};
    this.collectionHardwareGPU = {};
    this.loadCollection();
  }

  loadCollection() {
    super.loadCollection();
    // load hardware properties
    this.collectionHardwareCPU = this.loadYMLFile(
      'device-info/hardware-cpu.yml'
    );
    this.collectionHardwareGPU = this.loadYMLFile(
      'device-info/hardware-gpu.yml'
    );
  }

  /**
   * Overwrite config sizeConvertObject
   * @param {boolean} value
   */
  setSizeConvertObject(value) {
    this.sizeConvertObject = !!value;
  }

  /**
   * Overwrite config resolutionConvertObject
   * @param {boolean} value
   */
  setResolutionConvertObject(value) {
    this.resolutionConvertObject = !!value;
  }

  getGpuById(id) {
    if (this.collectionHardwareGPU['gpu'] === void 0) {
      return null;
    }
    id = parseInt(id);
    let data = this.collectionHardwareGPU['gpu'][id];
    if (data === void 0) {
      return null;
    }
    return data;
  }

  getCpuById(id) {
    if (this.collectionHardwareCPU['cpu'] === void 0) {
      return null;
    }

    id = parseInt(id);
    let data = this.collectionHardwareCPU['cpu'][id];
    if (data === void 0) {
      return null;
    }
    return data;
  }

  find(deviceBrand, deviceModel, mergeData = {}) {
    if (!deviceBrand.length || !deviceModel.length) {
      return null;
    }

    const fixStringName = (str) => str.replace(new RegExp('_', 'g'), ' ');

    deviceBrand = fixStringName(deviceBrand);
    deviceModel = fixStringName(deviceModel);

    let brand = deviceBrand.trim().toLowerCase();
    let model = deviceModel.trim().toLowerCase();

    if (
      this.collection[brand] === void 0 ||
      this.collection[brand][model] === void 0
    ) {
      return null;
    }

    let data = this.collection[brand][model];
    // get normalise data
    let result = DataPacker.unpack(data, SHORT_KEYS);

    this.prepareResultDisplay(result);
    this.prepareResultHardware(result);
    this.prepareResultSize(result);
    result = mergeDeep(mergeData, result);
    // redirect and overwrite params
    let dataRedirect = /^->([^;]+)/i.exec(data);
    if (dataRedirect !== null) {
      return this.find(deviceBrand, dataRedirect[1], result);
    }
    return sortObject(result);
  }

  prepareResultSize(result) {
    if (this.sizeConvertObject && result.size) {
      result.size = castSizeToObject(result.size);
    }
  }

  prepareResultHardware(result) {
    // set hardware data
    if (result.hardware) {
      let gpu;
      let cpu;
      if (result.hardware.gpu === void 0 && result.hardware.gpu_id !== void 0) {
        gpu = this.getGpuById(result.hardware.gpu_id);
        if (gpu !== null) {
          result.hardware.gpu = gpu;
        }
      }
      if (result.hardware.cpu_id !== void 0) {
        cpu = this.getCpuById(result.hardware.cpu_id);
        if (cpu !== null) {
          result.hardware.cpu = cpu;
          if (result.hardware.gpu === void 0 && result.hardware.cpu.gpu_id) {
            result.hardware.gpu = this.getGpuById(result.hardware.cpu.gpu_id);
          }
        }
      }
    }
  }

  prepareResultDisplay(result) {
    // set display data
    if (result.display) {
      // calculate ration & ppi
      let resolution =
        result.display && result.display.resolution
          ? castResolutionToObject(result.display.resolution)
          : '';

      let ratio = '';
      let ppi = '';
      if (typeof resolution !== 'string') {
        let resolutionWidth = parseInt(resolution.width);
        let resolutionHeight = parseInt(resolution.height);

        if (resolutionWidth && resolutionHeight) {
          if (result.display.size) {
            ppi = castResolutionPPI(
              resolutionWidth,
              resolutionHeight,
              result.display.size
            );
          }
          ratio = castResolutionRatio(resolutionWidth, resolutionHeight);
        }
      }

      result.display.size = result.display.size ? result.display.size : null;
      result.display.resolution = this.resolutionConvertObject
        ? resolution
        : result.display.resolution;

      if (ratio) {
        result.display.ratio = ratio;
      }

      if (ppi) {
        result.display.ppi = String(ppi);
      }
    }
  }

  /**
   * The main method for obtaining information on brand and device
   * @param {String} deviceBrand
   * @param {String} deviceModel
   * @return {InfoResult|null}
   */
  info(deviceBrand, deviceModel) {
    return this.find(deviceBrand, deviceModel, {});
  }
}

module.exports = InfoDevice;
