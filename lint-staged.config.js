module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --max-warnings=0',
    () => 'tsc --noEmit -p tsconfig.lint-staged.json',
  ],
  '*.{js,jsx,ts,tsx,css,scss,md}': ['prettier --write'],
};
