/**
 * Convert Markdown to HTML string.
 *
 * @param {string} str
 */
export default function tinyMarkdown(str) {
	// \n\n => <p>
	str = str
		.trim()
		.split('\n\n')
		.filter(s => s.length > 0)
		.map(s => "<p>" + s + "</p>")
		.join('');

	// \n => <br/>
	str = str.replace(/\n/gi, "<br/>");

	// *bold* => <b>bold</b>
	str = str.replace(/\*.*?\*/g, function(foo){
		return "<b>"+foo.slice(1, -1)+"</b>";
	});

	// _italic_ => <i>italic</i>
	str = str.replace(/_.*?_/g, function(foo){
		return "<i>"+foo.slice(1, -1)+"</i>";
	});

	// [button] => <btn>button</btn>
	str = str.replace(/\[(?:(?!\[).)*?\](?!\()/g, function(foo){
		return "<btn>"+foo.slice(1, -1)+"</btn>";
	});

	// hyperlinks [url text](www.test.com) => <a href="http://www.test.com">url text</a>
	str = str.replace(/(\[(?:(?!\[).)*?\])(\((?:(?!\().)*?\))/g, function(all, fst, sec, pos){
		var url = sec.slice(1, -1);
		if (url.indexOf("http") != 0) url = "http://" + url;
		var txt = fst.slice(1, -1);
		return '<a href="' + url + '">' + txt + '</a>';
	});

	return str;
}