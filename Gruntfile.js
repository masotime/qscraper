var grunt = require('grunt');

grunt.initConfig({
  jshint: {
    all: ['lib/**/*.js'],
    options: {
        jshintrc: '.jshintrc'
    }

  }
});

grunt.loadNpmTasks('grunt-contrib-jshint');