module.exports = {
  extends: 'airbnb-base',
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
    HTMLHeadingElement: true,
    CSSStyleDeclaration: true,
    HTMLElement: true,
    $Radi: true,
    Node: true
  },
  rules: {
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off'
  }
};
