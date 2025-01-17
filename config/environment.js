/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'hospitalrun',
    environment: environment,
    baseURL: '/',
    locationType: 'hash', //Auto incompatible with google login right now
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    'simple-auth': {

    }
  };

ENV.APP.manifest = {
  enabled: true,
  appcacheFile: "/manifest.appcache",
  excludePaths: ['index.html', 'someother.html'],
  includePaths: ['/'],
  network: ['api/'],
  showCreateDate: true
};

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
      
    ENV.contentSecurityPolicy = {
      'default-src': "'none'",
      'script-src': "'self' 'unsafe-inline'",
      'font-src': "'self'",
      'connect-src': "'self'",
      'img-src': "'self' data:",
      'style-src': "'self' 'unsafe-inline'",
      'media-src': "'self'"
    };      
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';

    ENV['simple-auth'].store = 'simple-auth-session-store:ephemeral';
  }

  if (environment === 'production') {

  }

ENV.manifest = {
  enabled: true,
  appcacheFile: "/manifest.appcache",
  excludePaths: ['index.html', 'tests', 'dymo','robots.txt','testem.js'],
  //includePaths: ['/'],
  showCreateDate: true
};

  return ENV;
};
