chrome.devtools.panels.create('Radi', '', 'panel.html', (panel) => {
  panel.onShown.addListener((window) => window.start?.());
  panel.onHidden.addListener(() => {
    chrome.devtools.inspectedWindow.eval(
      'window.__RADI_DEVTOOLS__?.record(false)',
    );
  });
});
