var completedGames, wonGames, lostGames, totalGames;
Template.userStats.helpers({
  totalGames : function(){
    var blackOrWhite = [{whitePlayerId : this._id}, {blackPlayerId : this._id }];
    totalGames = Games.find({ $or: blackOrWhite }).count();
    return totalGames;
  },

  openGames : function(){
    var blackOrWhite = [{whitePlayerId : this._id}, {blackPlayerId : this._id }];
    return Games.find({
      $and : [{$or: blackOrWhite}, {archived : {$exists : false}}]
      }).count();
  },

  completedGames : function(){
    var blackOrWhite = [{whitePlayerId : this._id}, {blackPlayerId : this._id }];
    completedGames = Games.find({
      $and : [{$or: blackOrWhite}, {archived : true}]
      }).count();
    return completedGames;
  },

  wonGames : function(){
    wonGames = Games.find({winnerId : this._id}).count();
    return wonGames;
  },

  lostGames : function(){
    lostGames = Games.find({loserId : this._id}).count();
    return lostGames;
  },

  winPercentage : function(){
    return (wonGames / completedGames * 100).toFixed(2) || null;
  },

  lossPercentage : function(){
    return (lostGames / completedGames * 100).toFixed(2) || null;
  },

});
