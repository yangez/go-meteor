// from elo-rank
// https://github.com/dmamills/elo-rank/blob/master/index.js

Elo = function(k) {

 if(!(this instanceof Elo))
   return new Elo(k);

  this.k = k || 32;
  return this;
}

Elo.prototype.setKFactor = function(n) {
  this.k = n;
}

Elo.prototype.getKFactor = function() {
  return this.k;
}

Elo.prototype.getExpected = function(a,b) {
  return 1/(1+Math.pow(10,((b-a)/400)));
}

Elo.prototype.updateRating = function(expected,actual,current) {
  return Math.round(current+ this.k*(actual-expected));
}
