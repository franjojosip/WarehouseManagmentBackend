module.exports = {
  loadModules: function () {
    console.log("Load modules");
    require("require-dir-all")(__dirname + "../../", {
      recursive: true,
      indexAsParent: true,
      includeFiles: /index\.js$/i,
    });
  },

  loadRoutes: function (app) {
    const allRoutes = require("require-dir-all")(__dirname + "../../", {
      recursive: true,
      indexAsParent: true,
      includeFiles: /routes\.js$/i,
      excludeDirs: /^(\utils|_helpers)$/,
    });

    for (const [name, route] of Object.entries(allRoutes)) {
      app.use("/" + name, route.routes);
    }
    return allRoutes;
  },
};
