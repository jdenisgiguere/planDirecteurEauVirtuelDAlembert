/**
 * Created by jdgiguere on 16-10-17.
 */

var indexedArray = function(values, index) {
    this.values = values;
    this.index = 0 || index;

    this.next = function() {
        if (this.index < (this.values.length - 1)) {
            this.index = this.index + 1;
        }

        return this.values[this.index];
    };

    this.previous = function() {
        if (this.index > 0) {
            this.index = this.index - 1;
        }

        return this.values[this.index];
    };

};



