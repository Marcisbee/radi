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
    HTMLSpanElement: true,
    HTMLHeadingElement: true,
    CSSStyleDeclaration: true,
    HTMLElement: true,
    $Radi: true,
    Node: true,
  },
  rules: {
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'arrow-parens': 'off',
    'no-confusing-arrow': 'off',
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
