const assert = require('assert');
const maskPII = input => input.replace(/(\d)[\d\-\s]{6,}(\d)/g, "$1••••••$2");

assert.strictEqual(maskPII('Call me at 123-456-7890'), 'Call me at 1••••••0');
console.log('maskPII test passed');
