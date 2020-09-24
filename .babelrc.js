module.exports = {
    "presets": [
        [
            "@babel/preset-env", {
                "useBuiltIns": "usage",
                "corejs": "2",
            }
        ]
    ],
    "plugins": ["transform-vue-tsx",  "@babel/plugin-syntax-dynamic-import", 
        [
            "import",
            {
                "libraryName": "sinosun-ui",
                "libraryDirectory": "lib",
                "customName": name => {
                    const prefix = "sn-";
                    if (name === 'sn-date-time-picker') {
                        return 'sinosun-ui/lib/datetime-picker';
                    } else if (name === 'sn-date-time-picker-view') {
                        return 'sinosun-ui/lib/datetime-picker-view';
                    } else if (name.indexOf(prefix) > -1) {
                        return `sinosun-ui/lib/${name.split(prefix)[1]}`;
                    }
                    return "";
                }
            },
            "sinosun-ui"
        ] 
    ]
}