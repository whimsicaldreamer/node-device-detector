// This file is used on your site to get some device metrics

function DeviceCollector() {

  const isPerformance = 'performance' in window;
  let canvas = document.createElement('canvas');
  let gl;

  if (!gl) {
    try {
      gl = canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl');
    } catch (e) {}
  }

  let hints = {};
  if (navigator.userAgentData) {
    hints = [
      'brands',
      'mobile',
      'platform',
      'platformVersion',
      'architecture',
      'bitness',
      'wow64',
      'model',
      'uaFullVersion',
      'fullVersionList'];

    navigator.userAgentData.getHighEntropyValues(hints).then((result) => {
      hints = JSON.parse(JSON.stringify(result));
    })
  }

  /** #################################
   *  private helper methods
   * ################################# */

  /**
   * get fnv hash for string
   * @param {string} str
   * @returns {number}
   */
  function fnvHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; ++i) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
  }

  /**
   * get gpu name
   * @returns {string|null}
   */
  function getGPUName() {
    return gl
        ? gl.getParameter(gl.getExtension(
            'WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)
        : null;
  }

  /**
   * get device pixel ratio
   */
  function getRatio() {
    return window.devicePixelRatio;
  }

  /**
   * get device width of the screen in pixels
   */
  function getWidth() {
    return window.screen.width * getRatio();
  }

  /**
   * get device height of the screen in pixels
   */
  function getHeight() {
    return window.screen.height * getRatio();
  }
  /**
   * get check is ua apply
   * @return {boolean}
   */
  function isAppleFamily() {
    return /iPhone|iPad|Macintosh|Ipod/.exec(navigator.userAgent) !== null;
  }

  /**
   * get timer stamp
   * @return {DOMHighResTimeStamp|number}
   */
  function performance() {
    return isPerformance ? window.performance.now() : (new Date).getTime();
  }

  /**
   * get device memory
   * @return {number|null}
   */
  function getDeviceMemory() {
    return navigator.deviceMemory ? navigator.deviceMemory : null;
  }

  /**
   * Determines if the query is supported by the device.
   * @param {string} query
   * @returns {boolean}
   */
  function hasMediaSupport(query) {
    return window.matchMedia(query).matches;
  }

  function getMediaValue(name, values) {
    for (let i = 0; i < values.length; i++) {
      if (hasMediaSupport('(' + name + ': ' + values[i] + ')')) {
        return values[i];
      }
    }
    return '';
  }

  function getMediaColorGamut() {
    return getMediaValue('color-gamut', ['p3', 'srgb']);
  }

  /** #################################
   *  private metrics methods
   * ################################# */

  function getHashC() {
    function calculate(num, timeLimit = 200, steps = 9) {
      let r = 0;
      for (let sec, c, l = 0, a = Math.ceil(1e3 * num), d = (16384 < a &&
      (a = 16384, num = 16.384), new Uint32Array(a)), o = 0; o < steps; o++) {
        for (sec = performance(), c = 0; c <
        1e3; c++) window.crypto.getRandomValues(d);
        if (l += sec = performance() - sec, (0 === o || sec < r) &&
        (r = sec), 3 <= o && timeLimit < l) break;
      }
      return parseFloat((r / num).toFixed(3));
    }

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

    function hashOperation() {
      if (!('crypto' in window)) {
        return -1;
      }
      let operations;
      let timeLimit = 200, firstTime = performance(),
          e = calculate(.5, timeLimit, 9);
      timeLimit -= performance() - firstTime, e < 20 &&
      (e = calculate(20 / e, timeLimit, 30)), operations = e;
      return operations;
    }

    function hashMatrix() {
      if (isAppleFamily()) {
        let sec = performance();
        makeMatrix();
        return performance() - sec;
      }
      let sec = performance();
      makeMatrix(512);
      return performance() - sec;
    }

    return [hashOperation(), hashMatrix()].reduce(
        (prev, cursor) => prev + cursor, 0).toFixed(3);
  }

  function getHashG() {

    function hashImage() {
      function drawImage(canvas) {
        canvas.width = 67;
        canvas.height = 67;
        let ctx = canvas.getContext('2d', {
          alpha: true, textBaseline: 'top',
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
        hash = fnvHash(imageData);
      }
      return hash;
    }

    function hashImage3d() {
      // The 'mat4' object is created from code in the gl-matrix library: https://github.com/toji/gl-matrix
      var gl, program, canvas;

      // The non-minified versions of these shaders are available in
      // WebSite/partials/fragment-shader.glsl and
      // WebSite/partials/vertex-shader.glsl
      var VERTEX_SHADER = 'attribute vec3 c,d; uniform vec4 e; uniform vec3 f,g;uniform mat4 h,i;varying vec3 j;void main(){vec3 a=normalize(d);vec4 b=h*vec4(c,1.);vec3 k=normalize(vec3(e-b));j=g*f*max(dot(k,a),0.),gl_Position=i*vec4(c,1.);}';
      var FRAGMENT_SHADER = '#ifdef GL_ES\n' + 'precision mediump float;\n' +
          '#endif\n' + 'varying vec3 j;void main(){gl_FragColor = vec4(j, 1.0);}';
      // This object uses code from the gl-matrix library: https://github.com/toji/gl-matrix
      var mat4 = {
        create: function() {
          var result = new Array(16);
          for (var i = 0; i < 16; i++) {
            result[i] = (i % 5 == 0 ? 1 : 0);
          }
          return result;
        }, perspective: function(out, fovy, aspect, near, far) {
          var f = 1.0 / Math.tan(fovy / 2), nf;
          out[0] = f / aspect;
          out[1] = 0;
          out[2] = 0;
          out[3] = 0;
          out[4] = 0;
          out[5] = f;
          out[6] = 0;
          out[7] = 0;
          out[8] = 0;
          out[9] = 0;
          out[11] = -1;
          out[12] = 0;
          out[13] = 0;
          out[15] = 0;
          if (far != null && far !== Infinity) {
            nf = 1 / (near - far);
            out[10] = (far + near) * nf;
            out[14] = (2 * far * near) * nf;
          } else {
            out[10] = -1;
            out[14] = -2 * near;
          }
          return out;
        }, lookAt: function(out, eye, center, up) {
          var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
          var eyex = eye[0];
          var eyey = eye[1];
          var eyez = eye[2];
          var upx = up[0];
          var upy = up[1];
          var upz = up[2];
          var centerx = center[0];
          var centery = center[1];
          var centerz = center[2];

          if (Math.abs(eyex - centerx) < 0.000001 && Math.abs(eyey - centery) <
              0.000001 && Math.abs(eyez - centerz) < 0.000001) {
            return mat4.identity(out);
          }

          z0 = eyex - centerx;
          z1 = eyey - centery;
          z2 = eyez - centerz;

          len = 1 / Math.hypot(z0, z1, z2);
          z0 *= len;
          z1 *= len;
          z2 *= len;

          x0 = upy * z2 - upz * z1;
          x1 = upz * z0 - upx * z2;
          x2 = upx * z1 - upy * z0;
          len = Math.hypot(x0, x1, x2);
          if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
          } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
          }

          y0 = z1 * x2 - z2 * x1;
          y1 = z2 * x0 - z0 * x2;
          y2 = z0 * x1 - z1 * x0;

          len = Math.hypot(y0, y1, y2);
          if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
          } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
          }

          out[0] = x0;
          out[1] = y0;
          out[2] = z0;
          out[3] = 0;
          out[4] = x1;
          out[5] = y1;
          out[6] = z1;
          out[7] = 0;
          out[8] = x2;
          out[9] = y2;
          out[10] = z2;
          out[11] = 0;
          out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
          out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
          out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
          out[15] = 1;

          return out;
        }, multiply: function(out, a, b) {
          var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
          var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
          var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
          var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

          var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
          out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
          out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
          out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
          out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

          b0 = b[4];
          b1 = b[5];
          b2 = b[6];
          b3 = b[7];
          out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
          out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
          out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
          out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

          b0 = b[8];
          b1 = b[9];
          b2 = b[10];
          b3 = b[11];
          out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
          out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
          out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
          out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

          b0 = b[12];
          b1 = b[13];
          b2 = b[14];
          b3 = b[15];
          out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
          out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
          out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
          out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
          return out;
        }, identity: function(out) {
          out[0] = 1;
          out[1] = 0;
          out[2] = 0;
          out[3] = 0;
          out[4] = 0;
          out[5] = 1;
          out[6] = 0;
          out[7] = 0;
          out[8] = 0;
          out[9] = 0;
          out[10] = 1;
          out[11] = 0;
          out[12] = 0;
          out[13] = 0;
          out[14] = 0;
          out[15] = 1;
          return out;
        },
      };

      function initVertexBuffers(gl) {
        var latitudeBands = 50;
        var longitudeBands = 50;
        var radius = 2;

        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];
        var indexData = [];

        var latNumber, longNumber;

        // Calculate sphere vertex positions, normals, and texture coordinates.
        for (latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
          var theta = latNumber * Math.PI / latitudeBands;
          var sinTheta = Math.sin(theta);
          var cosTheta = Math.cos(theta);

          for (longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;

            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);

            textureCoordData.push(u);
            textureCoordData.push(v);
          }
        }

        // Calculate sphere indices.
        for (latNumber = 0; latNumber < latitudeBands; ++latNumber) {
          for (longNumber = 0; longNumber < longitudeBands; ++longNumber) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;

            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
          }
        }

        vertexPositionData = new Float32Array(vertexPositionData);
        normalData = new Float32Array(normalData);
        textureCoordData = new Float32Array(textureCoordData);
        indexData = new Uint16Array(indexData);

        // Create buffer objects.
        var vertexPositionBuffer = gl.createBuffer();
        var vertexNormalBuffer = gl.createBuffer();
        var indexBuffer = gl.createBuffer();

        // Write the vertex positions to their buffer object.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexPositionData, gl.STATIC_DRAW);

        // Assign position coords to attrib and enable it.
        var VertexPosition = gl.getAttribLocation(program, 'c');
        gl.vertexAttribPointer(VertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(VertexPosition);

        // Write the normals to their buffer object.
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);

        // Assign normal to attrib and enable it.
        var VertexNormal = gl.getAttribLocation(program, 'd');
        gl.vertexAttribPointer(VertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(VertexNormal);

        // Pass index buffer data to element array buffer.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

        return indexData.length;
      }

      function generate() {
        if (!(gl = getRenderingContext())) return;

        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, VERTEX_SHADER);
        gl.compileShader(vertexShader);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, FRAGMENT_SHADER);
        gl.compileShader(fragmentShader);
        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.useProgram(program);

        // Init vertex buffers (position, color, and index data).
        var n = initVertexBuffers(gl);

        // Set up clear color and enable depth testing.
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        // Create projection matrix.
        var projection = mat4.create();
        mat4.perspective(projection, Math.PI / 6, 1.0, 0.1, 100.0);

        // Create model-view matrix.
        var modelView = mat4.create();
        mat4.lookAt(modelView, [0.0, 0.0, 10.0], [0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0]);

        // Multiply the projection matrix by the model-view matrix to create the mvpMatrix.
        var mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, projection, modelView);

        // Pass the modelView matrix into the shader.
        var ModelViewMatrix = gl.getUniformLocation(program, 'h');
        gl.uniformMatrix4fv(ModelViewMatrix, false, modelView);

        // Pass the mvp matrix into the shader.
        var MVP = gl.getUniformLocation(program, 'i');
        gl.uniformMatrix4fv(MVP, false, mvpMatrix);

        // Pass the light position into the shader.
        var LightPosition = gl.getUniformLocation(program, 'e');
        gl.uniform4fv(LightPosition, [10.0, 10.0, 10.0, 1.0]);

        // Pass the material diffuse color into the shader.
        var Kd = gl.getUniformLocation(program, 'f');
        gl.uniform3fv(Kd, [0.9, 0.5, 0.3]);

        // Pass the light diffuse color into the shader.
        var Ld = gl.getUniformLocation(program, 'g');
        gl.uniform3fv(Ld, [1.0, 1.0, 1.0]);

        // Clear & draw.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

        cleanup();
        return canvas.toDataURL();
      }

      function cleanup() {
        gl.useProgram(null);
        if (program) gl.deleteProgram(program);
      }

      function getRenderingContext() {
        canvas.width = 67;
        canvas.height = 67;
        var gl = canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');
        if (gl) {
          gl.viewport(0, 0, 67, 67);
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        return gl;
      }

      var imageHash = 0;
      canvas = document.createElement('canvas');
      if (canvas != null) {
        // Get the image data as a string.
        var imageData = generate();
        if (imageData) {
          // Hash the image data.
          imageHash = fnvHash(imageData);
        }
      }
      return imageHash;
    }

    return [
      hashImage(),
      hashImage3d()
    ].reduce((prev, cursor) => prev + cursor, 0).toString();
  }

  /** #################################
   *  public methods
   * ################################# */

  this.info = function() {
    return  {
      useragent: navigator.userAgent,
      width: getWidth(),
      height: getHeight(),
      ratio: getRatio(),
      ram: getDeviceMemory(),
      gpu: getGPUName(),
      colorDepth: screen.colorDepth,
      gamut: getMediaColorGamut(),
      cores: navigator.hardwareConcurrency,
      hashG: getHashG(),
      hashC: getHashC(),
      hints: hints,
    };
  };

}
