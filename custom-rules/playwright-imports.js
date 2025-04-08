// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const resolveFrom = require('resolve-from');

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
        // Get the project root
        const projectRoot = context.getCwd();

        // Ignore files outside '_playwright-tests' folder
        if (!currentFilePath.includes('_playwright-tests/')) {
          return;
        }

        switch (importSource.startsWith('.')) {
          case true:
            {
              const resolvedImportPath = path.resolve(currentDir, importSource);

              // Resolve the absolute path of the import
              const relativeToRoot = path.relative(projectRoot, resolvedImportPath);

              // Check if local import is coming from an allowed directory
              if (!relativeToRoot.startsWith('_playwright-tests/')) {
                context.report({
                  loc: {
                    start: { line: node.loc.start.line, column: 0 },
                    end: { line: node.loc.end.line, column: Number.POSITIVE_INFINITY },
                  },
                  message: `Imports from outside the '_playwright-tests' directory are not allowed.`,
                });
              }
            }
            break;
          case false:
            try {
              // Resolve the absolute path of the import
              const resolvedImportPath = resolveFrom(currentDir, importSource);
              const importDir = path.dirname(resolvedImportPath);

              if (
                importDir.includes('node_modules') ||
                importDir.includes('_playwright-tests') ||
                importDir === '.'
              ) {
                break;
              }

              context.report({
                loc: {
                  start: { line: node.loc.start.line, column: 0 },
                  end: { line: node.loc.end.line, column: Number.POSITIVE_INFINITY },
                },
                message: `Imports from outside the '_playwright-tests' directory are not allowed.`,
              });
            } catch {
              if (importSource.startsWith('test-utils')) {
                break;
              }

              try {
                const srcImportSource = `src/${importSource}`;
                const relativeToRoot = path.relative(projectRoot, srcImportSource);

                if (!relativeToRoot.startsWith('_playwright-tests/')) {
                  context.report({
                    loc: {
                      start: { line: node.loc.start.line, column: 0 },
                      end: { line: node.loc.end.line, column: Number.POSITIVE_INFINITY },
                    },
                    message: `Imports from outside the '_playwright-tests' directory are not allowed.`,
                  });
                }
              } catch {
                return;
              }
              break;
            }
            break;
          default:
            break;
        }
      },
    };
  },
};
