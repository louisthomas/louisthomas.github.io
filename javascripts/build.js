({
    baseUrl             : '.',
    include             : ['require.js', 'config.js'],
    paths: {
        'streamsense'   : 'empty:',
        'ima3.sdk'      : 'empty:',
        'videojs.ima3'  : 'empty:'
    },
    name                : "main",
    out                 : "main-built.js",
    namespace           : 'bui',

    preserveLicenseComments:  false
})