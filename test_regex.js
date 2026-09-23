const message = "line 1\nline 2\nline 3";
console.log(message.replace(/\\n/g, '<br>'));
console.log(message.replace(/\n/g, '<br>'));
