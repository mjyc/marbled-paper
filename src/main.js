import * as util from './util'
import palette from './palette.js'
import vertexSource from './marble.vert'
import fragmentSource from './marble.frag'

import loop from 'raf-loop'
import drawTriangle from 'a-big-triangle'
import createShader from 'gl-shader'
import createTexture from 'gl-texture2d'
import createFBO from 'gl-fbo'
import { vec2 } from 'gl-matrix'
import ControlKit from 'controlkit'
import Stats from 'stats.js'
import shuffle from 'lodash.shuffle'

const viscosity = 5
const maxOperations = 32

const stats = new Stats()

window.debugOptions = {
  showStats: () => {
    stats.showPanel(1)
    document.body.appendChild(stats.dom)
  },
  background: true,
  foreground: true,
}

const options = {
  operationPalette: ['drop-small', 'drop-large', 'spray-small', 'spray-large', 'comb-small', 'comb-large', 'smudge'],
  colorPalette: palette,
}

options.color = options.colorPalette[1]
options.operation = options.operationPalette[0]

const controls = new ControlKit()
const panel = controls.addPanel({ width: 250 })
panel.addSelect(options, 'operationPalette', { label: 'Tool', target: 'operation' })
panel.addColor(options, 'color', { label: 'Color', colorMode: 'hex', presets: 'colorPalette', })
panel.addButton('reset', clearCanvas)
panel.addButton('info', () => {
  window.location.href = 'https://glitch.com/~marbled-paper'
})

let mouse = vec2.create()
let isMouseDown = false
let operations = []

const canvas = document.querySelector('#render-canvas')
const bounds = canvas.getBoundingClientRect()
const gl = util.getGLContext(canvas)

canvas.width = 1024
canvas.height = 1024

const shader = createShader(gl, vertexSource, fragmentSource)
shader.bind()
shader.uniforms.operationCount = operations.length
shader.uniforms.resolution = [canvas.width, canvas.height]

const fbos = [
  createFBO(gl, [canvas.width, canvas.height], { depth: false }),
  createFBO(gl, [canvas.width, canvas.height], { depth: false })
]

let fboIndex = 0

const emptyTexture = createTexture(gl, [canvas.width, canvas.height])

clearCanvas()

function createOperation() {
  return {
    type: -1,
    color: [0, 0, 0, 0],
    start: [0, 0],
    end: [0, 0],
    scale: 0,
  }
}

function shiftOperations() {
  const op = operations.pop()
  operations.unshift(op)

  background.swap()
  background.frameBuffer.bind()
  shader.uniforms.backgroundTexture = previous.color[0].bind()
  shader.uniforms.operationCount = 1
  shader.uniforms.operations = operations
  drawTriangle(gl)

  return op
}

function addDrop(start, scale) {
  const op = shiftOperations()
  op.type = 0
  op.color = util.toFloatColor(options.color)
  op.start = [...start]
  op.end = [...start]
  op.end[0] += scale
  op.scale = 0
  return op
}

function addComb(start, scale) {
  const op = shiftOperations()
  op.type = 1
  op.color = util.toFloatColor(options.color)
  op.start = [...start]
  op.end = [...start]
  op.scale = scale
  return op
}

function clearCanvas() {
  const palette = shuffle(options.colorPalette)
  options.color = palette[1]

  gl.clearColor(...util.toFloatColor(palette[0]))
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT)

  fbos[0].bind()
  gl.clear(gl.COLOR_BUFFER_BIT)
  fbos[1].bind()
  gl.clear(gl.COLOR_BUFFER_BIT)

  for (let i = 0; i < maxOperations; i++) {
    operations[i] = createOperation()
  }
}

canvas.addEventListener('mousedown', () => {
  if (event.button !== 0) {
    isMouseDown = false
    return
  }

  const position = util.getPositionInBounds(bounds, mouse)

  if (options.operation === 'drop-small') {
    addDrop(position, util.randomInRange(0.025, 0.1))
  } else if (options.operation === 'drop-large') {
    addDrop(position, util.randomInRange(0.1, 0.2))
  } else if (options.operation === 'comb-small') {
    addComb(position, util.randomInRange(0.1, 0.3))
  } else if (options.operation === 'comb-large') {
    addComb(position, util.randomInRange(0.3, 0.6))
  } else if (options.operation === 'smudge') {
    addComb(position, 0)
  }

  isMouseDown = true
})

document.addEventListener('mousemove', () => {
  mouse[0] = event.clientX
  mouse[1] = event.clientY

  if (isMouseDown) {
    const op = operations[0]
    const position = util.getPositionInBounds(bounds, mouse)

    if (options.operation === 'comb-small') {
      op.end = position
    } else if (options.operation === 'comb-large') {
      op.end = position
    } else if (options.operation === 'smudge') {
      op.end = position
    }
  }
})

document.addEventListener('mouseup', () => {
  isMouseDown = false
})

const engine = loop(() => {
  if (isMouseDown) {
    const position = util.getPositionInBounds(bounds, mouse)
    const offset = vec2.random(vec2.create(), Math.random())

    if (options.operation === 'spray-small') {
      vec2.scaleAndAdd(position, position, offset, 0.1)
      addDrop(position, util.randomInRange(0.005, 0.015))
    } else if (options.operation === 'spray-large') {
      vec2.scaleAndAdd(position, position, offset, 0.3)
      addDrop(position, util.randomInRange(0.01, 0.02))
    }
  }

  for (let op of operations) {
    if (op.type === 0) {
      op.scale += (1 - op.scale) / viscosity
    }
  }

  stats.begin()
  util.unbindFBO(gl)
  shader.uniforms.backgroundTexture = window.debugOptions.background ? fbos[fboIndex].color[0].bind() : emptyTexture.bind()
  shader.uniforms.operationCount = window.debugOptions.foreground ? operations.length : 0
  shader.uniforms.operations = operations
  drawTriangle(gl)
  stats.end()
})

engine.start()
