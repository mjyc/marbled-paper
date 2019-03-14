import createFBO from 'gl-fbo'

export default class Background {
  constructor(gl, width, height) {
    this.index = 0
    this.fbos = [
      createFBO(gl, [width, height], { depth: false }),
      createFBO(gl, [width, height], { depth: false })
    ]
  }
  
  get texture() {
    return this.fbos[this.index].color[0]
  }
  
  get frameBuffer() {
    return this.fbos[(this.index + 1) % 2]
  }
  
  swap() {
    this.index ^= 1
  }
}
