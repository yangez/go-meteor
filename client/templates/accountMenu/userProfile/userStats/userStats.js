var completedGames, wonGames, lostGames, totalGames;
Template.userStats.onRendered(function(){
  wonGames = Games.find({winnerId : this._id}).count();
  lostGames = Games.find({loserId : this._id}).count();
  completedGames = wonGames + lostGames;
});


Template.userStats.helpers({
  totalGames : function(){
    var blackOrWhite = [{whitePlayerId : this._id}, {blackPlayerId : this._id }];
    totalGames = Games.find({ $or: blackOrWhite }).count();
    return totalGames || 0;
  },

  openGames : function(){
    var blackOrWhite = [{whitePlayerId : this._id}, {blackPlayerId : this._id }];
    return Games.find({
      $and : [{$or: blackOrWhite}, {archived : {$exists : false}}]
      }).count() || 0;
  },

  wonGames : function(){
    wonGames = Games.find({winnerId : this._id}).count();
    return wonGames || 0;
  },

  lostGames : function(){
    lostGames = Games.find({loserId : this._id}).count();
    return lostGames || 0;
  },

  completedGames : function(){
    completedGames = wonGames + lostGames;
    return completedGames || 0;
  },

  winPercentage : function(){
    if(!wonGames || lostGames === undefined) return 0;
    return (wonGames / (wonGames + lostGames) * 100).toFixed(2) || 0;
  },

  lossPercentage : function(){
    if(!lostGames || wonGames === undefined) return 0;
    return (lostGames / (wonGames + lostGames) * 100).toFixed(2) || 0;
  },

});
