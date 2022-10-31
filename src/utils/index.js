let clearDuplicate = (arr, key) => Array.from(new Set(arr.map(e => e[key]))).map(e => arr.findIndex(x => x[key] == e)).map(e => arr[e])

module.exports = {
  clearDuplicate
}