const testData = require('./test.json')
const testEvents = require('./testEvents.json')

const mergeEvents = require('./merge-events')

const testDataBefore = JSON.stringify(testData, null, '  ')

let existingEvents = testData

mergeEvents(testEvents, testData)
const testDataAfterOne = JSON.stringify(testData, null, '  ')
mergeEvents(testEvents, testData)
const testDataAfterTwo = JSON.stringify(testData, null, '  ')

console.log(testDataBefore !== testDataAfterOne)
console.log(testDataAfterOne === testDataAfterTwo)