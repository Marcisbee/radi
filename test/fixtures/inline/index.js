module.exports = function ({ r, mount, component }) {
  var template = r('div#id.class', {
      style: 'color: red;',
      title: 'Title',
    },
    r('span', 'Hello World')
  );

  return template.outerHTML;
};
