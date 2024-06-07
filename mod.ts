class SubRange {
  constructor(public low: number, public high: number) {
    this.length = 1 + high - low;
  }

  length: number;

  overlaps(range: SubRange): boolean {
    return range.low <= this.high && this.low <= range.high;
  }

  touches(range: SubRange): boolean {
    return range.low <= this.high + 1 && this.low - 1 <= range.high;
  }

  covers(range: SubRange): boolean {
    return this.low <= range.low && range.high <= this.high;
  }

  isInside(range: SubRange): boolean {
    return range.low < this.low && this.high < range.high;
  }

  isBefore(range: SubRange): boolean {
    return this.high < range.low;
  }

  add(range: SubRange): SubRange {
    return new SubRange(
      Math.min(this.low, range.low),
      Math.max(this.high, range.high),
    );
  }

  subtract(range: SubRange): SubRange[] {
    if (range.covers(this)) {
      return [];
    } else if (range.isInside(this)) {
      return [
        new SubRange(this.low, range.low - 1),
        new SubRange(range.high + 1, this.high),
      ];
    } else if (range.low <= this.low) {
      return [new SubRange(range.high + 1, this.high)];
    } else {
      return [new SubRange(this.low, range.low - 1)];
    }
  }

  toString(): string {
    return this.low == this.high
      ? this.low.toString()
      : this.low + "-" + this.high;
  }
}

class DRange {
  constructor(a?: number | DRange, b?: number) {
    this.ranges = [];
    this.length = 0;
    if (a != null) this.add(a, b);
  }

  ranges: SubRange[];
  length: number;

  private _update_length() {
    this.length = this.ranges.reduce((previous, range) => {
      return previous + range.length;
    }, 0);
  }

  add(a: number | DRange, b?: number): this {
    const _add = (subrange: SubRange) => {
      let i = 0;
      while (
        i < this.ranges.length && !subrange.touches(this.ranges[i]) &&
        this.ranges[i].isBefore(subrange)
      ) {
        i++;
      }
      const newRanges = this.ranges.slice(0, i);
      while (i < this.ranges.length && subrange.touches(this.ranges[i])) {
        subrange = subrange.add(this.ranges[i]);
        i++;
      }
      newRanges.push(subrange);
      this.ranges = newRanges.concat(this.ranges.slice(i));
      this._update_length();
    };

    if (a instanceof DRange) {
      a.ranges.forEach(_add);
    } else {
      if (b == null) b = a;
      _add(new SubRange(a, b));
    }
    return this;
  }

  subtract(a: number | DRange, b?: number): this {
    const _subtract = (subrange: SubRange) => {
      let i = 0;
      while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
        i++;
      }
      let newRanges = this.ranges.slice(0, i);
      while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
        newRanges = newRanges.concat(this.ranges[i].subtract(subrange));
        i++;
      }
      this.ranges = newRanges.concat(this.ranges.slice(i));
      this._update_length();
    };

    if (a instanceof DRange) {
      a.ranges.forEach(_subtract);
    } else {
      if (b == null) b = a;
      _subtract(new SubRange(a, b));
    }
    return this;
  }

  intersect(a: number | DRange, b?: number): this {
    const newRanges: SubRange[] = [];
    const _intersect = (subrange: SubRange) => {
      let i = 0;
      while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
        i++;
      }
      while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
        const low = Math.max(this.ranges[i].low, subrange.low);
        const high = Math.min(this.ranges[i].high, subrange.high);
        newRanges.push(new SubRange(low, high));
        i++;
      }
    };

    if (a instanceof DRange) {
      a.ranges.forEach(_intersect);
    } else {
      if (b == null) b = a;
      _intersect(new SubRange(a, b));
    }
    this.ranges = newRanges;
    this._update_length();
    return this;
  }

  index(index: number): number {
    let i = 0;
    while (i < this.ranges.length && this.ranges[i].length <= index) {
      index -= this.ranges[i].length;
      i++;
    }
    return this.ranges[i].low + index;
  }

  toString(): string {
    return "[ " + this.ranges.join(", ") + " ]";
  }

  clone(): this {
    return structuredClone(this);
  }

  numbers() {
    return this.ranges.reduce((result, subrange) => {
      let i = subrange.low;
      while (i <= subrange.high) {
        result.push(i);
        i++;
      }
      return result;
    }, [] as number[]);
  }

  subranges() {
    return this.ranges.map((subrange) => ({
      low: subrange.low,
      high: subrange.high,
      length: 1 + subrange.high - subrange.low,
    }));
  }
}

export { DRange };
