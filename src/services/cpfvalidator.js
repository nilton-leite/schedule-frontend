import React from 'react';

function isValidCPF(cpf) {
  // Remove any non-digit characters from the CPF
  cpf = cpf.replace(/\D/g, '');

  // Check if the CPF has 11 digits
  if (cpf.length !== 11) {
    return false;
  }

  // Calculate the first verification digit
  let total = 0;
  for (let i = 0; i < 9; i++) {
    total += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let firstVerificationDigit = 11 - (total % 11);
  if (firstVerificationDigit > 9) {
    firstVerificationDigit = 0;
  }

  // Calculate the second verification digit
  total = 0;
  for (let i = 0; i < 10; i++) {
    total += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let secondVerificationDigit = 11 - (total % 11);
  if (secondVerificationDigit > 9) {
    secondVerificationDigit = 0;
  }

  // Compare calculated digits with provided digits
  return cpf.charAt(9) === String(firstVerificationDigit) && cpf.charAt(10) === String(secondVerificationDigit);
}

export default isValidCPF;
