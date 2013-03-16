module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib');  

  grunt.initConfig({
    jst: {
      compile: {
        files: {
          "static/javascripts/templates.js": ["templates/underscore/**/*.html"]
        },
        options: {
          amd: true
        }
      }
    },
    less: {
      compile: {
        files: {
          "static/stylesheets/out.css": ["static/stylesheets/**/*.less"],
        },
      }
    },
    watch: {
      templates: {
        files: "templates/underscore/**/*.html",
        tasks: ['jst:compile'],
      },
      stylesheets: {
        files: "static/stylesheets/**/*.less",
        tasks: ['less:compile'],
      }
    }
  });

  grunt.registerTask('default', ['watch']);

};

