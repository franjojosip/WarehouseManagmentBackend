module.exports = {

  loadModules: function() {

    require('require-dir-all')(
      __dirname + '../../', 
      {
        recursive: true,
        indexAsParent: true,
        includeFiles: /index\.js$/i
      }
    );
    console.log('[Debug]: All modules are loaded!');
  },

  loadRoutes: function(app) {

    const allRoutes = require('require-dir-all')(
      __dirname + '../../', 
      {
        recursive: true,
        indexAsParent: true,
        includeFiles: /routes\.js$/i,
        excludeDirs: /^(\utils|_helpers)$/
      }
    );

    for(const [name, route] of Object.entries(allRoutes)) {
        app.use('/' + name, route.routes);
    }
    console.log('[Debug]: All routes are loaded!')
    return allRoutes;
  }
}
  