export default class Operations {
  constructor() {
    this.array = []
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
    const op = this.array.pop()
    this.array.unshift(op)
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