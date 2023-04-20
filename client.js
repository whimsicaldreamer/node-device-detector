// This file is used on your site to get some device metrics
// get ram, size screen, gpu
// get gpu benchmark for iphone for identification model

function DeviceCollector() {

  const __DATA_COLLECTOR__ = {
    'iPhone SE': {
      webgl: 'a9 gpu',
    },
  };

  let canvas = document.createElement('canvas');
  let gl;

  if (!gl) {
    try {
      gl = canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl');
    } catch (e) {}
  }

  this.getGPU = function() {
    return gl ? gl.getParameter(
        gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL,
    ) : null;
  };

  this.getRatio = function() {
    return window.devicePixelRatio;
  };

  // Width of the screen in pixels.
  this.getWidth = function() {
    return window.screen.width * this.getRatio();
  };

  // Height of the screen in pixels.
  this.getHeight = function() {
    return window.screen.height * this.getRatio();
  };

  this.isPad = function() {
    return navigator.platform === 'iPad' ||
        (navigator.platform === 'MacIntel'
            && navigator.maxTouchPoints > 0 &&
            !window.MSStream
        );
  };

  // https://github.com/pmndrs/detect-gpu/blob/master/src/internal/deobfuscateAppleGPU.ts
  this.getAppleMetricGPU = function() {

    if (!this.isAppleFamily()) {
      return {};
    }

    const codeA = '801621810';
    const codeB = '8016218135';
    const codeC = '80162181161';
    const codeDefault = '80162181255';

    function calculateMagicPixelId() {
      if (!gl) {
        return '0';
      }

      const {
        GL_ARRAY_BUFFER,
        GL_COLOR_BUFFER_BIT,
        GL_FLOAT,
        GL_FRAGMENT_SHADER,
        GL_RGBA,
        GL_STATIC_DRAW,
        GL_TRIANGLES,
        GL_UNSIGNED_BYTE,
        GL_VERTEX_SHADER,
      } = gl;

      const vertexShaderSource = /* glsl */ `
    precision highp float;
    attribute vec3 aPosition;
    varying float vvv;
    void main() {
      vvv = 0.31622776601683794;
      gl_Position = vec4(aPosition, 1.0);
    }
  `;

      const fragmentShaderSource = /* glsl */ `
    precision highp float;
    varying float vvv;
    void main() {
      vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * vvv;
      enc = fract(enc);
      enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
      gl_FragColor = enc;
    }
  `;

      const vertexShader = gl.createShader(GL_VERTEX_SHADER);
      const fragmentShader = gl.createShader(GL_FRAGMENT_SHADER);
      const program = gl.createProgram();
      if (!(fragmentShader && vertexShader && program)) return;
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(vertexShader);
      gl.compileShader(fragmentShader);
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      gl.linkProgram(program);

      gl.detachShader(program, vertexShader);
      gl.detachShader(program, fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      gl.useProgram(program);

      const vertexArray = gl.createBuffer();
      gl.bindBuffer(GL_ARRAY_BUFFER, vertexArray);
      gl.bufferData(
          GL_ARRAY_BUFFER,
          new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
          GL_STATIC_DRAW,
      );

      const aPosition = gl.getAttribLocation(program, 'aPosition');
      gl.vertexAttribPointer(aPosition, 3, GL_FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPosition);

      gl.clearColor(1, 1, 1, 1);
      gl.clear(GL_COLOR_BUFFER_BIT);
      gl.viewport(0, 0, 1, 1);
      gl.drawArrays(GL_TRIANGLES, 0, 3);

      const pixels = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, GL_RGBA, GL_UNSIGNED_BYTE, pixels);

      gl.deleteProgram(program);
      gl.deleteBuffer(vertexArray);
      return pixels.join('');
    }

    const possibleChipsets = this.isPad() ? [
      ['a7', codeC, 12], // ipad air / ipad mini 2 / ipad mini 3
      ['a8', codeB, 15], // pad mini 4
      ['a8x', codeB, 15], // ipad air 2
      ['a9', codeB, 15], // ipad 5th gen
      ['a9x', codeB, 15], // pro 9.7 2016 / pro 12.9 2015
      ['a10', codeB, 15], // ipad 7th gen / ipad 6th gen
      ['a10x', codeB, 15], // pro 10.5 2017 / pro 12.9 2nd gen, 2017
      ['a12', codeA, 15], // ipad 8th gen / ipad air 3rd gen / ipad mini 5th gen
      ['a12x', codeA, 15], // pro 11 1st gen / pro 12.9 3rd gen
      ['a12z', codeA, 15], // pro 12.9 4th gen / pro 11 2nd gen
      ['a14', codeA, 15], // ipad air 4th gen
      ['m1', codeA, 15], // ipad pro 11 2nd gen / 12.9 5th gen
    ] : [
      ['a7', codeC, 12], // 5S
      ['a8', codeB, 12], // 6 / 6 plus / ipod touch 6th gen
      ['a9', codeB, 15], // 6s / 6s plus/ se 1st gen
      ['a10', codeB, 15], // 7 / 7 plus / iPod Touch 7th gen
      ['a11', codeA, 15], // 8 / 8 plus / X
      ['a12', codeA, 15], // XS / XS Max / XR
      ['a13', codeA, 15], // 11 / 11 pro / 11 pro max / se 2nd gen
      ['a14', codeA, 15], // 12 / 12 mini / 12 pro / 12 pro max
    ];

    const pixelId = calculateMagicPixelId(gl);
    let chipsets = [];
    if (pixelId === codeDefault) {
      chipsets = possibleChipsets.filter(
          ([, , iosVersion]) => iosVersion >= 14);
    } else {
      chipsets = possibleChipsets.filter(([, id]) => id === pixelId);
      if (!chipsets.length) {
        chipsets = possibleChipsets;
      }
    }

    return {
      chipsets,
    };
  };

  this.isAppleFamily = function() {
    return /iPhone|iPad|Macintosh|Ipod/.exec(navigator.userAgent) !== null;
  };

  this._cpuTest2 = function() {
    function makeMatrix(size = 2048) {
      let matrix = [];
      for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
          matrix[i][j] = Math.random();
        }
      }
      return matrix;
    }

    if (this.isAppleFamily()) {
      let sec = this.performance();
      makeMatrix();
      return this.performance() - sec;
    }
    let sec = this.performance();
    makeMatrix(512);
    return this.performance() - sec;
  };

  this._cpuTest1 = function() {
    function benchmark(num, timeLimit = 200, steps = 9) {
      let r = 0;
      for (let sec, c, l = 0, a = Math.ceil(1e3 * num), d = (16384 < a &&
      (a = 16384, num = 16.384), new Uint32Array(a)), o = 0; o <
      steps; o++) {
        for (sec = this.performance(), c = 0; c <
        1e3; c++) window.crypto.getRandomValues(d);
        if (l += sec = this.performance() - sec, (0 === o || sec < r) &&
        (r = sec), 3 <= o && timeLimit <
        l) break;
      }
      return parseFloat((r / num).toFixed(3));
    }

    if (!('crypto' in window)) {
      return -1;
    }

    let operations;
    let timeLimit = 200, firstTime = this.performance(),
        e = benchmark(.5, timeLimit, 9);
    timeLimit -= this.performance() - firstTime, e < 20 &&
    (e = benchmark(20 / e, timeLimit, 30)),
        operations = e;
    return operations;
  };

  /**
   *
   * @param str
   * @returns {number}
   */
  this.fnvHash = function(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; ++i) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
  };

  this.getBenchmarkGPU = function() {
    return [
      this._cpuTest1(),
      this._cpuTest2(),
    ].reduce((prev, cursor) => prev + cursor, 0);
  };

  this.hashImage = function() {
    function drawImage(canvas) {
      canvas.width = 67;
      canvas.height = 67;
      let ctx = canvas.getContext('2d', {
        alpha: true,
        textBaseline: 'top',
      });
      if (ctx != null) {
        // Configure the canvas context.
        let text = 'DeviceText';
        ctx.imageSmoothingQuality = 'low';
        ctx.imageSmoothingEnabled = true;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.miterLimit = Infinity;
        ctx.filter = 'none';
        ctx.lineCap = 'butt';
        ctx.lineDashOffset = 0;
        ctx.lineJoin = 'miter';
        ctx.font = '16px \'Arial\'';
        ctx.lineWidth = 2;
        if (ctx.setLineDash !== void 0) {
          ctx.setLineDash([10, 20]);
        }
        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = -3;
        ctx.shadowOffsetY = -5;
        ctx.rotate(.05);
        ctx.fillStyle = '#E06';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#0B7';
        ctx.fillText(text, 2, 15);
        ctx.fillStyle = '#FF5';
        ctx.fillText(text, 4, 17);
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'blue';
        ctx.rotate(-.15);
        ctx.fillRect(-20, 25, 234, 5);
      }
      return canvas.toDataURL();
    }

    let hash = 0;
    let canvas = document.createElement('canvas');
    let imageData = drawImage(canvas);
    if (canvas) {
      hash = this.fnvHash(imageData);
    }
    return hash;
  };

  // https://github.com/51Degrees/Renderer/blob/master/renderer.js
  this.hashImage3d = function() {

  };

  this.getBenchmarkCPU = function() {

  };

  this.performance = function() {
    return 'performance' in window
        ? window.performance.now()
        : (new Date).getTime();
  };

  this.getDeviceMemory = function() {
    return 'deviceMemory' in navigator ? navigator.deviceMemory : null;
  };

  this.info = function() {
    return {
      useragent: navigator.userAgent,
      width: this.getWidth(),
      height: this.getHeight(),
      ratio: this.getRatio(),
      ram: this.getDeviceMemory(),
      gpu: this.getGPU(),
      colorDepth: screen.colorDepth,
      cpuCores: navigator.hardwareConcurrency,
      gpuBenchmark: this.getBenchmarkGPU(),
      cpuBenchmark: this.getBenchmarkCPU(),
    };
  };

}




