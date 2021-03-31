/* eslint-disable no-undef */
var fs = require("fs");

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    copy: {
      all: {
        expand: true,
        cwd: "src/",
        src: ["**"],
        dest: "dist/",
      },
    },

    concat: {
      vendor_js: {
        src: [
          "node_modules/jquery/dist/jquery.js",
          "node_modules/bootstrap/dist/js/bootstrap.js",
          "node_modules/dayjs/dayjs.min.js",
        ],
        dest: "dist/vendor.js",
      },
      vendor_css: {
        src: [
          "node_modules/bootstrap/dist/css/bootstrap.css",
          "vendor/font-awesome.css",
        ],
        dest: "dist/vendor.css",
      },
    },

    uglify: {
      all: {
        files: {
          "dist/gdp.js": "dist/gdp.js",
          "dist/vendor.js": "dist/vendor.js",
        },
      },
    },

    watch: {
      scripts: {
        files: ["gruntfile.js", "src/**"],
        tasks: ["copy", "concat"],
        options: {
          spawn: false,
        },
      },
    },

    writefile: {
      all: {
        src: "_templates/auth.hbs",
        dest: "dist/data/auth.txt",
      },
    },

    prompt: {
      auth: {
        options: {
          questions: [
            {
              config: "writefile.options.data.username",
              type: "input",
              message: "ActiveNet Username?",
            },
            {
              config: "writefile.options.data.password",
              type: "password",
              message: "ActiveNet Password?",
            },
          ],
          then: function () {
            grunt.task.run("writefile");
            fs.mkdir("dist/cache", "0777", () => {});
          },
        },
      },
    },
  });

  /* Load Tasks */
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-writefile");
  grunt.loadNpmTasks("grunt-prompt");

  /* Set Task Shortcuts */
  grunt.registerTask("build", ["copy", "concat"]);
  grunt.registerTask("auth", function () {
    if (!grunt.file.exists("dist/data/auth.txt")) grunt.task.run("prompt:auth");
  });
  grunt.registerTask("msg", function () {
    grunt.log.writeln(
      'Upload contents of "dist" directory to HTTP server.\n' +
        ' Ensure that "cache" directory is given 777 permissions.'
    );
  });

  grunt.registerTask("default", ["build", "uglify", "auth", "msg"]);
};
