module.exports = {
  extends: 'airbnb-base',
  parser: "babel-eslint",
  "plugins": [
    "react"
  ],
  globals: {
    document: true,
    window: true,
    describe: true,
    it: true,
    test: true,
    expect: true,
    afterAll: true,
    beforeAll: true,
    beforeEach: true,
    afterEach: true,
    DocumentFragment: true,
    HTMLDivElement: true,
    HTMLSpanElement: true,
    HTMLHeadingElement: true,
    CSSStyleDeclaration: true,
    HTMLElement: true,
    $Radi: true,
    Node: true,
    jest: true
  },
  rules: {
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-prototype-builtins': 'off',
    'no-return-assign': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'arrow-parens': 'off',
    'no-confusing-arrow': 'off',
    'func-names': 'off',
    'function-paren-newline': 'off',
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'ignore',
      },
    ],
    "react/jsx-uses-vars": "error"
  },
};
