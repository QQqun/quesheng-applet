module.exports = {
	transpileDependencies: ['uview-ui'],
	productionSourceMap: false,
	parallel: require('os').cpus().length > 1,
}
