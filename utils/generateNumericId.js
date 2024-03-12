const { v4: uuidv4 } = require('uuid');
const generateNumericId = (length) => {
  const uuid = uuidv4().replace(/-/g, ''); // Remove hyphens from UUID
  return uuid.slice(0, length);
}

module.exports = { generateNumericId }