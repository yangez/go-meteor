Template.userProfile.helpers({
  user : function(){
    return this;
  },

  games : function(){
    var user = this;
    var filteredGames = applyGameFilters(user);
    return filteredGames;
  },

  isUser : function(){
    return this._id === Meteor.userId();
  }
});


Template.userProfile.events({
  'click #profile-edit' : function(e){
    e.preventDefault();
    Router.go('editUserProfile', { username : Meteor.user().username });
  }
});

function findArchivedGames(user){
  return Games.find({ $and: [
        {archived: true},
        {$or: [ // player is in game
          {blackPlayerId: user._id},
          {whitePlayerId: user._id}
        ]}
      ] }, { sort: { lastActivityAt: -1 } });
}

function applyGameFilters(user){
  var filters = Session.get('gameFilters');

  if(isDefaultFilters(filters))
    return findArchivedGames(user);
  else{
    var currentUserId = user._id;
    var colorFilter, winLossFilter, sizeFilter, outcomeFilter, pendingFilter, userFilter;

    for(var key in filters){
      var filterVal = filters[key];
      if(key === 'color'){
        if(filterVal === 'black') {
          colorFilter = [{ blackPlayerId : currentUserId }];
        }
        else if(filterVal === 'white'){
          colorFilter = [{ whitePlayerId : currentUserId }];
        }
        else{
          colorFilter = [ { blackPlayerId : currentUserId }, { whitePlayerId : currentUserId }];
        }
      }
      else if(key === 'winLoss'){
        if(filterVal === 'win'){
          winLossFilter = [{ winnerId : currentUserId }];
        }
        else if(filterVal === 'loss'){
          winLossFilter = [{ loserId : currentUserId }];
        }
        else{
          winLossFilter = [{ winnerId : currentUserId }, {loserId : currentUserId}];
        }
      }
      else if(key === 'boardSize'){
        if(filterVal === '9'){
          sizeFilter = [{ size : '9' }]
        }
        else if(filterVal === '13'){
          sizeFilter = [{ size : '13' }]
        }
        else if(filterVal === '19'){
          sizeFilter = [{ size : '19' }]
        }
        else{
          sizeFilter = [{ size : '9' }, { size : '13' }, { size : '19' }]
        }
      }
      else if(key === 'pending'){
        pendingFilter = filterVal;
      }
      else if(key === 'user'){
        if(filterVal === ""){
          userFilter = [{}]
        }else{
          var filterUser = Meteor.users.findOne({username : filterVal});
          userFilter = [{ blackPlayerId : filterUser._id }, { whitePlayerId : filterUser._id }];
          console.log(userFilter);
        }
      }
      // else if(key === 'outcome'){
      //   if(filterVal === 'resign')
      //     outcomeFilter = { $or : [ {score : 'B+'}, { score : 'W+'}]}
      //   else if(filterVal === 'small'){
      //     outcomeFilter = { score : }
      //   }
      //   else if(filterVal === 'medium')
      //   else if(filterVal === 'big')
      //   else
      // }
    }
    return filterGames(colorFilter, winLossFilter, sizeFilter, pendingFilter, userFilter);

  }

  function filterGames(colorFilter, winLossFilter, sizeFilter, pendingFilter, userFilter){
    // pending filter can either be default:'archived', 'open', or 'all'
    if(pendingFilter === 'archived'){
      // run the default search command
      return Games.find(
          { $and:
            [
              {archived: true},
              {$or: colorFilter},
              {$or: winLossFilter},
              {$or : sizeFilter},
              {$or : userFilter}
            ]
          },
          { sort: { lastActivityAt: -1 } });
    }else if(pendingFilter === 'open'){
      return Games.find(
          { $and:
            [
              {archived: {$exists : false}},
              {$or: colorFilter},
              // {$or: winLossFilter},
              {$or : sizeFilter},
              {$or : userFilter}
            ]
          },
          { sort: { lastActivityAt: -1 } });
    }
  }

  function isDefaultFilters(filters){
    return JSON.stringify(filters) === JSON.stringify(defaultFilters)
  }

}
