var fs = require('fs'),
    path = require('path');

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            dev: {
                options: {
                    style: 'expanded',
                    loadPath: [
                        'bower_components/bootstrap-sass/assets/stylesheets',
                        'bower_components/fontawesome/scss',
                    ],
                    sourcemap: 'inline'

                },
                files: {
                    'dist/css/style.css': 'src/scss/style.scss'
                },
                update: false
            },
            dist: {
                options: {
                    style: 'compressed',
                    loadPath: [
                        'bower_components/bootstrap-sass/assets/stylesheets',
                        'bower_components/fontawesome/scss'
                    ],
                    sourcemap: 'none'
                },
                files: {
                    'dist/css/style.css': 'src/scss/style.scss'
                },
                update: true
            }
        },

        watch: {
            sass: {
                files: 'src/scss/*.scss',
                tasks: ['sass:dev']
            }
        },

        uglify: {
            dist: {
                files: {
                    'dist/js/gdp.js': 'src/js/gdp-{config,utils}.js'
                }
            }
        },

        concat: {
            dist: {
                src: ['src/js/gdp-{config,utils}.js'],
                dest: 'dist/js/gdp.js'
            }
        },

        writefile: {
            auth: {
                src: 'src/data/auth.hbs',
                dest: 'dist/data/auth.txt'
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'bower_components/',
                    src: [
                        'bootstrap-sass/assets/javascripts/bootstrap.min.js',
                        'jquery/dist/jquery.min.js',
                        'moment/min/moment.min.js'
                    ],
                    dest: 'dist/js'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: ['*.html'],
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: 'php/*',
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: 'img/*',
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: 'data/{.htaccess,ActiveNetWS.xml,auth.txt}',
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'bower_components/fontawesome/',
                    src: 'fonts/*.woff*',
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'src/',
                    src: 'fonts/*',
                    dest: 'dist/'
                }]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'dist/index.html': 'dist/index.html'
                }
            }
        },

        prompt: {
            auth: {
                options: {
                    questions: [{
                        config: 'writefile.options.data.username',
                        type: 'input',
                        message: 'ActiveNet Username?'
                    }, {
                        config: 'writefile.options.data.password',
                        type: 'password',
                        message: 'ActiveNet Password?'
                    }],
                    then: function(results) {
                        grunt.task.run('dist');
                        grunt.task.run('writefile');
                        fs.mkdir('dist/cache', 0777, function(e) {});
                    }
                }
            }
        }
    });

    /* Load Tasks */
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-writefile');
    grunt.loadNpmTasks('grunt-prompt');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    /* Set Task Shortcuts */
    grunt.registerTask('dev', ['concat:dist', 'copy', 'sass:dev']);
    grunt.registerTask('dist', ['uglify:dist', 'copy', 'sass:dist', 'htmlmin']);
    grunt.registerTask('auth', function() {
        if (!grunt.file.exists('dist/data/auth.txt'))
            grunt.task.run('prompt:auth');
    });
    grunt.registerTask('msg', function() {
        grunt.log.writeln(
            'Upload contents of "dist" directory to HTTP server.\n' +
            ' Ensure that "cache" directory is given 777 permissions.'
        );
    });

    grunt.registerTask('default', ['dist', 'auth', 'msg']);
};
