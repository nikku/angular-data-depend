module.exports = function(grunt) {

  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      main: {
        files: {
          'dist/dataDepend.min.js': [ 'src/dataDepend.js' ]
        }
      }
    },

    watch: {
      scripts: {
        files: [ 'src/*.js', 'src/**/*.js' ],
        tasks: [ 'uglify' ],
      }
    },

    karma: {
      unit: {
        configFile: 'config/karma.unit.js',
      },
      single: {
        configFile: 'config/karma.unit.js',
        singleRun: true,
        browsers: [ 'PhantomJS' ]
      },
      singleDist: {
        configFile: 'config/karma.unit.dist.js',
        singleRun: true,
        browsers: [ 'PhantomJS' ]
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-contrib-watch');

  // default task: minify sources and publish to ./build
  grunt.registerTask( 'default', [ 'dist' ]);

  // travis task
  grunt.registerTask('travis', [ 'default' ]);

  // test task
  grunt.registerTask( 'test-single', [ 'karma:single' ]);

  grunt.registerTask( 'dist', [ 'uglify', 'karma:singleDist' ]);
};