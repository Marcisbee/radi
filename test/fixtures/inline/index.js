module.exports = function ({ r, mount, component }) {
  var template = r('div', 'Hello World');

  return template.outerHTML;
};
