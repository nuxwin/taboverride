/*jslint node: true */
/*jshint node: true */

'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            output: ['build/output'],
            docs: ['docs']
        },
        concat: {
            options: {
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.homepage %>\n' +
                    '(c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> | <%= pkg.licenses[0].url %> */\n\n' +
                    '/**\r\n' +
                    ' * @fileOverview <%= pkg.name %>\n' +
                    ' * @author       <%= pkg.author.name %>\n' +
                    ' * @version      <%= pkg.version %>\n' +
                    ' */\n\n',
                separator: ''
            },
            umd: {
                src: ['build/fragments/umd-pre.js', 'src/taboverride.js', 'build/fragments/umd-post.js'],
                dest: 'build/output/taboverride.js'
            },
            cjs: {
                src: ['build/fragments/cjs-pre.js', 'src/taboverride.js', 'build/fragments/cjs-post.js'],
                dest: 'build/output/taboverride.js'
            },
            amd: {
                src: ['build/fragments/amd-pre.js', 'src/taboverride.js', 'build/fragments/amd-post.js'],
                dest: 'build/output/taboverride.js'
            },
            globals: {
                src: ['build/fragments/globals-pre.js', 'src/taboverride.js', 'build/fragments/globals-post.js'],
                dest: 'build/output/taboverride.js'
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'build/output/taboverride.js',
                'test/test.js',
                'examples/js/*.js'
            ]
        },
        qunit: {
            all: ['test/index.html']
        },
        uglify: {
            options: {
                compress: true,
                mangle: true,
                preserveComments: 'some'
            },
            dist: {
                options: {
                    sourceMap: true,
                    sourceMapName: 'build/output/taboverride.min.js.map'
                },
                files: {
                    // the min file is moved to the build/output directory via a custom task
                    // this is to ensure the "file" field is set correctly in the source map
                    'build/output/taboverride.min.js': ['build/output/taboverride.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('generateBowerManifest', 'Generates the bower.json file.', function () {
        grunt.config.requires(['pkg']);

        var contents = grunt.template.process('{\n' +
                '    "name": "<%= pkg.name %>",\n' +
                '    "version": "<%= pkg.version %>",\n' +
                '    "main": "./build/output/taboverride.js"\n' +
                '}\n');

        grunt.file.write('bower.json', grunt.util.normalizelf(contents));
    });

    grunt.registerTask('normalizeLineEndings', 'Normalizes the line endings in the output file using the system default.', function () {
        var filePath = 'build/output/taboverride.js',
            contents = grunt.file.read(filePath),
            normalizedContents = grunt.util.normalizelf(contents);

        grunt.file.write(filePath, normalizedContents);
    });

    grunt.registerTask('generateAPIDocs', 'Generates API documentation using JSDoc 3.', function () {
        //grunt.task.requires(['concat:umd']);

        var done = this.async(),
            jsdoc = 'node_modules/jsdoc/jsdoc',
            cmd = jsdoc,
            args = [];

        // work around for https://github.com/joyent/node/issues/2318
        if (process.platform === 'win32') {
            cmd = 'cmd';
            args.push('/c', jsdoc.replace(/\//g, '\\'));
        }

        args.push('-d', 'docs', 'build/output/taboverride.js');

        grunt.util.spawn(
            {
                cmd: cmd,
                args: args
            },
            function (error, result) {
                if (error) {
                    grunt.log.error(result.toString());
                }
                done(!error);
            }
        );
    });

    // umd
    grunt.registerTask('default', [
        'clean:output', 'concat:umd', 'normalizeLineEndings', 'jshint', 'qunit',
        'uglify', 'generateBowerManifest', 'clean:docs', 'generateAPIDocs'
    ]);

    // cjs, amd, and globals tasks - just concat, lint, and minify, no testing or docs
    grunt.registerTask('cjs', ['clean:output', 'concat:cjs', 'normalizeLineEndings', 'jshint', 'uglify']);
    grunt.registerTask('amd', ['clean:output', 'concat:amd', 'normalizeLineEndings', 'jshint', 'uglify']);
    grunt.registerTask('globals', ['clean:output', 'concat:globals', 'normalizeLineEndings', 'jshint', 'uglify']);
};
