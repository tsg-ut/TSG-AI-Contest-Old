var privateVars = 'secret';

(function() {
	var privateVars = undefined;
	var badCode = 'console.log(privateVars);';
	
	console.log('bad code:');
	eval(badCode);
})();

console.log('global:');
console.log(privateVars);
