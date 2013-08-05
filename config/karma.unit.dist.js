module.exports = function(config) {
  config.set({

    basePath: '../',

    frameworks: ['jasmine' ],

    files: [
      'lib/**/*.js',
      'test/lib/**/*.js',
      'dist/*.js',
      'test/unit/testabilityPatch.js',
      'test/unit/dataDepend/*Spec.js'
    ],

    browsers: [ "Chrome" ], // "PhantomJS", "Firefox", "Chrome"

    autoWatch: true,

    reporters: [ 'progress', 'junit' ],
    
    junitReporter: {
      outputFile: 'build/test-reports/js-unit.xml',
      suite: 'unit-dist'
    },

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-phantomjs-launcher',
      'karma-jasmine',
      'karma-junit-reporter'
    ]
  });
};