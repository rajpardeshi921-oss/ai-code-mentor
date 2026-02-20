/**
 * Sample Test File for AI Code Mentor
 * 
 * This file contains intentional bugs and issues to demonstrate
 * the AI Code Mentor extension functionality.
 */

// Bug 1: Potential null reference error
function greetUser(name) {
  console.log("Hello, " + name.toUpperCase());
}

greetUser(null); // This will throw an error

// Bug 2: Off-by-one error in loop
function sumArray(numbers) {
  let sum = 0;
  for (let i = 0; i <= numbers.length; i++) { // Should be i < numbers.length
    sum += numbers[i];
  }
  return sum;
}

// Security Issue: SQL Injection vulnerability
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId; // SQL injection risk
  return query;
}

// Readability Issue: Complex nested conditions
function checkAccess(user) {
  if (user) {
    if (user.role) {
      if (user.role === 'admin' || user.role === 'moderator') {
        if (user.isActive) {
          return true;
        }
      }
    }
  }
  return false;
}

// Performance Issue: Inefficient algorithm
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) { // O(n²) complexity
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// Maintainability Issue: No error handling
async function fetchData(url) {
  const response = await fetch(url); // No try-catch
  return response.json();
}

// Magic numbers
function calculateDiscount(price) {
  if (price > 100) {
    return price * 0.15; // What does 0.15 represent?
  }
  return price * 0.05; // What does 0.05 represent?
}

console.log("Sample test file loaded");
