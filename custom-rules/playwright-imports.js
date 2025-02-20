// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow external import for playwright tests',
    },
    schema: [],
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        // Get the source file path
        const currentFilePath = context.filename;
        const currentDir = path.dirname(currentFilePath);

        // Get the import source value
        const importSource = node.source.value;

        // Skip non-relative imports (e.g., node_modules)
        if (!importSource.startsWith('.') || !currentFilePath.includes('_playwright-tests/')) {
          return;
        }

        // Resolve the absolute path of the import
        const resolvedImportPath = path.resolve(currentDir, importSource);
        const importDir = path.dirname(resolvedImportPath);

        // Check if import is from outside the current directory
        if (path.relative(currentDir, importDir).startsWith('..')) {
          context.report({
            loc: {
              start: { line: node.loc.start.line, column: 0 },
              end: { line: node.loc.end.line, column: Number.POSITIVE_INFINITY },
            },
            message: "Imports from outside the '_playwright-tests' directory are not allowed. ",
          });
        }
      },
    };
  },
};
