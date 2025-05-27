const generatePin = {
    random: (lowerBound, upperBound) => {
        return Math.floor(lowerBound + (upperBound - lowerBound) * Math.random());
    }
}
module.exports = generatePin;