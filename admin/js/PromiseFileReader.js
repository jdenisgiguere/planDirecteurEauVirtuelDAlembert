//  "author": "Jahred Hope <jahredhope@gmail.com>",
// "license": "ISC",
// "repository" : "git+https://github.com/jahredhope/promise-file-reader.git"

PromiseFileReader = (function() {

    return {
        readAsDataURL: function(file) {
            if (!(file instanceof Blob)) {
                throw new TypeError('Must be a File or Blob')
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(`Error reading ${file.name}: ${e.target.result}`);
                reader.readAsDataURL(file)
            });
        },

        readAsText: function(file) {
            if (!(file instanceof Blob)) {
                throw new TypeError('Must be a File or Blob')
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(`Error reading ${file.name}: ${e.target.result}`);
                reader.readAsText(file)
            });
        },

        readAsArrayBuffer: function(file) {
            if (!(file instanceof Blob)) {
                throw new TypeError('Must be a File or Blob')
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(`Error reading ${file.name}: ${e.target.result}`);
                reader.readAsArrayBuffer(file)
            });
        }

    }
})();


