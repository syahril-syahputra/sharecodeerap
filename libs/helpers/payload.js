const payload = (req) => {

	let data = {};
	Object.assign(data, req.body, req.params);
	return data;

}

module.exports = payload;