export default class Operations {
  constructor() {
    
  }
  
  create() {
    return {
      type: -1,
      color: [0, 0, 0, 0],
      start: [0, 0],
      end: [0, 0],
      scale: 0,
    }
  }

  shift() {
    const op = operations.pop()
    operations.unshift(op)

    background.swap()
    background.frameBuffer.bind()
    shader.uniforms.backgroundTexture = background.texture.bind()
    shader.uniforms.operationCount = 1
    shader.uniforms.operations = operations
    drawTriangle(gl)

    return op
  }

  addDrop(start, scale, color) {
    const op = this.shift()
    op.type = 0
    op.color = color
    op.start = [...start]
    op.end = [...start]
    op.end[0] += scale
    op.scale = 0
    return op
  }

  addComb(start, scale) {
    const op = this.shift()
    op.type = 1
    op.start = [...start]
    op.end = [...start]
    op.scale = scale
    return op
  }
}