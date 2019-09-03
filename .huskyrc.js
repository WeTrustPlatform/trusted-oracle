module.exports = {
  hooks: {
    'pre-commit': 'lint-staged',
    'post-merge': 'yarnhook',
    'post-rebase': 'yarnhook',
    'post-checkout': 'yarnhook',
  },
};
