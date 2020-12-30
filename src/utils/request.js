export default function request(path) {
	return new Promise((resolve, reject) => {
		var xhrCallback = function(){
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if ((xhr.status === 200) || (xhr.status === 0)) {
					resolve(JSON.parse(xhr.responseText));
				} else {
					reject(xhr);
				}
			}
		};

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = xhrCallback.bind(this);

		xhr.open("GET", path, true);
		xhr.send();
	});
}