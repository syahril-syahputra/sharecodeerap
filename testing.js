function processNumbers(numbers, threshold) {
    const filtered = numbers.filter(num => num > 0);

    const doubled = filtered.map(num => num * 2); // FIX: Tambah return secara implisit

    const result = doubled.find(num => num > threshold);

    return result;
}

// Example usage
const numbers = [5, -3, 10, 2, -7, 8];
console.log(processNumbers(numbers, 15));
// Should return first number > 15 after doubling positive numbers