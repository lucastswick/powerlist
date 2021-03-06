'use strict';


module.exports = function (grunt) {

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({



    watch: {
      scripts: {
        files: ['assets/javascripts/**/*.js'],
        tasks: ['concat:js'],
        options: {
          spawn: false,
          livereload: true
        },
      },

      styles: {
        files: ['assets/stylesheets/scss/**/*.scss'],
        tasks: ['sass:compile'],
        options: {
          livereload: true,
        }
      },

      html: {
        files: ['index.html'],
        options: {
          livereload: true,
        }
      },

      images: {
        files: ['assets/images/*.*'],
        tasks: ['newer:responsive_images:resize'],
        options: {
          livereload: true,
        }
      },

      grunt: {
        files: ['Gruntfile.js']
      }
    },

    connect: {
      options: {
        port: 82,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
      },
    },


    open: {
      server: {
        url: 'http://localhost:<%= connect.options.port %>'
      }
    },


    responsive_images: {
      resize: {
        options: {
          quality: 70,
          sizes: [{
            name: 'xs',
            width: 480,
          },{
            name: 'sm',
            width: 768
          },{
            name: "md",
            width: 992
          },{
            name: "lg",
            width: 1200
          },{
            name: "xl",
            width: 1600
          }]
        },
        files: [{
          expand: true,
          cwd: 'assets/images',
          src: ['**.{jpg,gif,png}'],
          dest: 'images'
        }]
      }
    },


    concat: {
      js: {
        src: ['assets/javascripts/vendor/detect-mobile-browser.js',
              'assets/javascripts/vendor/fastclick.js',
              'assets/javascripts/vendor/augment.js',
              'assets/javascripts/vendor/event-stream.js',
              'assets/javascripts/parliament/namespace.js',
              'assets/javascripts/parliament/classist.js',
              'assets/javascripts/powerlist/powerlist.js',
              'assets/javascripts/app.js'],
        dest: 'javascripts/app.js',
      }
    },


    uglify: {
      dist: {
        files: {
          'javascripts/app.min.js': ['javascripts/app.js']
        }
      }
    },


    sass: {
      compile: {
        files: {
          'stylesheets/app.css': 'assets/stylesheets/scss/app.scss'
        }
      },
    },


    cssmin: {
      dist: {
        options: {
          report: 'min'
        },
        files: {
          'stylesheets/app.min.css': [
            'stylesheets/app.css'
          ]
        }
      }
    }

  });

  grunt.registerTask('server', [
    'connect',
    // 'open',
    'watch'
  ]);

  grunt.registerTask('dev', [
    'concat:js',
    'cssmin:dist',
    'responsive_images:resize'
  ])

  grunt.registerTask('build', [
    'concat:js',
    'uglify:dist',
    'sass:compile',
    'cssmin:dist',
    'responsive_images:resize'
  ]);

  grunt.registerTask('default', ['server']);

};
