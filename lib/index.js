'use strict';
/* eslint indent: 4 */


// Private helper class
class SubRange {
    constructor(low, high) {
        this.low = low;
        this.high = high;
        this.length = 1 + high - low;
    }

    overlaps(range) {
        return !(this.high < range.low || this.low > range.high);
    }

    touches(range) {
        return !(this.high + 1 < range.low || this.low - 1 > range.high);
    }

    // Returns inclusive combination of SubRanges as a SubRange.
    add(range) {
        if (!this.touches(range)) return false;
        return new SubRange(
            Math.min(this.low, range.low),
            Math.max(this.high, range.high)
        );
    }

    // Returns subtraction of SubRanges as an array of SubRanges.
    // (There's a case where subtraction divides it in 2)
    subtract(range) {
        if (!this.overlaps(range)) return false;
        else if (range.low <= this.low && range.high >= this.high) {
            return [];
        } else if (range.low > this.low && range.high < this.high) {
            return [
                new SubRange(this.low, range.low - 1),
                new SubRange(range.high + 1, this.high)
            ];
        } else if (range.low <= this.low) {
            return [
                new SubRange(range.high + 1, this.high)
            ];
        } else {
            return [new SubRange(this.low, range.low - 1)];
        }
    }

    toString() {
        return this.low == this.high ?
            this.low.toString() : this.low + '-' + this.high;
    }

    clone() {
        return new SubRange(this.low, this.high);
    }
}


class DRange {
    constructor(a, b) {
        this.ranges = [];
        this.length = 0;
        if (a !== undefined) this.add(a, b);
    }

    _update_length() {
        this.length = this.ranges.reduce((previous, range) => {
            return previous + range.length;
        }, 0);
    }

    add(a, b) {
        var self = this;
        function _add(subrange) {
            var new_ranges = [];
            var i = 0;
            while (i < self.ranges.length && !subrange.touches(self.ranges[i])) {
                new_ranges.push(self.ranges[i].clone());
                i++;
            }
            while (i < self.ranges.length && subrange.touches(self.ranges[i])) {
                subrange = subrange.add(self.ranges[i]);
                i++;
            }
            new_ranges.push(subrange);
            while (i < self.ranges.length) {
                new_ranges.push(self.ranges[i].clone());
                i++;
            }
            self.ranges = new_ranges;
            self._update_length();
        }

        if (a instanceof DRange) {
            a.ranges.forEach(_add);
        } else {
            if (a instanceof SubRange) {
                _add(a);
            } else {
                if (b === undefined) b = a;
                _add(new SubRange(a, b));
            }
        }
        return this;
    }

    subtract(a, b) {
        var self = this;
        function _subtract(subrange) {
            var new_ranges = [];
            var i = 0;
            while (i < self.ranges.length && !subrange.overlaps(self.ranges[i])) {
                new_ranges.push(self.ranges[i].clone());
                i++;
            }
            while (i < self.ranges.length && subrange.overlaps(self.ranges[i])) {
                new_ranges = new_ranges.concat(self.ranges[i].subtract(subrange));
                i++;
            }
            while (i < self.ranges.length) {
                new_ranges.push(self.ranges[i].clone());
                i++;
            }
            self.ranges = new_ranges;
            self._update_length();
        }
        if (a instanceof DRange) {
            a.ranges.forEach(_subtract);
        } else {
            if (a instanceof SubRange) {
                _subtract(a);
            } else {
                if (b === undefined) b = a;
                _subtract(new SubRange(a, b));
            }
        }
        return this;
    }

    intersect(a, b) {
        var self = this;
        var new_ranges = [];
        function _intersect(subrange) {
            var i = 0;
            while (i < self.ranges.length && !subrange.overlaps(self.ranges[i])) {
                i++;
            }
            while (i < self.ranges.length && subrange.overlaps(self.ranges[i])) {
                var low = Math.max(self.ranges[i].low, subrange.low);
                var high = Math.min(self.ranges[i].high, subrange.high);
                new_ranges.push(new SubRange(low, high));
                i++;
            }
        }
        if (a instanceof DRange) {
            a.ranges.forEach(_intersect);
        } else {
            if (a instanceof SubRange) {
                _intersect(a);
            } else {
                if (b === undefined) b = a;
                _intersect(new SubRange(a, b));
            }
        }
        self.ranges = new_ranges;
        self._update_length();
        return this;
    }

    index(index) {
        var i = 0;
        while (i < this.ranges.length && this.ranges[i].length <= index) {
            index -= this.ranges[i].length;
            i++;
        }
        if (i >= this.ranges.length) return null;
        return this.ranges[i].low + index;
    }

    toString() {
        return '[ ' + this.ranges.join(', ') + ' ]';
    }

    clone() {
        return new DRange(this);
    }
}

module.exports = DRange;
