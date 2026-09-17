export function getPasswordRequirements(password = '', confirmPassword = '') {
  return [
    {
      id: 'length',
      label: 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'Uppercase letter',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'Lowercase letter',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'Number',
      valid: /\d/.test(password),
    },
    {
      id: 'symbol',
      label: 'Special character',
      valid: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: 'match',
      label: 'Passwords match',
      valid: Boolean(password) && Boolean(confirmPassword) && password === confirmPassword,
    },
  ];
}

export function validateStrongPassword(password = '', confirmPassword = '') {
  const requirements = getPasswordRequirements(password, confirmPassword);
  const unmet = requirements.filter((rule) => !rule.valid);

  if (!password || !confirmPassword) {
    return {
      valid: false,
      message: 'Please fill in all password fields.',
      requirements,
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long.',
      requirements,
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one uppercase letter.',
      requirements,
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one lowercase letter.',
      requirements,
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one number.',
      requirements,
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one special character.',
      requirements,
    };
  }

  if (password !== confirmPassword) {
    return {
      valid: false,
      message: 'Password confirmation does not match the new password.',
      requirements,
    };
  }

  return {
    valid: unmet.length === 0,
    message: 'Password meets the system requirements.',
    requirements,
  };
}
